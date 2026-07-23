'use client';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Bell } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCalcHistory } from '@/hooks/use-api';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: history } = useCalcHistory();
  const calculations = Array.isArray(history?.results) ? history.results : [];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4"><User className="h-6 text-green-600" /><CardTitle className="text-lg">Profile</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold">{user?.full_name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Link href="/dashboard/profile"><Button variant="link" size="sm" className="px-0">Edit Profile</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4"><Bell className="h-6 text-green-600" /><CardTitle className="text-lg">Notifications</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Stay updated</p>
            <Link href="/dashboard/notifications"><Button variant="link" size="sm" className="px-0">View All</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4"><User className="h-6 text-green-600" /><CardTitle className="text-lg">Calculations</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{calculations.length}</p>
            <p className="text-sm text-muted-foreground">Saved calculations</p>
          </CardContent>
        </Card>
      </div>

      {calculations.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Calculation History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calculations.slice(0, 10).map((c: Record<string, unknown>) => (
                <div key={c.id as string} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="font-medium">{c.city as string} - {(c as { system_type: string }).system_type}</p>
                    <p className="text-sm text-muted-foreground">{new Date(c.created_at as string).toLocaleDateString('fa-IR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{(c as { daily_consumption: number }).daily_consumption} kWh</p>
                    <p className="text-sm text-muted-foreground">{(c as { roi_years: number }).roi_years} yrs ROI</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
