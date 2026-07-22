import React, { useState, useEffect } from 'react';
import { 
  FilePieChart, Download, Loader2, CheckCircle2, AlertTriangle, 
  FileJson, Shield, Calendar, Filter, FileSpreadsheet, MapPin, 
  Activity, Award, RefreshCw 
} from 'lucide-react';
import api from '../services/api';

const Reports = () => {
  // Lists for dropdowns
  const [surveys, setSurveys] = useState([]);
  const [sites, setSites] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Filter States
  const [surveyId, setSurveyId] = useState('');
  const [monitoringSiteId, setMonitoringSiteId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [datePreset, setDatePreset] = useState('30days'); // today, 7days, 30days, all, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [speciesName, setSpeciesName] = useState('');
  const [observationType, setObservationType] = useState('');
  const [threatLevel, setThreatLevel] = useState('');
  const [iucnStatus, setIucnStatus] = useState('');
  const [includeUnknown, setIncludeUnknown] = useState(false);

  // Report Compilation States
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');

  // Supported 64 Species List
  const supportedSpeciesList = [
    'Bear', 'Brown Bear', 'Bull', 'Butterfly', 'Camel', 'Canary', 'Cat', 'Caterpillar', 
    'Cattle', 'Centipede', 'Cheetah', 'Chicken', 'Deer', 'Dog', 'Duck', 'Eagle', 
    'Elephant', 'Fox', 'Frog', 'Giraffe', 'Goat', 'Goose', 'Hamster', 'Hedgehog', 
    'Hippopotamus', 'Horse', 'Jellyfish', 'Kangaroo', 'Koala', 'Ladybug', 'Leopard', 
    'Lion', 'Lizard', 'Lynx', 'Magpie', 'Monkey', 'Moths and Butterflies', 'Mouse', 
    'Mule', 'Ostrich', 'Otter', 'Owl', 'Parrot', 'Peacock', 'Pig', 'Polar Bear', 
    'Rabbit', 'Raccoon', 'Raven', 'Red Panda', 'Rhinoceros', 'Scorpion', 'Sheep', 
    'Snake', 'Sparrow', 'Spider', 'Swan', 'Tiger', 'Turkey', 'Wild Boar', 'Wolf', 
    'Woodpecker', 'Zebra'
  ];

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      setLoadingMetadata(true);
      const [surveysRes, sitesRes, trapsRes, sensorsRes] = await Promise.all([
        api.get('/api/surveys'),
        api.get('/api/monitoring-sites'),
        api.get('/api/camera-traps'),
        api.get('/api/audio-sensors')
      ]);

      setSurveys(surveysRes.data);
      setSites(sitesRes.data);
      
      // Combine devices
      const combinedDevices = [];
      trapsRes.data.forEach(t => {
        if (t.camera_id) combinedDevices.push({ id: t.camera_id, name: `${t.name} (Camera)` });
      });
      sensorsRes.data.forEach(s => {
        if (s.sensor_id) combinedDevices.push({ id: s.sensor_id, name: `${s.name} (Audio)` });
      });
      setDevices(combinedDevices);
    } catch (err) {
      console.error("Failed to load reporting filters metadata:", err);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    setReportData(null);

    // Calculate dates based on preset
    let finalStart = startDate;
    let finalEnd = endDate;

    if (datePreset !== 'custom') {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      finalEnd = endOfDay.toISOString().split('T')[0];

      if (datePreset === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        finalStart = startOfDay.toISOString().split('T')[0];
      } else if (datePreset === '7days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        finalStart = sevenDaysAgo.toISOString().split('T')[0];
      } else if (datePreset === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        finalStart = thirtyDaysAgo.toISOString().split('T')[0];
      } else if (datePreset === 'all') {
        finalStart = '';
        finalEnd = '';
      }
    }

    try {
      const params = {};
      if (surveyId) params.survey_id = surveyId;
      if (monitoringSiteId) params.monitoring_site_id = monitoringSiteId;
      if (deviceId) params.device_id = deviceId;
      if (finalStart) params.start_date = finalStart;
      if (finalEnd) params.end_date = finalEnd;
      if (speciesName) params.species_name = speciesName;
      if (observationType) params.observation_type = observationType;
      if (threatLevel) params.threat_level = threatLevel;
      if (iucnStatus) params.iucn_status = iucnStatus;
      if (includeUnknown) params.include_unknown = includeUnknown;

      const response = await api.get('/api/observations/report', { params });
      setReportData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate report. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!reportData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `wpis_report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadCSV = () => {
    if (!reportData || !reportData.observations) return;
    
    // Header
    const headers = ["Observation ID", "Species", "Count", "Timestamp", "Type", "Device ID", "Site ID", "Survey ID", "Notes", "Status", "Behaviour", "Animal Call Detected", "Animal Call Category"];
    
    const rows = reportData.observations.map(o => [
      o.id,
      `"${(o.species_name === 'Unknown Species' ? 'Species Requires Verification' : o.species_name).replace(/"/g, '""')}"`,
      o.count,
      o.timestamp || '',
      o.observation_type,
      o.device_id || '',
      o.monitoring_site_id || '',
      o.survey_id || '',
      `"${(o.notes || '').replace(/"/g, '""')}"`,
      o.status || '',
      `"${(o.behaviour || '').replace(/"/g, '""')}"`,
      o.animal_call_detected ? "Yes" : "No",
      `"${(o.animal_call_category || 'Environmental Noise').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `wpis_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100 font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-405 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
          <FilePieChart className="h-4 w-4 text-emerald-555" />
          Management Reporting
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          Exportable Wildlife Reports
        </h1>
        <p className="text-sm text-slate-550 dark:text-slate-400 mt-1 font-semibold">
          Configure, filter, and compile reports for biodiversity censuses, sensor hardware nodes, and threat vectors.
        </p>
      </div>

      {/* Configuration Toolbar Panel */}
      <div className="glass-card p-5 space-y-4 shadow-sm border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950/45">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-405 dark:text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-900">
          <Filter className="h-4 w-4 text-emerald-500" />
          Configure Report Filters
        </h3>

        {loadingMetadata ? (
          <div className="flex py-6 justify-center items-center text-xs text-slate-500 font-semibold gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
            <span>Loading query options...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {/* Survey Filter */}
            <div className="space-y-1">
              <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Survey Project</label>
              <select
                value={surveyId}
                onChange={(e) => setSurveyId(e.target.value)}
                className="enterprise-select py-2 px-3 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="">All Surveys</option>
                {surveys.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>

            {/* Monitoring Site Filter */}
            <div className="space-y-1">
              <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Monitoring Site</label>
              <select
                value={monitoringSiteId}
                onChange={(e) => setMonitoringSiteId(e.target.value)}
                className="enterprise-select py-2 px-3 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="">All Sites</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Device Filter */}
            <div className="space-y-1">
              <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Hardware Node</label>
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="enterprise-select py-2 px-3 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="">All Devices</option>
                {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {/* Species Filter */}
            <div className="space-y-1">
              <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Species Target</label>
              <select
                value={speciesName}
                onChange={(e) => setSpeciesName(e.target.value)}
                className="enterprise-select py-2 px-3 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="">All Species</option>
                {supportedSpeciesList.map(sp => <option key={sp} value={sp}>{sp}</option>)}
              </select>
            </div>

            {/* Observation Type Filter */}
            <div className="space-y-1">
              <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Observation Type</label>
              <select
                value={observationType}
                onChange={(e) => setObservationType(e.target.value)}
                className="enterprise-select py-2 px-3 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="">All Types (Image & Audio)</option>
                <option value="Image">Camera Trap (Image)</option>
                <option value="Audio">Audio Sensor (Audio)</option>
              </select>
            </div>

            {/* Date Range Preset */}
            <div className="space-y-1">
              <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Temporal Scope</label>
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                className="enterprise-select py-2 px-3 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="today">Today's detections</option>
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="all">All-Time records</option>
                <option value="custom">Custom Date Range...</option>
              </select>
            </div>

            {/* Custom Date Start */}
            {datePreset === 'custom' && (
              <div className="space-y-1 animate-slide-down">
                <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute inset-y-0 left-0 pl-3 h-4 w-4 my-auto text-slate-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="enterprise-input pl-9 py-2 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
            )}

            {datePreset === 'custom' && (
              <div className="space-y-1 animate-slide-down">
                <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">End Date</label>
                <div className="relative">
                  <Calendar className="absolute inset-y-0 left-0 pl-3 h-4 w-4 my-auto text-slate-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="enterprise-input pl-9 py-2 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Threat Level Filter */}
            <div className="space-y-1">
              <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">Threat Level</label>
              <select
                value={threatLevel}
                onChange={(e) => setThreatLevel(e.target.value)}
                className="enterprise-select py-2 px-3 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="">All Threat Levels</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* IUCN Status Filter */}
            <div className="space-y-1">
              <label className="block text-4xs font-bold uppercase tracking-wider text-slate-400">IUCN Status</label>
              <select
                value={iucnStatus}
                onChange={(e) => setIucnStatus(e.target.value)}
                className="enterprise-select py-2 px-3 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="">All IUCN Categories</option>
                <option value="Least Concern">Least Concern</option>
                <option value="Near Threatened">Near Threatened</option>
                <option value="Vulnerable">Vulnerable</option>
                <option value="Endangered">Endangered</option>
                <option value="Critically Endangered">Critically Endangered</option>
              </select>
            </div>

          </div>
        )}

        <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-900/60">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSurveyId('');
                setMonitoringSiteId('');
                setDeviceId('');
                setDatePreset('30days');
                setStartDate('');
                setEndDate('');
                setSpeciesName('');
                setObservationType('');
                setThreatLevel('');
                setIucnStatus('');
                setIncludeUnknown(false);
                setReportData(null);
              }}
              className="text-emerald-600 hover:text-emerald-500 font-bold text-xs"
            >
              Reset Filters
            </button>

            {/* Include Unknown Species Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-705 dark:text-slate-350 text-2xs font-bold bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
              <input 
                type="checkbox"
                checked={includeUnknown}
                onChange={(e) => setIncludeUnknown(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 h-3.5 w-3.5"
              />
              <span>Include Unknown Species</span>
            </label>
          </div>
          
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Compiling Report...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Generate Human-Readable Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-955/40 border border-rose-200 dark:border-rose-900/35 p-4 text-2xs text-rose-605 dark:text-rose-455 font-semibold">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
          <div>
            <p className="font-bold">Report Compilation Failed</p>
            <p className="font-medium mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Report view panel */}
      {reportData ? (
        <div className="space-y-6 animate-slide-down">
          
          {/* Main report sheet */}
          <div className="glass-card p-6 border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-md">
            
            {/* Top title and metadata */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-900">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-5.5 w-5.5 text-emerald-500" />
                  {reportData.report_metadata.title}
                </h2>
                <p className="text-4xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 uppercase tracking-widest">
                  Generated at {new Date(reportData.report_metadata.generated_at).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Export Panel (PDF button explicitly hidden) */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-3xs font-bold border border-slate-250 dark:border-slate-800 text-slate-655 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all bg-white dark:bg-slate-950"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleDownloadJSON}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-3xs font-bold border border-slate-250 dark:border-slate-800 text-slate-655 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all bg-white dark:bg-slate-950"
                >
                  <FileJson className="h-3.5 w-3.5 text-blue-500" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* Section 1: Project Information */}
            <div className="py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold border-b border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/5 px-4 rounded-xl mt-4">
              <div>
                <span className="block text-4xs uppercase tracking-wider text-slate-400 font-bold mb-0.5">Survey Project</span>
                <p className="text-slate-850 dark:text-slate-200">
                  {surveyId ? surveys.find(s => s.id === parseInt(surveyId))?.title || `ID #${surveyId}` : 'All Surveys'}
                </p>
              </div>
              <div>
                <span className="block text-4xs uppercase tracking-wider text-slate-400 font-bold mb-0.5">Monitoring Site</span>
                <p className="text-slate-850 dark:text-slate-200">
                  {monitoringSiteId ? sites.find(s => s.id === parseInt(monitoringSiteId))?.name || `ID #${monitoringSiteId}` : 'All Sites'}
                </p>
              </div>
              <div>
                <span className="block text-4xs uppercase tracking-wider text-slate-400 font-bold mb-0.5">Report Scope</span>
                <p className="text-slate-850 dark:text-slate-200">
                  {datePreset === 'today' ? "Today's observations" : datePreset === '7days' ? "Last 7 days" : datePreset === '30days' ? "Last 30 days" : datePreset === 'all' ? "All time records" : "Custom range"}
                </p>
              </div>
              <div>
                <span className="block text-4xs uppercase tracking-wider text-slate-400 font-bold mb-0.5">Generated By</span>
                <p className="text-slate-850 dark:text-slate-200 font-extrabold">{reportData.report_metadata.generated_by}</p>
              </div>
            </div>

            {/* Section 2: Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-6">
              
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950/20 shadow-xs">
                <span className="block text-4xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Total Observations</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">{reportData.report_metadata.total_observations}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950/20 shadow-xs">
                <span className="block text-4xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Total Animals Detected</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">{reportData.report_metadata.total_animals_detected}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950/20 shadow-xs">
                <span className="block text-4xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Species Richness</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">{reportData.report_metadata.species_richness}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950/20 shadow-xs">
                <span className="block text-4xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Shannon Diversity Index</span>
                <p className="text-xl font-extrabold text-emerald-650 dark:text-emerald-400 tracking-tight mt-0.5">{reportData.report_metadata.shannon_diversity_index}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950/20 shadow-xs">
                <span className="block text-4xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Threatened Count</span>
                <p className={`text-xl font-extrabold tracking-tight mt-0.5 ${reportData.report_metadata.threatened_species_count > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  {reportData.report_metadata.threatened_species_count}
                </p>
              </div>

            </div>

            {/* Section 3: Species Distribution Table */}
            <div className="mt-8 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-900/60">
                <Award className="h-4.5 w-4.5 text-emerald-500" />
                Species Distribution Summary Table
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-900">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                      <th className="p-4">Species Common Name</th>
                      <th className="p-4 text-center">Observation Count</th>
                      <th className="p-4 text-center">Average AI Confidence</th>
                      <th className="p-4 text-center">Threat Level</th>
                      <th className="p-4 text-center">IUCN Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60 text-slate-700 dark:text-slate-355 font-semibold">
                    {reportData.species_summary.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400">
                          No observations recorded for the specified criteria.
                        </td>
                      </tr>
                    ) : (
                      reportData.species_summary.map((sp, idx) => {
                        const isThreatened = ["Vulnerable", "Endangered", "Critically Endangered"].includes(sp.iucn_status);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/5 transition-colors">
                            <td className="p-4 text-slate-905 dark:text-white font-extrabold">{sp.species === "Unknown Species" ? "Species Requires Verification" : sp.species}</td>
                            <td className="p-4 text-center font-extrabold">{sp.count}</td>
                            <td className="p-4 text-center font-mono text-[11px]">{Math.round(sp.avg_confidence * 100)}%</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-5xs font-bold uppercase border ${
                                sp.threat_level === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30' :
                                sp.threat_level === 'High' ? 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30' :
                                'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                              }`}>
                                {sp.threat_level}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-5xs font-bold uppercase border ${
                                isThreatened ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30' :
                                'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                              }`}>
                                {sp.iucn_status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Behavior and Conservation Alert Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              
              {/* Behaviors */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-705 dark:text-slate-300 pb-1.5 border-b border-slate-100 dark:border-slate-900/60">
                  Observed Behaviours Summary
                </h3>
                {reportData.behaviour_summary.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No specific behaviors reported in the selected observations scope.</p>
                ) : (
                  <ul className="list-disc pl-5 text-xs text-slate-655 dark:text-slate-400 space-y-1.5 font-semibold">
                    {reportData.behaviour_summary.map((b, i) => (
                      <li key={i} className="capitalize">{b}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Conservation Alerts */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-705 dark:text-slate-300 pb-1.5 border-b border-slate-100 dark:border-slate-900/60">
                  Conservation Alerts & Recommendations
                </h3>
                <div className="space-y-3">
                  {reportData.conservation_alerts.map((alert, idx) => {
                    const isCrit = alert.includes("CRITICAL");
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-2.5 rounded-xl p-4 text-2xs font-semibold border ${
                          isCrit 
                            ? 'bg-rose-50 dark:bg-rose-955/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-400' 
                            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400'
                        }`}
                      >
                        {isCrit ? (
                          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                        )}
                        <div>
                          <p className="font-bold">{isCrit ? 'Conservation Action Required' : 'Standard Assessment'}</p>
                          <p className="font-medium mt-0.5 leading-relaxed">{alert}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="glass-card p-10 min-h-[300px] flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950">
          <FilePieChart className="h-12 w-12 text-slate-350 dark:text-slate-500 mb-3 animate-pulse" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Awaiting Report Compilation</h4>
          <p className="text-xs text-slate-550 dark:text-slate-400 max-w-sm mt-1 leading-relaxed font-semibold">
            Select survey or monitoring parameters in the filters panel above, and click "Generate Report" to compile human-readable wildlife analysis.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;
