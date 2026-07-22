import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { INDIA_MAP_CENTER, INDIA_MAP_ZOOM, formatIST } from '../utils/india';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import { 
  ClipboardList, 
  MapPin, 
  Camera, 
  Volume2, 
  Eye, 
  Clock, 
  Loader2, 
  AlertCircle, 
  AlertTriangle,
  Users,
  Cpu,
  BrainCircuit,
  TrendingUp,
  Shield,
  ArrowUpRight,
  Plus,
  Settings,
  Upload
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const roleName = user?.roles?.[0]?.name || 'Wildlife Researcher';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, sitesRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/monitoring-sites')
        ]);
        setStats(statsRes.data);
        setSites(sitesRes.data);
      } catch (err) {
        setError('Connection to backend failed. Please ensure services are running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (loading || !mapRef.current) return;

    // Destroy previous instance if any
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    // Set center coordinates: India default or average of sites
    let center = INDIA_MAP_CENTER;
    let zoom   = INDIA_MAP_ZOOM;
    if (sites.length > 0) {
      const sumLat = sites.reduce((sum, s) => sum + s.latitude, 0);
      const sumLon = sites.reduce((sum, s) => sum + s.longitude, 0);
      center = [sumLat / sites.length, sumLon / sites.length];
      zoom   = 9;
    }

    try {
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(center, zoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Plot sites as map markers
      sites.forEach((site) => {
        const markerIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-white shadow-md"><div class="h-2 w-2 rounded-full bg-slate-900 animate-pulse"></div></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([site.latitude, site.longitude], { icon: markerIcon }).addTo(map);
        marker.bindPopup(`
          <div class="p-2 text-slate-900 font-sans">
            <h4 class="font-bold text-xs">${site.name}</h4>
            <p class="text-3xs text-slate-650 mt-0.5">${site.location}</p>
            <p class="text-3xs font-bold text-emerald-700 mt-1">${site.protected_area ? 'Protected Reserve' : 'Standard Area'}</p>
          </div>
        `);
      });

      mapInstance.current = map;
    } catch (err) {
      console.error('Error rendering Leaflet Map:', err);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [loading, sites]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-emerald-500 font-sans">
        <span className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
        <span className="ml-3 text-lg font-bold text-slate-705 dark:text-slate-400">Loading command telemetry...</span>
      </div>
    );
  }

  // Define dynamic role-based dashboard cards and actions
  let roleGreeting = '';
  let roleCards = [];
  let roleActions = [];

  switch (roleName) {
    case 'Administrator':
      roleGreeting = 'System Administrator Dashboard';
      roleCards = [
        { title: 'Users Registered', value: stats?.total_users ?? 0, icon: Users, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/30 border-emerald-200 dark:border-emerald-900/30', path: '/users' },
        { title: 'Monitoring Sites', value: stats?.total_sites ?? 0, icon: MapPin, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-955/30 border-blue-200 dark:border-blue-900/30', path: '/sites' },
        { title: 'Surveys Registered', value: stats?.total_surveys ?? 0, icon: ClipboardList, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/30 border-amber-200 dark:border-amber-900/30', path: '/surveys' },
        { title: 'Camera Traps', value: stats?.total_camera_traps ?? 0, icon: Camera, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-955/30 border-teal-200 dark:border-teal-900/30', path: '/camera-traps' },
        { title: 'Audio Sensors', value: stats?.total_audio_sensors ?? 0, icon: Volume2, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-955/30 border-cyan-200 dark:border-cyan-900/30', path: '/audio-sensors' },
        { title: 'Uploaded Images', value: stats?.total_uploaded_images ?? 0, icon: Upload, color: 'text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-955/30 border-rose-200 dark:border-rose-900/30', path: '/ai/prediction-history' },
        { title: 'Uploaded Audio', value: stats?.total_uploaded_audio ?? 0, icon: Upload, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-955/30 border-indigo-200 dark:border-indigo-900/30', path: '/ai/prediction-history' },
        { title: 'Unverified Observations', value: stats?.unverified_observations ?? 0, icon: AlertTriangle, color: 'text-orange-605 dark:text-orange-405 bg-orange-50 dark:bg-orange-955/30 border-orange-200 dark:border-orange-900/30', path: '/observations' }
      ];
      roleActions = [
        { label: 'Register Account', path: '/register', icon: Plus },
        { label: 'Manage User Roles', path: '/users', icon: Shield },
        { label: 'Add Monitoring Site', path: '/sites', icon: MapPin },
        { label: 'Configure Settings', path: '/settings', icon: Settings }
      ];
      break;
 
    case 'Wildlife Researcher':
      roleGreeting = 'Wildlife Researcher Workspace';
      roleCards = [
        { title: 'Total Observations', value: stats?.total_observations ?? 0, icon: Eye, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/30 border-emerald-200 dark:border-emerald-900/30', path: '/observations' },
        { title: 'Total Species Detected', value: stats?.species_count ?? 0, icon: BrainCircuit, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-955/30 border-blue-200 dark:border-blue-900/30', path: '/ai/biodiversity' },
        { title: 'Today\'s Observations', value: stats?.todays_observations ?? 0, icon: Clock, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/30 border-amber-200 dark:border-amber-900/30', path: '/observations' },
        { title: 'Unverified Observations', value: stats?.unverified_observations ?? 0, icon: AlertTriangle, color: 'text-orange-605 dark:text-orange-405 bg-orange-50 dark:bg-orange-955/30 border-orange-200 dark:border-orange-900/30', path: '/observations' },
        { title: 'Active Camera Traps', value: stats?.active_camera_traps ?? 0, icon: Camera, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-955/30 border-teal-200 dark:border-teal-900/30', path: '/camera-traps' },
        { title: 'Active Audio Sensors', value: stats?.active_audio_sensors ?? 0, icon: Volume2, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-955/30 border-cyan-200 dark:border-cyan-900/30', path: '/audio-sensors' },
        { title: 'AI Image Predictions', value: stats?.ai_image_predictions ?? 0, icon: Upload, color: 'text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-955/30 border-rose-200 dark:border-rose-900/30', path: '/ai/prediction-history' },
        { title: 'AI Audio Predictions', value: stats?.ai_audio_predictions ?? 0, icon: Upload, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-955/30 border-indigo-200 dark:border-indigo-900/30', path: '/ai/prediction-history' }
      ];
      roleActions = [
        { label: 'Log Observation', path: '/observations', icon: Eye },
        { label: 'Create New Survey', path: '/surveys', icon: ClipboardList },
        { label: 'Image Upload', path: '/ai/image-upload', icon: Upload },
        { label: 'Audio Upload', path: '/ai/audio-upload', icon: Upload }
      ];
      break;
 
    case 'Conservation Officer':
      roleGreeting = 'Conservation Officer Command';
      roleCards = [
        { title: 'Protected Reserves', value: stats?.total_sites ?? 0, icon: MapPin, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-955/30 border-blue-200 dark:border-blue-900/30', path: '/sites' },
        { title: 'Active Surveys', value: stats?.total_surveys ?? 0, icon: ClipboardList, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/30 border-emerald-200 dark:border-emerald-900/30', path: '/surveys' },
        { title: 'Unverified Observations', value: stats?.unverified_observations ?? 0, icon: AlertTriangle, color: 'text-orange-605 dark:text-orange-405 bg-orange-50 dark:bg-orange-955/30 border-orange-200 dark:border-orange-900/30', path: '/observations' },
        { title: 'Image Uploads', value: stats?.total_uploaded_images ?? 0, icon: Upload, color: 'text-rose-605 dark:text-rose-450 bg-rose-50 dark:bg-rose-955/30 border-rose-200 dark:border-rose-900/30', path: '/ai/image-upload' }
      ];
      roleActions = [
        { label: 'Configure Site Map', path: '/sites', icon: MapPin },
        { label: 'Active Surveys', path: '/surveys', icon: ClipboardList },
        { label: 'Image Upload', path: '/ai/image-upload', icon: Upload }
      ];
      break;
 
    case 'Forest Department Field Panel':
    case 'Forest Department Officer':
      roleGreeting = 'Forest Department Field Panel';
      roleCards = [
        { title: 'Deployed Camera Traps', value: stats?.total_camera_traps ?? 0, icon: Camera, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-955/30 border-teal-200 dark:border-teal-900/30', path: '/camera-traps' },
        { title: 'Deployed Audio Sensors', value: stats?.total_audio_sensors ?? 0, icon: Volume2, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-955/30 border-cyan-200 dark:border-cyan-900/30', path: '/audio-sensors' },
        { title: 'Active Surveys', value: stats?.total_surveys ?? 0, icon: ClipboardList, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-955/30 border-blue-200 dark:border-blue-900/30', path: '/surveys' },
        { title: 'Unverified Observations', value: stats?.unverified_observations ?? 0, icon: AlertTriangle, color: 'text-orange-605 dark:text-orange-405 bg-orange-50 dark:bg-orange-955/30 border-orange-200 dark:border-orange-900/30', path: '/observations' }
      ];
      roleActions = [
        { label: 'Submit Field Log', path: '/observations', icon: Plus },
        { label: 'Configure Hardware Node', path: '/camera-traps', icon: Camera },
        { label: 'Audio Sensor Logs', path: '/audio-sensors', icon: Volume2 }
      ];
      break;
  }

  const hasData = stats?.total_surveys > 0 && stats?.recent_observations?.length > 0;

  const chartData = stats?.chart_data || [
    { name: 'Mon', count: 0 },
    { name: 'Tue', count: 0 },
    { name: 'Wed', count: 0 },
    { name: 'Thu', count: 0 },
    { name: 'Fri', count: 0 },
    { name: 'Sat', count: 0 },
    { name: 'Sun', count: 0 },
  ];

  const deviceDistribution = stats?.device_distribution || [
    { name: 'Active', value: 0, color: '#059669' },
    { name: 'Inactive', value: 0, color: '#475569' },
    { name: 'Maintenance', value: 0, color: '#d97706' }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-805 dark:text-slate-100 font-sans">
      
      {/* Dynamic Welcoming Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-405 uppercase tracking-widest block">
            {roleGreeting}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            System Operations Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-semibold">
            Wildlife Population Intelligence System — India Deployment. Logged in as <span className="font-extrabold text-slate-950 dark:text-slate-200">{user?.username}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-955/40 border border-rose-200 dark:border-rose-900/30 p-4 text-sm text-rose-600 dark:text-rose-450 font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Role specific dynamic cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {roleCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title} 
              onClick={() => card.path && navigate(card.path)}
              className={`glass-card p-5 flex items-center justify-between border-slate-200 dark:border-slate-805 shadow-sm transition-all ${
                card.path ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-slate-50/20 dark:hover:bg-slate-900/10' : ''
              }`}
            >
              <div className="space-y-1">
                <span className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  {card.title}
                </span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {card.value}
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Role specific quick action shortcuts */}
      <div className="glass-card p-6 border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-655 dark:text-slate-400 mb-4">
          Quick Action Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {roleActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.label}
                onClick={() => navigate(act.path)}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all text-left group focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {act.label}
                  </p>
                  <span className="text-4xs text-slate-550 font-bold flex items-center gap-0.5 mt-0.5">
                    Launch Action <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Biodiversity & Ecological Indicators */}
      <div className="glass-card p-6 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
          Biodiversity & Ecological Indicators
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
            <span className="text-4xs uppercase tracking-wider text-slate-500 font-bold block mb-1">Shannon Index</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{stats?.shannon_diversity_index ?? "0.0"}</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
            <span className="text-4xs uppercase tracking-wider text-slate-500 font-bold block mb-1">Simpson Index</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{stats?.simpson_diversity_index ?? "0.0"}</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
            <span className="text-4xs uppercase tracking-wider text-slate-500 font-bold block mb-1">Richness</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{stats?.species_richness ?? 0} spp</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
            <span className="text-4xs uppercase tracking-wider text-slate-500 font-bold block mb-1">Total Animals</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{stats?.total_animal_count ?? 0}</span>
          </div>
          <div className="p-4 rounded-xl border border-rose-250/60 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-950/5">
            <span className="text-4xs uppercase tracking-wider text-rose-550 font-bold block mb-1">Endangered</span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400">{stats?.endangered_species_count ?? 0}</span>
          </div>
          <div className="p-4 rounded-xl border border-amber-250/60 dark:border-amber-900/30 bg-amber-50/10 dark:bg-amber-950/5">
            <span className="text-4xs uppercase tracking-wider text-amber-550 font-bold block mb-1">Vulnerable</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400">{stats?.vulnerable_species_count ?? 0}</span>
          </div>
          <div className="p-4 rounded-xl border border-emerald-250/60 dark:border-emerald-900/30 bg-emerald-50/10 dark:bg-emerald-950/5">
            <span className="text-4xs uppercase tracking-wider text-emerald-550 font-bold block mb-1">Least Concern</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-405">{stats?.least_concern_count ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Interactive Map and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Container */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between min-h-[420px] relative overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Interactive Siting Map</h3>
            <p className="text-2xs text-slate-600 dark:text-slate-400 mt-0.5 font-semibold">Active field nodes and camera trap deployments across Indian tiger reserves</p>
          </div>

          <div className="flex-1 w-full rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-800 min-h-[300px] shadow-inner">
            {sites.length > 0 ? (
              <div ref={mapRef} className="absolute inset-0" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-950/30">
                <MapPin className="h-10 w-10 text-slate-400 dark:text-slate-650 animate-bounce mb-3" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Monitoring Sites Configured</h4>
                <p className="text-2xs text-slate-600 dark:text-slate-400 text-center max-w-xs mt-1.5 leading-relaxed font-semibold">
                  Go to Monitoring Sites section and register coordinates. They will automatically render as interactive pins on this Leaflet tracking module.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Device Status chart */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[420px] border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Telemetry Node Distribution</h3>
            <p className="text-2xs text-slate-600 dark:text-slate-400 mt-0.5 font-semibold">Physical device status ratios across all blocks</p>
          </div>

          {stats?.total_camera_traps > 0 || stats?.total_audio_sensors > 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center py-6">
              <div className="h-36 w-36 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {deviceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                    {parseInt(stats.total_camera_traps) + parseInt(stats.total_audio_sensors)}
                  </span>
                  <span className="text-4xs font-bold text-slate-550 uppercase tracking-widest">Nodes</span>
                </div>
              </div>

              {/* Legends */}
              <div className="w-full space-y-2 mt-6">
                {deviceDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-655 dark:text-slate-400 font-semibold">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name} Devices</span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Camera className="h-10 w-10 text-slate-400 dark:text-slate-655 mb-2" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-400">No Deployed Hardware Nodes</h4>
              <p className="text-4xs text-slate-550 mt-1 text-center max-w-[200px] font-semibold">Register camera traps or audio sensors to generate battery and connection stats.</p>
            </div>
          )}
        </div>
      </div>

      {/* Overview Analytics charts and Recent Observations split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Area Chart widget */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between min-h-[380px] border-slate-205 dark:border-slate-800 shadow-sm">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Observations Overview</h3>
            <p className="text-2xs text-slate-600 dark:text-slate-400 mt-0.5 font-semibold">Sighting metrics logged over the past week</p>
          </div>

          <div className="flex-1 h-64 mt-6">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} />
                  <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                      borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                      borderRadius: '12px',
                      color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
                    }} 
                  />
                  <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-202 dark:border-slate-800">
                <TrendingUp className="h-8 w-8 text-slate-400 dark:text-slate-655 mb-2" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-400">Awaiting Observation Data</h4>
                <p className="text-4xs text-slate-550 mt-1 text-center max-w-xs font-semibold">Once you create surveys and submit observations, this panel will chart weekly species sightings trends.</p>
              </div>
            )}
          </div>
        </div>

        {/* Observations Table */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[380px] border-slate-205 dark:border-slate-800 shadow-sm">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Recent Sightings Log</h3>
            <p className="text-2xs text-slate-600 dark:text-slate-400 mt-0.5 font-semibold">Telemetry uploads from active surveys</p>
          </div>

          <div className="flex-1 mt-6 overflow-y-auto space-y-3.5 max-h-[260px] pr-1">
            {stats?.recent_observations && stats.recent_observations.length > 0 ? (
              stats.recent_observations.map((obs) => (
                <div key={obs.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/45 hover:border-emerald-500/20 transition-all flex items-center justify-between gap-3 shadow-xs">
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {obs.species_name === "Unknown Species" ? "Species Requires Verification" : (obs.species_name || obs.species || "False Trigger / Unknown")}
                    </p>
                    <span className="text-4xs text-slate-550 dark:text-slate-400 font-bold flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {obs.timestamp || obs.observation_datetime ? formatIST(obs.timestamp || obs.observation_datetime) : '—'}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-300">
                      x{obs.count}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-202 dark:border-slate-800">
                <Clock className="h-8 w-8 text-slate-400 dark:text-slate-655 mb-2 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-400">No Logged Entries</h4>
                <p className="text-4xs text-slate-550 mt-1 text-center max-w-[180px] font-semibold">Submit species sightings under observations registry.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Biodiversity Timeline & Distribution charts */}
      {stats?.detection_distribution?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 min-h-[340px] border-slate-205 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Detection Distribution</h3>
              <p className="text-2xs text-slate-600 dark:text-slate-400 mt-0.5 font-semibold">Total count detected by individual species</p>
            </div>
            <div className="h-64 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.detection_distribution.map(d => ({ name: d.species, count: d.count }))} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={9} interval={0} tickLine={false} />
                  <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                      borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                      borderRadius: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 min-h-[340px] border-slate-205 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Detection Timeline</h3>
              <p className="text-2xs text-slate-655 dark:text-slate-400 mt-0.5 font-semibold">Detections timeline trend across observation history</p>
            </div>
            <div className="h-64 mt-6">
              {stats?.detection_timeline?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.detection_timeline.map(t => ({ name: t.date, count: t.count }))} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} />
                    <YAxis stroke={theme === 'dark' ? '#64748b' : '#475569'} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                        borderColor: theme === 'dark' ? '#1e293b' : '#cbd5e1',
                        borderRadius: '12px'
                      }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-202 dark:border-slate-805">
                  Awaiting timeline data...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
