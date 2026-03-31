'use client';

/**
 * Domain Matrix page — company-specific, history-driven.
 *
 * Data flow:
 *   User selects company → reads StoredAnalysis from localStorage
 *   → shows real domain distribution with weights from that analysis
 *   → toggle "This Analysis" / "All Historical" aggregates across all stored analyses
 *
 * No static/hardcoded percentages.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Grid3X3, TrendingUp, Shield, Zap, BarChart2, Info,
  ChevronDown, ArrowRight, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { marketApi } from '@/services/api';
import { StoredAnalysis, DomainDistribution } from '@/types';
import { cn } from '@/utils/cn';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const DIM_META = [
  { key: 'riskWeight' as const,       label: 'Risk Weight',    icon: Shield,    color: '#ef4444', desc: 'How much news in this domain signals risk' },
  { key: 'innovationWeight' as const, label: 'Innovation',     icon: Zap,       color: '#6366f1', desc: 'Innovation signal strength' },
  { key: 'volatilityWeight' as const, label: 'Volatility',     icon: BarChart2, color: '#f59e0b', desc: 'How volatile / fast-moving this domain is' },
  { key: 'growthSignal' as const,     label: 'Growth Signal',  icon: TrendingUp,color: '#22c55e', desc: 'Strength of growth indicators' },
];

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${Math.round(value * 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 9999, background: color }}
        />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{Math.round(value * 100)}%</span>
    </div>
  );
}

/**
 * Aggregate domain distributions across multiple analyses.
 * Combines article counts and recalculates percentages.
 * Weights are averaged.
 */
