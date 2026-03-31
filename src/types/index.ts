export interface Article {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  summary: string;
  domain: ArticleDomain;
  confidenceScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];
  url: string;
  signalScore?: number;
  isRisk?: boolean;
  isInnovation?: boolean;
  imageUrl?: string;
}

export type ArticleDomain =
  | 'Finance' | 'Product' | 'Partnerships' | 'Legal'
  | 'Leadership' | 'Technology' | 'Market' | 'ESG' | 'M&A';

export interface AnalyzeRequest { company: string; days: number; }

export interface DomainMatrixDimensions {
  risk_weight:       Record<string, number>;
  innovation_weight: Record<string, number>;
  volatility_weight: Record<string, number>;
  growth_signal:     Record<string, number>;
  sentiment_bias:    Record<string, number>;
}

export interface DomainMatrix {
  domains:     string[];
  dimensions:  DomainMatrixDimensions;
  color_map:   Record<string, string>;
  description: Record<string, string>;
}

export interface AnalyzeResponse {
  company: string;
  analyzedAt: string;
  totalArticles: number;
  daysAnalyzed: number;
  cacheHit?: boolean;
  processingTimeMs?: number;
  dataSourcesUsed?: string[];
  articles: Article[];
  insights: InsightCard[];
  summary: CompanySummary;
  domainDistribution: DomainDistribution[];
  domainMatrix?: DomainMatrix;
  riskFlags: RiskFlag[];
  competitorMatrix?: CompetitorMatrix;
}

export interface CompanySummary {
  overallSentiment: 'positive' | 'neutral' | 'negative';
  keyThemes: string[];
  riskFactors: string[];
  opportunities: string[];
  sentimentScore: number;
  velocityScore: number;
  relevanceScore: number;
  dominantDomain?: string;
  competitorMentions?: string[];
}

export interface DomainDistribution {
  domain: ArticleDomain;
  count: number;
  percentage: number;
  color: string;
  riskWeight?: number;
  innovationWeight?: number;
  volatilityWeight?: number;
  growthSignal?: number;
  description?: string;
}

export interface TimelinePoint {
  date: string;
  articles: number;
  sentiment: number;
}

export interface InsightCard {
  id: string;
  type: 'trend' | 'risk' | 'opportunity' | 'alert' | 'innovation';
  title: string;
  description: string;
  confidence: number;
  createdAt: string;
}

export interface RiskFlag {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  keywordMatched: string;
}

export interface CompetitorMatrix {
  company: string;
  domainsCovered: number;
  domainScores: Record<string, number>;
  vsMarketAvg: Record<string, number>;
}

export interface SearchHistory {
  id: string;
  company: string;
  days: number;
  searchedAt: string;
  articleCount: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

/**
 * Full analysis result persisted to localStorage.
 * Powers both Insights and Domain Matrix pages.
 * Stored under key: miq_analysis_{company_lowercase}
 * Index stored under: miq_analysis_index (string[])
 */
export interface StoredAnalysis {
  company:            string;
  analyzedAt:         string;
  daysAnalyzed:       number;
  totalArticles:      number;
  summary:            CompanySummary;
  insights:           InsightCard[];
  riskFlags:          RiskFlag[];
  domainDistribution: DomainDistribution[];
  domainMatrix?:      DomainMatrix;
  // Derived sentiment timeline (7 or 14 points)
  sentimentTimeline:  TimelinePoint[];
}

export interface AnalysisState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: AnalyzeResponse | null;
  error: string | null;
}

export interface BackendHealth {
  status: string;
  tavily_configured: boolean;
  data_policy?: string;
}

// ── Notification types ─────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  message: string;
  company?: string;
  fire_at: string;
  repeat?: 'daily' | 'weekly' | null;
  notify_type: 'reminder' | 'risk_alert' | 'analysis_done';
  status: 'scheduled' | 'sent' | 'skipped';
  created_at: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  risk_alerts: boolean;
  analysis_complete: boolean;
  weekly_digest: boolean;
}

export interface CreateNotificationPayload {
  title: string;
  message: string;
  company?: string;
  fire_at?: string;
  fire_in_seconds?: number;
  repeat?: 'daily' | 'weekly' | null;
  notify_type?: string;
}

// ── Gemini AI Insights ────────────────────────────────────────────────────────
export interface GeminiInsights {
  executive_summary:          string;
  market_position:            string;
  bullish_signals:            string[];
  bearish_signals:            string[];
  key_risks:                  string[];
  opportunities:              string[];
  analyst_verdict:            string;
  actionable_recommendations: string[];
  confidence_note:            string;
  generated_by:               string;
}
