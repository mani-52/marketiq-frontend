/**
 * storage.ts — Bulletproof localStorage utilities.
 *
 * Every localStorage read in the app goes through these helpers.
 * They handle:
 *   - SSR (window is undefined on the server)
 *   - JSON.parse failures (corrupt / truncated data)
 *   - QuotaExceededError on writes
 *   - Schema validation before returning data
 */

// ── Safe read ─────────────────────────────────────────────────────────────────

/**
 * Parse a JSON string safely.
 * Returns null instead of throwing on corrupt data.
 */
export function safeParse<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Read + parse a localStorage key safely.
 * Returns null on SSR, missing key, or corrupt data.
 */
export function storageGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  return safeParse<T>(localStorage.getItem(key));
}

// ── Safe write ────────────────────────────────────────────────────────────────

/**
 * Write to localStorage safely.
 * Returns true on success, false if quota is exceeded or SSR.
 */
export function storageSet(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // QuotaExceededError — storage is full
    console.warn(`[storage] Failed to write "${key}":`, e);
    return false;
  }
}

/**
 * Remove a key safely.
 */
export function storageRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

/**
 * Clear all miq_* keys (kept for future use if needed).
 */
export function storageClearApp(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('miq_')) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

// ── Schema validators ─────────────────────────────────────────────────────────

import type { StoredAnalysis } from '@/types';

/**
 * Validate a StoredAnalysis object has all required fields before rendering.
 * Prevents blank pages when backend schema changes.
 */
export function isValidStoredAnalysis(data: unknown): data is StoredAnalysis {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.company            === 'string' &&
    typeof d.analyzedAt         === 'string' &&
    typeof d.totalArticles      === 'number' &&
    Array.isArray(d.insights) &&
    Array.isArray(d.domainDistribution) &&
    Array.isArray(d.riskFlags) &&
    Array.isArray(d.sentimentTimeline) &&
    d.summary !== null && typeof d.summary === 'object'
  );
}

// ── Analysis index management ─────────────────────────────────────────────────

const ANALYSIS_INDEX_KEY  = 'miq_analysis_index';
const MAX_STORED_ANALYSES = 15;

export function analysisStorageKey(company: string): string {
  return `miq_analysis_${company.toLowerCase().replace(/\s+/g, '_')}`;
}

/**
 * Get the deduplicated, ordered list of analyzed companies.
 */
export function getAnalysisIndex(): string[] {
  return storageGet<string[]>(ANALYSIS_INDEX_KEY) ?? [];
}

/**
 * Add/update a company in the analysis index.
 * - Deduplicates (case-insensitive)
 * - Enforces MAX_STORED_ANALYSES limit by evicting the oldest entry
 *   and removing its full analysis object from storage
 */
export function updateAnalysisIndex(company: string): void {
  const current = getAnalysisIndex();

  // Deduplicate: remove any existing entry for this company (case-insensitive)
  const deduped = current.filter(c => c.toLowerCase() !== company.toLowerCase());

  // Prepend new entry
  const updated = [company, ...deduped];

  // Enforce storage limit — evict oldest entries
  while (updated.length > MAX_STORED_ANALYSES) {
    const evicted = updated.pop()!;
    storageRemove(analysisStorageKey(evicted));
    console.info(`[storage] Evicted old analysis for "${evicted}" to stay within ${MAX_STORED_ANALYSES}-entry limit`);
  }

  storageSet(ANALYSIS_INDEX_KEY, updated);
}
