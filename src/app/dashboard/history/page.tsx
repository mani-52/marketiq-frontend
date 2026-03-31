'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Clock, Trash2, ArrowRight, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { marketApi } from '@/services/api';
import { SearchHistory } from '@/types';
import { formatRelativeTime, getSentimentColor } from '@/utils/cn';

export default function HistoryPage() {
  const [history, setHistory] = useState<SearchHistory[]>([]);

  useEffect(() => {
    setHistory(marketApi.getHistory());
  }, []);

  const clearHistory = () => {
    marketApi.clearHistory();
    setHistory([]);
  };

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-foreground">History</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your recent market intelligence analyses.</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </motion.div>

      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center"
        >
          <Clock className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <h3 className="mb-1 text-sm font-semibold text-foreground">No history yet</h3>
          <p className="mb-4 text-xs text-muted-foreground">Run your first analysis to see it here.</p>
          <Link
            href="/dashboard/analyze"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Start analyzing <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {history.map((h, i) => {
            const sentColor = getSentimentColor(h.sentiment || 'neutral');
            const SentIcon = h.sentiment === 'positive' ? TrendingUp : h.sentiment === 'negative' ? TrendingDown : Minus;

            return (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.22 }}
              >
                <Link
                  href={`/dashboard/analyze?company=${encodeURIComponent(h.company)}`}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 hover:border-primary/30 hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{h.company}</p>
                      <p className="text-xs text-muted-foreground">{h.days}d window · {h.articleCount} articles</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {h.sentiment && (
                      <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${sentColor}15`, color: sentColor }}>
                        <SentIcon className="h-3 w-3" />
                        {h.sentiment}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(h.searchedAt)}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
