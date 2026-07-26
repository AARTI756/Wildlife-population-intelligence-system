import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, RefreshCw, AlertCircle, ShieldAlert,
  ShieldCheck, Compass, Award, TrendingUp, Leaf, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { PieChart, Pie } from 'recharts';

import api from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import MetricCard from '../../components/common/MetricCard';
import DashboardSection from '../../components/common/DashboardSection';
import ChartCard from '../../components/common/ChartCard';
import FilterBar from '../../components/common/FilterBar';

/* ─────────────────────────────────────────────
   Gauge Chart Setup
───────────────────────────────────────────── */
const RADIAN = Math.PI / 180;

const GAUGE_RANGES = [
  { name: 'Critical',        value: 20, color: '#ef4444' },
  { name: 'Vulnerable',      value: 20, color: '#f97316' },
  { name: 'Moderate Concern',value: 20, color: '#f59e0b' },
  { name: 'Healthy',         value: 20, color: '#10b981' },
  { name: 'Excellent',       value: 20, color: '#047857' },
];

const drawGaugeNeedle = (value, cx, cy, iR, oR, color) => {
  let angle = 180 - (value / 100) * 180;
  if (angle < 0) angle = 0;
  if (angle > 180) angle = 180;
  const length = (iR + oR) / 2;
  const sin = Math.sin(-RADIAN * angle);
  const cos = Math.cos(-RADIAN * angle);
  const xp = cx + length * cos;
  const yp = cy + length * sin;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="none" />
      <path d={`M ${cx - 2} ${cy} L ${xp} ${yp} L ${cx + 2} ${cy} Z`} fill={color} />
    </g>
  );
};

