'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, TrendingUp, TrendingDown, Minus, BarChart3,
  AlertCircle, CheckCircle, Lightbulb, Filter, RefreshCw,
  AlertTriangle, ShieldAlert, Info, ExternalLink, Activity,
  PieChart, LineChart, Radar, Grid3X3,
} from 'lucide-react';
import Link from 'next/link';
import { AnalyzeForm } from '@/components/AnalyzeForm';
import { ArticleCard } from '@/components/ArticleCard';
import { InsightCard } from '@/components/InsightCard';
import { AnalysisLoader } from '@/components/Loader';
import {
  SentimentTimelineChart, DomainPieChart, DomainBarChart,
  VolumeBarChart, SentimentBreakdownChart, CompanyRadarChart,
  ScoreGauge, ActivityHeatmap,
} from '@/components/charts/Charts';
import { useAnalysis } from '@/hooks/useAnalysis';
import { cn, getDomainColor, getSentimentColor } from '@/utils/cn';
import { ArticleDomain, TimelinePoint, DomainDistribution, DomainMatrix } from '@/types';

type Tab = 'articles' | 'analytics' | 'insights' | 'risks' | 'summary' | 'matrix';

// Generate timeline data from articles
function buildTimeline(articles: any[], days: number): TimelinePoint[] {
  const buckets: Record<string, { count: number; pos: number; neg: number }> = {};
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    buckets[key] = { count: 0, pos: 0, neg: 0 };
  }
  articles.forEach((a) => {
    const key = new Date(a.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (buckets[key]) {
      buckets[key].count++;
      if (a.sentiment === 'positive') buckets[key].pos++;
      if (a.sentiment === 'negative') buckets[key].neg++;
    }
  });
  return Object.entries(buckets).map(([date, v]) => ({
    date,
    articles: v.count,
    sentiment: v.count > 0 ? Math.round((v.pos / v.count) * 100) : 50,
  }));
}

function buildSentimentBreakdown(articles: any[], days: number) {
  const buckets: Record<string, { pos: number; neu: number; neg: number }> = {};
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    buckets[key] = { pos: 0, neu: 0, neg: 0 };
  }
  articles.forEach((a) => {
    const key = new Date(a.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (buckets[key]) {
      if (a.sentiment === 'positive') buckets[key].pos++;
      else if (a.sentiment === 'negative') buckets[key].neg++;
      else buckets[key].neu++;
    }
  });
  return Object.entries(buckets).map(([date, v]) => ({ date, positive: v.pos, neutral: v.neu, negative: v.neg }));
}

function buildRadarData(domainDist: DomainDistribution[], summary: any) {
  const domainScore = (domain: string) => {
    const d = domainDist.find(x => x.domain === domain);
    return d ? Math.min(100, d.percentage * 4) : 0;
  };
  return [
    { subject: 'Finance', score: domainScore('Finance'), benchmark: 65 },
    { subject: 'Technology', score: domainScore('Technology'), benchmark: 70 },
    { subject: 'Market', score: domainScore('Market'), benchmark: 60 },
    { subject: 'Product', score: domainScore('Product'), benchmark: 55 },
    { subject: 'Legal', score: domainScore('Legal'), benchmark: 40 },
    { subject: 'ESG', score: domainScore('ESG'), benchmark: 45 },
  ];
}

