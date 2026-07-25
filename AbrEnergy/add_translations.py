import json
import os

os.chdir(r'C:\Users\meck\Documents\abar\abr-energy-frontend')

# Translation values for each key
values = {
    'common.back_home': ('Back to Home', 'بازگشت به خانه', 'العودة إلى الرئيسية'),
    'common.toggle_theme': ('Toggle theme', 'تغییر تم', 'تبديل السمة'),
    'common.close_menu': ('Close menu', 'بستن منو', 'إغلاق القائمة'),
    'common.open_menu': ('Open menu', 'باز کردن منو', 'فتح القائمة'),
    'about.back': ('Back to Home', 'بازگشت به خانه', 'العودة إلى الرئيسية'),
    'about.subtitle': ('About AbrEnergy', 'درباره ابر انرژی', 'عن أبر إنيرجي'),
    'about.get_in_touch': ('Get in Touch', 'تماس بگیرید', 'تواصل معنا'),
    'about.values_label': ('What We Stand For', 'ارزش‌های ما', 'ما نؤمن بـ'),
    'about.values_title': ('Our Values', 'ارزش‌ها', 'قيمنا'),
    'about.values_desc': ('Engineering excellence for renewable energy.', 'برتری مهندسی در انرژی تجدیدپذیر.', 'التميز الهندسي في الطاقة المتجددة.'),
    'about.value_clean_energy': ('Clean Energy', 'انرژی پاک', 'الطاقة النظيفة'),
    'about.value_clean_energy_desc': ('Making clean energy accessible.', 'ارائه انرژی پاک برای همگان.', 'جعل الطاقة النظيفة متاحة للجميع.'),
    'about.value_innovation': ('Innovation', 'نوآوری', 'الابتكار'),
    'about.value_innovation_desc': ('Advancing solar technology.', 'پیشرفت فناوری خورشیدی.', 'تقدم تقنية الطاقة الشمسية.'),
    'about.value_sustainability': ('Sustainability', 'پایداری', 'الاستدامة'),
    'about.value_sustainability_desc': ('Long-term sustainability.', 'پایداری بلندمدت.', 'الاستدامة طويلة الأمد.'),
    'about.value_reliability': ('Reliability', 'قابلیت اطمینان', 'الموثوقية'),
    'about.value_reliability_desc': ('Highest quality standards.', 'بالاترین استانداردها.', 'أعلى معايير الجودة.'),
    'about.story_label': ('Our Story', 'داستان ما', 'قصتنا'),
    'about.story_title_1': ('Who We Are', 'ما کیستیم', 'من نحن'),
    'about.story_desc_1': ('A leading solar energy company.', 'یک شرکت پیشرو در انرژی خورشیدی.', 'شركة رائدة في الطاقة الشمسية.'),
    'about.story_title_2': ('Our Mission', 'ماموریت ما', 'مهمتنا'),
    'about.story_desc_2': ('Accelerating renewable energy transition.', 'تسریع گذار به انرژی تجدیدپذیر.', 'تسريع التحول نحو الطاقة المتجددة.'),
    'about.story_title_3': ('Technology Advantage', 'مزیت فناوری', 'الميزة التقنية'),
    'about.story_desc_3': ('Cutting-edge solar technology.', 'فناوری پیشرفته خورشیدی.', 'تقنيات شمسية متطورة.'),
    'about.journey_label': ('Our Journey', 'مسیر ما', 'رحلتنا'),
    'about.journey_title': ('Company Milestones', 'دستاوردهای شرکت', 'إنجازات الشركة'),
    'about.milestone_1_title': ('Founded', 'تأسیس', 'التأسيس'),
    'about.milestone_1_desc': ('Company established.', 'شرکت تأسیس شد.', 'تأسيس الشركة.'),
    'about.milestone_2_title': ('First 1MW', 'اولین ۱ مگاوات', 'أول 1 ميجاواط'),
    'about.milestone_2_desc': ('First megawatt installation.', 'اولین نصب مگاواتی.', 'أول تثبيت ميجاواط.'),
    'about.milestone_3_title': ('50 Projects', '۵۰ پروژه', '50 مشروع'),
    'about.milestone_3_desc': ('50 projects milestone.', 'رسیدن به ۵۰ پروژه.', '50 مشروعاً مكتملاً.'),
    'about.milestone_4_title': ('International', 'بین‌المللی', 'دولي'),
    'about.milestone_4_desc': ('International expansion.', 'گسترش بین‌المللی.', 'التوسعة الدولية.'),
    'about.milestone_5_title': ('25MW Installed', 'نصب ۲۵ مگاوات', 'تركيب 25 ميجاواط'),
    'about.milestone_5_desc': ('25MW capacity.', '۲۵ مگاوات ظرفیت.', '25 ميجاواط.'),
    'about.impact_label': ('Our Impact', 'تأثیر ما', 'تأثيرنا'),
    'about.impact_title': ('Making a Difference', 'تاثیرگذاری', 'عمل فرق'),
    'about.impact_environmental': ('Environmental', 'زیست‌محیطی', 'بيئي'),
    'about.impact_environmental_desc': ('Solar installations offset CO₂.', 'نصب‌های خورشیدی CO₂ را جبران می‌کنند.', 'تثبيتاتنا الشمسية تعوض CO₂.'),
    'about.impact_technology': ('Technology', 'فناوری', 'التكنولوجيا'),
    'about.impact_technology_desc': ('Advancing solar technology.', 'پیشرفت فناوری خورشیدی.', 'تقدم تقنية الطاقة الشمسية.'),
    'about.impact_future': ('Future Vision', 'چشم‌انداز آینده', 'رؤية المستقبل'),
    'about.impact_future_desc': ('Smart grid and energy storage.', 'شبکه هوشمند و ذخیره‌سازی انرژی.', 'الشبكة الذكية وتخزين الطاقة.'),
    'about.cta_title': ('Ready to Work With Us?', 'آماده‌اید با ما کار کنید؟', 'هل أنتم مستعدون للعمل معنا؟'),
    'about.cta_desc': ('Contact our team.', 'با تیم ما تماس بگیرید.', 'تواصل مع فريقنا.'),
    'services.back': ('Back to Services', 'بازگشت به خدمات', 'العودة إلى الخدمات'),
    'services.overview': ('Overview', 'مرور', 'نظرة عامة'),
    'services.features': ('Key Features', 'ویژگی‌های کلیدی', 'الميزات الرئيسية'),
    'services.how_we_work': ('How We Work', 'نحوه کار ما', 'كيف نعمل'),
    'services.process': ('Our Process', 'فرآیند ما', 'عمليتنا'),
    'services.technical_advantages': ('Technical Advantages', 'مزیت‌های فنی', 'المزايا التقنية'),
    'services.why_choose_us': ('Why Choose Us', 'چرا ما را انتخاب کنید', 'لماذا تختارنا'),
    'services.cta_title': ('Interested in This Service?', 'به این خدمت علاقه‌مندید؟', 'هل أنت مهتم بهذا الخدمة؟'),
    'services.cta_desc': ('Contact our team to discuss.', 'با تیم ما تماس بگیرید.', 'تواصل مع فريقنا.'),
    'services.step_consultation': ('Consultation', 'مشاوره', 'الاستشارة'),
    'services.step_consultation_desc': ('We assess your needs.', 'ما نیازهای شما را ارزیابی می‌کنیم.', 'نقوم بتقييم احتياجاتك.'),
    'services.step_design': ('Design', 'طراحی', 'التصميم'),
    'services.step_design_desc': ('Detailed system design.', 'طراحی دقیق سیستم.', 'تصميم نظام مفصل.'),
    'services.step_implementation': ('Implementation', 'اجرا', 'التنفيذ'),
    'services.step_implementation_desc': ('Professional installation.', 'نصب حرفه‌ای.', 'تثبيت احترافي.'),
    'services.step_optimization': ('Optimization', 'بهینه‌سازی', 'التحسين'),
    'services.step_optimization_desc': ('Post-installation monitoring.', 'نظارت پس از نصب.', 'مراقبة ما بعد التثبيت.'),
    'services.advantage_efficiency': ('Efficiency', 'بازدهی', 'الكفاءة'),
    'services.advantage_efficiency_desc': ('Maximize energy capture.', 'حداکثر جذب انرژی.', 'تعظيم التقاط الطاقة.'),
    'services.advantage_reliability': ('Reliability', 'قابلیت اطمینان', 'الموثوقية'),
    'services.advantage_reliability_desc': ('Premium components and warranties.', 'قطعات ممتاز و گارانتی‌ها.', 'أفضل المكونات والضمانات.'),
    'services.advantage_sustainability': ('Sustainability', 'پایداری', 'الاستدامة'),
    'services.advantage_sustainability_desc': ('Long-term environmental sustainability.', 'پایداری زیست‌محیطی بلندمدت.', 'الاستدامة طويلة الأمد.'),
    'articles.back': ('Back to Articles', 'بازگشت به مقالات', 'العودة إلى المقالات'),
    'articles.table_of_contents': ('Contents', 'فهرست مطالب', 'المحتويات'),
    'articles.cta_title': ('Interested in Solar Energy?', 'به انرژی خورشیدی علاقه‌مندید؟', 'هل أنت مهتم بالطاقة الشمسية؟'),
    'articles.cta_desc': ('Contact our team.', 'با تیم ما تماس بگیرید.', 'تواصل مع فريقنا.'),
    'articles.related': ('Related Articles', 'مقالات مرتبط', 'مقالات ذات صلة'),
    'projects.back': ('Back to Projects', 'بازگشت به پروژه‌ها', 'العودة إلى المشاريع'),
    'projects.case_study': ('Case Study', 'مطالعه موردی', 'دراسة الحالة'),
    'projects.overview': ('Overview', 'مرور', 'نظرة عامة'),
    'projects.technical_details': ('Technical Details', 'جزئیات فنی', 'التفاصيل التقنية'),
    'projects.metrics': ('Project Metrics', 'شاخص‌های پروژه', 'مقاييس المشروع'),
    'projects.gallery_label': ('Gallery', 'گالری', 'المعرض'),
    'projects.photos': ('Project Photos', 'تصاویر پروژه', 'صور المشروع'),
    'projects.cta_title': ('Interested in Similar Projects?', 'به پروژه‌های مشابه علاقه‌مندید؟', 'هل تهتم بمشاريع مشابهة؟'),
    'projects.cta_button': ('Start Your Project', 'پروژه خود را شروع کنید', 'ابدأ مشروعك'),
    'calculator.tool_label': ('Solar Calculator', 'ماشین حساب خورشیدی', 'الحاسبة الشمسية'),
    'calculator.input_parameters': ('Input Parameters', 'پارامترهای ورودی', 'المعاملات المدخلة'),
    'calculator.request_consultation': ('Request Consultation', 'درخواست مشاوره', 'طلب استشارة'),
    'calculator.placeholder_hint': ('Enter your parameters', 'پارامترها را وارد کنید', 'أدخل المعاملات'),
    'contact.get_in_touch': ('Get in Touch', 'تماس بگیرید', 'تواصل معنا'),
    'contact.form_title': ('Send Us a Message', 'پیام خود را ارسال کنید', 'أرسل لنا رسالة'),
    'contact.send': ('Send Message', 'ارسال پیام', 'إرسال الرسالة'),
    'contact.trust_label': ('Why Choose Us', 'چرا ما را انتخاب کنید', 'لماذا تختارنا'),
    'contact.trust_title': ('Trusted Solar Partner', 'شریک قابل اعتماد', 'شريك موثوق'),
    'contact.faq_label': ('FAQ', 'پرسش‌های متداول', 'أسئلة شائعة'),
    'contact.faq_title': ('Frequently Asked Questions', 'پرسش‌های متداول', 'الأسئلة الشائعة'),
    'contact.faq_q1': ('What types of installations?', 'چه نوع نصب‌هایی؟', 'ما هي أنواع التثبيتات؟'),
    'contact.faq_a1': ('Residential, commercial, and industrial.', 'مسکونی، تجاری و صنعتی.', 'سكنية وتجارية وصناعية.'),
    'contact.faq_q2': ('How long does installation take?', 'نصب چقدر طول می‌کشد؟', 'كم يستغرق التثبيت؟'),
    'contact.faq_a2': ('2-5 days residential, 1-4 weeks commercial.', '۲ تا ۵ روز مسکونی.', '2-5 أيام سكنية.'),
    'contact.faq_q3': ('Do you provide maintenance?', 'آیا نگهداری ارائه می‌دهید؟', 'هل تقدمون صيانة؟'),
    'contact.faq_a3': ('Yes, comprehensive packages.', 'بله، بسته‌های جامع.', 'نعم، باقات شاملة.'),
    'contact.faq_q4': ('What warranty do you offer?', 'چه گارانتی‌ای دارید؟', 'ما هي الضمانات؟'),
    'contact.faq_a4': ('25-year panel warranty.', 'گارانتی ۲۵ ساله پنل.', 'ضمان 25 سنة.'),
    'footer.company': ('Company', 'شرکت', 'الشركة'),
    'footer.privacy': ('Privacy', 'حریم خصوصی', 'الخصوصية'),
    'footer.terms': ('Terms', 'شرایط', 'الشروط'),
}

# Load and update each file
for lang in ['en', 'fa', 'ar']:
    filepath = f'locales/{lang}.json'
    with open(filepath, encoding='utf-8') as f:
        data = json.load(f)
    
    lang_idx = {'en': 0, 'fa': 1, 'ar': 2}
    idx = lang_idx[lang]
    
    for key, vals in values.items():
        parts = key.split('.', 1)
        section = parts[0]
        name = parts[1] if len(parts) > 1 else None
        if section not in data:
            data[section] = {}
        if name:
            data[section][name] = vals[idx]
        else:
            data[section] = vals[idx]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f'Updated {filepath} ({len(values)} keys)')

print('Done')
