'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AnalyzeFormProps {
  onSubmit: (company: string, days: number) => void;
  isLoading?: boolean;
  defaultCompany?: string;
}

const QUICK_COMPANIES = ['Apple', 'NVIDIA', 'Tesla', 'Microsoft', 'Google', 'Meta', 'Amazon'];
const QUICK_DAYS = [1, 3, 7, 14, 30];

export function AnalyzeForm({ onSubmit, isLoading, defaultCompany = '' }: AnalyzeFormProps) {
  const [company, setCompany] = useState(defaultCompany);
  const [days, setDays] = useState(7);
  const [daysInput, setDaysInput] = useState('7');
  const [daysError, setDaysError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [useCustomDays, setUseCustomDays] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const daysRef = useRef<HTMLInputElement>(null);

  const filtered = QUICK_COMPANIES.filter(
    (c) => company && c.toLowerCase().includes(company.toLowerCase()) && c.toLowerCase() !== company.toLowerCase(),
  );

  const handleDaysInputChange = (val: string) => {
    setDaysInput(val);
    const n = parseInt(val, 10);
    if (isNaN(n) || val.trim() === '') {
      setDaysError('Enter a number');
      return;
    }
    if (n < 1) { setDaysError('Minimum is 1 day'); return; }
    if (n > 30) { setDaysError('Maximum is 30 days'); return; }
    setDaysError('');
    setDays(n);
  };

  const handleQuickDay = (d: number) => {
    setDays(d);
    setDaysInput(String(d));
    setDaysError('');
    setUseCustomDays(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || isLoading || daysError) return;
    const finalDays = Math.max(1, Math.min(30, days));
    onSubmit(company.trim(), finalDays);
  };

  const selectCompany = (name: string) => {
    setCompany(name);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Company input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={company}
          onChange={(e) => { setCompany(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Enter company name (e.g. Apple, Tesla…)"
          className={cn(
            'h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground',
            'placeholder:text-muted-foreground',
            'transition-colors duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
          )}
          disabled={isLoading}
          autoComplete="off"
        />
        <AnimatePresence>
          {showSuggestions && filtered.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
            >
              {filtered.map((c) => (
                <button key={c} type="button" onClick={() => selectCompany(c)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground hover:bg-accent">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/50" /> {c}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick chips */}
      {!company && (
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs text-muted-foreground">Quick:</span>
          {QUICK_COMPANIES.slice(0, 6).map((c) => (
            <button key={c} type="button" onClick={() => setCompany(c)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground">
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Days selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Time range: <span className="font-semibold text-foreground">{days} day{days !== 1 ? 's' : ''}</span></span>
          <button type="button" onClick={() => { setUseCustomDays(!useCustomDays); if (!useCustomDays) setTimeout(() => daysRef.current?.focus(), 50); }}
            className="ml-auto rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent">
            {useCustomDays ? 'Use preset' : 'Custom'}
          </button>
        </div>

        {/* Quick presets */}
        {!useCustomDays && (
          <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-2">
            {QUICK_DAYS.map((d) => (
              <button key={d} type="button" onClick={() => handleQuickDay(d)}
                className={cn(
                  'flex-1 rounded-lg py-1.5 text-xs font-medium transition-all',
                  days === d ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}>
                {d}d
              </button>
            ))}
          </div>
        )}

        {/* Custom input */}
        {useCustomDays && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                ref={daysRef}
                type="number"
                min={1} max={30}
                value={daysInput}
                onChange={(e) => handleDaysInputChange(e.target.value)}
                placeholder="1–30"
                className={cn(
                  'h-10 w-full rounded-xl border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20',
                  daysError ? 'border-red-500/50' : 'border-border focus:border-primary/50',
                )}
              />
              {daysError && <p className="mt-1 text-xs text-red-400">{daysError}</p>}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">days (1–30)</span>
          </motion.div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <motion.button
          type="submit"
          disabled={!company.trim() || isLoading || !!daysError}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold',
            'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}>
          {isLoading ? (
            <>
              <motion.div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
              Analyzing…
            </>
          ) : (
            <><Zap className="h-4 w-4" /> Analyze {days}d</>
          )}
        </motion.button>
      </div>

      <p className="text-right text-xs text-muted-foreground">
        Press <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-xs">⌘ Enter</kbd> to analyze
      </p>
    </form>
  );
}
