from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework import serializers

from apps.products.models import (
    Product,
    ProductAttributeDefinition,
    ProductAttributeValue,
    ProductCategory,
    ProductDocument,
    ProductImage,
    ProductPrice,
    ProductSpecification,
    RelatedProduct,
)
from apps.products.translation_models import ProductCategoryTranslation, ProductTranslation


def _lang(context):
    return (context or {}).get("language", "fa")


class CategoryTreeSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    slug_t = serializers.SerializerMethodField(read_only=True)
    children = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = ["id", "title", "slug", "slug_t", "parent", "children", "sort_order", "is_active", "is_featured"]

    def get_title(self, obj):
        t = obj.get_translation(_lang(self.context)) or obj.get_translation("fa")
        return t.title if t else obj.slug

    def get_slug_t(self, obj):
        t = obj.get_translation(_lang(self.context)) or obj.get_translation("fa")
        return t.slug if t and t.slug else obj.slug

    def get_children(self, obj):
        children = [c for c in obj.children.all() if c.is_active] if hasattr(obj, "_prefetched_objects_cache") else obj.children.filter(is_active=True)
        return CategoryTreeSerializer(children, many=True, context=self.context).data if children else []


class CategorySerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    slug_t = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()
    meta_title = serializers.SerializerMethodField()
    meta_description = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = [
            "id", "title", "slug", "slug_t", "parent", "description", "content",
            "meta_title", "meta_description",
            "cover", "cover_image_url", "og_image", "og_image_url",
            "sort_order", "is_active", "is_featured",
            "seo_title", "seo_description", "canonical_url", "robots",
            "og_title", "og_description",
            "created_at", "updated_at",
        ]

    def _t(self, obj):
        return obj.get_translation(_lang(self.context)) or obj.get_translation("fa")

    def get_title(self, obj):
        t = self._t(obj)
        return t.title if t else obj.slug

    def get_slug_t(self, obj):
        t = self._t(obj)
        return t.slug if t and t.slug else obj.slug

    def get_description(self, obj):
        t = self._t(obj)
        return t.description if t else ""

    def get_content(self, obj):
        t = self._t(obj)
        return t.content if t else ""

    def get_meta_title(self, obj):
        t = self._t(obj)
        return (t.meta_title if t and t.meta_title else obj.seo_title) or ""

    def get_meta_description(self, obj):
        t = self._t(obj)
        return (t.meta_description if t and t.meta_description else obj.seo_description) or ""

    def get_cover_image_url(self, obj):
        try:
            return obj.cover.file.url if obj.cover_id else ""
        except Exception:
            return ""

    def get_og_image_url(self, obj):
        try:
            return obj.og_image.file.url if obj.og_image_id else ""
        except Exception:
            return ""


class ImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "url", "media_file", "is_cover", "sort_order", "alt_text", "caption"]

    def get_url(self, obj):
        try:
            return obj.media_file.file.url if obj.media_file_id else ""
        except Exception:
            return ""


class DocumentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductDocument
        fields = ["id", "url", "media_file", "title", "doc_type", "sort_order", "is_active", "description"]

    def get_url(self, obj):
        try:
            return obj.media_file.file.url if obj.media_file_id else ""
        except Exception:
            return ""


class SpecSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSpecification
        fields = ["id", "section", "label", "value", "unit", "sort_order"]


class AttributeValueSerializer(serializers.ModelSerializer):
    code = serializers.CharField(source="definition.code", read_only=True)
    name = serializers.CharField(source="definition.name", read_only=True)
    data_type = serializers.CharField(source="definition.data_type", read_only=True)
    unit = serializers.CharField(source="definition.unit", read_only=True)
    display = serializers.SerializerMethodField()

    class Meta:
        model = ProductAttributeValue
        fields = ["id", "code", "name", "data_type", "unit", "value_text", "value_number", "value_boolean", "display"]

    def get_display(self, obj):
        try:
            return obj.display
        except Exception:
            return obj.value_text


class ProductListSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    slug = serializers.SerializerMethodField()
    short_description = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "title", "slug", "short_description", "sku", "category", "cover_image_url", "status", "visibility", "is_active", "is_featured", "sort_order", "price", "created_at", "updated_at", "published_at"]

    def _t(self, obj):
        lang = _lang(self.context)
        return obj.get_translation(lang) or obj.get_translation("fa")

    def get_title(self, obj):
        t = self._t(obj)
        return t.title if t else obj.sku

    def get_slug(self, obj):
        t = self._t(obj)
        return t.slug if t and t.slug else obj.sku

    def get_short_description(self, obj):
        t = self._t(obj)
        return t.short_description if t else ""

    def get_cover_image_url(self, obj):
        images = list(obj.images.all()) if hasattr(obj, "_prefetched_objects_cache") else list(obj.images.select_related("media_file"))
        cover = next((i for i in images if i.is_cover and i.media_file_id), None)
        first = cover or (images[0] if images else None)
        if first is not None:
            try:
                return first.media_file.file.url
            except Exception:
                pass
        return ""

    def get_price(self, obj):
        price = getattr(obj, "price", None)
        if price is None:
            try:
                price = obj.price
            except Exception:
                return {"state": "contact_for_price", "currency": "IRR"}
        return price.get_effective()


class ProductDetailSerializer(ProductListSerializer):
    description = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()
    images = ImageSerializer(many=True, read_only=True)
    documents = serializers.SerializerMethodField()
    specifications = SpecSerializer(many=True, read_only=True)
    attribute_values = AttributeValueSerializer(many=True, read_only=True)
    related = serializers.SerializerMethodField()
    meta_title = serializers.SerializerMethodField()
    meta_description = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            "description", "features", "images", "documents", "specifications",
            "attribute_values", "related", "price",
            "seo_title", "seo_description", "canonical_url", "robots",
            "og_title", "og_description", "og_image", "og_image_url",
            "meta_title", "meta_description",
            "updated_at",
        ]

    def get_description(self, obj):
        t = self._t(obj)
        return t.description if t else ""

    def get_features(self, obj):
        t = self._t(obj)
        return t.features if t else ""

    def get_documents(self, obj):
        docs = [d for d in obj.documents.all() if d.is_active] if hasattr(obj, "_prefetched_objects_cache") else obj.documents.filter(is_active=True)
        return DocumentSerializer(docs, many=True).data

    def get_related(self, obj):
        rels = [r for r in obj.related_from.all() if r.is_active] if hasattr(obj, "_prefetched_objects_cache") else obj.related_from.filter(is_active=True)
        out = []
        for r in rels:
            target = r.to_product
            t = target.get_translation(_lang(self.context)) or target.get_translation("fa")
            # Phase 5.1: expose the translated slug so the public catalog can
            # link related products without extra requests. Additive only.
            out.append({"id": str(target.id), "slug": t.slug if t and t.slug else target.sku, "title": t.title if t else target.sku, "relation_type": r.relation_type})
        return out

    def get_meta_title(self, obj):
        t = self._t(obj)
        return (t.meta_title if t and t.meta_title else obj.seo_title) or ""

    def get_meta_description(self, obj):
        t = self._t(obj)
        return (t.meta_description if t and t.meta_description else obj.seo_description) or ""

    def get_og_image_url(self, obj):
        # Phase 5.2: mirror CategorySerializer — expose the configured OG
        # image URL when set, else "" (frontend falls back to cover/first).
        try:
            return obj.og_image.file.url if obj.og_image_id else ""
        except Exception:
            return ""

    def get_price(self, obj):
        return ProductListSerializer.get_price(self, obj)


