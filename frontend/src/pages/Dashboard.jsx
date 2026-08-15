import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import EcosystemHealthCard from '../components/common/EcosystemHealthCard';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { INDIA_MAP_CENTER, INDIA_MAP_ZOOM, formatIST, localizeSpeciesName } from '../utils/india';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, BarChart, Bar
} from 'recharts';
import {
  ClipboardList, MapPin, Camera, Volume2, Eye, Clock, Loader2,
  AlertCircle, AlertTriangle, Users, Cpu, BrainCircuit, TrendingUp,
  Shield, ArrowUpRight, Plus, Settings, Upload, Leaf, Activity,
  FileText, Download, CheckCircle, Zap, BookOpen, ChevronRight
} from 'lucide-react';

const PRIORITY_BADGE = {
  'Critical': 'bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30',
  'High': 'bg-orange-50 dark:bg-orange-955/20 text-orange-700 dark:text-orange-400 border-orange-200',
  'Medium': 'bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400 border-amber-200',
  'Low': 'bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-400 border-emerald-200',
};

// ─── Shared utility components ─────────────────────────────────────────────────

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-4">
    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{title}</h3>
    {subtitle && <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">{subtitle}</p>}
  </div>
);

const EmptyState = ({ icon: Icon, title, desc }) => (
  <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
    <Icon className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400">{title}</h4>
    {desc && <p className="text-4xs text-slate-450 mt-1 max-w-xs font-semibold leading-relaxed">{desc}</p>}
  </div>
);

const MetricTile = ({ label, value, color = 'text-slate-900 dark:text-white' }) => (
  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50">
    <span className="text-4xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mb-1">{label}</span>
    <span className={`text-lg font-black ${color}`}>{value ?? '—'}</span>
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`glass-card p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm ${className}`}>
    {children}
  </div>
);

const SummaryCard = ({ title, value, icon: Icon, color, path, onClick }) => (
  <div
    onClick={onClick || undefined}
    className={`glass-card p-5 flex items-center justify-between border-slate-200 dark:border-slate-800 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:border-emerald-500/40' : ''}`}
  >
    <div className="space-y-1">
      <span className="text-2xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">{title}</span>
      <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</p>
    </div>
    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
  </div>
);

// ─── Wildlife Researcher Dashboard ─────────────────────────────────────────────

