'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Mail, MapPin, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { contactApi } from '@/api';

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
  const [loading, setLoading] = useState(false);
  const form = useForm<ContactForm>({ resolver: zodResolver(contactSchema), defaultValues: { request_type: 'contact' } });

  const onSubmit = async (data: ContactForm) => {
    setLoading(true);
    try {
      await contactApi.submit(data as unknown as Record<string, unknown>);
      toast.success('Message sent! We will contact you soon.');
      form.reset();
    } catch { toast.error('Failed to send message'); }
    finally { setLoading(false); }
  };

  return (
    <div className="py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact <span className="text-green-600">Us</span></h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Get in touch for inquiries, consultations, or project requests</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {[
            { icon: Phone, title: 'Phone', value: '+98 21 1234 5678' },
            { icon: Mail, title: 'Email', value: 'info@abrenv.com' },
            { icon: MapPin, title: 'Address', value: 'Tehran, Iran' },
          ].map((c) => (
            <Card key={c.title}><CardContent className="p-6 text-center">
              <c.icon className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold">{c.title}</h3>
              <p className="text-sm text-muted-foreground">{c.value}</p>
            </CardContent></Card>
          ))}
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="full_name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="request_type" render={({ field }) => (
                    <FormItem><FormLabel>Request Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="contact">General Inquiry</SelectItem><SelectItem value="consultation">Consultation</SelectItem><SelectItem value="design_request">Design Request</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem><FormLabel>Message</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <><Send className="h-4 mr-2" />Send Message</>}</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
