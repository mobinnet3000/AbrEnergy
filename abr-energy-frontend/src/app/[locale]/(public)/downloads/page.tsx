import { Suspense } from 'react';
import { CardLoading } from '@/components/shared';
import DownloadsClient from './downloads-client';

export default function DownloadsPage() {
  return (
    <Suspense fallback={<CardLoading count={4} />}>
      <DownloadsClient />
    </Suspense>
  );
}
