from apps.core.models import SiteSettings, ActivityLog


def get_site_settings():
    return SiteSettings.load()


def log_activity(
    user, action, model_name, object_id="",
    object_repr="", changes=None, ip_address=None, user_agent="",
):
    if changes is None:
        changes = {}
    return ActivityLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=str(object_id),
        object_repr=object_repr,
        changes=changes,
        ip_address=ip_address,
        user_agent=user_agent,
    )
