'use client';

import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} aria-hidden="true" />;
}

export function ArticleCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="mb-2 h-5 w-full" />
      <Skeleton className="mb-4 h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-2/3" />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function AnalysisLoader() {
  const steps = [
    'Scanning news sources',
    'Extracting key insights',
    'Scoring confidence levels',
    'Building intelligence report',
  ];

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
        <motion.div
          className="relative h-16 w-16 rounded-full border-2 border-border"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-primary" />
          <div className="absolute inset-3 rounded-full border border-transparent border-t-primary/50" />
        </motion.div>
      </div>

      <h3 className="mb-2 text-base font-semibold text-foreground">
        Analyzing market intelligence…
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">This may take 10–30 seconds</p>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.6 + 0.3 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.6 + 0.5 }}
              className="h-1.5 w-1.5 rounded-full bg-primary"
            />
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
