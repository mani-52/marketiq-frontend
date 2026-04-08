'use client';

import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Lightbulb, Bell } from 'lucide-react';
import { InsightCard as InsightCardType } from '@/types';
import { formatRelativeTime } from '@/utils/cn';

/* ✅ ADD THIS TYPE */
type InsightType = "trend" | "risk" | "opportunity" | "alert" | "innovation";

/* ✅ FIXED TYPECONFIG WITH PROPER TYPING */
const typeConfig: Record<
  InsightType,
  {
    icon: any;
    label: string;
    color: string;
  }
> = {
  trend: { icon: TrendingUp, label: 'Trend', color: '#6366f1' },
  risk: { icon: AlertTriangle, label: 'Risk', color: '#ef4444' },
  opportunity: { icon: Lightbulb, label: 'Opportunity', color: '#22c55e' },
  alert: { icon: Bell, label: 'Alert', color: '#f59e0b' },
  innovation: { icon: Lightbulb, label: 'Innovation', color: '#a855f7' },
};

export function InsightCard({ insight, index = 0 }: { insight: InsightCardType; index?: number }) {
  /* ✅ FIXED TYPE ERROR HERE */
  const config = typeConfig[insight.type as InsightType] ?? typeConfig.alert;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.28 }}
      className="group rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
          style={{ backgroundColor: `${config.color}18` }}
        >
          <Icon className="h-4 w-4" style={{ color: config.color }} />
        </div>
        <span
          className="mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${config.color}15`, color: config.color }}
        >
          {config.label}
        </span>
      </div>

      <h4 className="mb-1.5 text-sm font-semibold text-foreground line-clamp-2">
        {insight.title}
      </h4>

      <p className="mb-3 text-xs leading-relaxed text-muted-foreground line-clamp-3">
        {insight.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${insight.confidence}%`,
                backgroundColor: config.color,
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {insight.confidence}% conf.
          </span>
        </div>

        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(insight.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}
