from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils.text import slugify
from apps.articles.models import Article, Category, Tag


def unique_slug(instance, title, slug_field="slug"):
    slug = slugify(title, allow_unicode=True)
    original_slug = slug
    counter = 1
    while instance.__class__.objects.filter(**{slug_field: slug}).exists():
        slug = f"{original_slug}-{counter}"
        counter += 1
    return slug


@receiver(pre_save, sender=Category)
def category_pre_save(sender, instance, **kwargs):
    if not instance.slug:
        instance.slug = unique_slug(instance, instance.title)


@receiver(pre_save, sender=Tag)
def tag_pre_save(sender, instance, **kwargs):
    if not instance.slug:
        instance.slug = unique_slug(instance, instance.title)
