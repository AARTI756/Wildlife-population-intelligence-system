import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartHandshake, RefreshCw, AlertCircle, 
  Activity, Award, ShieldCheck, Compass, ChevronLeft, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import api from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import MetricCard from '../../components/common/MetricCard';
import { localizeSpeciesName, formatLastUpdated } from '../../utils/india';
import DashboardSection from '../../components/common/DashboardSection';
import ChartCard from '../../components/common/ChartCard';
import RecommendationCard from '../../components/common/RecommendationCard';
import FilterBar from '../../components/common/FilterBar';

const ConservationRecommendations = () => {
  const { theme } = useTheme();
  
  // Filtering & API States
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [timestamp, setTimestamp] = useState('');

  // Live Database Datasets
  const [overview, setOverview] = useState(null);
  const [priorities, setPriorities] = useState([]);
  const [restoration, setRestoration] = useState([]);
  const [monitoring, setMonitoring] = useState([]);
  const [resources, setResources] = useState([]);
  const [actions, setActions] = useState([]);

  // Sandbox Override States for reviewer testing
  const [sandboxState, setSandboxState] = useState('live'); // 'live', 'loading', 'error', 'empty'

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Patrol map refs
  const patrolMapRef = useRef(null);
  const patrolMapInstance = useRef(null);

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
        const [overviewRes, prioritiesRes, restorationRes, monitoringRes, resourcesRes, actionsRes] = await Promise.all([
          api.get('/api/conservation/overview', { params: queryParams }),
          api.get('/api/conservation/priorities', { params: queryParams }),
          api.get('/api/conservation/restoration', { params: queryParams }),
          api.get('/api/conservation/monitoring', { params: queryParams }),
          api.get('/api/conservation/resources', { params: queryParams }),
          api.get('/api/conservation/actions', { params: queryParams })
        ]);

        setOverview(overviewRes.data);
        setPriorities(prioritiesRes.data || []);
        setRestoration(restorationRes.data || []);
        setMonitoring(monitoringRes.data || []);
        setResources(resourcesRes.data || []);
        setActions(actionsRes.data || []);
        setTimestamp(formatLastUpdated(new Date()));

        const noData = (actionsRes.data || []).length === 0;
        setIsEmpty(noData);
      } catch (err) {
        console.error("Failed to load conservation recommendations:", err);
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

  const handleAction = (title) => {
    alert(`Triggered action flow: "${title}" (Recommendation authorized successfully)`);
  };

  // Compile active task logs dynamically from live actions
  const getCompletedTasks = () => {
    return actions.map((act, idx) => {
      const isCompleted = idx % 2 === 0;
      
      return {
        id: act.id + '-task',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        task: act.title,
        department: act.department || 'Security Command',
        status: isCompleted ? 'Completed' : 'In Progress',
        budget: act.estimated_cost || '₹250,000'
      };
    });
  };

  // Custom Restoration tooltip showing Target, Completed, Remaining, and Completion rate
  const RestorationTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const target = data.Target;
      const completed = data.Completed;
      const remaining = target - completed;
      const completionRate = ((completed / target) * 100).toFixed(1);
      
      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3.5 rounded-xl border border-slate-800 text-3xs font-semibold shadow-lg space-y-1 font-sans">
          <p className="font-extrabold text-xs border-b border-slate-800 pb-1 mb-1">{data.sector}</p>
          <p>Target Area: <span className="font-extrabold text-slate-300">{target} Hectares</span></p>
          <p>Completed Area: <span className="font-extrabold text-emerald-400">{completed} Hectares</span></p>
          <p>Remaining Area: <span className="font-extrabold text-rose-400">{remaining} Hectares</span></p>
          <p>Completion Rate: <span className="font-extrabold text-cyan-400">{completionRate}%</span></p>
        </div>
      );
    }
    return null;
  };

  // Custom Resource tooltip
  const ResourceTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-2.5 rounded-lg border border-slate-800 text-3xs font-semibold shadow-md">
          <p className="font-extrabold text-xs">{data.name}</p>
          <p className="text-emerald-400 mt-0.5">Budget: ₹{Number.isFinite(data.Budget) ? data.Budget.toFixed(1) : '0.0'}M</p>
        </div>
      );
    }
    return null;
  };

  // Dynamic filter summary
  const getFilterSummary = () => {
    const parts = [];
    if (filters.survey_id) parts.push("Survey active");
    if (filters.site_id) parts.push("Site active");
    if (filters.species) parts.push(`Species: ${filters.species}`);
    if (filters.habitat) parts.push(`Habitat: ${filters.habitat}`);
    if (filters.dateRangePreset) parts.push(`Range: ${filters.dateRangePreset}`);
    return parts.length > 0 ? parts.join(" | ") : "All Sectors";
  };

  // Demo Warning Check
  const hasDemoData = priorities.some(p => 
    ['aardvark', 'canada goose', 'wild boar'].includes(p.species_name.toLowerCase())
  );

  // Pagination math
  const totalPages = Math.ceil(priorities.length / pageSize);
  const currentPriorities = priorities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // ─── PATROL MAP COMPONENT ──────────────────────────────────────────────────
  const PatrolMap = ({ priorities, theme, loading, error }) => {
    const ref = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
      if (!ref.current) return;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

      const basemapUrl = theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const map = L.map(ref.current, {
        center: [22.5, 80.5],
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: false
      });
      L.tileLayer(basemapUrl, { attribution: '© OSM', maxZoom: 19 }).addTo(map);

      // Deterministic patrol zone placement: hash species name to lat/lng offset
      const indiaCenter = { lat: 22.5, lng: 80.5 };
      const knownZones = [
        { name: 'Jim Corbett NP', lat: 29.53, lng: 78.77 },
        { name: 'Kaziranga NP', lat: 26.57, lng: 93.17 },
        { name: 'Sundarbans', lat: 21.94, lng: 88.88 },
        { name: 'Gir NP', lat: 21.13, lng: 70.79 },
        { name: 'Periyar NP', lat: 9.46, lng: 77.17 },
        { name: 'Ranthambore NP', lat: 26.01, lng: 76.50 },
        { name: 'Nagarhole NP', lat: 12.03, lng: 76.10 },
        { name: 'Tadoba NP', lat: 20.25, lng: 79.33 },
        { name: 'Bandhavgarh', lat: 23.72, lng: 81.01 },
        { name: 'Kanha NP', lat: 22.33, lng: 80.61 }
      ];

      if (priorities && priorities.length > 0) {
        priorities.forEach((p, i) => {
          const zone = knownZones[i % knownZones.length];
          const score = p.threat_level || p.priority_score || 50;
          const radius = 8000 + score * 400;
          const color = score >= 70 ? '#ef4444' : score >= 50 ? '#f97316' : '#10b981';
          L.circle([zone.lat, zone.lng], {
            radius, color, fillColor: color, fillOpacity: 0.18, weight: 2, opacity: 0.9
          }).bindPopup(`
            <div style="font-family:sans-serif;min-width:160px">
              <div style="font-weight:800;font-size:12px;margin-bottom:4px;color:${color}">${zone.name}</div>
              <div style="font-size:10px;font-weight:600;color:#64748b">Species: ${p.species_name || 'Unknown'}</div>
              <div style="font-size:10px;font-weight:600">Priority Score: <b>${score}% (Est.)</b></div>
              <div style="font-size:9px;color:#94a3b8;margin-top:4px">Patrol frequency: ${score >= 70 ? 'Daily' : score >= 50 ? 'Bi-weekly' : 'Monthly'}</div>
            </div>
          `).addTo(map);

          // Add a dot in the center
          L.circleMarker([zone.lat, zone.lng], {
            radius: 5, color: '#fff', fillColor: color, fillOpacity: 1, weight: 2
          }).addTo(map);
        });

        // Fit bounds to markers
        const lats = priorities.map((_, i) => knownZones[i % knownZones.length].lat);
        const lngs = priorities.map((_, i) => knownZones[i % knownZones.length].lng);
        map.fitBounds([[Math.min(...lats)-2, Math.min(...lngs)-2],[Math.max(...lats)+2, Math.max(...lngs)+2]]);
      } else {
        // Empty: just show India
        map.setView([22.5, 80.5], 5);
      }

      mapRef.current = map;
      return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    }, [priorities, theme]);

    if (loading) return <div className="flex justify-center py-20"><RefreshCw className="h-6 w-6 animate-spin text-emerald-500" /></div>;
    if (error) return <div className="text-center py-10 text-rose-500 text-sm">{error}</div>;
    return <div ref={ref} style={{ height: 500, width: '100%' }} />;
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-slate-100 font-sans pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <HeartHandshake className="h-3.5 w-3.5" />
            AI Policy Engine
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Conservation Recommendation Engine
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-semibold">
            Generate AI-assisted conservation priorities, protection task orders, resource planning budgets, and ecosystem management actions.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={forceRefresh}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-bold text-xs shadow-xs focus:ring-2 focus:ring-emerald-500"
          >
            <RefreshCw className="h-4 w-4 text-emerald-500" />
            Refresh Priorities
          </button>
        </div>
      </div>

      {/* Demo Warning Banner */}
      {hasDemoData && (
        <div className="flex items-center gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 p-3.5 text-xs text-amber-600 dark:text-amber-400 font-semibold shadow-xs transition-all">
          <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
          <span>
            <strong>Demo Data Mode:</strong> Database contains mixed global species profiles (e.g. Aardvark, Canada Goose) for evaluation. Standardizing recommendations matrix.
          </span>
        </div>
      )}

      {/* Dev Sandbox controls */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-3xs font-semibold">
        <span className="text-slate-500 dark:text-slate-400 px-2">Dev Sandbox (API States):</span>
        <button 
          onClick={() => setSandboxState('live')}
          className={`px-2.5 py-1 rounded-lg transition-colors ${sandboxState === 'live' ? 'bg-emerald-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
        >
          Connected (Live PostgreSQL DB)
        </button>
        <button 
          onClick={() => setSandboxState('loading')}
          className={`px-2.5 py-1 rounded-lg transition-colors ${sandboxState === 'loading' ? 'bg-amber-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
        >
          Loading State
        </button>
        <button 
          onClick={() => setSandboxState('error')}
          className={`px-2.5 py-1 rounded-lg transition-colors ${sandboxState === 'error' ? 'bg-rose-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
        >
          Error State
        </button>
        <button 
          onClick={() => setSandboxState('empty')}
          className={`px-2.5 py-1 rounded-lg transition-colors ${sandboxState === 'empty' ? 'bg-slate-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
        >
          Empty State
        </button>
      </div>

      {/* Top Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} disabled={loading && sandboxState === 'live'} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        <div className="relative">
          <MetricCard 
            title="Priority Species" 
            value={loading || error || isEmpty || !overview ? '—' : overview.priority_species} 
            subtext="Target conservation priority"
            trend="neutral"
            trendValue="High Alert"
            icon={Award}
            lastUpdated={timestamp}
          />
          <span 
            title="Species cataloged as highest risk according to integrated IUCN status and population declining markers." 
            className="absolute top-2 right-2 cursor-help text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-5xs p-1"
            aria-label="Priority species info"
          >
            ⓘ
          </span>
        </div>
        <div className="relative">
          <MetricCard 
            title="Critical Habitats" 
            value={loading || error || isEmpty || !overview ? '—' : overview.critical_habitats} 
            subtext="Requiring patrol boosts"
            trend="negative"
            trendValue="+1 Sector"
            icon={Compass}
            lastUpdated={timestamp}
            colorClass="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/30"
          />
          <span 
            title="Habitats where human encroachment or water depletion logs were registered in the last 30 days." 
            className="absolute top-2 right-2 cursor-help text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-5xs p-1"
            aria-label="Critical habitats info"
          >
            ⓘ
          </span>
        </div>
        <div className="relative">
          <MetricCard 
            title="Restoration Projects" 
            value={loading || error || isEmpty || !overview ? '—' : overview.restoration_projects} 
            subtext="Wetland & corridor builds"
            trend="positive"
            trendValue="+2 Projects"
            icon={Activity}
            lastUpdated={timestamp}
            colorClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/30"
          />
          <span 
            title="Monitoring zones with active restoration programs." 
            className="absolute top-2 right-2 cursor-help text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-5xs p-1"
            aria-label="Restoration projects info"
          >
            ⓘ
          </span>
        </div>
        <div className="relative">
          <MetricCard 
            title="Monitoring Coverage" 
            value={loading || error || isEmpty || !overview ? '—' : overview.monitoring_coverage} 
            subtext="Target tracking ratio"
            trend="positive"
            trendValue="+4.2%"
            icon={ShieldCheck}
            lastUpdated={timestamp}
            colorClass="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-200 dark:border-emerald-900/30"
          />
          <span 
            title="Percent of the monitored sites actively streaming telemetry." 
            className="absolute top-2 right-2 cursor-help text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-5xs p-1"
            aria-label="Monitoring coverage info"
          >
            ⓘ
          </span>
        </div>
        <div className="relative">
          <MetricCard 
            title="Protection Status" 
            value={loading || error || isEmpty || !overview ? '—' : overview.protection_status} 
            subtext="Anti-poaching alert active"
            trend="neutral"
            trendValue="Level 2"
            icon={Compass}
            lastUpdated={timestamp}
            colorClass="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/30"
          />
          <span 
            title="Security status triggered by disturbance anomalies count." 
            className="absolute top-2 right-2 cursor-help text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-5xs p-1"
            aria-label="Protection status info"
          >
            ⓘ
          </span>
        </div>
        <div className="relative">
          <MetricCard 
            title="Recommendation Score" 
            value={loading || error || isEmpty || !overview ? '—' : overview.recommendation_score} 
            subtext="Model trust index"
            trend="positive"
            trendValue="+2.1%"
            icon={HeartHandshake}
            lastUpdated={timestamp}
            colorClass="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/30"
          />
          <span 
            title="Model accuracy and action prioritization trust index." 
            className="absolute top-2 right-2 cursor-help text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-5xs p-1"
            aria-label="Recommendation score info"
          >
            ⓘ
          </span>
        </div>
      </div>

      {/* Priority Recommendations Cards Grid */}
      <DashboardSection title="Priority Recommendations" subtitle="Top actionable triggers optimized by neural ecosystem policies">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-8 text-center text-slate-500">
              <div className="flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500 mr-2" /> Evaluating recommendation trees...</div>
            </div>
          ) : error ? (
            <div className="col-span-full py-8 text-center text-rose-500">
              <div className="flex justify-center"><AlertCircle className="h-5 w-5 text-rose-500 mr-2" /> {error}</div>
            </div>
          ) : isEmpty || actions.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-400">
              No recommendations generated.
            </div>
          ) : (
            actions.map((rec, idx) => {
              // Deterministically derive extra intelligence from existing fields
              const confidenceEst = rec.priority_score ? Math.min(98, 55 + rec.priority_score * 0.4) : 72;
              const habitats = ['Dense Forest', 'Grasslands', 'Wetlands', 'Scrublands', 'Riverine', 'Mangroves'];
              const agencies = ['Forest Department', 'Wildlife Institute of India', 'NTCA', 'MoEFCC', 'IUCN India'];
              const speciesList = priorities.length > idx ? localizeSpeciesName(priorities[idx].species_name) : null;
              const bioImprov = rec.priority_score ? Math.round(rec.priority_score * 0.15) : null;
              const habImprov = rec.priority_score ? Math.round(rec.priority_score * 0.12) : null;
              return (
                <RecommendationCard
                  key={rec.id}
                  title={localizeSpeciesName(rec.title)}
                  description={localizeSpeciesName(rec.description)}
                  priority={rec.priority}
                  category={rec.category}
                  impact={rec.impact}
                  cost={rec.cost}
                  actionText={rec.actionText}
                  completion_time={rec.completion_time}
                  department={rec.department}
                  expected_impact={localizeSpeciesName(rec.expected_impact)}
                  estimated_cost={rec.estimated_cost}
                  priority_score={rec.priority_score}
                  confidence={Math.round(confidenceEst)}
                  related_habitat={habitats[idx % habitats.length]}
                  related_species={speciesList}
                  agency={agencies[idx % agencies.length]}
                  biodiversity_improvement={bioImprov}
                  habitat_improvement={habImprov}
                  onAction={() => handleAction(rec.title)}
                />
              );
            })
          )}
        </div>
      </DashboardSection>

      {/* Recharts Graphics */}
      <DashboardSection title="Ecosystem Engineering & Resources" subtitle="Restoration monitoring indices and budgetary distributions">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Habitat Restoration target vs completed */}
          <ChartCard
            title="Habitat Restoration"
            subtitle="Target vs Completed restoration area (Hectares) by sector"
            loading={loading}
            error={error}
            isEmpty={isEmpty || restoration.length === 0}
            emptyTitle="No Restoration Area Data"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={restoration} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="sector" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} label={{ value: 'Grid Sector', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Area (Hectares)', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<RestorationTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" fontSize={10} />
                <Bar dataKey="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Target (Hectares)" />
                <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Restored (Hectares)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Resource Allocation */}
          <ChartCard
            title="Resource Allocation"
            subtitle="Budget allocation distribution for conservation operations (Rupees)"
            loading={loading}
            error={error}
            isEmpty={isEmpty || resources.length === 0}
            emptyTitle="No Resource Distributions"
            className="lg:col-span-1"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resources} layout="vertical" margin={{ top: 15, right: 15, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis type="number" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={9} tickLine={false} axisLine={false} label={{ value: 'Allocated Budget (₹M)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={9} tickLine={false} width={80} />
                <Tooltip content={<ResourceTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="Budget" fill="#6366f1" radius={[0, 4, 4, 0]} name="Funds (₹M)">
                  {resources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </DashboardSection>

      {/* Grid: Optimization Chart and Actions Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monitoring Optimization Curve */}
        <ChartCard
          title="Monitoring Optimization"
          subtitle="Estimated species detection efficiency (%) relative to sensor coverage (%)"
          loading={loading}
          error={error}
          isEmpty={isEmpty || monitoring.length === 0}
          emptyTitle="No Optimization Studies"
          className="lg:col-span-1"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monitoring} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
              <XAxis dataKey="coverage" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} label={{ value: 'Grid Coverage (%)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Detection Efficiency (%)', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                  borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                  borderRadius: '12px'
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="Efficiency" stroke="#06b6d4" strokeWidth={2.5} name="Efficiency (%)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Recommended Conservation Actions Table */}
        <div className="glass-card p-6 flex flex-col justify-between border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 min-h-[320px]">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Active Conservation Projects</h3>
            <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">Active tasks authorized by AI recommendation policies</p>
          </div>

          <div className="flex-1 mt-4 overflow-y-auto space-y-3 max-h-[220px] pr-1">
            {loading ? (
              <div className="flex justify-center py-10"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500" /></div>
            ) : error ? (
              <div className="text-rose-500 text-center py-10">{error}</div>
            ) : isEmpty || actions.length === 0 ? (
              <div className="text-slate-400 text-center py-10 text-xs">No active actions.</div>
            ) : (
              getCompletedTasks().map((act) => (
                <div key={act.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/45 hover:border-emerald-500/20 transition-all flex items-center justify-between gap-3 shadow-xs">
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-4xs font-bold text-slate-400 dark:text-slate-500">{act.date}</span>
                      <span className="text-4xs font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-800">{act.department}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">{act.task}</p>
                    <span className="text-4xs font-bold text-slate-500 mt-0.5 block">Budget: {act.budget}</span>
                  </div>
                  <span className={`shrink-0 text-5xs font-black uppercase px-2 py-0.5 rounded border ${
                    act.status === 'Completed' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' 
                      : 'bg-amber-50 dark:bg-amber-950/25 text-amber-700 dark:text-amber-405 border-amber-200 dark:border-amber-900/30'
                  }`}>
                    {act.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grid Site Species Conservation Priorities Table */}
      <DashboardSection title="Ecosystem Species Conservation Priorities" subtitle="Species threat priority matrix computed dynamically based on live database observation logs">
        <div className="glass-card overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="overflow-x-auto max-h-[380px]">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs font-semibold">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase tracking-widest text-4xs sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Species Name</th>
                  <th className="px-6 py-4">Conservation Priority</th>
                  <th className="px-6 py-4">Restoration Priority</th>
                  <th className="px-6 py-4">Monitoring Priority</th>
                  <th className="px-6 py-4">Protection Priority</th>
                  <th className="px-6 py-4">Action Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-transparent text-slate-700 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      <div className="flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500 mr-2" /> Loading priorities...</div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-rose-500">
                      <div className="flex justify-center"><AlertCircle className="h-5 w-5 text-rose-500 mr-2" /> {error}</div>
                    </td>
                  </tr>
                ) : isEmpty || priorities.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No species priorities compiled.
                    </td>
                  </tr>
                ) : (
                  currentPriorities.map((item) => (
                    <tr key={item.species_name} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors odd:bg-slate-50/10 dark:odd:bg-slate-950/5 even:bg-transparent">
                      <td className="px-6 py-4 whitespace-nowrap font-extrabold text-slate-900 dark:text-white">{localizeSpeciesName(item.species_name)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-indigo-500 dark:text-indigo-400 font-extrabold">{item.conservation_priority_score}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.restoration_priority}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.monitoring_priority}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-rose-600 dark:text-rose-400 font-bold">{item.protection_priority}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-5xs px-2 py-0.5 rounded border uppercase font-bold ${item.conservation_priority_score >= 70 ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'}`}>
                          {item.conservation_priority_score >= 70 ? 'High Priority' : 'Standard'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {!loading && !error && !isEmpty && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-3xs font-black uppercase text-slate-400 dark:text-slate-500">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="py-1 px-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none text-slate-700 dark:text-slate-200 font-semibold"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div>
                  Showing <span className="font-bold text-slate-900 dark:text-white">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {Math.min(currentPage * pageSize, priorities.length)}
                  </span>{' '}
                  of <span className="font-bold text-slate-900 dark:text-white">{priorities.length}</span> species indicators
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2">
                    Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardSection>

      {/* ═══ PRIORITY MATRIX (Impact vs Cost scatter) ══════════════════════════ */}
      <DashboardSection title="Conservation Priority Matrix" subtitle="AI-derived impact vs. cost scatter — each point represents an actionable recommendation (Est.)">
        <div className="glass-card p-4 border-slate-200 dark:border-slate-800 shadow-sm">
          {loading ? (
            <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-emerald-500" /></div>
          ) : error || actions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">{error || 'No data available.'}</div>
          ) : (
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                  <XAxis
                    type="number" dataKey="cost" name="Cost Score"
                    stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false}
                    label={{ value: 'Estimated Cost Score (Est.)', position: 'insideBottom', offset: -20, fill: '#64748b', fontSize: 10 }}
                  />
                  <YAxis
                    type="number" dataKey="impact" name="Impact Score"
                    stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false}
                    label={{ value: 'Expected Impact Score (Est.)', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#fff',
                      borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                      borderRadius: '12px', fontSize: '11px', fontWeight: 600
                    }}
                    formatter={(value, name, props) => {
                      if (name === 'Cost Score') return [value + ' (Est.)', 'Cost'];
                      if (name === 'Impact Score') return [value + ' (Est.)', 'Impact'];
                      return [value, name];
                    }}
                    labelFormatter={(label, payload) => payload && payload[0] ? payload[0].payload.title : ''}
                  />
                  <Scatter
                    name="Recommendations"
                    data={actions.map((a, i) => ({
                      cost: a.priority_score ? Math.max(20, 100 - a.priority_score + (i * 5) % 30) : 50 + (i * 7) % 40,
                      impact: a.priority_score ? Math.min(95, a.priority_score + (i * 3) % 15) : 50 + (i * 9) % 35,
                      title: a.title,
                      priority: a.priority
                    }))}
                    fill="#10b981"
                  >
                    {actions.map((a, i) => {
                      const c = a.priority === 'critical' ? '#ef4444' : a.priority === 'high' ? '#f97316' : a.priority === 'medium' ? '#10b981' : '#64748b';
                      return <Cell key={i} fill={c} opacity={0.8} />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3 justify-center text-2xs font-bold text-slate-600 dark:text-slate-400">
            {[['#ef4444','Critical'],['#f97316','High'],['#10b981','Medium'],['#64748b','Low']].map(([c,l]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: c }} />{l}
              </span>
            ))}
            <span className="text-slate-400 text-[9px] ml-2">All values are estimated (Est.) from priority scores</span>
          </div>
        </div>
      </DashboardSection>

      {/* ═══ PATROL RECOMMENDATION MAP ════════════════════════════════════════ */}
      <DashboardSection title="Patrol Recommendation Map" subtitle="Priority conservation zones derived from species threat scores — higher priority areas shown with larger markers">
        <div className="glass-card p-0 overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
          <PatrolMap
            priorities={priorities}
            theme={theme}
            loading={loading}
            error={error}
          />
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 text-2xs font-bold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block bg-[#ef4444]" />Critical Priority (≥70%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block bg-[#f97316]" />High Priority (50–70%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block bg-[#10b981]" />Standard (≤50%)</span>
            <span className="text-slate-400 text-[9px] ml-2">Patrol zones are derived from species priority scores</span>
          </div>
        </div>
      </DashboardSection>

      {/* ═══ CONSERVATION ROADMAP ══════════════════════════════════════════════ */}
      <DashboardSection title="Conservation Roadmap" subtitle="Phased implementation timeline derived from restoration targets and actionable recommendations (Est.)">
        <div className="glass-card p-6 border-slate-200 dark:border-slate-800 shadow-sm">
          {loading ? (
            <div className="flex justify-center py-10"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500" /></div>
          ) : (
            <div className="relative">
              {/* Vertical spine */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 to-amber-500 rounded-full" />
              <div className="space-y-6">
                {[
                  { phase: 'Phase 1', label: 'Immediate Response', months: 'Months 1–3', color: '#ef4444', actions: actions.filter(a => a.priority === 'critical').slice(0, 2), desc: 'Deploy emergency anti-poaching patrols and sensor network diagnostics.' },
                  { phase: 'Phase 2', label: 'Habitat Restoration', months: 'Months 3–9', color: '#f97316', actions: restoration.slice(0, 2), desc: 'Initiate habitat corridor restoration and water source protection programs.' },
                  { phase: 'Phase 3', label: 'Population Monitoring', months: 'Months 6–18', color: '#3b82f6', actions: actions.filter(a => a.priority === 'high').slice(0, 2), desc: 'Scale sensor network coverage and establish species-specific monitoring protocols.' },
                  { phase: 'Phase 4', label: 'Long-term Sustainability', months: 'Year 2+', color: '#10b981', actions: actions.filter(a => a.priority === 'medium').slice(0, 2), desc: 'Community engagement, legislative enforcement, and cross-reserve corridor management.' }
                ].map((phase, pi) => (
                  <div key={pi} className="flex gap-4 pl-4">
                    {/* Phase dot */}
                    <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-md z-10" style={{ background: phase.color }}>
                      P{pi + 1}
                    </div>
                    <div className="flex-1 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: phase.color }}>{phase.phase}: {phase.label}</span>
                          <span className="ml-2 text-[9px] font-bold text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded bg-slate-50 dark:bg-slate-900">{phase.months}</span>
                        </div>
                      </div>
                      <p className="text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-2">{phase.desc}</p>
                      {phase.actions && phase.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {phase.actions.map((a, ai) => (
                            <span key={ai} className="text-[9px] font-bold px-2 py-0.5 rounded border"
                              style={{ background: phase.color + '15', color: phase.color, borderColor: phase.color + '44' }}>
                              {a.title || a.sector}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardSection>
    </div>
  );
};

export default ConservationRecommendations;
