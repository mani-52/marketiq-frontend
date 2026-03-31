'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Lightbulb, Grid3X3, Bell, History, TrendingUp, TrendingDown, Minus, ArrowRight, BarChart3, Clock } from 'lucide-react';
import { marketApi } from '@/services/api';
import { StoredAnalysis, SearchHistory } from '@/types';
import { cn } from '@/utils/cn';

function SentimentIcon({ s }: { s: string }) {
  if (s === 'positive') return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  if (s === 'negative') return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-slate-400" />;
}

function RelativeTime({ iso }: { iso: string }) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return <>{mins}m ago</>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <>{hrs}h ago</>;
  return <>{Math.floor(hrs / 24)}d ago</>;
}

const CARDS = [
  { label: 'Analyze',       href: '/dashboard/analyze',        icon: Search,       desc: 'Run intelligence analysis' },
  { label: 'Insights',      href: '/dashboard/insights',       icon: Lightbulb,    desc: 'AI analyst report' },
  { label: 'Domain Matrix', href: '/dashboard/domain-matrix',  icon: Grid3X3,      desc: 'Classification weights' },
  { label: 'Notifications', href: '/dashboard/notifications',  icon: Bell,         desc: 'Schedule reminders' },
  { label: 'History',       href: '/dashboard/history',        icon: History,      desc: 'Past analyses' },
];

export default function DashboardPage() {
  const [latest,  setLatest]  = useState<StoredAnalysis | null>(null);
  const [history, setHistory] = useState<SearchHistory[]>([]);

  useEffect(() => {
    setLatest(marketApi.getLatestAnalysis());
    setHistory(marketApi.getHistory());
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">

      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-lg font-semibold tracking-tight">Overview</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {history.length > 0
            ? `${history.length} compan${history.length > 1 ? 'ies' : 'y'} analyzed`
            : 'No analyses yet — start by running a company analysis'}
        </p>
      </motion.div>

      {/* Latest analysis card */}
      {latest && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Latest Analysis</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">{latest.company}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <RelativeTime iso={latest.analyzedAt} />
                <span>·</span>
                <BarChart3 className="h-3 w-3" />
                {latest.totalArticles} articles
                <span>·</span>
                {latest.daysAnalyzed}d window
              </div>
            </div>
            <Link href="/dashboard/insights"
              className="flex items-center gap-1.5 rounded-lg bg-primary/8 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors">
              View Report <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Score strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Sentiment', value: latest.summary.sentimentScore, color: '#6366f1' },
              { label: 'Velocity',  value: latest.summary.velocityScore,  color: '#22c55e' },
              { label: 'Relevance', value: latest.summary.relevanceScore, color: '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-muted/40 px-3 py-2.5">
                <div className="text-[10px] text-muted-foreground mb-1.5">{label}</div>
                <div className="text-base font-bold tabular-nums" style={{ color }}>{value}<span className="text-xs text-muted-foreground font-normal">/100</span></div>
                <div className="mt-1.5 h-0.5 w-full rounded-full bg-border overflow-hidden">
                  <div style={{ width: `${value}%`, background: color, height: '100%', borderRadius: 9999 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Key themes */}
          {latest.summary.keyThemes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {latest.summary.keyThemes.slice(0, 5).map(t => (
                <span key={t} className="rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Navigation cards */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CARDS.map(({ label, href, icon: Icon, desc }, i) => (
          <Link key={href} href={href}>
            <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.1 }}
              className="group flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/25 hover:bg-accent/40 transition-colors h-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 group-hover:bg-primary/12 transition-colors">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-foreground">{label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{desc}</div>
              </div>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Recent history */}
      {history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Recent Analyses</h3>
            <Link href="/dashboard/history" className="text-xs text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="space-y-1.5">
            {history.slice(0, 5).map((h, i) => (
              <Link key={h.id} href={`/dashboard/analyze?company=${encodeURIComponent(h.company)}`}>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 hover:bg-accent/50 transition-colors">
                  <SentimentIcon s={h.sentiment ?? 'neutral'} />
                  <span className="flex-1 text-sm font-medium text-foreground">{h.company}</span>
                  <span className="text-xs text-muted-foreground">{h.articleCount} articles</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{h.days}d</span>
                  <span className="text-xs text-muted-foreground"><RelativeTime iso={h.searchedAt} /></span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* CTA when empty */}
      {history.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex flex-col items-center py-16 text-center rounded-xl border border-dashed border-border">
          <Search className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-semibold mb-1">Start your first analysis</h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs">Enter a company name to get real-time market intelligence powered by news analysis and AI.</p>
          <Link href="/dashboard/analyze"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Analyze a company <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      )}
    </div>
  );
}
