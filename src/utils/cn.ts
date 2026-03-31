import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ArticleDomain } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trim() + '…';
}

// Domain colors exactly matching reference design
export const DOMAIN_COLORS: Record<ArticleDomain, string> = {
  Finance: '#6366f1',
  Product: '#3b82f6',
  Partnerships: '#22c55e',
  Legal: '#f59e0b',
  Leadership: '#ec4899',
  Technology: '#06b6d4',
  Market: '#8b5cf6',
  ESG: '#10b981',
  'M&A': '#f97316',
};

export function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain as ArticleDomain] ?? '#6b7280';
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return '#22c55e';
    case 'negative': return '#ef4444';
    default: return '#94a3b8';
  }
}

export function getSentimentBg(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return 'bg-green-500/10 text-green-500';
    case 'negative': return 'bg-red-500/10 text-red-500';
    default: return 'bg-slate-500/10 text-slate-500';
  }
}
