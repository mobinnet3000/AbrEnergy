from apps.core.services import log_activity


class ActivityLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if (
            request.user
            and request.user.is_authenticated
            and hasattr(request, "_activity_log")
        ):
            log_data = request._activity_log
            ip = self._get_ip(request)
            ua = request.META.get("HTTP_USER_AGENT", "")[:500]
            log_activity(
                user=request.user,
                action=log_data.get("action", "update"),
                model_name=log_data.get("model_name", "Unknown"),
                object_id=log_data.get("object_id", ""),
                object_repr=log_data.get("object_repr", ""),
                changes=log_data.get("changes", {}),
                ip_address=ip,
                user_agent=ua,
            )
        return response

    @staticmethod
    def _get_ip(request):
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        if xff:
            return xff.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
