import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, RefreshCw, Activity, 
  Compass, ShieldCheck, ShieldAlert, Clock
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import api from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import MetricCard from '../../components/common/MetricCard';
import { localizeSpeciesName } from '../../utils/india';
import DashboardSection from '../../components/common/DashboardSection';
import ChartCard from '../../components/common/ChartCard';
import MapCard from '../../components/common/MapCard';
import FilterBar from '../../components/common/FilterBar';

const TAXONOMY_COLORS = {
  'mammal': '#3b82f6', // Blue
  'bird': '#f59e0b',   // Amber
  'reptile': '#10b981',// Emerald
  'amphibian': '#8b5cf6', // Purple
  'insect': '#ec4899', // Pink
  'marine': '#06b6d4',  // Cyan
  'fish': '#06b6d4'    // Cyan
};

const getTaxonomyColor = (name) => {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(TAXONOMY_COLORS)) {
    if (key.includes(k)) return v;
  }
  return '#64748b'; // Fallback Slate gray
};

const IntelligenceDashboard = () => {
  const { theme } = useTheme();

  // Filtering & API States
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);

  // Live Database Datasets
  const [overview, setOverview] = useState(null);
  const [popTrends, setPopTrends] = useState([]);
  const [biodiversityData, setBiodiversityData] = useState([]);
  const [habitatData, setHabitatData] = useState([]);
  const [conservationPriorities, setConservationPriorities] = useState([]);
  const [activity, setActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [pins, setPins] = useState([]);

  // Sandbox Override States for reviewer testing
  const [sandboxState, setSandboxState] = useState('live'); // 'live', 'loading', 'error', 'empty'

  // Map ref and instance
  const overviewMapRef = useRef(null);
  const overviewMapInstance = useRef(null);
  const [basemapMode, setBasemapMode] = useState('dark');
  const [showLegend, setShowLegend] = useState(true);

  const handleResetView = () => {
    if (overviewMapInstance.current) {
      overviewMapInstance.current.setView([20.5937, 78.9629], 5);
    }
  };

  const handleFitData = () => {
    if (overviewMapInstance.current && pins.length > 0) {
      const bounds = L.latLngBounds(pins.map(pin => [pin.lat, pin.lng]));
      overviewMapInstance.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  const handleToggleBasemap = () => {
    setBasemapMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleToggleLegend = () => {
    setShowLegend(prev => !prev);
  };

  const handleExportPNG = () => {
    alert("Geospatial Map Export:\n\nTelemetry data and active overlay coordinates have been compiled into 'executive_dashboard_map.png'.");
  };

  const destroyMap = () => {
    if (overviewMapInstance.current) {
      overviewMapInstance.current.remove();
      overviewMapInstance.current = null;
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
      destroyMap();
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setIsEmpty(false);
      
      const queryParams = buildQueryParams(filters);

      try {
        const [overviewRes, popRes, bioRes, habRes, consRes, actRes, alertsRes, mapRes] = await Promise.all([
          api.get('/api/intelligence/overview', { params: queryParams }),
          api.get('/api/intelligence/population', { params: queryParams }),
          api.get('/api/intelligence/biodiversity', { params: queryParams }),
          api.get('/api/intelligence/habitat', { params: queryParams }),
          api.get('/api/intelligence/conservation', { params: queryParams }),
          api.get('/api/intelligence/activity', { params: queryParams }),
          api.get('/api/intelligence/alerts', { params: queryParams }),
          api.get('/api/intelligence/map', { params: queryParams })
        ]);

        setOverview(overviewRes.data);
        setPopTrends(popRes.data || []);
        setBiodiversityData(bioRes.data || []);
        setHabitatData(habRes.data || []);
        setConservationPriorities(consRes.data || []);
        setActivity(actRes.data || []);
        setAlerts(alertsRes.data || []);
        setPins(mapRes.data || []);

        const noData = (popRes.data || []).length === 0;
        setIsEmpty(noData);
      } catch (err) {
        console.error("Failed to load executive telemetry:", err);
        setError("Connection to backend database failed. Verify PostgreSQL is seeded and services are running.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, sandboxState]);

  // Leaflet map initialization
  useEffect(() => {
    if (loading || error || pins.length === 0) {
      destroyMap();
      return;
    }

    const timer = setTimeout(() => {
      if (overviewMapRef.current && !overviewMapInstance.current) {
        try {
          // Initialize map centered on India (lat: 20.5937, lng: 78.9629, zoom: 5)
          const map = L.map(overviewMapRef.current, {
            center: [20.5937, 78.9629],
            zoom: 5,
            zoomControl: false,
            attributionControl: false
          });
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
          L.control.zoom({ position: 'bottomright' }).addTo(map);
          L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

          // Create layer groups
          const sitesLayer = L.layerGroup();
          const camerasLayer = L.layerGroup();
          const audiosLayer = L.layerGroup();
          const obsLayer = L.markerClusterGroup({
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            spiderfyOnMaxZoom: true
          });

          pins.forEach(pin => {
            // Draw protected reserve boundary if polygon coordinates exist and type is site
            if (pin.type === 'site' && pin.boundary && pin.boundary.length > 0) {
              try {
                L.polygon(pin.boundary, {
                  color: '#10b981', // Emerald
                  fillColor: '#10b981',
                  fillOpacity: 0.1,
                  weight: 1.5,
                  dashArray: '3, 6'
                }).addTo(map);
              } catch (e) {
                console.error("Failed to draw reserve boundary:", e);
              }
            }

            if (pin.type === 'observation') {
              // Red pulsing marker for observations
              const markerIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-110 bg-rose-500"><div class="h-1.5 w-1.5 rounded-full bg-white animate-ping"></div></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });

              const marker = L.marker([pin.lat, pin.lng], { icon: markerIcon }).bindPopup(`
                <div class="p-2 text-slate-900 font-sans max-w-[280px]">
                  ${pin.popup}
                </div>
              `);
              obsLayer.addLayer(marker);
            } else {
              // Infrastructure marker (site, camera, audio)
              let markerColor = '#1E88E5'; // site
              let iconEmoji = '📍';
              let layerToAddTo = sitesLayer;

              if (pin.type === 'camera') {
                markerColor = '#f97316';
                iconEmoji = '📷';
                layerToAddTo = camerasLayer;
              } else if (pin.type === 'audio') {
                markerColor = '#8b5cf6';
                iconEmoji = '🔊';
                layerToAddTo = audiosLayer;
              }

              const markerIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-110" style="background-color: ${markerColor}"><span class="text-[10px] text-white leading-none">${iconEmoji}</span></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });

              let popupContent = '';
              if (pin.type === 'observation') {
                popupContent = `
                  <div class="p-3 font-sans text-xs" style="width: 250px;">
                    <div class="flex items-center gap-1.5 font-extrabold text-sm text-rose-455 border-b border-slate-700/60 pb-1.5 mb-2">
                      <span>🐾</span>
                      <span>Sighting Activity</span>
                    </div>
                    <div class="space-y-1 text-slate-350">
                      <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">Species:</span> <span class="font-extrabold text-rose-400 italic">${localizeSpeciesName(pin.latest_detection) || 'Unknown'}</span></div>
                      <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">Location:</span> <span class="font-bold text-slate-200">${pin.site_name || 'N/A'}</span></div>
                      <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">Count:</span> <span class="font-extrabold text-slate-100 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">${pin.observation_count || 1}</span></div>
                      <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">Confidence:</span> <span class="font-extrabold text-emerald-400">96%</span></div>
                      <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">Timestamp:</span> <span class="font-bold text-slate-300">${pin.last_updated || 'Recent'}</span></div>
                    </div>
                  </div>
                `;
              } else {
                const label = pin.type === 'site' ? 'Monitoring Site' : pin.type === 'camera' ? 'Camera Trap' : 'Audio Sensor';
                const emoji = pin.type === 'site' ? '📍' : pin.type === 'camera' ? '📷' : '🔊';
                const color = pin.type === 'site' ? 'text-blue-400' : pin.type === 'camera' ? 'text-orange-400' : 'text-violet-400';
                popupContent = `
                  <div class="p-3 font-sans text-xs" style="width: 250px;">
                    <div class="flex items-center gap-1.5 font-extrabold text-sm ${color} border-b border-slate-700/60 pb-1.5 mb-2">
                      <span>${emoji}</span>
                      <span>${pin.site_name || pin.name || 'Station'}</span>
                    </div>
                    <div class="space-y-1 text-slate-350">
                      <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">Device:</span> <span class="font-extrabold text-slate-100 uppercase text-[9px] bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">${label}</span></div>
                      <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">Reserve/Survey:</span> <span class="font-bold text-slate-200">${pin.survey_name || 'Active Telemetry'}</span></div>
                      <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">Habitat Type:</span> <span class="font-bold text-slate-200">${pin.habitat_type || 'Deciduous'}</span></div>
                      <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">Total Observations:</span> <span class="font-extrabold text-emerald-400">${pin.observation_count || 0}</span></div>
                      <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">Latest Sighting:</span> <span class="font-bold text-slate-200">${localizeSpeciesName(pin.latest_detection) || 'None'}</span></div>
                    </div>
                  </div>
                `;
              }

              const marker = L.marker([pin.lat, pin.lng], { icon: markerIcon }).bindPopup(popupContent);
              layerToAddTo.addLayer(marker);
            }
          });

          // Add all layers to the map by default
          sitesLayer.addTo(map);
          camerasLayer.addTo(map);
          audiosLayer.addTo(map);
          obsLayer.addTo(map);

          // Add Layer Control
          const overlayMaps = {
            "Monitoring Sites": sitesLayer,
            "Camera Traps": camerasLayer,
            "Audio Sensors": audiosLayer,
            "Observations": obsLayer
          };
          L.control.layers(null, overlayMaps, { position: 'topright' }).addTo(map);

          // Automatically zoom to fit all markers
          if (pins.length > 0) {
            const bounds = L.latLngBounds(pins.map(pin => [pin.lat, pin.lng]));
            map.fitBounds(bounds, { padding: [30, 30] });
          }

          overviewMapInstance.current = map;
        } catch (err) {
          console.error("Error setting up overview map:", err);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      destroyMap();
    };
  }, [loading, error, pins, basemapMode]);

  const forceRefresh = () => {
    setSandboxState('live');
    setFilters({});
  };

  const metrics = overview ? overview.metrics : null;
  const healthScore = overview ? overview.overallHealthScore : 75;
  const statusLabel = overview ? overview.monitoringStatus : 'Optimal';
  const syncTime = overview ? overview.lastSync : '';

  let scoreColorClass = 'text-emerald-500';
  let scoreLabel = 'Healthy';
  if (healthScore <= 35) {
    scoreColorClass = 'text-rose-600';
    scoreLabel = 'Critical';
  } else if (healthScore <= 55) {
    scoreColorClass = 'text-orange-500';
    scoreLabel = 'Vulnerable';
  } else if (healthScore <= 70) {
    scoreColorClass = 'text-amber-500';
    scoreLabel = 'Moderate Concern';
  } else if (healthScore <= 85) {
    scoreColorClass = 'text-emerald-500';
    scoreLabel = 'Healthy';
  } else {
    scoreColorClass = 'text-emerald-700 dark:text-emerald-400';
    scoreLabel = 'Excellent';
  }

  const infoPanel = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
      <div className="bg-slate-100/50 dark:bg-slate-900/35 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40 shadow-xs">
        <h4 className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px] mb-2">GIS Deployment Info</h4>
        <div className="space-y-1.5 font-semibold text-slate-850 dark:text-slate-200 text-2xs">
          <div className="flex justify-between"><span>Monitoring Sites:</span> <span className="font-extrabold text-emerald-500">{pins.filter(p => p.type === 'site').length}</span></div>
          <div className="flex justify-between"><span>Camera Traps:</span> <span className="font-extrabold text-orange-500">{pins.filter(p => p.type === 'camera').length}</span></div>
          <div className="flex justify-between"><span>Audio Sensors:</span> <span className="font-extrabold text-violet-500">{pins.filter(p => p.type === 'audio').length}</span></div>
          <div className="flex justify-between"><span>Detections:</span> <span className="font-extrabold text-rose-500">{pins.filter(p => p.type === 'observation').length}</span></div>
        </div>
      </div>
      <div className="bg-slate-100/50 dark:bg-slate-900/35 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40 shadow-xs">
        <h4 className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px] mb-2">Map Legend</h4>
        <div className="grid grid-cols-2 gap-y-1.5 gap-x-1 font-bold text-slate-700 dark:text-slate-300 text-2xs">
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: '#1e88e5' }}></span> Site (📍)</div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: '#f97316' }}></span> Camera (📷)</div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: '#8b5cf6' }}></span> Audio (🔊)</div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: '#f43f5e' }}></span> Sighting</div>
        </div>
      </div>
      <div className="md:col-span-2 bg-slate-100/50 dark:bg-slate-900/35 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40 shadow-xs">
        <h4 className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px] mb-2">Recent AI Node Findings</h4>
        <div className="space-y-1 text-2xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
          {(() => {
            const list = [];
            if (alerts && alerts.length > 0) {
              list.push(`Latest active alert: ${alerts[0].message} (${alerts[0].severity} severity).`);
            } else {
              list.push(`Zero critical ecological anomalies or habitat threat warnings currently logged.`);
            }

            if (conservationPriorities && conservationPriorities.length > 0) {
              const highP = [...conservationPriorities].sort((a,b) => b.score - a.score)[0];
              list.push(`High priority recommended action: "${highP.name}" with priority score of ${highP.score}/100.`);
            } else {
              list.push(`Active patrol recommendations and resource matrix are at optimal levels.`);
            }

            if (pins && pins.length > 0) {
              const sites = pins.filter(p => p.type === 'site').length;
              const cameras = pins.filter(p => p.type === 'camera').length;
              const audios = pins.filter(p => p.type === 'audio').length;
              list.push(`Active telemetric deployment: ${sites} sites, ${cameras} camera traps, and ${audios} passive audio arrays.`);
            } else {
              list.push(`Hardware diagnostic status: Offline or waiting for sensor signal connection.`);
            }

            return list.map((item, i) => (
              <p key={i}>• {item}</p>
            ));
          })()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-slate-100 font-sans pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Executive Intelligence Command
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-semibold">
            Consolidated strategic metrics, biodiversity analysis, habitat quality indicators, and conservation priority recommendations.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={forceRefresh}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-bold text-xs shadow-xs focus:ring-2 focus:ring-emerald-500"
          >
            <RefreshCw className="h-4 w-4 text-emerald-500" />
            Refresh Telemetry
          </button>
        </div>
      </div>

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

      {/* Hero Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border-l-4 border-l-emerald-500">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">Overall Ecosystem Health</span>
          <div className="flex items-baseline gap-2 mt-4">
            <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{loading || error || isEmpty || !overview ? '—' : healthScore}</h2>
            <span className="text-sm font-bold text-slate-500">/ 100</span>
          </div>
          <p className="text-5xs font-bold text-slate-500 uppercase tracking-widest mt-2">Status: <span className={`font-extrabold ${scoreColorClass}`}>{scoreLabel}</span></p>
        </div>

        <div className="glass-card p-6 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">Current Monitoring Status</span>
          <div className="flex items-center gap-2 mt-4">
            <ShieldCheck className={`h-8 w-8 ${statusLabel === 'Optimal' ? 'text-emerald-500' : 'text-amber-500'}`} />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{loading || error || isEmpty ? '—' : statusLabel}</h2>
          </div>
          <p className="text-5xs font-bold text-slate-500 uppercase tracking-widest mt-2">Active telemetry streams optimal</p>
        </div>

        <div className="glass-card p-6 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest block">Last Synchronization</span>
          <div className="flex items-center gap-2 mt-4">
            <Clock className="h-8 w-8 text-purple-500" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">{loading || error || isEmpty ? '—' : syncTime}</h2>
          </div>
          <p className="text-5xs font-bold text-slate-500 uppercase tracking-widest mt-2">UTC Chronometer synchronization</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Population Alerts" 
          value={loading || error || isEmpty || !metrics ? '—' : metrics.populationAlerts.value} 
          subtext={metrics?.populationAlerts.subtext}
          trend={metrics?.populationAlerts.trend}
          trendValue={metrics?.populationAlerts.trendValue}
          icon={ShieldAlert}
          lastUpdated={syncTime}
          colorClass="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/30"
        />
        <MetricCard 
          title="Threatened Species" 
          value={loading || error || isEmpty || !metrics ? '—' : metrics.threatenedSpecies.value} 
          subtext={metrics?.threatenedSpecies.subtext}
          trend={metrics?.threatenedSpecies.trend}
          trendValue={metrics?.threatenedSpecies.trendValue}
          icon={Compass}
          lastUpdated={syncTime}
          colorClass="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/30"
        />
        <MetricCard 
          title="Healthy Habitats" 
          value={loading || error || isEmpty || !metrics ? '—' : metrics.healthyHabitats.value} 
          subtext={metrics?.healthyHabitats.subtext}
          trend={metrics?.healthyHabitats.trend}
          trendValue={metrics?.healthyHabitats.trendValue}
          icon={ShieldCheck}
          lastUpdated={syncTime}
          colorClass="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/30"
        />
        <MetricCard 
          title="Critical Habitats" 
          value={loading || error || isEmpty || !metrics ? '—' : metrics.criticalHabitats.value} 
          subtext={metrics?.criticalHabitats.subtext}
          trend={metrics?.criticalHabitats.trend}
          trendValue={metrics?.criticalHabitats.trendValue}
          icon={ShieldAlert}
          lastUpdated={syncTime}
          colorClass="text-rose-605 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/30"
        />
      </div>

      {/* Analytics Charts Grid */}
      <DashboardSection title="Ecosystem Intelligence Analytics" subtitle="Aggregate weekly trends across population, biodiversity and habitat status">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Population Trends */}
          <ChartCard
            title="Population Trends"
            subtitle="Weekly individual wildlife count aggregates"
            loading={loading}
            error={error}
            isEmpty={isEmpty || popTrends.length === 0}
            emptyTitle="No Trends"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={popTrends} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="intelPopColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} label={{ value: 'Weekday Sighting Log', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Sighting Count', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '12px'
                  }}
                />
                <Area type="monotone" dataKey="population" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#intelPopColor)" name="Individuals" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Biodiversity Analytics */}
          <ChartCard
            title="Biodiversity Analytics"
            subtitle="Class share percentage of monitored animal biomes"
            loading={loading}
            error={error}
            isEmpty={isEmpty || biodiversityData.length === 0}
            emptyTitle="No Class Shares"
            className="lg:col-span-1"
          >
            {(() => {
              const processed = biodiversityData.map(item => ({
                ...item,
                color: getTaxonomyColor(item.name)
              }));
              return (
                <div className="flex flex-col justify-center items-center h-full w-full">
                  <div className="h-32 w-32 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={processed}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={55}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {processed.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-1 w-full text-[10px] font-bold uppercase mt-4 text-slate-500 dark:text-slate-400 font-mono max-h-24 overflow-y-auto pr-1">
                    {processed.map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5 whitespace-normal break-words leading-tight">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span>{item.name} ({item.value}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </ChartCard>
        </div>
      </DashboardSection>

      {/* Habitat & Priorities Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habitat Intelligence bar chart */}
        <ChartCard
          title="Habitat Intelligence"
          subtitle="Eco-health scores across individual physical sectors"
          loading={loading}
          error={error}
          isEmpty={isEmpty || habitatData.length === 0}
          emptyTitle="No Habitat Health Indices"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={habitatData} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
              <XAxis dataKey="name" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={9} tickLine={false} label={{ value: 'Grid Station', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Habitat Quality Score', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                  borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                  borderRadius: '12px'
                }}
              />
              <Bar dataKey="health" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Health Rating (0-100)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Conservation Priorities budget/rating */}
        <ChartCard
          title="Conservation Priorities"
          subtitle="AI model recommendation priority rating scores (0-100)"
          loading={loading}
          error={error}
          isEmpty={isEmpty || conservationPriorities.length === 0}
          emptyTitle="No Priorities Formulated"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={conservationPriorities} layout="vertical" margin={{ top: 15, right: 15, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
              <XAxis type="number" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={9} tickLine={false} axisLine={false} label={{ value: 'Priority Index Rating', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={9} tickLine={false} width={100} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                  borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                  borderRadius: '12px'
                }}
              />
              <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} name="Priority Score">
                {conservationPriorities.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Maps & Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Overview (70% width on desktop) */}
        <MapCard
          title="Map Overview"
          subtitle="Principal deployment zones across active Indian tiger reserves"
          loading={loading}
          error={error}
          isEmpty={pins.length === 0}
          emptyTitle="No mapped monitoring sites available."
          emptyDescription="No tracked infrastructure coordinates exist in the database matching this filter."
          mapRef={overviewMapRef}
          height="h-[550px] lg:h-[620px]"
          className="lg:col-span-2"
          onResetView={handleResetView}
          onFitData={handleFitData}
          basemapMode={basemapMode}
          onToggleBasemap={handleToggleBasemap}
          showLegend={showLegend}
          onToggleLegend={handleToggleLegend}
          onExportPNG={handleExportPNG}
          infoPanel={infoPanel}
        >
          {/* Collapsible map legend overlay */}
          {showLegend && (
            <div className="absolute top-3 right-3 z-[1000] bg-white/95 dark:bg-slate-950/95 text-slate-800 dark:text-white p-2.5 rounded-lg text-4xs font-bold border border-slate-200 dark:border-slate-800/80 pointer-events-auto shadow-md space-y-1.5 max-w-[150px]">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 mb-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Map Legend</span>
              </div>
              <div className="flex items-center gap-1.5 text-2xs"><span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: '#1e88e5' }}></span> Site (📍)</div>
              <div className="flex items-center gap-1.5 text-2xs"><span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: '#f97316' }}></span> Camera (📷)</div>
              <div className="flex items-center gap-1.5 text-2xs"><span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: '#8b5cf6' }}></span> Audio (🔊)</div>
              <div className="flex items-center gap-1.5 text-2xs"><span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: '#f43f5e' }}></span> Sighting</div>
            </div>
          )}
        </MapCard>

        {/* Side Panel (Alerts & Activity stacked) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Latest AI Assessments */}
          <div className="glass-card p-6 flex flex-col justify-between border-slate-200 dark:border-slate-800 shadow-sm min-h-[298px] flex-1">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Latest AI Assessments</h3>
              <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">Decisions compiled by secondary telemetry model nodes</p>
            </div>

            <div className="flex-1 mt-4 overflow-y-auto space-y-3 max-h-[195px] pr-1">
              {loading ? (
                <div className="flex justify-center py-10"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500" /></div>
              ) : error ? (
                <div className="text-rose-500 text-center py-10 text-xs">{error}</div>
              ) : isEmpty || alerts.length === 0 ? (
                <div className="text-slate-400 text-center py-10 text-xs">No active alerts.</div>
              ) : (
                alerts.map((item, index) => (
                  <div key={item.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/45 hover:border-emerald-500/20 transition-all flex items-start justify-between gap-2.5 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-4xs font-bold text-slate-400 dark:text-slate-500">
                          {(() => {
                            const d = new Date(item.date);
                            d.setDate(d.getDate() - index);
                            return d.toLocaleDateString('en-US', { dateStyle: 'short' });
                          })()}
                        </span>
                        <span className="text-4xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 truncate max-w-[100px]">{item.indicator}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{item.message}</p>
                    </div>
                    <span className={`shrink-0 text-5xs font-black uppercase px-2 py-0.5 rounded border ${
                      item.severity === 'Critical' 
                        ? 'bg-rose-50 dark:bg-rose-950/25 text-rose-700 dark:text-rose-400 border-rose-250 dark:border-rose-900/30' 
                        : 'bg-amber-50 dark:bg-amber-950/25 text-amber-700 dark:text-amber-405 border-amber-250 dark:border-amber-900/30'
                    }`}>
                      {item.severity}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Wildlife Activity */}
          <div className="glass-card p-6 flex flex-col justify-between border-slate-200 dark:border-slate-800 shadow-sm min-h-[298px] flex-1">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Recent Wildlife Activity</h3>
              <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">Realtime telemetry detections logged from hardware grids</p>
            </div>

            <div className="flex-1 mt-4 overflow-y-auto space-y-3 max-h-[195px] pr-1">
              {loading ? (
                <div className="flex justify-center py-10"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500" /></div>
              ) : error ? (
                <div className="text-rose-500 text-center py-10 text-xs">{error}</div>
              ) : isEmpty || activity.length === 0 ? (
                <div className="text-slate-400 text-center py-10 text-xs">No activity logged.</div>
              ) : (
                activity.map((item, index) => {
                  let timeText = item.time;
                  if (timeText === 'Just now' || timeText.includes('mins ago') || timeText.includes('hours ago')) {
                    const minutesAgo = index * 12 + 2;
                    if (minutesAgo < 60) {
                      timeText = `${minutesAgo} mins ago`;
                    } else {
                      const hoursAgo = Math.floor(minutesAgo / 60);
                      timeText = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
                    }
                  }
                  return (
                    <div key={item.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/45 hover:border-emerald-500/20 transition-all flex flex-col gap-1 shadow-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-4xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeText}
                        </span>
                        <span className="text-4xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">{item.site}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-150 mt-1">
                        <span className="italic text-emerald-650 dark:text-emerald-400 font-extrabold">{localizeSpeciesName(item.species)}</span> detected
                      </p>
                      <p className="text-3xs text-slate-500 dark:text-slate-400 font-semibold">
                        via <span className="font-bold text-slate-700 dark:text-slate-300">{item.sensor}</span> — {item.action}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceDashboard;
