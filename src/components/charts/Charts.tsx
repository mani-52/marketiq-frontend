'use client';

import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ComposedChart, ReferenceLine,
} from 'recharts';
import { DomainDistribution, TimelinePoint } from '@/types';

const tooltipStyle = {
  backgroundColor: 'hsl(224 71.4% 5%)',
  border: '1px solid hsl(215 27.9% 18%)',
  borderRadius: '10px',
  fontSize: '11px',
  padding: '8px 12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

// Sentiment + Volume composed chart
export function SentimentTimelineChart({ data, height = 220 }: { data: TimelinePoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <YAxis yAxisId="vol" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <YAxis yAxisId="sent" orientation="right" domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
        <Area yAxisId="vol" type="monotone" dataKey="articles" name="Volume" stroke="#6366f1" strokeWidth={2} fill="url(#volGrad)" dot={false} />
        <Line yAxisId="sent" type="monotone" dataKey="sentiment" name="Sentiment %" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="4 2" />
        <ReferenceLine yAxisId="sent" y={50} stroke="#64748b" strokeDasharray="2 4" strokeWidth={1} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Volume bar chart
export function VolumeBarChart({ data, height = 180 }: { data: TimelinePoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="articles" name="Articles" radius={[3, 3, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={`hsl(${243 + i * 3} 75% ${52 + (i % 4) * 4}%)`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Domain donut
const RADIAN = Math.PI / 180;
function PctLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.07) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>{`${(percent * 100).toFixed(0)}%`}</text>;
}

export function DomainPieChart({ data, height = 240 }: { data: DomainDistribution[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="count" labelLine={false} label={PctLabel}>
          {data.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v: any, _: any, p: any) => [`${v} articles (${p.payload.percentage}%)`, p.payload.domain]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DomainBarChart({ data, height = 240 }: { data: DomainDistribution[]; height?: number }) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 30, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="domain" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={76} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" name="Articles" radius={[0, 4, 4, 0]}>
          {sorted.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Multi-line sentiment breakdown
export function SentimentBreakdownChart({ data, height = 200 }: { data: { date: string; positive: number; neutral: number; negative: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '10px' }} />
        <Line type="monotone" dataKey="positive" name="Positive" stroke="#22c55e" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="neutral" name="Neutral" stroke="#94a3b8" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="negative" name="Negative" stroke="#ef4444" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Radar / spider chart
export function CompanyRadarChart({ data, height = 260 }: { data: { subject: string; score: number; benchmark: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 8, right: 30, bottom: 8, left: 30 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <Radar name="Company" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
        <Radar name="Benchmark" dataKey="benchmark" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '10px' }} />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Sparkline
export function Sparkline({ data, color = '#6366f1', height = 40 }: { data: number[]; color?: string; height?: number }) {
  const pts = data.map((v, i) => ({ v, i }));
  const id = `sg${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={pts} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// SVG score gauge
export function ScoreGauge({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 30; const circ = 2 * Math.PI * r;
  const dash = circ * (value / 100);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.25}
          style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x="40" y="44" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">{value}%</text>
      </svg>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

// Heatmap calendar
export function ActivityHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const grid: { date: string; count: number }[][] = [];
  let col: { date: string; count: number }[] = [];
  data.slice(-35).forEach((d, i) => {
    col.push(d);
    if (col.length === 7 || i === data.slice(-35).length - 1) { grid.push(col); col = []; }
  });
  return (
    <div className="flex gap-1">
      {grid.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((d, di) => {
            const op = d.count === 0 ? 0.06 : 0.15 + (d.count / max) * 0.85;
            return (
              <div key={di} title={`${d.date}: ${d.count} articles`}
                className="h-3 w-3 rounded-sm cursor-default"
                style={{ backgroundColor: `rgba(99,102,241,${op})` }} />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Confidence trend line chart (for insights)
export function ConfidenceTrendChart({ data, height = 160 }: { data: { label: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Confidence']} />
        <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fill="url(#confGrad)" dot={{ fill: '#22c55e', r: 3 }} />
        <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.4} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
