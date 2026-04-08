/**
 * api.ts — All backend calls + localStorage for MarketIQ.
 * Production-safe, fully typed, and deployment-ready.
 */

import {
  AnalyzeRequest,
  AnalyzeResponse,
  SearchHistory,
  BackendHealth,
  Notification,
  NotificationSettings,
  CreateNotificationPayload,
  StoredAnalysis,
  TimelinePoint,
  GeminiInsights,
} from '@/types';

import {
  storageGet,
  storageSet,
  storageRemove,
  analysisStorageKey,
  getAnalysisIndex,
  updateAnalysisIndex,
  isValidStoredAnalysis,
} from '@/utils/storage';

/* ✅ SAFE BASE URL */
const BASE = () => {
  if (typeof window !== 'undefined') {
    const saved = storageGet<string>('miq_api_url');
    if (saved) return saved;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
};

/* ✅ PRODUCTION-SAFE FETCH WITH TIMEOUT */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${BASE()}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const e = await res.json();
        msg = e.detail || msg;
      } catch {}
      throw new Error(msg);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/* ── Timeline Builder ───────────────────────── */
function buildTimeline(
  articles: AnalyzeResponse['articles'],
  days: number
): TimelinePoint[] {
  const buckets: Record<
    string,
    { c: number; p: number; n: number }
  > = {};

  const now = Date.now();

  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(now - i * 86400000).toLocaleDateString(
      'en-US',
      { month: 'short', day: 'numeric' }
    );
    buckets[key] = { c: 0, p: 0, n: 0 };
  }

  articles.forEach((a) => {
    const key = new Date(a.publishedAt).toLocaleDateString(
      'en-US',
      { month: 'short', day: 'numeric' }
    );
    if (buckets[key]) {
      buckets[key].c++;
      if (a.sentiment === 'positive') buckets[key].p++;
      if (a.sentiment === 'negative') buckets[key].n++;
    }
  });

  return Object.entries(buckets).map(([date, v]) => ({
    date,
    articles: v.c,
    sentiment: v.c > 0 ? Math.round((v.p / v.c) * 100) : 50,
  }));
}

/* ── Save Analysis ───────────────────────── */
function saveAnalysis(r: AnalyzeResponse) {
  const stored: StoredAnalysis = {
    company: r.company,
    analyzedAt: r.analyzedAt,
    daysAnalyzed: r.daysAnalyzed,
    totalArticles: r.totalArticles,
    summary: r.summary,
    insights: r.insights ?? [],
    riskFlags: r.riskFlags ?? [],
    domainDistribution: r.domainDistribution ?? [],
    domainMatrix: r.domainMatrix,
    sentimentTimeline: buildTimeline(
      r.articles ?? [],
      r.daysAnalyzed
    ),
  };

  if (storageSet(analysisStorageKey(r.company), stored)) {
    updateAnalysisIndex(r.company);
  }
}

/* ── Market API ───────────────────────── */
export const marketApi = {
  analyze: async (p: AnalyzeRequest): Promise<AnalyzeResponse> => {
    const days = Math.max(1, Math.min(30, p.days));

    const data = await apiFetch<AnalyzeResponse>(
      `/analyze?company=${encodeURIComponent(
        p.company
      )}&days=${days}`
    );

    saveAnalysis(data);

    marketApi.addHistory({
      id: Date.now().toString(),
      company: data.company,
      days,
      searchedAt: new Date().toISOString(),
      articleCount: data.totalArticles,
      sentiment: data.summary.overallSentiment,
    });

    return data;
  },

  health: async (): Promise<BackendHealth> => {
    return apiFetch<BackendHealth>('/health');
  },

  domainMatrix: async (): Promise<Record<string, unknown>> =>
    apiFetch('/domain-matrix'),

  getAiInsights: async (
    payload: object
  ): Promise<GeminiInsights> =>
    apiFetch('/ai/insights', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getStoredAnalysis: (
    company: string
  ): StoredAnalysis | null => {
    const d = storageGet<unknown>(
      analysisStorageKey(company)
    );

    if (!isValidStoredAnalysis(d)) {
      if (d) storageRemove(analysisStorageKey(company));
      return null;
    }

    return d;
  },

  getAnalyzedCompanies: (): string[] =>
    getAnalysisIndex().filter((c) =>
      isValidStoredAnalysis(
        storageGet<unknown>(analysisStorageKey(c))
      )
    ),

  getLatestAnalysis: (): StoredAnalysis | null => {
    const c = marketApi.getAnalyzedCompanies();
    return c.length
      ? marketApi.getStoredAnalysis(c[0])
      : null;
  },

  getHistory: (): SearchHistory[] =>
    storageGet<SearchHistory[]>('miq_history') ?? [],

  addHistory: (e: SearchHistory) => {
    if (typeof window === 'undefined') return;

    const list = marketApi
      .getHistory()
      .filter(
        (h) =>
          h.company.toLowerCase() !==
          e.company.toLowerCase()
      );

    storageSet('miq_history', [e, ...list].slice(0, 20));
  },

  clearHistory: () => storageRemove('miq_history'),

  getSavedApiUrl: (): string =>
    storageGet<string>('miq_api_url') ?? '',

  setSavedApiUrl: (url: string) =>
    storageSet('miq_api_url', url),
};

/* ── Notifications API ───────────────────────── */
export const notificationsApi = {
  list: async () =>
    apiFetch<{
      notifications: Notification[];
      sent_count: number;
      settings: NotificationSettings;
    }>('/notifications'),

  create: async (
    p: CreateNotificationPayload & {
      user_email?: string;
      user_name?: string;
    }
  ) =>
    apiFetch<Notification>('/notifications', {
      method: 'POST',
      body: JSON.stringify(p),
    }),

  delete: async (id: string) =>
    apiFetch<{ deleted: boolean }>(
      `/notifications/${id}`,
      { method: 'DELETE' }
    ),

  getSettings: async () =>
    apiFetch<NotificationSettings>(
      '/notifications/settings'
    ),

  updateSettings: async (s: NotificationSettings) =>
    apiFetch<NotificationSettings>(
      '/notifications/settings',
      {
        method: 'PUT',
        body: JSON.stringify(s),
      }
    ),

  getLog: async () =>
    apiFetch<{ log: unknown[] }>(
      '/notifications/log'
    ),
};

/* ── Trending ───────────────────────── */
export const TRENDING_COMPANIES = [
  'Apple',
  'NVIDIA',
  'Tesla',
  'Microsoft',
  'OpenAI',
  'Anthropic',
  'Google',
  'Meta',
  'Amazon',
  'Netflix',
];
