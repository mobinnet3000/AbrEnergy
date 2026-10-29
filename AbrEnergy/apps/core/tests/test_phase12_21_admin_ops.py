import pytest
from django.test import TestCase
from rest_framework.test import APIClient
from apps.users.models import User
from apps.users.choices import UserRole
from apps.contacts.models import ContactRequest, ProjectInquiry
from apps.notifications.models import Notification


@pytest.mark.django_db
class Phase1221AdminOpsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.super_admin = User.objects.create_superuser(
            email="superadmin@test.com", password="pass",
            full_name="Super Admin",
        )
        self.website_admin = User.objects.create_user(
            email="webadmin@test.com", password="pass",
            full_name="Website Admin", role=UserRole.WEBSITE_ADMIN,
        )
        self.engineer = User.objects.create_user(
            email="engineer@test.com", password="pass",
            full_name="Engineer User", role=UserRole.ENGINEER,
        )
        self.content_mgr = User.objects.create_user(
            email="content@test.com", password="pass",
            full_name="Content Manager", role=UserRole.CONTENT_MANAGER,
        )
        self.customer = User.objects.create_user(
            email="customer@test.com", password="pass",
            full_name="Customer User", role=UserRole.CUSTOMER,
        )

    # ─────────────────────────────────────────────────────────────
    # 1. Contact Submission & Normalization
    # ─────────────────────────────────────────────────────────────

    def test_public_contact_submission_with_persian_digits(self):
        # Anonymous client can submit contact request
        payload = {
            "full_name": "  علی رضایی  ",
            "email": "ALI@Example.Com  ",
            "phone": "۰۹۱۲۳۴۵۶۷۸۹",
            "subject": "درخواست مشاوره",
            "message": "این یک پیام تستی برای پروژه خورشیدی است.",
            "request_type": "consultation",
        }
        res = self.client.post("/api/v1/contact/", payload)
        assert res.status_code == 201

        contact = ContactRequest.objects.get(email="ali@example.com")
        assert contact.full_name == "علی رضایی"
        assert contact.phone == "09123456789"
        assert contact.request_type == "consultation"

        # Check notification was created for super_admin and website_admin
        admin_notifs = Notification.objects.filter(link=f"/admin/contacts/{contact.id}")
        assert admin_notifs.filter(recipient=self.super_admin).exists()
        assert admin_notifs.filter(recipient=self.website_admin).exists()

    def test_contact_submission_validation_errors(self):
        # Short message
        res = self.client.post("/api/v1/contact/", {
            "full_name": "A",
            "email": "bademail",
            "phone": "123",
            "message": "hi",
        })
        assert res.status_code == 400
        errors = res.data.get("errors", res.data)
        assert "full_name" in errors or "email" in errors or "phone" in errors or "message" in errors

    # ─────────────────────────────────────────────────────────────
    # 2. Project Inquiry Submission & Normalization
    # ─────────────────────────────────────────────────────────────

    def test_public_inquiry_submission_with_persian_digits(self):
        payload = {
            "name": "شرکت آفتاب",
            "phone": "۰۲۱-۸۸۸۸۹۹۹۹",
            "email": "info@aftab.ir",
            "city": "تهران",
            "project_type": "on_grid",
            "estimated_capacity": "50.00",
            "message": "نیاز به ۵۰ کیلووات سیستم متصل به شبکه",
        }
        res = self.client.post("/api/v1/project-inquiry/", payload)
        assert res.status_code == 201

        inquiry = ProjectInquiry.objects.get(name="شرکت آفتاب")
        assert inquiry.phone == "02188889999"
        assert float(inquiry.estimated_capacity) == 50.0
        assert inquiry.status == "new"

        # Check notification link is valid /admin/inquiries/{id}
        notif = Notification.objects.filter(recipient=self.engineer, link=f"/admin/inquiries/{inquiry.id}").first()
        assert notif is not None
        assert "شرکت آفتاب" in notif.message

    def test_inquiry_negative_capacity_rejected(self):
        res = self.client.post("/api/v1/project-inquiry/", {
            "name": "تست منفی",
            "phone": "09123456789",
            "city": "شیراز",
            "project_type": "off_grid",
            "estimated_capacity": "-10.00",
        })
        assert res.status_code == 400
        errors = res.data.get("errors", res.data)
        assert "estimated_capacity" in errors


    # ─────────────────────────────────────────────────────────────
    # 3. Access Controls (Security Gates)
    # ─────────────────────────────────────────────────────────────

    def test_anonymous_access_denied_to_admin_inquiries_and_contacts(self):
        res1 = self.client.get("/api/v1/admin/contact-requests/")
        assert res1.status_code == 401

        res2 = self.client.get("/api/v1/admin/project-inquiries/")
        assert res2.status_code == 401

        res3 = self.client.get("/api/v1/admin/users/")
        assert res3.status_code == 401

    def test_role_restrictions_on_contact_requests(self):
        # Content manager and customer cannot access contact requests
        self.client.force_authenticate(user=self.content_mgr)
        res = self.client.get("/api/v1/admin/contact-requests/")
        assert res.status_code == 403

        self.client.force_authenticate(user=self.customer)
        res = self.client.get("/api/v1/admin/contact-requests/")
        assert res.status_code == 403

        # Website admin CAN access contact requests
        self.client.force_authenticate(user=self.website_admin)
        res = self.client.get("/api/v1/admin/contact-requests/")
        assert res.status_code == 200

    def test_engineer_permissions_on_inquiries(self):
        # Engineer CAN access project inquiries
        self.client.force_authenticate(user=self.engineer)
        res = self.client.get("/api/v1/admin/project-inquiries/")
        assert res.status_code == 200

        # Engineer CANNOT access contact requests
        res = self.client.get("/api/v1/admin/contact-requests/")
        assert res.status_code == 403

    # ─────────────────────────────────────────────────────────────
    # 4. Admin Detail & Status Update Persistence
    # ─────────────────────────────────────────────────────────────

    def test_admin_contact_detail_and_status_update(self):
        contact = ContactRequest.objects.create(
            full_name="مشتری یک",
            email="c1@test.com",
            phone="09111111111",
            message="متن پیام تست",
            request_type="contact",
        )
        self.client.force_authenticate(user=self.super_admin)

        # GET detail returns full fields
        res_get = self.client.get(f"/api/v1/admin/contact-requests/{contact.id}/")
        assert res_get.status_code == 200
        assert res_get.data["full_name"] == "مشتری یک"
        assert res_get.data["email"] == "c1@test.com"
        assert res_get.data["message"] == "متن پیام تست"

        # PATCH status and admin_note
        res_patch = self.client.patch(
            f"/api/v1/admin/contact-requests/{contact.id}/",
            {"status": "in_review", "admin_note": "تماس اولیه برقرار شد."},
            format="json",
        )
        assert res_patch.status_code == 200
        contact.refresh_from_db()
        assert contact.status == "in_review"
        assert contact.admin_note == "تماس اولیه برقرار شد."

    def test_admin_inquiry_detail_and_status_update(self):
        inquiry = ProjectInquiry.objects.create(
            name="پروژه خورشیدی اصفهان",
            phone="09333333333",
            city="اصفهان",
            project_type="hybrid",
            estimated_capacity=100.0,
            message="استعلام قیمت اینورتر و پنل",
        )
        self.client.force_authenticate(user=self.engineer)

        # GET detail returns full data
        res_get = self.client.get(f"/api/v1/admin/project-inquiries/{inquiry.id}/")
        assert res_get.status_code == 200
        assert res_get.data["name"] == "پروژه خورشیدی اصفهان"
        assert res_get.data["city"] == "اصفهان"
        assert res_get.data["project_type"] == "hybrid"

        # PATCH status and admin_note
        res_patch = self.client.patch(
            f"/api/v1/admin/project-inquiries/{inquiry.id}/",
            {"status": "quoted", "admin_note": "پیش فاکتور شماره ۱۲۳ ارسال شد."},
            format="json",
        )
        assert res_patch.status_code == 200
        inquiry.refresh_from_db()
        assert inquiry.status == "quoted"
        assert inquiry.admin_note == "پیش فاکتور شماره ۱۲۳ ارسال شد."

    # ─────────────────────────────────────────────────────────────
    # 5. Notifications Read and Delete Operations
    # ─────────────────────────────────────────────────────────────

    def test_notification_mark_read_and_delete(self):
        notif = Notification.objects.create(
            recipient=self.super_admin,
            title="اعلان آزمایشی",
            message="یک اعلان برای آزمایش",
            notification_type="general",
            link="/admin/contacts",
        )
        self.client.force_authenticate(user=self.super_admin)

        # Unread count
        res_cnt = self.client.get("/api/v1/notifications/unread-count/")
        assert res_cnt.status_code == 200
        assert res_cnt.data["count"] >= 1

        # Mark read sets read_at
        res_read = self.client.patch(f"/api/v1/notifications/{notif.id}/read/")
        assert res_read.status_code == 200
        notif.refresh_from_db()
        assert notif.is_read is True
        assert notif.read_at is not None

        # Delete notification
        res_del = self.client.delete(f"/api/v1/notifications/{notif.id}/")
        assert res_del.status_code == 204
        assert not Notification.objects.filter(pk=notif.id).exists()

    def test_cannot_access_or_modify_other_user_notification(self):
        other_notif = Notification.objects.create(
            recipient=self.super_admin,
            title="اعلان مدیر",
            message="پیام خصوصی مدیر",
        )
        self.client.force_authenticate(user=self.customer)

        # Attempt to mark read other user's notification
        res = self.client.patch(f"/api/v1/notifications/{other_notif.id}/read/")
        assert res.status_code == 404

        # Attempt to delete other user's notification
        res_del = self.client.delete(f"/api/v1/notifications/{other_notif.id}/")
        assert res_del.status_code == 404

    # ─────────────────────────────────────────────────────────────
    # 6. User Management & Last-Super-Admin Safeguards
    # ─────────────────────────────────────────────────────────────

    def test_last_super_admin_demotion_blocked(self):
        # Initially only 1 active super admin exists (self.super_admin)
        self.client.force_authenticate(user=self.super_admin)

        # Attempt to demote the sole super admin
        res = self.client.patch(
            f"/api/v1/admin/users/{self.super_admin.id}/change-role/",
            {"role": "content_manager"},
            format="json",
        )
        assert res.status_code == 400
        assert "Cannot demote the final active super administrator." in res.data["detail"]

        self.super_admin.refresh_from_db()
        assert self.super_admin.role == UserRole.SUPER_ADMIN

    def test_last_super_admin_deactivation_blocked(self):
        self.client.force_authenticate(user=self.super_admin)

        # Attempt to deactivate sole super admin via UserDetailView
        res = self.client.patch(
            f"/api/v1/admin/users/{self.super_admin.id}/",
            {"is_active": False},
            format="json",
        )
        assert res.status_code == 400
        assert "Cannot deactivate the final active super administrator." in str(res.data)

        self.super_admin.refresh_from_db()
        assert self.super_admin.is_active is True

    def test_last_super_admin_deletion_blocked(self):
        self.client.force_authenticate(user=self.super_admin)

        # Attempt to delete sole super admin
        res = self.client.delete(f"/api/v1/admin/users/{self.super_admin.id}/")
        assert res.status_code == 400
        assert User.objects.filter(pk=self.super_admin.pk).exists()

    def test_super_admin_demotion_allowed_when_multiple_exist(self):
        # Create a second active super admin
        second_admin = User.objects.create_superuser(
            email="admin2@test.com", password="pass",
            full_name="Second Admin",
        )
        self.client.force_authenticate(user=self.super_admin)

        # Demote second admin should succeed because self.super_admin remains active
        res1 = self.client.patch(
            f"/api/v1/admin/users/{second_admin.id}/change-role/",
            {"role": "website_admin"},
            format="json",
        )
        assert res1.status_code == 200
        second_admin.refresh_from_db()
        assert second_admin.role == UserRole.WEBSITE_ADMIN

        # Now only self.super_admin remains. Attempt to demote self.super_admin must be blocked
        res2 = self.client.patch(
            f"/api/v1/admin/users/{self.super_admin.id}/change-role/",
            {"role": "engineer"},
            format="json",
        )
        assert res2.status_code == 400
        self.super_admin.refresh_from_db()
        assert self.super_admin.role == UserRole.SUPER_ADMIN

    def test_non_super_admin_cannot_access_user_management(self):
        # Website admin cannot list users or change roles
        self.client.force_authenticate(user=self.website_admin)
        res = self.client.get("/api/v1/admin/users/")
        assert res.status_code == 403

        res2 = self.client.patch(
            f"/api/v1/admin/users/{self.customer.id}/change-role/",
            {"role": "content_manager"},
            format="json",
        )
        assert res2.status_code == 403
