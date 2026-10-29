"""Phase 12.13 — seed_data must not create predictable demo users in production.

The command provisions privileged accounts with hard-coded passwords and can
delete content with ``--force``; the guard blocks it unless the active settings
are explicitly development (``DEBUG=True``) or test (``TESTING=True``).
"""
import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings

from apps.users.models import User


@pytest.mark.django_db
def test_seed_data_blocked_when_not_debug_or_testing():
    with override_settings(DEBUG=False, TESTING=False):
        with pytest.raises(CommandError):
            call_command("seed_data")
    assert not User.objects.filter(email="admin@abrenv.com").exists()
    assert not User.objects.filter(email="content@abrenv.com").exists()


@pytest.mark.django_db
def test_seed_data_allowed_in_test_settings():
    # config.settings.test sets TESTING=True; the guard must not block tests.
    call_command("seed_data")
    assert User.objects.filter(email="admin@abrenv.com").exists()
