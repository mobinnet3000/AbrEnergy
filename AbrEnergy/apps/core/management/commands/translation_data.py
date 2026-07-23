"""
Seed data with multilingual translations.
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.users.models import User
from apps.users.choices import UserRole
from apps.articles.models import Article, Category, Tag
from apps.articles.translation_models import ArticleTranslation
from apps.services.models import Service, ServiceCategory
from apps.services.translation_models import ServiceTranslation
from apps.projects.models import Project
from apps.projects.translation_models import ProjectTranslation


TRANSLATIONS = {
    "articles": [
        {
            "fa": {"title": "مزایای انرژی خورشیدی", "slug": "mazaya-energy-khorshidi", "short_description": "انرژی خورشیدی یکی از پاک‌ترین و در دسترس‌ترین منابع انرژی است", "content": "<p>انرژی خورشیدی یک منبع پاک و تجدیدپذیر است...</p>"},
            "ar": {"title": "فوائد الطاقة الشمسية", "slug": "fawaid-altaqa-alshamsia", "short_description": "الطاقة الشمسية هي واحدة من أنظف مصادر الطاقة", "content": "<p>الطاقة الشمسية هي مصدر نظيف ومتجدد...</p>"},
            "en": {"title": "Benefits of Solar Energy", "slug": "benefits-of-solar-energy", "short_description": "Solar energy is one of the cleanest and most accessible energy sources", "content": "<p>Solar energy is a clean, renewable source...</p>"},
        },
        {
            "fa": {"title": "راهنمای انتخاب پنل خورشیدی", "slug": "rahnamaye-entekhab-panel", "short_description": "راهنمای جامع انتخاب پنل خورشیدی مناسب"},
            "ar": {"title": "دليل اختيار الألواح الشمسية", "slug": "dalil-ikhtiar-alwah", "short_description": "دليل شامل لاختيار الألواح الشمسية المناسبة"},
            "en": {"title": "How to Choose Solar Panels", "slug": "how-to-choose-solar-panels", "short_description": "A comprehensive guide to choosing the right solar panels"},
        },
    ],
    "services": [
        {
            "fa": {"title": "نیروگاه متصل به شبکه", "slug": "on-grid", "short_description": "طراحی و اجرای نیروگاه‌های متصل به شبکه"},
            "en": {"title": "On Grid System", "slug": "on-grid-system", "short_description": "Grid-tied solar system design and installation"},
        },
    ],
    "projects": [
        {
            "fa": {"title": "نیروگاه ۱۰ کیلووات تهران", "slug": "10kw-tehran", "description": "اجرای نیروگاه خورشیدی ۱۰ کیلووات در تهران"},
            "en": {"title": "10kW Solar Plant - Tehran", "slug": "10kw-solar-plant-tehran", "description": "10kW solar power plant installation in Tehran"},
        },
    ],
}