function buildHeatmap(articles: any[], days: number) {
  const buckets: Record<string, number> = {};
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  articles.forEach((a) => {
    const key = a.publishedAt?.slice(0, 10);
    if (key && buckets[key] !== undefined) buckets[key]++;
  });
  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

function AnalyzePageInner() {
  const searchParams = useSearchParams();
  const { status, data, error, analyze, reset } = useAnalysis();
  const companyRef = useRef('');
  const daysRef = useRef(7);
  const [filterDomain, setFilterDomain] = useState<ArticleDomain | 'All'>('All');
  const [activeTab, setActiveTab] = useState<Tab>('articles');
  const [chartView, setChartView] = useState<'pie' | 'bar'>('pie');

  useEffect(() => {
    const company = searchParams.get('company');
    if (company) { companyRef.current = company; analyze({ company, days: 7 }); }
  }, []);

  const handleSubmit = (company: string, days: number) => {
    companyRef.current = company; daysRef.current = days;
    setFilterDomain('All'); setActiveTab('articles');
    analyze({ company, days });
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && companyRef.current)
        analyze({ company: companyRef.current, days: daysRef.current });
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [analyze]);

  const sentimentColor = data ? getSentimentColor(data.summary.overallSentiment) : '#6b7280';
  const SentIcon = data?.summary.overallSentiment === 'positive' ? TrendingUp : data?.summary.overallSentiment === 'negative' ? TrendingDown : Minus;

  const domains = data ? (['All', ...Array.from(new Set(data.articles.map(a => a.domain)))] as (ArticleDomain | 'All')[]) : [];
  const filteredArticles = data ? (filterDomain === 'All' ? data.articles : data.articles.filter(a => a.domain === filterDomain)) : [];

  const timeline = data ? buildTimeline(data.articles, data.daysAnalyzed) : [];
  const sentBreakdown = data ? buildSentimentBreakdown(data.articles, data.daysAnalyzed) : [];
  const radarData = data ? buildRadarData(data.domainDistribution, data.summary) : [];
  const heatmap = data ? buildHeatmap(data.articles, Math.max(data.daysAnalyzed, 7)) : [];

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'articles', label: 'Articles', icon: <FileText className="h-3.5 w-3.5" />, count: data?.articles.length },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { key: 'insights', label: 'Insights', icon: <Lightbulb className="h-3.5 w-3.5" />, count: data?.insights.length },
    { key: 'risks', label: 'Risk Flags', icon: <ShieldAlert className="h-3.5 w-3.5" />, count: data?.riskFlags.length },
    { key: 'matrix', label: 'Domain Matrix', icon: <Grid3X3 className="h-3.5 w-3.5" /> },
    { key: 'summary', label: 'Summary', icon: <Activity className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analyze</h1>
        <p className="mt-1 text-sm text-muted-foreground">AI-powered market intelligence across news, financials, and signals.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <AnalyzeForm onSubmit={handleSubmit} isLoading={status === 'loading'} defaultCompany={searchParams.get('company') || ''} />
      </div>

      <AnimatePresence>
        {status === 'error' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Analysis failed</p>
              <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
            </div>
            <button onClick={reset} className="text-xs text-destructive/70 hover:text-destructive shrink-0">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'loading' && <div className="rounded-xl border border-border bg-card"><AnalysisLoader /></div>}

      <AnimatePresence>
        {status === 'success' && data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-5">
            {/* Summary bar */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{data.company}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {data.totalArticles} articles · {data.daysAnalyzed}d window · {new Date(data.analyzedAt).toLocaleString()}
                    {data.cacheHit && <span className="ml-2 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-500">cached</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/dashboard/insights`}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20">
                    <Lightbulb className="h-3 w-3" /> Insights
                  </Link>
                  <Link href={`/dashboard/domain-matrix`}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-400 hover:bg-violet-500/20">
                    <Grid3X3 className="h-3 w-3" /> Matrix
                  </Link>
                  <button onClick={() => analyze({ company: data.company, days: daysRef.current })}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </button>
                </div>
              </div>

              {/* 3 score gauges */}
              <div className="flex items-center justify-around mb-4">
                <ScoreGauge value={data.summary.sentimentScore} color={sentimentColor} label="Sentiment" />
                <ScoreGauge value={data.summary.velocityScore} color="#3b82f6" label="Velocity" />
                <ScoreGauge value={data.summary.relevanceScore} color="#22c55e" label="Relevance" />
              </div>

              {data.summary.keyThemes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border">
                  <span className="mr-1 text-xs text-muted-foreground self-center">Themes:</span>
                  {data.summary.keyThemes.map(t => (
                    <span key={t} className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium',
                    activeTab === tab.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {tab.icon} {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn('rounded-full px-1.5 py-0.5 text-[10px]', activeTab === tab.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Articles tab */}
            {activeTab === 'articles' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="space-y-4">
                {domains.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {domains.map(domain => {
                      const color = domain !== 'All' ? getDomainColor(domain) : undefined;
                      return (
                        <button key={domain} onClick={() => setFilterDomain(domain)}
                          className={cn('shrink-0 rounded-full border px-3 py-1 text-xs font-medium',
                            filterDomain === domain ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                          )}
                          style={filterDomain === domain && color ? { borderColor: `${color}50`, backgroundColor: `${color}15`, color } : {}}
                        >
                          {domain}
                          {domain !== 'All' && <span className="ml-1.5 text-[10px] opacity-60">{data.articles.filter(a => a.domain === domain).length}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredArticles.map((article, i) => <ArticleCard key={article.id} article={article} index={i} />)}
                </div>
                {filteredArticles.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center">
                    <FileText className="mb-3 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No articles in this domain</p>
                    <button onClick={() => setFilterDomain('All')} className="mt-2 text-xs text-primary hover:underline">Clear filter</button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Analytics tab */}
            {activeTab === 'analytics' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="space-y-5">
                {/* Row 1: Timeline + Heatmap */}
                <div className="grid gap-5 lg:grid-cols-5">
                  <div className="rounded-xl border border-border bg-card p-5 lg:col-span-3">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">News Volume & Sentiment</h3>
                        <p className="text-xs text-muted-foreground">Article velocity vs sentiment trend</p>
                      </div>
                    </div>
                    <SentimentTimelineChart data={timeline} height={200} />
                  </div>
                  <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
                    <h3 className="mb-3 text-sm font-semibold text-foreground">Domain Distribution</h3>
                    <div className="flex items-center gap-1 rounded-lg border border-border p-1 mb-4 w-fit">
                      {(['pie', 'bar'] as const).map(v => (
                        <button key={v} onClick={() => setChartView(v)}
                          className={cn('rounded-md px-3 py-1 text-xs capitalize', chartView === v ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                          {v}
                        </button>
                      ))}
                    </div>
                    {chartView === 'pie' ? <DomainPieChart data={data.domainDistribution} height={200} /> : <DomainBarChart data={data.domainDistribution} height={200} />}
                  </div>
                </div>

                {/* Row 2: Sentiment breakdown line + Radar */}
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="mb-1 text-sm font-semibold text-foreground">Sentiment Breakdown</h3>
                    <p className="mb-4 text-xs text-muted-foreground">Positive / neutral / negative over time</p>
                    <SentimentBreakdownChart data={sentBreakdown} height={200} />
                  </div>
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="mb-1 text-sm font-semibold text-foreground">Coverage Radar</h3>
                    <p className="mb-4 text-xs text-muted-foreground">Domain coverage vs industry benchmark</p>
                    <CompanyRadarChart data={radarData} height={220} />
                  </div>
                </div>

                {/* Row 3: Volume bar + Activity heatmap */}
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="mb-1 text-sm font-semibold text-foreground">Daily Article Volume</h3>
                    <p className="mb-4 text-xs text-muted-foreground">News output per day</p>
                    <VolumeBarChart data={timeline} height={180} />
                  </div>
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="mb-2 text-sm font-semibold text-foreground">Activity Heatmap</h3>
                    <p className="mb-4 text-xs text-muted-foreground">Article density calendar</p>
                    <div className="flex items-end gap-3">
                      <ActivityHeatmap data={heatmap} />
                      <div className="flex flex-col gap-1 text-[10px] text-muted-foreground pb-0.5">
                        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm" style={{background:'rgba(99,102,241,0.9)'}} /> High</div>
                        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm" style={{background:'rgba(99,102,241,0.35)'}} /> Med</div>
                        <div className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm" style={{background:'rgba(99,102,241,0.06)'}} /> None</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Domain table */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-4 text-sm font-semibold text-foreground">Domain Intelligence Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          {['Domain', 'Articles', 'Share', 'Pos.', 'Neg.', 'Neutral', 'Score'].map(h => (
                            <th key={h} className="pb-2 text-left font-medium text-muted-foreground pr-4 last:pr-0">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {data.domainDistribution.sort((a,b)=>b.count-a.count).map(d => {
                          const domainArticles = data.articles.filter(a => a.domain === d.domain);
                          const pos = domainArticles.filter(a=>a.sentiment==='positive').length;
                          const neg = domainArticles.filter(a=>a.sentiment==='negative').length;
                          const neu = domainArticles.filter(a=>a.sentiment==='neutral').length;
                          const score = d.count > 0 ? Math.round(((pos - neg) / d.count + 1) * 50) : 50;
                          return (
                            <tr key={d.domain} className="hover:bg-accent/50">
                              <td className="py-2.5 pr-4">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full" style={{backgroundColor:d.color}} />
                                  <span className="font-medium text-foreground">{d.domain}</span>
                                </div>
                              </td>
                              <td className="py-2.5 pr-4 text-foreground font-semibold">{d.count}</td>
                              <td className="py-2.5 pr-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full" style={{width:`${d.percentage}%`,backgroundColor:d.color}} />
                                  </div>
                                  <span className="text-muted-foreground">{d.percentage}%</span>
                                </div>
                              </td>
                              <td className="py-2.5 pr-4 text-green-500">{pos}</td>
                              <td className="py-2.5 pr-4 text-red-500">{neg}</td>
                              <td className="py-2.5 pr-4 text-muted-foreground">{neu}</td>
                              <td className="py-2.5">
                                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium',
                                  score >= 60 ? 'bg-green-500/10 text-green-500' : score >= 40 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                                )}>{score}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Insights tab */}
            {activeTab === 'insights' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                {data.insights.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {data.insights.map((insight, i) => <InsightCard key={insight.id} insight={insight} index={i} />)}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center">
                    <Lightbulb className="mb-3 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No insights generated</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Risks tab */}

            {activeTab === 'matrix' && data?.domainMatrix && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">Domain classification weights derived from {data.totalArticles} articles over {data.daysAnalyzed} days.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.domainDistribution.sort((a,b)=>b.count-a.count).map((dd, i) => {
                    const matrix = data.domainMatrix!;
                    const risk = matrix.dimensions.risk_weight[dd.domain] ?? 0;
                    const innovation = matrix.dimensions.innovation_weight[dd.domain] ?? 0;
                    const growth = matrix.dimensions.growth_signal[dd.domain] ?? 0;
                    const volatility = matrix.dimensions.volatility_weight[dd.domain] ?? 0;
                    return (
                      <motion.div key={dd.domain} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background: dd.color }} />
                          <span className="text-sm font-semibold text-foreground">{dd.domain}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{dd.count} articles · {dd.percentage}%</span>
                        </div>
                        {dd.description && <p className="text-xs text-muted-foreground leading-relaxed">{dd.description}</p>}
                        <div className="space-y-2">
                          {[
                            { label: 'Risk', value: risk, color: '#ef4444' },
                            { label: 'Innovation', value: innovation, color: '#6366f1' },
                            { label: 'Growth', value: growth, color: '#22c55e' },
                            { label: 'Volatility', value: volatility, color: '#f59e0b' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="flex items-center gap-2">
                              <span className="w-16 text-xs text-muted-foreground">{label}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.round(value*100)}%`, background: color }} />
                              </div>
                              <span className="w-8 text-right text-xs" style={{ color }}>{Math.round(value*100)}%</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'risks' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                {data.riskFlags && data.riskFlags.length > 0 ? (
                  <div className="space-y-3">
                    {/* Risk summary bar */}
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        {(['HIGH','MEDIUM','LOW'] as const).map(sev => {
                          const count = data.riskFlags.filter(f=>f.severity===sev).length;
                          const col = sev==='HIGH'?'#ef4444':sev==='MEDIUM'?'#f59e0b':'#6366f1';
                          return (
                            <div key={sev} className="rounded-lg p-3" style={{backgroundColor:`${col}10`}}>
                              <div className="text-xl font-bold" style={{color:col}}>{count}</div>
                              <div className="text-xs font-medium mt-0.5" style={{color:col}}>{sev}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {data.riskFlags.map(flag => {
                      const cfg = { HIGH:{color:'#ef4444',bg:'bg-red-500/10',border:'border-red-500/30',Icon:ShieldAlert}, MEDIUM:{color:'#f59e0b',bg:'bg-amber-500/10',border:'border-amber-500/30',Icon:AlertTriangle}, LOW:{color:'#6366f1',bg:'bg-indigo-500/10',border:'border-indigo-500/30',Icon:Info} }[flag.severity] ?? {color:'#6b7280',bg:'bg-muted',border:'border-border',Icon:Info};
                      return (
                        <div key={flag.id} className={cn('rounded-xl border p-4',cfg.border,cfg.bg)}>
                          <div className="flex items-start gap-3">
                            <cfg.Icon className="h-4 w-4 mt-0.5 shrink-0" style={{color:cfg.color}} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold" style={{color:cfg.color}}>{flag.severity}</span>
                                <span className="text-xs text-muted-foreground">·</span>
                                <span className="text-xs text-muted-foreground">{flag.category}</span>
                              </div>
                              <p className="text-sm text-foreground">{flag.description}</p>
                              <p className="mt-1 text-xs text-muted-foreground">Keyword: <code className="font-mono">{flag.keywordMatched}</code></p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center">
                    <CheckCircle className="mb-3 h-8 w-8 text-green-500/60" />
                    <p className="text-sm font-medium text-foreground">No risk flags detected</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Summary tab */}
            {activeTab === 'summary' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.summary.opportunities.length > 0 && (
                    <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400">
                        <TrendingUp className="h-4 w-4" /> Opportunities
                      </h3>
                      <ul className="space-y-2">
                        {data.summary.opportunities.map((op,i)=>(
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"/>
                            {op}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.summary.riskFactors.length > 0 && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4" /> Risk Factors
                      </h3>
                      <ul className="space-y-2">
                        {data.summary.riskFactors.map((rf,i)=>(
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0"/>
                            {rf}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {data.dataSourcesUsed && data.dataSourcesUsed.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="mb-3 text-sm font-semibold text-foreground">Data Sources</h3>
                    <div className="flex flex-wrap gap-2">
                      {data.dataSourcesUsed.map(src=>(
                        <span key={src} className="flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
                          <ExternalLink className="h-2.5 w-2.5"/>{src}
                        </span>
                      ))}
                    </div>
                    {data.processingTimeMs && <p className="mt-3 text-xs text-muted-foreground">Processed in {(data.processingTimeMs/1000).toFixed(1)}s</p>}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'idle' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-20 text-center"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <BarChart3 className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Ready to analyze</h3>
          <p className="max-w-xs text-xs text-muted-foreground">Enter a company name above to generate AI-powered market intelligence with full analytics.</p>
        </motion.div>
      )}
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="p-6"><div className="h-8 w-48 skeleton rounded-lg" /></div>}>
      <AnalyzePageInner />
    </Suspense>
  );
}
