from .base import *

DEBUG = True
TESTING = False

# Local dev uses base DATABASES (env-driven). Set DB_ENGINE=sqlite
# for explicit SQLite fallback, otherwise PostgreSQL via DB_* vars.

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
