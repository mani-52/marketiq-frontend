'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Trash2, Clock, Mail, RefreshCw, CheckCircle, AlertCircle, Send, Settings2, BellOff, Loader2 } from 'lucide-react';
import { notificationsApi } from '@/services/api';
import { Notification, NotificationSettings, CreateNotificationPayload } from '@/types';
import { cn } from '@/utils/cn';
import { storageGet } from '@/utils/storage';


const QUICK_OFFSETS = [
  { label: '10 sec', seconds: 10 },
  { label: '20 sec', seconds: 20 },
  { label: '15 min', seconds: 900 },
  { label: '1 hr', seconds: 3600 },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
  return (
    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
      className="fixed top-4 right-4 z-50 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-2xl max-w-xs">
      {msg}
    </motion.div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true, risk_alerts: true, analysis_complete: true, weekly_digest: false,
  });
  const [sentCount,  setSentCount]  = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [creating,   setCreating]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [activeTab,  setActiveTab]  = useState<'reminders' | 'settings' | 'log'>('reminders');
  const [toast,      setToast]      = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [backendOk,  setBackendOk]  = useState<boolean | null>(null);

  const [form, setForm] = useState({
    title: '', message: '', company: '',
    useDateTime: false, dateTime: '',
    quickOffset: 20, repeat: '' as '' | 'daily' | 'weekly',
    notify_type: 'reminder',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.list();
      setNotifications(data.notifications ?? []);
      setSettings(data.settings ?? settings);
      setSentCount(data.sent_count ?? 0);
      setBackendOk(true);
    } catch {
      setBackendOk(false);
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  useEffect(() => { load(); }, [load]);

  const notifTypeIcon = (t: string) => t === 'risk_alert' ? '🚨' : t === 'analysis_done' ? '✅' : '⏰';
  const statusColor = (s: string) => s === 'sent' ? 'text-emerald-400' : s === 'skipped' ? 'text-muted-foreground' : 'text-primary';

  const handleCreate = async () => {
    if (!form.title.trim()) { setToast('Title is required'); return; }
    setCreating(true);
    const user = storageGet<any>('miq_user');
    const payload: CreateNotificationPayload & { user_email?: string; user_name?: string } = {
      title:       form.title.trim(),
      message:     form.message.trim() || 'Your MarketIQ reminder.',
      company:     form.company.trim(),
      notify_type: form.notify_type,
      repeat:      form.repeat || null,
      user_email:  user?.email || '',
      user_name:   user?.name || 'User',
    };
    if (form.useDateTime && form.dateTime) {
      payload.fire_at = new Date(form.dateTime).toISOString();
    } else {
      payload.fire_in_seconds = form.quickOffset;
    }
    try {
      const n = await notificationsApi.create(payload);
      setNotifications(prev => [n, ...prev]);
      setShowForm(false);
      setForm({ title: '', message: '', company: '', useDateTime: false, dateTime: '', quickOffset: 20, repeat: '', notify_type: 'reminder' });
      setToast('✅ Reminder scheduled!');
    } catch (e: any) {
      setToast('❌ ' + (e.message || 'Failed'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setToast('Reminder deleted');
    } catch { setToast('Delete failed'); }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await notificationsApi.updateSettings(settings);
      setToast('✅ Settings saved');
    } catch { setToast('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <AnimatePresence>
        {toast && <Toast msg={toast} onDone={() => setToast('')} />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Schedule email reminders · {sentCount > 0 && `${sentCount} sent`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setRetryCount(c => c + 1)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New
          </button>
        </div>
      </div>

      {/* Backend status */}
      {backendOk === false && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-sm font-medium text-amber-400">Backend not reachable</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Make sure the backend is running at {process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}.
            Notifications require the backend to persist and schedule.
          </p>
          <button onClick={() => setRetryCount(c => c + 1)}
            className="mt-2 text-xs text-amber-400 underline">Retry connection</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-xl border border-border bg-card p-1">
        {(['reminders', 'settings', 'log'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition-all',
              activeTab === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {t === 'reminders' ? `Reminders (${notifications.length})` : t === 'settings' ? 'Settings' : 'Sent Log'}
          </button>
        ))}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .97 }}
            className="rounded-xl border border-primary/20 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">New Reminder</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Check Apple Q2 earnings"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Company (optional)</label>
                <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="e.g. Apple"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Type</label>
                <select value={form.notify_type} onChange={e => setForm(p => ({ ...p, notify_type: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none">
                  <option value="reminder">⏰ Reminder</option>
                  <option value="risk_alert">🚨 Risk Alert</option>
                  <option value="analysis_done">✅ Analysis Done</option>
                </select>
              </div>
            </div>

            {/* When */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">When</label>
                <button type="button" onClick={() => setForm(p => ({ ...p, useDateTime: !p.useDateTime }))}
                  className={cn('rounded-full border px-2.5 py-0.5 text-xs', form.useDateTime ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                  {form.useDateTime ? '📅 Exact time' : '⏱ Quick offset'}
                </button>
              </div>
              {!form.useDateTime ? (
                <div className="flex flex-wrap gap-2">
                  {QUICK_OFFSETS.map(({ label, seconds }) => (
                    <button key={label} type="button" onClick={() => setForm(p => ({ ...p, quickOffset: seconds }))}
                      className={cn('rounded-full border px-3 py-1 text-xs', form.quickOffset === seconds ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground hover:border-primary/40')}>
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <input type="datetime-local" value={form.dateTime} onChange={e => setForm(p => ({ ...p, dateTime: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none" />
              )}
            </div>

            {/* Repeat */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Repeat</label>
              <div className="flex gap-2">
                {[{ l: 'Once', v: '' }, { l: '↻ Daily', v: 'daily' }, { l: '↻ Weekly', v: 'weekly' }].map(({ l, v }) => (
                  <button key={v} type="button" onClick={() => setForm(p => ({ ...p, repeat: v as any }))}
                    className={cn('rounded-full border px-3 py-1 text-xs', form.repeat === v ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground')}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm text-muted-foreground hover:bg-accent">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !form.title.trim()}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</> : <><Send className="h-4 w-4" />Schedule</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminders tab */}
      {activeTab === 'reminders' && (
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <BellOff className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No reminders yet.</p>
              <button onClick={() => setShowForm(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Create your first reminder →
              </button>
            </div>
          ) : notifications.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/15 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-base">{notifTypeIcon(n.notify_type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{n.title}</span>
                  <span className={cn('text-xs font-medium', statusColor(n.status))}>{n.status}</span>
                  {n.repeat && <span className="text-xs text-muted-foreground">↻ {n.repeat}</span>}
                </div>
                {n.company && <p className="text-xs text-muted-foreground mt-0.5">📊 {n.company}</p>}
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtDate(n.fire_at)}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(n.id)}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Settings2 className="h-4 w-4" /> Email Preferences</h3>
          {[
            { key: 'email_notifications' as const, label: 'Enable email notifications', desc: 'Master switch for all alerts' },
            { key: 'risk_alerts' as const,          label: 'Risk alerts',                desc: 'Email when HIGH risk flags detected' },
            { key: 'analysis_complete' as const,    label: 'Analysis complete',          desc: 'Email when analysis finishes' },
            { key: 'weekly_digest' as const,        label: 'Weekly digest',              desc: 'Weekly summary of tracked companies' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <button onClick={() => setSettings(p => ({ ...p, [key]: !p[key] }))}
                className={cn('relative h-6 w-11 rounded-full transition-colors', settings[key] ? 'bg-primary' : 'bg-muted')}>
                <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', settings[key] ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </div>
          ))}
          <button onClick={handleSaveSettings} disabled={saving}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? 'Saving…' : <><CheckCircle className="h-4 w-4" /> Save Settings</>}
          </button>
        </div>
      )}

      {/* Log tab */}
      {activeTab === 'log' && <SentLog />}
    </div>
  );
}

function SentLog() {
  const [log, setLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.getLog().then(d => setLog(d.log ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!log.length) return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <Mail className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">No emails sent yet.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-2">{log.length} email(s) dispatched</p>
      {log.map((e, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          {e.success ? <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{e.title}</p>
            <p className="text-xs text-muted-foreground">→ {e.sent_to} · {new Date(e.sent_at).toLocaleString()}</p>
          </div>
          <span className={cn('text-xs rounded-full px-2 py-0.5 font-medium', e.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
            {e.success ? 'Delivered' : 'Failed'}
          </span>
        </div>
      ))}
    </div>
  );
}
