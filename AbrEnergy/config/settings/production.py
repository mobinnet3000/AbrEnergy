from .base import *

DEBUG = False

# Phase 12.13 — fail fast instead of silently running production with the
# insecure development default (base.py) if the environment forgets SECRET_KEY.
assert_production_secret(SECRET_KEY)

# Production Security
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Phase 12.26 — Production Cache: Redis shared across Gunicorn workers
# Ensures DRF rate throttling (AnonRateThrottle / UserRateThrottle) is synchronized
# centrally across all 4 Gunicorn worker processes.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}

# Sentry error reporting (optional in production, requires sentry-sdk)
SENTRY_DSN = config("SENTRY_DSN", default="")
try:
    import sentry_sdk
    if SENTRY_DSN:
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            traces_sample_rate=config("SENTRY_TRACES_SAMPLE_RATE", default=0.1, cast=float),
            environment=config("SENTRY_ENVIRONMENT", default="production"),
        )
except ImportError:
    pass