class AdminProductDetailSerializer(ProductDetailSerializer):
    """Admin-only detail: adds raw pricing inputs so the CMS can round-trip
    the price form exactly. Public detail keeps effective-only exposure."""

    price_display_mode = serializers.SerializerMethodField()
    price_is_active = serializers.SerializerMethodField()
    price_regular = serializers.SerializerMethodField()
    price_sale = serializers.SerializerMethodField()
    price_discount_type = serializers.SerializerMethodField()
    price_discount_value = serializers.SerializerMethodField()
    price_starts_at = serializers.SerializerMethodField()
    price_ends_at = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()
    relations_admin = serializers.SerializerMethodField()

    class Meta(ProductDetailSerializer.Meta):
        fields = ProductDetailSerializer.Meta.fields + [
            "price_display_mode", "price_is_active", "price_regular", "price_sale",
            "price_discount_type", "price_discount_value", "price_starts_at", "price_ends_at",
            "og_image_url", "relations_admin",
        ]

    def _price(self, obj):
        try:
            return obj.price
        except Exception:
            return None

    def get_price_display_mode(self, obj):
        p = self._price(obj)
        return p.display_mode if p else "contact"

    def get_price_is_active(self, obj):
        p = self._price(obj)
        return p.is_active if p else True

    def get_price_regular(self, obj):
        p = self._price(obj)
        return p.regular_price if p else None

    def get_price_sale(self, obj):
        p = self._price(obj)
        return p.sale_price if p else None

    def get_price_discount_type(self, obj):
        p = self._price(obj)
        return p.discount_type if p else "none"

    def get_price_discount_value(self, obj):
        p = self._price(obj)
        return p.discount_value if p else "0"

    def get_price_starts_at(self, obj):
        p = self._price(obj)
        return p.starts_at if p else None

    def get_price_ends_at(self, obj):
        p = self._price(obj)
        return p.ends_at if p else None

    def get_og_image_url(self, obj):
        try:
            return obj.og_image.file.url if obj.og_image_id else ""
        except Exception:
            return ""

    def get_relations_admin(self, obj):
        rels = obj.related_from.all() if hasattr(obj, "_prefetched_objects_cache") else obj.related_from.select_related("to_product")
        out = []
        for r in rels.order_by("sort_order", "id"):
            t = r.to_product.get_translation(_lang(self.context)) or r.to_product.get_translation("fa")
            out.append({
                "id": str(r.id),
                "to_product": str(r.to_product_id),
                "title": t.title if t else r.to_product.sku,
                "relation_type": r.relation_type,
                "sort_order": r.sort_order,
                "is_active": r.is_active,
            })
        return out