const ResearcherDashboard = ({ stats, healthData, sites, popSpecies, habitatClass, endangeredSpecies, navigate }) => {
  const totalAnimals = stats?.total_animal_count || 0;

  const relativeAbundance = (stats?.detection_distribution || []).map(d => ({
    ...d,
    pct: totalAnimals > 0 ? ((d.count / totalAnimals) * 100).toFixed(2) : '0.00'
  })).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard title="Total Observations" value={stats?.total_observations ?? 0} icon={Eye} color="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/30 border-emerald-200" onClick={() => navigate('/observations')} />
        <SummaryCard title="Unique Species" value={stats?.species_count ?? 0} icon={BrainCircuit} color="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-955/30 border-blue-200" onClick={() => navigate('/ai/biodiversity')} />
        <SummaryCard title="Today's Observations" value={stats?.todays_observations ?? 0} icon={Clock} color="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/30 border-amber-200" onClick={() => navigate('/observations')} />
        <SummaryCard title="Unverified Records" value={stats?.unverified_observations ?? 0} icon={AlertTriangle} color="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-955/30 border-orange-200" onClick={() => navigate('/observations')} />
      </div>

      {/* Quick Actions */}
      <Card>
        <SectionHeader title="Quick Actions" subtitle="Researcher workflow shortcuts" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Log Observation', path: '/observations', icon: Eye },
            { label: 'Create Survey', path: '/surveys', icon: ClipboardList },
            { label: 'Upload Image', path: '/ai/image-upload', icon: Upload },
            { label: 'View Reports', path: '/reports', icon: FileText },
          ].map(a => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={() => navigate(a.path)} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all text-left group focus:outline-none">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 transition-colors">{a.label}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Biodiversity Indicators + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <SectionHeader title="Biodiversity Indicators" subtitle="Calculated from actual observation database" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <MetricTile label="Shannon Index (H')" value={stats?.shannon_diversity_index && parseFloat(stats.shannon_diversity_index) > 0 ? parseFloat(stats.shannon_diversity_index).toFixed(3) : 'Insufficient data'} color="text-emerald-700 dark:text-emerald-400" />
              <MetricTile label="Simpson Index (D)" value={stats?.simpson_diversity_index && parseFloat(stats.simpson_diversity_index) > 0 ? parseFloat(stats.simpson_diversity_index).toFixed(3) : 'Insufficient data'} color="text-blue-700 dark:text-blue-400" />
              <MetricTile label="Species Richness" value={stats?.species_richness ? `${stats.species_richness} spp` : 'Not available'} color="text-teal-700 dark:text-teal-400" />
              <MetricTile label="Total Animals" value={totalAnimals > 0 ? totalAnimals.toLocaleString() : 'Not available'} />
              <MetricTile label="Endangered (obs)" value={stats?.endangered_species_count ?? '—'} color="text-rose-600 dark:text-rose-400" />
              <MetricTile label="Vulnerable (obs)" value={stats?.vulnerable_species_count ?? '—'} color="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider">For full biodiversity analytics</span>
              <button onClick={() => navigate('/reports')} className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                Open Reports Center <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <EcosystemHealthCard healthData={healthData} />
        </div>
      </div>

      {/* Population Analytics Table */}
      <Card>
        <SectionHeader title="Population Analytics" subtitle="Species-level estimated population from observation modelling" />
        {popSpecies.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 text-[10px] uppercase tracking-wider font-black border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3">Species</th>
                  <th className="p-3">Taxon Class</th>
                  <th className="p-3">IUCN Status</th>
                  <th className="p-3 text-right">Observations</th>
                  <th className="p-3 text-right">Est. Population</th>
                  <th className="p-3 text-right">Density (ind/km²)</th>
                  <th className="p-3 text-right">Detection Freq</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {popSpecies.slice(0, 10).map((sp, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{localizeSpeciesName(sp.species_name)}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{sp.taxon_class || '—'}</td>
                    <td className="p-3">
                      {sp.iucn_status ? (
                        <span className={`px-1.5 py-0.5 rounded text-5xs font-bold uppercase border ${PRIORITY_BADGE[sp.iucn_status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {sp.iucn_status}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-3 text-right font-semibold">{sp.observation_count ?? 0}</td>
                    <td className="p-3 text-right font-semibold">{sp.estimated_population?.toLocaleString() ?? '—'}</td>
                    <td className="p-3 text-right font-semibold">{sp.population_density != null ? sp.population_density.toFixed(2) : '—'}</td>
                    <td className="p-3 text-right font-semibold">{sp.detection_frequency != null ? `${sp.detection_frequency.toFixed(1)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={TrendingUp} title="No population data available" desc="Create surveys and log species observations to generate population estimates." />
        )}
      </Card>

      {/* Relative Abundance + Observation Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeader title="Relative Species Abundance" subtitle="Percentage of total observations per species" />
          {relativeAbundance.length > 0 ? (
            <div className="space-y-2.5 mt-2">
              {relativeAbundance.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="truncate max-w-[180px]">{localizeSpeciesName(d.species)}</span>
                    <span className="font-bold tabular-nums">{d.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Activity} title="No observation data" desc="Log observations to see relative species abundance." />
          )}
        </Card>

        <Card>
          <SectionHeader title="Weekly Observation Trend" subtitle="Sightings logged per day over the past 7 days" />
          <div className="h-56 mt-4">
            {(stats?.chart_data || []).some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chart_data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#resGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={TrendingUp} title="Awaiting observation data" desc="Submit observations to chart weekly sighting trends." />
            )}
          </div>
        </Card>
      </div>

      {/* Habitat Insights */}
      <Card>
        <SectionHeader title="Habitat Insights" subtitle="Biome classification coverage from monitoring site data" />
        {habitatClass.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 text-[10px] uppercase tracking-wider font-black border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3">Biome Type</th>
                  <th className="p-3 text-right">Coverage (%)</th>
                  <th className="p-3 text-right">Observations</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {habitatClass.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{h.name || '—'}</td>
                    <td className="p-3 text-right font-semibold">{h.value != null ? `${h.value.toFixed(1)}%` : '—'}</td>
                    <td className="p-3 text-right font-semibold">{h.observations ?? 0}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-5xs font-bold uppercase border ${h.value < 5.0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-250'}`}>
                        {h.value < 5.0 ? 'Low Coverage' : 'Stable'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Leaf} title="No habitat data available" desc="Register monitoring sites with habitat information to view biome coverage analysis." />
        )}
      </Card>

      {/* Endangered Species Summary */}
      <Card>
        <SectionHeader title="Threatened Species Summary" subtitle="Species with IUCN threatened/endangered status observed in surveys" />
        {endangeredSpecies.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 text-[10px] uppercase tracking-wider font-black border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3">Species</th>
                  <th className="p-3">IUCN Status</th>
                  <th className="p-3 text-right">Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {endangeredSpecies.map((e, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{localizeSpeciesName(e.species_name)}</td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded text-5xs font-bold uppercase border bg-rose-50 text-rose-700 border-rose-200">
                        {e.iucn_status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-semibold">{e.observation_count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Shield} title="No threatened species recorded" desc="No species with IUCN threatened status have been logged in the current observation database." />
        )}
      </Card>
    </div>
  );
};

// ─── Conservation Officer Dashboard ─────────────────────────────────────────────

const ConservationDashboard = ({ stats, healthData, consActions, consPriorities, navigate }) => (
  <div className="space-y-6">
    {/* Summary Cards */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <SummaryCard title="Protected Reserves" value={stats?.total_sites ?? 0} icon={MapPin} color="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-955/30 border-blue-200" onClick={() => navigate('/sites')} />
      <SummaryCard title="Active Surveys" value={stats?.total_surveys ?? 0} icon={ClipboardList} color="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/30 border-emerald-200" onClick={() => navigate('/surveys')} />
      <SummaryCard title="Endangered Observations" value={stats?.endangered_species_count ?? 0} icon={AlertTriangle} color="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-955/30 border-rose-200" />
      <SummaryCard title="Vulnerable Observations" value={stats?.vulnerable_species_count ?? 0} icon={Shield} color="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-955/30 border-amber-200" />
    </div>

    {/* Quick Actions */}
    <Card>
      <SectionHeader title="Quick Actions" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Conservation Maps', path: '/sites', icon: MapPin },
          { label: 'Active Surveys', path: '/surveys', icon: ClipboardList },
          { label: 'Upload Field Images', path: '/ai/image-upload', icon: Upload },
          { label: 'Generate Report', path: '/reports', icon: FileText },
        ].map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => navigate(a.path)} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all text-left group focus:outline-none">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 transition-colors">{a.label}</p>
            </button>
          );
        })}
      </div>
    </Card>

    {/* Ecosystem Health + Threat Monitoring */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <EcosystemHealthCard healthData={healthData} />
      </div>
      <div className="lg:col-span-2">
        <Card className="h-full">
          <SectionHeader title="Threat Monitoring" subtitle="IUCN-flagged species observations and conservation status" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile label="Shannon Index (H')" value={stats?.shannon_diversity_index && parseFloat(stats.shannon_diversity_index) > 0 ? parseFloat(stats.shannon_diversity_index).toFixed(3) : 'Insufficient data'} color="text-emerald-700 dark:text-emerald-400" />
            <MetricTile label="Endangered (ind. observed)" value={stats?.endangered_species_count ?? '—'} color="text-rose-600 dark:text-rose-400" />
            <MetricTile label="Vulnerable (ind. observed)" value={stats?.vulnerable_species_count ?? '—'} color="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-3xs text-slate-400 font-semibold">
              Observation counts reflect actual database records filtered by IUCN species profile status.
              Use the Reports Center to generate full Biodiversity or Conservation PDF/XLSX reports.
            </p>
          </div>
        </Card>
      </div>
    </div>

    {/* Conservation Priorities */}
    <Card>
      <SectionHeader title="Conservation Priorities" subtitle="Generated from the conservation recommendation engine" />
      {consPriorities.length > 0 ? (
        <div className="space-y-3">
          {consPriorities.slice(0, 6).map((p, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
              <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded text-5xs font-black uppercase border ${PRIORITY_BADGE[p.priority] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {p.priority || 'Low'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{p.species_name ? localizeSpeciesName(p.species_name) : (p.site_name || 'Reserve-wide')}</p>
                <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">{p.recommendation || p.action || '—'}</p>
              </div>
              <span className="shrink-0 text-4xs font-bold text-slate-400">{p.timeline || p.completion_time || '—'}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={CheckCircle} title="No active conservation priorities" desc="The recommendation engine found no critical conservation priorities in the current dataset." />
      )}
    </Card>

    {/* Actionable Recommendations */}
    <Card>
      <SectionHeader title="Actionable Restoration Recommendations" subtitle="Engine-generated priority actions derived from observation and habitat data" />
      {consActions.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 text-[10px] uppercase tracking-wider font-black border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Action</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Department</th>
                <th className="p-3">Est. Cost</th>
                <th className="p-3">Timeline</th>
                <th className="p-3">Expected Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {consActions.map((a, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  <td className="p-3 font-bold text-slate-900 dark:text-white max-w-xs">{a.title}</td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.5 rounded text-5xs font-bold uppercase border ${PRIORITY_BADGE[a.priority] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {a.priority || '—'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 font-semibold">{a.department || 'Forest Dept'}</td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{a.estimated_cost || '—'}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 font-semibold">{a.completion_time || '—'}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 font-semibold">{a.expected_impact || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Zap} title="No actionable recommendations generated" desc="The conservation engine requires species observations and habitat data to generate recommendations." />
      )}
    </Card>

    {/* Species Trend */}
    <Card>
      <SectionHeader title="Species Trend Analysis" subtitle="Observation timeline derived from actual survey database records" />
      {(stats?.detection_timeline || []).length > 0 ? (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.detection_timeline.map(t => ({ name: t.date, count: t.count }))} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.12} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState icon={TrendingUp} title="Insufficient historical trend data" desc="No observation timeline data exists yet. Submit species observations across multiple dates to generate a trend chart." />
      )}
    </Card>
  </div>
);

// ─── Forest Department Dashboard ─────────────────────────────────────────────────

const ForestDeptDashboard = ({ stats, sites, surveys, notifications, observations, navigate }) => {
  // Calculate site activity: count observations per monitoring site
  const siteActivityMap = {};
  (observations || []).forEach(obs => {
    const key = obs.monitoring_site_id;
    if (key != null) siteActivityMap[key] = (siteActivityMap[key] || 0) + 1;
  });

  const siteRows = (sites || []).map(s => ({
    ...s,
    obs_count: siteActivityMap[s.id] || 0
  })).sort((a, b) => b.obs_count - a.obs_count);

  const criticalAlerts = (notifications || []).filter(n => n.severity === 'Critical' || n.severity === 'Warning');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard title="Monitoring Sites" value={stats?.total_sites ?? 0} icon={MapPin} color="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/30 border-emerald-200" onClick={() => navigate('/sites')} />
        <SummaryCard title="Camera Traps" value={stats?.total_camera_traps ?? 0} icon={Camera} color="text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-955/30 border-teal-200" onClick={() => navigate('/camera-traps')} />
        <SummaryCard title="Audio Sensors" value={stats?.total_audio_sensors ?? 0} icon={Volume2} color="text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-955/30 border-cyan-200" onClick={() => navigate('/audio-sensors')} />
        <SummaryCard title="Critical Alerts" value={criticalAlerts.length} icon={AlertTriangle} color="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-955/30 border-rose-200" />
      </div>

      {/* Quick Actions */}
      <Card>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Submit Field Log', path: '/observations', icon: Plus },
            { label: 'Hardware Nodes', path: '/camera-traps', icon: Camera },
            { label: 'Audio Sensors', path: '/audio-sensors', icon: Volume2 },
            { label: 'Active Surveys', path: '/surveys', icon: ClipboardList },
          ].map(a => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={() => navigate(a.path)} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all text-left group focus:outline-none">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 transition-colors">{a.label}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Protected Area Monitoring + Patrol Planning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeader title="Protected Area Monitoring" subtitle="Monitoring site activity derived from logged observations" />
          {siteRows.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 text-[10px] uppercase tracking-wider font-black border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3">Site Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Observations</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {siteRows.slice(0, 6).map((s, i) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{s.name}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-5xs font-bold uppercase border ${s.protected_area ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {s.protected_area ? 'Protected' : 'Buffer'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold">{s.obs_count}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-5xs font-bold uppercase border ${s.obs_count > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          {s.obs_count > 0 ? 'Active' : 'Idle'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={MapPin} title="No monitoring sites configured" desc="Register monitoring sites to track protected area activity." />
          )}
        </Card>

        <Card>
          <SectionHeader title="Patrol Beat Planner" subtitle="Beats generated from monitoring site data and active alerts. Note: Patrol schedules are planning-only; not stored in the database." />
          {siteRows.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 text-[10px] uppercase tracking-wider font-black border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3">Patrol Zone</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {siteRows.slice(0, 5).map(s => {
                    const hasAlert = criticalAlerts.some(n => n.message?.includes(s.name));
                    const isHighActivity = s.obs_count > 5;
                    const priority = hasAlert ? 'Critical' : isHighActivity ? 'High' : 'Standard';
                    const basis = hasAlert ? 'Active alert' : isHighActivity ? `${s.obs_count} observations` : 'Scheduled beat';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{s.name}</td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded text-5xs font-bold uppercase border ${PRIORITY_BADGE[priority] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>{priority}</span>
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 font-semibold">{basis}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Cpu} title="No zones configured" desc="Register monitoring sites to generate patrol zone assignments." />
          )}
        </Card>
      </div>

      {/* Wildlife Movement Analysis */}
      <Card>
        <SectionHeader title="Wildlife Movement Analysis" subtitle="Observation concentration by monitoring site — Note: True GPS movement trajectories are not available in the current dataset. This shows observation distribution only." />
        {siteRows.filter(s => s.obs_count > 0).length > 0 ? (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={siteRows.filter(s => s.obs_count > 0).slice(0, 10).map(s => ({ name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name, count: s.obs_count }))} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: 12 }} />
                <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState icon={Activity} title="No site-level observation data" desc="Log observations linked to monitoring sites to see activity concentration by area." />
        )}
      </Card>

      {/* Incident Log */}
      <Card>
        <SectionHeader title="Incident & Alert Log" subtitle="Active critical and warning notifications from monitoring hardware" />
        {criticalAlerts.length > 0 ? (
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {criticalAlerts.slice(0, 8).map(n => (
              <div key={n.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/45 flex items-start justify-between gap-3">
                <div>
                  <span className="text-4xs font-bold text-slate-400 block">{n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : '—'}</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">{n.category || 'Alert'}</p>
                  <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">{n.message}</p>
                </div>
                <span className={`shrink-0 text-5xs font-black uppercase px-2 py-0.5 rounded border ${n.severity === 'Critical' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>{n.severity}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={CheckCircle} title="No active incidents" desc="No critical or warning-level incidents are currently logged. The monitoring system is operating normally." />
        )}
      </Card>
    </div>
  );
};

// ─── Administrator Dashboard ─────────────────────────────────────────────────────

const AdminDashboard = ({ stats, usersList, reportsHistory, navigate }) => (
  <div className="space-y-6">
    {/* Summary Cards */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <SummaryCard title="Registered Users" value={usersList.length || stats?.total_users || 0} icon={Users} color="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/30 border-emerald-200" onClick={() => navigate('/users')} />
      <SummaryCard title="Monitoring Sites" value={stats?.total_sites ?? 0} icon={MapPin} color="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-955/30 border-blue-200" onClick={() => navigate('/sites')} />
      <SummaryCard title="Camera Traps" value={stats?.total_camera_traps ?? 0} icon={Camera} color="text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-955/30 border-teal-200" onClick={() => navigate('/camera-traps')} />
      <SummaryCard title="Audio Sensors" value={stats?.total_audio_sensors ?? 0} icon={Volume2} color="text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-955/30 border-cyan-200" onClick={() => navigate('/audio-sensors')} />
    </div>

    {/* Quick Actions */}
    <Card>
      <SectionHeader title="Administration Actions" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Register Account', path: '/register', icon: Plus },
          { label: 'Manage User Roles', path: '/users', icon: Shield },
          { label: 'Add Monitoring Site', path: '/sites', icon: MapPin },
          { label: 'Configure Settings', path: '/settings', icon: Settings },
        ].map(a => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => navigate(a.path)} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all text-left group focus:outline-none">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 transition-colors">{a.label}</p>
            </button>
          );
        })}
      </div>
    </Card>

    {/* Platform Analytics Grid */}
    <Card>
      <SectionHeader title="Platform Analytics" subtitle="Live database metrics across the entire WPIS deployment" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricTile label="Total Observations" value={stats?.total_observations?.toLocaleString() ?? '—'} color="text-emerald-700 dark:text-emerald-400" />
        <MetricTile label="Unique Species" value={stats?.species_count ?? '—'} color="text-blue-700 dark:text-blue-400" />
        <MetricTile label="Total Surveys" value={stats?.total_surveys ?? '—'} />
        <MetricTile label="Unverified Records" value={stats?.unverified_observations ?? '—'} color="text-amber-600 dark:text-amber-400" />
        <MetricTile label="Uploaded Images" value={stats?.total_uploaded_images ?? '—'} />
        <MetricTile label="Uploaded Audio" value={stats?.total_uploaded_audio ?? '—'} />
        <MetricTile label="AI Img Predictions" value={stats?.ai_image_predictions ?? '—'} />
        <MetricTile label="AI Audio Predictions" value={stats?.ai_audio_predictions ?? '—'} />
      </div>
    </Card>

    {/* User Management */}
    <Card>
      <SectionHeader title="User Management" subtitle="All registered system accounts — Administrator access only" />
      {usersList.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 text-[10px] uppercase tracking-wider font-black border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Username</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role(s)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usersList.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{u.username}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 font-semibold">{u.email}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(u.roles || []).map(r => (
                        <span key={r.id} className="px-1.5 py-0.5 rounded text-5xs font-bold uppercase border bg-blue-50 text-blue-700 border-blue-200">
                          {r.name}
                        </span>
                      ))}
                      {(!u.roles || u.roles.length === 0) && <span className="text-slate-400">—</span>}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.5 rounded text-5xs font-bold uppercase border ${u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => navigate('/users')} className="text-emerald-600 dark:text-emerald-400 text-3xs font-bold hover:underline flex items-center gap-0.5 ml-auto">
                      Manage <ChevronRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={Users} title="No user records loaded" desc="User management requires Administrator access. If you are an Administrator and see this, check API connectivity." />
      )}
    </Card>

    {/* Monitoring System Management */}
    <Card>
      <SectionHeader title="Monitoring System Management" subtitle="Direct access to hardware nodes and survey management" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Camera Traps', count: stats?.total_camera_traps ?? 0, path: '/camera-traps', icon: Camera, active: stats?.active_camera_traps ?? 0 },
          { label: 'Audio Sensors', count: stats?.total_audio_sensors ?? 0, path: '/audio-sensors', icon: Volume2, active: stats?.active_audio_sensors ?? 0 },
          { label: 'Surveys', count: stats?.total_surveys ?? 0, path: '/surveys', icon: ClipboardList, active: null },
          { label: 'Monitoring Sites', count: stats?.total_sites ?? 0, path: '/sites', icon: MapPin, active: null },
          { label: 'Observations', count: stats?.total_observations ?? 0, path: '/observations', icon: Eye, active: null },
          { label: 'Reports Center', count: reportsHistory.length, path: '/reports', icon: FileText, active: null },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} onClick={() => navigate(item.path)} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all cursor-pointer flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-3xs text-slate-500 font-semibold">
                    {item.active != null ? `${item.active} active / ${item.count} total` : `${item.count} records`}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          );
        })}
      </div>
    </Card>

    {/* Recent Reports */}
    <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionHeader title="Recent Report History" subtitle="Last compiled management reports" />
        <button onClick={() => navigate('/reports')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
          Open Reports Center <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {reportsHistory.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 text-[10px] uppercase tracking-wider font-black border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Report Name</th>
                <th className="p-3">Format</th>
                <th className="p-3">Status</th>
                <th className="p-3">Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reportsHistory.slice(0, 8).map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{r.report_name}</td>
                  <td className="p-3"><span className="px-1.5 py-0.5 rounded text-5xs font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{r.format}</span></td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.5 rounded text-5xs font-bold uppercase border ${r.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : r.status === 'Failed' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 font-semibold">{new Date(r.generated_at).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={FileText} title="No reports generated yet" desc="Use the Reports Center to generate PDF, XLSX, or CSV analytical reports." />
      )}
    </Card>
  </div>
);

// ─── Main Dashboard Component ────────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [sites, setSites] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [healthData, setHealthData] = useState(null);

  // Role-specific data states
  const [popSpecies, setPopSpecies] = useState([]);
  const [habitatClass, setHabitatClass] = useState([]);
  const [endangeredSpecies, setEndangeredSpecies] = useState([]);
  const [consActions, setConsActions] = useState([]);
  const [consPriorities, setConsPriorities] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [reportsHistory, setReportsHistory] = useState([]);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const roleName = user?.roles?.[0]?.name || 'Wildlife Researcher';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Core data – fetched for all roles
        const [statsRes, sitesRes, surveysRes, notificationsRes, observationsRes, healthRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/monitoring-sites'),
          api.get('/api/surveys'),
          api.get('/api/notifications'),
          api.get('/api/observations'),
          api.get('/api/health/overview').catch(() => ({ data: null }))
        ]);

        const rawObs = observationsRes.data || [];
        const rawStats = statsRes.data || {};
        const cleanRecentObs = (rawStats.recent_observations || []).map(obs => ({
          ...obs,
          species_name: localizeSpeciesName(obs.species_name || obs.species)
        }));

        setStats({
          ...rawStats,
          total_observations: rawStats.total_observations ?? rawObs.length,
          total_animal_count: rawStats.total_animal_count ?? rawObs.length,
          species_richness: rawStats.species_richness ?? 0,
          species_count: rawStats.species_count ?? 0,
          total_sites: sitesRes.data.length,
          total_surveys: rawStats.total_surveys ?? surveysRes.data.length,
          recent_observations: cleanRecentObs,
          shannon_diversity_index: rawStats.shannon_diversity_index,
          simpson_diversity_index: rawStats.simpson_diversity_index,
        });

        setSites(sitesRes.data || []);
        setSurveys(surveysRes.data || []);
        setNotifications(notificationsRes.data || []);
        setObservations(rawObs);

        if (healthRes?.data) {
          const safeParse = (val, fallback) => {
            if (val == null) return fallback;
            if (typeof val === 'number') return Number.isFinite(val) ? val : fallback;
            const slashIdx = String(val).indexOf('/');
            const strToParse = slashIdx !== -1 ? String(val).slice(0, slashIdx) : String(val);
            const parsed = parseFloat(strToParse);
            return Number.isFinite(parsed) ? parsed : fallback;
          };
          const m = healthRes.data.metrics || {};
          setHealthData({
            overall_score: Number.isFinite(healthRes.data.overallScore) ? healthRes.data.overallScore : 0,
            status: healthRes.data.statusName || 'Moderate Concern',
            component_scores: {
              species_diversity: safeParse(m.speciesDiversity?.trendValue, 0),
              population_stability: safeParse(m.populationStability?.trendValue, 0),
              habitat_quality: safeParse(m.habitatQuality?.trendValue, 0),
              endangered_species: safeParse(m.endangeredSpeciesStatus?.trendValue, 0),
              environmental_conditions: safeParse(m.environmentalConditions?.trendValue, 0),
            }
          });
        }

        // Role-specific fetches
        if (roleName === 'Wildlife Researcher') {
          const [popRes, habRes, endRes] = await Promise.all([
            api.get('/api/population/species').catch(() => ({ data: [] })),
            api.get('/api/habitat/classification').catch(() => ({ data: [] })),
            api.get('/api/biodiversity/endangered').catch(() => ({ data: [] }))
          ]);
          setPopSpecies(popRes.data || []);
          setHabitatClass(habRes.data || []);
          setEndangeredSpecies(endRes.data || []);
        } else if (roleName === 'Conservation Officer') {
          const [actRes, priRes] = await Promise.all([
            api.get('/api/conservation/actions').catch(() => ({ data: [] })),
            api.get('/api/conservation/priorities').catch(() => ({ data: [] }))
          ]);
          setConsActions(actRes.data || []);
          setConsPriorities(priRes.data || []);
        } else if (roleName === 'Administrator') {
          const [usersRes, repRes] = await Promise.all([
            api.get('/api/users').catch(() => ({ data: [] })),
            api.get('/api/reports/history').catch(() => ({ data: [] }))
          ]);
          setUsersList(usersRes.data || []);
          setReportsHistory(repRes.data || []);
        }
      } catch (err) {
        setError('Connection to backend failed. Please ensure services are running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [roleName]);

  // Leaflet Map
  useEffect(() => {
    if (loading || !mapRef.current) return;
    if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }

    let center = INDIA_MAP_CENTER;
    let zoom = INDIA_MAP_ZOOM;
    if (sites.length > 0) {
      const sumLat = sites.reduce((s, x) => s + x.latitude, 0);
      const sumLon = sites.reduce((s, x) => s + x.longitude, 0);
      center = [sumLat / sites.length, sumLon / sites.length];
      zoom = 9;
    }

    try {
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false });
      if (sites.length > 0) {
        map.fitBounds(L.latLngBounds(sites.map(s => [s.latitude, s.longitude])), { padding: [50, 50] });
      } else {
        map.setView(center, zoom);
      }
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

      sites.forEach(site => {
        const markerColor = site.protected_area ? '#2E7D32' : '#1E88E5';
        const markerIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-md" style="background-color:${markerColor}"><div class="h-2 w-2 rounded-full bg-slate-900 animate-pulse"></div></div>`,
          iconSize: [20, 20], iconAnchor: [10, 10]
        });
        L.marker([site.latitude, site.longitude], { icon: markerIcon }).addTo(map)
          .bindPopup(`<div class="p-2 font-sans"><h4 class="font-bold text-xs">${site.name}</h4><p class="text-3xs text-slate-600 mt-0.5">${site.location || ''}</p><p class="text-3xs font-bold text-emerald-700 mt-1">${site.protected_area ? 'Protected Reserve' : 'Standard Area'}</p></div>`);
      });

      mapInstance.current = map;
    } catch (err) {
      console.error('Leaflet map error:', err);
    }

    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [loading, sites]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        <span className="ml-3 text-sm font-bold text-slate-600 dark:text-slate-400">Loading dashboard…</span>
      </div>
    );
  }

  const roleLabels = {
    'Administrator': 'System Administrator Dashboard',
    'Wildlife Researcher': 'Wildlife Researcher Workspace',
    'Conservation Officer': 'Conservation Officer Command',
    'Forest Department Field Panel': 'Forest Department Field Panel',
    'Forest Department Officer': 'Forest Department Field Panel',
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100 font-sans max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
            {roleLabels[roleName] || 'Dashboard'}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            System Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            Wildlife Population Intelligence System — India Deployment. Logged in as{' '}
            <span className="font-extrabold text-slate-900 dark:text-slate-200">{user?.username}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-955/40 border border-rose-200 p-4 text-sm text-rose-600 font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Shared: Interactive Map strip */}
      <div className="glass-card p-6 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <SectionHeader title="Interactive Monitoring Map" subtitle="Active field nodes and camera trap deployments across Indian tiger reserves" />
        <div className="w-full rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-800 min-h-[280px] shadow-inner">
          {sites.length > 0 ? (
            <div ref={mapRef} className="absolute inset-0" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-950/30">
              <MapPin className="h-10 w-10 text-slate-300 dark:text-slate-700 animate-bounce mb-3" />
              <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400">No Monitoring Sites Configured</h4>
              <p className="text-2xs text-slate-500 text-center max-w-xs mt-1.5 leading-relaxed font-semibold">
                Register monitoring sites with GPS coordinates to see them as interactive markers on this map.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Role-specific content */}
      {roleName === 'Wildlife Researcher' && (
        <ResearcherDashboard
          stats={stats}
          healthData={healthData}
          sites={sites}
          popSpecies={popSpecies}
          habitatClass={habitatClass}
          endangeredSpecies={endangeredSpecies}
          navigate={navigate}
        />
      )}
      {roleName === 'Conservation Officer' && (
        <ConservationDashboard
          stats={stats}
          healthData={healthData}
          consActions={consActions}
          consPriorities={consPriorities}
          navigate={navigate}
        />
      )}
      {(roleName === 'Forest Department Field Panel' || roleName === 'Forest Department Officer') && (
        <ForestDeptDashboard
          stats={stats}
          sites={sites}
          surveys={surveys}
          notifications={notifications}
          observations={observations}
          navigate={navigate}
        />
      )}
      {roleName === 'Administrator' && (
        <AdminDashboard
          stats={stats}
          usersList={usersList}
          reportsHistory={reportsHistory}
          navigate={navigate}
        />
      )}

      {/* Fallback for unknown role */}
      {!['Wildlife Researcher', 'Conservation Officer', 'Forest Department Field Panel', 'Forest Department Officer', 'Administrator'].includes(roleName) && (
        <ResearcherDashboard
          stats={stats}
          healthData={healthData}
          sites={sites}
          popSpecies={popSpecies}
          habitatClass={habitatClass}
          endangeredSpecies={endangeredSpecies}
          navigate={navigate}
        />
      )}
    </div>
  );
};

export default Dashboard;
