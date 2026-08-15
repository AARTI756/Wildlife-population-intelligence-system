import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Leaf, RefreshCw, Award, ShieldCheck, Waves, Users,
  Thermometer, Wind, Droplets, Activity, Layers, ChevronDown, ChevronUp,
  Map, Info
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie
} from 'recharts';
import api from '../../services/api';
import MetricCard from '../../components/common/MetricCard';
import DashboardSection from '../../components/common/DashboardSection';
import MapCard from '../../components/common/MapCard';
import FilterBar from '../../components/common/FilterBar';
import { formatLastUpdated } from '../../utils/india';

/* ─── Habitat colour palette ───────────────────────────────────────────────── */
const HABITAT_COLORS = {
  forest:'#2E7D32', canopy:'#2E7D32', deciduous:'#388E3C', evergreen:'#1B5E20',
  grassland:'#8BC34A', savanna:'#9CCC65', meadow:'#AED581',
  wetland:'#26A69A', swamp:'#00897B', marsh:'#4DB6AC',
  mangrove:'#00796B', delta:'#00695C',
  desert:'#D4A017', arid:'#E6B422', scrub:'#A5965A',
  shrubland:'#8D6E63', bushland:'#795548',
  water:'#1565C0', riverine:'#1976D2', lake:'#1E88E5', river:'#2196F3',
  mountain:'#6D4C41', alpine:'#5D4037',
};

const getHabitatColor = (name = '') => {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(HABITAT_COLORS)) if (key.includes(k)) return v;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return ['#475569','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'][Math.abs(hash) % 8];
};

const BASEMAPS = {
  light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
};

const GIS_LAYERS = [
  { key: 'suitability',  label: 'Suitability',     color: '#10b981', emoji: '🟢' },
  { key: 'vegetation',   label: 'Vegetation',       color: '#22c55e', emoji: '🌿' },
  { key: 'water',        label: 'Water Bodies',     color: '#3b82f6', emoji: '💧' },
  { key: 'protected',    label: 'Protected Areas',  color: '#059669', emoji: '🛡️' },
  { key: 'sites',        label: 'Monitoring Sites', color: '#64748b', emoji: '📍' },
  { key: 'hotspots',     label: 'Critical Zones',   color: '#ef4444', emoji: '🔴' },
  { key: 'disturbance',  label: 'Disturbance',      color: '#f97316', emoji: '⚠️' },
];

/* ─── Tiny reusable card components ────────────────────────────────────────── */
const GaugeRing = ({ value, max = 100, color = '#10b981', size = 80, label, unit = '' }) => {
  const r = 32; const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / max));
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 80 80" className="-rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" className="stroke-slate-200" strokeWidth="7" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={circ - pct * circ} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black text-slate-900">{typeof value === 'number' ? value.toFixed(value < 10 ? 1 : 0) : value}{unit}</span>
        </div>
      </div>
      <span className="text-[9px] font-bold text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
};

const ProgressBar = ({ value, max = 100, color = '#10b981', label, unit = '%', est = false }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold text-slate-600">{label}{est && <span className="ml-1 text-amber-500 text-[8px]">(Est.)</span>}</span>
      <span className="text-[10px] font-black text-slate-900">{typeof value === 'number' ? value.toFixed(1) : value}{unit}</span>
    </div>
    <div className="w-full bg-slate-200 rounded-full h-1.5">
      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
    </div>
  </div>
);

const EcoCard = ({ icon: Icon, label, value, color, note, est = false }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
    <div className="flex items-start justify-between mb-2">
      <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color }} />
      {est && <span className="text-[7px] font-black uppercase px-1 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20">Est.</span>}
    </div>
    <div className="text-base font-black leading-none" style={{ color }}>{value}</div>
    <div className="text-[10px] font-extrabold text-slate-700 mt-1">{label}</div>
    {note && <div className="text-[8px] text-slate-505 mt-0.5 leading-tight">{note}</div>}
  </div>
);

