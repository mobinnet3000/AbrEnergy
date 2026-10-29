# -*- coding: utf-8 -*-
"""
Generator script for AbarEnergy Operations Manual (.docx)
Phase 12.29 — Comprehensive UI/UX, Brand Identity, CMS, Security, SEO/GEO & Multilingual Readiness
"""

import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def make_paragraph_rtl(p):
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    pPr = p._p.get_or_add_pPr()
    bidi = OxmlElement('w:bidi')
    bidi.set(qn('w:val'), '1')
    pPr.append(bidi)

def format_run(run, font_name="Vazirmatn", size_pt=11, bold=False, italic=False, color_rgb=(15, 23, 42)):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(*color_rgb)
    rPr = run._r.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.append(rFonts)
    rFonts.set(qn('w:cs'), font_name)
    rFonts.set(qn('w:ascii'), font_name)
    rFonts.set(qn('w:hAnsi'), font_name)

def add_rtl_heading(doc, text, level=1):
    h = doc.add_heading(level=level)
    make_paragraph_rtl(h)
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(6)
    run = h.add_run(text)
    if level == 1:
        format_run(run, font_name="Vazirmatn", size_pt=18, bold=True, color_rgb=(5, 150, 105)) # Emerald Brand
    elif level == 2:
        format_run(run, font_name="Vazirmatn", size_pt=14, bold=True, color_rgb=(15, 23, 42)) # Slate 900
    else:
        format_run(run, font_name="Vazirmatn", size_pt=12, bold=True, color_rgb=(4, 120, 87)) # Dark emerald
    return h

def add_rtl_paragraph(doc, text="", bold_prefix="", size_pt=10.5, color_rgb=(51, 65, 85)):
    p = doc.add_paragraph()
    make_paragraph_rtl(p)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.25

    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        format_run(r_pre, font_name="Vazirmatn", size_pt=size_pt, bold=True, color_rgb=(15, 23, 42))
    
    if text:
        r_text = p.add_run(text)
        format_run(r_text, font_name="Vazirmatn", size_pt=size_pt, bold=False, color_rgb=color_rgb)
    return p

