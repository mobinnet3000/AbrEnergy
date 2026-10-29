"""Phase 12.14 — reverse-proxy-aware anonymous throttle keying."""
from django.conf import settings
from rest_framework.throttling import AnonRateThrottle


class _Req:
    def __init__(self, meta):
        self.META = meta


class _AnonThrottle(AnonRateThrottle):
    # The test settings blank DEFAULT_THROTTLE_RATES; give the instance an
    # explicit rate so __init__ does not need the settings lookup. `get_ident`
    # only depends on NUM_PROXIES and the request.
    rate = "100/hour"


def test_num_proxies_configured():
    assert settings.REST_FRAMEWORK["NUM_PROXIES"] == 1


def test_throttle_ident_uses_rightmost_hop_and_ignores_client_spoof():
    throttle = _AnonThrottle()
    req = _Req({"HTTP_X_FORWARDED_FOR": "1.2.3.4, 203.0.113.9", "REMOTE_ADDR": "10.0.0.5"})
    assert throttle.get_ident(req) == "203.0.113.9"


def test_throttle_ident_falls_back_to_remote_addr_without_forwarded_header():
    throttle = _AnonThrottle()
    req = _Req({"REMOTE_ADDR": "10.0.0.5"})
    assert throttle.get_ident(req) == "10.0.0.5"
