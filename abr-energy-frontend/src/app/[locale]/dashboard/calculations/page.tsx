'use client';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import type { CalculationHistory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calculator, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { useEffect } from 'react';

const costFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

interface HistoryResponse {
  results: CalculationHistory[];
  count: number;
}

export default function CalculationsPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading, error } = useQuery<HistoryResponse>({
    queryKey: ['calc-history'],
    queryFn: () => axiosInstance.get('/calculator/history/').then((r) => r.data),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (error) toast.error('Failed to load calculation history');
  }, [error]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Not Authenticated</h2>
        <p className="text-muted-foreground mb-4">Please log in to view your calculation history.</p>
        <Link href="/login">
          <Button><ArrowLeft className="h-4 w-4 mr-2" />Go to Login</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  if (error) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Failed to load calculation history. Please try again later.
      </div>
    );
  }

  const records = data?.results ?? [];

  if (records.length === 0) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Calculator className="h-12 w-12 mx-auto mb-4 opacity-40" />
        <p>No data</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Calculation History</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Saved Calculations
            <Badge variant="secondary" className="ml-2">{data?.count ?? records.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City</TableHead>
                <TableHead>System Type</TableHead>
                <TableHead className="text-right">Daily Consumption</TableHead>
                <TableHead className="text-right">Estimated Cost</TableHead>
                <TableHead className="text-right">ROI (years)</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.city}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.system_type}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{record.daily_consumption} kWh</TableCell>
                  <TableCell className="text-right font-mono">{costFormat.format(record.estimated_cost)}</TableCell>
                  <TableCell className="text-right">{record.roi_years}</TableCell>
                  <TableCell>{new Date(record.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
