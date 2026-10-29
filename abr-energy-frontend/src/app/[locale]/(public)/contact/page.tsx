'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Mail, MapPin, Send, Loader2, Shield, Sparkles, Wrench, Leaf } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { InternalPageShell, InternalPageHeader } from '@/components/shared';
import { useLocale } from '@/i18n';
import axiosInstance from '@/api/axios';
import type { SiteSettings } from '@/types';

const normalizePersianDigits = (str: string) => {
  const map: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  return str.replace(/[۰-۹٠-٩]/g, (char) => map[char] || char);
};

const contactSchema = z.object({
  full_name: z.string().min(2, 'لطفاً نام و نام خانوادگی را وارد کنید'),
  email: z.string().email('لطفاً یک ایمیل معتبر وارد کنید'),
  phone: z.string().refine((val) => {
    const cleaned = normalizePersianDigits(val).replace(/[\s\-\(\)]+/g, '');
    const digits = cleaned.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }, 'لطفاً شماره تماس معتبر وارد کنید'),
  subject: z.string().optional(),
  message: z.string().min(5, 'متن پیام باید حداقل ۵ نویسه باشد'),
  request_type: z.string(),
});
type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ['site-settings'],
    queryFn: () => axiosInstance.get('/site-config/').then((response) => response.data),
    staleTime: 5 * 60 * 1000,
  });

  // Only render contact details the CMS actually provides. The public page
  // must not invent a phone number, email address, office, or working hours.
  const contactOptions = [
    settings?.phone_number
      ? { icon: Phone, title: t('contact.phone_label'), value: settings.phone_number }
      : null,
    settings?.phone_number_2
      ? { icon: Phone, title: t('contact.phone_label'), value: settings.phone_number_2 }
      : null,
    settings?.email
      ? { icon: Mail, title: t('contact.email_label'), value: settings.email }
      : null,
    settings?.address
      ? { icon: MapPin, title: t('contact.address_label'), value: settings.address }
      : null,
  ].filter((option): option is NonNullable<typeof option> => option !== null);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { request_type: 'contact', full_name: '', email: '', phone: '', subject: '', message: '' },
  });

  const onSubmit = async (data: ContactForm) => {
    setLoading(true);
    try {
      const normalizedPayload = {
        ...data,
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: normalizePersianDigits(data.phone).replace(/[\s\-\(\)]+/g, ''),
        message: data.message.trim(),
        subject: data.subject?.trim() || '',
      };
      await axiosInstance.post('/contact/', normalizedPayload);
      toast.success(t('contact.success'));
      form.reset({ request_type: 'contact', full_name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: unknown) {
      // Preserve form values on failure
      const apiErr = err as { response?: { data?: { errors?: Record<string, string[]>; detail?: string } } };
      const fieldErrors = apiErr.response?.data?.errors;
      const detail = apiErr.response?.data?.detail;
      if (fieldErrors) {
        const firstField = Object.keys(fieldErrors)[0];
        const errorMsg = fieldErrors[firstField]?.[0] || t('contact.error');
        toast.error(errorMsg);
      } else if (detail) {
        toast.error(detail);
      } else {
        toast.error(t('contact.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <InternalPageShell>
      {/* Header */}
      <section className="relative overflow-hidden pb-6 pt-4 sm:pb-8 sm:pt-6">
        <div className="container-page relative z-10">
          <InternalPageHeader
            breadcrumbs={[
              { label: t('common.back_home'), href: '/' },
              { label: t('contact.title') },
            ]}
            eyebrow={t('contact.get_in_touch')}
            title={t('contact.title')}
            subtitle={t('contact.subtitle')}
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20 md:pb-28">
        <div className="container-page">
          <div className="grid lg:grid-cols-5 gap-8 md:gap-12 items-start">
            {/* Contact Options */}
            <div className="lg:col-span-2 space-y-4">
              {contactOptions.length === 0 ? (
                <div className="p-6 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-3" />
                  <p className="text-sm leading-7 text-muted-foreground">{t('contact.details_unavailable')}</p>
                </div>
              ) : (
                contactOptions.map((opt, i) => (
                  <ScrollReveal key={i} variant="slide-up" delay={i * 0.08}>
                    <div className="p-5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm flex items-start gap-4 hover:border-emerald-500/30 transition-all duration-300 shadow-xs">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <opt.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{opt.title}</p>
                        <p className="text-sm font-medium text-foreground mt-0.5 dir-ltr text-right">{opt.value}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))
              )}
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <ScrollReveal variant="slide-up">
                <div className="p-6 md:p-8 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md shadow-sm">
                  <h2 className="font-heading font-semibold text-lg text-foreground mb-6">{t('contact.form_title')}</h2>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-foreground/80">{t('contact.full_name')}</FormLabel>
                              <FormControl>
                                <Input className="bg-background/80 border-input text-foreground" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-foreground/80">{t('contact.email')}</FormLabel>
                              <FormControl>
                                <Input type="email" className="bg-background/80 border-input text-foreground" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-foreground/80">{t('contact.phone')}</FormLabel>
                              <FormControl>
                                <Input className="bg-background/80 border-input text-foreground" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="request_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-foreground/80">{t('contact.request_type')}</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-background/80 border-input text-foreground">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="contact">{t('contact.general')}</SelectItem>
                                  <SelectItem value="consultation">{t('contact.consultation')}</SelectItem>
                                  <SelectItem value="design_request">{t('contact.design_request')}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-foreground/80">{t('contact.subject')}</FormLabel>
                            <FormControl>
                              <Input className="bg-background/80 border-input text-foreground" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-foreground/80">{t('contact.message')}</FormLabel>
                            <FormControl>
                              <Textarea rows={5} className="bg-background/80 border-input text-foreground" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-medium active:scale-[0.98] transition-all h-11"
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 ml-2 rtl:ml-2 rtl:mr-0" /> {t('contact.send')}</>}
                      </Button>
                    </form>
                  </Form>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 md:py-24 border-t border-border/60">
        <div className="container-page">
          <ScrollReveal variant="fade">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.25em] mb-3">{t('contact.trust_label')}</p>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{t('contact.trust_title')}</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Shield, title: t('services.advantage_reliability'), desc: t('services.advantage_reliability_desc') },
              { icon: Sparkles, title: t('services.advantage_efficiency'), desc: t('services.advantage_efficiency_desc') },
              { icon: Wrench, title: t('services.step_optimization'), desc: t('services.step_optimization_desc') },
              { icon: Leaf, title: t('services.advantage_sustainability'), desc: t('services.advantage_sustainability_desc') },
            ].map((s, i) => (
              <ScrollReveal key={i} variant="slide-up" delay={i * 0.08}>
                <div className="h-full p-5 rounded-xl border border-border/70 bg-card/50 text-center hover:border-emerald-500/30 transition-all shadow-xs">
                  <s.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                  <p className="font-heading font-bold text-base text-foreground">{s.title}</p>
                  <p className="text-xs leading-6 text-muted-foreground mt-1">{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 border-t border-border/60">
        <div className="container-page max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.25em] mb-3">{t('contact.faq_label')}</p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{t('contact.faq_title')}</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: t('contact.faq_q1'), a: t('contact.faq_a1') },
              { q: t('contact.faq_q2'), a: t('contact.faq_a2') },
              { q: t('contact.faq_q3'), a: t('contact.faq_a3') },
              { q: t('contact.faq_q4'), a: t('contact.faq_a4') },
            ].map((faq, i) => (
              <details key={i} className="group p-5 rounded-xl border border-border/70 bg-card/50 backdrop-blur-sm transition-colors hover:border-border">
                <summary className="text-sm font-medium text-foreground cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </InternalPageShell>
  );
}
