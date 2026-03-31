'use client';

import { useState, useEffect, useCallback } from 'react';
import { marketApi } from '@/services/api';

export interface HealthState {
  online: boolean;
  tavilyConfigured: boolean;
  checking: boolean;
}

export function useBackendHealth() {
  const [health, setHealth] = useState<HealthState>({
    online: false,
    tavilyConfigured: false,
    checking: true,
  });

  const check = useCallback(async () => {
    try {
      const data = await marketApi.health();
      setHealth({ online: true, tavilyConfigured: data.tavily_configured, checking: false });
    } catch {
      setHealth({ online: false, tavilyConfigured: false, checking: false });
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 20000);
    return () => clearInterval(interval);
  }, [check]);

  return health;
}
