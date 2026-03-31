import { useState, useCallback } from 'react';
import { AnalysisState, AnalyzeRequest } from '@/types';
import { marketApi } from '@/services/api';

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    data: null,
    error: null,
  });

  const analyze = useCallback(async (params: AnalyzeRequest) => {
    setState({ status: 'loading', data: null, error: null });
    try {
      const data = await marketApi.analyze(params);
      setState({ status: 'success', data, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setState({ status: 'error', data: null, error: message });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', data: null, error: null });
  }, []);

  return { ...state, analyze, reset };
}
