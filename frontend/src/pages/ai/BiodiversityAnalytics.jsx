import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, RefreshCw, AlertCircle, Eye, 
  Map, Activity, Award, BarChart4, Compass, ShieldCheck, Waves, Flame, HeartHandshake,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie } from 'recharts';

import api from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import MetricCard from '../../components/common/MetricCard';
import DashboardSection from '../../components/common/DashboardSection';
import ChartCard from '../../components/common/ChartCard';
import MapCard from '../../components/common/MapCard';
import FilterBar from '../../components/common/FilterBar';

const BiodiversityAnalytics = () => {
  const { theme } = useTheme();
  
  // Filtering & API States
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [timestamp, setTimestamp] = useState('');

  // Live Database Datasets
  const [overview, setOverview] = useState(null);
  const [diversitySites, setDiversitySites] = useState([]);
  const [abundance, setAbundance] = useState([]);
  const [trends, setTrends] = useState([]);
  const [composition, setComposition] = useState([]);
  const [endangered, setEndangered] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);

  // Sandbox Override States for reviewer testing
  const [sandboxState, setSandboxState] = useState('live'); // 'live', 'loading', 'error', 'empty'

  // Table Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Map refs and instances
  const heatmapMapRef = useRef(null);
  const heatmapMapInstance = useRef(null);

  // Destroy Leaflet map cleanly
  const destroyMap = () => {
    if (heatmapMapInstance.current) {
      heatmapMapInstance.current.remove();
      heatmapMapInstance.current = null;
    }
  };

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

  // Compile active filters summary for display
  const getFilterSummary = () => {
    const parts = [];
    if (filters.survey_id) parts.push("Survey active");
    if (filters.site_id) parts.push("Site active");
    if (filters.species) parts.push(`Species: ${filters.species}`);
    if (filters.habitat) parts.push(`Habitat: ${filters.habitat}`);
    if (filters.dateRangePreset) parts.push(`Range: ${filters.dateRangePreset}`);
    return parts.length > 0 ? parts.join(" | ") : "All Reserves";
  };

  // Reset page number on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Main fetch effect
  useEffect(() => {
    if (sandboxState !== 'live') {
      destroyMap();
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
        const [overviewRes, diversityRes, abundanceRes, trendsRes, compRes, endRes, heatRes] = await Promise.all([
          api.get('/api/biodiversity/overview', { params: queryParams }),
          api.get('/api/biodiversity/diversity', { params: queryParams }),
          api.get('/api/biodiversity/abundance', { params: queryParams }),
          api.get('/api/biodiversity/trends', { params: queryParams }),
          api.get('/api/biodiversity/composition', { params: queryParams }),
          api.get('/api/biodiversity/endangered', { params: queryParams }),
          api.get('/api/biodiversity/heatmap', { params: queryParams })
        ]);

        setOverview(overviewRes.data);
        setDiversitySites(diversityRes.data || []);
        setAbundance(abundanceRes.data || []);
        setTrends(trendsRes.data || []);
        setComposition(compRes.data || []);
        setEndangered(endRes.data || []);
        setHeatmapData(heatRes.data || []);
        setTimestamp(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        const noData = (abundanceRes.data || []).length === 0;
        setIsEmpty(noData);
      } catch (err) {
        console.error("Failed to load biodiversity analytics telemetry:", err);
        setError("Connection to backend database failed. Verify PostgreSQL is seeded and services are running.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, sandboxState]);

  // Leaflet heatmap and protected area overlays
  useEffect(() => {
    if (loading || error || isEmpty || heatmapData.length === 0) {
      destroyMap();
      return;
    }

    const timer = setTimeout(() => {
      const averageCoords = () => {
        let sumLat = 0;
        let sumLng = 0;
        heatmapData.forEach(s => {
          sumLat += s.latitude;
          sumLng += s.longitude;
        });
        return [sumLat / heatmapData.length, sumLng / heatmapData.length];
      };

      const mapCenter = heatmapData.length > 0 ? averageCoords() : [29.5300, 78.7758];
      const mapZoom = heatmapData.length > 0 ? 10 : 8;

      if (heatmapMapRef.current && !heatmapMapInstance.current) {
        try {
          const map = L.map(heatmapMapRef.current, {
            zoomControl: false,
            attributionControl: false
          }).setView(mapCenter, mapZoom);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          L.control.zoom({ position: 'bottomright' }).addTo(map);
          L.control.scale({ position: 'bottomleft' }).addTo(map);

          heatmapData.forEach(site => {
            const heatRadius = Math.min(site.detections * 95, 3800) + 1200;
            const heatColor = site.detections > 35 ? '#ef4444' : (site.detections > 15 ? '#f59e0b' : '#3b82f6');
            
            L.circle([site.latitude, site.longitude], {
              color: heatColor,
              fillColor: heatColor,
              fillOpacity: 0.22,
              radius: heatRadius
            }).addTo(map);

            if (site.protected_area) {
              L.circle([site.latitude, site.longitude], {
                color: '#10b981',
                weight: 2.5,
                fillColor: 'transparent',
                dashArray: '5, 8',
                radius: heatRadius + 600
              }).addTo(map);
            }

            const markerIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div class="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 border-2 border-white shadow-lg"><div class="h-2.5 w-2.5 rounded-full ${site.protected_area ? 'bg-emerald-500' : 'bg-indigo-500'}"></div></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });

            L.marker([site.latitude, site.longitude], { icon: markerIcon }).addTo(map).bindPopup(`
              <div class="p-2 text-slate-900 font-sans">
                <h4 class="font-bold text-xs">${site.site_name}</h4>
                <p className="text-3xs text-slate-600 mt-0.5">${site.protected_area ? '🌿 Protected Reserve Area' : 'Buffer Forest Zone'}</p>
                <p class="text-3xs font-bold text-slate-700 mt-1">Detections: ${site.detections} counts</p>
                <p class="text-3xs text-slate-500 mt-0.5">Grid Density: ${site.density} / km²</p>
              </div>
            `);
          });

          heatmapMapInstance.current = map;
        } catch (err) {
          console.error("Error setting up heatmap map:", err);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      destroyMap();
    };
  }, [loading, error, isEmpty, heatmapData]);

  const forceRefresh = () => {
    setSandboxState('live');
    setFilters({});
  };

  // Demo Warning Check
  const hasDemoData = endangered.some(e => 
    ['aardvark', 'canada goose', 'wild boar'].includes(e.species_name.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(diversitySites.length / pageSize);
  const currentSites = diversitySites.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-850 dark:text-slate-100 font-sans pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI Biodiversity Suite
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Biodiversity Analytics
          </h1>
          <p className="text-sm text-slate-550 dark:text-slate-400 mt-1 font-semibold">
            Ecosystem telemetry, Shannon-Simpson indices, and spatial-temporal detection distributions across monitored reserves.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={forceRefresh}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-bold text-xs shadow-xs focus:ring-2 focus:ring-emerald-500"
          >
            <RefreshCw className="h-4 w-4 text-emerald-500" />
            Sync Analytics
          </button>
        </div>
      </div>

      {/* Demo Warning Banner */}
      {hasDemoData && (
        <div className="flex items-center gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 p-3.5 text-xs text-amber-600 dark:text-amber-400 font-semibold shadow-xs transition-all">
          <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
          <span>
            <strong>Demo Data Mode:</strong> Database contains mixed global species profiles (e.g. Aardvark, Canada Goose) for evaluation. Standardizing diversity matrix to observed reserves.
          </span>
        </div>
      )}

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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <MetricCard 
          title="Shannon Index" 
          value={loading || error || isEmpty || !overview ? '—' : overview.shannon_diversity_index.toFixed(3)} 
          subtext="Ecosystem stability rating"
          icon={Award}
          lastUpdated={timestamp}
        />
        <MetricCard 
          title="Simpson's Index" 
          value={loading || error || isEmpty || !overview ? '—' : overview.simpson_diversity_index.toFixed(3)} 
          subtext="Species dominance score"
          icon={Compass}
          lastUpdated={timestamp}
          colorClass="text-blue-650 dark:text-blue-400 bg-blue-50 dark:bg-blue-955/30 border-blue-200 dark:border-blue-900/30"
        />
        <MetricCard 
          title="Species Evenness" 
          value={loading || error || isEmpty || !overview ? '—' : overview.species_evenness.toFixed(3)} 
          subtext="Individual even spread"
          icon={Activity}
          lastUpdated={timestamp}
          colorClass="text-lime-600 dark:text-lime-400 bg-lime-50 dark:bg-lime-955/30 border-lime-200 dark:border-lime-900/30"
        />
        <MetricCard 
          title="Species Richness" 
          value={loading || error || isEmpty || !overview ? '—' : overview.species_richness} 
          subtext="Unique species catalogued"
          icon={Eye}
          lastUpdated={timestamp}
          colorClass="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/30 border-emerald-250 dark:border-emerald-900/30"
        />
        <MetricCard 
          title="Observation Density" 
          value={loading || error || isEmpty || !overview ? '—' : overview.observation_density.toFixed(2)} 
          subtext="Average counts per site"
          icon={Waves}
          lastUpdated={timestamp}
          colorClass="text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-955/30 border-cyan-200 dark:border-cyan-900/30"
        />
        <MetricCard 
          title="Threatened Species" 
          value={loading || error || isEmpty || !overview ? '—' : overview.endangered_species_count} 
          subtext="Vulnerable or endangered"
          icon={Flame}
          lastUpdated={timestamp}
          colorClass="text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-955/30 border-rose-200 dark:border-rose-900/30"
        />
        <MetricCard 
          title="Biodiversity Health" 
          value={loading || error || isEmpty || !overview ? '—' : `${overview.biodiversity_health_index.toFixed(1)}/100`} 
          subtext="Overall biological health"
          icon={ShieldCheck}
          lastUpdated={timestamp}
          colorClass="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-955/30 border-indigo-200 dark:border-indigo-900/30"
        />
      </div>

      {/* Visual Analytics Charts */}
      <DashboardSection title="Taxonomic Abundance & Sighting Trends" subtitle="Detailed species dominance profiles and temporal distributions">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Relative Species Abundance */}
          <ChartCard
            title="Species Abundance Distribution"
            subtitle="Relative dominance percentage of monitored wildlife"
            loading={loading}
            error={error}
            isEmpty={isEmpty || abundance.length === 0}
            emptyTitle="No Abundance Telemetry"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={abundance} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="species_name" fontSize={9} tickLine={false} stroke={theme === 'dark' ? '#64748b' : '#475569'} label={{ value: 'Species', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis fontSize={9} tickLine={false} axisLine={false} stroke={theme === 'dark' ? '#64748b' : '#475569'} label={{ value: 'Abundance (%)', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="relative_abundance_pct" fill="#10b981" radius={[4, 4, 0, 0]} name="Relative Abundance (%)">
                  {abundance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Species Composition Pie Chart */}
          <ChartCard
            title="Species Composition"
            subtitle="Taxonomic Class distribution ratio (Mammals, Birds, etc.)"
            loading={loading}
            error={error}
            isEmpty={isEmpty || composition.length === 0}
            emptyTitle="No Composition Breakdown"
            className="lg:col-span-1"
          >
            <div className="flex flex-col justify-center items-center h-full w-full">
              <div className="h-36 w-36 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={composition}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {composition.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full text-5xs font-bold uppercase mt-4 text-slate-500 dark:text-slate-450 font-mono">
                {composition.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
      </DashboardSection>

      {/* Diversity Trends & Habitat Distribution */}
      <DashboardSection title="Ecosystem Stability & Spatial heatmaps" subtitle="Temporal Shannon Index shifts and territorial diversity models">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Diversity Trends over time */}
          <ChartCard
            title="Diversity Trend Chart"
            subtitle="Monthly Shannon Index fluctuations tracking ecosystem stability"
            loading={loading}
            error={error}
            isEmpty={isEmpty || trends.length === 0}
            emptyTitle="No Diversity Trends"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="shannonTrendColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="month" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} label={{ value: 'Month', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} domain={[1.0, 3.5]} label={{ value: 'Shannon Diversity Index', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="shannon" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#shannonTrendColor)" name="Shannon stability" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Habitat Biodiversity (Richness vs Evenness by site) */}
          <ChartCard
            title="Habitat Sighting Density"
            subtitle="Total detections logged across monitored locations"
            loading={loading}
            error={error}
            isEmpty={isEmpty || heatmapData.length === 0}
            emptyTitle="No Habitat Biodiversity"
            className="lg:col-span-1"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmapData.slice(0, 6)} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="site_name" fontSize={9} tickLine={false} stroke={theme === 'dark' ? '#64748b' : '#475569'} label={{ value: 'Grid Station', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke={theme === 'dark' ? '#64748b' : '#475569'} label={{ value: 'Detections Count', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="detections" fill="#a855f7" radius={[4, 4, 0, 0]} name="Detections" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </DashboardSection>

      {/* Map Card */}
      <DashboardSection title="Geospatial Biodiversity heatmaps" subtitle="Live mapping indicating hotspot zones, protected reserves, and density logs">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MapCard
            title="Biodiversity Heatmap"
            subtitle="Dynamic hotspot mapping showing observation densities"
            loading={loading}
            error={error}
            isEmpty={isEmpty || heatmapData.length === 0}
            mapRef={heatmapMapRef}
            height="h-[380px]"
            className="lg:col-span-1"
          >
            {!loading && !error && !isEmpty && heatmapData.length > 0 && (
              <div className="absolute top-3 left-3 z-10 bg-slate-900/90 dark:bg-slate-950/90 text-white p-2.5 rounded-lg text-5xs font-bold border border-slate-800 pointer-events-none shadow-md space-y-1">
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Protected Area</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500"></span> Buffer Zone Site</div>
                <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-rose-500/20 border border-rose-500"></span> Sighting Hotspot Area</div>
                <div className="text-slate-400 mt-1 uppercase tracking-wider block border-t border-slate-800 pt-1">
                  Sites: {heatmapData.length} | Filters: {getFilterSummary()}
                </div>
              </div>
            )}
          </MapCard>

          {/* Endangered Species Summary Table */}
          <div className="glass-card p-5 border-slate-202 dark:border-slate-805 shadow-sm lg:col-span-2 min-h-[380px] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">IUCN Threatened Species Log</h3>
              <p className="text-3xs text-slate-550 dark:text-slate-400 mt-0.5 font-semibold">Active monitor logs targeting vulnerable, endangered, and critically endangered taxonomies</p>
            </div>
            
            <div className="flex-1 mt-4 overflow-y-auto max-h-[290px] pr-1">
              {loading ? (
                <div className="flex justify-center py-10"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500" /></div>
              ) : error ? (
                <div className="text-rose-500 text-center py-10">{error}</div>
              ) : isEmpty || endangered.length === 0 ? (
                <div className="text-slate-400 text-center py-10 text-xs">No threatened species detected in observations.</div>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs font-semibold">
                  <thead className="bg-slate-50 dark:bg-slate-905 text-slate-500 dark:text-slate-400 uppercase tracking-widest text-5xs sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Common Species Name</th>
                      <th className="px-4 py-3">IUCN Status</th>
                      <th className="px-4 py-3">Detections</th>
                      <th className="px-4 py-3">Avg Re-ID Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60 bg-transparent text-slate-700 dark:text-slate-350">
                    {endangered.map((sp) => {
                      let statusClass = "bg-slate-105/10 text-slate-700 border-slate-200/20";
                      const st = sp.iucn_status.toLowerCase();
                      if (st.includes('critically') || st === 'cr') {
                        statusClass = "bg-red-500/10 text-red-650 border-red-500/20 font-black";
                      } else if (st.includes('endangered') || st === 'en') {
                        statusClass = "bg-rose-500/10 text-rose-650 border-rose-500/20 font-bold";
                      } else if (st.includes('vulnerable') || st === 'vu') {
                        statusClass = "bg-amber-500/10 text-amber-650 border-amber-500/20";
                      }
                      
                      return (
                        <tr key={sp.species_name} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors odd:bg-slate-50/10 dark:odd:bg-slate-950/5 even:bg-transparent">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-950 dark:text-white">{sp.species_name}</span>
                              {sp.scientific_name && (
                                <span className="text-5xs italic text-slate-500 dark:text-slate-400 mt-0.5">{sp.scientific_name}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-5xs px-2 py-0.5 rounded border uppercase font-bold ${statusClass}`}>
                              {sp.iucn_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900 dark:text-white">{sp.observation_count}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-black text-emerald-650 dark:text-emerald-400">{(sp.reidentification_confidence * 100).toFixed(0)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </DashboardSection>

      {/* Grid Site Diversity Index Assessments Table */}
      <DashboardSection title="Grid Site Diversity Assessments" subtitle="Validated biodiversity indices computed on individual monitoring stations">
        <div className="glass-card overflow-hidden border-slate-202 dark:border-slate-805 shadow-sm space-y-4">
          <div className="overflow-x-auto max-h-[380px]">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs font-semibold">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase tracking-widest text-4xs sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Site Name</th>
                  <th className="px-6 py-4">Location Coordinates</th>
                  <th className="px-6 py-4">Species Richness</th>
                  <th className="px-6 py-4">Shannon Diversity</th>
                  <th className="px-6 py-4">Simpson Dominance</th>
                  <th className="px-6 py-4">Species Evenness</th>
                  <th className="px-6 py-4">Zone Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-transparent text-slate-700 dark:text-slate-350">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      <div className="flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500 mr-2" /> Loading assessments...</div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-rose-500">
                      <div className="flex justify-center"><AlertCircle className="h-5 w-5 text-rose-500 mr-2" /> {error}</div>
                    </td>
                  </tr>
                ) : isEmpty || diversitySites.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No site assessments logged.
                    </td>
                  </tr>
                ) : (
                  currentSites.map((site) => (
                    <tr key={site.site_id} className="hover:bg-slate-55/40 dark:hover:bg-slate-900/10 transition-colors odd:bg-slate-50/10 dark:odd:bg-slate-950/5 even:bg-transparent">
                      <td className="px-6 py-4 whitespace-nowrap font-extrabold text-slate-900 dark:text-white">{site.site_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-550 text-3xs font-mono">[{site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}]</td>
                      <td className="px-6 py-4 whitespace-nowrap font-black">{site.richness} species</td>
                      <td className="px-6 py-4 whitespace-nowrap font-extrabold text-indigo-650 dark:text-indigo-400">{site.shannon.toFixed(3)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{site.simpson.toFixed(3)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{site.evenness.toFixed(3)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-5xs px-2 py-0.5 rounded border uppercase font-bold ${site.protected_area ? 'bg-emerald-50 border-emerald-250 text-emerald-700 dark:bg-emerald-955/20 dark:border-emerald-900/30 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-450'}`}>
                          {site.protected_area ? 'Protected' : 'Standard'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {!loading && !error && !isEmpty && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-405">
              <div>
                Showing <span className="font-bold text-slate-900 dark:text-white">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {Math.min(currentPage * pageSize, diversitySites.length)}
                </span>{' '}
                of <span className="font-bold text-slate-900 dark:text-white">{diversitySites.length}</span> grid stations
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </DashboardSection>
    </div>
  );
};

export default BiodiversityAnalytics;
