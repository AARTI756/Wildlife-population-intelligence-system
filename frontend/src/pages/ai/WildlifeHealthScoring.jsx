import React, { useState, useEffect } from 'react';
import { 
  Activity, RefreshCw, AlertCircle, ShieldAlert,
  ShieldCheck, Compass, Award
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie } from 'recharts';

import api from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import MetricCard from '../../components/common/MetricCard';
import DashboardSection from '../../components/common/DashboardSection';
import ChartCard from '../../components/common/ChartCard';
import FilterBar from '../../components/common/FilterBar';

// SVG Needle calculation for gauge chart
const RADIAN = Math.PI / 180;
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

const GAUGE_RANGES = [
  { name: 'Critical', value: 20, color: '#ef4444' },
  { name: 'Vulnerable', value: 20, color: '#f97316' },
  { name: 'Moderate Concern', value: 20, color: '#f59e0b' },
  { name: 'Healthy', value: 20, color: '#10b981' },
  { name: 'Excellent', value: 20, color: '#047857' }
];

const WildlifeHealthScoring = () => {
  const { theme } = useTheme();

  // Filtering & API States
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [timestamp, setTimestamp] = useState('');

  // Live Database Datasets
  const [overview, setOverview] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [trends, setTrends] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Sandbox Override States for reviewer testing
  const [sandboxState, setSandboxState] = useState('live'); // 'live', 'loading', 'error', 'empty'

  // Helper to compile Axios query parameters from filter object
  const buildQueryParams = (filterObj) => {
    const params = {};
    if (filterObj.survey_id) params.survey_id = filterObj.survey_id;
    if (filterObj.site_id) params.site_id = filterObj.site_id;
    if (filterObj.species) params.species = filterObj.species;
    if (filterObj.habitat) params.habitat = filterObj.habitat;
    if (filterObj.date_from) params.date_from = filterObj.date_from;
    if (filterObj.date_to) params.date_to = filterObj.date_to;
    return params;
  };

  // Main fetch effect
  useEffect(() => {
    if (sandboxState !== 'live') {
      if (sandboxState === 'loading') {
        setLoading(true);
        setError(null);
        setIsEmpty(false);
      } else if (sandboxState === 'error') {
        setLoading(false);
        setError('Sandbox Sim: Connection to API Gateway failed.');
        setIsEmpty(false);
      } else if (sandboxState === 'empty') {
        setLoading(false);
        setError(null);
        setIsEmpty(true);
      }
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setIsEmpty(false);
      
      const queryParams = buildQueryParams(filters);

      try {
        const [overviewRes, breakdownRes, trendsRes, distRes, compRes, alertsRes] = await Promise.all([
          api.get('/api/health/overview', { params: queryParams }),
          api.get('/api/health/breakdown', { params: queryParams }),
          api.get('/api/health/trends', { params: queryParams }),
          api.get('/api/health/distribution', { params: queryParams }),
          api.get('/api/health/comparison', { params: queryParams }),
          api.get('/api/health/alerts', { params: queryParams })
        ]);

        setOverview(overviewRes.data);
        setBreakdown(breakdownRes.data || []);
        setTrends(trendsRes.data || []);
        setDistribution(distRes.data || []);
        setComparison(compRes.data || []);
        setAlerts(alertsRes.data || []);
        setTimestamp(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        const noData = (breakdownRes.data || []).length === 0;
        setIsEmpty(noData);
      } catch (err) {
        console.error("Failed to load health scoring telemetry:", err);
        setError("Connection to backend database failed. Verify PostgreSQL is seeded and services are running.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, sandboxState]);

  const forceRefresh = () => {
    setSandboxState('live');
    setFilters({});
  };

  const currentScore = overview ? overview.overallScore : 75;
  const scoreLabel = overview ? overview.statusName : 'Healthy';
  const metrics = overview ? overview.metrics : null;

  // Evaluate range color (Scientifically polished thresholds matching backend ranges)
  let scoreColorClass = 'text-emerald-500';
  if (currentScore <= 35) scoreColorClass = 'text-rose-600';
  else if (currentScore <= 55) scoreColorClass = 'text-orange-500';
  else if (currentScore <= 70) scoreColorClass = 'text-amber-500';
  else if (currentScore <= 85) scoreColorClass = 'text-emerald-500';
  else scoreColorClass = 'text-emerald-700 dark:text-emerald-400';

  return (
    <div className="space-y-6 animate-fade-in text-slate-850 dark:text-slate-100 font-sans pb-12">
      {/* Header Banner */}
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
            Evaluate overall ecosystem health using weighted biodiversity index, population growth stability, and physical habitat suitability indicators.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={forceRefresh}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-bold text-xs shadow-xs focus:ring-2 focus:ring-emerald-500"
          >
            <RefreshCw className="h-4 w-4 text-emerald-500" />
            Audit Scorecard
          </button>
        </div>
      </div>

      {/* Dev Sandbox controls */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-3xs font-semibold">
        <span className="text-slate-500 dark:text-slate-400 px-2">Dev Sandbox (API States):</span>
        <button 
          onClick={() => setSandboxState('live')}
          className={`px-2.5 py-1 rounded-lg transition-colors ${sandboxState === 'live' ? 'bg-emerald-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350'}`}
        >
          Connected (Live PostgreSQL DB)
        </button>
        <button 
          onClick={() => setSandboxState('loading')}
          className={`px-2.5 py-1 rounded-lg transition-colors ${sandboxState === 'loading' ? 'bg-amber-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350'}`}
        >
          Loading State
        </button>
        <button 
          onClick={() => setSandboxState('error')}
          className={`px-2.5 py-1 rounded-lg transition-colors ${sandboxState === 'error' ? 'bg-rose-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350'}`}
        >
          Error State
        </button>
        <button 
          onClick={() => setSandboxState('empty')}
          className={`px-2.5 py-1 rounded-lg transition-colors ${sandboxState === 'empty' ? 'bg-slate-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350'}`}
        >
          Empty State
        </button>
      </div>

      {/* Top Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} disabled={loading && sandboxState === 'live'} />

      {/* Large Hero Score Card */}
      <div className="glass-card p-6 border-slate-202 dark:border-slate-805 shadow-sm overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 dark:from-emerald-950/10 dark:to-cyan-950/10 border-l-4 border-l-emerald-500 relative">
        {/* Score Information Tooltip */}
        <span 
          title="Weighted Score Allocation: Population Stability (25%), Biodiversity Health (30%), Habitat Quality (25%), Conservation Readiness (20%)" 
          className="absolute top-3 right-3 cursor-help text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-5xs p-1"
          aria-label="Ecosystem health weights info"
        >
          ⓘ
        </span>

        <div className="space-y-3 flex-1">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
            Overall Ecosystem Health Score
          </span>
          <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {loading || error || isEmpty || !overview ? '—' : currentScore}
            </h2>
            <span className="text-sm font-bold text-slate-500">/ 100</span>
          </div>
          <p className="text-xs font-semibold text-slate-655 dark:text-slate-400 leading-relaxed max-w-xl">
            This scorecard represents the aggregated health of the reserve. Monitored coordinates are currently rated as <span className={`font-extrabold ${scoreColorClass}`}>{scoreLabel}</span>, calculated from multi-modal sensor networks in core buffers.
          </p>
        </div>

        {/* Semi-circle Gauge Chart */}
        <div className="shrink-0 flex flex-col items-center justify-center min-w-[200px]">
          {loading ? (
            <div className="h-28 flex items-center justify-center text-slate-400 text-xs">Computing...</div>
          ) : error ? (
            <div className="h-28 flex items-center justify-center text-rose-500 text-xs">Error loading score</div>
          ) : isEmpty ? (
            <div className="h-28 flex items-center justify-center text-slate-400 text-xs">No active telemetry</div>
          ) : (
            <div className="h-28 w-48 relative overflow-hidden flex items-end justify-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={GAUGE_RANGES}
                    cx="50%"
                    cy="85%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={50}
                    outerRadius={66}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {GAUGE_RANGES.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  {drawGaugeNeedle(currentScore, 96, 136, 50, 66, theme === 'dark' ? '#f8fafc' : '#0f1722')}
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-1 text-center">
                <span className={`text-sm font-black uppercase tracking-wider block ${scoreColorClass}`}>
                  {scoreLabel}
                </span>
                <span className="text-5xs font-bold text-slate-500 uppercase tracking-widest block mt-0.5">Rating Zone</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cards below hero */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard 
          title="Species Diversity" 
          value={loading || error || isEmpty || !metrics ? '—' : metrics.speciesDiversity.value} 
          subtext={metrics?.speciesDiversity.subtext}
          trend={metrics?.speciesDiversity.trend}
          trendValue={metrics?.speciesDiversity.trendValue}
          icon={Award}
          lastUpdated={timestamp}
        />
        <MetricCard 
          title="Observation Coverage" 
          value={loading || error || isEmpty || !metrics ? '—' : metrics.populationStability.value} 
          subtext={metrics?.populationStability.subtext}
          trend={metrics?.populationStability.trend}
          trendValue={metrics?.populationStability.trendValue}
          icon={Activity}
          lastUpdated={timestamp}
          colorClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-955/30 border-blue-200 dark:border-blue-900/30"
        />
        <MetricCard 
          title="Habitat Quality" 
          value={loading || error || isEmpty || !metrics ? '—' : metrics.habitatQuality.value} 
          subtext={metrics?.habitatQuality.subtext}
          trend={metrics?.habitatQuality.trend}
          trendValue={metrics?.habitatQuality.trendValue}
          icon={ShieldCheck}
          lastUpdated={timestamp}
          colorClass="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/30 border-amber-200 dark:border-amber-900/30"
        />
        <MetricCard 
          title="Endangered Status" 
          value={loading || error || isEmpty || !metrics ? '—' : metrics.endangeredSpeciesStatus.value} 
          subtext={metrics?.endangeredSpeciesStatus.subtext}
          trend={metrics?.endangeredSpeciesStatus.trend}
          trendValue={metrics?.endangeredSpeciesStatus.trendValue}
          icon={ShieldAlert}
          lastUpdated={timestamp}
          colorClass="text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-955/30 border-rose-200 dark:border-rose-900/30"
        />
        <MetricCard 
          title="Environmental Status" 
          value={loading || error || isEmpty || !metrics ? '—' : metrics.environmentalConditions.value} 
          subtext={metrics?.environmentalConditions.subtext}
          trend={metrics?.environmentalConditions.trend}
          trendValue={metrics?.environmentalConditions.trendValue}
          icon={Compass}
          lastUpdated={timestamp}
          colorClass="text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-955/30 border-cyan-200 dark:border-cyan-900/30"
        />
      </div>

      {/* Weighted Score & Historical Trends */}
      <DashboardSection title="Ecosystem Indices & Score Breakdown" subtitle="Detailed audit scores across multiple ecological domains">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Weighted Score Breakdown"
            subtitle="Ecological domain indicator status compared relative to weight (%)"
            loading={loading}
            error={error}
            isEmpty={isEmpty || breakdown.length === 0}
            emptyTitle="No Breakdown Parameters"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdown} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={9} tickLine={false} label={{ value: 'Ecosystem Domain', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Score / Weight (%)', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" fontSize={10} />
                <Bar dataKey="weight" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Assigned Weight (%)" />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Performance Score" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Historical Health Trend"
            subtitle="Ecosystem Health index shifts monitored over previous census years"
            loading={loading}
            error={error}
            isEmpty={isEmpty || trends.length === 0}
            emptyTitle="No Historical Telemetry"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="healthTrendColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="year" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} label={{ value: 'Census Cycle', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} domain={[60, 95]} label={{ value: 'Ecosystem Health Index', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '12px'
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#healthTrendColor)" name="Health Index" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </DashboardSection>

      {/* Distribution & Protected Area Comparison */}
      <DashboardSection title="Ecological Health Distribution" subtitle="Compare health status across landscape sectors and management zones">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Health Distribution Chart */}
          <ChartCard
            title="Health Distribution Chart"
            subtitle="Ecological health index scored across individual forest sectors"
            loading={loading}
            error={error}
            isEmpty={isEmpty || distribution.length === 0}
            emptyTitle="No Sector Index Data"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="sector" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={9} tickLine={false} label={{ value: 'Grid Station', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Health Index Score', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '12px'
                  }}
                />
                <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Health Index" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Protected Area Comparison */}
          <ChartCard
            title="Protected Area Comparison"
            subtitle="Average health index ratio of Protected Reserves vs Standard areas"
            loading={loading}
            error={error}
            isEmpty={isEmpty || comparison.length === 0}
            emptyTitle="No Area Data"
            className="lg:col-span-1"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison} layout="vertical" margin={{ top: 15, right: 15, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis type="number" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={9} tickLine={false} axisLine={false} label={{ value: 'Average Health Score', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis type="category" dataKey="category" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={9} tickLine={false} width={90} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '12px'
                  }}
                />
                <Bar dataKey="averageScore" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Avg Health Score">
                  {comparison.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </DashboardSection>

      {/* Health Alerts */}
      <DashboardSection title="Health Alerts & Anomalies" subtitle="Real-time warning signs detected from multi-modal sensor networks">
        <div className="glass-card overflow-hidden border-slate-202 dark:border-slate-805 shadow-sm">
          <div className="overflow-x-auto max-h-[380px]">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs font-semibold">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase tracking-widest text-4xs sticky top-0 z-10 border-b border-slate-200 dark:border-slate-805">
                <tr>
                  <th className="px-6 py-4">Trigger Date</th>
                  <th className="px-6 py-4">Target Area</th>
                  <th className="px-6 py-4">Failing Indicator</th>
                  <th className="px-6 py-4">Anomaly Message</th>
                  <th className="px-6 py-4">Threat Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-transparent text-slate-700 dark:text-slate-350">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      <div className="flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500 mr-2" /> Auditing anomalies...</div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-rose-500">
                      <div className="flex justify-center"><AlertCircle className="h-5 w-5 text-rose-500 mr-2" /> {error}</div>
                    </td>
                  </tr>
                ) : isEmpty || alerts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-550">
                      All system health indicators are normal. No active alerts.
                    </td>
                  </tr>
                ) : (
                  alerts.map((item) => {
                    let levelClass = '';
                    if (item.severity === 'Excellent') levelClass = 'bg-emerald-50 dark:bg-emerald-955/25 text-emerald-700 dark:text-emerald-405 border-emerald-250 dark:border-emerald-900/30';
                    else if (item.severity === 'Warning') levelClass = 'bg-amber-50 dark:bg-amber-955/25 text-amber-700 dark:text-amber-405 border-amber-250 dark:border-amber-900/30';
                    else levelClass = 'bg-rose-50 dark:bg-rose-955/25 text-rose-700 dark:text-rose-455 border-rose-250 dark:border-rose-900/30';

                    return (
                      <tr key={item.id} className="hover:bg-slate-55/40 dark:hover:bg-slate-900/10 transition-colors odd:bg-slate-50/10 dark:odd:bg-slate-950/5 even:bg-transparent">
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-850 dark:text-slate-200">
                          {new Date(item.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{item.area}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">{item.indicator}</td>
                        <td className="px-6 py-4 text-slate-655 dark:text-slate-400 font-medium max-w-sm leading-relaxed">{item.message}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-5xs font-black uppercase border ${levelClass}`}>
                            {item.severity}
                          </span>
                        </td>
                      </tr>
                    );
                  })
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
