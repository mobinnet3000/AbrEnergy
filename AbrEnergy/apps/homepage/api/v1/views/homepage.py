from rest_framework import generics, permissions

from apps.homepage.api.v1.serializers.homepage import (
    HomepageAdminSerializer,
    HomepageWriteSerializer,
    build_homepage_payload,
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
