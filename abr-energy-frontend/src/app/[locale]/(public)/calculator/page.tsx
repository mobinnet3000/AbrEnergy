'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Calculator, Loader2, BarChart3, DollarSign, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import axiosInstance from '@/api/axios';

const calcSchema = z.object({
  daily_consumption: z.coerce.number().positive(),
  city: z.string().min(2),
  irradiation: z.coerce.number().positive(),
  battery_type: z.string(),
  system_type: z.string(),
});
type CalcResult = { panel_capacity: number; panel_count: number; battery_capacity: number; inverter_power: number; estimated_cost: number; roi_years: number };

export default function CalculatorPage() {
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useForm<any>({ resolver: zodResolver(calcSchema), defaultValues: { daily_consumption: 30, city: 'Tehran', irradiation: 5, battery_type: 'lithium', system_type: 'off_grid' } });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/calculator/off-grid/', data);
      setResult(res.data.result);
      toast.success('Calculation completed');
    } catch {
      toast.error('Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('fa-IR').format(v);

  return (
    <div className="py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <Calculator className="h-12 w-12 mx-auto mb-4 text-green-600" />
          <h1 className="text-4xl font-bold mb-4">Solar <span className="text-green-600">Calculator</span></h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Estimate your off-grid solar system requirements</p>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <Card>
            <CardHeader><CardTitle>Input Parameters</CardTitle><CardDescription>Enter your energy consumption details</CardDescription></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="daily_consumption" render={({ field }) => (
                    <FormItem><FormLabel>Daily Consumption (kWh)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Tehran" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="irradiation" render={({ field }) => (
                    <FormItem><FormLabel>Solar Irradiation (kWh/m²/day)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="5.0" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="battery_type" render={({ field }) => (
                    <FormItem><FormLabel>Battery Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="lithium">Lithium</SelectItem><SelectItem value="lead_acid">Lead Acid</SelectItem><SelectItem value="tubular">Tubular</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="system_type" render={({ field }) => (
                    <FormItem><FormLabel>System Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="off_grid">Off Grid</SelectItem><SelectItem value="on_grid">On Grid</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Calculate'}</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {result && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 text-green-600" />Solar System Results</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg"><Sun className="h-6 mb-1 text-green-600" /><div className="text-2xl font-bold">{result.panel_count}</div><div className="text-xs text-muted-foreground">Panels Needed</div></div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg"><Zap className="h-6 mb-1 text-blue-600" /><div className="text-2xl font-bold">{result.panel_capacity}</div><div className="text-xs text-muted-foreground">Panel Capacity (kW)</div></div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg"><BarChart3 className="h-6 mb-1 text-purple-600" /><div className="text-2xl font-bold">{result.battery_capacity.toFixed(1)}</div><div className="text-xs text-muted-foreground">Battery (Ah)</div></div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg"><Zap className="h-6 mb-1 text-amber-600" /><div className="text-2xl font-bold">{result.inverter_power}</div><div className="text-xs text-muted-foreground">Inverter (kW)</div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg"><DollarSign className="h-6 mb-1 text-emerald-600" /><div className="text-2xl font-bold">{formatCurrency(result.estimated_cost)}</div><div className="text-xs text-muted-foreground">Estimated Cost (IRR)</div></div>
                    <div className="p-4 bg-rose-50 dark:bg-rose-950 rounded-lg"><Clock className="h-6 mb-1 text-rose-600" /><div className="text-2xl font-bold">{result.roi_years}</div><div className="text-xs text-muted-foreground">ROI (Years)</div></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
