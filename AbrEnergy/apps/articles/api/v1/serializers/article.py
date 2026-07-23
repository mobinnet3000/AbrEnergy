from rest_framework import serializers
from apps.articles.models import Article, Category, Tag, ArticleImage
from apps.media_manager.api.v1.serializers.media import MediaFileListSerializer


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "title", "slug"]


class CategoryTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "title", "slug", "description", "image", "parent", "children", "is_active"]

    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return CategoryTreeSerializer(children, many=True).data if children else []


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id", "title", "slug", "parent", "description", "image",
            "meta_title", "meta_description", "is_active", "created_at",
        ]


class ArticleImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleImage
        fields = ["id", "media_file", "alt_text", "order"]


class ArticleListSerializer(serializers.ModelSerializer):
    category_title = serializers.CharField(source="category.title", read_only=True, default="")
    author_name = serializers.CharField(source="author.full_name", read_only=True, default="")
    tags = TagSerializer(many=True, read_only=True)
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            "id", "title", "slug", "short_description", "cover_image_url",
            "category", "category_title", "author_name", "tags",
            "status", "publish_date", "view_count", "is_featured",
            "created_at", "updated_at",
        ]

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            try:
                return obj.cover_image.file.url
            except Exception:
                pass
        return ""


class ArticleDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    author_name = serializers.CharField(source="author.full_name", read_only=True, default="")
    tags = TagSerializer(many=True, read_only=True)
    images = ArticleImageSerializer(many=True, read_only=True)
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            "id", "title", "slug", "short_description", "content",
            "cover_image", "cover_image_url", "category",
            "author_name", "tags", "images",
            "status", "publish_date", "view_count", "is_featured",
            "meta_title", "meta_description", "keywords",
            "created_at", "updated_at",
        ]

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            try:
                return obj.cover_image.file.url
            except Exception:
                pass
        return ""


class ArticleWriteSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)

    class Meta:
        model = Article
        fields = [
            "title", "short_description", "content", "cover_image",
            "category", "tags", "status", "publish_date", "is_featured",
            "meta_title", "meta_description", "keywords",
        ]

    def create(self, validated_data):
        tag_names = validated_data.pop("tags", [])
        article = Article.objects.create(**validated_data)
        for tag_name in tag_names:
            tag, _ = Tag.objects.get_or_create(title=tag_name)
            article.tags.add(tag)
        return article

    def update(self, instance, validated_data):
        tag_names = validated_data.pop("tags", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tag_names is not None:
            instance.tags.clear()
            for tag_name in tag_names:
                tag, _ = Tag.objects.get_or_create(title=tag_name)
                instance.tags.add(tag)
        return instance
