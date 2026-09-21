import uuid
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError, models
from django.db.models import F, Q
from django.utils import timezone


class ProductCategory(models.Model):
    ROBOT_CHOICES = [
        ("index_follow", "Index, Follow"),
        ("noindex_follow", "No Index, Follow"),
        ("index_nofollow", "Index, No Follow"),
        ("noindex_nofollow", "No Index, No Follow"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True,
        related_name="children", db_index=True,
    )
    slug = models.SlugField(unique=True, allow_unicode=True, max_length=255)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False)
    cover = models.ForeignKey(
        "media_manager.MediaFile", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="product_categories_as_cover",
    )
    seo_title = models.CharField(max_length=255, blank=True, default="")
    seo_description = models.TextField(blank=True, default="")
    canonical_url = models.URLField(blank=True, default="")
    robots = models.CharField(max_length=20, choices=ROBOT_CHOICES, default="index_follow")
    og_title = models.CharField(max_length=255, blank=True, default="")
    og_description = models.TextField(blank=True, default="")
    og_image = models.ForeignKey(
        "media_manager.MediaFile", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="product_categories_as_og",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Product Categories"
        ordering = ["sort_order", "created_at", "id"]
        indexes = [
            models.Index(fields=["parent", "is_active", "sort_order"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=~Q(parent=F("id")),
                name="productcategory_no_self_parent",
            ),
        ]

    def __str__(self):
        t = self.get_translation("fa") or self.translations.first()
        return t.title if t else self.slug

    def get_translation(self, language):
        prefetched = self._prefetched_objects_cache.get("translations") if hasattr(self, "_prefetched_objects_cache") else None
        if prefetched is not None:
            for t in prefetched:
                if t.language == language:
                    return t
            return None
        return self.translations.filter(language=language).first()

    def clean(self):
        if self.parent_id and self.parent_id == self.id:
            raise ValidationError("Category cannot be its own parent.")

    def save(self, *args, **kwargs):
        # Phase 5.2: remember the previous public (model-level) slug so old
        # category URLs can permanently redirect instead of dying. The public
        # category detail view resolves ProductCategory.slug (not the
        # per-language translation slug), so only model-slug changes are
        # tracked here. Additive: no field changes, no behavior change.
        old_slug = ""
        if self.pk:
            old_slug = (
                ProductCategory.objects.filter(pk=self.pk)
                .values_list("slug", flat=True)
                .first()
                or ""
            )
        super().save(*args, **kwargs)
        if old_slug and old_slug != (self.slug or ""):
            record_slug_history("product_category", self.pk, "", old_slug, self.slug)


class SlugHistory(models.Model):
    """Phase 5.2: minimal reusable slug-history for public catalog redirects.

    One row remembers that ``old_slug`` (in ``language``) used to address
    the object ``(target_type, object_id)``. The canonical slug always stays
    on the main model/translation; history rows are NEVER treated as
    canonical. Public resolution order is always:

    1. current canonical slug -> normal detail response;
    2. historical slug -> 308 redirect to the current canonical URL;
    3. anything else -> 404 (existing NotFoundState/fallback behavior).

    ``language`` is the translation language for products (``fa``/``ar``/
    ``en``) and ``""`` for product categories, whose public URL resolves
    the non-translated ``ProductCategory.slug`` model field.

    Rows are created automatically by ``ProductCategory.save()`` and
    ``ProductTranslation.save()`` via ``record_slug_history()`` (idempotent
    ``get_or_create``). Bulk queryset updates bypass ``save()`` and therefore
    record no history — slug changes must go through the model/CMS API.
    """

    TARGET_CHOICES = [
        ("product", "Product"),
        ("product_category", "Product Category"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    target_type = models.CharField(max_length=20, choices=TARGET_CHOICES, db_index=True)
    object_id = models.UUIDField(db_index=True)
    language = models.CharField(max_length=5, blank=True, default="", db_index=True)
    old_slug = models.SlugField(allow_unicode=True, max_length=500, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["target_type", "language", "old_slug"],
                name="uniq_slug_history_target_lang_slug",
            ),
        ]
        indexes = [
            models.Index(fields=["target_type", "object_id"]),
        ]

    def __str__(self):
        return f"{self.target_type}:{self.object_id} [{self.language or '-'}] {self.old_slug}"


def record_slug_history(target_type, object_id, language, old_slug, new_slug=None):
    """Persist a historical slug idempotently. Returns the row or None.

    No-ops (None) when ``old_slug`` is empty, identical to ``new_slug`` (no
    real change), or already owned by a DIFFERENT object (first owner wins;
    the slug is never stolen). Because public resolution always checks
    canonical slugs before history, a history row can never shadow a live
    canonical URL.
    """
    old_slug = (old_slug or "").strip()
    language = language or ""
    if not old_slug:
        return None
    if new_slug is not None and old_slug == (new_slug or "").strip():
        return None
    # The DB triple (target_type, language, old_slug) is unique WITHOUT the
    # owner: a historical slug may only ever point at ONE owner. If another
    # object already owns this slug string, keep the first owner (canonical
    # lookup runs before history anyway, so no live URL can be shadowed).
    existing = (
        SlugHistory.objects.filter(
            target_type=target_type, language=language, old_slug=old_slug
        ).first()
    )
    if existing is not None:
        return existing if str(existing.object_id) == str(object_id) else None
    try:
        return SlugHistory.objects.create(
            target_type=target_type,
            object_id=object_id,
            language=language,
            old_slug=old_slug,
        )
    except IntegrityError:
        # Lost a race with a concurrent writer; re-read the winner.
        return SlugHistory.objects.filter(
            target_type=target_type, language=language, old_slug=old_slug
        ).first()


class Product(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]
    VISIBILITY_CHOICES = [
        ("public", "Public"),
        ("hidden", "Hidden"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        ProductCategory, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="products",
    )
    sku = models.CharField(max_length=64, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft", db_index=True)
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default="public", db_index=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    seo_title = models.CharField(max_length=255, blank=True, default="")
    seo_description = models.TextField(blank=True, default="")
    canonical_url = models.URLField(blank=True, default="")
    robots = models.CharField(max_length=20, choices=ProductCategory.ROBOT_CHOICES, default="index_follow")
    og_title = models.CharField(max_length=255, blank=True, default="")
    og_description = models.TextField(blank=True, default="")
    og_image = models.ForeignKey(
        "media_manager.MediaFile", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="products_as_og",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "-created_at", "id"]
        indexes = [
            models.Index(fields=["status", "visibility", "is_active"]),
            models.Index(fields=["category", "status"]),
            models.Index(fields=["status", "is_featured"]),
        ]

    def __str__(self):
        t = self.get_translation("fa") or self.translations.first()
        return t.title if t else self.sku

    def get_translation(self, language):
        prefetched = self._prefetched_objects_cache.get("translations") if hasattr(self, "_prefetched_objects_cache") else None
        if prefetched is not None:
            for t in prefetched:
                if t.language == language:
                    return t
            return None
        return self.translations.filter(language=language).first()

    def save(self, *args, **kwargs):
        if self.status == "published" and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    @property
    def is_publicly_visible(self):
        return (
            self.status == "published"
            and self.visibility == "public"
            and self.is_active
        )


class ProductImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    media_file = models.ForeignKey(
        "media_manager.MediaFile", on_delete=models.CASCADE,
        related_name="product_images",
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_cover = models.BooleanField(default=False)
    alt_text = models.CharField(max_length=500, blank=True, default="")
    caption = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_cover", "sort_order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["product"], condition=Q(is_cover=True),
                name="uniq_product_cover",
            ),
        ]

    def save(self, *args, **kwargs):
        if self.is_cover:
            ProductImage.objects.filter(product=self.product).exclude(pk=self.pk).update(is_cover=False)
        super().save(*args, **kwargs)


class ProductDocument(models.Model):
    DOC_TYPE_CHOICES = [
        ("catalog", "Catalog"),
        ("datasheet", "Datasheet"),
        ("installation_guide", "Installation Guide"),
        ("spec_sheet", "Specification Sheet"),
        ("other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="documents")
    media_file = models.ForeignKey(
        "media_manager.MediaFile", on_delete=models.CASCADE,
        related_name="product_documents",
    )
    title = models.CharField(max_length=255)
    doc_type = models.CharField(max_length=20, choices=DOC_TYPE_CHOICES, default="catalog")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "created_at", "id"]

    def clean(self):
        media = self.media_file
        if media and getattr(media, "file_type", "") != "document":
            raise ValidationError("Product documents must reference a document-type MediaFile (PDF).")


class ProductAttributeDefinition(models.Model):
    DATA_TYPE_CHOICES = [
        ("text", "Text"),
        ("number", "Number"),
        ("boolean", "Boolean"),
        ("select", "Select"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.SlugField(unique=True, max_length=64)
    name = models.CharField(max_length=255)
    data_type = models.CharField(max_length=20, choices=DATA_TYPE_CHOICES, default="text")
    unit = models.CharField(max_length=32, blank=True, default="")
    category = models.ForeignKey(
        ProductCategory, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="attribute_definitions",
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "code"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class ProductAttributeValue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="attribute_values")
    definition = models.ForeignKey(
        ProductAttributeDefinition, on_delete=models.CASCADE, related_name="values",
    )
    value_text = models.CharField(max_length=1000, blank=True, default="")
    value_number = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    value_boolean = models.BooleanField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "definition"],
                name="uniq_product_attribute",
            ),
        ]

    def clean(self):
        dtype = self.definition.data_type if self.definition_id else None
        if dtype in ("text", "select") and not self.value_text:
            raise ValidationError("Text/select attributes require value_text.")
        if dtype == "number" and self.value_number is None:
            raise ValidationError("Number attributes require value_number.")
        if dtype == "boolean" and self.value_boolean is None:
            raise ValidationError("Boolean attributes require value_boolean.")

    @property
    def display(self):
        if self.definition_id and self.definition.data_type == "number":
            return f"{self.value_number} {self.definition.unit}".strip()
        if self.definition_id and self.definition.data_type == "boolean":
            return self.value_boolean
        unit = f" {self.definition.unit}" if self.definition_id and self.definition.unit else ""
        return f"{self.value_text}{unit}".strip()


class ProductSpecification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="specifications")
    section = models.CharField(max_length=128, blank=True, default="")
    label = models.CharField(max_length=255)
    value = models.CharField(max_length=1000)
    unit = models.CharField(max_length=32, blank=True, default="")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["section", "sort_order", "id"]
        indexes = [
            models.Index(fields=["product", "section", "sort_order"]),
        ]


class ProductPrice(models.Model):
    DISPLAY_MODE_CHOICES = [
        ("contact", "Contact for Price"),
        ("regular", "Regular Price"),
        ("discounted", "Discounted Price"),
        ("hidden", "Hidden Price"),
    ]
    DISCOUNT_TYPE_CHOICES = [
        ("none", "None"),
        ("percentage", "Percentage"),
        ("fixed", "Fixed Amount"),
    ]

    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name="price", primary_key=False)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    display_mode = models.CharField(max_length=20, choices=DISPLAY_MODE_CHOICES, default="contact")
    regular_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    sale_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=8, default="IRR")
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default="none")
    discount_value = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.display_mode in ("regular", "discounted") and self.regular_price is None:
            raise ValidationError("Regular price is required for regular/discounted modes.")
        if self.sale_price is not None:
            if self.regular_price is None:
                raise ValidationError("Sale price requires a regular price.")
            if self.sale_price > self.regular_price:
                raise ValidationError("Sale price must not exceed regular price.")
        if self.display_mode == "discounted" and self.sale_price is None and self.discount_type == "none":
            raise ValidationError("Discounted mode requires a sale price or a discount.")
        if self.discount_type == "percentage" and self.discount_value > 100:
            raise ValidationError("Percentage discount must not exceed 100.")
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValidationError("Discount end must be after start.")

    def get_effective(self):
        now = timezone.now()
        if not self.is_active or self.display_mode == "hidden":
            return {"state": "hidden", "currency": self.currency}
        if self.display_mode == "contact" or self.regular_price is None:
            return {"state": "contact_for_price", "currency": self.currency}
        base = {
            "currency": self.currency,
            "regular_price": self.regular_price,
            "sale_price": self.sale_price,
            "discount_type": self.discount_type,
            "discount_value": self.discount_value,
            "starts_at": self.starts_at,
            "ends_at": self.ends_at,
        }
        if self.display_mode == "regular":
            return {**base, "state": "regular", "final_price": self.regular_price}
        if self.starts_at and now < self.starts_at:
            return {**base, "state": "scheduled", "final_price": self.regular_price}
        if self.ends_at and now > self.ends_at:
            return {**base, "state": "expired", "final_price": self.regular_price}
        if self.sale_price is not None:
            final = self.sale_price
        elif self.discount_type == "percentage":
            final = (self.regular_price * (1 - self.discount_value / 100)).quantize(Decimal("0.01"))
        elif self.discount_type == "fixed":
            final = max(Decimal("0"), self.regular_price - self.discount_value)
        else:
            return {**base, "state": "regular", "final_price": self.regular_price}
        return {**base, "state": "discounted", "final_price": final}

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(regular_price__isnull=True) | Q(regular_price__gte=0),
                name="price_regular_nonnegative",
            ),
            models.CheckConstraint(
                condition=Q(sale_price__isnull=True) | Q(sale_price__gte=0),
                name="price_sale_nonnegative",
            ),
            models.CheckConstraint(
                condition=Q(sale_price__isnull=True) | Q(regular_price__isnull=True) | Q(sale_price__lte=F("regular_price")),
                name="price_sale_lte_regular",
            ),
            models.CheckConstraint(
                condition=Q(discount_value__gte=0),
                name="price_discount_nonnegative",
            ),
            models.CheckConstraint(
                condition=~Q(discount_type="percentage") | Q(discount_value__lte=100),
                name="price_percent_lte_100",
            ),
            models.CheckConstraint(
                condition=Q(starts_at__isnull=True) | Q(ends_at__isnull=True) | Q(ends_at__gt=F("starts_at")),
                name="price_window_valid",
            ),
        ]


class RelatedProduct(models.Model):
    RELATION_CHOICES = [
        ("related", "Related"),
        ("similar", "Similar"),
        ("accessory", "Accessory"),
        ("recommended", "Recommended"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    from_product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="related_from")
    to_product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="related_to")
    relation_type = models.CharField(max_length=20, choices=RELATION_CHOICES, default="related")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["from_product", "to_product"],
                name="uniq_product_relation",
            ),
            models.CheckConstraint(
                condition=~Q(from_product=F("to_product")),
                name="relation_no_self_reference",
            ),
        ]

    def clean(self):
        if self.from_product_id and self.from_product_id == self.to_product_id:
            raise ValidationError("A product cannot be related to itself.")


from apps.products.translation_models import (  # noqa: E402, F401
    ProductCategoryTranslation,
    ProductTranslation,
)
