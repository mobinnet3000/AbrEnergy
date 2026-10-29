from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """
    Throttles sensitive public auth endpoints (login, register, password reset).
    Prevents credential stuffing, automated account enumeration, and brute-force.
    """
    scope = "auth_anon"
    rate = "10/minute"


class AuthUserRateThrottle(UserRateThrottle):
    scope = "auth_user"
    rate = "30/minute"


class InquiryRateThrottle(AnonRateThrottle):
    """
    Throttles public contact and project inquiry submissions.
    Prevents form spam, bot floods, and notification overload.
    """
    scope = "inquiry_anon"
    rate = "5/minute"
