from apps.homepage.models import DEFAULT_SECTIONS, HomepageConfig, HomepageSection


def get_homepage_config():
    return HomepageConfig.load()


def ensure_default_sections():
    """Idempotent bootstrap: create missing section rows with the shipped
    Persian defaults. Never updates existing rows, never deletes."""
    existing = set(HomepageSection.objects.values_list("key", flat=True))
    missing = [row for row in DEFAULT_SECTIONS if row[0] not in existing]
    for key, order, title, subtitle, content in missing:
        HomepageSection.objects.create(
            key=key, order=order, title=title, subtitle=subtitle, content=content,
        )
    return len(missing)
