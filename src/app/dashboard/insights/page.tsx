'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, AlertTriangle, Target, Zap,
  ChevronDown, ArrowRight, RefreshCw, FileDown, Loader2,
  CheckCircle2, XCircle, Minus, BarChart3, Clock, Sparkles,
  ArrowUpRight, ArrowDownRight, Shield, ChevronRight,
} from 'lucide-react';
import { marketApi } from '@/services/api';
import { StoredAnalysis, GeminiInsights } from '@/types';
import { cn } from '@/utils/cn';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// ── PDF Export ────────────────────────────────────────────────────────────────
async function exportPDF(analysis: StoredAnalysis, ai: GeminiInsights | null) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210, H = 297, M = 18, CW = W - M * 2;
  let y = M;

  const PRIMARY: [number,number,number]  = [30, 35, 60];
  const ACCENT: [number,number,number]   = [99, 102, 241];
  const DARK: [number,number,number]     = [15, 20, 40];
  const GRAY: [number,number,number]     = [90, 105, 125];
  const LIGHT: [number,number,number]    = [245, 247, 252];
  const WHITE: [number,number,number]    = [255, 255, 255];
  const GREEN: [number,number,number]    = [34, 197, 94];
  const RED: [number,number,number]      = [239, 68, 68];
  const AMBER: [number,number,number]    = [245, 158, 11];

  const addPage = (needed = 20) => {
    if (y + needed > H - M) { doc.addPage(); y = M; return true; }
    return false;
  };

  // ── Cover ──────────────────────────────────────────────────────────────────
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 58, 'F');
  doc.setFillColor(...ACCENT);
  doc.rect(0, 56, W, 3, 'F');

  // Logo mark
  doc.setFillColor(...ACCENT);
  doc.roundedRect(M, 13, 10, 10, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('MIQ', M + 1.2, 20);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Market Intelligence Report', M + 14, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 185, 220);
  doc.text(analysis.company, M + 14, 28);
  doc.setFontSize(8);
  doc.setTextColor(130, 140, 180);
  doc.text(
    `${analysis.daysAnalyzed}-day analysis · ${new Date(analysis.analyzedAt).toLocaleString()} · CONFIDENTIAL`,
    M + 14, 35
  );

  y = 70;

  // ── Sentiment verdict badge ─────────────────────────────────────────────────
  const sColor = analysis.summary.overallSentiment === 'positive' ? GREEN :
                 analysis.summary.overallSentiment === 'negative' ? RED : GRAY;
  doc.setFillColor(...sColor);
  doc.roundedRect(M, y, 36, 8, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(analysis.summary.overallSentiment.toUpperCase(), M + 3, y + 5.5);

  if (ai?.analyst_verdict) {
    doc.setFillColor(...LIGHT);
    doc.roundedRect(M + 40, y, CW - 40, 8, 2, 2, 'F');
    doc.setTextColor(...DARK);
    doc.setFontSize(8);
    doc.text(`Analyst Verdict: ${ai.analyst_verdict}`, M + 44, y + 5.5);
  }
  y += 14;

  // ── Score row ──────────────────────────────────────────────────────────────
  const scores = [
    { label: 'Sentiment', value: analysis.summary.sentimentScore, color: sColor },
    { label: 'Velocity',  value: analysis.summary.velocityScore,  color: ACCENT },
    { label: 'Relevance', value: analysis.summary.relevanceScore, color: GREEN },
    { label: 'Articles',  value: analysis.totalArticles,           color: GRAY, noBar: true },
  ];
  const sw = (CW - 9) / 4;
  scores.forEach((s, i) => {
    const sx = M + i * (sw + 3);
    doc.setFillColor(...LIGHT);
    doc.roundedRect(sx, y, sw, 16, 2, 2, 'F');
    doc.setFillColor(...s.color);
    doc.roundedRect(sx, y, 3, 16, 2, 2, 'F');
    doc.rect(sx + 1, y, 2, 16, 'F');
    doc.setTextColor(...DARK);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(String(s.value) + (s.noBar ? '' : '%'), sx + 8, y + 9);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(s.label, sx + 8, y + 13.5);
  });
  y += 22;

  // ── AI Executive Summary ───────────────────────────────────────────────────
  if (ai?.executive_summary) {
    doc.setFillColor(...LIGHT);
    doc.roundedRect(M, y, CW, 28, 2, 2, 'F');
    doc.setFillColor(...ACCENT);
    doc.roundedRect(M, y, 3, 28, 2, 2, 'F');
    doc.rect(M + 1, y, 2, 28, 'F');
    doc.setTextColor(...ACCENT);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', M + 7, y + 6);
    doc.setTextColor(...DARK);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(ai.executive_summary + ' ' + (ai.market_position || ''), CW - 12);
    doc.text(lines.slice(0, 3), M + 7, y + 12);
    y += 33;
  }

  // ── Key themes ─────────────────────────────────────────────────────────────
  if (analysis.summary.keyThemes.length) {
    addPage(20);
    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('KEY THEMES', M, y);
    y += 5;
    const themes = analysis.summary.keyThemes.slice(0, 6);
    const tw = (CW - (themes.length - 1) * 2) / Math.min(themes.length, 3);
    themes.forEach((theme, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const tx = M + col * (tw + 2);
      const ty = y + row * 9;
      doc.setFillColor(240, 242, 255);
      doc.roundedRect(tx, ty, tw, 7, 1.5, 1.5, 'F');
      doc.setTextColor(...ACCENT);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text(theme, tx + 3, ty + 5);
    });
    y += (Math.ceil(themes.length / 3)) * 9 + 6;
  }

  // ── Bullish / Bearish signals ──────────────────────────────────────────────
  if (ai?.bullish_signals || ai?.bearish_signals) {
    addPage(50);
    const halfW = (CW - 4) / 2;

    // Bullish
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(M, y, halfW, ai!.bullish_signals.length * 9 + 12, 2, 2, 'F');
    doc.setTextColor(...GREEN);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('▲  BULLISH SIGNALS', M + 4, y + 7);
    ai!.bullish_signals.slice(0, 3).forEach((s, i) => {
      doc.setTextColor(...DARK);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(`• ${s}`, halfW - 10);
      doc.text(lines[0], M + 4, y + 13 + i * 9);
    });

    // Bearish
    const bx = M + halfW + 4;
    doc.setFillColor(255, 243, 243);
    doc.roundedRect(bx, y, halfW, ai!.bearish_signals.length * 9 + 12, 2, 2, 'F');
    doc.setTextColor(...RED);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('▼  BEARISH SIGNALS', bx + 4, y + 7);
    ai!.bearish_signals.slice(0, 3).forEach((s, i) => {
      doc.setTextColor(...DARK);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(`• ${s}`, halfW - 10);
      doc.text(lines[0], bx + 4, y + 13 + i * 9);
    });
    y += Math.max(ai!.bullish_signals.length, ai!.bearish_signals.length) * 9 + 17;
  }

  // ── AI Insights ────────────────────────────────────────────────────────────
  if (analysis.insights.length) {
    addPage(20);
    doc.addPage(); y = M;
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, W, 12, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INTELLIGENCE SIGNALS', M, 8.5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${analysis.insights.length} signals`, W - M, 8.5, { align: 'right' });
    y = 20;

    const typeColors: Record<string, [number,number,number]> = {
      trend: ACCENT, risk: RED, opportunity: GREEN, alert: AMBER, innovation: [139, 92, 246]
    };

    analysis.insights.slice(0, 8).forEach((ins, idx) => {
      const boxH = 22;
      addPage(boxH + 4);
      const tc = typeColors[ins.type] ?? GRAY;
      doc.setFillColor(...LIGHT);
      doc.roundedRect(M, y, CW, boxH, 2, 2, 'F');
      doc.setFillColor(...tc);
      doc.roundedRect(M, y, 3, boxH, 2, 2, 'F');
      doc.rect(M + 1, y, 2, boxH, 'F');
      doc.setTextColor(...tc);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(ins.type.toUpperCase(), M + 7, y + 5.5);
      doc.setTextColor(...DARK);
      doc.setFontSize(9);
      doc.text(ins.title, M + 7, y + 11);
      doc.setTextColor(...GRAY);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      const desc = doc.splitTextToSize(ins.description, CW - 12);
      doc.text(desc[0], M + 7, y + 17);
      doc.setTextColor(...tc);
      doc.setFontSize(7);
      doc.text(`${ins.confidence}% conf`, W - M - 2, y + 5.5, { align: 'right' });
      y += boxH + 3;
    });
  }

  // ── Risk Flags ─────────────────────────────────────────────────────────────
  if (analysis.riskFlags.length) {
    addPage(20);
    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('RISK FLAGS', M, y); y += 6;

    analysis.riskFlags.slice(0, 6).forEach(risk => {
      addPage(13);
      const rc = risk.severity === 'HIGH' ? RED : risk.severity === 'MEDIUM' ? AMBER : GRAY;
      doc.setFillColor(...rc);
      doc.roundedRect(M, y, 14, 6, 1, 1, 'F');
      doc.setTextColor(...WHITE);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text(risk.severity, M + 1.5, y + 4.3);
      doc.setTextColor(...DARK);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(risk.description, M + 17, y + 4.3);
      y += 9;
    });
    y += 4;
  }

  // ── Recommendations ────────────────────────────────────────────────────────
  if (ai?.actionable_recommendations) {
    addPage(30);
    doc.setFillColor(245, 245, 255);
    const recH = ai.actionable_recommendations.length * 10 + 12;
    doc.roundedRect(M, y, CW, recH, 2, 2, 'F');
    doc.setFillColor(...ACCENT);
    doc.roundedRect(M, y, 3, recH, 2, 2, 'F');
    doc.rect(M + 1, y, 2, recH, 'F');
    doc.setTextColor(...ACCENT);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIONABLE RECOMMENDATIONS', M + 7, y + 7);
    ai.actionable_recommendations.slice(0, 4).forEach((rec, i) => {
      doc.setTextColor(...DARK);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${i + 1}.  ${rec}`, M + 7, y + 13 + i * 10);
    });
    y += recH + 6;
  }

  // ── Domain distribution ────────────────────────────────────────────────────
  if (analysis.domainDistribution.length) {
    addPage(analysis.domainDistribution.length * 9 + 16);
    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DOMAIN COVERAGE', M, y); y += 6;
    analysis.domainDistribution.slice(0, 8).forEach(d => {
      doc.setFillColor(235, 238, 248);
      doc.roundedRect(M, y, CW, 7, 1, 1, 'F');
      const hexToRgb = (h: string): [number,number,number] => {
        const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
        return [r,g,b];
      };
      const [r,g,b] = hexToRgb(d.color);
      doc.setFillColor(r,g,b);
      doc.roundedRect(M, y, Math.max(2, (d.percentage / 100) * CW), 7, 1, 1, 'F');
      doc.setTextColor(...WHITE);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      if (d.percentage > 8) doc.text(`${d.domain}  ${d.percentage}%`, M + 3, y + 5);
      y += 9;
    });
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const total = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFillColor(...LIGHT);
    doc.rect(0, H - 9, W, 9, 'F');
    doc.setTextColor(...GRAY);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`MarketIQ Intelligence Report · ${analysis.company} · Confidential · ${new Date().toLocaleDateString()}`, M, H - 4);
    doc.text(`Page ${p} / ${total}`, W - M, H - 4, { align: 'right' });
  }

  doc.save(`MarketIQ_${analysis.company.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ── Analyst verdict component ─────────────────────────────────────────────────
function VerdictBadge({ verdict }: { verdict: string }) {
  const upper = verdict.toUpperCase();
  const isBuy  = upper.startsWith('BUY');
  const isSell = upper.startsWith('SELL') || upper.startsWith('REDUCE');
  const isHold = upper.startsWith('HOLD');
  const color = isBuy ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    : isSell ? 'text-red-400 bg-red-400/10 border-red-400/20'
    : isHold ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    : 'text-blue-400 bg-blue-400/10 border-blue-400/20';
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-bold tracking-wide', color)}>
      {isBuy ? <ArrowUpRight className="h-4 w-4" /> : isSell ? <ArrowDownRight className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
      {verdict}
    </span>
  );
}

function SentimentPill({ s }: { s: string }) {
  const map = {
    positive: 'text-emerald-400 bg-emerald-400/10',
    negative: 'text-red-400 bg-red-400/10',
    neutral:  'text-slate-400 bg-slate-400/10',
  };
  return <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', map[s as keyof typeof map] ?? map.neutral)}>{s}</span>;
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted/60', className)} />;
}

function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function Empty() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Sparkles className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h2 className="mb-2 text-base font-semibold">No analysis found</h2>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Run a company analysis first. This page generates an AI analyst report from real intelligence data.
      </p>
      <Link href="/dashboard/analyze"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
        Analyze a company <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const [companies, setCompanies] = useState<string[]>([]);
  const [selected,  setSelected]  = useState('');
  const [analysis,  setAnalysis]  = useState<StoredAnalysis | null>(null);
  const [ai,        setAi]        = useState<GeminiInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState('');
  const [dropdown,  setDropdown]  = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadCompanies = () => {
    const list = marketApi.getAnalyzedCompanies();
    setCompanies(list);
    if (list.length && !selected) {
      setSelected(list[0]);
      setAnalysis(marketApi.getStoredAnalysis(list[0]));
    }
  };

  useEffect(() => { loadCompanies(); }, []);

  const fetchAiInsights = useCallback(async (a: StoredAnalysis) => {
    setAiLoading(true);
    setAiError('');
    setAi(null);
    try {
      const insights = await marketApi.getAiInsights({
        company:            a.company,
        total_articles:     a.totalArticles,
        days:               a.daysAnalyzed,
        overall_sentiment:  a.summary.overallSentiment,
        sentiment_score:    a.summary.sentimentScore,
        velocity_score:     a.summary.velocityScore,
        relevance_score:    a.summary.relevanceScore,
        dominant_domain:    a.summary.dominantDomain ?? '',
        key_themes:         a.summary.keyThemes,
        risk_factors:       a.summary.riskFactors,
        opportunities:      a.summary.opportunities,
        risk_flag_count:    a.riskFlags.length,
        high_risk_count:    a.riskFlags.filter(r => r.severity === 'HIGH').length,
        domain_distribution: a.domainDistribution,
        top_insights:       a.insights.slice(0, 5),
      });
      setAi(insights);
    } catch (e: any) {
      setAiError(e.message || 'Failed to generate insights');
    } finally {
      setAiLoading(false);
    }
  }, []);

  const selectCompany = (c: string) => {
    setSelected(c);
    setDropdown(false);
    const a = marketApi.getStoredAnalysis(c);
    setAnalysis(a);
    setAi(null);
    if (a) fetchAiInsights(a);
  };

  useEffect(() => {
    if (analysis && !ai && !aiLoading) fetchAiInsights(analysis);
  }, [analysis]);

  const handleExport = async () => {
    if (!analysis) return;
    setExporting(true);
    try { await exportPDF(analysis, ai); }
    catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  const riskHigh   = analysis?.riskFlags.filter(r => r.severity === 'HIGH').length ?? 0;
  const riskMedium = analysis?.riskFlags.filter(r => r.severity === 'MEDIUM').length ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Intelligence Report</h1>
          <p className="text-xs text-muted-foreground mt-0.5">AI-generated analyst insights · Powered by Gemini</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Company picker */}
          {companies.length > 0 && (
            <div className="relative">
              <button onClick={() => setDropdown(v => !v)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent">
                {selected || 'Select'} <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', dropdown && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {dropdown && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                    {companies.map(c => (
                      <button key={c} onClick={() => selectCompany(c)}
                        className={cn('flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent',
                          c === selected ? 'font-semibold text-primary' : 'text-foreground')}>
                        {c === selected && <CheckCircle2 className="h-3 w-3 text-primary" />}
                        {c !== selected && <div className="h-3 w-3" />}
                        {c}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {analysis && (
            <button onClick={() => fetchAiInsights(analysis)} disabled={aiLoading}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent disabled:opacity-50">
              <RefreshCw className={cn('h-3.5 w-3.5', aiLoading && 'animate-spin')} />
              {aiLoading ? 'Generating…' : 'Regenerate'}
            </button>
          )}

          {analysis && (
            <button onClick={handleExport} disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
              {exporting ? 'Exporting…' : 'Export PDF'}
            </button>
          )}
        </div>
      </div>

      {!analysis && companies.length === 0 && <Empty />}

      {analysis && (
        <AnimatePresence mode="wait">
          <motion.div key={selected} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="space-y-4">

            {/* Company banner */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold tracking-tight">{analysis.company}</h2>
                    <SentimentPill s={analysis.summary.overallSentiment} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{analysis.daysAnalyzed}d window</span>
                    <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" />{analysis.totalArticles} articles</span>
                    <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" />
                      {new Date(analysis.analyzedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                {ai && <VerdictBadge verdict={ai.analyst_verdict} />}
              </div>

              {/* Key themes */}
              {analysis.summary.keyThemes.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {analysis.summary.keyThemes.slice(0, 7).map(t => (
                    <span key={t} className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Score row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Sentiment Score', value: analysis.summary.sentimentScore, color: '#6366f1', desc: 'Overall news tone' },
                { label: 'News Velocity',   value: analysis.summary.velocityScore,  color: '#22c55e', desc: 'Coverage momentum' },
                { label: 'Relevance',       value: analysis.summary.relevanceScore, color: '#f59e0b', desc: 'Signal quality' },
              ].map(({ label, value, color, desc }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-2 text-xs text-muted-foreground">{label}</div>
                  <div className="text-2xl font-bold tabular-nums" style={{ color }}>{value}<span className="text-sm text-muted-foreground">/100</span></div>
                  <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }}
                      style={{ height: '100%', borderRadius: 9999, background: color }} />
                  </div>
                  <div className="mt-1.5 text-[10px] text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>

            {/* AI loading / error */}
            {aiLoading && (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <div className="text-sm font-semibold">Generating analyst report…</div>
                    <div className="text-xs text-muted-foreground">Gemini AI is analyzing {analysis.totalArticles} data points</div>
                  </div>
                </div>
                <InsightsSkeleton />
              </div>
            )}

            {aiError && !aiLoading && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
                ⚠️ {aiError} — showing rule-based analysis
              </div>
            )}

            {/* AI Report */}
            {ai && !aiLoading && (
              <ErrorBoundary label="AI Report">
                <div className="space-y-4">

                  {/* Executive Summary */}
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">Executive Summary</span>
                      <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                        {ai.generated_by}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">{ai.executive_summary}</p>
                    {ai.market_position && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ai.market_position}</p>
                    )}
                  </div>

                  {/* Signals grid */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Bullish */}
                    <div className="rounded-xl border border-emerald-500/20 bg-card p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Bullish Signals</span>
                      </div>
                      <ul className="space-y-2.5">
                        {ai.bullish_signals.slice(0, 4).map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            <span className="text-foreground/90">{s}</span>
                          </li>
                        ))}
                        {ai.bullish_signals.length === 0 && (
                          <li className="text-xs text-muted-foreground italic">No significant bullish signals detected</li>
                        )}
                      </ul>
                    </div>

                    {/* Bearish */}
                    <div className="rounded-xl border border-red-500/20 bg-card p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingDown className="h-4 w-4 text-red-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-red-400">Bearish Signals</span>
                      </div>
                      <ul className="space-y-2.5">
                        {ai.bearish_signals.slice(0, 4).map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <ArrowDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                            <span className="text-foreground/90">{s}</span>
                          </li>
                        ))}
                        {ai.bearish_signals.length === 0 && (
                          <li className="text-xs text-muted-foreground italic">No significant bearish signals detected</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Risk flags */}
                  {(riskHigh > 0 || riskMedium > 0 || ai.key_risks.length > 0) && (
                    <div className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="h-4 w-4 text-red-400" />
                        <span className="text-xs font-bold uppercase tracking-widest">Risk Assessment</span>
                        {riskHigh > 0 && <span className="ml-auto rounded-full bg-red-400/10 px-2 py-0.5 text-xs font-bold text-red-400">{riskHigh} HIGH</span>}
                        {riskMedium > 0 && <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-bold text-amber-400">{riskMedium} MED</span>}
                      </div>
                      <div className="space-y-2 mb-4">
                        {analysis.riskFlags.slice(0, 3).map((r, i) => {
                          const c = r.severity === 'HIGH' ? 'text-red-400 bg-red-400/10' : r.severity === 'MEDIUM' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 bg-slate-400/10';
                          return (
                            <div key={i} className="flex items-start gap-2 rounded-lg border border-border p-3">
                              <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold', c)}>{r.severity}</span>
                              <div>
                                <div className="text-sm font-medium text-foreground">{r.description}</div>
                                <div className="text-xs text-muted-foreground">{r.category}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {ai.key_risks.length > 0 && (
                        <div>
                          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Analyst Risk Commentary</div>
                          <ul className="space-y-1.5">
                            {ai.key_risks.slice(0, 3).map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" /> {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Opportunities */}
                  {ai.opportunities.length > 0 && (
                    <div className="rounded-xl border border-emerald-500/15 bg-card p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Opportunities</span>
                      </div>
                      <ul className="space-y-2.5">
                        {ai.opportunities.slice(0, 4).map((o, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            <span className="text-foreground/90">{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actionable Recommendations */}
                  {ai.actionable_recommendations.length > 0 && (
                    <div className="rounded-xl border border-primary/15 bg-card p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">Actionable Recommendations</span>
                      </div>
                      <ol className="space-y-2.5">
                        {ai.actionable_recommendations.slice(0, 4).map((r, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                            <span className="text-foreground/90">{r}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Raw intelligence signals (non-duplicated — AI commentary only) */}
                  {analysis.insights.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-bold uppercase tracking-widest">Detected Intelligence Signals</span>
                        <span className="ml-auto text-xs text-muted-foreground">{analysis.insights.length} signals</span>
                      </div>
                      <div className="space-y-2">
                        {analysis.insights.map((ins, i) => {
                          const typeMap = {
                            trend: 'text-blue-400 bg-blue-400/10',
                            risk: 'text-red-400 bg-red-400/10',
                            opportunity: 'text-emerald-400 bg-emerald-400/10',
                            alert: 'text-amber-400 bg-amber-400/10',
                            innovation: 'text-violet-400 bg-violet-400/10',
                          };
                          const tc = typeMap[ins.type as keyof typeof typeMap] ?? typeMap.alert;
                          return (
                            <div key={i} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                              <span className={cn('shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase', tc)}>{ins.type}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground">{ins.title}</div>
                                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ins.description}</div>
                              </div>
                              <div className="shrink-0 text-xs tabular-nums text-muted-foreground">{ins.confidence}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Confidence footnote */}
                  {ai.confidence_note && (
                    <p className="text-xs text-muted-foreground border-t border-border pt-3">{ai.confidence_note}</p>
                  )}
                </div>
              </ErrorBoundary>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
