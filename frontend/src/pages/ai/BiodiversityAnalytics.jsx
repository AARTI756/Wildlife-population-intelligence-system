import React, { useEffect, useState } from 'react';
import { 
  BarChart4, Sparkles, AlertCircle, Loader2, Compass, Activity, 
  MapPin, Eye, Camera, Volume2, Shield 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { getBiodiversitySummary } from '../../services/biodiversityAnalyticsService';

const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

const BiodiversityAnalytics = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [includeUnknown, setIncludeUnknown] = useState(false);

  useEffect(() => {
    setLoading(true);
    getBiodiversitySummary(includeUnknown)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Biodiversity telemetry could not be resolved from server.');
        setLoading(false);
      });
  }, [includeUnknown]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-emerald-500 font-sans">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3 text-lg font-bold">Retrieving Ecological Telemetry...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-rose-50 dark:bg-rose-955/40 border border-rose-200 dark:border-rose-900/30 p-5 text-xs text-rose-800 dark:text-rose-455 font-semibold max-w-7xl mx-auto">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold font-sans">Analytics Service Offline</p>
          <p className="font-medium font-sans">{error}</p>
        </div>
      </div>
    );
  }

  const sensorData = data ? [
    { name: 'Camera Traps', value: data.camera_trap_statistics },
    { name: 'Audio Sensors', value: data.acoustic_statistics }
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in text-slate-805 dark:text-slate-100 font-sans max-w-7xl mx-auto">
      {/* Page Header */}
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

        {/* Include Unknown Species Toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-705 dark:text-slate-350 text-xs font-bold bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors shrink-0">
          <input 
            type="checkbox"
            checked={includeUnknown}
            onChange={(e) => setIncludeUnknown(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 h-4 w-4"
          />
          <span>Include Unknown Species</span>
        </label>
      </div>

      {data && (
        <>
          {/* Section 1: Core Indices Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Richness */}
            <div className="glass-card p-5 border-l-4 border-l-emerald-500 relative overflow-hidden bg-white dark:bg-slate-950">
              <span className="block text-4xs font-black uppercase tracking-wider text-slate-400">Species Richness</span>
              <strong className="block text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                {data.species_richness}
              </strong>
              <span className="block text-5xs text-slate-450 dark:text-slate-500 font-bold mt-1.5 uppercase">Unique Species catalogued</span>
            </div>

            {/* Shannon */}
            <div className="glass-card p-5 border-l-4 border-l-cyan-500 relative overflow-hidden bg-white dark:bg-slate-950">
              <span className="block text-4xs font-black uppercase tracking-wider text-slate-400">Shannon Diversity Index</span>
              <strong className="block text-3xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight mt-1">
                {data.shannon_diversity_index}
              </strong>
              <span className="block text-5xs text-slate-450 dark:text-slate-500 font-bold mt-1.5 uppercase">Ecosystem stability rating</span>
            </div>

            {/* Simpson */}
            <div className="glass-card p-5 border-l-4 border-l-indigo-500 relative overflow-hidden bg-white dark:bg-slate-950">
              <span className="block text-4xs font-black uppercase tracking-wider text-slate-400">Simpson's Index</span>
              <strong className="block text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight mt-1">
                {data.simpson_diversity_index}
              </strong>
              <span className="block text-5xs text-slate-450 dark:text-slate-500 font-bold mt-1.5 uppercase">Species dominance score</span>
            </div>

            {/* Threatened */}
            <div className="glass-card p-5 border-l-4 border-l-rose-500 relative overflow-hidden bg-white dark:bg-slate-950">
              <span className="block text-4xs font-black uppercase tracking-wider text-slate-400">Threatened Species</span>
              <strong className={`block text-3xl font-black tracking-tight mt-1 ${data.endangered_species_count > 0 ? 'text-rose-600 dark:text-rose-455' : 'text-slate-900 dark:text-white'}`}>
                {data.endangered_species_count}
              </strong>
              <span className="block text-5xs text-slate-450 dark:text-slate-500 font-bold mt-1.5 uppercase">Vulnerable or endangered</span>
            </div>

          </div>

          {/* Section 2: Visual Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Species Abundance */}
            <section className="glass-card p-5 h-96 bg-white dark:bg-slate-950 flex flex-col justify-between shadow-xs border-slate-205 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-705 dark:text-slate-300">Species Abundance Distribution</h3>
                <p className="text-4xs text-slate-400 uppercase font-mono tracking-widest mt-0.5">Census count mapping by biological species</p>
              </div>
              <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.species_frequency} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="species" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      labelClassName="font-extrabold"
                    />
                    <Bar dataKey="observations" fill="#10b981" radius={[4, 4, 0, 0]}>
                      {data.species_frequency.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Chart 2: Monthly Timeline */}
            <section className="glass-card p-5 h-96 bg-white dark:bg-slate-950 flex flex-col justify-between shadow-xs border-slate-205 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-705 dark:text-slate-300">Sighting Frequency Timeline</h3>
                <p className="text-4xs text-slate-400 uppercase font-mono tracking-widest mt-0.5">Observed population increments grouped by month</p>
              </div>
              <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthly_detections} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="detections" stroke="#10b981" strokeWidth={3.5} dot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

          </div>

          {/* Section 3: Hardware Sensor Distribution & Habitat Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sensor Breakdown */}
            <div className="glass-card p-5 bg-white dark:bg-slate-950 shadow-xs border-slate-205 dark:border-slate-800 lg:col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-705 dark:text-slate-300">Hardware Nodes telemetry</h3>
                <p className="text-4xs text-slate-400 uppercase font-mono tracking-widest mt-0.5">Camera Traps (Image) vs Audio Sensors (Acoustic)</p>
              </div>
              
              <div className="h-52 flex justify-center items-center mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sensorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#6366f1" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-500">Camera Trap ({data.camera_trap_statistics})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-slate-500">Audio Sensor ({data.acoustic_statistics})</span>
                </div>
              </div>
            </div>

            {/* Habitat Utilization */}
            <div className="glass-card p-5 bg-white dark:bg-slate-950 shadow-xs border-slate-205 dark:border-slate-800 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-705 dark:text-slate-300">Habitat Utilization breakdown</h3>
                <p className="text-4xs text-slate-400 uppercase font-mono tracking-widest mt-0.5">Wildlife distribution counts mapped across survey biomes</p>
              </div>

              <div className="mt-5 space-y-3.5">
                {data.habitat_utilization && data.habitat_utilization.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No habitat data catalogued.</p>
                ) : (
                  data.habitat_utilization.map((h, i) => {
                    const totalDetections = data.observation_count || 1;
                    const percent = Math.round((h.observations / totalDetections) * 100);
                    return (
                      <div key={i} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold text-slate-655 dark:text-slate-400">
                          <span className="capitalize">{h.habitat}</span>
                          <span>{h.observations} observations ({percent}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="pt-4 text-3xs text-slate-400 font-mono uppercase tracking-widest">
                Calculated over {data.observation_count} total reserve sightings
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default BiodiversityAnalytics;