/* ─────────────────────────────────────────────
   Score → color helpers
───────────────────────────────────────────── */
const scoreColor = (score) => {
  if (score >= 90) return '#047857';
  if (score >= 75) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

const scoreColorClass = (score) => {
  if (score >= 90) return 'text-emerald-700 dark:text-emerald-400';
  if (score >= 75) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-rose-600';
};

/* ─────────────────────────────────────────────
   Component Score Bar
───────────────────────────────────────────── */
const ComponentBar = ({ label, weight, value, color }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center text-xs">
      <span className="font-bold text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-slate-400 dark:text-slate-500 text-3xs font-semibold">
          {weight}% weight
        </span>
        <span className="font-black text-slate-900 dark:text-white w-8 text-right">
          {value}
        </span>
      </div>
    </div>
    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Custom Tooltip for charts
───────────────────────────────────────────── */
const HealthTooltip = ({ active, payload, label, dark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl shadow-lg text-xs font-semibold border"
      style={{
        backgroundColor: dark ? '#0f172a' : '#ffffff',
        borderColor:     dark ? '#1e293b' : '#cbd5e1',
      }}
    >
      <p className="font-black text-slate-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const WildlifeHealthScoring = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [filters, setFilters]       = useState({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [timestamp, setTimestamp]   = useState('');

  const [overview,      setOverview]      = useState(null);
  const [breakdown,     setBreakdown]     = useState([]);
  const [trends,        setTrends]        = useState([]);
  const [distribution,  setDistribution]  = useState([]);
  const [comparison,    setComparison]    = useState([]);
  const [alerts,        setAlerts]        = useState([]);

  // Sandbox state
  const [sandboxState, setSandboxState] = useState('live');

  const buildQueryParams = (filterObj) => {
    const params = {};
    if (filterObj.survey_id) params.survey_id = filterObj.survey_id;
    if (filterObj.site_id)   params.site_id   = filterObj.site_id;
    if (filterObj.species)   params.species   = filterObj.species;
    if (filterObj.habitat)   params.habitat   = filterObj.habitat;
    if (filterObj.date_from) params.date_from = filterObj.date_from;
    if (filterObj.date_to)   params.date_to   = filterObj.date_to;
    return params;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const queryParams = buildQueryParams(filters);

    try {
      const [overviewRes, breakdownRes, trendsRes, distRes, compRes, alertsRes] =
        await Promise.all([
          api.get('/api/health/overview',      { params: queryParams }),
          api.get('/api/health/breakdown',     { params: queryParams }),
          api.get('/api/health/trends',        { params: queryParams }),
          api.get('/api/health/distribution',  { params: queryParams }),
          api.get('/api/health/comparison',    { params: queryParams }),
          api.get('/api/health/alerts',        { params: queryParams }),
        ]);

      setOverview(overviewRes.data);
      setBreakdown(breakdownRes.data  || []);
      setTrends(trendsRes.data        || []);
      setDistribution(distRes.data    || []);
      setComparison(compRes.data      || []);
      setAlerts(alertsRes.data        || []);
      setTimestamp(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        })
      );
    } catch (err) {
      console.error('Health scoring fetch failed:', err);
      setError('Connection to backend database failed. Verify PostgreSQL is running.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (sandboxState !== 'live') {
      if (sandboxState === 'loading') { setLoading(true);  setError(null); }
      if (sandboxState === 'error')   { setLoading(false); setError('Sandbox: API Gateway offline.'); }
      return;
    }
    fetchData();
  }, [filters, sandboxState, fetchData]);

  /* ── Derived values ── */
  const currentScore  = overview?.overallScore  ?? 0;
  const scoreLabel    = overview?.statusName    ?? '—';
  const metrics       = overview?.metrics       ?? null;
  const colorClass    = scoreColorClass(currentScore);

  /* ── Chart colors ── */
  const gridColor = dark ? '#1e293b' : '#e2e8f0';
  const axisColor = dark ? '#64748b' : '#475569';
  const tooltipBg = dark ? '#0f172a' : '#ffffff';
  const tooltipBorder = dark ? '#1e293b' : '#cbd5e1';
  const tooltipStyle  = { backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px' };

  /* ── Trend chart: filter out null-score months ── */
  const trendData = trends.filter(t => t.score != null);

  /* ── Severity badge style ── */
  const severityClass = (sev) => {
    if (sev === 'Critical') return 'bg-rose-50 dark:bg-rose-950/25 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30';
    if (sev === 'Warning')  return 'bg-amber-50 dark:bg-amber-950/25 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30';
    return 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30';
  };

  /* ─────────────────────────────────────────── */
  return (
    <div className="space-y-6 animate-fade-in text-slate-850 dark:text-slate-100 font-sans pb-12">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-405 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Ecosystem Scorecard
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Wildlife Health Scoring Engine
          </h1>
          <p className="text-sm text-slate-655 dark:text-slate-400 mt-1 font-semibold">
            Weighted biodiversity index · Population growth stability · Physical habitat suitability
          </p>
        </div>
        <button
          onClick={() => { setSandboxState('live'); fetchData(); }}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-bold text-xs shadow-xs focus:ring-2 focus:ring-emerald-500"
        >
          <RefreshCw className="h-4 w-4 text-emerald-500" />
          Audit Scorecard
        </button>
      </div>

      {/* ── Sandbox Controls ── */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-3xs font-semibold">
        <span className="text-slate-500 dark:text-slate-400 px-2">Dev Sandbox:</span>
        {[
          { key: 'live',    label: 'Connected (Live DB)',  active: 'bg-emerald-500' },
          { key: 'loading', label: 'Loading State',        active: 'bg-amber-500' },
          { key: 'error',   label: 'Error State',          active: 'bg-rose-500' },
        ].map(({ key, label, active }) => (
          <button
            key={key}
            onClick={() => setSandboxState(key)}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              sandboxState === key
                ? `${active} text-white`
                : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <FilterBar filters={filters} onChange={setFilters} disabled={loading && sandboxState === 'live'} />

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-sm font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Hero Score Card ── */}
      <div className="glass-card p-6 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 dark:from-emerald-950/10 dark:to-cyan-950/10 border-l-4 border-l-emerald-500 relative">
        <span
          title="Official Formula: Species Diversity (30%) · Population Stability (25%) · Habitat Quality (20%) · Endangered Species (15%) · Environmental Conditions (10%)"
          className="absolute top-3 right-3 cursor-help text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-5xs p-1"
        >ⓘ</span>

        {/* Score Info */}
        <div className="space-y-3 flex-1">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
            Overall Ecosystem Health Score
          </span>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <div className="h-12 w-24 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ) : (
              <h2 className={`text-5xl font-black tracking-tight ${colorClass}`}>
                {currentScore}
              </h2>
            )}
            <span className="text-sm font-bold text-slate-500">/ 100</span>
          </div>
          <p className="text-xs font-semibold text-slate-655 dark:text-slate-400 leading-relaxed max-w-xl">
            {loading
              ? 'Loading ecological telemetry data…'
              : (
                <>Reserve health is currently rated as{' '}
                  <span className={`font-extrabold ${colorClass}`}>{scoreLabel}</span>
                  {overview && ` · Score computed from ${breakdown.length}-component weighted index`}
                </>
              )
            }
          </p>

          {/* Weight formula chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { label: 'Species Diversity',        pct: '30%', color: '#3b82f6' },
              { label: 'Population Stability',     pct: '25%', color: '#10b981' },
              { label: 'Habitat Quality',          pct: '20%', color: '#f59e0b' },
              { label: 'Endangered Species',       pct: '15%', color: '#ef4444' },
              { label: 'Environmental Conditions', pct: '10%', color: '#8b5cf6' },
            ].map(({ label, pct, color }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-3xs font-black border"
                style={{
                  color,
                  borderColor: `${color}40`,
                  backgroundColor: `${color}10`,
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                {label} · {pct}
              </span>
            ))}
          </div>
        </div>

        {/* Gauge */}
        <div className="shrink-0 flex flex-col items-center justify-center min-w-[200px]">
          {loading ? (
            <div className="h-28 w-48 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : (
            <div className="h-28 w-48 relative overflow-hidden flex items-end justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={GAUGE_RANGES}
                    cx="50%" cy="85%"
                    startAngle={180} endAngle={0}
                    innerRadius={50} outerRadius={66}
                    paddingAngle={0} dataKey="value"
                  >
                    {GAUGE_RANGES.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  {drawGaugeNeedle(currentScore, 96, 136, 50, 66, dark ? '#f8fafc' : '#0f1722')}
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-1 text-center">
                <span className={`text-sm font-black uppercase tracking-wider block ${colorClass}`}>
                  {scoreLabel}
                </span>
                <span className="text-5xs font-bold text-slate-500 uppercase tracking-widest block mt-0.5">
                  Rating Zone
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { key: 'speciesDiversity',       title: 'Species Diversity',    Icon: Award,       colorClass: '' },
          { key: 'populationStability',    title: 'Observation Coverage', Icon: Activity,    colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/30' },
          { key: 'habitatQuality',         title: 'Habitat Quality',      Icon: Leaf,        colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/30' },
          { key: 'endangeredSpeciesStatus',title: 'Endangered Status',    Icon: ShieldAlert, colorClass: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/30' },
          { key: 'environmentalConditions',title: 'Environmental Status', Icon: Compass,     colorClass: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-900/30' },
        ].map(({ key, title, Icon, colorClass: cc }) => {
          const m = metrics?.[key];
          return (
            <MetricCard
              key={key}
              title={title}
              value={loading ? '—' : (m?.value ?? '—')}
              subtext={m?.subtext ?? ''}
              trend={m?.trend ?? 'neutral'}
              trendValue={m?.trendValue ?? ''}
              icon={Icon}
              lastUpdated={timestamp}
              colorClass={cc}
            />
          );
        })}
      </div>

      {/* ── Component Score Breakdown Panel ── */}
      {!loading && !error && breakdown.length > 0 && (
        <DashboardSection
          title="Component Score Breakdown"
          subtitle="Weighted contribution of each ecological domain to the overall health index"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual bars */}
            <div className="glass-card p-6 space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Score Contributions
              </h3>
              <div className="space-y-4">
                {breakdown.map((item) => (
                  <ComponentBar
                    key={item.name}
                    label={item.name}
                    weight={item.weight}
                    value={item.value}
                    color={item.color}
                  />
                ))}
              </div>
            </div>

            {/* Bar chart */}
            <ChartCard
              title="Weighted Score Breakdown"
              subtitle="Performance score vs assigned weight (%) per domain"
              loading={false}
              error={null}
              isEmpty={false}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} margin={{ top: 15, right: 15, left: -15, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis
                    dataKey="name" stroke={axisColor} fontSize={8} tickLine={false}
                    angle={-30} textAnchor="end" interval={0}
                  />
                  <YAxis stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="top" height={30} iconType="circle" fontSize={10} />
                  <Bar dataKey="weight" fill="#cbd5e1" radius={[4,4,0,0]} name="Assigned Weight (%)" />
                  <Bar dataKey="value"  radius={[4,4,0,0]} name="Performance Score">
                    {breakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </DashboardSection>
      )}

      {/* ── Historical Trend + Distribution ── */}
      <DashboardSection
        title="Historical Trend & Sector Distribution"
        subtitle="12-month health index shifts and per-sector ecological scores"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Historical Trend */}
          <ChartCard
            title="Historical Health Trend (12 months)"
            subtitle="Ecosystem health index computed monthly from DB observations"
            loading={loading}
            error={error}
            isEmpty={!loading && !error && trendData.length === 0}
            emptyTitle="No historical telemetry data"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="healthTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="year" stroke={axisColor} fontSize={9} tickLine={false} angle={-25} textAnchor="end" height={45} />
                <YAxis stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} domain={[40, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5}
                  fillOpacity={1} fill="url(#healthTrendGrad)" name="Health Index"
                  dot={{ fill: '#10b981', r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Sector Distribution */}
          <ChartCard
            title="Health Distribution by Sector"
            subtitle="Per-site health index scored across monitoring stations"
            loading={loading}
            error={error}
            isEmpty={!loading && !error && distribution.length === 0}
            emptyTitle="No sector data available"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 15, right: 15, left: -15, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="sector" stroke={axisColor} fontSize={9} tickLine={false} angle={-25} textAnchor="end" height={45} />
                <YAxis stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="score" radius={[4,4,0,0]} name="Health Index">
                  {distribution.map((entry, i) => (
                    <Cell key={i} fill={scoreColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>
      </DashboardSection>

      {/* ── Protected Area Comparison ── */}
      <DashboardSection
        title="Protected Area Comparison"
        subtitle="Average health score: Protected reserves vs standard monitoring areas"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard
            title="Reserve Type Health Comparison"
            subtitle="Ecological health index ratio across management zones"
            loading={loading}
            error={error}
            isEmpty={!loading && !error && comparison.length === 0}
            emptyTitle="No area comparison data"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison} layout="vertical" margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" stroke={axisColor} fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis type="category" dataKey="category" stroke={axisColor} fontSize={10} tickLine={false} width={120} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="averageScore" radius={[0,4,4,0]} name="Avg Health Score">
                  {comparison.map((entry, i) => (
                    <Cell key={i} fill={i === 0 ? '#10b981' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Summary cards */}
          <div className="space-y-4">
            {!loading && !error && comparison.map((item, i) => (
              <div
                key={i}
                className="glass-card p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {item.category}
                  </p>
                  <p className={`text-3xl font-black mt-1 ${scoreColorClass(item.averageScore)}`}>
                    {item.averageScore}
                    <span className="text-sm text-slate-400 font-bold ml-1">/100</span>
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {item.averageScore >= 75 ? 'Healthy ecosystem' : 'Needs intervention'}
                  </p>
                </div>
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${scoreColor(item.averageScore)}20` }}
                >
                  {i === 0
                    ? <ShieldCheck className="h-6 w-6" style={{ color: scoreColor(item.averageScore) }} />
                    : <BarChart3  className="h-6 w-6" style={{ color: scoreColor(item.averageScore) }} />
                  }
                </div>
              </div>
            ))}
            {loading && (
              <div className="space-y-4">
                {[0,1].map(i => (
                  <div key={i} className="glass-card p-5 h-24 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardSection>

      {/* ── Health Alerts Table ── */}
      <DashboardSection
        title="Health Alerts & Anomalies"
        subtitle="Real-time warning signs derived from multi-modal sensor telemetry networks"
      >
        <div className="glass-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto max-h-[420px]">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs font-semibold">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase tracking-widest text-4xs sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4">Trigger Date</th>
                  <th className="px-5 py-4">Target Area</th>
                  <th className="px-5 py-4">Failing Indicator</th>
                  <th className="px-5 py-4">Anomaly Message</th>
                  <th className="px-5 py-4">Threat Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-transparent text-slate-700 dark:text-slate-350">
                {loading ? (
                  [0,1,2].map(i => (
                    <tr key={i}>
                      {[0,1,2,3,4].map(j => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-rose-500">
                      <div className="flex justify-center items-center gap-2">
                        <AlertCircle className="h-5 w-5" /> {error}
                      </div>
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-500">
                      All health indicators are within normal thresholds. No active alerts.
                    </td>
                  </tr>
                ) : (
                  alerts.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors odd:bg-slate-50/10 dark:odd:bg-slate-950/5"
                    >
                      <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-850 dark:text-slate-200">
                        {new Date(item.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">{item.area}</td>
                      <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        {item.indicator}
                      </td>
                      <td className="px-5 py-4 text-slate-655 dark:text-slate-400 font-medium max-w-sm leading-relaxed">
                        {item.message}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-5xs font-black uppercase border ${severityClass(item.severity)}`}>
                          {item.severity}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardSection>

    </div>
  );
};

export default WildlifeHealthScoring;
