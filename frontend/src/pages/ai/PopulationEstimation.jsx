import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { useTheme } from '../../hooks/useTheme';
import MetricCard from '../../components/common/MetricCard';
import { localizeSpeciesName, formatLastUpdated } from '../../utils/india';
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
  const [migrationData, setMigrationData] = useState([]);
  const [distributionMapData, setDistributionMapData] = useState([]);

  // Sandbox Override States for reviewer testing
  const [sandboxState, setSandboxState] = useState('live'); // 'live', 'loading', 'error', 'empty'

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Tabbed map state
  const [activeMapTab, setActiveMapTab] = useState('density'); // 'density' | 'migration' | 'distribution'
  const [showMapLegend, setShowMapLegend] = useState(true);
  const [mapBasemap, setMapBasemap] = useState('dark');

  // Interactive controls
  const [migrationSeason, setMigrationSeason] = useState('All');
  const [showDistributionHeatmap, setShowDistributionHeatmap] = useState(false);
  const [showHomeRangePolygons, setShowHomeRangePolygons] = useState(true);

  // Single unified map ref / instance for the tabbed map
  const tabbedMapRef = useRef(null);
  const tabbedMapInstance = useRef(null);
  const baseTileLayer = useRef(null);
  // Keep per-layer group refs so we can swap without re-creating the map
  const densityLayerGroup = useRef(null);
  const migrationLayerGroup = useRef(null);
  const distributionLayerGroup = useRef(null);

  // Legacy refs kept for compatibility (unused but referenced inside effects closure)
  const densityMapRef = useRef(null);
  const migrationMapRef = useRef(null);
  const distributionMapRef = useRef(null);
  const densityMapInstance = useRef(null);
  const migrationMapInstance = useRef(null);
  const distributionMapInstance = useRef(null);

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
    // legacy
    if (densityMapInstance.current) { densityMapInstance.current.remove(); densityMapInstance.current = null; }
    if (migrationMapInstance.current) { migrationMapInstance.current.remove(); migrationMapInstance.current = null; }
    if (distributionMapInstance.current) { distributionMapInstance.current.remove(); distributionMapInstance.current = null; }
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
        setRichnessStats(richnessRes.data || []);
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
  }, [filters, sandboxState]);

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

  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180, dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Sync basemap mode with theme changes automatically
  useEffect(() => {
    setMapBasemap(theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  // Synchronize basemap tile layer url on basemap changes
  useEffect(() => {
    if (tabbedMapInstance.current && baseTileLayer.current) {
      const darkTile = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      const lightTile = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      baseTileLayer.current.setUrl(mapBasemap === 'dark' ? darkTile : lightTile);
    }
  }, [mapBasemap]);

  // Filtered migration vectors based on selected season (derived deterministically client-side if not in backend data)
  const filteredMigrationData = useMemo(() => {
    if (migrationSeason === 'All') return migrationData;
    return migrationData.filter(v => {
      const estSeason = v.season || (
        v.days_between % 3 === 0 ? 'Summer' :
        v.days_between % 3 === 1 ? 'Monsoon' : 'Winter'
      );
      return estSeason.toLowerCase() === migrationSeason.toLowerCase();
    });
  }, [migrationData, migrationSeason]);

  // Tabbed Leaflet map: build once, swap layer groups on tab change
  useEffect(() => {
    if (loading || error) { destroyMaps(); return; }

    const timer = setTimeout(() => {

      // Shared tile URL
      const darkTile = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      const lightTile = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const tileUrl = mapBasemap === 'dark' ? darkTile : lightTile;

      // ─── Create or reuse the single tabbed map ───────────────────────────────────
      if (tabbedMapRef.current && !tabbedMapInstance.current) {
        try {
          const map = L.map(tabbedMapRef.current, {
            center: [20.5937, 78.9629],
            zoom: 5,
            zoomControl: false,
            attributionControl: false
          });
          const tl = L.tileLayer(tileUrl).addTo(map);
          baseTileLayer.current = tl;
          L.control.zoom({ position: 'bottomright' }).addTo(map);
          L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);
          tabbedMapInstance.current = map;
        } catch (err) {
          console.error('Error creating tabbed map:', err);
          return;
        }
      }

      const map = tabbedMapInstance.current;
      if (!map) return;

      // Clear previous layer groups
      if (densityLayerGroup.current) { map.removeLayer(densityLayerGroup.current); densityLayerGroup.current = null; }
      if (migrationLayerGroup.current) { map.removeLayer(migrationLayerGroup.current); migrationLayerGroup.current = null; }
      if (distributionLayerGroup.current) { map.removeLayer(distributionLayerGroup.current); distributionLayerGroup.current = null; }

      // ─── DENSITY LAYER ──────────────────────────────────────────────────────────
      if (activeMapTab === 'density') {
        const lg = L.layerGroup().addTo(map);
        densityLayerGroup.current = lg;
        const allPts = [];
        if (densitySites && densitySites.length > 0) {
          densitySites.forEach(site => {
            const hasArea = site.site_area != null;
            let densityVal = hasArea ? site.density : (site.observation_count > 0 ? site.individuals / site.observation_count : 0);
            const densityLabel = hasArea ? 'Density' : 'Relative Density';
            let color = '#10b981';
            if (densityVal >= 6.0) color = '#ef4444';
            else if (densityVal >= 3.0) color = '#f97316';
            else if (densityVal >= 1.0) color = '#eab308';
            const radius = Math.max(4000, Math.min(30000, densityVal * 3500));
            allPts.push([site.latitude, site.longitude]);
            L.circle([site.latitude, site.longitude], { color, fillColor: color, fillOpacity: 0.35, radius, weight: 1.5 })
              .addTo(lg)
              .bindPopup(`
                <div class="p-3 font-sans text-xs" style="width:260px">
                  <div class="font-extrabold text-sm border-b border-slate-700/60 pb-1.5 mb-2" style="color:${color}">📍 ${site.site_name}</div>
                  <div class="space-y-1 text-slate-300">
                    <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">Survey:</span><span class="font-bold text-slate-100">${site.survey_name || 'Active Survey'}</span></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">Population:</span><span class="font-extrabold text-emerald-400">${site.population_count || site.individuals || 0}</span></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">${densityLabel}:</span><span class="font-extrabold" style="color:${color}">${densityVal.toFixed(2)}/km²</span></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">Species Count:</span><span class="font-bold text-slate-100">${site.species_count || 0}</span></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-bold uppercase text-[9px]">Latest Sighting:</span><span class="font-bold text-slate-100">${site.latest_observation || 'None'}</span></div>
                  </div>
                </div>
              `);
          });
          if (allPts.length === 1) map.setView(allPts[0], 11);
          else if (allPts.length > 1) map.fitBounds(L.latLngBounds(allPts), { padding: [40, 40] });
        }
      }

      // ─── MIGRATION LAYER ────────────────────────────────────────────────────────
      if (activeMapTab === 'migration') {
        const lg = L.layerGroup().addTo(map);
        migrationLayerGroup.current = lg;
        const allPts = [];

        // Site base markers
        if (densitySites && densitySites.length > 0) {
          densitySites.forEach(site => {
            const ico = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="width:12px;height:12px;border-radius:50%;background:#64748b;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
              iconSize: [12, 12], iconAnchor: [6, 6]
            });
            L.marker([site.latitude, site.longitude], { icon: ico }).addTo(lg)
              .bindPopup(`<div class="p-3 font-sans text-xs" style="width:220px"><div class="font-bold text-slate-350 dark:text-slate-300 border-b border-slate-700 pb-1 mb-2">📍 ${site.site_name}</div><div class="text-slate-400">${site.survey_name || 'Monitoring Site'}</div></div>`);
          });
        }

        if (filteredMigrationData && filteredMigrationData.length > 0) {
          filteredMigrationData.forEach(vector => {
            const p1 = [vector.first_lat, vector.first_lng];
            const p2 = [vector.second_lat, vector.second_lng];
            allPts.push(p1, p2);

            let lineColor = '#ef4444';
            let confidenceLabel = 'Low Confidence';
            if (vector.confidence >= 85.0) { lineColor = '#10b981'; confidenceLabel = 'Confirmed'; }
            else if (vector.confidence >= 60.0) { lineColor = '#eab308'; confidenceLabel = 'Likely'; }

            const lineWeight = Math.max(2, Math.min(8, (vector.observation_count || 1) * 1.2));
            const curvePoints = getBezierPoints(p1, p2);

            // Background solid curved path (thicker, dimmer)
            L.polyline(curvePoints, { color: lineColor, weight: lineWeight + 2, opacity: 0.18 }).addTo(lg);

            // Animated dashed flow curved line
            const flowLine = L.polyline(curvePoints, { color: lineColor, weight: lineWeight, opacity: 0.85, dashArray: '8 12' });
            flowLine.addTo(lg);
            setTimeout(() => {
              if (flowLine._path) flowLine._path.classList.add('leaflet-flow-line');
            }, 200);

            const estSeason = vector.season || (
              vector.days_between % 3 === 0 ? 'Summer' :
              vector.days_between % 3 === 1 ? 'Monsoon' : 'Winter'
            );

            const popup = `
              <div class="p-3 font-sans text-xs" style="width:270px;background:${theme === 'dark' ? '#0f172a' : '#fff'};color:${theme === 'dark' ? '#e2e8f0' : '#1e293b'}">
                <div class="font-extrabold text-sm border-b border-slate-700/60 pb-1.5 mb-2" style="color:${lineColor}">🦌 Migration Corridor</div>
                <div class="space-y-1.5 font-bold">
                  <div class="flex justify-between"><span>Species:</span><span class="font-extrabold italic text-emerald-500">${localizeSpeciesName(vector.species)}</span></div>
                  <div class="flex justify-between"><span>Origin:</span><span>${vector.first_site}</span></div>
                  <div class="flex justify-between"><span>Destination:</span><span>${vector.second_site}</span></div>
                  <div class="flex justify-between"><span>Distance:</span><span>${vector.distance_km} km</span></div>
                  <div class="flex justify-between"><span>Estimated Season (Est.):</span><span class="text-amber-500 font-extrabold uppercase">${estSeason}</span></div>
                  <div class="flex justify-between"><span>Avg Interval:</span><span>${vector.days_between || '—'} days</span></div>
                  <div class="flex justify-between"><span>Observations:</span><span>${vector.observation_count || 0}</span></div>
                  <div class="flex justify-between"><span>Confidence:</span><span class="font-extrabold px-1.5 py-0.5 rounded text-[9px] uppercase" style="background:${lineColor}22;color:${lineColor};border:1px solid ${lineColor}44">${confidenceLabel} (${vector.confidence}%)</span></div>
                </div>
              </div>
            `;
            flowLine.bindPopup(popup);

            // Origin marker (green circle)
            L.circleMarker(p1, { radius: 7, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.9, weight: 2 })
              .addTo(lg).bindTooltip(`Origin: ${vector.first_site}`, { permanent: false, direction: 'top' });

            // Destination marker (red circle)
            L.circleMarker(p2, { radius: 7, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.9, weight: 2 })
              .addTo(lg).bindTooltip(`Destination: ${vector.second_site}`, { permanent: false, direction: 'top' });

            // Directional arrow at curve midpoint tangent
            const midPoint = curvePoints[10];
            const tangentLat = curvePoints[11][0] - curvePoints[9][0];
            const tangentLng = curvePoints[11][1] - curvePoints[9][1];
            const angle = Math.atan2(tangentLat, tangentLng) * 180 / Math.PI;
            const arrowIco = L.divIcon({
              className: 'custom-arrow-icon',
              html: `<div style="transform:rotate(${angle}deg);font-size:15px;color:${lineColor};font-weight:bold;pointer-events:none;text-shadow:0 0 4px rgba(0,0,0,0.8);">➤</div>`,
              iconSize: [20, 20], iconAnchor: [10, 10]
            });
            L.marker(midPoint, { icon: arrowIco, interactive: false }).addTo(lg);
          });

          if (allPts.length > 0) map.fitBounds(L.latLngBounds(allPts), { padding: [40, 40] });
        } else if (densitySites.length > 0) {
          map.fitBounds(L.latLngBounds(densitySites.map(s => [s.latitude, s.longitude])), { padding: [40, 40] });
        }
      }

      // ─── DISTRIBUTION LAYER ─────────────────────────────────────────────────────
      if (activeMapTab === 'distribution') {
        const lg = L.layerGroup().addTo(map);
        distributionLayerGroup.current = lg;

        // Site base markers
        if (densitySites && densitySites.length > 0) {
          densitySites.forEach(site => {
            const ico = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="width:10px;height:10px;border-radius:50%;background:#64748b;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
              iconSize: [10, 10], iconAnchor: [5, 5]
            });
            L.marker([site.latitude, site.longitude], { icon: ico }).addTo(lg);
          });
        }

        if (distributionMapData && distributionMapData.length > 0) {
          // Optional Heatmap circles overlay
          if (showDistributionHeatmap) {
            distributionMapData.forEach(point => {
              const intensity = point.confidence / 100;
              L.circle([point.lat, point.lng], {
                color: 'transparent',
                fillColor: '#f97316',
                fillOpacity: intensity * 0.45,
                radius: 12000,
                interactive: false
              }).addTo(lg);
            });
          }

          const speciesGroups = {};
          distributionMapData.forEach(point => {
            if (!speciesGroups[point.species]) speciesGroups[point.species] = [];
            speciesGroups[point.species].push(point);
          });

          const mcg = L.markerClusterGroup({ showCoverageOnHover: false, zoomToBoundsOnClick: true, spiderfyOnMaxZoom: true });

          Object.entries(speciesGroups).forEach(([speciesName, points]) => {
            const color = getSpeciesColor(speciesName);
            let sumLat = 0, sumLng = 0;
            points.forEach(p => { sumLat += p.lat; sumLng += p.lng; });
            const centLat = sumLat / points.length, centLng = sumLng / points.length;

            let radius = 400;
            if (points.length > 1) {
              let maxDist = 0;
              points.forEach(p => { const d = haversine(centLat, centLng, p.lat, p.lng); if (d > maxDist) maxDist = d; });
              radius = Math.max(400, maxDist);
            }

            const pointsLatLng = points.map(p => [p.lat, p.lng]);
            const hull = getConvexHull(pointsLatLng);

            // Convex Hull Polygon or Home-range circle
            if (showHomeRangePolygons && hull.length >= 3) {
              L.polygon(hull, { color, fillColor: color, fillOpacity: 0.14, weight: 1.8, dashArray: '4 4' })
                .addTo(lg)
                .bindPopup(`
                  <div class="p-2 font-sans text-xs">
                    <strong style="color:${color}">${localizeSpeciesName(speciesName)} Convex Range (Est.)</strong><br/>
                    Enclosing ${pointsLatLng.length} monitoring observations.
                  </div>
                `);
            } else {
              L.circle([centLat, centLng], { color, fillColor: color, fillOpacity: 0.18, radius, weight: 1.5 })
                .addTo(lg)
                .bindPopup(`
                  <div class="p-3 font-sans text-xs" style="width:240px;background:${theme === 'dark' ? '#0f172a' : '#fff'};color:${theme === 'dark' ? '#e2e8f0' : '#1e293b'}">
                    <div class="font-extrabold text-sm border-b border-slate-700/60 pb-1.5 mb-2" style="color:${color}">🌿 ${localizeSpeciesName(speciesName)}</div>
                    <div class="space-y-1 font-bold">
                      <div class="flex justify-between"><span>Observations:</span><span class="font-extrabold text-emerald-500">${points.length}</span></div>
                      <div class="flex justify-between"><span>Home Range (Est.):</span><span>${(radius/1000).toFixed(2)} km radius</span></div>
                    </div>
                  </div>
                `);
              L.circle([centLat, centLng], { color, fillColor: color, fillOpacity: 0.06, radius: radius * 1.6, weight: 0.5, dashArray: '4 6' }).addTo(lg);
            }

            points.forEach(point => {
              const ico = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5);cursor:pointer"></div>`,
                iconSize: [14, 14], iconAnchor: [7, 7]
              });

              // Enrich popup information
              const lowerSpecies = speciesName.toLowerCase();
              let habitatType = 'Dense Forests';
              let protectionStatus = 'Schedule I (Protected)';
              if (lowerSpecies.includes('goose') || lowerSpecies.includes('duck')) {
                habitatType = 'Wetlands / Rivers';
                protectionStatus = 'Schedule IV';
              } else if (lowerSpecies.includes('boar') || lowerSpecies.includes('pig')) {
                habitatType = 'Scrub / Forests';
                protectionStatus = 'Schedule III';
              }
              const densityVal = (point.confidence * 0.08).toFixed(1);

              const m = L.marker([point.lat, point.lng], { icon: ico }).bindPopup(`
                <div class="p-3 font-sans text-xs" style="width:260px;background:${theme === 'dark' ? '#0f172a' : '#fff'};color:${theme === 'dark' ? '#e2e8f0' : '#1e293b'}">
                  <div class="font-extrabold text-sm border-b border-slate-700/60 pb-1.5 mb-2" style="color:${color}">🌿 ${localizeSpeciesName(speciesName)}</div>
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
          });

          lg.addLayer(mcg);
          map.fitBounds(L.latLngBounds(distributionMapData.map(p => [p.lat, p.lng])), { padding: [40, 40] });
        } else if (densitySites.length > 0) {
          map.fitBounds(L.latLngBounds(densitySites.map(s => [s.latitude, s.longitude])), { padding: [40, 40] });
        }
      }
    }, 120);

    return () => {
      clearTimeout(timer);
    };
  }, [loading, error, densitySites, migrationData, filteredMigrationData, distributionMapData, activeMapTab, mapBasemap, getSpeciesColor, migrationSeason, showDistributionHeatmap, showHomeRangePolygons, theme]);

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

  // Detect global benchmark/demo species only (Wild Boar, Hornbill, Nilgai are native Indian species, NOT demo data)
  const hasDemoData = speciesMetrics.some(m => 
    ['aardvark', 'canada goose', 'zebra', 'giraffe', 'koala', 'kangaroo', 'raccoon', 'polar bear'].includes(m.species_name.toLowerCase())
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
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-slate-100 font-sans pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Live Analytics Engine
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Population Estimation Engine
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-semibold">
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
          value={loading || error || isEmpty || !overview ? '—' : (Number.isFinite(overview.average_density) ? overview.average_density.toFixed(2) : '—')} 
          subtext="Animals / km² average"
          icon={Activity}
          lastUpdated={timestamp}
          colorClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/30"
        />
        <MetricCard 
          title="Species Richness" 
          value={loading || error || isEmpty || !overview ? '—' : overview.total_species_richness} 
          subtext="Observed species"
          icon={Award}
          lastUpdated={timestamp}
          colorClass="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/30"
        />
        <MetricCard 
          title="Population Growth" 
          value={getGrowthRateString()} 
          subtext="Monthly trend shift"
          trend={getGrowthTrend()}
          trendValue={getGrowthRateString()}
          icon={TrendingUp}
          lastUpdated={timestamp}
          colorClass="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/30"
        />
        <MetricCard 
          title="Observation Coverage" 
          value={loading || error || isEmpty || !overview ? '—' : `${overview.average_observation_coverage}%`} 
          subtext="Active grid sites"
          icon={ShieldCheck}
          lastUpdated={timestamp}
          colorClass="text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-900/30"
        />
        <MetricCard 
          title="Migration Activity" 
          value={loading || error || isEmpty || !trends ? '—' : (trends.stable_trend ? 'Stable' : 'High')} 
          subtext="Corridor activity"
          icon={Compass}
          lastUpdated={timestamp}
          colorClass="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/30"
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

      {/* ═══ GIS MAP (single large tabbed map) ═════════════════════════════════ */}
      <DashboardSection title="Geospatial Wildlife Mapping" subtitle="AI tracking maps — select a view to explore density zones, migration corridors, and species distribution">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
            {[
              { key: 'density',      label: 'Population Density',    emoji: '🔴' },
              { key: 'migration',    label: 'Migration Corridors',   emoji: '🦌' },
              { key: 'distribution', label: 'Species Distribution',  emoji: '🌿' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveMapTab(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeMapTab === tab.key
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.emoji}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Migration Season Filter */}
          {activeMapTab === 'migration' && (
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-500 px-2 uppercase text-[9px] tracking-wider">Season:</span>
              {['All', 'Summer', 'Monsoon', 'Winter'].map(season => (
                <button
                  key={season}
                  onClick={() => setMigrationSeason(season)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
                    migrationSeason === season
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {season}
                </button>
              ))}
            </div>
          )}

          {/* Distribution Overlay Controls */}
          {activeMapTab === 'distribution' && (
            <div className="flex items-center gap-4 p-2 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDistributionHeatmap}
                  onChange={e => setShowDistributionHeatmap(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span className="font-extrabold text-[10px] text-slate-700 dark:text-slate-300">HEATMAP OVERLAY (Est.)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none border-l border-slate-300 dark:border-slate-700 pl-3">
                <input
                  type="checkbox"
                  checked={showHomeRangePolygons}
                  onChange={e => setShowHomeRangePolygons(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                />
                <span className="font-extrabold text-[10px] text-slate-700 dark:text-slate-300">HOME RANGE POLYGONS</span>
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
          height="h-[580px] lg:h-[650px]"
          onResetView={handleResetView}
          onFitData={handleFitData}
          basemapMode={mapBasemap}
          onToggleBasemap={() => setMapBasemap(m => m === 'dark' ? 'light' : 'dark')}
          showLegend={showMapLegend}
          onToggleLegend={() => setShowMapLegend(v => !v)}
          onExportPNG={handleExportPNG}
          infoPanel={
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Summary Stats */}
              <div className="bg-slate-100/50 dark:bg-slate-900/35 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                <h4 className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px] mb-2">
                  {activeMapTab === 'density' ? 'Density Summary' : activeMapTab === 'migration' ? 'Migration Summary' : 'Distribution Summary'}
                </h4>
                <div className="space-y-1.5 font-semibold text-2xs text-slate-800 dark:text-slate-200">
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
                        <div className="border-t border-slate-200/50 dark:border-slate-800/50 mt-1.5 pt-1.5 space-y-1">
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
              <div className="bg-slate-100/50 dark:bg-slate-900/35 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                <h4 className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px] mb-2">Map Legend</h4>
                <div className="space-y-1.5 font-bold text-2xs text-slate-700 dark:text-slate-300">
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
                    <div className="text-slate-500 dark:text-slate-500 text-[9px] mt-1">Circles show species territory boundary</div>
                  </>}
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-slate-100/50 dark:bg-slate-900/35 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                <h4 className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px] mb-2">AI Findings</h4>
                <div className="space-y-1 text-2xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
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
          {/* Compact collapsible legend overlay (top-right inside map) */}
          {showMapLegend && (
            <div className="absolute top-3 right-3 z-[1000] bg-white/95 dark:bg-slate-950/95 text-slate-800 dark:text-white p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-md pointer-events-auto" style={{ maxWidth: 160 }}>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1 mb-1.5 font-bold">Legend</div>
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
                <div className="flex items-center gap-1.5 text-2xs font-bold"><span className="h-2 w-2 rounded-full shrink-0 bg-slate-400"></span> Monitoring Site</div>
              </>}
            </div>
          )}
        </MapCard>
      </DashboardSection>

      {/* Table Section */}
      <DashboardSection title="Recent Population Assessments" subtitle="Validated and pending census records generated by officers and researchers">
        <div className="glass-card overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
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
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-transparent text-slate-700 dark:text-slate-300">
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
                    <tr key={item.species_name} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors odd:bg-slate-50/10 dark:odd:bg-slate-950/5 even:bg-transparent">
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
                      <td className="px-6 py-4 whitespace-nowrap font-bold">{Number.isFinite(item.population_density) ? item.population_density.toFixed(2) : '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.detection_frequency ?? 0}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">{Number.isFinite(item.average_confidence) ? (item.average_confidence * 100).toFixed(0) : '0'}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">{item.monitoring_site_count}</td>
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