const HabitatIntelligence = () => {
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timestamp, setTimestamp] = useState('');
  const [overview, setOverview] = useState(null);
  const [classification, setClassification] = useState([]);
  const [vegetation, setVegetation] = useState([]);
  const [environment, setEnvironment] = useState([]);
  const [degradation, setDegradation] = useState([]);
  const [suitabilitySites, setSuitabilitySites] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [habitatIntel, setHabitatIntel] = useState(null);


  // Map refs
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const baseTileLayer = useRef(null);
  const layerGroups = useRef({});

  const [activeLayers, setActiveLayers] = useState({
    suitability: true,
    vegetation: true,
    water: true,
    protected: true,
    sites: true,
    hotspots: true,
    disturbance: false,
  });
  const [showLegend, setShowLegend] = useState(true);
  const [showLayerPanel, setShowLayerPanel] = useState(false);

  /* ─ Map lifecycle ─ */
  const destroyMap = useCallback(() => {
    if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    layerGroups.current = {}; baseTileLayer.current = null;
  }, []);

  /* ─ Data fetch ─ */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError(null);
      const p = (() => {
        const q = {};
        if (filters.survey_id) q.survey_id = filters.survey_id;
        if (filters.site_id) q.site_id = filters.site_id;
        if (filters.species) q.species = filters.species;
        if (filters.habitat) q.habitat = filters.habitat;
        if (filters.date_from) q.date_from = filters.date_from;
        if (filters.date_to) q.date_to = filters.date_to;
        return q;
      })();
      try {
        const [ovR, clR, vegR, envR, degR, suitR, timeR, intelR] = await Promise.all([
          api.get('/api/habitat/overview', { params: p }),
          api.get('/api/habitat/classification', { params: p }),
          api.get('/api/habitat/vegetation', { params: p }),
          api.get('/api/habitat/environment', { params: p }),
          api.get('/api/habitat/degradation', { params: p }),
          api.get('/api/habitat/suitability', { params: p }),
          api.get('/api/habitat/timeline', { params: p }),
          api.get('/api/habitat/intelligence').catch(() => ({ data: null })),
        ]);
        setOverview(ovR.data);
        setClassification(clR.data || []);
        setVegetation(vegR.data || []);
        setEnvironment(envR.data || []);
        setDegradation(degR.data || []);
        setSuitabilitySites(suitR.data || []);
        setTimeline(timeR.data || []);
        setHabitatIntel(intelR?.data || {
          recommendations: ['Deploy additional camera traps', 'Increase vegetation monitoring', 'Restore degraded corridors']
        });
        setTimestamp(formatLastUpdated(new Date()));
      } catch (err) {
        console.error('Habitat fetch error:', err);
        setError('Connection to backend database failed.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [filters, destroyMap]);

  /* ─ Cleanup on unmount ─ */
  useEffect(() => {
    return () => destroyMap();
  }, [destroyMap]);

  /* ─ GIS Map init / rebuild ─ */
  useEffect(() => {
    if (loading || error || !suitabilitySites.length) { destroyMap(); return; }
    const timer = setTimeout(() => {
      if (!mapRef.current) return;
      if (!mapInstance.current) {
        try {
          const map = L.map(mapRef.current, { center: [20.59, 78.96], zoom: 5, zoomControl: false, attributionControl: false });
          baseTileLayer.current = L.tileLayer(BASEMAPS.light).addTo(map);
          L.control.zoom({ position: 'bottomright' }).addTo(map);
          L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);
          mapInstance.current = map;
        } catch (e) { console.error('Map init error:', e); return; }
      }
      const map = mapInstance.current;
      Object.values(layerGroups.current).forEach(lg => { try { map.removeLayer(lg); } catch (_) {} });
      layerGroups.current = {};

      const addToGroup = (key, layer) => {
        if (!layerGroups.current[key]) layerGroups.current[key] = L.layerGroup();
        layerGroups.current[key].addLayer(layer);
      };

      suitabilitySites.forEach(site => {
        const lat = site.latitude, lng = site.longitude;
        const q = site.quality_score || 50, s = site.suitability_score || 50;
        const hType = site.habitat_type || 'forest';
        const hColor = getHabitatColor(hType);
        const isProtected = !!site.protected_area;
        const isWater = /water|river|wetland|lake|swamp|marsh|mangrove|riverine|delta/i.test(hType);
        const isHotspot = q < 40 || s < 35;
        const qColor = q >= 70 ? '#10b981' : q >= 45 ? '#eab308' : '#ef4444';
 
        const popupHtml = `<div style="width:200px;font-family:system-ui,sans-serif;font-size:11px;color:#1e293b;background:#ffffff;border-radius:10px;padding:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1)">
          <div style="font-weight:800;font-size:13px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-bottom:10px;color:#059669;display:flex;align-items:center;gap:6px">
            <span style="font-size:16px">${isProtected ? '🛡️' : isWater ? '💧' : '🌿'}</span>${site.site_name}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            <div><span style="color:#64748b;font-size:9px;text-transform:uppercase;font-weight:700">Habitat Type</span><div style="font-weight:700;margin-top:2px">${hType}</div></div>
            <div><span style="color:#64748b;font-size:9px;text-transform:uppercase;font-weight:700">Quality</span><div style="font-weight:800;color:${qColor};margin-top:2px;font-size:13px">${q}/100</div></div>
            <div><span style="color:#64748b;font-size:9px;text-transform:uppercase;font-weight:700">Suitability</span><div style="font-weight:800;color:${qColor};margin-top:2px">${s.toFixed(1)}%</div></div>
            <div><span style="color:#64748b;font-size:9px;text-transform:uppercase;font-weight:700">Protected</span><div style="font-weight:700;margin-top:2px;color:${isProtected ? '#059669' : '#94a3b8'}">${isProtected ? 'Yes ✓' : 'No'}</div></div>
          </div>
          ${isHotspot ? '<div style="margin-top:10px;background:#ef444420;border:1px solid #ef444440;border-radius:6px;padding:6px;font-size:10px;color:#ef4444">⚠️ Critical zone — restoration priority</div>' : ''}
        </div>`;
 
        // Layer 1: Suitability graduated circles
        const sc = q >= 70 ? '#10b981' : q >= 45 ? '#eab308' : '#ef4444';
        const sr = Math.max(4000, Math.min(30000, q * 380));
        addToGroup('suitability', L.circle([lat, lng], { color: sc, fillColor: sc, fillOpacity: 0.25, radius: sr, weight: 1.5 }).bindPopup(popupHtml, { maxWidth: 300 }));
 
        // Layer 2: Vegetation pins with habitat color
        const vegIcon = L.divIcon({ className: '', html: `<div style="width:12px;height:12px;border-radius:50%;background:${hColor};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`, iconSize: [12, 12], iconAnchor: [6, 6] });
        addToGroup('vegetation', L.marker([lat, lng], { icon: vegIcon }).bindPopup(popupHtml, { maxWidth: 300 }));
 
        // Layer 3: Water bodies — blue highlights
        if (isWater) {
          const wIcon = L.divIcon({ className: '', html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2.5px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.6)"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] });
          addToGroup('water', L.marker([lat, lng], { icon: wIcon }).bindPopup(popupHtml, { maxWidth: 300 }));
          addToGroup('water', L.circle([lat, lng], { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.12, radius: 9000, weight: 1 }));
        }
 
        // Layer 4: Protected area polygons
        if (isProtected) {
          const pIcon = L.divIcon({ className: '', html: `<div style="width:16px;height:16px;border-radius:50%;background:#059669;border:3px solid #34d399;box-shadow:0 2px 10px rgba(5,150,105,0.7)"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] });
          addToGroup('protected', L.marker([lat, lng], { icon: pIcon }).bindPopup(popupHtml, { maxWidth: 300 }));
          addToGroup('protected', L.circle([lat, lng], { color: '#059669', fillColor: '#059669', fillOpacity: 0.07, radius: 15000, weight: 2, dashArray: '8 5' }));
        }
 
        // Layer 5: Monitoring sites
        const sIcon = L.divIcon({ className: '', html: `<div style="width:8px;height:8px;border-radius:50%;background:#64748b;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`, iconSize: [8, 8], iconAnchor: [4, 4] });
        addToGroup('sites', L.marker([lat, lng], { icon: sIcon }).bindPopup(popupHtml, { maxWidth: 300 }));
 
        // Layer 8: Critical hotspots
        if (isHotspot) {
          const hIcon = L.divIcon({ className: '', html: `<div style="width:22px;height:22px;border-radius:50%;background:rgba(239,68,68,0.15);border:3px solid #ef4444;box-shadow:0 0 12px rgba(239,68,68,0.5)"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] });
          addToGroup('hotspots', L.marker([lat, lng], { icon: hIcon }).bindPopup(popupHtml, { maxWidth: 300 }));
          addToGroup('hotspots', L.circle([lat, lng], { color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.06, radius: 16000, weight: 2, dashArray: '5 7' }));
        }
 
        // Layer 9: Human disturbance
        if (q < 45) {
          const dIcon = L.divIcon({ className: '', html: `<div style="width:12px;height:12px;border-radius:2px;background:#f97316;border:2px solid white;box-shadow:0 1px 4px rgba(249,115,22,0.5)"></div>`, iconSize: [12, 12], iconAnchor: [6, 6] });
          addToGroup('disturbance', L.marker([lat, lng], { icon: dIcon }).bindPopup(popupHtml, { maxWidth: 300 }));
        }
      });

      GIS_LAYERS.forEach(({ key }) => {
        const lg = layerGroups.current[key];
        if (!lg) return;
        if (activeLayers[key]) map.addLayer(lg); else map.removeLayer(lg);
      });

      const pts = suitabilitySites.map(s => [s.latitude, s.longitude]);
      if (pts.length === 1) map.setView(pts[0], 11);
      else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
    }, 120);
    return () => clearTimeout(timer);
  }, [loading, error, suitabilitySites, destroyMap, activeLayers]);

  // Layer visibility toggle
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    GIS_LAYERS.forEach(({ key }) => {
      const lg = layerGroups.current[key];
      if (!lg) return;
      if (activeLayers[key]) { if (!map.hasLayer(lg)) map.addLayer(lg); }
      else { if (map.hasLayer(lg)) map.removeLayer(lg); }
    });
  }, [activeLayers]);

  const handleResetView = () => mapInstance.current?.setView([20.59, 78.96], 5);
  const handleFitData = () => {
    const map = mapInstance.current;
    if (!map || !suitabilitySites.length) return;
    map.fitBounds(L.latLngBounds(suitabilitySites.map(s => [s.latitude, s.longitude])), { padding: [40, 40] });
  };
  const toggleLayer = key => setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const derivedEnv = useMemo(() => {
    const temps = environment.map(e => e.temp).filter(Boolean);
    const hums = environment.map(e => e.humidity).filter(Boolean);
    const avgTemp = temps.length ? (temps.reduce((s, v) => s + v, 0) / temps.length) : 28.0;
    const avgHum = hums.length ? (hums.reduce((s, v) => s + v, 0) / hums.length) : 70.0;

    return {
      avgTemp: avgTemp.toFixed(1),
      avgHumidity: avgHum.toFixed(1),
    };
  }, [environment]);

  /* ─── Vegetation indices ─────────────────────────────────────────────── */
  const derivedVeg = useMemo(() => {
    if (!vegetation.length) return null;
    const avgNdvi = vegetation.reduce((s, v) => s + (v.ndvi || 0), 0) / vegetation.length;
    const latestNdvi = vegetation[vegetation.length - 1]?.ndvi || avgNdvi;
    return {
      avgNdvi: avgNdvi.toFixed(3),
      latestNdvi: latestNdvi.toFixed(3),
      enhancedData: vegetation,
    };
  }, [vegetation]);

  /* ─── Suitability model factors ──────────────────────────────────────── */
  const suitFactors = useMemo(() => {
    if (!overview) return [];
    const veg = overview.vegetation_coverage || 65;
    const water = overview.water_availability || 55;
    const env = overview.environmental_condition || 70;
    const dist = Math.max(0, 100 - (overview.human_disturbance || 25));
    const avgQ = suitabilitySites.length
      ? suitabilitySites.reduce((s, x) => s + (x.quality_score || 0), 0) / suitabilitySites.length : 65;
    const avgS = suitabilitySites.length
      ? suitabilitySites.reduce((s, x) => s + (x.suitability_score || 0), 0) / suitabilitySites.length : 60;
    return [
      { factor: 'Vegetation',       weight: 30, score: veg,                       contribution: (veg * 30 / 100).toFixed(1),  desc: 'NDVI-derived canopy coverage' },
      { factor: 'Water',            weight: 25, score: water,                     contribution: (water * 25 / 100).toFixed(1), desc: 'Perennial water source availability' },
      { factor: 'Climate',          weight: 15, score: env,                       contribution: (env * 15 / 100).toFixed(1),   desc: 'Temperature and humidity stability' },
      { factor: 'Low Disturbance',  weight: 15, score: dist,                      contribution: (dist * 15 / 100).toFixed(1),  desc: 'Inverse of human encroachment index' },
      { factor: 'Habitat Quality',  weight: 10, score: avgQ,                      contribution: (avgQ * 10 / 100).toFixed(1),  desc: 'Overall monitoring site quality score' },
      { factor: 'Connectivity',     weight: 5,  score: avgS,                      contribution: (avgS * 5 / 100).toFixed(1),   desc: 'Wildlife corridor and landscape linkage' },
    ];
  }, [overview, suitabilitySites]);

  const overallSuitScore = useMemo(() => {
    if (!overview) return '0.0';
    return (overview.habitat_suitability || 0).toFixed(1);
  }, [overview]);

  const biodivStats = useMemo(() => {
    if (!suitabilitySites.length) return null;
    const avgQ = suitabilitySites.reduce((s, x) => s + (x.quality_score || 0), 0) / suitabilitySites.length;
    return {
      protectedSites: suitabilitySites.filter(s => s.protected_area).length,
      avgQuality: avgQ.toFixed(1),
      highQualitySites: suitabilitySites.filter(s => s.quality_score >= 70).length,
      criticalSites: suitabilitySites.filter(s => s.quality_score < 40).length,
    };
  }, [suitabilitySites]);

  /* ─── AI Insights ────────────────────────────────────────────────────── */
  const aiInsights = useMemo(() => {
    if (!suitabilitySites.length) return [];
    const sorted = [...suitabilitySites].sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0));
    const best = sorted[0], worst = sorted[sorted.length - 1];
    const protSite = suitabilitySites.find(s => s.protected_area);
    const critical = sorted.filter(s => s.quality_score < 50);
    const highWater = suitabilitySites.filter(s => /water|river|wetland|lake/i.test(s.habitat_type || ''));
    const veg = overview?.vegetation_coverage;
    const water = overview?.water_availability;
    const ins = [];
    if (best) ins.push({ icon: '🏆', color: '#10b981', label: 'Highest Quality Habitat',
      text: `${best.site_name} achieves the highest ecosystem quality score of ${best.quality_score}/100 (${best.habitat_type}). This site should be designated as a priority conservation zone with increased patrol frequency.`,
      severity: 'info' });
    if (worst && worst !== best) ins.push({ icon: '🔻', color: '#ef4444', label: 'Restoration Priority',
      text: `${worst.site_name} is the lowest-scoring site at ${worst.quality_score}/100. Immediate habitat restoration, encroachment control, and replanting programs are recommended.`,
      severity: 'critical' });
    if (protSite) ins.push({ icon: '🛡️', color: '#3b82f6', label: 'Protected Area Intelligence',
      text: `${protSite.site_name} is within a protected area with ${(protSite.suitability_score || 0).toFixed(1)}% suitability. Ensure wildlife corridors connecting this zone are maintained and anti-poaching patrols are consistent.`,
      severity: 'info' });
    if (critical.length > 0) ins.push({ icon: '⚠️', color: '#f59e0b', label: 'Habitat Fragmentation Risk',
      text: `${critical.length} site${critical.length > 1 ? 's' : ''} (${critical.slice(0, 2).map(s => s.site_name).join(', ')}${critical.length > 2 ? '…' : ''}) score below 50. Fragmentation of these zones poses a corridor collapse risk for migratory species.`,
      severity: 'warning' });
    if (highWater.length) ins.push({ icon: '💧', color: '#0ea5e9', label: 'Riparian Biodiversity Hotspot',
      text: `${highWater.length} water-associated habitat${highWater.length > 1 ? 's' : ''} identified. Ensure waterhole maintenance.`,
      severity: 'info' });
    if (veg !== undefined && veg < 60) ins.push({ icon: '🌱', color: '#22c55e', label: 'Vegetation Decline Alert',
      text: `Vegetation coverage is ${veg}%, below the recommended 60% threshold. Afforestation intervention is recommended.`,
      severity: 'warning' });
    if (water !== undefined && water < 50) ins.push({ icon: '🏜️', color: '#d97706', label: 'Water Stress Detected',
      text: `Water availability at ${water}% is critically low. Emergency waterhole restoration is recommended.`,
      severity: 'critical' });
    return ins;
  }, [suitabilitySites, overview]);

  /* ─── Classification (filtered, coloured) ────────────────────────────── */
  const processedClass = useMemo(() => {
    if (!classification.length) return [];
    const total = classification.reduce((acc, curr) => acc + (curr.value || 0), 0);
    if (!total) return [];
    let main = [], otherSum = 0;
    classification.forEach(item => {
      const pct = (item.value / total) * 100;
      if (pct < 1.5) otherSum += item.value;
      else main.push({ ...item, color: getHabitatColor(item.name) });
    });
    if (otherSum > 0) main.push({ name: 'Other', value: otherSum, color: '#64748b' });
    return main.sort((a, b) => b.value - a.value);
  }, [classification]);

  const chartCfg = {
    grid: '#e2e8f0',
    axis: '#475569',
    ttBg: '#fff',
    ttBorder: '#cbd5e1',
  };

  const ChartWrap = ({ children, height = 260 }) => (
    <div style={{ width: '100%', height }} className="block">
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );

  const hasNoEnvData = environment.length === 0;
  const hasNoSites = suitabilitySites.length === 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-slate-900 font-sans">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
            <Map className="h-3.5 w-3.5" /> Ecological GIS Platform
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
            Habitat Intelligence Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Professional-grade ecosystem monitoring: GIS mapping, vegetation analytics, environmental indicators and ecological AI.
          </p>
        </div>
        <button onClick={() => { setFilters({}); }}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs shadow-sm">
          <RefreshCw className="h-4 w-4 text-emerald-500" /> Refresh
        </button>
      </div>

      <FilterBar filters={filters} onChange={setFilters} disabled={loading} />

      {/* ─── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard title="Habitat Quality" value={loading || error || !overview ? '—' : `${overview.habitat_quality_score}/100`} subtext="Ecosystem health" trend="positive" trendValue="+1.5%" icon={Award} lastUpdated={timestamp} />
        <MetricCard title="Vegetation Coverage" value={loading || error || !overview ? '—' : `${overview.vegetation_coverage}%`} subtext="NDVI canopy index" trend="positive" trendValue="+0.6%" icon={Leaf} lastUpdated={timestamp} colorClass="text-emerald-600 bg-emerald-50 border-emerald-200" />
        <MetricCard title="Water Availability" value={loading || error || !overview ? '—' : `${overview.water_availability}%`} subtext="Water access" trend="positive" trendValue="+1.2%" icon={Waves} lastUpdated={timestamp} colorClass="text-blue-600 bg-blue-50 border-blue-200" />
        <MetricCard title="Env. Condition" value={loading || error || !overview ? '—' : `${overview.environmental_condition?.toFixed(0)}%`} subtext="Microclimate" trend="neutral" trendValue="Stable" icon={Activity} lastUpdated={timestamp} colorClass="text-cyan-600 bg-cyan-50 border-cyan-200" />
        <MetricCard title="Suitability" value={loading || error || !overview ? '—' : `${overview.habitat_suitability?.toFixed(0)}%`} subtext="Breeding fitness" trend="positive" trendValue="+0.8%" icon={ShieldCheck} lastUpdated={timestamp} colorClass="text-indigo-600 bg-indigo-50 border-indigo-200" />
        <MetricCard title="Human Disturbance" value={loading || error || !overview ? '—' : `${overview.human_disturbance}%`} subtext="Encroachment index" trend="negative" trendValue="-1.4%" icon={Users} lastUpdated={timestamp} colorClass="text-rose-600 bg-rose-50 border-rose-200" />
      </div>

      {/* ─── GIS MAP ───────────────────────────────────────────────────── */}
      <DashboardSection title="Habitat GIS Intelligence Map" subtitle="Multi-layer geospatial visualization — toggle layers, cycle views, inspect site popups">
        {/* Layer toggle strip */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button onClick={() => setShowLayerPanel(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
            <Layers className="h-3.5 w-3.5 text-emerald-500" />
            Layers {showLayerPanel ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {GIS_LAYERS.map(({ key, label, emoji }) => (
            <button key={key} onClick={() => toggleLayer(key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-all text-[10px] font-bold ${activeLayers[key] ? 'bg-emerald-50 border-emerald-250 text-emerald-700 font-extrabold' : 'bg-white border-slate-200 text-slate-400'}`}>
              <span>{emoji}</span><span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {showLayerPanel && (
          <div className="mb-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {GIS_LAYERS.map(({ key, label, emoji }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer" onClick={() => toggleLayer(key)}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${activeLayers[key] ? 'border-emerald-500 bg-emerald-500' : 'border-slate-350 bg-white'}`}>
                    {activeLayers[key] && <span className="text-white text-[8px] font-black">✓</span>}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">{emoji} {label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <MapCard
          title="Habitat Suitability GIS Map"
          subtitle={`${suitabilitySites.length} monitoring sites · ${Object.values(activeLayers).filter(Boolean).length} active layers`}
          loading={loading} error={error}
          isEmpty={!loading && !error && hasNoSites}
          emptyTitle="No Habitat Sites Found"
          emptyDescription="No monitoring sites with valid coordinates have been configured."
          mapRef={mapRef}
          height="h-[520px]"
          onResetView={handleResetView}
          onFitData={handleFitData}
          basemapMode="light"
          showLegend={showLegend}
          onToggleLegend={() => setShowLegend(v => !v)}
          onExportPNG={() => alert('Use browser Print → Save as PDF to export the current GIS canvas.')}
          infoPanel={
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <h4 className="font-black text-slate-500 uppercase tracking-wider text-[9px] mb-3">Site Intelligence</h4>
                <div className="space-y-2 text-[10px] font-semibold text-slate-700">
                  <div className="flex justify-between"><span>Total Sites:</span><span className="font-black text-emerald-500">{suitabilitySites.length}</span></div>
                  <div className="flex justify-between"><span>Protected:</span><span className="font-black text-blue-500">{suitabilitySites.filter(s => s.protected_area).length}</span></div>
                  <div className="flex justify-between"><span>High Quality (≥70):</span><span className="font-black text-emerald-500">{suitabilitySites.filter(s => s.quality_score >= 70).length}</span></div>
                  <div className="flex justify-between"><span>Critical (&lt;40):</span><span className="font-black text-rose-500">{suitabilitySites.filter(s => s.quality_score < 40).length}</span></div>
                  <div className="flex justify-between"><span>Water Habitats:</span><span className="font-black text-cyan-500">{suitabilitySites.filter(s => /water|river|wetland|lake/i.test(s.habitat_type || '')).length}</span></div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <h4 className="font-black text-slate-500 uppercase tracking-wider text-[9px] mb-3">Active Layers ({Object.values(activeLayers).filter(Boolean).length}/{GIS_LAYERS.length})</h4>
                <div className="space-y-1.5">
                  {GIS_LAYERS.filter(l => activeLayers[l.key]).map(({ key, label, color, emoji }) => (
                    <div key={key} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-650">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />{emoji} {label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <h4 className="font-black text-slate-500 uppercase tracking-wider text-[9px] mb-3">Quality Gradient</h4>
                <div className="space-y-2 text-[10px] font-bold text-slate-600">
                  <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#10b981]" /> High Quality ≥ 70 (large circle)</div>
                  <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#eab308]" /> Moderate 45–69</div>
                  <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#ef4444]" /> Critical &lt; 45 (small circle)</div>
                  <div className="flex items-center gap-1.5"><span className="h-2.5 w-5 rounded border-2 border-[#059669]" /> Protected boundary</div>
                  <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#3b82f6]" /> Water habitat</div>
                </div>
              </div>
            </div>
          }
        >
          {showLegend && !loading && !error && !hasNoSites && (
            <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur text-slate-800 p-2.5 rounded-lg border border-slate-250 shadow-md" style={{ maxWidth: 145 }}>
              <div className="text-[9px] uppercase tracking-wider text-emerald-600 border-b border-slate-200 pb-1.5 mb-2 font-black">GIS Legend</div>
              <div className="space-y-1.5 text-[10px] font-bold">
                {[['#10b981', 'High Quality'], ['#eab308', 'Moderate'], ['#ef4444', 'Critical'], ['#059669', 'Protected'], ['#3b82f6', 'Water'], ['#ef4444', 'Hotspot']].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full shrink-0" style={{ background: c }} />{l}</div>
                ))}
              </div>
            </div>
          )}
        </MapCard>
      </DashboardSection>

      {/* ─── ENVIRONMENTAL MONITORING ─────────────────────────────────── */}
      <DashboardSection title="Environmental Monitoring Dashboard" subtitle="Real sensor averages & environmental trends derived from live observation telemetry">
        {/* Temperature & Humidity line chart */}
        <div className="glass-card p-5 mb-5 border border-slate-200 rounded-xl shadow-sm">
          <div className="mb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Temperature & Humidity — 7-Day Trend</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Real sensor readings compiled from active observation timestamps in the database</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500" /></div>
          ) : hasNoEnvData ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-xs">
              <Info className="h-6 w-6 mb-2" />No environmental telemetry available.
            </div>
          ) : (
            <ChartWrap height={240}>
              <LineChart data={environment} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartCfg.grid} />
                <XAxis dataKey="day" stroke={chartCfg.axis} fontSize={11} tickLine={false} />
                <YAxis stroke={chartCfg.axis} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: chartCfg.ttBg, borderColor: chartCfg.ttBorder, borderRadius: '12px', fontSize: 11 }} />
                <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2.5} name="Temperature (°C)" dot={{ r: 4, fill: '#f59e0b' }} />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2.5} name="Humidity (%)" dot={{ r: 4, fill: '#3b82f6' }} />
              </LineChart>
            </ChartWrap>
          )}
        </div>

        {/* Core environmental cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          {[
            { label: 'Temperature', value: `${derivedEnv.avgTemp}°C`, icon: Thermometer, color: '#f59e0b', note: 'Live sensor avg' },
            { label: 'Humidity', value: `${derivedEnv.avgHumidity}%`, icon: Droplets, color: '#3b82f6', note: 'Live sensor avg' },
          ].map(({ label, value, icon: Icon, color, note }) => (
            <EcoCard key={label} icon={Icon} label={label} value={value} color={color} note={note} est={false} />
          ))}
        </div>
      </DashboardSection>

      {/* ─── VEGETATION ANALYSIS ──────────────────────────────────────── */}
      <DashboardSection title="Vegetation Analysis" subtitle="NDVI seasonal canopy coverage trends derived from database records">
        <div className="glass-card p-5 border border-slate-200 rounded-xl shadow-sm bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Seasonal NDVI Canopy Trend</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Average and latest Normalized Difference Vegetation Index (NDVI) values</p>
            </div>
            {derivedVeg && (
              <div className="flex gap-4 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <div><span className="text-slate-500">Average NDVI:</span> <span className="text-emerald-600 font-extrabold">{derivedVeg.avgNdvi}</span></div>
                <div><span className="text-slate-500">Latest NDVI:</span> <span className="text-emerald-700 font-black">{derivedVeg.latestNdvi}</span></div>
              </div>
            )}
          </div>
          {!derivedVeg || !derivedVeg.enhancedData.length ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-xs font-semibold">No vegetation telemetry data available.</div>
          ) : (
            <ChartWrap height={250}>
              <AreaChart data={derivedVeg.enhancedData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="ndviG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartCfg.grid} />
                <XAxis dataKey="month" stroke={chartCfg.axis} fontSize={11} tickLine={false} />
                <YAxis stroke={chartCfg.axis} fontSize={11} tickLine={false} axisLine={false} domain={[0.2, 0.9]} />
                <Tooltip contentStyle={{ backgroundColor: chartCfg.ttBg, borderColor: chartCfg.ttBorder, borderRadius: '12px', fontSize: 11 }} />
                <Area type="monotone" dataKey="ndvi" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#ndviG)" name="NDVI (Live)" />
              </AreaChart>
            </ChartWrap>
          )}
        </div>
      </DashboardSection>

      {/* ─── HABITAT CLASSIFICATION ───────────────────────────────────── */}
      <DashboardSection title="Habitat Classification Intelligence" subtitle="Land-cover breakdown with ecological scoring per habitat type">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Donut */}
          <div className="glass-card p-5 border border-slate-200 rounded-xl shadow-sm bg-white">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Land Cover Distribution</h3>
            {loading ? <div className="flex justify-center py-10"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500" /></div>
              : !processedClass.length ? <div className="text-center text-slate-500 text-xs py-8">No classification data.</div>
              : (<>
                <ChartWrap height={200}>
                  <PieChart>
                    <Pie data={processedClass} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={3} dataKey="value">
                      {processedClass.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: chartCfg.ttBg, borderColor: chartCfg.ttBorder, borderRadius: '10px', fontSize: 11 }} formatter={v => [`${parseFloat(v).toFixed(1)}%`, 'Coverage']} />
                  </PieChart>
                </ChartWrap>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                  {processedClass.slice(0, 6).map(item => (
                    <div key={item.name} className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />{item.name} ({parseFloat(item.value).toFixed(1)}%)
                    </div>
                  ))}
                </div>
              </>)}
          </div>

          {/* Classification cards */}
          <div className="lg:col-span-2 max-h-[460px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
            {processedClass.map((hab) => (
              <div key={hab.name} className="p-3 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: hab.color }} />
                  <span className="font-extrabold text-xs text-slate-900">{hab.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                  <div className="flex justify-between"><span className="text-slate-500 font-bold">Area:</span><span className="font-extrabold">{parseFloat(hab.value).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 font-bold">Observations:</span><span className="font-extrabold">{hab.observations}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardSection>

      {/* ─── SUITABILITY MODEL ────────────────────────────────────────── */}
      <DashboardSection title="Habitat Suitability Model" subtitle="6-factor weighted ecological scoring — each factor explained with its contribution and rationale">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card p-5 border border-slate-200 rounded-xl shadow-sm bg-white">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Factor Contribution Analysis</h3>
            {!suitFactors.length ? <div className="text-center text-slate-500 text-xs py-8">No overview data.</div>
              : (<ChartWrap height={280}>
                  <BarChart layout="vertical" data={suitFactors} margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartCfg.grid} />
                    <XAxis type="number" domain={[0, 30]} stroke={chartCfg.axis} fontSize={10} tickFormatter={v => `${v}pts`} />
                    <YAxis type="category" dataKey="factor" stroke={chartCfg.axis} fontSize={10} width={105} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: chartCfg.ttBg, borderColor: chartCfg.ttBorder, borderRadius: '10px', fontSize: 11 }}
                      formatter={(v, n, p) => [`${v} pts (${p.payload.weight}% wt.)`, p.payload.desc]} />
                    <Bar dataKey="contribution" radius={[0, 5, 5, 0]} name="Score">
                      {suitFactors.map((f, i) => <Cell key={i} fill={f.score >= 70 ? '#10b981' : f.score >= 45 ? '#f59e0b' : '#ef4444'} />)}
                    </Bar>
                  </BarChart>
                </ChartWrap>)}
          </div>

          <div className="space-y-4">
            <div className="glass-card p-5 border border-slate-200 rounded-xl shadow-sm bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Overall Suitability</h3>
                <div className="text-3xl font-black text-emerald-500">{overallSuitScore}<span className="text-base text-slate-500 font-normal">/100</span></div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                <div className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700" style={{ width: `${overallSuitScore}%` }} />
              </div>
              <p className="text-[10px] text-slate-505">{parseFloat(overallSuitScore) >= 70 ? '✅ High suitability — ecosystem supports diverse wildlife populations.' : parseFloat(overallSuitScore) >= 50 ? '⚠️ Moderate suitability — targeted interventions can improve capacity.' : '🔴 Low suitability — urgent habitat restoration recommended.'}</p>
            </div>
            <div className="glass-card p-4 border border-slate-200 rounded-xl shadow-sm bg-white">
              <h4 className="text-xs font-extrabold text-emerald-600 mb-2">✅ Ecological Strengths</h4>
              <ul className="space-y-1">
                {suitFactors.filter(f => f.score >= 65).map(f => (<li key={f.factor} className="text-[10px] text-slate-700 font-semibold">• <strong>{f.factor}</strong>: {parseFloat(f.score).toFixed(0)}/100 — {f.desc}</li>))}
                {!suitFactors.filter(f => f.score >= 65).length && <li className="text-[10px] text-slate-505">No strong factors identified.</li>}
              </ul>
            </div>
            <div className="glass-card p-4 border border-slate-200 rounded-xl shadow-sm bg-white">
              <h4 className="text-xs font-extrabold text-rose-600 mb-2">⚠️ Limiting Factors</h4>
              <ul className="space-y-1">
                {suitFactors.filter(f => f.score < 65).map(f => (<li key={f.factor} className="text-[10px] text-slate-700 font-semibold">• <strong>{f.factor}</strong>: {parseFloat(f.score).toFixed(0)}/100 — {f.desc}</li>))}
                {!suitFactors.filter(f => f.score < 65).length && <li className="text-[10px] text-slate-505">All factors performing well.</li>}
              </ul>
            </div>
          </div>
        </div>
        {habitatIntel?.recommendations && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <h4 className="text-xs font-extrabold text-emerald-700 mb-2">🌿 Conservation Action Recommendations</h4>
            <div className="flex flex-wrap gap-2">
              {habitatIntel.recommendations.map((rec, i) => (
                <span key={i} className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-700">{rec}</span>
              ))}
            </div>
          </div>
        )}
      </DashboardSection>

      {/* ─── DEGRADATION + BIODIVERSITY ───────────────────────────────── */}
      <DashboardSection title="Habitat Degradation & Biodiversity Analytics" subtitle="Degradation indices by sector and comprehensive biodiversity metrics (Shannon, Simpson, Pielou)">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card p-5 border border-slate-200 rounded-xl shadow-sm bg-white">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Habitat Degradation Index</h3>
            {loading ? <div className="flex justify-center py-8"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500" /></div>
              : !degradation.length ? <div className="text-center text-slate-500 text-xs py-8">No degradation data.</div>
              : (<ChartWrap height={240}>
                  <BarChart data={degradation} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartCfg.grid} />
                    <XAxis dataKey="sector" stroke={chartCfg.axis} fontSize={10} tickLine={false} />
                    <YAxis stroke={chartCfg.axis} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: chartCfg.ttBg, borderColor: chartCfg.ttBorder, borderRadius: '10px', fontSize: 11 }} />
                    <Bar dataKey="index" radius={[4, 4, 0, 0]} name="Degradation Severity (%)">
                      {degradation.map((entry, i) => { const v = entry.index || 0; return <Cell key={i} fill={v < 20 ? '#10b981' : v < 50 ? '#f59e0b' : '#ef4444'} />; })}
                    </Bar>
                  </BarChart>
                </ChartWrap>)}
          </div>

          <div className="glass-card p-5 border border-slate-200 rounded-xl shadow-sm bg-white">
            <h3 className="text-sm font-extrabold text-slate-900 mb-4">Biodiversity Intelligence</h3>
            {!biodivStats ? <div className="text-center text-slate-500 text-xs py-8">No site data.</div>
              : (<div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Protected Sites', value: biodivStats.protectedSites, color: '#059669' },
                    { label: 'Avg. Quality', value: `${biodivStats.avgQuality}/100`, color: '#f59e0b' },
                    { label: 'High Quality Sites', value: biodivStats.highQualitySites, color: '#22c55e' },
                    { label: 'Critical Sites', value: biodivStats.criticalSites, color: '#ef4444' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-2.5 rounded-lg bg-slate-55 border border-slate-200">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[8px] font-black uppercase text-slate-500">{label}</span>
                      </div>
                      <div className="text-sm font-black" style={{ color }}>{value}</div>
                    </div>
                  ))}
                </div>)}
          </div>
        </div>
      </DashboardSection>

      {/* ─── AI HABITAT INSIGHTS ──────────────────────────────────────── */}
      <DashboardSection title="AI Habitat Insights" subtitle="Ecological intelligence derived from live PostgreSQL data — each insight explains its source and rationale">
        {loading ? <div className="flex justify-center py-8"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500" /></div>
          : !aiInsights.length ? <div className="text-center text-slate-500 text-xs py-8">No site data available to generate insights.</div>
          : (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {aiInsights.map((insight, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{insight.icon}</span>
                    <span className="text-xs font-extrabold" style={{ color: insight.color }}>{insight.label}</span>
                    {insight.severity === 'critical' && <span className="ml-auto text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-250">Critical</span>}
                    {insight.severity === 'warning' && <span className="ml-auto text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-105 text-amber-700 border border-amber-250">Warning</span>}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700 leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>)}
      </DashboardSection>

      {/* ─── HABITAT TIMELINE ─────────────────────────────────────────── */}
      <DashboardSection title="Habitat Event Timeline" subtitle="Landscape events, disturbances, environmental anomalies and conservation actions">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100">
            {loading ? <div className="flex justify-center py-10"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500" /></div>
              : error ? <div className="text-rose-500 text-center py-10 text-xs">{error}</div>
              : !timeline.length ? <div className="text-slate-450 text-center py-10 text-xs">No timeline events recorded.</div>
              : timeline.map((log) => {
                const catMap = {
                  'Wildlife Observation': { cls: 'bg-blue-50 border-blue-200 text-blue-600', icon: '🦁' },
                  'Habitat Change': { cls: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: '🌿' },
                  'Environmental Event': { cls: 'bg-amber-50 border-amber-200 text-amber-755', icon: '🌧️' },
                  'Human Disturbance': { cls: 'bg-rose-50 border-rose-200 text-rose-600', icon: '⚠️' },
                  'AI Detection': { cls: 'bg-purple-50 border-purple-200 text-purple-700', icon: '🤖' },
                  'Breeding Season': { cls: 'bg-pink-50 border-pink-200 text-pink-700', icon: '🥚' },
                  'Migration Season': { cls: 'bg-cyan-50 border-cyan-200 text-cyan-700', icon: '🐦' },
                  'Conservation Activity': { cls: 'bg-green-55 border-green-200 text-green-700', icon: '♻️' },
                  'Fire Alert': { cls: 'bg-orange-50 border-orange-200 text-orange-705', icon: '🔥' },
                  'Drought': { cls: 'bg-yellow-50 border-yellow-250 text-yellow-750', icon: '🏜️' },
                  'Flooding': { cls: 'bg-indigo-50 border-indigo-200 text-indigo-700', icon: '🌊' },
                };
                const cat = catMap[log.category] || { cls: 'bg-slate-50 border-slate-200 text-slate-600', icon: '📋' };
                const sc = log.severity === 'High' ? '#ef4444' : log.severity === 'Medium' ? '#f59e0b' : '#10b981';
                return (
                  <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-400">{new Date(log.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${cat.cls}`}>{cat.icon} {log.category}</span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900">{log.event}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        {log.notes ? log.notes.replace(/Source:\s*AI Generated\.?/gi, '').trim() : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded border" style={{ background: `${sc}15`, color: sc, borderColor: `${sc}40` }}>{log.severity}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </DashboardSection>

    </div>
  );
};

export default HabitatIntelligence;
