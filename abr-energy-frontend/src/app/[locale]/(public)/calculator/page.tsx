'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Calculator, Loader2, BarChart3, DollarSign, Zap, Clock, Leaf, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { useLocale } from '@/i18n';
import axiosInstance from '@/api/axios';

const calcSchema = z.object({
  daily_consumption: z.coerce.number().positive(),
  city: z.string().min(2),
  irradiation: z.coerce.number().positive(),
  battery_type: z.string(),
  system_type: z.string(),
});
type CalcResult = { panel_capacity: number; panel_count: number; battery_capacity: number; inverter_power: number; estimated_cost: number; roi_years: number };

const formatCurrency = (v: number) => new Intl.NumberFormat('fa-IR').format(v);

function ResultCard({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: string; label: string }) {
  return (
    <div className="p-5 rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm text-center">
      <Icon className="h-5 w-5 text-emerald-400/60 mx-auto mb-2" />
      <p className="text-lg md:text-xl font-bold font-heading text-white">{value}</p>
      <p className="text-xs text-white/35 mt-1">{label}</p>
    </div>
  );
}

export default function CalculatorPage() {
  const { t } = useLocale();
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useForm<any>({ resolver: zodResolver(calcSchema), defaultValues: { daily_consumption: 30, city: 'Tehran', irradiation: 5, battery_type: 'lithium', system_type: 'off_grid' } });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/calculator/off-grid/', data);
      setResult(res.data.result);
      toast.success('Calculation completed');
    } catch { toast.error('Calculation failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/10 via-transparent to-black" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="container-page relative z-10">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-semibold text-emerald-400/60 uppercase tracking-[0.25em] mb-5">{t('calculator.tool_label')}</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="font-heading text-5xl md:text-7xl font-bold text-white mb-4">
            Solar <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">Calculator</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-white/35 text-base max-w-lg">Estimate your off-grid solar system requirements</motion.p>
        </div>
      </section>

      {/* Calculator */}
      <section className="pb-28 md:pb-36">
        <div className="container-page max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
            {/* Input Form */}
            <ScrollReveal variant="slide-up">
              <div className="p-6 md:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-lg">
                <h2 className="font-heading font-semibold text-lg text-white mb-6">{t('calculator.input_parameters')}</h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="daily_consumption" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs text-white/50">Daily Consumption (kWh)</FormLabel><FormControl><Input type="number" step="0.1" className="bg-white/[0.03] border-white/[0.08] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs text-white/50">City</FormLabel><FormControl><Input placeholder="Tehran" className="bg-white/[0.03] border-white/[0.08] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="irradiation" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs text-white/50">Solar Irradiation (kWh/m²/day)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="5.0" className="bg-white/[0.03] border-white/[0.08] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="battery_type" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs text-white/50">Battery Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="lithium">Lithium</SelectItem><SelectItem value="lead_acid">Lead Acid</SelectItem><SelectItem value="tubular">Tubular</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="system_type" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs text-white/50">System Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="off_grid">Off Grid</SelectItem><SelectItem value="on_grid">On Grid</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white active:scale-[0.97] transition-all" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Calculator className="h-4 w-4" /> {t('calculator.calculate')}</>}
                    </Button>
                  </form>
                </Form>
              </div>
            </ScrollReveal>

            {/* Results */}
            <div className="space-y-5">
              {result ? (
                <ScrollReveal variant="scale">
                  <div className="p-6 md:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-lg">
                    <h2 className="font-heading font-semibold text-lg text-white mb-6 flex items-center gap-2"><Sparkles className="h-5 text-emerald-400" /> Solar System Results</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <ResultCard icon={Sun} value={String(result.panel_count)} label="Panels Needed" />
                      <ResultCard icon={Zap} value={String(result.panel_capacity)} label="Panel Capacity (kW)" />
                      <ResultCard icon={BarChart3} value={result.battery_capacity.toFixed(1)} label="Battery (Ah)" />
                      <ResultCard icon={Zap} value={String(result.inverter_power)} label="Inverter (kW)" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <ResultCard icon={DollarSign} value={formatCurrency(result.estimated_cost)} label="Estimated Cost (IRR)" />
                      <ResultCard icon={Clock} value={String(result.roi_years)} label="ROI (Years)" />
                    </div>
                    <div className="mt-6 text-center">
                      <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 active:scale-[0.97] transition-all duration-300">
                        {t('calculator.request_consultation')} <Leaf className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              ) : (
                <div className="p-8 md:p-10 rounded-2xl border border-white/[0.04] bg-white/[0.02] text-center">
                  <Calculator className="h-12 w-12 text-emerald-400/20 mx-auto mb-4" />
                  <p className="text-sm text-white/25">{t('calculator.placeholder_hint')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
