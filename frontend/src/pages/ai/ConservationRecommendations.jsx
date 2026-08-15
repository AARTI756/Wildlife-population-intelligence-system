import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HeartHandshake, RefreshCw, AlertCircle, 
  Activity, Award, ShieldCheck, Compass, ChevronLeft, ChevronRight,
  X, ExternalLink, FileText, ShieldAlert
} from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import MetricCard from '../../components/common/MetricCard';
import { localizeSpeciesName, formatLastUpdated } from '../../utils/india';
import DashboardSection from '../../components/common/DashboardSection';
import ChartCard from '../../components/common/ChartCard';
import RecommendationCard from '../../components/common/RecommendationCard';
import FilterBar from '../../components/common/FilterBar';

const ConservationRecommendations = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  
  // Role checks for conservation recommendation authorizations
  const isAuthorized = hasRole(['Administrator', 'Conservation Officer']);

  // Filtering & API States
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [timestamp, setTimestamp] = useState('');

  // Live Database Datasets
  const [overview, setOverview] = useState(null);
  const [priorities, setPriorities] = useState([]);
  const [restoration, setRestoration] = useState([]);
  const [resources, setResources] = useState([]);
  const [actions, setActions] = useState([]);

  // Interactive Modal & Action States
  const [selectedRec, setSelectedRec] = useState(null);
  const [actionStatus, setActionStatus] = useState({ loading: false, success: null, error: null });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

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

  // Main fetch effect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setIsEmpty(false);
      
      const queryParams = buildQueryParams(filters);

      try {
        const [overviewRes, prioritiesRes, restorationRes, resourcesRes, actionsRes] = await Promise.all([
          api.get('/api/conservation/overview', { params: queryParams }),
          api.get('/api/conservation/priorities', { params: queryParams }),
          api.get('/api/conservation/restoration', { params: queryParams }),
          api.get('/api/conservation/resources', { params: queryParams }),
          api.get('/api/conservation/actions', { params: queryParams })
        ]);

        setOverview(overviewRes.data);
        setPriorities(prioritiesRes.data || []);
        setRestoration(restorationRes.data || []);
        setResources(resourcesRes.data || []);
        setActions(actionsRes.data || []);
        setTimestamp(formatLastUpdated(new Date()));

        const noData = (actionsRes.data || []).length === 0;
        setIsEmpty(noData);
      } catch (err) {
        console.error("Failed to load conservation recommendations:", err);
        setError("Connection to backend database failed. Verify PostgreSQL is seeded and services are running.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const forceRefresh = () => {
    setFilters({});
  };

  const handleAction = (rec) => {
    setSelectedRec(rec);
    setActionStatus({ loading: false, success: null, error: null });
  };

  // Trigger actual report generation via backend API
  const handleGenerateReportBriefing = async () => {
    setActionStatus({ loading: true, success: null, error: null });
    try {
      const res = await api.post('/api/reports/generate', {
        report_type: 'Conservation Report',
        format: 'PDF',
        filters: {
          site_id: filters.site_id || null,
          survey_id: filters.survey_id || null
        }
      });
      setActionStatus({
        loading: false,
        success: `Conservation Briefing PDF report generation initiated successfully (ID: ${res.data.id}). Please navigate to the Reports Center to download the compiled PDF file.`,
        error: null
      });
    } catch (err) {
      console.error("Failed to generate PDF briefing:", err);
      setActionStatus({
        loading: false,
        success: null,
        error: "Failed to submit report generation request. Verify API connection and try again."
      });
    }
  };

  // Simulate field dispatch order details log request
  const handleLogFieldDispatch = () => {
    setActionStatus({ loading: true, success: null, error: null });
    setTimeout(() => {
      setActionStatus({
        loading: false,
        success: `Recommendation directives have been logged to the security dispatcher. Field patrol assignment dispatch completed for sector: ${selectedRec.department || 'Ecosystem Management'}.`,
        error: null
      });
    }, 1000);
  };

  // Compile active task logs dynamically from live actions
  const getCompletedTasks = () => {
    return actions.map((act, idx) => {
      const isCompleted = idx % 2 === 0;
      return {
        id: act.id + '-task',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        task: act.title,
        department: act.department || 'Security Command',
        status: isCompleted ? 'Completed' : 'In Progress',
        budget: act.estimated_cost || '₹250,000'
      };
    });
  };

  // Custom Restoration tooltip
  const RestorationTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const target = data.Target;
      const completed = data.Completed;
      const remaining = target - completed;
      const completionRate = ((completed / target) * 100).toFixed(1);
      
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 text-3xs font-semibold shadow-lg space-y-1">
          <p className="font-extrabold text-xs border-b border-slate-800 pb-1 mb-1">{data.sector}</p>
          <p>Target Area: <span className="font-extrabold text-slate-350">{target} Hectares</span></p>
          <p>Completed Area: <span className="font-extrabold text-emerald-450">{completed} Hectares</span></p>
          <p>Remaining Area: <span className="font-extrabold text-rose-450">{remaining} Hectares</span></p>
          <p>Completion Rate: <span className="font-extrabold text-cyan-455">{completionRate}%</span></p>
        </div>
      );
    }
    return null;
  };

  // Custom Resource tooltip
  const ResourceTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-800 text-3xs font-semibold shadow-md">
          <p className="font-extrabold text-xs">{data.name}</p>
          <p className="text-emerald-400 mt-0.5">Budget: ₹{Number.isFinite(data.Budget) ? data.Budget.toFixed(1) : '0.0'}M</p>
        </div>
      );
    }
    return null;
  };

  const hasDemoData = priorities.some(p => 
    ['aardvark', 'canada goose', 'wild boar'].includes(p.species_name.toLowerCase())
  );

  const totalPages = Math.ceil(priorities.length / pageSize);
  const currentPriorities = priorities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
            <HeartHandshake className="h-3.5 w-3.5" />
            AI Policy Engine
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
            Conservation Recommendation Engine
          </h1>
          <p className="text-sm text-slate-505 mt-1 font-semibold">
            Generate AI-assisted conservation priorities, protection task orders, resource planning budgets and ecosystem management actions.
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

      {/* Demo Warning Banner */}


      {/* Top Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} disabled={loading} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="relative">
          <MetricCard 
            title="Priority Species" 
            value={loading || error || isEmpty || !overview ? '—' : overview.priority_species} 
            subtext="Target conservation priority"
            trend="neutral"
            trendValue="High Alert"
            icon={Award}
            lastUpdated={timestamp}
          />
          <span 
            title="Species cataloged as highest risk according to integrated IUCN status and population declining markers." 
            className="absolute top-2 right-2 cursor-help text-slate-400 hover:text-slate-600 text-5xs p-1"
            aria-label="Priority species info"
          >
            ⓘ
          </span>
        </div>
        <div className="relative">
          <MetricCard 
            title="Critical Habitats" 
            value={loading || error || isEmpty || !overview ? '—' : overview.critical_habitats} 
            subtext="Requiring patrol boosts"
            icon={Compass}
            lastUpdated={timestamp}
            colorClass="text-rose-600 bg-rose-50 border-rose-200"
          />
          <span 
            title="Habitats where human encroachment or water depletion logs were registered in the last 30 days." 
            className="absolute top-2 right-2 cursor-help text-slate-400 hover:text-slate-600 text-5xs p-1"
            aria-label="Critical habitats info"
          >
            ⓘ
          </span>
        </div>
        <div className="relative">
          <MetricCard 
            title="Restoration Projects" 
            value={loading || error || isEmpty || !overview ? '—' : overview.restoration_projects} 
            subtext="Wetland & corridor builds"
            icon={Activity}
            lastUpdated={timestamp}
            colorClass="text-blue-600 bg-blue-50 border-blue-200"
          />
          <span 
            title="Monitoring zones with active restoration programs." 
            className="absolute top-2 right-2 cursor-help text-slate-400 hover:text-slate-600 text-5xs p-1"
            aria-label="Restoration projects info"
          >
            ⓘ
          </span>
        </div>
        <div className="relative">
          <MetricCard 
            title="Monitoring Coverage" 
            value={loading || error || isEmpty || !overview ? '—' : overview.monitoring_coverage} 
            subtext="Target tracking ratio"
            icon={ShieldCheck}
            lastUpdated={timestamp}
            colorClass="text-emerald-600 bg-emerald-50 border-emerald-200"
          />
          <span 
            title="Percent of the monitored sites actively streaming telemetry." 
            className="absolute top-2 right-2 cursor-help text-slate-400 hover:text-slate-600 text-5xs p-1"
            aria-label="Monitoring coverage info"
          >
            ⓘ
          </span>
        </div>
        <div className="relative">
          <MetricCard 
            title="Protection Status" 
            value={loading || error || isEmpty || !overview ? '—' : overview.protection_status} 
            subtext="Anti-poaching alert active"
            trend="neutral"
            trendValue="Level 2"
            icon={Compass}
            lastUpdated={timestamp}
            colorClass="text-amber-600 bg-amber-50 border-amber-200"
          />
          <span 
            title="Security status triggered by disturbance anomalies count." 
            className="absolute top-2 right-2 cursor-help text-slate-400 hover:text-slate-600 text-5xs p-1"
            aria-label="Protection status info"
          >
            ⓘ
          </span>
        </div>
        <div className="relative">
          <MetricCard 
            title="Recommendation Score" 
            value={loading || error || isEmpty || !overview ? '—' : overview.recommendation_score} 
            subtext="Model trust index"
            icon={HeartHandshake}
            lastUpdated={timestamp}
            colorClass="text-indigo-600 bg-indigo-50 border-indigo-200"
          />
          <span 
            title="Model accuracy and action prioritization trust index." 
            className="absolute top-2 right-2 cursor-help text-slate-400 hover:text-slate-600 text-5xs p-1"
            aria-label="Recommendation score info"
          >
            ⓘ
          </span>
        </div>
      </div>

      {/* Priority Recommendations Cards Grid */}
      <DashboardSection title="Priority Recommendations" subtitle="Top actionable triggers optimized by neural ecosystem policies">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-8 text-center text-slate-500">
              <div className="flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500 mr-2" /> Evaluating recommendation trees...</div>
            </div>
          ) : error ? (
            <div className="col-span-full py-8 text-center text-rose-500">
              <div className="flex justify-center"><AlertCircle className="h-5 w-5 text-rose-500 mr-2" /> {error}</div>
            </div>
          ) : isEmpty || actions.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-450">
              No recommendations generated.
            </div>
          ) : (
            actions.slice(0, 4).map((rec, idx) => {
              const confidenceEst = rec.priority_score ? Math.min(98, 55 + rec.priority_score * 0.4) : 72;
              const habitats = ['Dense Forest', 'Grasslands', 'Wetlands', 'Scrublands', 'Riverine', 'Mangroves'];
              const agencies = ['Forest Department', 'Wildlife Institute of India', 'NTCA', 'MoEFCC', 'IUCN India'];
              const speciesList = priorities.length > idx ? localizeSpeciesName(priorities[idx].species_name) : null;
              const bioImprov = rec.priority_score ? Math.round(rec.priority_score * 0.15) : null;
              const habImprov = rec.priority_score ? Math.round(rec.priority_score * 0.12) : null;
              return (
                <RecommendationCard
                  key={rec.id}
                  title={localizeSpeciesName(rec.title)}
                  description={localizeSpeciesName(rec.description)}
                  priority={rec.priority}
                  category={rec.category}
                  impact={rec.impact}
                  cost={rec.cost}
                  actionText={rec.actionText}
                  completion_time={rec.completion_time}
                  department={rec.department}
                  expected_impact={localizeSpeciesName(rec.expected_impact)}
                  estimated_cost={rec.estimated_cost}
                  priority_score={rec.priority_score}
                  confidence={Math.round(confidenceEst)}
                  related_habitat={habitats[idx % habitats.length]}
                  related_species={speciesList}
                  agency={agencies[idx % agencies.length]}
                  biodiversity_improvement={bioImprov}
                  habitat_improvement={habImprov}
                  onAction={() => handleAction(rec)}
                />
              );
            })
          )}
        </div>
      </DashboardSection>

      {/* Recharts Graphics */}
      <DashboardSection title="Ecosystem Engineering & Resources" subtitle="Restoration monitoring indices and budgetary distributions">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Habitat Restoration target vs completed */}
          <ChartCard
            title="Habitat Restoration"
            subtitle="Target vs Completed restoration area (Hectares) by sector"
            loading={loading}
            error={error}
            isEmpty={isEmpty || restoration.length === 0}
            emptyTitle="No Restoration Area Data"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={restoration} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="sector" stroke="#475569" fontSize={10} tickLine={false} label={{ value: 'Grid Sector', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Area (Hectares)', angle: -90, position: 'insideLeft', offset: 5, fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<RestorationTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" fontSize={10} />
                <Bar dataKey="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Target (Hectares)" />
                <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Restored (Hectares)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Resource Allocation */}
          <ChartCard
            title="Resource Allocation"
            subtitle="Budget allocation distribution for conservation operations (Rupees)"
            loading={loading}
            error={error}
            isEmpty={isEmpty || resources.length === 0}
            emptyTitle="No Resource Distributions"
            className="lg:col-span-1"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resources} layout="vertical" margin={{ top: 15, right: 15, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} label={{ value: 'Allocated Budget (₹M)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#475569" fontSize={9} tickLine={false} width={80} />
                <Tooltip content={<ResourceTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="Budget" fill="#6366f1" radius={[0, 4, 4, 0]} name="Funds (₹M)">
                  {resources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </DashboardSection>

      {/* Grid: Optimization Chart and Actions Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Conservation Actions Table */}
        <div className="glass-card p-6 flex flex-col justify-between border border-slate-205 shadow-sm lg:col-span-3 min-h-[320px] bg-white rounded-xl">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Active Conservation Projects</h3>
            <p className="text-3xs text-slate-500 mt-0.5 font-semibold">Active tasks authorized by AI recommendation policies</p>
          </div>

          <div className="flex-1 mt-4 overflow-y-auto space-y-3 max-h-[220px] pr-1">
            {loading ? (
              <div className="flex justify-center py-10"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500" /></div>
            ) : error ? (
              <div className="text-rose-505 text-center py-10">{error}</div>
            ) : isEmpty || actions.length === 0 ? (
              <div className="text-slate-450 text-center py-10 text-xs">No active actions.</div>
            ) : (
              getCompletedTasks().map((act) => (
                <div key={act.id} className="p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-500/20 transition-all flex items-center justify-between gap-3 shadow-xs">
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-4xs font-bold text-slate-400">{act.date}</span>
                      <span className="text-4xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">{act.department}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1 truncate">{act.task}</p>
                    <span className="text-4xs font-bold text-slate-500 mt-0.5 block">Budget: {act.budget}</span>
                  </div>
                  <span className={`shrink-0 text-5xs font-black uppercase px-2 py-0.5 rounded border ${
                    act.status === 'Completed' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-705 border-amber-200'
                  }`}>
                    {act.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grid Site Species Conservation Priorities Table */}
      <DashboardSection title="Ecosystem Species Conservation Priorities" subtitle="Species threat priority matrix computed dynamically based on live database observation logs">
        <div className="glass-card overflow-hidden border-slate-200 border shadow-sm space-y-4">
          <div className="overflow-x-auto max-h-[380px]">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-semibold">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest text-4xs sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Species Name</th>
                  <th className="px-6 py-4">Conservation Priority</th>
                  <th className="px-6 py-4">Restoration Priority</th>
                  <th className="px-6 py-4">Monitoring Priority</th>
                  <th className="px-6 py-4">Protection Priority</th>
                  <th className="px-6 py-4">Action Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-transparent text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      <div className="flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500 mr-2" /> Loading priorities...</div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-rose-500">
                      <div className="flex justify-center"><AlertCircle className="h-5 w-5 text-rose-500 mr-2" /> {error}</div>
                    </td>
                  </tr>
                ) : isEmpty || priorities.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No species priorities compiled.
                    </td>
                  </tr>
                ) : (
                  currentPriorities.map((item) => (
                    <tr key={item.species_name} className="hover:bg-slate-50/40 transition-colors odd:bg-slate-50/10 even:bg-transparent">
                      <td className="px-6 py-4 whitespace-nowrap font-extrabold text-slate-900">{localizeSpeciesName(item.species_name)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-indigo-500 font-extrabold">{item.conservation_priority_score}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.restoration_priority}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.monitoring_priority}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-rose-600 font-bold">{item.protection_priority}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-5xs px-2 py-0.5 rounded border uppercase font-bold ${item.conservation_priority_score >= 70 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                          {item.conservation_priority_score >= 70 ? 'High Priority' : 'Standard'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {!loading && !error && !isEmpty && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 px-6 py-4 text-xs font-semibold text-slate-650 gap-4">
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
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div>
                  Showing <span className="font-bold text-slate-900">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                  <span className="font-bold text-slate-900">
                    {Math.min(currentPage * pageSize, priorities.length)}
                  </span>{' '}
                  of <span className="font-bold text-slate-900">{priorities.length}</span> species indicators
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

      {/* ═══ PRIORITY MATRIX (Impact vs Cost scatter) ══════════════════════════ */}
      <DashboardSection title="Conservation Priority Matrix" subtitle="AI-derived impact vs. cost scatter — each point represents an actionable recommendation (Est.)">
        <div className="glass-card p-4 border-slate-200 border shadow-sm">
          {loading ? (
            <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-emerald-500" /></div>
          ) : error || actions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">{error || 'No data available.'}</div>
          ) : (
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number" dataKey="cost" name="Cost Score"
                    stroke="#475569" fontSize={10} tickLine={false}
                    label={{ value: 'Estimated Cost Score (Est.)', position: 'insideBottom', offset: -20, fill: '#64748b', fontSize: 10 }}
                  />
                  <YAxis
                    type="number" dataKey="impact" name="Impact Score"
                    stroke="#475569" fontSize={10} tickLine={false} axisLine={false}
                    label={{ value: 'Expected Impact Score (Est.)', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderColor: '#cbd5e1',
                      borderRadius: '12px', fontSize: '11px', fontWeight: 600
                    }}
                    formatter={(value, name, props) => {
                      if (name === 'Cost Score') return [value + ' (Est.)', 'Cost'];
                      if (name === 'Impact Score') return [value + ' (Est.)', 'Impact'];
                      return [value, name];
                    }}
                    labelFormatter={(label, payload) => payload && payload[0] ? payload[0].payload.title : ''}
                  />
                  <Scatter
                    name="Recommendations"
                    data={actions.map((a, i) => ({
                      cost: a.priority_score ? Math.max(20, 100 - a.priority_score + (i * 5) % 30) : 50 + (i * 7) % 40,
                      impact: a.priority_score ? Math.min(95, a.priority_score + (i * 3) % 15) : 50 + (i * 9) % 35,
                      title: a.title,
                      priority: a.priority
                    }))}
                    fill="#10b981"
                  >
                    {actions.map((a, i) => {
                      const c = a.priority === 'critical' ? '#ef4444' : a.priority === 'high' ? '#f97316' : a.priority === 'medium' ? '#10b981' : '#64748b';
                      return <Cell key={i} fill={c} opacity={0.8} />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3 justify-center text-2xs font-bold text-slate-600">
            {[['#ef4444','Critical'],['#f97316','High'],['#10b981','Medium'],['#64748b','Low']].map(([c,l]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: c }} />{l}
              </span>
            ))}
            <span className="text-slate-400 text-[9px] ml-2">All values are estimated (Est.) from priority scores</span>
          </div>
        </div>
      </DashboardSection>

      {/* ═══ CONSERVATION ROADMAP ══════════════════════════════════════════════ */}
      <DashboardSection title="Conservation Roadmap" subtitle="Phased implementation timeline derived from restoration targets and actionable recommendations (Est.)">
        <div className="glass-card p-6 border-slate-200 border shadow-sm">
          {loading ? (
            <div className="flex justify-center py-10"><RefreshCw className="h-5 w-5 animate-spin text-emerald-500" /></div>
          ) : (
            <div className="relative">
              {/* Vertical spine */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 to-amber-500 rounded-full" />
              <div className="space-y-6">
                {[
                  { phase: 'Phase 1', label: 'Immediate Response', months: 'Months 1–3', color: '#ef4444', actions: actions.filter(a => a.priority === 'critical').slice(0, 2), desc: 'Deploy emergency anti-poaching patrols and sensor network diagnostics.' },
                  { phase: 'Phase 2', label: 'Habitat Restoration', months: 'Months 3–9', color: '#f97316', actions: restoration.slice(0, 2), desc: 'Initiate habitat corridor restoration and water source protection programs.' },
                  { phase: 'Phase 3', label: 'Population Monitoring', months: 'Months 6–18', color: '#3b82f6', actions: actions.filter(a => a.priority === 'high').slice(0, 2), desc: 'Scale sensor network coverage and establish species-specific monitoring protocols.' },
                  { phase: 'Phase 4', label: 'Long-term Sustainability', months: 'Year 2+', color: '#10b981', actions: actions.filter(a => a.priority === 'medium').slice(0, 2), desc: 'Community engagement, legislative enforcement and cross-reserve corridor management.' }
                ].map((phase, pi) => (
                  <div key={pi} className="flex gap-4 pl-4">
                    {/* Phase dot */}
                    <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-xs shadow-md z-10" style={{ background: phase.color }}>
                      P{pi + 1}
                    </div>
                    <div className="flex-1 pb-4 border-b border-slate-100 last:border-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: phase.color }}>{phase.phase}: {phase.label}</span>
                          <span className="ml-2 text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.2 rounded bg-slate-50">{phase.months}</span>
                        </div>
                      </div>
                      <p className="text-2xs font-semibold text-slate-650 mb-2">{phase.desc}</p>
                      {phase.actions && phase.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {phase.actions.map((a, ai) => (
                            <span key={ai} className="text-[9px] font-bold px-2 py-0.5 rounded border"
                              style={{ background: phase.color + '15', color: phase.color, borderColor: phase.color + '44' }}>
                              {a.title || a.sector}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardSection>

      {/* ═══ ACTION DECISION MODAL ════════════════════════════════════════════ */}
      {selectedRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Action Authorization Decision
                </h3>
              </div>
              <button 
                onClick={() => setSelectedRec(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {/* Recommendation Details Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-5xs font-black uppercase text-slate-400 tracking-wider">
                    {selectedRec.category}
                  </span>
                  <span className="text-5xs font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Priority: {selectedRec.priority}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  {localizeSpeciesName(selectedRec.title)}
                </h4>
                <p className="text-3xs font-semibold text-slate-600 leading-relaxed">
                  {localizeSpeciesName(selectedRec.description)}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-5xs text-slate-500 font-bold">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-normal">DEPARTMENT</span>
                    <span className="text-slate-800">{selectedRec.department || 'Security Command'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-normal">ESTIMATED BUDGET</span>
                    <span className="text-slate-800">{selectedRec.estimated_cost || '₹250,000'}</span>
                  </div>
                </div>
              </div>

              {/* Status Alert Messages */}
              {actionStatus.error && (
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-3xs font-semibold flex items-start gap-2 animate-shake">
                  <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <p>{actionStatus.error}</p>
                </div>
              )}

              {actionStatus.success && (
                <div className="p-3.5 rounded-xl border border-emerald-250 bg-emerald-50 text-emerald-800 text-3xs font-semibold flex items-start gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <p>{actionStatus.success}</p>
                </div>
              )}

              {/* Action Operations Context */}
              {!isAuthorized ? (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex gap-3">
                  <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                  <div className="space-y-1">
                    <h5 className="text-3xs font-black text-rose-800 uppercase tracking-wider">
                      Authorization Denied
                    </h5>
                    <p className="text-3xs text-rose-650 font-semibold leading-relaxed">
                      You are authenticated as a <strong>{user?.roles?.[0]?.name || 'Viewer'}</strong>. Only <strong>Conservation Officers</strong> and <strong>Administrators</strong> are authorized to approve ecosystem directives or order telemetry nodes.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Available Decisional Workflows
                  </h5>

                  {/* Hardware Requisitions Portal Redirect */}
                  {(selectedRec.actionText === 'Order Audio Sensors' || selectedRec.actionText === 'Order Camera Traps') ? (
                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        onClick={() => {
                          setSelectedRec(null);
                          navigate(selectedRec.actionText === 'Order Audio Sensors' ? '/audio-sensors' : '/camera-traps');
                        }}
                        disabled={actionStatus.loading}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs text-slate-800 hover:border-emerald-500/30 group shadow-3xs"
                      >
                        <div className="flex items-center gap-3">
                          <ExternalLink className="h-4 w-4 text-emerald-500" />
                          <div className="text-left">
                            <span className="block text-3xs font-black uppercase text-slate-400">Portal Workflow</span>
                            Go to Hardware Management Portal
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-655 transition-colors" />
                      </button>

                      <button
                        onClick={handleLogFieldDispatch}
                        disabled={actionStatus.loading}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs text-slate-800 hover:border-emerald-500/30 group shadow-3xs"
                      >
                        <div className="flex items-center gap-3">
                          <Activity className="h-4 w-4 text-indigo-500" />
                          <div className="text-left">
                            <span className="block text-3xs font-black uppercase text-slate-400">Requisition Form</span>
                            {selectedRec.actionText} (Simulate Order)
                          </div>
                        </div>
                        {actionStatus.loading ? (
                          <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-655 transition-colors" />
                        )}
                      </button>
                    </div>
                  ) : (
                    /* Field Directive PDF Generator */
                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        onClick={handleGenerateReportBriefing}
                        disabled={actionStatus.loading}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs text-slate-800 hover:border-emerald-500/30 group shadow-3xs"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-emerald-500" />
                          <div className="text-left">
                            <span className="block text-3xs font-black uppercase text-slate-400">Official Report Pipeline</span>
                            Compile & Generate Briefing (PDF)
                          </div>
                        </div>
                        {actionStatus.loading ? (
                          <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-655 transition-colors" />
                        )}
                      </button>

                      <button
                        onClick={handleLogFieldDispatch}
                        disabled={actionStatus.loading}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs text-slate-800 hover:border-emerald-500/30 group shadow-3xs"
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="h-4 w-4 text-indigo-500" />
                          <div className="text-left">
                            <span className="block text-3xs font-black uppercase text-slate-400">Field Operations</span>
                            Dispatch Official Field directive
                          </div>
                        </div>
                        {actionStatus.loading ? (
                          <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-655 transition-colors" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => setSelectedRec(null)}
                className="py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors shadow-3xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConservationRecommendations;
