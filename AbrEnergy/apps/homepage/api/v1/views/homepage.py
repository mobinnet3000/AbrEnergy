from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.homepage.api.v1.serializers.homepage import (
    HomepageAdminSerializer,
    HomepageWriteSerializer,
    build_homepage_payload,
)
from apps.homepage.preview_tokens import (
    PREVIEW_LOCALES,
    PREVIEW_MAX_AGE_SECONDS,
    PREVIEW_RESOURCE_TYPES,
    PreviewTokenError,
    issue_preview_token,
    verify_preview_token,
)
from apps.homepage.services import ensure_default_sections, get_homepage_config
from apps.users.api.v1.permissions import IsContentManager


def _lang(request):
    return request.query_params.get("lang", request.META.get("HTTP_ACCEPT_LANGUAGE", "fa"))


class HomepagePublicView(generics.GenericAPIView):
    """Phase 7 — public homepage payload (``GET /api/v1/homepage/``).

    ``AllowAny``. Returns the composed, fully public-filtered homepage; the
    shape is documented in ``build_homepage_payload``. Never 500s on an
    empty database (bootstrap is idempotent, relations may be empty).
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        return self._response(_lang(request))

    def _response(self, language):
        from rest_framework.response import Response

        return Response(build_homepage_payload(language))


class HomepageAdminView(generics.RetrieveUpdateAPIView):
    """Phase 7 — Homepage Studio API (``GET/PUT/PATCH /api/v1/admin/homepage/``).

    ``IsContentManager`` (super_admin / website_admin / content_manager) for
    both read and write — the same gate as the product/category admin APIs.
    Viewer roles have no write path; unauthenticated requests 401/403 via
    the default authentication stack.
    """

    permission_classes = [IsContentManager]

    def get_object(self):
        ensure_default_sections()
        return get_homepage_config()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return HomepageWriteSerializer
        return HomepageAdminSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["language"] = _lang(self.request)
        return ctx


def _preview_no_store(response):
    response["Cache-Control"] = "no-store"
    return response


class PreviewTokenIssueView(APIView):
    """Phase 8.1 — issue a short-lived signed preview token.

    ``POST /api/v1/admin/homepage/preview-tokens/``
    Auth: ``IsContentManager`` (401 anonymous / 403 customer+engineer).
    Body: ``{"resource_type": "homepage|product|category",
    "resource_id": "<uuid, optional for homepage>", "locale": "fa"}``.
    The token itself carries no content — only a signed reference.
    """

    permission_classes = [IsContentManager]

    def post(self, request, *args, **kwargs):
        resource_type = (request.data.get("resource_type") or "").strip().lower()
        resource_id = str(request.data.get("resource_id") or "").strip()
        locale = (request.data.get("locale") or "fa").strip().lower() or "fa"
        if resource_type not in PREVIEW_RESOURCE_TYPES:
            return Response(
                {"detail": "Unknown resource_type."}, status=status.HTTP_400_BAD_REQUEST
            )
        if locale not in PREVIEW_LOCALES:
            return Response(
                {"detail": "Unknown locale."}, status=status.HTTP_400_BAD_REQUEST
            )
        if resource_type in ("product", "category") and not resource_id:
            return Response(
                {"detail": "resource_id is required for this resource_type."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = issue_preview_token(
                resource_type=resource_type, resource_id=resource_id, locale=locale
            )
        except PreviewTokenError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "token": token,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "locale": locale,
                "expires_in": PREVIEW_MAX_AGE_SECONDS,
            }
        )


class HomepagePreviewView(generics.GenericAPIView):
    """Phase 8.1 — token-gated homepage preview.

    ``GET /api/v1/admin/homepage/preview/?token=...``.
    ``AllowAny`` at the DRF layer because the signed token itself is the
    credential (short-lived, purpose/resource/locale-bound). The normal
    public view (``HomepagePublicView``) is untouched and never reads a
    token. Response is ``no-store``.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        token = request.query_params.get("token", "")
        try:
            payload = verify_preview_token(token, expected_type="homepage")
        except PreviewTokenError:
            return Response(
                {"detail": "Invalid or expired preview token."},
                status=status.HTTP_403_FORBIDDEN,
            )
        language = payload.get("loc") or _lang(request)
        data = build_homepage_payload(language, preview=True)
        return _preview_no_store(Response(data))
