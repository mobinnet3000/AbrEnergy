from django.http import Http404
from rest_framework.generics import get_object_or_404


class TranslatedSlugDetailMixin:
    def get_object(self):
        if "pk" in self.kwargs:
            # Admin routes address objects by UUID primary key while the
            # public routes use translated slugs (``lookup_field = "slug"``).
            # Resolving the pk branch through the default ``get_object()``
            # would assert on the missing "slug" kwarg, so filter by pk
            # explicitly — same permission enforcement as the slug branch.
            queryset = self.filter_queryset(self.get_queryset())
            obj = get_object_or_404(queryset, pk=self.kwargs["pk"])
            self.check_object_permissions(self.request, obj)
            return obj
        if "slug" in self.kwargs:
            queryset = self.filter_queryset(self.get_queryset())
            obj = queryset.filter(
                translations__slug=self.kwargs["slug"]
            ).distinct().first()
            if obj is None:
                raise Http404
            self.check_object_permissions(self.request, obj)
            return obj
        return super().get_object()