def add_callout(doc, text, title="نکته مهم", alert_type="info"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)

    bg_color = "ECFDF5" if alert_type == "success" else "FEF3C7" if alert_type == "warning" else "F0FDF4"
    border_color = "059669" if alert_type == "success" else "D97706" if alert_type == "warning" else "10B981"
    set_cell_background(cell, bg_color)

    p = cell.paragraphs[0]
    make_paragraph_rtl(p)
    r_title = p.add_run(f"📌 {title}: ")
    format_run(r_title, font_name="Vazirmatn", size_pt=11, bold=True, color_rgb=(4, 120, 87) if alert_type != "warning" else (180, 83, 9))
    r_text = p.add_run(text)
    format_run(r_text, font_name="Vazirmatn", size_pt=10.5, bold=False, color_rgb=(15, 23, 42))
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def build_rtl_table(doc, headers, rows, col_widths=None):
    tbl = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Header Row
    hdr_cells = tbl.rows[0].cells
    for i, h_text in enumerate(headers):
        cell = hdr_cells[i]
        set_cell_background(cell, "059669")
        set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
        p = cell.paragraphs[0]
        make_paragraph_rtl(p)
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r = p.add_run(h_text)
        format_run(r, font_name="Vazirmatn", size_pt=10, bold=True, color_rgb=(255, 255, 255))
    
    # Data Rows
    for row_idx, row_data in enumerate(rows):
        row_cells = tbl.rows[row_idx + 1].cells
        bg_hex = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, val in enumerate(row_data):
            cell = row_cells[col_idx]
            set_cell_background(cell, bg_hex)
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            make_paragraph_rtl(p)
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            r = p.add_run(str(val))
            format_run(r, font_name="Vazirmatn", size_pt=9.5, color_rgb=(30, 41, 59))
            
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def generate_manual():
    doc = Document()

    # Page Margins: 1 inch everywhere
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # ================= COVER PAGE =================
    cover_p_pre = doc.add_paragraph()
    cover_p_pre.paragraph_format.space_before = Pt(40)

    p_title = doc.add_paragraph()
    make_paragraph_rtl(p_title)
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("راهنمای جامع مدیریت و بهره‌برداری از سامانه AbarEnergy")
    format_run(r_title, font_name="Vazirmatn", size_pt=26, bold=True, color_rgb=(5, 150, 105))

    p_sub = doc.add_paragraph()
    make_paragraph_rtl(p_sub)
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(12)
    p_sub.paragraph_format.space_after = Pt(36)
    r_sub = p_sub.add_run("دستورالعمل جامع نقش‌ها، ماتریس دسترسی ۹ سطحی، گردش‌کارهای CMS، سئو/GEO، امنیت و چک‌لیست‌های عملیاتی")
    format_run(r_sub, font_name="Vazirmatn", size_pt=14, bold=False, color_rgb=(71, 85, 105))

    # Meta card on cover
    tbl_cover = doc.add_table(rows=5, cols=2)
    tbl_cover.alignment = WD_TABLE_ALIGNMENT.CENTER
    cover_meta = [
        ("پلتفرم:", "سامانه تجاری انرژی خورشیدی ابر انرژی (AbarEnergy)"),
        ("نسخه مستند:", "Phase 12.29 — Comprehensive Release"),
        ("معماری سیستم:", "Django REST Framework 5.2 / Next.js 15 App Router"),
        ("پایگاه‌های داده و کش:", "PostgreSQL 16 Enterprise / Redis In-Memory Cache"),
        ("تاریخ انتشار و بازبینی:", "آبان ۱۴۰۵ (اکتبر ۲۰۲۶)"),
    ]
    for idx, (label, val) in enumerate(cover_meta):
        c0 = tbl_cover.cell(idx, 0)
        c1 = tbl_cover.cell(idx, 1)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "F8FAFC")
        set_cell_margins(c0, 80, 80, 100, 100)
        set_cell_margins(c1, 80, 80, 100, 100)
        p0 = c0.paragraphs[0]
        p1 = c1.paragraphs[0]
        make_paragraph_rtl(p0)
        make_paragraph_rtl(p1)
        r0 = p0.add_run(label)
        r1 = p1.add_run(val)
        format_run(r0, font_name="Vazirmatn", size_pt=10, bold=True, color_rgb=(15, 23, 42))
        format_run(r1, font_name="Vazirmatn", size_pt=10, bold=False, color_rgb=(51, 65, 85))

    doc.add_page_break()

    # ================= TABLE OF CONTENTS SUMMARY =================
    add_rtl_heading(doc, "فهرست فصول و مباحث کتابچه راهنما", level=1)
    toc_items = [
        "فصل اول: معرفی سامانه، معماری و اهداف پلتفرم ابر انرژی",
        "فصل دوم: نقش‌ها و سطح دسترسی (ماتریس جامع ۹ نقش و سیاست‌های امنیتی)",
        "فصل سوم: گردش کار مدیریت محتوا (مقالات، خدمات، پروژه‌ها و رسانه‌ها)",
        "فصل چهارم: مدیریت محصولات، کاتالوگ صنعتی و دسته‌بندی‌ها",
        "فصل پنجم: مدیریت تنظیمات سایت و نشانی رسمی شرکت در فوتر",
        "فصل ششم: گردش کار درخواست‌های مشتریان و استعلام‌های مهندسی",
        "فصل هفتم: گردش کار SEO و Generative Engine Optimization (GEO)",
        "فصل هشتم: امنیت سیستم، حفاظت از داده‌ها و مدیریت خطا",
        "فصل نهم: چک‌لیست‌های عملیاتی (روزانه، هفتگی و ماهانه)",
        "فصل دهم: راهنمای عیب‌یابی و واکنش سریع به حوادث",
    ]
    for item in toc_items:
        add_rtl_paragraph(doc, item, bold_prefix="▪ ")

    doc.add_page_break()

    # ================= CHAPTER 1 =================
    add_rtl_heading(doc, "فصل اول: معرفی سامانه، معماری و اهداف", level=1)
    add_rtl_paragraph(doc, "سامانه یکپارچه AbarEnergy پلتفرم رسمی شرکت ابر انرژی برای ارائه خدمات مهندسی، تدارکات و ساخت (EPC) نیروگاه‌های خورشیدی، کاتالوگ صنعتی تجهیزات فتوولتائیک و اینورترها، محاسبات تخصصی سیستم‌های منفصل و متصل به شبکه، و مدیریت چرخه عمر ارتباط با مشتریان و شرکای تجاری است.")
    
    add_rtl_heading(doc, "بخش‌های اصلی سامانه", level=2)
    add_rtl_paragraph(doc, "بخش عمومی و پورتال مشتریان شامل صفحات اصلی، معرفی خدمات نیروگاهی، نمونه پروژه‌های اجرا شده، مقالات تخصصی، کاتالوگ محصولات با فیلترهای پیشرفته، فرم استعلام قیمت و ابزار محاسباتی برخط نیروگاه خورشیدی است.", bold_prefix="۱. پورتال عمومی: ")
    add_rtl_paragraph(doc, "پنل اختصاصی مشتریان احراز هویت شده جهت مشاهده سوابق محاسبات برخط، استعلام‌های فنی ارسال شده و مدیریت پروفایل کاربری.", bold_prefix="۲. داشبورد مشتریان (/dashboard): ")
    add_rtl_paragraph(doc, "محیط جامع مدیریت محتوا و عملیات برای ۸ نقش اداری با احراز هویت JWT، تفکیک دسترسی Authoritative در سطح سرور، کنترل‌های ثبت تغییرات (Audit Log) و نظارت بر شاخص‌های سئو.", bold_prefix="۳. پنل مدیریت پیشرفته (/admin): ")

    add_rtl_heading(doc, "معماری فنی پلتفرم", level=2)
    add_rtl_paragraph(doc, "لایه بک‌اند: جنگو ۵.۲ و فریم‌ورک قدرتمند Django REST Framework (DRF) با ساختار ماژولار و تفکیک دامنه‌های کسب‌وکار.", bold_prefix="▪ بک‌اند: ")
    add_rtl_paragraph(doc, "لایه فرانت‌اند: فریم‌ورک Next.js 15 با معماری App Router، کامپوننت‌های Server و Client مدرن React 19، پشتیبانی کامل چندزبانه (fa, en, ar) و جهت‌گیری راست‌به‌چپ (RTL).", bold_prefix="▪ فرانت‌اند: ")
    add_rtl_paragraph(doc, "پایگاه داده: PostgreSQL 16 Enterprise با تراکنش‌های اتمیک، قفل‌های سطحی (Pessimistic Locking) و شاخص‌های ترکیبی بهینه.", bold_prefix="▪ دیتابیس: ")
    add_rtl_paragraph(doc, "امنیت و سرعت: ریت‌لیمیت اختصاصی، توکن‌های JWT با چرخش خودکار و بلک‌لیست، اعتبارسنجی امن پروتکل‌های ورودی و عدم ذخیره‌سازی داده‌های ساختگی.", bold_prefix="▪ لایه محافظت: ")

    # ================= CHAPTER 2 =================
    add_rtl_heading(doc, "فصل دوم: نقش‌ها و سطح دسترسی (RBAC)", level=1)
    add_rtl_paragraph(doc, "سامانه AbarEnergy بر پایه یک ماتریس دسترسی قطعی و تفکیک‌شده ۹ سطحی عمل می‌کند. تمام مجوزها مستقیماً در لایه API و سرور Authoritative ارزیابی می‌شوند؛ بنابراین پنهان‌سازی دکمه در رابط کاربری صرفاً جنبه زیبایی داشته و امنیت اصلی در لایه کنترل‌کننده‌های جنگو تضمین شده است.")

    roles_data = [
        ("super_admin", "مدیر ارشد سامانه", "کنترل نامحدود بر تمام ماژول‌ها، تنظیمات سرور، ایجاد/حذف کاربران و محافظت در برابر حذف آخرین مدیر ارشد"),
        ("website_admin", "مدیر وب‌سایت", "مدیریت عملیاتی کامل کاتالوگ، محتوا، درخواست‌های تماس، استعلام‌ها و مشاهده لاگ‌های امنیتی"),
        ("content_manager", "مدیر محتوا", "ایجاد، ویرایش و انتشار مقالات، خدمات، پروژه‌ها، رسانه‌ها و Homepage Studio"),
        ("product_manager", "مدیر محصولات", "مدیریت کامل کاتالوگ تجهیزات، ویژگی‌های فنی، دسته‌بندی‌ها و فایل‌های ضمیمه"),
        ("support_manager", "مدیر پشتیبانی", "رسیدگی به پیام‌های تماس، درخواست‌های مشاوره، تغییر وضعیت تیکت‌ها و ارجاع به کارشناسان"),
        ("seo_manager", "مدیر سئو", "پایش متادیتا، مدیریت نقشه سایت داینامیک، اتصال کنسول گوگل، کلمات کلیدی و بهینه‌سازی GEO"),
        ("engineer", "مهندس فنی", "بررسی استعلام‌های فنی و محاسباتی، نظارت بر پارامترهای فرمول‌های محاسباتی نیروگاه"),
        ("analyst", "تحلیل‌گر داده", "دسترسی فقط‌خواندنی (Read-Only) به شاخص‌های تجاری، لاگ‌های عملکرد و آمار سئو"),
        ("customer", "مشتری / کاربر", "دسترسی اختصاصی به داشبورد فردی، ثبت و پیگیری استعلام و استفاده از ماشین‌حساب خورشیدی"),
    ]
    build_rtl_table(doc, ["شناسه نقش", "عنوان رسمی", "شرح وظایف و دامنه اختیارات"], roles_data)

    add_callout(doc, "طبق گارد محافظتی check_last_super_admin_violation در بک‌اند، تنزل رتبه، غیرفعال‌سازی یا حذف آخرین حساب super_admin فعال در سامانه با خطای HTTP 400 مسدود شده و غیرممکن است.", title="قانون حیاتی حفاظت از آخرین مدیر ارشد", alert_type="warning")

    # ================= CHAPTER 3 =================
    add_rtl_heading(doc, "فصل سوم: گردش کار مدیریت محتوا (CMS)", level=1)
    add_rtl_paragraph(doc, "تولید و انتشار محتوا در سامانه ابر انرژی تابع یک گردش‌کار چندمرحله‌ای استاندارد است که کیفیت فنی، سئو و چندزبانگی را تضمین می‌کند:")
    
    cms_steps = [
        ("۱. احراز هویت مجاز", "ورود به پنل ادمین با نقشی که مجوز محتوایی دارد (super_admin, website_admin, content_manager)."),
        ("۲. ایجاد پیش‌نویس (Draft)", "تکمیل عنوان، اسلاگ، خلاصه و متن مقاله یا خدمت. سامانه به صورت خودکار تغییرات ذخیره‌نشده را با Dirty Navigation Guard محافظت می‌کند."),
        ("۳. چندزبانگی محتوا", "ثبت نسخه فارسی به عنوان زبان پایه. در صورت نیاز به انتشار جهانی، ترجمه انگلیسی و عربی با اسلاگ‌های متناظر در برگه اختصاصی تکمیل می‌شود."),
        ("۴. اعتبارسنجی رسانه", "انتخاب تصویر شاخص از Media Library یا بارگذاری تصویر استاندارد (WebP/JPEG کمتر از ۵ مگابایت با Alt Text سئو)."),
        ("۵. متادیتای سئو", "تکمیل SEO Title و Meta Description. در صورت خالی بودن، امتیاز سلامت سئو کسر شده و هشدار زرد نمایش داده می‌شود."),
        ("۶. کنترل کیفی و انتشار", "تغییر وضعیت از Draft به Published. پس از انتشار، صفحه بلافاصله در نقشه سایت (sitemap.xml) و فیدهای عمومی ایندکس می‌شود."),
    ]
    for step, desc in cms_steps:
        add_rtl_paragraph(doc, desc, bold_prefix=f"{step}: ")

    # ================= CHAPTER 4 =================
    add_rtl_heading(doc, "فصل چهارم: مدیریت محصولات و کاتالوگ صنعتی", level=1)
    add_rtl_paragraph(doc, "محصولات ابر انرژی شامل پنل‌های فتوولتائیک مونوکریستال، اینورترهای متصل/منفصل از شبکه، باتری‌های لیتیوم و ژل و سازه‌های نصب خورشیدی است.")
    add_rtl_paragraph(doc, "هر محصول باید دارای کد شناسه یکتا (SKU) باشد که از تکرار آن در دیتابیس جلوگیری می‌شود.", bold_prefix="▪ شناسه کالا (SKU): ")
    add_rtl_paragraph(doc, "تخصیص محصول به ساختار درختی دسته‌بندی‌ها با اسلاگ استاندارد بدون شکست پیوندها.", bold_prefix="▪ ساختار دسته‌بندی: ")
    add_rtl_paragraph(doc, "ثبت توان نامی (وات)، ولتاژ، آمپراژ، راندمان، ابعاد و استانداردهای صنعتی TUV و IEC.", bold_prefix="▪ مشخصات فنی: ")
    add_rtl_paragraph(doc, "پیوست دیتاشیت رسمی PDF و کاتالوگ‌های مهندسی از طریق بخش اسناد کالا.", bold_prefix="▪ مستندات فنی و دیتاشیت: ")
    add_rtl_paragraph(doc, "فعال‌سازی دکمه «استعلام قیمت و مشاوره مهندسی» برای هدایت مستقیم مشتری به فرم استعلام همراه با ثبت کد محصول.", bold_prefix="▪ ارتباط با استعلام: ")

    # ================= CHAPTER 5 =================
    add_rtl_heading(doc, "فصل پنجم: مدیریت تنظیمات سایت و نشانی رسمی شرکت", level=1)
    add_rtl_paragraph(doc, "در فاز ۱۲.۲۹، قابلیت مدیریت ساختاریافته نشانی پستی، مختصات جغرافیایی و لینک نقشه به سامانه اضافه شد.")
    add_rtl_paragraph(doc, "مسیر مدیریت: /admin/settings در پنل ادمین (مجاز برای super_admin).", bold_prefix="▪ دسترسی: ")
    add_rtl_paragraph(doc, "امکان تعریف مستقل آدرس، شهر و استان برای سه زبان فارسی، انگلیسی و عربی بدون تداخل.", bold_prefix="▪ آدرس چندزبانه: ")
    add_rtl_paragraph(doc, "ثبت کد پستی معتبر ده رقمی که در فوتر و اسناد رسمی نمایش می‌یابد.", bold_prefix="▪ کد پستی: ")
    add_rtl_paragraph(doc, "پذیرش لینک‌های نقشه تنها با پروتکل امن HTTPS (مانند Google Maps، نشان یا بلد). پروتکل‌های ناامن یا اسکریپتی مسدود می‌شوند.", bold_prefix="▪ پیوند نقشه (Map URL): ")
    add_rtl_paragraph(doc, "نمایش آنی تغییرات آدرس و راه‌های تماس قبل از ذخیره نهایی به همان شکل فوتر اصلی سایت.", bold_prefix="▪ پیش‌نمایش زنده (Live Preview): ")

    # ================= CHAPTER 6 =================
    add_rtl_heading(doc, "فصل ششم: گردش کار درخواست‌های مشتریان و استعلام‌ها", level=1)
    add_rtl_paragraph(doc, "درخواست‌های کاربران از دو مبدا عمومی ثبت می‌شوند: فرم تماس با ما (/contact) و فرم استعلام تخصصی نیروگاه (/project-inquiry).")
    
    inquiry_steps = [
        ("۱. دریافت و اطلاع‌رسانی", "به محض ثبت استعلام، نوتیفیکیشن سیستمی برای مدیران ارسال شده و فعالیت با لاگ امنیتی ذخیره می‌شود."),
        ("۲. بررسی اولیه پشتیبانی", "مدیر پشتیبانی (support_manager) نوع درخواست، شهر پروژه و جزئیات اولیه را بازبینی می‌کند."),
        ("۳. ارجاع مهندسی", "درخواست‌های دارای ظرفیت یا ابعاد فنی، به مهندس فنی (engineer) ارجاع داده شده و یادداشت داخلی ثبت می‌شود."),
        ("۴. پیگیری و تغییر وضعیت", "وضعیتهای استاندارد: New -> Pending Review -> Contacted -> In Progress -> Completed."),
        ("۵. پاسخ و خاتمه", "نتیجه مشاوره تلفنی یا پیش‌فاکتور رسمی صادر شده و استعلام مختومه می‌گردد."),
    ]
    for step, desc in inquiry_steps:
        add_rtl_paragraph(doc, desc, bold_prefix=f"{step}: ")

    # ================= CHAPTER 7 =================
    add_rtl_heading(doc, "فصل هفتم: گردش کار SEO و Generative Engine Optimization (GEO)", level=1)
    add_rtl_paragraph(doc, "سامانه به یک داشبورد جامع در مسیر /admin/seo مجهز است که نظارت بر سلامت ارگانیک و آمادگی برای مدل‌های هوش مصنوعی را فراهم می‌کند.")

    add_rtl_heading(doc, "بخش‌های داشبورد سئو و GEO", level=2)
    add_rtl_paragraph(doc, "نمایش تعداد کل صفحات ایندکس‌پذیر، صفحات دارای نقص متادیتا و لینک‌های نقشه سایت و Robots.txt.", bold_prefix="۱. وضعیت کلی و شاخص‌ها: ")
    add_rtl_paragraph(doc, "فرمول قطعی از ۱۰۰ امتیاز با جریمه‌های شفاف برای نقص متادیتا یا فقدان لوگو و راهکارهای رفع فوری.", bold_prefix="۲. امتیاز سلامت سئو (Health Score): ")
    add_rtl_paragraph(doc, "جدول واژه‌های تحت پایش، فیلتر زبان و هدف جستجو، افزودن کلمه جدید و امکان خروجی اکسل/CSV استاندارد با هدر UTF-8 BOM.", bold_prefix="۳. مدیریت کلمات کلیدی: ")
    add_rtl_paragraph(doc, "وضعیت اتصال واقعی به Google Search Console API و GA4 بدون جعل رتبه و همراه با مشخصات Scopes الزامی.", bold_prefix="۴. کنسول گوگل و آنالیتیکس: ")
    add_rtl_paragraph(doc, "چک‌لیست استنادپذیری هوش مصنوعی شامل ساختار Schema.org، نشانی فیزیکی معتبر، شفافیت نویسندگان و عدم وجود خطاهای پیوند.", bold_prefix="۵. سئوی هوش مصنوعی (GEO): ")

    # ================= CHAPTER 8 =================
    add_rtl_heading(doc, "فصل هشتم: امنیت سیستم، حفاظت از داده‌ها و مدیریت خطا", level=1)
    add_rtl_paragraph(doc, "زیرساخت امنیتی پلتفرم برای مقابله با حملات متداول وب و سوءاستفاده‌های همزمان مقاوم‌سازی شده است:")
    
    sec_points = [
        ("محدودسازی نرخ درخواست (Rate Limiting)", "مسیرهای حساس ورود و ثبت‌نام به ۱۰ تلاش در دقیقه و فرم‌های تماس به ۵ ارسال در دقیقه محدود شده‌اند تا از حملات Brute Force و اسپم جلوگیری شود."),
        ("جلوگیری از تزریق اسکریپت (XSS Protection)", "تمام ورودی‌های آدرس و متون در بک‌اند ضدعفونی شده و تگ‌های اسکریپتی حذف می‌شوند."),
        ("اعتبارسنجی URL و ضد SSRF", "لینک‌های نقشه و پیوندهای خارجی الزاماً باید از پروتکل HTTPS استفاده کنند و پروتکل‌های داخلی یا اسکریپتی مسدود هستند."),
        ("ایزولاسیون کامل داده‌ها (Zero IDOR)", "دسترسی کاربران به استعلام‌ها و نوتیفیکیشن‌های یکدیگر در لایه ORM با فیلتر کاربری اکیداً مسدود شده است."),
        ("ثبت وقایع امنیتی (Audit Log)", "هرگونه تغییر وضعیت، تغییر دسترسی، ورود و حذف در جدول ActivityLog همراه با IP و User-Agent ثبت می‌گردد."),
    ]
    for title, desc in sec_points:
        add_rtl_paragraph(doc, desc, bold_prefix=f"▪ {title}: ")

    # ================= CHAPTER 9 =================
    add_rtl_heading(doc, "فصل نهم: چک‌لیست‌های عملیاتی دوره‌ای", level=1)
    add_rtl_paragraph(doc, "جهت حفظ کیفیت پایدار پلتفرم، مسئول هر نقش موظف است چک‌لیست‌های زیر را در بازه‌های زمانی مشخص به انجام برساند:")

    checklists = [
        ("چک‌لیست روزانه پشتیبانی و فروش", "بررسی استعلام‌های جدید در /admin/inquiries، پاسخ به پیام‌های تماس در /admin/contacts و تعیین وضعیت تیکت‌های در حال اقدام."),
        ("چک‌لیست هفتگی مدیر محتوا و سئو", "بررسی امتیاز سلامت سئو در /admin/seo، پایش مقالات جدید و تایید عدم وجود متادیتای خالی، بررسی نقشه سایت داینامیک."),
        ("چک‌لیست هفتگی مدیر فنی و محصولات", "بررسی موجودی کاتالوگ، کنترل صحت پیوندهای دانلود دیتاشیت‌ها و بازبینی فرمول‌های ماشین‌حساب خورشیدی."),
        ("چک‌لیست ماهانه مدیر ارشد سیستم", "بازبینی لاگ‌های امنیتی در /admin/activity-log، پایش وضعیت کاربران فعال، بررسی لاگ‌های سرور و تست بازخوانی فایل‌های پشتیبان."),
    ]
    for title, desc in checklists:
        add_rtl_paragraph(doc, desc, bold_prefix=f"✅ {title}: ")

    # ================= CHAPTER 10 =================
    add_rtl_heading(doc, "فصل دهم: راهنمای عیب‌یابی و واکنش به حوادث", level=1)
    
    trouble_data = [
        ("خطای ۴۰۱ یا خروج ناگهانی", "انقضای توکن JWT یا نامعتبر بودن نشست", "ورود مجدد از طریق صفحه /login و اطمینان از صحت زمان سرور"),
        ("خطای ۴۰۳ Forbidden", "عدم کفایت سطح دسترسی نقش کاربر", "بررسی نقش حساب با مدیر ارشد طبق ماتریس فصل دوم"),
        ("خطای ۴۲۹ Too Many Requests", "تجاوز از حد مجاز نرخ ارسال درخواست", "صبر به مدت ۶۰ ثانیه جهت بازنشانی باکت ریت‌لیمیت سرور"),
        ("عدم نمایش تصویر در سایت", "آدرس‌دهی ناقص یا عدم پیکربندی مدیا", "بررسی وضعیت ذخیره‌سازی رسانه و صحت پیوند در Media Library"),
        ("افت امتیاز سلامت سئو", "انتشار مقاله یا کالای بدون متادیتا", "ورود به تب سلامت در /admin/seo و اصلاح موارد اعلام شده"),
    ]
    build_rtl_table(doc, ["عنوان مشکل / پیام خطا", "علت ریشه‌ای", "اقدام اصلاحی و راه‌حل"], trouble_data)

    add_callout(doc, "در صورت بروز خطاهای بحرانی مانند عدم دسترسی به دیتابیس یا اشکال در پرداخت و استعلام‌های اصلی، فوراً مراتب را به تیم مهندسی نرم‌افزار گزارش دهید و از تغییرات خودسرانه در دیتابیس خودداری نمایید.", title="دستورالعمل گزارش حوادث اضطراری", alert_type="warning")

    # Save to disk
    out_dir = "docs/reports/phase-12.29"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "AbarEnergy-Operations-Manual-FA.docx")
    doc.save(out_path)
    print(f"Successfully generated operations manual at: {out_path}")

if __name__ == "__main__":
    generate_manual()
