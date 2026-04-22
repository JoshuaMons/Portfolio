'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DatabaseInfo, AnalyticsResult } from '@/types';
import { analyseDatabase } from '@/lib/analytics';

interface DatabaseContextValue {
  database: DatabaseInfo | null;
  analytics: AnalyticsResult | null;
  isLoading: boolean;
  error: string | null;
  loadFile: (file: File) => Promise<void>;
  clearDatabase: () => void;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  database: null,
  analytics: null,
  isLoading: false,
  error: null,
  loadFile: async () => {},
  clearDatabase: () => {},
});

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [database, setDatabase] = useState<DatabaseInfo | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFile(file: File) {
    setIsLoading(true);
    setError(null);
    try {
      const { parseFile } = await import('@/lib/database');
      const info = await parseFile(file);
      const result = analyseDatabase(info.tables);
      setDatabase(info);
      setAnalytics(result);
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  function clearDatabase() {
    setDatabase(null);
    setAnalytics(null);
    setError(null);
  }

  return (
    <DatabaseContext.Provider value={{ database, analytics, isLoading, error, loadFile, clearDatabase }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
