"""Phase 12.15 tests: container readiness probe.

The probe must be reachable without authentication (container healthchecks
carry no credentials), must not leak configuration/version details, and must
report 503 rather than a false "ok" when the database is unreachable.
"""

from unittest import mock

import pytest
from django.db import OperationalError
from django.test import TestCase
from rest_framework.test import APIClient


HEALTH = "/api/v1/health/"


@pytest.mark.django_db
class HealthEndpointTest(TestCase):
    def test_anonymous_can_probe(self):
        res = APIClient().get(HEALTH)
        assert res.status_code == 200, res.content[:500]
        assert res.json() == {"status": "ok"}

    def test_response_exposes_no_environment_details(self):
        body = APIClient().get(HEALTH).content.decode()
        for leaked in ("SECRET", "postgres", "localhost", "version", "Django"):
            assert leaked not in body, leaked

    def test_returns_503_when_database_unreachable(self):
        with mock.patch(
            "django.db.connection.ensure_connection",
            side_effect=OperationalError("boom"),
        ):
            res = APIClient().get(HEALTH)
        assert res.status_code == 503
        assert res.json() == {"status": "unavailable"}

    def test_probe_is_not_subject_to_anonymous_throttling(self):
        # The route declares `throttle_classes([])`; repeated polling from a
        # single container IP must never be rate-limited.
        client = APIClient()
        for _ in range(5):
            assert client.get(HEALTH).status_code == 200
