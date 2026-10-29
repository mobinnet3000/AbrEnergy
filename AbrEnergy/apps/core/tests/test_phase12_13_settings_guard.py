"""Phase 12.13 — production must not silently use the insecure dev SECRET_KEY."""
import pytest
from django.core.exceptions import ImproperlyConfigured

from config.settings.base import DEFAULT_INSECURE_SECRET, assert_production_secret


def test_missing_or_default_secret_is_rejected():
    with pytest.raises(ImproperlyConfigured):
        assert_production_secret(DEFAULT_INSECURE_SECRET)
    with pytest.raises(ImproperlyConfigured):
        assert_production_secret("")


def test_strong_secret_is_accepted():
    assert assert_production_secret("a-strong-unique-secret-value-0123456789") is None
