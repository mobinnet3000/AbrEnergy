from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AuthAnonRateThrottle(AnonRateThrottle):
    """
    Limits unauthenticated attempts to auth endpoints (login, register, password reset)
    to protect against credential stuffing, brute force, and account enumeration.
    Configured via REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']['auth_anon'] = '10/minute'.
    Gracefully disables when rate is unconfigured (e.g. in test suite).
    """
    scope = "auth_anon"

    def get_rate(self):
        try:
            return super().get_rate()
        except Exception:
            return None


class AuthUserRateThrottle(UserRateThrottle):
    """
    Limits authenticated user attempts to sensitive auth actions.
    Configured via REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']['auth_user'] = '30/minute'.
    """
    scope = "auth_user"

    def get_rate(self):
        try:
            return super().get_rate()
        except Exception:
            return None


class InquiryAnonRateThrottle(AnonRateThrottle):
    """
    Limits unauthenticated public submissions to contact requests and project inquiries
    to prevent spam flooding and resource exhaustion.
    Configured via REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']['inquiry_anon'] = '5/minute'.
    """
    scope = "inquiry_anon"

    def get_rate(self):
        try:
            return super().get_rate()
        except Exception:
            return None
