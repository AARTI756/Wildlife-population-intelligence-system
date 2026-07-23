import React, { useState, useEffect, useRef } from 'react';
import { 
  Leaf, Sparkles, RefreshCw, AlertCircle, Eye, 
  Map, Activity, Award, BarChart4, Compass, ShieldCheck, Waves, Flame, Users
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie } from 'recharts';

import api from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import MetricCard from '../../components/common/MetricCard';
import DashboardSection from '../../components/common/DashboardSection';
import ChartCard from '../../components/common/ChartCard';
import MapCard from '../../components/common/MapCard';
import FilterBar from '../../components/common/FilterBar';

const HabitatIntelligence = () => {
  const { theme } = useTheme();
  
  // Filtering & API States
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [timestamp, setTimestamp] = useState('');

  // Live Database Datasets
  const [overview, setOverview] = useState(null);
  const [classification, setClassification] = useState([]);
  const [vegetation, setVegetation] = useState([]);
  const [environment, setEnvironment] = useState([]);
  const [degradation, setDegradation] = useState([]);
  const [suitabilitySites, setSuitabilitySites] = useState([]);
  const [timeline, setTimeline] = useState([]);

  // Sandbox Override States for reviewer testing
  const [sandboxState, setSandboxState] = useState('live'); // 'live', 'loading', 'error', 'empty'

  // Map refs and instances
  const suitabilityMapRef = useRef(null);
  const suitabilityMapInstance = useRef(null);

  // Destroy Leaflet map cleanly
  const destroyMap = () => {
    if (suitabilityMapInstance.current) {
      suitabilityMapInstance.current.remove();
      suitabilityMapInstance.current = null;
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
    return parts.length > 0 ? parts.join(" | ") : "All Sectors";
  };

  // Helper to assign distinct background colors for Leaflet map points
  const getMarkerColorClass = (habitatType) => {
    const hab = (habitatType || '').toLowerCase();
    if (hab.includes('forest') || hab.includes('canopy')) return 'bg-emerald-500'; // Forest
    if (hab.includes('grassland')) return 'bg-lime-500'; // Grassland
    if (hab.includes('wetland')) return 'bg-cyan-500'; // Wetland
    if (hab.includes('mangrove')) return 'bg-teal-500'; // Mangrove
    if (hab.includes('riverine') || hab.includes('river')) return 'bg-blue-500'; // Riverine
    if (hab.includes('scrubland') || hab.includes('scrub')) return 'bg-amber-500'; // Scrubland
    if (hab.includes('desert')) return 'bg-yellow-500'; // Desert
    return 'bg-slate-500'; // Fallback
  };

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
        const [overviewRes, classRes, vegRes, envRes, degRes, suitRes, timeRes] = await Promise.all([
          api.get('/api/habitat/overview', { params: queryParams }),
          api.get('/api/habitat/classification', { params: queryParams }),
          api.get('/api/habitat/vegetation', { params: queryParams }),
          api.get('/api/habitat/environment', { params: queryParams }),
          api.get('/api/habitat/degradation', { params: queryParams }),
          api.get('/api/habitat/suitability', { params: queryParams }),
          api.get('/api/habitat/timeline', { params: queryParams })
        ]);

        setOverview(overviewRes.data);
        setClassification(classRes.data || []);
        setVegetation(vegRes.data || []);
        setEnvironment(envRes.data || []);
        setDegradation(degRes.data || []);
        setSuitabilitySites(suitRes.data || []);
        setTimeline(timeRes.data || []);
        setTimestamp(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        const noData = (classRes.data || []).length === 0;
        setIsEmpty(noData);
      } catch (err) {
        console.error("Failed to load habitat intelligence telemetry:", err);
        setError("Connection to backend database failed. Verify PostgreSQL is seeded and services are running.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, sandboxState]);

  // Leaflet suitability map initialization
  useEffect(() => {
    if (loading || error || isEmpty || suitabilitySites.length === 0) {
      destroyMap();
      return;
    }

    const timer = setTimeout(() => {
      const averageCoords = () => {
        let sumLat = 0;
        let sumLng = 0;
        suitabilitySites.forEach(s => {
          sumLat += s.latitude;
          sumLng += s.longitude;
        });
        return [sumLat / suitabilitySites.length, sumLng / suitabilitySites.length];
      };

      const mapCenter = suitabilitySites.length > 0 ? averageCoords() : [29.5300, 78.7758];
      const mapZoom = suitabilitySites.length > 0 ? 10 : 8;

      if (suitabilityMapRef.current && !suitabilityMapInstance.current) {
        try {
          const map = L.map(suitabilityMapRef.current, {
            zoomControl: false,
            attributionControl: false
          }).setView(mapCenter, mapZoom);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          L.control.zoom({ position: 'bottomright' }).addTo(map);
          L.control.scale({ position: 'bottomleft' }).addTo(map);

          suitabilitySites.forEach(site => {
            const markerColor = getMarkerColorClass(site.habitat_type);
            const markerIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div class="flex h-5 w-5 items-center justify-center rounded-full ${markerColor} border-2 border-white shadow-md"><div class="h-2 w-2 rounded-full bg-slate-900 animate-pulse"></div></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            L.marker([site.latitude, site.longitude], { icon: markerIcon }).addTo(map).bindPopup(`
              <div class="p-2 text-slate-900 font-sans">
                <h4 class="font-bold text-xs">${site.site_name}</h4>
                <p class="text-3xs text-slate-650 mt-0.5">Location: ${site.location}</p>
                <p class="text-3xs text-slate-650 font-semibold mt-0.5">Habitat: ${site.habitat_type}</p>
                <p class="text-3xs font-bold text-emerald-700 mt-1">Suitability: ${site.suitability_score}%</p>
                <p class="text-3xs text-slate-500 mt-0.5">Quality: ${site.quality_score} | Disturbance: ${site.human_disturbance}</p>
              </div>
            `);
          });

          suitabilityMapInstance.current = map;
        } catch (err) {
          console.error("Error setting up suitability map:", err);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      destroyMap();
    };
  }, [loading, error, isEmpty, suitabilitySites]);

  const forceRefresh = () => {
    setSandboxState('live');
    setFilters({});
  };

  const getEnvSubtext = (metricKey) => {
    if (metricKey === 'quality') return 'Ecosystem health rating';
    if (metricKey === 'canopy') return 'Dense canopy index (NDVI)';
    if (metricKey === 'water') return 'Sufficient water access';
    if (metricKey === 'climate') return 'Precipitation & Temp';
    if (metricKey === 'suit') return 'Breeding suitability model';
    return 'Encroachment index';
  };

  // Demo Data warning badge logic
  const hasDemoData = timeline.some(t => 
    t.notes.toLowerCase().includes('canada goose') || t.notes.toLowerCase().includes('aardvark')
  ) || suitabilitySites.some(s => s.location.toLowerCase().includes('canada') || s.location.toLowerCase().includes('africa'));

  return (
    <div className="space-y-6 animate-fade-in text-slate-850 dark:text-slate-100 font-sans pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-405 uppercase tracking-widest flex items-center gap-1.5">
            <Leaf className="h-3.5 w-3.5" />
            AI Analytics Engine
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Habitat Intelligence Engine
          </h1>
          <p className="text-sm text-slate-650 dark:text-slate-400 mt-1 font-semibold">
            Analyze habitat quality, vegetation coverage indices, environmental conditions, and geospatial habitat suitability models.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={forceRefresh}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-bold text-xs shadow-xs focus:ring-2 focus:ring-emerald-500"
          >
            <RefreshCw className="h-4 w-4 text-emerald-500" />
            Recalculate Quality
          </button>
        </div>
      </div>

      {/* Demo Warning Banner */}
      {hasDemoData && (
        <div className="flex items-center gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 p-3.5 text-xs text-amber-600 dark:text-amber-400 font-semibold shadow-xs transition-all">
          <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
          <span>
            <strong>Demo Data Mode:</strong> Database contains mixed global species profiles (e.g. Canada Goose, Aardvark). Mapping site indicators dynamically.
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

      {/* Top Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} disabled={loading && sandboxState === 'live'} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard 
          title="Habitat Quality Score" 
          value={loading || error || isEmpty || !overview ? '—' : `${overview.habitat_quality_score}/100`} 
          subtext={getEnvSubtext('quality')}
          trend="positive"
          trendValue="+1.5%"
          icon={Award}
          lastUpdated={timestamp}
        />
        <MetricCard 
          title="Vegetation Coverage" 
          value={loading || error || isEmpty || !overview ? '—' : `${overview.vegetation_coverage}%`} 
          subtext={getEnvSubtext('canopy')}
          trend="positive"
          trendValue="+0.6%"
          icon={Leaf}
          lastUpdated={timestamp}
          colorClass="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/30 border-emerald-250 dark:border-emerald-900/30"
        />
        <MetricCard 
          title="Water Availability" 
          value={loading || error || isEmpty || !overview ? '—' : `${overview.water_availability}%`} 
          subtext={getEnvSubtext('water')}
          trend="positive"
          trendValue="+1.2%"
          icon={Waves}
          lastUpdated={timestamp}
          colorClass="text-blue-605 dark:text-blue-400 bg-blue-50 dark:bg-blue-955/30 border-blue-200 dark:border-blue-900/30"
        />
        <MetricCard 
          title="Environmental Condition" 
          value={loading || error || isEmpty || !overview ? '—' : `${overview.environmental_condition >= 80 ? 'Optimal' : 'Stable'} (${overview.environmental_condition.toFixed(1)}%)`} 
          subtext={getEnvSubtext('climate')}
          trend="neutral"
          trendValue="Stable"
          icon={Activity}
          lastUpdated={timestamp}
          colorClass="text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-955/30 border-cyan-200 dark:border-cyan-900/30"
        />
        <MetricCard 
          title="Habitat Suitability" 
          value={loading || error || isEmpty || !overview ? '—' : `${overview.habitat_suitability >= 75 ? 'High' : 'Medium'} (${overview.habitat_suitability.toFixed(1)}%)`} 
          subtext={getEnvSubtext('suit')}
          trend="positive"
          trendValue="+0.8%"
          icon={ShieldCheck}
          lastUpdated={timestamp}
          colorClass="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-955/30 border-indigo-200 dark:border-indigo-900/30"
        />
        <MetricCard 
          title="Human Disturbance" 
          value={loading || error || isEmpty || !overview ? '—' : `${overview.human_disturbance}%`} 
          subtext={getEnvSubtext('dist')}
          trend="negative"
          trendValue="-1.4%"
          icon={Users}
          lastUpdated={timestamp}
          colorClass="text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-955/30 border-rose-200 dark:border-rose-900/30"
        />
      </div>

      {/* Habitat Analysis Charts Grid */}
      <DashboardSection title="Ecosystem Classification & Vegetation Dynamics" subtitle="NDVI vegetation changes and landscape compositions">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classification Pie Chart */}
          <ChartCard
            title="Habitat Classification"
            subtitle="Current land cover class ratio inside monitoring sites"
            loading={loading}
            error={error}
            isEmpty={isEmpty || classification.length === 0}
            emptyTitle="No Classification Data"
            className="lg:col-span-1"
          >
            <div className="flex flex-col justify-center items-center h-full w-full">
              <div className="h-32 w-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classification}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {classification.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full text-5xs font-bold uppercase mt-4 text-slate-500 dark:text-slate-450 font-mono">
                {classification.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* Vegetation Area Chart */}
          <ChartCard
            title="Vegetation Analysis"
            subtitle="Normalized Difference Vegetation Index (NDVI) monthly fluctuations"
            loading={loading}
            error={error}
            isEmpty={isEmpty || vegetation.length === 0}
            emptyTitle="No Canopy Data"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vegetation} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="ndviColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="month" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} label={{ value: 'Month', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} domain={[0.4, 0.8]} label={{ value: 'NDVI Index Value', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="ndvi" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#ndviColor)" name="Canopy NDVI" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </DashboardSection>

      {/* Degradation & Weather Grid */}
      <DashboardSection title="Degradation & Environmental Indicators" subtitle="Track forest fire risks, human encroachment, and ambient indicators">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Degradation Index Bar Chart */}
          <ChartCard
            title="Habitat Degradation"
            subtitle="Deforestation and human disturbance severity index by monitoring sites"
            loading={loading}
            error={error}
            isEmpty={isEmpty || degradation.length === 0}
            emptyTitle="No Degradation Models"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={degradation} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="sector" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} label={{ value: 'Grid Station', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Degradation Severity (%)', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="index" fill="#ef4444" radius={[4, 4, 0, 0]} name="Deforestation severity" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Weather Environmental Line Chart */}
          <ChartCard
            title="Environmental Monitoring"
            subtitle="Microclimate data: Temperature (°C) vs Relative Humidity (%)"
            loading={loading}
            error={error}
            isEmpty={isEmpty || environment.length === 0}
            emptyTitle="No Climate Telemetry"
            className="lg:col-span-1"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={environment} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="day" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={9} tickLine={false} label={{ value: 'Day', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={9} tickLine={false} axisLine={false} label={{ value: 'Atmosphere Metrics', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} name="Temperature (°C)" dot={false} />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} name="Humidity (%)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </DashboardSection>

      {/* Suitability Map & Landscape Timeline split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <MapCard
          title="Habitat Suitability Map"
          subtitle="Spatial models indicating ideal breeding zones and water resources"
          loading={loading}
          error={error}
          isEmpty={isEmpty || suitabilitySites.length === 0}
          mapRef={suitabilityMapRef}
          height="h-[340px]"
          className="lg:col-span-1"
        >
          {!loading && !error && !isEmpty && suitabilitySites.length > 0 && (
            <div className="absolute top-3 left-3 z-10 bg-slate-900/90 dark:bg-slate-950/90 text-white p-2.5 rounded-lg text-5xs font-bold border border-slate-800 pointer-events-none shadow-md space-y-1">
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Forest/Canopy</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-lime-500"></span> Grassland</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-500"></span> Wetland</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal-500"></span> Mangrove</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500"></span> Riverine</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500"></span> Scrubland</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-yellow-500"></span> Desert</div>
              <div className="text-slate-400 mt-1 uppercase tracking-wider block border-t border-slate-800 pt-1">
                Sites: {suitabilitySites.length} | Filters: {getFilterSummary()}
              </div>
            </div>
          )}
        </MapCard>

        {/* Timeline Table */}
        <div className="glass-card p-6 flex flex-col justify-between border-slate-202 dark:border-slate-805 shadow-sm lg:col-span-2 min-h-[340px]">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Habitat Timeline</h3>
            <p className="text-3xs text-slate-550 dark:text-slate-400 mt-0.5 font-semibold">Logged landscape updates, anomalies, and structural changes</p>
          </div>

          <div className="flex-1 mt-4 overflow-y-auto space-y-3 max-h-[250px] pr-1">
            {loading ? (
              <div className="flex justify-center py-10"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500" /></div>
            ) : error ? (
              <div className="text-rose-500 text-center py-10">{error}</div>
            ) : isEmpty || timeline.length === 0 ? (
              <div className="text-slate-400 text-center py-10 text-xs">No logs recorded.</div>
            ) : (
              timeline.map((log) => {
                let badgeClass = 'bg-slate-50 border-slate-205 text-slate-600';
                
                // Color-code the timeline badges according to standard specifications
                const cat = log.category;
                if (cat === 'Wildlife Observation') {
                  badgeClass = 'bg-blue-500/10 border-blue-500/20 text-blue-650 dark:text-blue-400';
                } else if (cat === 'Habitat Change') {
                  badgeClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-650 dark:text-emerald-400';
                } else if (cat === 'Environmental Event') {
                  badgeClass = 'bg-amber-500/10 border-amber-500/20 text-amber-650 dark:text-amber-400';
                } else if (cat === 'Human Disturbance') {
                  badgeClass = 'bg-rose-500/10 border-rose-500/20 text-rose-650 dark:text-rose-455';
                } else if (cat === 'AI Detection') {
                  badgeClass = 'bg-purple-500/10 border-purple-500/20 text-purple-650 dark:text-purple-400 font-bold';
                }
                
                return (
                  <div key={log.id} className="p-3 rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950/45 hover:border-emerald-500/20 transition-all flex flex-col sm:flex-row justify-between items-start gap-2 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-4xs font-bold text-slate-400 dark:text-slate-500">{new Date(log.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                        <span className={`text-5xs font-black uppercase px-2 py-0.5 rounded border ${badgeClass}`}>{log.category}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-150 mt-1">{log.event}</p>
                      <p className="text-3xs text-slate-550 dark:text-slate-455 mt-0.5 leading-relaxed font-semibold">{log.notes}</p>
                    </div>
                    <span className="shrink-0 text-5xs font-black uppercase px-1.5 py-0.5 rounded border bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500">
                      {log.severity}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitatIntelligence;
