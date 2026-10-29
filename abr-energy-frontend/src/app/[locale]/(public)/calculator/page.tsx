'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Calculator, Loader2, BarChart3, DollarSign, Zap, Clock, Leaf, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { InternalPageShell, InternalPageHeader } from '@/components/shared';
import { useLocale } from '@/i18n';
import axiosInstance from '@/api/axios';

const calcSchema = z.object({
  daily_consumption: z.coerce.number().positive(),
  city: z.string().min(2),
  irradiation: z.coerce.number().positive(),
  battery_type: z.string(),
  system_type: z.string(),
});
type CalcResult = {
  panel_capacity: number;
  panel_count: number;
  battery_capacity: number;
  inverter_power: number;
  estimated_cost: number;
  roi_years: number;
};

const formatCurrency = (v: number) => new Intl.NumberFormat('fa-IR').format(v);

function ResultCard({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: string; label: string }) {
  return (
    <div className="p-3 sm:p-4 md:p-5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm text-center shadow-xs min-w-0 overflow-hidden">
      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5 sm:mb-2 shrink-0" />
      <p className="text-sm sm:text-base md:text-xl font-bold font-heading text-foreground truncate">{value}</p>
      <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">{label}</p>
    </div>
  );
}

export default function CalculatorPage() {
  const { t } = useLocale();
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useForm<any>({
    resolver: zodResolver(calcSchema),
    defaultValues: {
      daily_consumption: 30,
      city: 'Tehran',
      irradiation: 5,
      battery_type: 'lithium',
      system_type: 'off_grid',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/calculator/off-grid/', data);
      setResult(res.data.result);
      toast.success(t('calculator.results'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <InternalPageShell>
      {/* Header */}
      <section className="relative overflow-hidden pb-6 pt-4 sm:pb-8 sm:pt-6">
        <div className="container-page max-w-5xl relative z-10">
          <InternalPageHeader
            breadcrumbs={[
              { label: t('common.back_home'), href: '/' },
              { label: t('nav.calculator_offgrid') },
            ]}
            eyebrow={t('calculator.tool_label')}
            title={t('nav.calculator_offgrid')}
            subtitle={t('calculator.subtitle')}
          />
        </div>
      </section>

      {/* Main Calculator */}
      <section className="pb-20 sm:pb-28 md:pb-36">
        <div className="container-page max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
            {/* Input Form */}
            <ScrollReveal variant="slide-up">
              <div className="p-6 md:p-8 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md shadow-sm">
                <h2 className="font-heading font-semibold text-lg text-foreground mb-6">
                  {t('calculator.input_parameters')}
                </h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="daily_consumption"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-foreground/80">{t('calculator.daily_consumption')}</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" className="bg-background/80 border-input text-foreground" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-foreground/80">{t('calculator.city')}</FormLabel>
                          <FormControl>
                            <Input placeholder="Tehran" className="bg-background/80 border-input text-foreground" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="irradiation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-foreground/80">{t('calculator.irradiation')}</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="5.0" className="bg-background/80 border-input text-foreground" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="battery_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-foreground/80">{t('calculator.battery_type')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background/80 border-input text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="lithium">{t('calculator.lithium')}</SelectItem>
                              <SelectItem value="lead_acid">{t('calculator.lead_acid')}</SelectItem>
                              <SelectItem value="tubular">{t('calculator.tubular')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="system_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-foreground/80">{t('calculator.system_type')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background/80 border-input text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="off_grid">{t('calculator.off_grid')}</SelectItem>
                              <SelectItem value="on_grid">{t('calculator.on_grid')}</SelectItem>
                              <SelectItem value="hybrid">{t('calculator.hybrid')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-medium active:scale-[0.98] transition-all h-11"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Calculator className="h-4 w-4 ml-2 rtl:ml-2 rtl:mr-0" /> {t('calculator.calculate')}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </ScrollReveal>

            {/* Results */}
            <div className="space-y-5">
              {result ? (
                <ScrollReveal variant="scale">
                  <div className="p-6 md:p-8 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md shadow-sm">
                    <h2 className="font-heading font-semibold text-lg text-foreground mb-6 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      {t('calculator.results')}
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      <ResultCard icon={Sun} value={String(result.panel_count)} label={t('calculator.panels')} />
                      <ResultCard icon={Zap} value={String(result.panel_capacity)} label={t('calculator.panel_capacity')} />
                      <ResultCard icon={BarChart3} value={result.battery_capacity.toFixed(1)} label={t('calculator.battery_capacity')} />
                      <ResultCard icon={Zap} value={String(result.inverter_power)} label={t('calculator.inverter_power')} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <ResultCard icon={DollarSign} value={formatCurrency(result.estimated_cost)} label={t('calculator.estimated_cost')} />
                      <ResultCard icon={Clock} value={String(result.roi_years)} label={t('calculator.roi')} />
                    </div>
                    <div className="mt-6 text-center">
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all duration-300 shadow-sm"
                      >
                        {t('calculator.request_consultation')} <Leaf className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              ) : (
                <div className="p-8 md:p-12 rounded-2xl border border-dashed border-border/80 bg-card/40 text-center">
                  <Calculator className="h-12 w-12 text-emerald-600/30 dark:text-emerald-400/20 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">{t('calculator.placeholder_hint')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </InternalPageShell>
  );
}
