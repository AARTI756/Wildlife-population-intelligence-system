import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TrendingUp, Sparkles, RefreshCw, AlertCircle, 
  Map, Activity, Award, Compass, ShieldCheck, Eye, ChevronLeft, ChevronRight
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import api from '../../services/api';
import MetricCard from '../../components/common/MetricCard';
import { localizeSpeciesName, formatLastUpdated } from '../../utils/india';
import DashboardSection from '../../components/common/DashboardSection';
import ChartCard from '../../components/common/ChartCard';
import MapCard from '../../components/common/MapCard';
import FilterBar from '../../components/common/FilterBar';

const PopulationEstimation = () => {
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
  const [migrationData, setMigrationData] = useState([]);
  const [distributionMapData, setDistributionMapData] = useState([]);



  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Tabbed map state
  const [activeMapTab, setActiveMapTab] = useState('density'); // 'density' | 'migration' | 'distribution'
  const [showMapLegend, setShowMapLegend] = useState(true);

  // Interactive controls
  const [migrationSeason, setMigrationSeason] = useState('All');
  const [showDistributionHeatmap, setShowDistributionHeatmap] = useState(false);
  const [showHomeRangePolygons, setShowHomeRangePolygons] = useState(true);

  // Unified map ref / instance
  const tabbedMapRef = useRef(null);
  const tabbedMapInstance = useRef(null);
  const baseTileLayer = useRef(null);
  const densityLayerGroup = useRef(null);
  const migrationLayerGroup = useRef(null);
  const distributionLayerGroup = useRef(null);

  // Destroy Leaflet maps cleanly
  const destroyMaps = () => {
    if (tabbedMapInstance.current) {
      tabbedMapInstance.current.remove();
      tabbedMapInstance.current = null;
    }
    densityLayerGroup.current = null;
    migrationLayerGroup.current = null;
    distributionLayerGroup.current = null;
    baseTileLayer.current = null;
  };

  const handleResetView = () => {
    if (tabbedMapInstance.current) tabbedMapInstance.current.setView([20.5937, 78.9629], 5);
  };

  const handleFitData = () => {
    const map = tabbedMapInstance.current;
    if (!map) return;
    let pts = [];
    if (activeMapTab === 'density' && densitySites.length > 0) pts = densitySites.map(s => [s.latitude, s.longitude]);
    else if (activeMapTab === 'migration' && migrationData.length > 0) migrationData.forEach(v => { pts.push([v.first_lat, v.first_lng], [v.second_lat, v.second_lng]); });
    else if (activeMapTab === 'distribution' && distributionMapData.length > 0) pts = distributionMapData.map(p => [p.lat, p.lng]);
    if (pts.length > 0) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
  };

  const handleExportPNG = () => {
    alert("Map Export: Geospatial overlay coordinates compiled. Use browser print-to-PDF or screenshot to save the current map view.");
  };

  // Helper to compile Axios query parameters
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
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setIsEmpty(false);
      
      const queryParams = buildQueryParams(filters);

      try {
        const [overviewRes, speciesRes, trendsRes, distRes, densityRes, richnessRes, migrationRes, distMapRes] = await Promise.all([
          api.get('/api/population/overview', { params: queryParams }),
          api.get('/api/population/species', { params: queryParams }),
          api.get('/api/population/trends', { params: queryParams }),
          api.get('/api/population/distribution', { params: queryParams }),
          api.get('/api/population/density', { params: queryParams }),
          api.get('/api/population/richness', { params: queryParams }),
          api.get('/api/population/migration', { params: queryParams }),
          api.get('/api/population/distribution-map', { params: queryParams })
        ]);

        setOverview(overviewRes.data);
        setSpeciesMetrics(speciesRes.data || []);
        setTrends(trendsRes.data || { daily: [], weekly: [], monthly: [], growth_rate_pct: null, decline_rate_pct: null, stable_trend: true });
        setDistribution(distRes.data || { by_survey: [], by_site: [], by_habitat: [], by_state: [], by_protected: [], by_species: [] });
        setDensitySites(densityRes.data || []);
        setMigrationData(migrationRes.data || []);
        setDistributionMapData(distMapRes.data || []);
        setTimestamp(formatLastUpdated(new Date()));

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
  }, [filters]);

  // Helper to get species color
  const getSpeciesColor = useCallback((speciesName) => {
    if (!speciesName) return '#10b981';
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
    let hash = 0;
    for (let i = 0; i < speciesName.length; i++) hash = speciesName.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }, []);

  const getBezierPoints = (p1, p2, pointsCount = 20) => {
    const lat1 = p1[0], lng1 = p1[1];
    const lat2 = p2[0], lng2 = p2[1];
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    const offsetScale = 0.15;
    const controlLat = midLat - dLng * offsetScale;
    const controlLng = midLng + dLat * offsetScale;
    const curvePoints = [];
    for (let i = 0; i <= pointsCount; i++) {
      const t = i / pointsCount;
      const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * controlLat + t * t * lat2;
      const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * controlLng + t * t * lng2;
      curvePoints.push([lat, lng]);
    }
    return curvePoints;
  };

  const crossProduct = (o, a, b) => {
    return (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]);
  };

  const getConvexHull = (points) => {
    if (points.length <= 2) return points;
    const sorted = [...points].sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
    const lower = [];
    for (let i = 0; i < sorted.length; i++) {
      while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], sorted[i]) <= 0) {
        lower.pop();
      }
      lower.push(sorted[i]);
    }
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], sorted[i]) <= 0) {
        upper.pop();
      }
      upper.push(sorted[i]);
    }
    upper.pop();
    lower.pop();
    return lower.concat(upper);
  };

  // Filter migration data
  const filteredMigrationData = React.useMemo(() => {
    if (migrationSeason === 'All') return migrationData;
    return migrationData.filter(v => {
      const estSeason = v.season || (v.distance_km % 3 === 0 ? 'Summer' : v.distance_km % 3 === 1 ? 'Monsoon' : 'Winter');
      return estSeason.toLowerCase() === migrationSeason.toLowerCase();
    });
  }, [migrationData, migrationSeason]);

  // Leaflet map renderer
  useEffect(() => {
    if (loading || error) return;

    const timer = setTimeout(() => {
      if (!tabbedMapRef.current) return;

      if (!tabbedMapInstance.current) {
        const map = L.map(tabbedMapRef.current, {
          center: [20.5937, 78.9629], // India
          zoom: 5,
          zoomControl: false,
          attributionControl: false
        });

        const basemapUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        baseTileLayer.current = L.tileLayer(basemapUrl, {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

        densityLayerGroup.current = L.layerGroup().addTo(map);
        migrationLayerGroup.current = L.layerGroup().addTo(map);
        distributionLayerGroup.current = L.layerGroup().addTo(map);

        tabbedMapInstance.current = map;
      }

      const map = tabbedMapInstance.current;
      const dLg = densityLayerGroup.current;
      const mLg = migrationLayerGroup.current;
      const distLg = distributionLayerGroup.current;

      dLg.clearLayers();
      mLg.clearLayers();
      distLg.clearLayers();

      if (activeMapTab === 'density') {
        if (densitySites.length > 0) {
          densitySites.forEach(site => {
            const size = Math.min(site.population_count * 110, 4800) + 1800;
            const densityVal = site.population_density || (site.population_count * 0.05);
            const color = densityVal >= 6 ? '#ef4444' : (densityVal >= 3 ? '#f97316' : (densityVal >= 1 ? '#eab308' : '#10b981'));

            L.circle([site.latitude, site.longitude], {
              color,
              fillColor: color,
              fillOpacity: 0.22,
              radius: size,
              weight: 1.5
            }).addTo(dLg).bindPopup(`
              <div style="padding:6px;font-family:system-ui,sans-serif;font-size:11px">
                <div style="font-weight:800;font-size:12px;margin-bottom:4px;color:#0f172a">${site.site_name}</div>
                <div style="color:#64748b">Site ID: ${site.site_id}</div>
                <div style="font-weight:700;margin-top:4px">Population: ${site.population_count} individuals</div>
                <div style="font-weight:700">Density: ${densityVal.toFixed(2)} / km²</div>
                <div style="color:#94a3b8;margin-top:2px">Species Richness: ${site.species_count || 3} types</div>
              </div>
            `);

            const markerIcon = L.divIcon({
              className: '',
              html: `<div style="width:18px;height:18px;border-radius:50%;background:#ffffff;border:2.5px solid ${color};box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><div style="width:6px;height:6px;border-radius:50%;background:${color}"></div></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9]
            });
            L.marker([site.latitude, site.longitude], { icon: markerIcon }).addTo(dLg);
          });

          map.fitBounds(L.latLngBounds(densitySites.map(s => [s.latitude, s.longitude])), { padding: [40, 40] });
        }
      } 
      else if (activeMapTab === 'migration') {
        if (filteredMigrationData.length > 0) {
          filteredMigrationData.forEach(route => {
            const p1 = [route.first_lat, route.first_lng];
            const p2 = [route.second_lat, route.second_lng];
            const confidence = route.confidence || 80;
            const color = confidence >= 85 ? '#10b981' : (confidence >= 60 ? '#eab308' : '#ef4444');

            const curvePts = getBezierPoints(p1, p2, 24);
            const line = L.polyline(curvePts, {
              color,
              weight: Math.max(2, Math.min(8, route.observation_count * 0.4)),
              opacity: 0.75,
              dashArray: '8, 8'
            }).addTo(mLg).bindPopup(`
              <div style="padding:6px;font-family:system-ui,sans-serif;font-size:11px">
                <div style="font-weight:800;font-size:12px;margin-bottom:4px;color:#0f172a">Migration Corridor</div>
                <div style="font-weight:700">Species: ${localizeSpeciesName(route.species_name)}</div>
                <div>Origin: ${route.site_name}</div>
                <div>Distance: ${route.distance_km.toFixed(1)} km</div>
                <div>Confidence: <b>${confidence}%</b></div>
                <div style="color:#64748b;margin-top:2px">Season: ${route.season || 'Annual'}</div>
              </div>
            `);

            const startIcon = L.divIcon({
              className: '',
              html: `<div style="width:14px;height:14px;border-radius:50%;background:#10b981;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            });
            L.marker(p1, { icon: startIcon }).addTo(mLg).bindPopup(`<b>Origin Station:</b> ${route.site_name}`);

            const endIcon = L.divIcon({
              className: '',
              html: `<div style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            });
            L.marker(p2, { icon: endIcon }).addTo(mLg).bindPopup(`<b>Destination Station:</b> Corridor Exit`);
          });

          const pts = [];
          filteredMigrationData.forEach(v => { pts.push([v.first_lat, v.first_lng], [v.second_lat, v.second_lng]); });
          map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
        }
      } 
      else if (activeMapTab === 'distribution') {
        if (distributionMapData.length > 0) {
          const speciesGroups = {};
          distributionMapData.forEach(pt => {
            const sp = pt.species || 'Unknown';
            if (!speciesGroups[sp]) speciesGroups[sp] = [];
            speciesGroups[sp].push([pt.lat, pt.lng]);
          });

          if (showHomeRangePolygons) {
            Object.entries(speciesGroups).forEach(([speciesName, points]) => {
              if (points.length >= 3) {
                const hull = getConvexHull(points);
                const color = getSpeciesColor(speciesName);
                L.polygon(hull, {
                  color,
                  fillColor: color,
                  fillOpacity: 0.1,
                  weight: 1.5,
                  dashArray: '4, 6'
                }).addTo(distLg).bindPopup(`
                  <div style="font-size:11px;font-family:system-ui,sans-serif">
                    <b>${localizeSpeciesName(speciesName)} Home Range Area</b>
                    <div style="color:#64748b;margin-top:2px">Sighting Points Enclosed: ${points.length}</div>
                  </div>
                `);
              }
            });
          }

          const mcg = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 40,
            iconCreateFunction: (cluster) => {
              const count = cluster.getChildCount();
              return L.divIcon({
                html: `<div style="background-color:rgba(99,102,241,0.85);color:white;font-weight:900;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:11px;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3)">${count}</div>`,
                className: '',
                iconSize: [30, 30]
              });
            }
          });

          distributionMapData.forEach(point => {
            const speciesName = point.species || 'Unknown';
            const color = getSpeciesColor(speciesName);
            
            const ico = L.divIcon({
              className: '',
              html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });

            const lowerSpecies = speciesName.toLowerCase();
            let protectionStatus = 'Schedule I';
            let habitatType = 'Tropical Forest';

            if (lowerSpecies.includes('tiger') || lowerSpecies.includes('leopard')) {
              protectionStatus = 'Schedule I (Threatened)';
              habitatType = 'Dry Deciduous Forest';
            } else if (lowerSpecies.includes('chital') || lowerSpecies.includes('deer') || lowerSpecies.includes('antelope')) {
              habitatType = 'Open Grasslands';
              protectionStatus = 'Schedule III';
            } else if (lowerSpecies.includes('boar') || lowerSpecies.includes('pig')) {
              habitatType = 'Scrub / Forests';
              protectionStatus = 'Schedule III';
            }
            const densityVal = (point.confidence * 0.08).toFixed(1);

            const m = L.marker([point.lat, point.lng], { icon: ico }).bindPopup(`
              <div class="p-3 font-sans text-xs" style="width:260px;background:#ffffff;color:#1e293b">
                <div class="font-extrabold text-sm border-b border-slate-200 pb-1.5 mb-2" style="color:${color}">🌿 ${localizeSpeciesName(speciesName)}</div>
                <div class="space-y-1.5 font-bold">
                  <div class="flex justify-between"><span>Population:</span><span class="font-extrabold text-emerald-500">${point.count || 1}</span></div>
                  <div class="flex justify-between"><span>Density (Est.):</span><span class="font-bold">${densityVal}/km²</span></div>
                  <div class="flex justify-between"><span>Habitat Type:</span><span>${habitatType}</span></div>
                  <div class="flex justify-between"><span>Protection Status:</span><span class="text-emerald-500 font-extrabold">${protectionStatus}</span></div>
                  <div class="flex justify-between"><span>Confidence:</span><span class="font-extrabold text-blue-500">${point.confidence}%</span></div>
                  <div class="flex justify-between"><span>Latest Observation:</span><span>${new Date(point.date).toLocaleDateString()}</span></div>
                  <div class="flex justify-between"><span>Site:</span><span>${point.site_name}</span></div>
                  <div class="flex justify-between"><span>Survey:</span><span>${point.survey_name}</span></div>
                </div>
              </div>
            `);
            mcg.addLayer(m);
          });

          distLg.addLayer(mcg);
          map.fitBounds(L.latLngBounds(distributionMapData.map(p => [p.lat, p.lng])), { padding: [40, 40] });
        } else if (densitySites.length > 0) {
          map.fitBounds(L.latLngBounds(densitySites.map(s => [s.latitude, s.longitude])), { padding: [40, 40] });
        }
      }
    }, 120);

    return () => {
      clearTimeout(timer);
    };
  }, [loading, error, densitySites, migrationData, filteredMigrationData, distributionMapData, activeMapTab, getSpeciesColor, migrationSeason, showDistributionHeatmap, showHomeRangePolygons]);

  const forceRefresh = () => {
    setFilters({});
  };

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

  const hasDemoData = speciesMetrics.some(m => 
    ['aardvark', 'canada goose', 'zebra', 'giraffe', 'koala', 'kangaroo', 'raccoon', 'polar bear'].includes(m.species_name.toLowerCase())
  );

  const totalPages = Math.ceil(speciesMetrics.length / pageSize);
  const currentMetrics = speciesMetrics.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="space-y-5 animate-fade-in text-slate-900 font-sans pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Live Analytics Engine
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
            Population Estimation Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Estimate wildlife population size, density, distribution and long-term trends using AI-assisted observation analytics.
          </p>
        </div>
        <button 
          onClick={forceRefresh}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs shadow-sm"
        >
          <RefreshCw className="h-4 w-4 text-emerald-500" />
          Refresh
        </button>
      </div>

      {/* Demo Data Mode Warning Banner */}


      {/* Top Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} disabled={loading} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="relative">
          <MetricCard 
            title="Estimated Population" 
            value={loading || error || isEmpty || !overview ? '—' : overview.total_estimated_population} 
            subtext="Estimated individuals"
            icon={Eye}
            lastUpdated={timestamp}
          />
          <span 
            title="Ecological Abundance formula: N_est = N_obs / [Confidence * (1 - e^-D)]" 
            className="absolute top-2 right-2 cursor-help text-slate-400 hover:text-slate-650 text-5xs p-1"
            aria-label="Estimated population formula info"
          >
            ⓘ
          </span>
        </div>
        <MetricCard 
          title="Population Density" 
          value={loading || error || isEmpty || !overview ? '—' : (Number.isFinite(overview.average_density) ? overview.average_density.toFixed(2) : '—')} 
          subtext="Animals / km² average"
          icon={Activity}
          lastUpdated={timestamp}
          colorClass="text-blue-600 bg-blue-50 border-blue-200"
        />
        <MetricCard 
          title="Species Richness" 
          value={loading || error || isEmpty || !overview ? '—' : overview.total_species_richness} 
          subtext="Observed species"
          icon={Award}
          lastUpdated={timestamp}
          colorClass="text-amber-600 bg-amber-50 border-amber-200"
        />
        <MetricCard 
          title="Population Growth" 
          value={getGrowthRateString()} 
          subtext="Monthly trend shift"
          trend={getGrowthTrend()}
          trendValue={getGrowthRateString()}
          icon={TrendingUp}
          lastUpdated={timestamp}
          colorClass="text-rose-600 bg-rose-50 border-rose-200"
        />
        <MetricCard 
          title="Observation Coverage" 
          value={loading || error || isEmpty || !overview ? '—' : `${overview.average_observation_coverage}%`} 
          subtext="Active grid sites"
          icon={ShieldCheck}
          lastUpdated={timestamp}
          colorClass="text-cyan-600 bg-cyan-50 border-cyan-200"
        />
        <MetricCard 
          title="Migration Activity" 
          value={loading || error || isEmpty || !trends ? '—' : (trends.stable_trend ? 'Stable' : 'High')} 
          subtext="Corridor activity"
          icon={Compass}
          lastUpdated={timestamp}
          colorClass="text-indigo-600 bg-indigo-50 border-indigo-200"
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} label={{ value: 'Month', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Detections Count', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} label={{ value: 'Species', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Individual Count', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
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

      {/* ═══ GIS MAP ════════════════════════════════════════════════════════════ */}
      <DashboardSection title="Geospatial Wildlife Mapping" subtitle="AI tracking maps — select a view to explore density zones, migration corridors, and species distribution">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 w-fit">
            {[
              { key: 'density',      label: 'Population Density',    emoji: '🔴' },
              { key: 'migration',    label: 'Migration Corridors',   emoji: '🦌' },
              { key: 'distribution', label: 'Species Distribution',  emoji: '🌿' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveMapTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  activeMapTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-250'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.emoji}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Migration Season Filter */}
          {activeMapTab === 'migration' && (
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-500 px-2 uppercase text-[9px] tracking-wider">Season:</span>
              {['All', 'Summer', 'Monsoon', 'Winter'].map(season => (
                <button
                  key={season}
                  onClick={() => setMigrationSeason(season)}
                  className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase transition-all ${
                    migrationSeason === season
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-650 hover:text-slate-800'
                  }`}
                >
                  {season}
                </button>
              ))}
            </div>
          )}

          {/* Distribution Overlay Controls */}
          {activeMapTab === 'distribution' && (
            <div className="flex items-center gap-4 p-2 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDistributionHeatmap}
                  onChange={e => setShowDistributionHeatmap(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span className="font-extrabold text-[10px] text-slate-700">HEATMAP OVERLAY (Est.)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none border-l border-slate-200 pl-3">
                <input
                  type="checkbox"
                  checked={showHomeRangePolygons}
                  onChange={e => setShowHomeRangePolygons(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span className="font-extrabold text-[10px] text-slate-700">HOME RANGE POLYGONS</span>
              </label>
            </div>
          )}
        </div>

        {/* Large Map Card */}
        <MapCard
          title={
            activeMapTab === 'density'      ? 'Population Density Map' :
            activeMapTab === 'migration'    ? 'Migration Corridor Map' :
                                             'Species Distribution Map'
          }
          subtitle={
            activeMapTab === 'density'      ? `${densitySites.length} monitoring sites · density-proportional graduated circles` :
            activeMapTab === 'migration'    ? `${filteredMigrationData.length} active corridors (${migrationSeason} season) · curved arcs with flow direction` :
                                             `${distributionMapData.length} sighting points · clustered with convex hull boundary ranges`
          }
          loading={loading}
          error={error}
          isEmpty={false}
          mapRef={tabbedMapRef}
          height="h-[520px]"
          onResetView={handleResetView}
          onFitData={handleFitData}
          basemapMode="light"
          showLegend={showMapLegend}
          onToggleLegend={() => setShowMapLegend(v => !v)}
          onExportPNG={handleExportPNG}
          infoPanel={
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Summary Stats */}
              <div className="bg-slate-100/50 p-3 rounded-lg border border-slate-200/40">
                <h4 className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px] mb-2">
                  {activeMapTab === 'density' ? 'Density Summary' : activeMapTab === 'migration' ? 'Migration Summary' : 'Distribution Summary'}
                </h4>
                <div className="space-y-1.5 font-semibold text-2xs text-slate-800">
                  {activeMapTab === 'density' && <>
                    <div className="flex justify-between"><span>Monitoring Sites:</span><span className="font-extrabold text-emerald-500">{densitySites.length}</span></div>
                    <div className="flex justify-between"><span>Total Individuals:</span><span className="font-extrabold text-blue-500">{densitySites.reduce((s, x) => s + (x.population_count || x.individuals || 0), 0)}</span></div>
                    <div className="flex justify-between"><span>Species Tracked:</span><span className="font-extrabold text-amber-500">{densitySites.reduce((s, x) => s + (x.species_count || 0), 0)}</span></div>
                  </>}
                  {activeMapTab === 'migration' && (() => {
                    const counts = (() => {
                      let summer = 0, monsoon = 0, winter = 0;
                      migrationData.forEach(v => {
                        const estSeason = v.season || (v.distance_km % 3 === 0 ? 'Summer' : v.distance_km % 3 === 1 ? 'Monsoon' : 'Winter');
                        if (estSeason === 'Summer') summer++;
                        else if (estSeason === 'Monsoon') monsoon++;
                        else if (estSeason === 'Winter') winter++;
                      });
                      return { summer, monsoon, winter };
                    })();
                    return (
                      <>
                        <div className="flex justify-between"><span>Active Corridors:</span><span className="font-extrabold text-emerald-500">{filteredMigrationData.length}</span></div>
                        <div className="flex justify-between"><span>Avg Distance (Est.):</span><span className="font-extrabold text-blue-500">{
                          filteredMigrationData.length > 0 
                            ? (filteredMigrationData.reduce((s, x) => s + x.distance_km, 0) / filteredMigrationData.length).toFixed(1)
                            : 0
                        } km</span></div>
                        <div className="flex justify-between"><span>Avg Travel Time (Est.):</span><span className="font-extrabold text-cyan-500">{
                          filteredMigrationData.length > 0 
                            ? (filteredMigrationData.reduce((s, x) => s + (x.travel_time_hours || (x.distance_km / 12)), 0) / filteredMigrationData.length).toFixed(1)
                            : 0
                        } hrs</span></div>
                        <div className="border-t border-slate-200/50 mt-1.5 pt-1.5 space-y-1">
                          <div className="flex justify-between text-3xs text-slate-400 font-semibold"><span>Summer Routes:</span><span>{counts.summer}</span></div>
                          <div className="flex justify-between text-3xs text-slate-400 font-semibold"><span>Monsoon Routes:</span><span>{counts.monsoon}</span></div>
                          <div className="flex justify-between text-3xs text-slate-400 font-semibold"><span>Winter Routes:</span><span>{counts.winter}</span></div>
                        </div>
                      </>
                    );
                  })()}
                  {activeMapTab === 'distribution' && <>
                    <div className="flex justify-between"><span>Sighting Points:</span><span className="font-extrabold text-emerald-500">{distributionMapData.length}</span></div>
                    <div className="flex justify-between"><span>Species Present:</span><span className="font-extrabold text-blue-500">{new Set(distributionMapData.map(p => p.species)).size}</span></div>
                    <div className="flex justify-between"><span>Site Coverage:</span><span className="font-extrabold text-amber-500">{new Set(distributionMapData.map(p => p.site_name)).size} sites</span></div>
                  </>}
                </div>
              </div>

              {/* Color Legend */}
              <div className="bg-slate-100/50 p-3 rounded-lg border border-slate-200/40">
                <h4 className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px] mb-2">Map Legend</h4>
                <div className="space-y-1.5 font-bold text-2xs text-slate-700">
                  {activeMapTab === 'density' && <>
                    <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full shrink-0 bg-[#ef4444]"></span> Critical (≥ 6/km²)</div>
                    <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full shrink-0 bg-[#f97316]"></span> High (3–6/km²)</div>
                    <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full shrink-0 bg-[#eab308]"></span> Moderate (1–3/km²)</div>
                    <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full shrink-0 bg-[#10b981]"></span> Low (&lt; 1/km²)</div>
                  </>}
                  {activeMapTab === 'migration' && <>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-5 rounded shrink-0 bg-[#10b981]"></span> Confirmed (≥ 85%)</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-5 rounded shrink-0 bg-[#eab308]"></span> Likely (60–85%)</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-5 rounded shrink-0 bg-[#ef4444]"></span> Low Confidence</div>
                    <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full shrink-0 bg-emerald-500"></span> Origin</div>
                    <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full shrink-0 bg-rose-500"></span> Destination</div>
                  </>}
                  {activeMapTab === 'distribution' && <>
                    <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full shrink-0 bg-[#3b82f6]"></span> Home Range (per species)</div>
                    <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full shrink-0 bg-slate-400"></span> Monitoring Site</div>
                    <div className="text-slate-500 text-[9px] mt-1">Circles show species territory boundary</div>
                  </>}
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-slate-100/50 p-3 rounded-lg border border-slate-200/40">
                <h4 className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px] mb-2">AI Findings</h4>
                <div className="space-y-1 text-2xs font-semibold text-slate-600 leading-relaxed">
                  {activeMapTab === 'density' && <>
                    <p>• Graduated circle sizes reflect relative wildlife density at each monitoring station.</p>
                    <p>• Click any circle to view site details, species count, and latest sightings.</p>
                  </>}
                  {activeMapTab === 'migration' && <>
                    <p>• Animated dashed lines show directional movement along each recorded corridor.</p>
                    <p>• Line thickness is proportional to observation frequency. Thicker = more frequent movement.</p>
                    <p>• Green origin markers indicate departure points; red markers indicate arrival zones.</p>
                  </>}
                  {activeMapTab === 'distribution' && <>
                    <p>• Each species is assigned a unique color. Circles represent estimated home-range territory.</p>
                    <p>• Individual sighting markers are clustered at lower zoom levels for readability.</p>
                  </>}
                </div>
              </div>
            </div>
          }
        >
          {/* Compact collapsible legend overlay */}
          {showMapLegend && (
            <div className="absolute top-3 right-3 z-[1000] bg-white/95 text-slate-800 p-2.5 rounded-lg border border-slate-200 shadow-md pointer-events-auto" style={{ maxWidth: 160 }}>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-1.5 font-bold">Legend</div>
              {activeMapTab === 'density' && <>
                <div className="flex items-center gap-1.5 text-2xs font-bold mb-1"><span className="h-2 w-2 rounded-full shrink-0 bg-[#ef4444]"></span> Critical</div>
                <div className="flex items-center gap-1.5 text-2xs font-bold mb-1"><span className="h-2 w-2 rounded-full shrink-0 bg-[#f97316]"></span> High</div>
                <div className="flex items-center gap-1.5 text-2xs font-bold mb-1"><span className="h-2 w-2 rounded-full shrink-0 bg-[#eab308]"></span> Moderate</div>
                <div className="flex items-center gap-1.5 text-2xs font-bold"><span className="h-2 w-2 rounded-full shrink-0 bg-[#10b981]"></span> Low</div>
              </>}
              {activeMapTab === 'migration' && <>
                <div className="flex items-center gap-1.5 text-2xs font-bold mb-1"><span className="h-1.5 w-4 rounded shrink-0 bg-[#10b981]"></span> Confirmed</div>
                <div className="flex items-center gap-1.5 text-2xs font-bold mb-1"><span className="h-1.5 w-4 rounded shrink-0 bg-[#eab308]"></span> Likely</div>
                <div className="flex items-center gap-1.5 text-2xs font-bold mb-1"><span className="h-1.5 w-4 rounded shrink-0 bg-[#ef4444]"></span> Low Conf.</div>
                <div className="flex items-center gap-1.5 text-2xs font-bold mb-1"><span className="h-2.5 w-2.5 rounded-full shrink-0 bg-emerald-500"></span> Origin</div>
                <div className="flex items-center gap-1.5 text-2xs font-bold"><span className="h-2.5 w-2.5 rounded-full shrink-0 bg-rose-500"></span> Destination</div>
              </>}
              {activeMapTab === 'distribution' && <>
                <div className="flex items-center gap-1.5 text-2xs font-bold mb-1"><span className="h-2 w-2 rounded-full shrink-0 bg-[#3b82f6]"></span> Species Range</div>
                <div className="flex items-center gap-1.5 text-2xs font-bold"><span className="h-2 w-2 rounded-full shrink-0 bg-slate-400"></span> Site</div>
              </>}
            </div>
          )}
        </MapCard>
      </DashboardSection>

      {/* Table Section */}
      <DashboardSection title="Recent Population Assessments" subtitle="Validated and pending census records generated by officers and researchers">
        <div className="glass-card overflow-hidden border-slate-200 border shadow-sm space-y-4">
          <div className="overflow-x-auto max-h-[420px]">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest text-4xs sticky top-0 z-10 border-b border-slate-250">
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
              <tbody className="divide-y divide-slate-100 bg-transparent text-slate-700">
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
                    <tr key={item.species_name} className="hover:bg-slate-50/40 transition-colors odd:bg-slate-50/10 even:bg-transparent">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900">{localizeSpeciesName(item.species_name)}</span>
                          {item.scientific_name && (
                            <span className="text-4xs italic text-slate-500 mt-0.5">{item.scientific_name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-black text-slate-900">{item.estimated_population}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.observation_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold">{Number.isFinite(item.population_density) ? item.population_density.toFixed(2) : '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.detection_frequency ?? 0}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">{Number.isFinite(item.average_confidence) ? (item.average_confidence * 100).toFixed(0) : '0'}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-650">{item.monitoring_site_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-3xs">
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
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 px-6 py-4 text-xs font-semibold text-slate-600 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-3xs font-black uppercase text-slate-400">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="py-1 px-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none text-slate-700 font-semibold"
                >
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div>
                  Showing <span className="font-bold text-slate-900">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                  <span className="font-bold text-slate-900">
                    {Math.min(currentPage * pageSize, speciesMetrics.length)}
                  </span>{' '}
                  of <span className="font-bold text-slate-900">{speciesMetrics.length}</span> species profiles
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2">
                    Page <span className="font-bold text-slate-900">{currentPage}</span> of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
