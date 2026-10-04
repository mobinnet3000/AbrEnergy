"""Phase 8.1 — preview token issue/verify helpers.

Smallest safe architecture: preview shows *already-saved* content that is
normally hidden by public filters (option B). There is no draft
persistence, no versioning, no staging table, and no new cryptography:
tokens are ``django.core.signing`` timestamped signatures (``SECRET_KEY``-
backed, tamper-resistant) with a short expiry, bound to
(resource type, resource id, locale, purpose).

Token payload (never holds content, only references)::

    {"typ": "homepage|product|category", "id": "<uuid or ''>",
     "loc": "fa|ar|en", "pur": "preview"}

The normal public endpoints never read this token; only the explicit
preview views do.
"""

from django.core import signing

PREVIEW_SALT = "abrenergy-preview-v1"
PREVIEW_PURPOSE = "preview"
PREVIEW_MAX_AGE_SECONDS = 600  # 10 minutes

PREVIEW_RESOURCE_TYPES = frozenset({"homepage", "product", "category"})
PREVIEW_LOCALES = frozenset({"fa", "ar", "en"})


class PreviewTokenError(Exception):
    """Raised when a preview token is missing, expired, or tampered."""


def issue_preview_token(*, resource_type, resource_id="", locale="fa"):
    """Sign a short-lived preview token for an authorized caller.

    Callers MUST enforce ``IsContentManager`` before calling this.
    """
    if resource_type not in PREVIEW_RESOURCE_TYPES:
        raise PreviewTokenError("Unknown resource type.")
    locale = (locale or "fa").lower()
    if locale not in PREVIEW_LOCALES:
        raise PreviewTokenError("Unknown locale.")
    payload = {
        "typ": resource_type,
        "id": str(resource_id or ""),
        "loc": locale,
        "pur": PREVIEW_PURPOSE,
    }
    return signing.dumps(payload, salt=PREVIEW_SALT)


def verify_preview_token(
    token,
    *,
    expected_type=None,
    expected_id=None,
    expected_locale=None,
    max_age=PREVIEW_MAX_AGE_SECONDS,
):
    """Verify a preview token and return its payload dict.

    Raises ``PreviewTokenError`` on expiry/tampering/binding mismatch.
    Binding checks are exact: a token for another resource, id, locale,
    or purpose is rejected. No information about hidden objects leaks
    through the error message.
    """
    if not token or not isinstance(token, str):
        raise PreviewTokenError("Missing preview token.")
    try:
        payload = signing.loads(token, salt=PREVIEW_SALT, max_age=max_age)
    except signing.SignatureExpired as exc:
        raise PreviewTokenError("Preview token has expired.") from exc
    except signing.BadSignature as exc:
        raise PreviewTokenError("Invalid preview token.") from exc
    if not isinstance(payload, dict) or payload.get("pur") != PREVIEW_PURPOSE:
        raise PreviewTokenError("Invalid preview token.")
    if payload.get("typ") not in PREVIEW_RESOURCE_TYPES:
        raise PreviewTokenError("Invalid preview token.")
    if payload.get("loc") not in PREVIEW_LOCALES:
        raise PreviewTokenError("Invalid preview token.")
    if expected_type is not None and payload.get("typ") != expected_type:
        raise PreviewTokenError("Invalid preview token.")
    if expected_id is not None and str(payload.get("id") or "") != str(expected_id or ""):
        raise PreviewTokenError("Invalid preview token.")
    if expected_locale is not None and str(payload.get("loc") or "") != str(expected_locale or ""):
        raise PreviewTokenError("Invalid preview token.")
    return payload