class ProductWriteSerializer(serializers.ModelSerializer):
    translations = serializers.DictField(child=serializers.DictField(), required=False, write_only=True)
    price_data = serializers.DictField(required=False, write_only=True)
    images_data = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    documents_data = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    specs_data = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    attributes_data = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    relations_data = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)

    class Meta:
        model = Product
        fields = [
            "translations", "category", "sku", "status", "visibility",
            "is_featured", "is_active", "sort_order",
            "seo_title", "seo_description", "canonical_url", "robots",
            "og_title", "og_description", "og_image",
            "price_data", "images_data", "documents_data", "specs_data",
            "attributes_data", "relations_data",
        ]

    _NESTED_KEYS = ("price_data", "images_data", "documents_data", "specs_data", "attributes_data", "relations_data")

    # JSON payloads carry FK targets as UUID strings (e.g. "media_file": "<uuid>").
    # Model constructors require "<field>_id" for raw ids — normalize so nested
    # writes accept the API-friendly shape instead of raising ValueError (500).
    _FK_ID_MAP = {"media_file": "media_file_id", "definition": "definition_id", "to_product": "to_product_id"}

    @classmethod
    def _normalize_fk(cls, item):
        item = dict(item)
        for key, id_key in cls._FK_ID_MAP.items():
            if key in item and id_key not in item:
                item[id_key] = item.pop(key)
        return item

    @staticmethod
    def _save_row(obj, key):
        """Run model validation, surfacing failures as DRF 400s (not 500s)."""
        try:
            obj.full_clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError({key: exc.messages})
        try:
            obj.save()
        except IntegrityError as exc:
            raise serializers.ValidationError({key: [str(exc)]})
        return obj

    def _save_nested(self, product, validated):
        price_data = validated.get("price_data")
        if price_data is not None:
            price, _ = ProductPrice.objects.get_or_create(product=product)
            for k, v in price_data.items():
                setattr(price, k, v)
            self._save_row(price, "price_data")
        for img in validated.get("images_data", []):
            self._save_row(ProductImage(product=product, **self._normalize_fk(img)), "images_data")
        for doc in validated.get("documents_data", []):
            self._save_row(ProductDocument(product=product, **self._normalize_fk(doc)), "documents_data")
        for spec in validated.get("specs_data", []):
            self._save_row(ProductSpecification(product=product, **spec), "specs_data")
        for attr in validated.get("attributes_data", []):
            self._save_row(ProductAttributeValue(product=product, **self._normalize_fk(attr)), "attributes_data")
        for rel in validated.get("relations_data", []):
            self._save_row(RelatedProduct(from_product=product, **self._normalize_fk(rel)), "relations_data")

    def create(self, validated_data):
        translations = validated_data.pop("translations", {})
        nested = {k: validated_data.pop(k, None) for k in self._NESTED_KEYS}
        nested = {k: v for k, v in nested.items() if v is not None}
        product = Product.objects.create(**validated_data)
        for lang_code, fields in translations.items():
            ProductTranslation.objects.create(product=product, language=lang_code, **fields)
        self._save_nested(product, nested)
        return product

    def update(self, instance, validated_data):
        translations = validated_data.pop("translations", {})
        nested = {k: validated_data.pop(k, None) for k in self._NESTED_KEYS}
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        for lang_code, fields in translations.items():
            ProductTranslation.objects.update_or_create(product=instance, language=lang_code, defaults=fields)
        for k, v in nested.items():
            if v is None:
                continue
            if k == "price_data":
                price, _ = ProductPrice.objects.get_or_create(product=instance)
                for fk, fv in v.items():
                    setattr(price, fk, fv)
                self._save_row(price, "price_data")
            elif k == "images_data":
                instance.images.all().delete()
                for img in v:
                    self._save_row(ProductImage(product=instance, **self._normalize_fk(img)), "images_data")
            elif k == "documents_data":
                instance.documents.all().delete()
                for doc in v:
                    self._save_row(ProductDocument(product=instance, **self._normalize_fk(doc)), "documents_data")
            elif k == "specs_data":
                instance.specifications.all().delete()
                for spec in v:
                    self._save_row(ProductSpecification(product=instance, **spec), "specs_data")
            elif k == "attributes_data":
                instance.attribute_values.all().delete()
                for attr in v:
                    self._save_row(ProductAttributeValue(product=instance, **self._normalize_fk(attr)), "attributes_data")
            elif k == "relations_data":
                instance.related_from.all().delete()
                for rel in v:
                    self._save_row(RelatedProduct(from_product=instance, **self._normalize_fk(rel)), "relations_data")
        return instance


class CategoryWriteSerializer(serializers.ModelSerializer):
    translations = serializers.DictField(child=serializers.DictField(), required=False, write_only=True)

    class Meta:
        model = ProductCategory
        fields = [
            "translations", "slug", "parent", "sort_order", "is_active", "is_featured",
            "cover", "seo_title", "seo_description", "canonical_url", "robots",
            "og_title", "og_description", "og_image",
        ]

    def create(self, validated_data):
        translations = validated_data.pop("translations", {})
        cat = ProductCategory.objects.create(**validated_data)
        for lang_code, fields in translations.items():
            ProductCategoryTranslation.objects.create(category=cat, language=lang_code, **fields)
        return cat

    def update(self, instance, validated_data):
        translations = validated_data.pop("translations", {})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.full_clean()
        instance.save()
        for lang_code, fields in translations.items():
            ProductCategoryTranslation.objects.update_or_create(category=instance, language=lang_code, defaults=fields)
        return instance


class AttributeDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAttributeDefinition
        fields = ["id", "code", "name", "data_type", "unit", "category", "sort_order", "is_active"]
