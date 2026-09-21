from django.http import Http404


class TranslatedSlugDetailMixin:
    def get_object(self):
        if "pk" in self.kwargs:
            return super().get_object()
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
