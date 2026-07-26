import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Sparkles, RefreshCw, AlertCircle, 
  Map, Activity, Award, BarChart4, Compass, ShieldCheck, Eye, ChevronLeft, ChevronRight
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import api from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import MetricCard from '../../components/common/MetricCard';
import { localizeSpeciesName } from '../../utils/india';
import DashboardSection from '../../components/common/DashboardSection';
import ChartCard from '../../components/common/ChartCard';
import MapCard from '../../components/common/MapCard';
import FilterBar from '../../components/common/FilterBar';

const PopulationEstimation = () => {
  const { theme } = useTheme();
  
  // Filtering & API States
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [timestamp, setTimestamp] = useState('');

  // Live Database Datasets
  const [overview, setOverview] = useState(null);
  const [speciesMetrics, setSpeciesMetrics] = useState([]);
  const [trends, setTrends] = useState({ daily: [], weekly: [], monthly: [], growth_rate_pct: null, decline_rate_pct: null, stable_trend: true });
  const [distribution, setDistribution] = useState({ by_survey: [], by_site: [], by_habitat: [], by_state: [], by_protected: [], by_species: [] });
  const [densitySites, setDensitySites] = useState([]);
  const [richnessStats, setRichnessStats] = useState([]);

  // Sandbox Override States for reviewer testing
  const [sandboxState, setSandboxState] = useState('live'); // 'live', 'loading', 'error', 'empty'

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Map refs and instances
  const densityMapRef = useRef(null);
  const migrationMapRef = useRef(null);
  const distributionMapRef = useRef(null);

  const densityMapInstance = useRef(null);
  const migrationMapInstance = useRef(null);
  const distributionMapInstance = useRef(null);

  // Destroy Leaflet maps cleanly
  const destroyMaps = () => {
    if (densityMapInstance.current) {
      densityMapInstance.current.remove();
      densityMapInstance.current = null;
    }
    if (migrationMapInstance.current) {
      migrationMapInstance.current.remove();
      migrationMapInstance.current = null;
    }
    if (distributionMapInstance.current) {
      distributionMapInstance.current.remove();
      distributionMapInstance.current = null;
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
    if (filters.survey_id) parts.push("Survey filter active");
    if (filters.site_id) parts.push("Site filter active");
    if (filters.species) parts.push(`Species: ${filters.species}`);
    if (filters.habitat) parts.push(`Habitat: ${filters.habitat}`);
    if (filters.dateRangePreset) parts.push(`Range: ${filters.dateRangePreset}`);
    return parts.length > 0 ? parts.join(" | ") : "All Areas";
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Main fetch effect
  useEffect(() => {
    if (sandboxState !== 'live') {
      destroyMaps();
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
        const [overviewRes, speciesRes, trendsRes, distRes, densityRes, richnessRes] = await Promise.all([
          api.get('/api/population/overview', { params: queryParams }),
          api.get('/api/population/species', { params: queryParams }),
          api.get('/api/population/trends', { params: queryParams }),
          api.get('/api/population/distribution', { params: queryParams }),
          api.get('/api/population/density', { params: queryParams }),
          api.get('/api/population/richness', { params: queryParams })
        ]);

        setOverview(overviewRes.data);
        setSpeciesMetrics(speciesRes.data || []);
        setTrends(trendsRes.data || { daily: [], weekly: [], monthly: [], growth_rate_pct: null, decline_rate_pct: null, stable_trend: true });
        setDistribution(distRes.data || { by_survey: [], by_site: [], by_habitat: [], by_state: [], by_protected: [], by_species: [] });
        setDensitySites(densityRes.data || []);
        setRichnessStats(richnessRes.data || []);
        setTimestamp(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        const noObservations = (speciesRes.data || []).length === 0;
        setIsEmpty(noObservations);
      } catch (err) {
        console.error("Failed to load population engine telemetry:", err);
        setError("Connection to backend database failed. Verify PostgreSQL is seeded and services are running.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, sandboxState]);

  // Leaflet initialization effect
  useEffect(() => {
    if (loading || error || isEmpty || densitySites.length === 0) {
      destroyMaps();
      return;
    }

    const timer = setTimeout(() => {
      const averageCoords = () => {
        let sumLat = 0;
        let sumLng = 0;
        densitySites.forEach(s => {
          sumLat += s.latitude;
          sumLng += s.longitude;
        });
        return [sumLat / densitySites.length, sumLng / densitySites.length];
      };

      const mapCenter = densitySites.length > 0 ? averageCoords() : [29.5300, 78.7758];
      const mapZoom = densitySites.length > 0 ? 10 : 8;

      // 1. Initialize Density Map
      if (densityMapRef.current && !densityMapInstance.current) {
        try {
          const map = L.map(densityMapRef.current, {
            zoomControl: false,
            attributionControl: false
          });
          if (densitySites.length > 0) {
            map.fitBounds(L.latLngBounds(densitySites.map(s => [s.latitude, s.longitude])), { padding: [50, 50] });
          } else {
            map.setView([29.5300, 78.7758], 8);
          }
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          L.control.zoom({ position: 'bottomright' }).addTo(map);
          L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

          densitySites.forEach(site => {
            const markerColor = '#1E88E5'; // Monitoring Site -> Blue
            const markerIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-md" style="background-color: ${markerColor}"><div class="h-2 w-2 rounded-full bg-slate-900 animate-pulse"></div></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            L.marker([site.latitude, site.longitude], { icon: markerIcon }).addTo(map).bindPopup(`
              <div class="p-2 text-slate-900 font-sans">
                <h4 class="font-bold text-xs">${site.site_name}</h4>
                <p class="text-3xs text-slate-655 mt-0.5">${site.location}</p>
                <p class="text-3xs font-bold text-emerald-700 mt-1">Est. Density: ${site.density} / km²</p>
                <p class="text-3xs text-slate-550 mt-0.5">Est. Population: ${site.estimated_population}</p>
              </div>
            `);
          });

          densityMapInstance.current = map;
        } catch (err) {
          console.error("Error setting up density map:", err);
        }
      }

      // 2. Initialize Migration Map (Corridors connecting high-density nodes)
      if (migrationMapRef.current && !migrationMapInstance.current) {
        try {
          const map = L.map(migrationMapRef.current, {
            zoomControl: false,
            attributionControl: false
          });
          if (densitySites.length > 0) {
            map.fitBounds(L.latLngBounds(densitySites.map(s => [s.latitude, s.longitude])), { padding: [50, 50] });
          } else {
            map.setView([29.5300, 78.7758], 8);
          }
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          L.control.zoom({ position: 'bottomright' }).addTo(map);
          L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

          if (densitySites.length >= 2) {
            const sortedSites = [...densitySites].sort((a, b) => b.density - a.density).slice(0, 3);
            const pathCoords = sortedSites.map(s => [s.latitude, s.longitude]);
            
            L.polyline(pathCoords, { color: '#06b6d4', weight: 4, dashArray: '5, 10' }).addTo(map);

            sortedSites.forEach((site, idx) => {
              const markerColor = '#1E88E5'; // Monitoring Site -> Blue
              const markerIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-md" style="background-color: ${markerColor}"><div class="h-2 w-2 rounded-full bg-slate-900 animate-ping"></div></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });
              L.marker([site.latitude, site.longitude], { icon: markerIcon }).addTo(map).bindPopup(`
                <div class="p-2 text-slate-900 font-sans">
                  <h4 class="font-bold text-xs">Migration Node ${idx + 1}</h4>
                  <p class="text-3xs text-slate-655 mt-0.5">${site.site_name}</p>
                </div>
              `);
            });
          }

          migrationMapInstance.current = map;
        } catch (err) {
          console.error("Error setting up migration map:", err);
        }
      }

      // 3. Initialize Species Distribution Map
      if (distributionMapRef.current && !distributionMapInstance.current) {
        try {
          const map = L.map(distributionMapRef.current, {
            zoomControl: false,
            attributionControl: false
          });
          if (densitySites.length > 0) {
            map.fitBounds(L.latLngBounds(densitySites.map(s => [s.latitude, s.longitude])), { padding: [50, 50] });
          } else {
            map.setView([29.5300, 78.7758], 8);
          }
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          L.control.zoom({ position: 'bottomright' }).addTo(map);
          L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

          densitySites.forEach(site => {
            L.circle([site.latitude, site.longitude], {
              color: '#1E88E5',
              fillColor: '#1E88E5',
              fillOpacity: Math.min(site.density * 0.08, 0.45) + 0.1,
              radius: 1800
            }).addTo(map).bindPopup(`
              <div class="p-2 text-slate-900 font-sans">
                <h4 class="font-bold text-xs">${site.site_name} Range</h4>
                <p class="text-3xs text-slate-600">Density: ${site.density} / km²</p>
              </div>
            `);
          });

          distributionMapInstance.current = map;
        } catch (err) {
          console.error("Error setting up distribution map:", err);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      destroyMaps();
    };
  }, [loading, error, isEmpty, densitySites]);

  const forceRefresh = () => {
    setSandboxState('live');
    setFilters({});
  };

  // Safe formatting helpers for trend values
  const getGrowthRateString = () => {
    if (loading || error || isEmpty || !overview) return '—';
    const rate = overview.average_growth_rate;
    if (rate === null || rate === undefined) return 'Insufficient data';
    return rate >= 0 ? `+${rate.toFixed(1)}%` : `${rate.toFixed(1)}%`;
  };

  const getGrowthTrend = () => {
    if (loading || error || isEmpty || !overview) return 'neutral';
    const rate = overview.average_growth_rate;
    if (rate === null || rate === undefined) return 'neutral';
    if (rate > 2.0) return 'positive';
    if (rate < -2.0) return 'negative';
    return 'neutral';
  };

  // Species mapping check for mixed global/demo data
  const hasDemoData = speciesMetrics.some(m => 
    ['aardvark', 'canada goose', 'wild boar', 'hornbill', 'nilgai'].includes(m.species_name.toLowerCase())
  );

  // Pagination math
  const totalPages = Math.ceil(speciesMetrics.length / pageSize);
  const currentMetrics = speciesMetrics.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-850 dark:text-slate-100 font-sans pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-405 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Live Analytics Engine
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Population Estimation Engine
          </h1>
          <p className="text-sm text-slate-655 dark:text-slate-400 mt-1 font-semibold">
            Estimate wildlife population size, density, distribution and long-term trends using AI-assisted observation analytics.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={forceRefresh}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-bold text-xs shadow-xs focus:ring-2 focus:ring-emerald-500"
          >
            <RefreshCw className="h-4 w-4 text-emerald-500" />
            Reset & Sync DB
          </button>
        </div>
      </div>

      {/* Demo Data Mode Warning Banner */}
      {hasDemoData && (
        <div className="flex items-center gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 p-3.5 text-xs text-amber-600 dark:text-amber-400 font-semibold shadow-xs transition-all">
          <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
          <span>
            <strong>Demo Data Mode:</strong> Database contains mixed global species profiles (e.g. Aardvark, Canada Goose) for evaluation. Standardizing taxonomic classifications to Common Names.
          </span>
        </div>
      )}

      {/* Interactive Controls to Test API States */}
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

      {/* Top Filter Bar - fully wired */}
      <FilterBar filters={filters} onChange={setFilters} disabled={loading && sandboxState === 'live'} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        <div className="relative">
          <MetricCard 
            title="Estimated Population" 
            value={loading || error || isEmpty || !overview ? '—' : overview.total_estimated_population} 
            subtext="Estimated individuals"
            trend={getGrowthTrend()}
            trendValue={getGrowthRateString()}
            icon={Eye}
            lastUpdated={timestamp}
          />
          <span 
            title="Ecological Abundance formula: N_est = N_obs / [Confidence * (1 - e^-D)] where D is detection frequency." 
            className="absolute top-2 right-2 cursor-help text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-5xs p-1"
            aria-label="Estimated population formula info"
          >
            ⓘ
          </span>
        </div>
        <MetricCard 
          title="Population Density" 
          value={loading || error || isEmpty || !overview ? '—' : overview.average_density.toFixed(2)} 
          subtext="Animals / km² average"
          icon={Activity}
          lastUpdated={timestamp}
          colorClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-955/30 border-blue-200 dark:border-blue-900/30"
        />
        <MetricCard 
          title="Species Richness" 
          value={loading || error || isEmpty || !overview ? '—' : overview.total_species_richness} 
          subtext="Observed species"
          icon={Award}
          lastUpdated={timestamp}
          colorClass="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/30 border-amber-200 dark:border-amber-900/30"
        />
        <MetricCard 
          title="Population Growth" 
          value={getGrowthRateString()} 
          subtext="Monthly trend shift"
          trend={getGrowthTrend()}
          trendValue={getGrowthRateString()}
          icon={TrendingUp}
          lastUpdated={timestamp}
          colorClass="text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-955/30 border-rose-200 dark:border-rose-900/30"
        />
        <MetricCard 
          title="Observation Coverage" 
          value={loading || error || isEmpty || !overview ? '—' : `${overview.average_observation_coverage}%`} 
          subtext="Active grid sites"
          icon={ShieldCheck}
          lastUpdated={timestamp}
          colorClass="text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-955/30 border-cyan-200 dark:border-cyan-900/30"
        />
        <MetricCard 
          title="Migration Activity" 
          value={loading || error || isEmpty || !trends ? '—' : (trends.stable_trend ? 'Stable' : 'High')} 
          subtext="Corridor activity"
          icon={Compass}
          lastUpdated={timestamp}
          colorClass="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-955/30 border-indigo-200 dark:border-indigo-900/30"
        />
      </div>

      {/* Main Charts Section */}
      <DashboardSection title="Population Analytics Trends & Comparison" subtitle="Weekly models generated from multi-modal sensor networks">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Population Trend Chart"
            subtitle="Estimated growth trajectory of observed individuals over time"
            loading={loading}
            error={error}
            isEmpty={isEmpty || trends.monthly.length === 0}
            emptyTitle="No Trend Analysis Found"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.monthly} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="popTrendColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="month" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} label={{ value: 'Month', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Detections Count', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#popTrendColor)" name="Individuals Sighted" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Species Population Comparison"
            subtitle="Observed individual count distribution categorized by key wildlife species"
            loading={loading}
            error={error}
            isEmpty={isEmpty || distribution.by_species.length === 0}
            emptyTitle="No Species Distribution Data"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution.by_species.map(item => ({ ...item, name: localizeSpeciesName(item.name) }))} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={9} tickLine={false} label={{ value: 'Species', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Individual Count', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Observed Count">
                  {distribution.by_species.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </DashboardSection>

      {/* Geospatial Overlays */}
      <DashboardSection title="Geospatial Wildlife Mapping" subtitle="AI tracking maps detailing hotzones, migrations, and animal sitings">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MapCard
            title="Population Density Map"
            subtitle="Density map highlighting core concentration areas"
            loading={loading}
            error={error}
            isEmpty={isEmpty || densitySites.length === 0}
            mapRef={densityMapRef}
            height="h-72"
          >
            {!loading && !error && !isEmpty && densitySites.length > 0 && (
              <div className="absolute top-3 left-3 z-10 bg-slate-900/90 dark:bg-slate-950/90 text-white p-2.5 rounded-lg text-5xs font-bold border border-slate-800 pointer-events-none shadow-md space-y-1">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> High Density (&gt; 5/km²)</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400"></span> Buffer Node</div>
                <div className="text-slate-400 mt-1 uppercase tracking-wider block border-t border-slate-800 pt-1">
                  Sites: {densitySites.length} | Filters: {getFilterSummary()}
                </div>
              </div>
            )}
          </MapCard>

          <MapCard
            title="Migration Pattern Map"
            subtitle="Geographical movement patterns and corridor paths"
            loading={loading}
            error={error}
            isEmpty={isEmpty || densitySites.length < 2}
            emptyTitle="Insufficient Corridor Coordinates"
            emptyDescription="Requires at least 2 active monitoring sites with detections to map migration vectors."
            mapRef={migrationMapRef}
            height="h-72"
          >
            {!loading && !error && !isEmpty && densitySites.length >= 2 && (
              <div className="absolute top-3 left-3 z-10 bg-slate-900/90 dark:bg-slate-950/90 text-white p-2.5 rounded-lg text-5xs font-bold border border-slate-800 pointer-events-none shadow-md space-y-1">
                <div className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-cyan-500 border-dashed border-t"></span> Active Corridor Path</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></span> Corridor Node</div>
                <div className="text-slate-400 mt-1 uppercase tracking-wider block border-t border-slate-800 pt-1">
                  Paths: {densitySites.length >= 3 ? 2 : 1} | Filters: {getFilterSummary()}
                </div>
              </div>
            )}
          </MapCard>

          <MapCard
            title="Species Distribution Map"
            subtitle="Aggregated home range mapping for selected species"
            loading={loading}
            error={error}
            isEmpty={isEmpty || densitySites.length === 0}
            mapRef={distributionMapRef}
            height="h-72"
          >
            {!loading && !error && !isEmpty && densitySites.length > 0 && (
              <div className="absolute top-3 left-3 z-10 bg-slate-900/90 dark:bg-slate-950/90 text-white p-2.5 rounded-lg text-5xs font-bold border border-slate-800 pointer-events-none shadow-md space-y-1">
                <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-500/20 border border-emerald-500"></span> Home Range Circle</div>
                <div className="text-slate-400 mt-1 uppercase tracking-wider block border-t border-slate-800 pt-1">
                  Radius: 1.8km | Filters: {getFilterSummary()}
                </div>
              </div>
            )}
          </MapCard>
        </div>
      </DashboardSection>

      {/* Table Section */}
      <DashboardSection title="Recent Population Assessments" subtitle="Validated and pending census records generated by officers and researchers">
        <div className="glass-card overflow-hidden border-slate-202 dark:border-slate-805 shadow-sm space-y-4">
          <div className="overflow-x-auto max-h-[420px]">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs font-semibold">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase tracking-widest text-4xs sticky top-0 z-10 border-b border-slate-250 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Common Species Name</th>
                  <th className="px-6 py-4">Est. Population</th>
                  <th className="px-6 py-4">Obs. Count</th>
                  <th className="px-6 py-4">Est. Density (/km²)</th>
                  <th className="px-6 py-4">Detection Freq (%)</th>
                  <th className="px-6 py-4">Avg Confidence</th>
                  <th className="px-6 py-4">Site Count</th>
                  <th className="px-6 py-4">Latest Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-transparent text-slate-700 dark:text-slate-350">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">
                      <div className="flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500 mr-2" /> Loading records...</div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-rose-500">
                      <div className="flex justify-center"><AlertCircle className="h-5 w-5 text-rose-500 mr-2" /> {error}</div>
                    </td>
                  </tr>
                ) : isEmpty || speciesMetrics.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">
                      No population assessments logged.
                    </td>
                  </tr>
                ) : (
                  currentMetrics.map((item) => (
                    <tr key={item.species_name} className="hover:bg-slate-55/40 dark:hover:bg-slate-900/10 transition-colors odd:bg-slate-50/10 dark:odd:bg-slate-950/5 even:bg-transparent">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 dark:text-white">{localizeSpeciesName(item.species_name)}</span>
                          {item.scientific_name && (
                            <span className="text-4xs italic text-slate-500 dark:text-slate-400 mt-0.5">{item.scientific_name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-black text-slate-900 dark:text-white">{item.estimated_population}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.observation_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold">{item.population_density.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.detection_frequency}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">{(item.average_confidence * 100).toFixed(0)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-655 dark:text-slate-400">{item.monitoring_site_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-550 text-3xs">
                        {item.latest_observation ? new Date(item.latest_observation).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {!loading && !error && !isEmpty && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-405 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-3xs font-black uppercase text-slate-400 dark:text-slate-500">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="py-1 px-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none text-slate-705 dark:text-slate-200 font-semibold"
                >
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div>
                  Showing <span className="font-bold text-slate-900 dark:text-white">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {Math.min(currentPage * pageSize, speciesMetrics.length)}
                  </span>{' '}
                  of <span className="font-bold text-slate-900 dark:text-white">{speciesMetrics.length}</span> species profiles
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
    </div>
  );
};

export default PopulationEstimation;