function aggregateDomains(analyses: StoredAnalysis[]): DomainDistribution[] {
  const map: Record<string, {
    count: number; color: string; description: string;
    riskWeight: number; innovationWeight: number;
    volatilityWeight: number; growthSignal: number; n: number;
  }> = {};

  analyses.forEach(a => {
    a.domainDistribution.forEach(dd => {
      if (!map[dd.domain]) {
        map[dd.domain] = {
          count: 0, color: dd.color, description: dd.description || '',
          riskWeight: 0, innovationWeight: 0, volatilityWeight: 0, growthSignal: 0, n: 0,
        };
      }
      map[dd.domain].count        += dd.count;
      map[dd.domain].riskWeight       += (dd.riskWeight ?? 0);
      map[dd.domain].innovationWeight += (dd.innovationWeight ?? 0);
      map[dd.domain].volatilityWeight += (dd.volatilityWeight ?? 0);
      map[dd.domain].growthSignal     += (dd.growthSignal ?? 0);
      map[dd.domain].n                += 1;
    });
  });

  const total = Object.values(map).reduce((s, d) => s + d.count, 0);
  return Object.entries(map)
    .map(([domain, d]) => ({
      domain:           domain as any,
      count:            d.count,
      percentage:       total > 0 ? Math.round((d.count / total) * 100) : 0,
      color:            d.color,
      description:      d.description,
      riskWeight:       d.n > 0 ? d.riskWeight / d.n : 0,
      innovationWeight: d.n > 0 ? d.innovationWeight / d.n : 0,
      volatilityWeight: d.n > 0 ? d.volatilityWeight / d.n : 0,
      growthSignal:     d.n > 0 ? d.growthSignal / d.n : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Grid3X3 className="h-8 w-8 text-primary/60" />
      </div>
      <h2 className="mb-2 text-base font-semibold text-foreground">No analysis data yet</h2>
      <p className="mb-6 max-w-xs text-sm text-muted-foreground leading-relaxed">
        Run a company analysis to see its domain classification matrix — computed from real article data.
      </p>
      <Link href="/dashboard/analyze"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        Analyze a company <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DomainMatrixPage() {
  const [companies,    setCompanies]    = useState<string[]>([]);
  const [selected,     setSelected]     = useState<string>('');
  const [analysis,     setAnalysis]     = useState<StoredAnalysis | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [viewMode,     setViewMode]     = useState<'current' | 'historical'>('current');
  const [tooltip,      setTooltip]      = useState('');

  useEffect(() => {
    const list = marketApi.getAnalyzedCompanies();
    setCompanies(list);
    if (list.length > 0) {
      setSelected(list[0]);
      setAnalysis(marketApi.getStoredAnalysis(list[0]));
    }
  }, []);

  const handleSelect = (company: string) => {
    setSelected(company);
    setDropdownOpen(false);
    setAnalysis(marketApi.getStoredAnalysis(company));
    setViewMode('current');
  };

  // Historical: aggregate all stored analyses for this company
  // (In practice each company has one stored result, but this is the right architecture)
  const domains: DomainDistribution[] = useMemo(() => {
    if (!analysis) return [];
    if (viewMode === 'current') {
      return [...analysis.domainDistribution].sort((a, b) => b.count - a.count);
    }
    // "All historical" — aggregate all companies' analyses
    const allAnalyses = companies
      .map(c => marketApi.getStoredAnalysis(c))
      .filter(Boolean) as StoredAnalysis[];
    return aggregateDomains(allAnalyses.filter(a => a.company === selected || viewMode === 'historical'));
  }, [analysis, viewMode, companies, selected]);

  const hasWeights = domains.some(d => (d.riskWeight ?? 0) > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start flex-wrap justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-primary" />
              Domain Classification Matrix
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Domain coverage computed from real article data — not static weights.
            </p>
          </div>

          {/* Company selector */}
          {companies.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent">
                  {selected || 'Select company'}
                  <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', dropdownOpen && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                      {companies.map(c => (
                        <button key={c} onClick={() => handleSelect(c)}
                          className={cn('flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-accent',
                            c === selected ? 'text-primary font-semibold' : 'text-foreground')}>
                          {c === selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                          {c !== selected && <div className="h-3.5 w-3.5" />}
                          {c}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Empty state */}
      {!analysis && <EmptyState />}

      {analysis && (
        <>
          {/* Context banner */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{analysis.company}</span>
              <span>·</span>
              <span>{analysis.totalArticles} articles</span>
              <span>·</span>
              <span>{analysis.daysAnalyzed}d window</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                {new Date(analysis.analyzedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Toggle */}
            <div className="flex rounded-lg border border-border bg-background p-0.5">
              {(['current', 'historical'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={cn('rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    viewMode === mode ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                  {mode === 'current' ? 'This Analysis' : 'All Companies'}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Domain cards grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {domains.map((dd, i) => (
              <motion.div key={dd.domain}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.22 }}
                className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">

                {/* Domain header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ background: dd.color }} />
                    <span className="text-sm font-semibold text-foreground">{dd.domain}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold" style={{ color: dd.color }}>{dd.percentage}%</span>
                    <div className="text-xs text-muted-foreground">{dd.count} articles</div>
                  </div>
                </div>

                {/* Percentage bar */}
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${dd.percentage}%` }}
                    transition={{ delay: i * 0.04 + 0.1, duration: 0.6, ease: 'easeOut' }}
                    style={{ height: '100%', background: dd.color, borderRadius: 9999 }}
                  />
                </div>

                {dd.description && (
                  <p className="mb-3 text-xs text-muted-foreground leading-relaxed">{dd.description}</p>
                )}

                {/* Dimension weights */}
                {hasWeights && (
                  <div className="space-y-2.5">
                    {DIM_META.map(({ key, label, color }) => (
                      <div key={key}>
                        <div className="mb-1 flex justify-between">
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                        <ScoreBar value={(dd as any)[key] ?? 0} color={color} />
                      </div>
                    ))}
                  </div>
                )}

                {!hasWeights && (
                  <p className="text-xs text-muted-foreground italic">
                    Re-analyze to get dimension weights.
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Full table */}
          <ErrorBoundary label="Domain Matrix Table">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Full Matrix — {analysis.company}</h2>
              {viewMode === 'historical' && (
                <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">All companies aggregated</span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {tooltip || 'Hover a column header for details'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium w-32">Domain</th>
                    <th className="px-4 py-3 text-center text-muted-foreground font-medium">Articles</th>
                    <th className="px-4 py-3 text-center text-muted-foreground font-medium">Share</th>
                    {hasWeights && DIM_META.map(({ key, label, icon: Icon, color, desc }) => (
                      <th key={key} className="px-3 py-3 text-center cursor-help"
                        onMouseEnter={() => setTooltip(desc)} onMouseLeave={() => setTooltip('')}>
                        <div className="flex flex-col items-center gap-1">
                          <Icon className="h-3.5 w-3.5" style={{ color }} />
                          <span className="text-muted-foreground font-medium whitespace-nowrap">{label}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {domains.map((dd, i) => (
                    <tr key={dd.domain}
                      className={cn('border-b border-border/50 transition-colors hover:bg-primary/5',
                        i % 2 === 0 ? 'bg-card' : 'bg-muted/10')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ background: dd.color }} />
                          <span className="font-medium text-foreground">{dd.domain}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{dd.count}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold" style={{ color: dd.color }}>{dd.percentage}%</span>
                          <div className="h-1 w-14 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${dd.percentage}%`, background: dd.color }} />
                          </div>
                        </div>
                      </td>
                      {hasWeights && DIM_META.map(({ key, color }) => {
                        const val = (dd as any)[key] ?? 0;
                        return (
                          <td key={key} className="px-3 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-semibold" style={{ color }}>{Math.round(val * 100)}%</span>
                              <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.round(val * 100)}%`, background: color }} />
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          </ErrorBoundary>
          {/* Dimension legend */}
          {hasWeights && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DIM_META.map(({ label, icon: Icon, color, desc }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="h-4 w-4" style={{ color }} />
                    <span className="text-xs font-semibold text-foreground">{label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
