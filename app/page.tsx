'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDatabase } from '@/contexts/DatabaseContext';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  const { database } = useDatabase();
  const router = useRouter();

  useEffect(() => {
    if (database) {
      router.replace('/dashboard');
    }
  }, [database, router]);

  return <LandingPage />;
}
