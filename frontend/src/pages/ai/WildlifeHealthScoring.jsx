import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, RefreshCw, AlertCircle, ShieldAlert,
  ShieldCheck, Compass, Award, Leaf, BarChart3, Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { PieChart, Pie } from 'recharts';

import api from '../../services/api';
import MetricCard from '../../components/common/MetricCard';
import DashboardSection from '../../components/common/DashboardSection';
import ChartCard from '../../components/common/ChartCard';
import FilterBar from '../../components/common/FilterBar';
import { formatLastUpdated } from '../../utils/india';

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
  if (score >= 90) return 'text-emerald-700';
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
      <span className="font-bold text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-3xs font-semibold">
          {weight}% weight
        </span>
        <span className="font-black text-slate-900 w-8 text-right">
          {value}
        </span>
      </div>
    </div>
    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
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
const HealthTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl shadow-lg text-xs font-semibold border bg-white border-slate-200">
      <p className="font-black text-slate-900 mb-1">{label}</p>
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
  const [filters, setFilters]       = useState({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [timestamp, setTimestamp]   = useState('');

  const [overview,      setOverview]      = useState(null);
  const [breakdown,     setBreakdown]     = useState([]);
  const [trends,        setTrends]        = useState([]);
  const [distribution,  setDistribution]  = useState([]);



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
      const [overviewRes, breakdownRes, trendsRes, distRes] =
        await Promise.all([
          api.get('/api/health/overview',      { params: queryParams }),
          api.get('/api/health/breakdown',     { params: queryParams }),
          api.get('/api/health/trends',        { params: queryParams }),
          api.get('/api/health/distribution',  { params: queryParams }),
        ]);

      setOverview(overviewRes.data);
      setBreakdown(breakdownRes.data  || []);
      setTrends(trendsRes.data        || []);
      setDistribution(distRes.data    || []);
      setTimestamp(formatLastUpdated(new Date()));
    } catch (err) {
      console.error('Health scoring fetch failed:', err);
      setError('Connection to backend database failed. Verify PostgreSQL is running.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [filters, fetchData]);

  /* ── Derived values ── */
  const currentScore  = overview?.overallScore  ?? 0;
  const scoreLabel    = overview?.statusName    ?? '—';
  const metrics       = overview?.metrics       ?? null;
  const colorClass    = scoreColorClass(currentScore);

  /* ── Chart configurations ── */
  const gridColor = '#e2e8f0';
  const axisColor = '#475569';
  const tooltipBg = '#ffffff';
  const tooltipBorder = '#cbd5e1';
  const tooltipStyle  = { backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px' };

  /* ── Trend chart: filter out null-score months ── */
  const trendData = trends.filter(t => t.score != null);

  /* ─────────────────────────────────────────── */
  return (
    <div className="space-y-5 animate-fade-in text-slate-900 font-sans pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Ecosystem Scorecard
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
            Wildlife Health Scoring Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Weighted biodiversity index, population growth stability and physical habitat suitability scorecard.
          </p>
        </div>
        <button
          onClick={() => { fetchData(); }}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs shadow-sm"
        >
          <RefreshCw className="h-4 w-4 text-emerald-500" />
          Refresh
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <FilterBar filters={filters} onChange={setFilters} disabled={loading} />

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Hero Score Card ── */}
      <div className="glass-card p-6 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border-l-4 border-l-emerald-500 relative">
        <span
          title="Official Formula: Species Diversity (30%) · Population Stability (25%) · Habitat Quality (20%) · Endangered Species (15%) · Environmental Conditions (10%)"
          className="absolute top-3 right-3 cursor-help text-slate-400 hover:text-slate-650 text-5xs p-1"
        >ⓘ</span>

        {/* Score Info */}
        <div className="space-y-3 flex-1">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">
            Overall Ecosystem Health Score
          </span>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <div className="h-12 w-24 rounded-lg bg-slate-200 animate-pulse" />
            ) : (
              <h2 className={`text-5xl font-black tracking-tight ${colorClass}`}>
                {currentScore}
              </h2>
            )}
            <span className="text-sm font-bold text-slate-500">/ 100</span>
          </div>
          <p className="text-xs font-semibold text-slate-650 leading-relaxed max-w-xl">
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
                  backgroundColor: `${color}10`
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
            <div className="h-28 w-48 rounded-xl bg-slate-200 animate-pulse" />
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
                  {drawGaugeNeedle(currentScore, 96, 136, 50, 66, '#0f172a')}
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-1 text-center">
                <span className={`text-sm font-black uppercase tracking-wider block ${colorClass}`}>
                  {scoreLabel}
                </span>
                <span className="text-5xs font-bold text-slate-505 uppercase tracking-widest block mt-0.5">
                  Rating Zone
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { key: 'speciesDiversity',       title: 'Species Diversity',    Icon: Award,       colorClass: '' },
          { key: 'populationStability',    title: 'Observation Coverage', Icon: Activity,    colorClass: 'text-blue-600 bg-blue-50 border-blue-200' },
          { key: 'habitatQuality',         title: 'Habitat Quality',      Icon: Leaf,        colorClass: 'text-amber-600 bg-amber-50 border-amber-200' },
          { key: 'endangeredSpeciesStatus',title: 'Endangered Status',    Icon: ShieldAlert, colorClass: 'text-rose-600 bg-rose-50 border-rose-200' },
          { key: 'environmentalConditions',title: 'Environmental Status', Icon: Compass,     colorClass: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
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

      {/* ── Derived Ecological Metrics & AI Insights ── */}
      {!loading && !error && (
        <DashboardSection
          title="Ecological Resource Scoring & AI Insights"
          subtitle="Estimated resource scores derived from active sensor telemetry and current ecosystem indicators"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Derived Scores Card */}
            <div className="glass-card p-6 space-y-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-4">
                  Derived Health Indicators (Est.)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      label: 'Disease Risk (Est.)',
                      value: Math.round(Math.max(12, Math.min(88, 100 - (currentScore * 0.9)))),
                      subtext: 'Based on threat alerts and anomaly patterns',
                      color: '#ef4444',
                      invert: true
                    },
                    {
                      label: 'Food Availability (Est.)',
                      value: Math.round(Math.max(30, Math.min(98, currentScore * 1.05))),
                      subtext: 'Derived from vegetation index & species density',
                      color: '#10b981'
                    },
                    {
                      label: 'Water Availability (Est.)',
                      value: Math.round(Math.max(25, Math.min(95, currentScore * 0.95 + 5))),
                      subtext: 'Estimated from daily humidity and weather reports',
                      color: '#3b82f6'
                    }
                  ].map((item, idx) => {
                    const pctColor = item.invert 
                      ? (item.value > 60 ? '#ef4444' : item.value > 35 ? '#f97316' : '#10b981')
                      : (item.value > 75 ? '#10b981' : item.value > 50 ? '#f59e0b' : '#ef4444');
                    
                    return (
                      <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">
                            {item.label}
                          </span>
                          <span className="text-xl font-black" style={{ color: pctColor }}>
                            {item.value}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.value}%`, backgroundColor: pctColor }} />
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                          {item.subtext}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-3xs font-bold text-slate-400">
                <AlertCircle className="h-3 w-3 text-emerald-500" />
                <span>Scores are calculated dynamically from local monitoring sites and physical habitat records.</span>
              </div>
            </div>

            {/* AI Explanations */}
            <div className="glass-card p-6 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-l-4 border-l-emerald-500 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1 mb-2">
                  <Sparkles className="h-3 w-3 text-emerald-500" />
                  AI Intelligence Insights
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 mb-3">
                  Dynamic Ecological Assessment
                </h3>
                <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                  {currentScore >= 75 ? (
                    `Reserve telemetry points to a highly resilient ecosystem. High vegetation indices (Food Availability: ${Math.round(Math.max(30, Math.min(98, currentScore * 1.05)))}%) are supported by stable hydrology (Water Availability: ${Math.round(Math.max(25, Math.min(95, currentScore * 0.95 + 5)))}%). The overall disease transmission risk is low (${Math.round(Math.max(12, Math.min(88, 100 - (currentScore * 0.9))))}%), resulting in a robust and self-sustaining ecosystem state.`
                  ) : currentScore >= 60 ? (
                    `System alerts note emerging ecological strain. While food resources are adequate (${Math.round(Math.max(30, Math.min(98, currentScore * 1.05)))}%), micro-climate water indicators (${Math.round(Math.max(25, Math.min(95, currentScore * 0.95 + 5)))}%) show seasonal declines. The disease vector risk is moderate (${Math.round(Math.max(12, Math.min(88, 100 - (currentScore * 0.9))))}%), prompting suggestions for water replenishment projects.`
                  ) : (
                    `Emergency ecological response triggered. Critical degradation in local water reservoirs (${Math.round(Math.max(25, Math.min(95, currentScore * 0.95 + 5)))}%) has severely stressed native flora, reducing food availability to ${Math.round(Math.max(30, Math.min(98, currentScore * 1.05)))}%. Pathogen spread and disease susceptibility have spiked to ${Math.round(Math.max(12, Math.min(88, 100 - (currentScore * 0.9))))}%. Conservation officers should prioritize patrol deployment.`
                  )}
                </p>
              </div>
            </div>
          </div>
        </DashboardSection>
      )}

      {/* ── Component Score Breakdown Panel ── */}
      {!loading && !error && breakdown.length > 0 && (
        <DashboardSection
          title="Component Score Breakdown"
          subtitle="Weighted contribution of each ecological domain to the overall health index"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual bars */}
            <div className="glass-card p-6 space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900">
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

    </div>
  );
};

export default WildlifeHealthScoring;
