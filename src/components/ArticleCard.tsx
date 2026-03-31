'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Clock, TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb } from 'lucide-react';
import { Article } from '@/types';
import { cn, formatRelativeTime, getDomainColor, getSentimentColor } from '@/utils/cn';

interface ArticleCardProps {
  article: Article;
  index?: number;
}

export function ArticleCard({ article, index = 0 }: ArticleCardProps) {
  const domainColor = getDomainColor(article.domain);
  const sentimentColor = getSentimentColor(article.sentiment);

  const SentimentIcon =
    article.sentiment === 'positive'
      ? TrendingUp
      : article.sentiment === 'negative'
        ? TrendingDown
        : Minus;

  // The card itself is clickable and opens the source article
  const handleCardClick = () => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
      onClick={handleCardClick}
      className={cn(
        'group relative rounded-xl border border-border bg-card p-5 transition-all duration-200',
        'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        article.url ? 'cursor-pointer' : '',
      )}
    >
      {/* Risk / Innovation badges */}
      {(article.isRisk || article.isInnovation) && (
        <div className="absolute right-3 top-3 flex items-center gap-1">
          {article.isRisk && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-500">
              <AlertTriangle className="h-2.5 w-2.5" />
              Risk
            </span>
          )}
          {article.isInnovation && (
            <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-500">
              <Lightbulb className="h-2.5 w-2.5" />
              Innovation
            </span>
          )}
        </div>
      )}

      {/* Top row */}
      <div className="mb-3 flex items-center justify-between gap-3 pr-16">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${domainColor}18`,
              color: domainColor,
              border: `1px solid ${domainColor}30`,
            }}
          >
            {article.domain}
          </span>

          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${sentimentColor}15`,
              color: sentimentColor,
            }}
          >
            <SentimentIcon className="h-3 w-3" />
            {article.sentiment}
          </span>
        </div>

        {/* Confidence score */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="h-1 w-12 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${article.confidenceScore}%` }}
              transition={{ delay: index * 0.05 + 0.3, duration: 0.5 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${domainColor}, ${domainColor}aa)` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{article.confidenceScore}%</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary line-clamp-2">
        {article.title}
      </h3>

      {/* Summary */}
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground line-clamp-3">
        {article.summary}
      </p>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {article.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="font-medium text-foreground/80">{article.source}</span>
          <span>·</span>
          <span>{formatRelativeTime(article.publishedAt)}</span>
        </div>

        <div
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            if (article.url) window.open(article.url, '_blank', 'noopener,noreferrer');
          }}
        >
          <ExternalLink className="h-3 w-3" />
          Read more
        </div>
      </div>

      {/* Hover glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at top left, ${domainColor}08, transparent 60%)`,
        }}
      />

      {/* Click indicator on hover */}
      {article.url && (
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-primary/0 transition-all duration-200 group-hover:ring-primary/20" />
      )}
    </motion.div>
  );
}
