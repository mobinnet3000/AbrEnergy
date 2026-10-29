from rest_framework import serializers
from apps.core.models import SeoKeyword


class SeoKeywordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeoKeyword
        fields = [
            "id",
            "keyword",
            "locale",
            "target_country",
            "target_page",
            "search_intent",
            "priority",
            "current_rank",
            "best_rank",
            "clicks",
            "impressions",
            "ctr",
            "average_position",
            "last_measured_at",
            "rank_history",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_keyword(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Keyword cannot be blank.")
        return val

    def validate_target_page(self, value):
        val = value.strip()
        if not val.startswith("/"):
            val = "/" + val
        return val
