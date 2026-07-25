'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Mail, MapPin, Send, Loader2, Clock, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { useLocale } from '@/i18n';
import axiosInstance from '@/api/axios';

const contactSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  subject: z.string().optional(),
  message: z.string().min(10),
  request_type: z.string(),
});
type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);

  const contactOptions = [
    { icon: Phone, title: t('contact.phone_label'), value: '+98 21 1234 5678', desc: 'Sat–Thu, 8:00–17:00' },
    { icon: Mail, title: t('contact.email_label'), value: 'info@abrenv.com', desc: t('contact.reply_time') },
    { icon: MapPin, title: t('contact.address_label'), value: 'Tehran, Iran', desc: 'Visit our office' },
    { icon: Clock, title: t('contact.working_hours'), value: 'Sat–Thu 8:00–17:00', desc: 'IRST (UTC+3:30)' },
  ];
  const form = useForm<ContactForm>({ resolver: zodResolver(contactSchema), defaultValues: { request_type: 'contact' } });

  const onSubmit = async (data: ContactForm) => {
    setLoading(true);
    try {
      await axiosInstance.post('/contact/', data);
      toast.success(t('contact.success'));
      form.reset();
    } catch { toast.error(t('contact.error')); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/10 via-transparent to-black" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/5 rounded-full blur-[150px]" />
        <div className="container-page relative z-10">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-5">{t('contact.get_in_touch')}</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="font-heading text-5xl md:text-7xl font-bold text-white mb-4">{t('contact.title')}</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-white/35 text-base max-w-lg">
            {t('contact.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-28 md:pb-36">
        <div className="container-page">
          <div className="grid lg:grid-cols-5 gap-8 md:gap-12">
            {/* Contact Options */}
            <div className="lg:col-span-2 space-y-4">
              {contactOptions.map((opt, i) => (
                <ScrollReveal key={i} variant="slide-up" delay={i * 0.08}>
                  <div className="p-5 rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm flex items-start gap-4 hover:border-emerald-500/10 transition-all duration-500">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center shrink-0">
                      <opt.icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{opt.value}</p>
                      <p className="text-xs text-white/30 mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <ScrollReveal variant="slide-up">
                <div className="p-6 md:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-lg">
                  <h2 className="font-heading font-semibold text-lg text-white mb-6">{t('contact.form_title')}</h2>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="full_name" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs text-white/50">{t('contact.full_name')}</FormLabel><FormControl><Input className="bg-white/[0.03] border-white/[0.08] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs text-white/50">{t('contact.email')}</FormLabel><FormControl><Input type="email" className="bg-white/[0.03] border-white/[0.08] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs text-white/50">{t('contact.phone')}</FormLabel><FormControl><Input className="bg-white/[0.03] border-white/[0.08] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="request_type" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs text-white/50">{t('contact.request_type')}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="contact">{t('contact.general')}</SelectItem><SelectItem value="consultation">{t('contact.consultation')}</SelectItem><SelectItem value="design_request">{t('contact.design_request')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="subject" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs text-white/50">{t('contact.subject')}</FormLabel><FormControl><Input className="bg-white/[0.03] border-white/[0.08] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="message" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs text-white/50">{t('contact.message')}</FormLabel><FormControl><Textarea rows={5} className="bg-white/[0.03] border-white/[0.08] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white active:scale-[0.97] transition-all h-11" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> {t('contact.send')}</>}
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
      <section className="pb-28 md:pb-36 border-t border-white/[0.03]">
        <div className="container-page">
          <ScrollReveal variant="fade">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-4">{t('contact.trust_label')}</p>
              <h2 className="font-heading text-3xl font-bold text-white">{t('contact.trust_title')}</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Shield, value: '25 MW+', label: t('home.stats_capacity') },
              { icon: Sparkles, value: '150+', label: t('home.stats_projects') },
              { icon: Clock, value: '10+', label: t('home.stats_experience') },
              { icon: MapPin, value: '98%', label: t('home.stats_satisfaction') },
            ].map((s, i) => (
              <ScrollReveal key={i} variant="slide-up" delay={i * 0.08}>
                <div className="p-5 rounded-xl border border-white/[0.04] bg-white/[0.02] text-center">
                  <s.icon className="h-5 w-5 text-emerald-400/60 mx-auto mb-2" />
                  <p className="font-heading font-bold text-lg text-white">{s.value}</p>
                  <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-28 md:pb-36 border-t border-white/[0.03]">
        <div className="container-page max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-4">{t('contact.faq_label')}</p>
            <h2 className="font-heading text-3xl font-bold text-white">{t('contact.faq_title')}</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: t('contact.faq_q1'), a: t('contact.faq_a1') },
              { q: t('contact.faq_q2'), a: t('contact.faq_a2') },
              { q: t('contact.faq_q3'), a: t('contact.faq_a3') },
              { q: t('contact.faq_q4'), a: t('contact.faq_a4') },
            ].map((faq, i) => (
              <details key={i} className="group p-5 rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm">
                <summary className="text-sm font-medium text-white cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-emerald-400/60 transition-transform duration-300">+</span>
                </summary>
                <p className="text-sm text-white/35 mt-3 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
