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

const contactOptions = [
  { icon: Phone, title: 'Phone', value: '+98 21 1234 5678', desc: 'Sat–Thu, 8:00–17:00' },
  { icon: Mail, title: 'Email', value: 'info@abrenv.com', desc: 'We reply within 24 hours' },
  { icon: MapPin, title: 'Address', value: 'Tehran, Iran', desc: 'Visit our office' },
  { icon: Clock, title: 'Working Hours', value: 'Sat–Thu 8:00–17:00', desc: 'IRST (UTC+3:30)' },
];

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const form = useForm<ContactForm>({ resolver: zodResolver(contactSchema), defaultValues: { request_type: 'contact' } });

  const onSubmit = async (data: ContactForm) => {
    setLoading(true);
    try {
      await axiosInstance.post('/contact/', data);
      toast.success('Message sent! We will contact you soon.');
      form.reset();
    } catch { toast.error('Failed to send message'); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/10 via-transparent to-black" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/5 rounded-full blur-[150px]" />
        <div className="container-page relative z-10">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-5">Get in Touch</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="font-heading text-5xl md:text-7xl font-bold text-white mb-4">Contact Us</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-white/35 text-base max-w-lg">
            Get in touch for inquiries, consultations, or project requests
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
                  <h2 className="font-heading font-semibold text-lg text-white mb-6">Send Us a Message</h2>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="full_name" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs text-white/50">Full Name</FormLabel><FormControl><Input className="bg-white/[0.03] border-white/[0.08] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs text-white/50">Email</FormLabel><FormControl><Input type="email" className="bg-white/[0.03] border-white/[0.08] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs text-white/50">Phone</FormLabel><FormControl><Input className="bg-white/[0.03] border-white/[0.08] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="request_type" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs text-white/50">Request Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="contact">General Inquiry</SelectItem><SelectItem value="consultation">Consultation</SelectItem><SelectItem value="design_request">Design Request</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="subject" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs text-white/50">Subject</FormLabel><FormControl><Input className="bg-white/[0.03] border-white/[0.08] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="message" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs text-white/50">Message</FormLabel><FormControl><Textarea rows={5} className="bg-white/[0.03] border-white/[0.08] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white active:scale-[0.97] transition-all h-11" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send Message</>}
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
              <p className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-4">Why Choose Us</p>
              <h2 className="font-heading text-3xl font-bold text-white">Trusted Solar Partner</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Shield, value: '25 MW+', label: 'Installed Capacity' },
              { icon: Sparkles, value: '150+', label: 'Completed Projects' },
              { icon: Clock, value: '10+', label: 'Years Experience' },
              { icon: MapPin, value: '98%', label: 'Client Satisfaction' },
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
            <p className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-4">FAQ</p>
            <h2 className="font-heading text-3xl font-bold text-white">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'What types of solar installations do you offer?', a: 'We offer residential, commercial, and industrial solar installations.' },
              { q: 'How long does a typical installation take?', a: 'Residential takes 2-5 days. Commercial projects range from 1-4 weeks.' },
              { q: 'Do you provide maintenance services?', a: 'Yes, we offer comprehensive maintenance packages including monitoring and cleaning.' },
              { q: 'What warranty do you offer?', a: 'We provide a 25-year performance warranty on panels and 5-10 years on inverters.' },
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
