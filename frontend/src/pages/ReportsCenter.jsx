import React, { useState, useEffect } from 'react';
import { 
  FilePieChart, Download, Loader2, CheckCircle2, AlertTriangle, 
  FileSpreadsheet, FileText, FileDown, Trash2, RefreshCw, 
  Calendar, Filter, Search, Award, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import MetricCard from '../components/common/MetricCard';
import { localizeSpeciesName } from '../utils/india';

const REPORT_TYPES = [
  "Wildlife Survey Report",
  "Species Population Report",
  "Biodiversity Report",
  "Habitat Assessment Report",
  "Conservation Report",
  "Wildlife Health Report",
  "Executive Summary Report"
];

const FORMATS = [
  { value: "PDF", label: "Adobe PDF (.pdf)", icon: FileText, color: "text-rose-500 bg-rose-50 dark:bg-rose-955/20 border-rose-200" },
  { value: "XLSX", label: "Excel Spreadsheet (.xlsx)", icon: FileSpreadsheet, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-955/20 border-emerald-200" },
  { value: "CSV", label: "Flat CSV Table (.csv)", icon: FileSpreadsheet, color: "text-blue-500 bg-blue-50 dark:bg-blue-955/20 border-blue-200" }
];

const ReportsCenter = () => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole(['Administrator']);

  // Metadata dropdowns list
  const [surveys, setSurveys] = useState([]);
  const [sites, setSites] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Filter States
  const [surveyId, setSurveyId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [conservationStatus, setConservationStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report Generator Form States
  const [selectedType, setSelectedType] = useState(REPORT_TYPES[0]);
  const [selectedFormat, setSelectedFormat] = useState("PDF");
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(null); // Pending, Completed, Failed
  const [notifyMsg, setNotifyMsg] = useState(null);

  // History & Stats States
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, pdf: 0, excel: 0, csv: 0, avg_time_ms: 0.0 });
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [historyLimit, setHistoryLimit] = useState(10);

  // Filters for history query
  const [typeFilter, setTypeFilter] = useState("All");
  const [formatFilter, setFormatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchMetadata = async () => {
    try {
      setLoadingMetadata(true);
      const [surveysRes, sitesRes, speciesRes] = await Promise.all([
        api.get('/api/surveys'),
        api.get('/api/monitoring-sites'),
        api.get('/api/species')
      ]);
      setSurveys(surveysRes.data || []);
      setSites(sitesRes.data || []);
      setSpeciesList(speciesRes.data || []);
    } catch (err) {
      console.error("Failed to load metadata filters:", err);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/reports/stats');
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const skip = (historyPage - 1) * historyLimit;
      const params = { skip, limit: historyLimit };
      
      if (typeFilter !== "All") params.report_type = typeFilter;
      if (formatFilter !== "All") params.format = formatFilter;
      if (statusFilter !== "All") params.status = statusFilter;
      
      const res = await api.get('/api/reports/history', { params });
      let list = res.data || [];
      
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        list = list.filter(h => h.report_name.toLowerCase().includes(q));
      }
      
      setHistory(list);
    } catch (err) {
      console.error("Failed to fetch reports history:", err);
      setHistoryError("Failed to fetch execution history logs.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [historyPage, historyLimit, typeFilter, formatFilter, statusFilter, searchQuery]);

  // Handle report generation with asynchronous polling
  const handleGenerate = async () => {
    setGenerating(true);
    setNotifyMsg(null);
    setGenerationProgress("Pending");
    
    // Compile filters
    const filters = {};
    if (surveyId) filters.survey_id = parseInt(surveyId);
    if (siteId) filters.site_id = parseInt(siteId);
    if (selectedSpecies) filters.species = selectedSpecies;
    if (conservationStatus) filters.conservation_status = conservationStatus;
    if (startDate) filters.start_date = startDate;
    if (endDate) filters.end_date = endDate;
    
    try {
      const res = await api.post('/api/reports/generate', {
        report_type: selectedType,
        format: selectedFormat,
        filters
      });
      
      const reportId = res.data.id;
      pollReportStatus(reportId);
    } catch (err) {
      console.error("Failed to initiate report generation:", err);
      setGenerating(false);
      setGenerationProgress(null);
      setNotifyMsg({ type: "error", text: err.response?.data?.detail || "Failed to trigger report compilation." });
    }
  };

  // Poll report execution status
  const pollReportStatus = async (reportId) => {
    const pollId = setInterval(async () => {
      try {
        const res = await api.get(`/api/reports/${reportId}`);
        const status = res.data.status;
        
        if (status === "Completed") {
          clearInterval(pollId);
          setGenerating(false);
          setGenerationProgress(null);
          setNotifyMsg({ type: "success", text: `Successfully generated report: ${res.data.download_filename}` });
          fetchHistory();
          fetchStats();
        } else if (status === "Failed") {
          clearInterval(pollId);
          setGenerating(false);
          setGenerationProgress(null);
          setNotifyMsg({ type: "error", text: "Report generation failed. Inspect server logs." });
          fetchHistory();
        }
      } catch (err) {
        console.error("Error polling report status:", err);
        clearInterval(pollId);
        setGenerating(false);
        setGenerationProgress(null);
        setNotifyMsg({ type: "error", text: "Lost connection to polling gateway." });
      }
    }, 1000);
  };

  const handleDownload = async (id, filename) => {
    try {
      const response = await api.get(`/api/reports/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download file:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/reports/${id}`);
      setHistory(prev => prev.filter(h => h.id !== id));
      fetchStats();
    } catch (err) {
      console.error("Failed to delete report run:", err);
    }
  };

  const handleRegenerate = (item) => {
    setSelectedType(item.report_type);
    setSelectedFormat(item.format);
    // Parse filters
    const filters = item.filters_json || {};
    setSurveyId(filters.survey_id ? filters.survey_id.toString() : '');
    setSiteId(filters.site_id ? filters.site_id.toString() : '');
    setSelectedSpecies(filters.species || '');
    setConservationStatus(filters.conservation_status || '');
    setStartDate(filters.start_date || '');
    setEndDate(filters.end_date || '');
    
    // Automatically trigger
    setTimeout(() => {
      handleGenerate();
    }, 200);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-955/20 dark:text-emerald-450 dark:border-emerald-900/30';
      case 'Failed':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/20 dark:text-rose-455 dark:border-rose-900/30';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-850 dark:text-slate-100 font-sans max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-405 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
          <FilePieChart className="h-4 w-4 text-emerald-555" />
          Management Reporting
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          Reports & Export System
        </h1>
        <p className="text-sm text-slate-655 dark:text-slate-400 mt-1 font-semibold">
          Compile, filter, and export live wildlife metrics, diversity index summaries, and monitoring hardware events.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        <MetricCard title="Total Reports" value={stats.total} subtext="Generated reports" icon={FilePieChart} />
        <MetricCard title="Generated Today" value={stats.today} subtext="Ecosystem documents today" icon={Clock} colorClass="text-blue-650 dark:text-blue-450 bg-blue-50 dark:bg-blue-955/30 border-blue-200" />
        <MetricCard title="PDF Documents" value={stats.pdf} subtext="Vector formatted PDFs" icon={FileText} colorClass="text-rose-650 dark:text-rose-455 bg-rose-50 dark:bg-rose-955/30 border-rose-200" />
        <MetricCard title="Avg Generation Speed" value={stats.avg_time_ms > 0 ? `${(stats.avg_time_ms / 1000).toFixed(2)}s` : "0s"} subtext="Computation time average" icon={RefreshCw} colorClass="text-emerald-650 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-955/30 border-emerald-250" />
      </div>

      {/* Generator Wizard Panel */}
      <div className="glass-card p-5 space-y-4 shadow-sm border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-405 dark:text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-900">
          <Filter className="h-4 w-4 text-emerald-500" />
          Create New Report
        </h3>

        {notifyMsg && (
          <div className={`flex items-start gap-2.5 rounded-xl border p-4 text-2xs font-semibold ${
            notifyMsg.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-955/20 border-emerald-200 text-emerald-800 dark:text-emerald-400' 
              : 'bg-rose-50 dark:bg-rose-955/20 border-rose-200 text-rose-800 dark:text-rose-400'
          }`}>
            {notifyMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <AlertTriangle className="h-5 w-5 text-rose-500" />}
            <div>
              <p className="font-bold">{notifyMsg.type === 'success' ? 'Report Generation Completed' : 'Operation Failed'}</p>
              <p className="font-medium mt-0.5">{notifyMsg.text}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Selector */}
          <div className="space-y-4 md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Report Type */}
              <div className="space-y-1">
                <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Report Category</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="py-2 px-3 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800"
                >
                  {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Format selection */}
              <div className="space-y-1">
                <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Export Format</label>
                <div className="flex gap-2">
                  {FORMATS.map(f => {
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.value}
                        onClick={() => setSelectedFormat(f.value)}
                        className={`flex-1 py-1.5 px-3 rounded-lg border text-3xs font-extrabold flex flex-col items-center gap-1.5 transition-all uppercase ${
                          selectedFormat === f.value
                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-emerald-600 dark:border-emerald-600'
                            : 'bg-white border-slate-200 text-slate-655 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                        <span>{f.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Custom filters panel */}
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-1">
                <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Filter by Site</label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="py-1.5 px-2 text-xs w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                >
                  <option value="">All Sites</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Filter by Survey</label>
                <select
                  value={surveyId}
                  onChange={(e) => setSurveyId(e.target.value)}
                  className="py-1.5 px-2 text-xs w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                >
                  <option value="">All Surveys</option>
                  {surveys.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Filter by Species</label>
                <select
                  value={selectedSpecies}
                  onChange={(e) => setSelectedSpecies(e.target.value)}
                  className="py-1.5 px-2 text-xs w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                >
                  <option value="">All Species</option>
                  {Array.from(new Set(speciesList.map(s => s.common_name))).map(name => {
                    const uniqueSp = speciesList.find(s => s.common_name === name);
                    return (
                      <option key={uniqueSp?.id || name} value={name}>
                        {localizeSpeciesName(name)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Conservation Status</label>
                <select
                  value={conservationStatus}
                  onChange={(e) => setConservationStatus(e.target.value)}
                  className="py-1.5 px-2 text-xs w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="Critically Endangered">Critically Endangered</option>
                  <option value="Endangered">Endangered</option>
                  <option value="Vulnerable">Vulnerable</option>
                  <option value="Near Threatened">Near Threatened</option>
                  <option value="Least Concern">Least Concern</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="py-1 px-2 text-xs w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 focus:outline-none text-slate-700 dark:text-slate-200 h-[28px] leading-tight"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="py-1 px-2 text-xs w-full rounded-lg bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 focus:outline-none text-slate-700 dark:text-slate-200 h-[28px] leading-tight"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Execution */}
          <div className="flex flex-col justify-center items-center p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/10 dark:bg-slate-900/5 text-center">
            {generating ? (
              <div className="space-y-3">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest animate-pulse">Generating File...</h4>
                <p className="text-[10px] text-slate-450">WPIS compiler is gathering database indicators in the background.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <FilePieChart className="h-10 w-10 text-emerald-500 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-805 dark:text-slate-200 uppercase tracking-wider">Ready to Export</h4>
                  <p className="text-4xs text-slate-450 leading-relaxed max-w-2xs mx-auto">Click below to initiate a background compile pipeline.</p>
                </div>
                <button
                  onClick={handleGenerate}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg transition-all w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Generate Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Log sticky table */}
      <div className="glass-card p-5 space-y-4 shadow-sm border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-slate-100 dark:border-slate-900">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-705 dark:text-slate-305 flex items-center gap-1.5">
            <Award className="h-4.5 w-4.5 text-emerald-500" />
            Report Export Logs History
          </h3>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search history name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs w-48 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-1.5 px-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <option value="All">All Types</option>
              {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="py-1.5 px-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <option value="All">All Formats</option>
              <option value="PDF">PDF</option>
              <option value="XLSX">Excel (XLSX)</option>
              <option value="CSV">CSV</option>
            </select>
          </div>
        </div>

        {loadingHistory ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="ml-3 text-xs font-bold text-slate-400">Loading history logs...</span>
          </div>
        ) : historyError ? (
          <div className="p-8 border border-slate-100 dark:border-slate-900 text-center text-rose-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-rose-500" />
            <p className="text-xs font-bold">{historyError}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FilePieChart className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <h4 className="text-sm font-bold text-slate-705 dark:text-slate-200">No Reports Exported Yet</h4>
            <p className="text-3xs text-slate-450 mt-1">Configure details above and trigger a background build generation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-850">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 font-bold uppercase tracking-wider text-slate-400 text-[10px] sticky top-0 z-10">
                    <th className="p-4">Report Name</th>
                    <th className="p-4">Format</th>
                    <th className="p-4">Generated At</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Duration</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-850 text-slate-700 dark:text-slate-355 font-semibold">
                  {history.map(item => (
                    <tr key={item.id} className="odd:bg-white even:bg-slate-50/40 dark:odd:bg-transparent dark:even:bg-slate-900/10 hover:bg-slate-100/40 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 text-slate-905 dark:text-white font-extrabold">{item.report_name}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-4xs font-black uppercase bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                          {item.format}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-500 dark:text-slate-400">
                        {new Date(item.generated_at).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-5xs font-bold uppercase border ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono text-[11px]">
                        {item.execution_time_ms ? `${(item.execution_time_ms / 1000).toFixed(2)}s` : "-"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {item.status === 'Completed' && (
                            <button
                              onClick={() => handleDownload(item.id, item.download_filename)}
                              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-emerald-600 transition-all shadow-3xs cursor-pointer"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              <span>Download</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleRegenerate(item)}
                            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 transition-all shadow-3xs cursor-pointer"
                            title="Re-run Report with Same Config"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Regenerate</span>
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                              title="Permanently Delete Run Log"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination & Rows per page */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-1">
              <div className="flex items-center gap-2">
                <span className="text-3xs font-black uppercase text-slate-400 dark:text-slate-500">Rows per page:</span>
                <select
                  value={historyLimit}
                  onChange={(e) => {
                    setHistoryLimit(parseInt(e.target.value));
                    setHistoryPage(1);
                  }}
                  className="py-1 px-1.5 text-xs rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none text-slate-705 dark:text-slate-200 font-semibold"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setHistoryPage(p => Math.max(p - 1, 1))}
                  disabled={historyPage === 1}
                  className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-3xs font-black uppercase text-slate-500 dark:text-slate-400 font-mono">Page {historyPage}</span>
                <button 
                  onClick={() => setHistoryPage(p => p + 1)}
                  disabled={history.length < historyLimit}
                  className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsCenter;
