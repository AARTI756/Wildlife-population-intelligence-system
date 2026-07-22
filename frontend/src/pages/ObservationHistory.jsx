import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { INDIAN_SPECIES, formatIST, nowISTLocal } from '../utils/india';
import ConfirmModal from '../components/common/ConfirmModal';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeletons';
import { 
  Eye, 
  Plus, 
  Edit3, 
  Trash2, 
  Info,
  Calendar,
  Clock,
  ClipboardList,
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Cpu,
  FileText
} from 'lucide-react';

const extractErrorMessage = (err) => {
  const detail = err.response?.data?.detail;
  if (!detail) {
    return err.message || 'An unexpected error occurred.';
  }
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map(d => {
      const field = d.loc && d.loc.length > 1 ? d.loc.slice(1).join('.') : '';
      return `${field ? field + ': ' : ''}${d.msg}`;
    }).join(', ');
  }
  if (typeof detail === 'object') {
    return JSON.stringify(detail);
  }
  return 'Operation failed.';
};

const renderSourceBadge = (type) => {
  if (type === 'Camera Trap') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/25">
        🟢 AI Image
      </span>
    );
  } else if (type === 'Audio Sensor') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-900/25">
        🔵 AI Audio
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/25">
        🟠 Manual
      </span>
    );
  }
};

const formatSpeciesNameDisplay = (name) => {
  if (!name) return "False Trigger / Unknown";
  if (name === "Unknown Species") return "Species Requires Verification";
  return name;
};

const ObservationHistory = () => {
  const { hasRole } = useAuth();
  const [observations, setObservations] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Prediction histories for matching AI log telemetry
  const [predictionHistories, setPredictionHistories] = useState([]);
  
  // Custom toast notification states
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  
  // View states
  const [viewMode, setViewMode] = useState('list'); // Table mode default for logs
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentObsId, setCurrentObsId] = useState(null);
  const [apiSaving, setApiSaving] = useState(false);

  // Reusable Delete Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Observation Details Inspector state
  const [inspectingObs, setInspectingObs] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [surveyFilter, setSurveyFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [includeUnknown, setIncludeUnknown] = useState(false);
  const itemsPerPage = 10; // larger page size for logs

  // Form states
  const [speciesName, setSpeciesName] = useState('');
  const [count, setCount] = useState('1');
  const [timestamp, setTimestamp] = useState('');
  const [surveyId, setSurveyId] = useState('');
  const [observationType, setObservationType] = useState('Visual');
  const [notes, setNotes] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [uploadedImageId, setUploadedImageId] = useState('');
  const [uploadedAudioId, setUploadedAudioId] = useState('');
  const [sites, setSites] = useState([]);
  const [images, setImages] = useState([]);
  const [audios, setAudios] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  const canEdit = hasRole(['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer']);

  useEffect(() => {
    fetchObservationsAndSurveys(includeUnknown);
  }, [includeUnknown]);

  const fetchObservationsAndSurveys = async (incUnknown = false) => {
    try {
      const [obsRes, surveysRes, sitesRes, imagesRes, audiosRes, histRes] = await Promise.all([
        api.get('/api/observations', { params: { include_unknown: incUnknown } }),
        api.get('/api/surveys'),
        api.get('/api/monitoring-sites'),
        api.get('/api/uploads/images').catch(() => ({ data: [] })),
        api.get('/api/uploads/audios').catch(() => ({ data: [] })),
        api.get('/api/uploads/prediction-history', { params: { include_unknown: incUnknown } }).catch(() => ({ data: [] }))
      ]);
      setObservations(obsRes.data);
      setSurveys(surveysRes.data);
      setSites(sitesRes.data);
      setImages(imagesRes.data || []);
      setAudios(audiosRes.data || []);
      setPredictionHistories(histRes.data || []);
    } catch (err) {
      setError('Connection to server failed. Please ensure the backend is active.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSpeciesName('');
    setCount('1');
    setTimestamp(nowISTLocal()); // IST-adjusted current time
    setSurveyId(surveys[0]?.id || '');
    setObservationType('Visual');
    setNotes('');
    setSelectedSiteId('');
    setDeviceId('');
    setUploadedImageId('');
    setUploadedAudioId('');
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (e, obs) => {
    e.stopPropagation(); // prevent opening details modal
    setIsEditing(true);
    setCurrentObsId(obs.id);
    setSpeciesName(obs.species_name || obs.species || '');
    setCount(obs.count != null ? obs.count.toString() : '0');
    
    let tsVal = '';
    const rawTs = obs.timestamp || obs.observation_datetime;
    if (rawTs) {
      tsVal = typeof rawTs === 'string' ? rawTs.substring(0, 16) : new Date(rawTs).toISOString().substring(0, 16);
    } else {
      tsVal = new Date().toISOString().substring(0, 16);
    }
    setTimestamp(tsVal);
    
    setSurveyId(obs.survey_id || '');
    setObservationType(obs.observation_type || obs.method || 'Visual');
    setNotes(obs.notes || '');
    setSelectedSiteId(obs.monitoring_site_id ? obs.monitoring_site_id.toString() : '');
    setDeviceId(obs.device_id || '');
    setUploadedImageId(obs.uploaded_image_id ? obs.uploaded_image_id.toString() : '');
    setUploadedAudioId(obs.uploaded_audio_id ? obs.uploaded_audio_id.toString() : '');
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field-level validations
    const errors = {};
    if (!speciesName.trim()) errors.speciesName = "Species Name is required";
    
    const parsedCount = parseInt(count);
    if (isNaN(parsedCount) || parsedCount < 0) {
      errors.count = "Observation count must be a non-negative number";
    }

    if (!timestamp) errors.timestamp = "Date and time of observation is required";
    if (!surveyId) errors.surveyId = "Linked Survey Workspace is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setApiSaving(true);

    const payload = {
      species_name: speciesName.trim(),
      count: parsedCount,
      timestamp: new Date(timestamp).toISOString(),
      survey_id: parseInt(surveyId),
      observation_type: observationType,
      notes: notes.trim() || null,
      monitoring_site_id: selectedSiteId ? parseInt(selectedSiteId) : null,
      device_id: deviceId.trim() || null,
      uploaded_image_id: uploadedImageId ? parseInt(uploadedImageId) : null,
      uploaded_audio_id: uploadedAudioId ? parseInt(uploadedAudioId) : null,
      status: "Pending Analysis"
    };

    try {
      if (isEditing) {
        await api.put(`/api/observations/${currentObsId}`, payload);
        setToastMessage(`Observation log updated successfully`);
      } else {
        await api.post('/api/observations', payload);
        setToastMessage(`Observation log for '${speciesName}' registered successfully`);
      }
      setToastType('success');
      setTimeout(() => setToastMessage(null), 4000);
      setShowModal(false);
      fetchObservationsAndSurveys();
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      setToastType('error');
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 6000);
    } finally {
      setApiSaving(false);
    }
  };

  const handleDeleteTrigger = (e, id) => {
    e.stopPropagation(); // prevent opening details modal
    setDeletingId(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/observations/${deletingId}`);
      setToastType('success');
      setToastMessage('Observation entry deleted successfully');
      setTimeout(() => setToastMessage(null), 4000);
      setDeleteModalOpen(false);
      fetchObservationsAndSurveys();
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      setToastType('error');
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getSurveyName = (id) => {
    const s = surveys.find((survey) => survey.id === id);
    return s ? s.name : 'Independent Sighting';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSurveyFilter('All');
    setSortBy('date-desc');
    setIncludeUnknown(false);
    setCurrentPage(1);
  };

  // Search & Filter & Sort
  const filteredObservations = observations
    .filter((obs) => {
      const speciesNameStr = obs.species_name || obs.species || "False Trigger / Unknown";
      const matchesSearch = speciesNameStr.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSurvey = 
        surveyFilter === 'All' || 
        obs.survey_id === parseInt(surveyFilter);

      return matchesSearch && matchesSurvey;
    })
    .sort((a, b) => {
      const tsA = a.timestamp || a.observation_datetime;
      const tsB = b.timestamp || b.observation_datetime;
      if (sortBy === 'date-desc') return new Date(tsB || 0) - new Date(tsA || 0);
      if (sortBy === 'date-asc') return new Date(tsA || 0) - new Date(tsB || 0);
      if (sortBy === 'species-asc') {
        const nameA = a.species_name || a.species || "False Trigger / Unknown";
        const nameB = b.species_name || b.species || "False Trigger / Unknown";
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredObservations.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentObservations = filteredObservations.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const showClearButton = searchTerm !== '' || surveyFilter !== 'All' || sortBy !== 'date-desc' || includeUnknown;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Observations History</h1>
          <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">Catalogued Indian wildlife species sightings — camera trap, acoustic, and visual field logs.</p>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 self-start rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Observation</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/35 p-4 text-sm text-rose-600 dark:text-rose-455">
          <Info className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search species..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="enterprise-input h-10 !pl-10 !pr-4 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {showClearButton && (
            <button
              onClick={clearFilters}
              className="flex h-10 items-center gap-1.5 px-3.5 text-xs font-bold text-slate-705 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors bg-white dark:bg-slate-950"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </button>
          )}

          <select
            value={surveyFilter}
            onChange={(e) => { setSurveyFilter(e.target.value); setCurrentPage(1); }}
            className="enterprise-select h-10 !px-3.5 text-xs rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-300 font-bold max-w-[160px]"
          >
            <option value="All">All Surveys</option>
            {surveys.map((survey) => (
              <option key={survey.id} value={survey.id}>
                {survey.name}
              </option>
            ))}
          </select>

          {/* Include Unknown Species Toggle */}
          <label className="flex h-10 items-center gap-2 cursor-pointer select-none rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 text-xs font-bold text-slate-705 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
            <input 
              type="checkbox"
              checked={includeUnknown}
              onChange={(e) => { setIncludeUnknown(e.target.checked); setCurrentPage(1); }}
              className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 h-3.5 w-3.5"
            />
            <span>Include Unknown Species</span>
          </label>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="enterprise-select h-10 !px-3.5 text-xs rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-300 font-bold"
          >
            <option value="date-desc">Newest Time</option>
            <option value="date-asc">Oldest Time</option>
            <option value="species-asc">Species A-Z</option>
          </select>

          {/* View Toggler */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1.2 bg-slate-50 dark:bg-slate-950">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all focus:outline-none ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-405 shadow-sm' : 'text-slate-400'}`}
              title="Grid View"
            >
              <LayoutGrid className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all focus:outline-none ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-405 shadow-sm' : 'text-slate-400'}`}
              title="List View"
            >
              <List className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Observation rendering */}
      {loading ? (
        viewMode === 'grid' ? <CardSkeleton count={6} /> : <TableSkeleton rows={6} cols={7} />
      ) : currentObservations.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentObservations.map((obs) => (
              <div 
                key={obs.id} 
                onClick={() => setInspectingObs(obs)}
                className="glass-card p-6 flex flex-col justify-between space-y-5 hover:border-emerald-500/25 transition-all cursor-pointer shadow-sm relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-4xs font-bold border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                      Count: x{obs.count ?? 0}
                    </span>
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleOpenEdit(e, obs)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          title="Edit log"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTrigger(e, obs.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
                          title="Delete log"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {formatSpeciesNameDisplay(obs.species_name || obs.species)}
                  </h3>

                  <div className="mt-4 space-y-2 text-xs text-slate-555 dark:text-slate-400 font-semibold">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate">Survey: {obs.survey?.name ?? getSurveyName(obs.survey_id) ?? "Not Linked"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate">Site: {obs.monitoring_site?.name ?? obs.site?.name ?? "Not Linked"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 dark:text-slate-405">Source:</span>
                        {renderSourceBadge(obs.observation_type || obs.method)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Logged: {(obs.timestamp || obs.observation_datetime) ? formatIST(obs.timestamp || obs.observation_datetime) : "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-105 dark:border-slate-800 text-4xs text-slate-500 dark:text-slate-500 font-mono flex items-center justify-between">
                  <span>Sighting ID: OBS-{obs.id}</span>
                  {obs.image_upload ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">📷 Image Evidence</span>
                  ) : obs.audio_upload ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">🎵 Audio Evidence</span>
                  ) : (
                    <span>No Attached Media</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-650 dark:text-slate-400 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Species Identifier</th>
                    <th className="px-5 py-3.5">Survey</th>
                    <th className="px-5 py-3.5">Monitoring Site</th>
                    <th className="px-5 py-3.5">Method / Device</th>
                    <th className="px-5 py-3.5">Evidence</th>
                    <th className="px-5 py-3.5">Logged Timestamp</th>
                    {canEdit && <th className="px-5 py-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60 font-semibold">
                  {currentObservations.map((obs) => (
                    <tr 
                      key={obs.id} 
                      onClick={() => setInspectingObs(obs)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                        <span className="hover:text-emerald-600 dark:hover:text-emerald-450 transition-colors">
                          {formatSpeciesNameDisplay(obs.species_name || obs.species)}
                        </span>
                        <span className="block text-4xs text-slate-450 dark:text-slate-500 font-mono mt-0.5">OBS-{obs.id}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-405">
                        {obs.survey?.name ?? getSurveyName(obs.survey_id) ?? "Not Linked"}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-405">
                        {obs.monitoring_site?.name ?? obs.site?.name ?? "Not Linked"}
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                        <div className="mb-1">{renderSourceBadge(obs.observation_type || obs.method)}</div>
                        <span className="block text-4xs text-slate-500 dark:text-slate-500 truncate max-w-[120px]">{obs.camera_trap?.name ?? obs.audio_sensor?.name ?? obs.device_id ?? "—"}</span>
                      </td>
                      <td className="px-5 py-4">
                        {obs.image_upload ? (
                          <span className="text-emerald-600 dark:text-emerald-405 font-bold flex items-center gap-1">📷 {obs.image_upload.filename ?? "No Image"}</span>
                        ) : obs.audio_upload ? (
                          <span className="text-emerald-600 dark:text-emerald-455 font-bold flex items-center gap-1">🎵 {obs.audio_upload.filename ?? "No Audio"}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-2xs">
                        {(obs.timestamp || obs.observation_datetime) ? formatIST(obs.timestamp || obs.observation_datetime) : "—"}
                      </td>
                      {canEdit && (
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => handleOpenEdit(e, obs)}
                              className="p-1 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              title="Edit log"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteTrigger(e, obs.id)}
                              className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                              title="Delete log"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Eye className="h-12 w-12 text-slate-400 dark:text-slate-650 mb-3" />
          <p className="text-sm font-bold text-slate-900 dark:text-slate-350">No Observations Catalogued</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 text-center max-w-xs leading-normal">
            No sightings logged. Record animal telemetry tracks, sound, or photographic triggers below.
          </p>
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-450 border border-emerald-500/25 bg-emerald-50/20 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            >
              Log Sighting
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl border border-slate-200 dark:border-slate-950 text-xs font-semibold">
          <span className="text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-800 dark:text-slate-200">{indexOfFirstItem + 1}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(indexOfLastItem, filteredObservations.length)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{filteredObservations.length}</strong> entries
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 ${
                currentPage === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3.5 py-1 rounded bg-emerald-600 text-white font-bold">
              {currentPage}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 ${
                currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal-card animate-fade-in shadow-2xl">
            <div className="enterprise-modal-header">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-emerald-500 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Edit Observation Entry' : 'Log Field Sighting Observation'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="enterprise-modal-body">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="enterprise-label">Species Name / Common Name *</label>
                    <input
                      type="text"
                      required
                      list="indian-species-list"
                      value={speciesName}
                      onChange={(e) => setSpeciesName(e.target.value)}
                      className={`enterprise-input ${formErrors.speciesName ? 'border-rose-500 focus:border-rose-500' : ''}`}
                      placeholder="e.g. Bengal Tiger, Indian Leopard, Asian Elephant"
                    />
                    <datalist id="indian-species-list">
                      {INDIAN_SPECIES.map((sp) => (
                        <option key={sp} value={sp} />
                      ))}
                    </datalist>
                    {formErrors.speciesName && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.speciesName}</p>}
                  </div>

                  <div>
                    <label className="enterprise-label">Sighting Count *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={count}
                      onChange={(e) => setCount(e.target.value)}
                      className={`enterprise-input ${formErrors.count ? 'border-rose-500 focus:border-rose-500' : ''}`}
                    />
                    {formErrors.count && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.count}</p>}
                  </div>

                  <div>
                    <label className="enterprise-label">Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={timestamp}
                      onChange={(e) => setTimestamp(e.target.value)}
                      className={`enterprise-input ${formErrors.timestamp ? 'border-rose-500 focus:border-rose-500' : ''}`}
                    />
                    {formErrors.timestamp && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.timestamp}</p>}
                  </div>

                  <div>
                    <label className="enterprise-label">Observation Method</label>
                    <select
                      value={observationType}
                      onChange={(e) => setObservationType(e.target.value)}
                      className="enterprise-select"
                    >
                      <option>Camera Trap</option>
                      <option>Audio Sensor</option>
                      <option>Visual Sighting</option>
                      <option>Spacial Spoor Track</option>
                    </select>
                  </div>

                  <div>
                    <label className="enterprise-label">Device Serial Tag (If Sensor)</label>
                    <input
                      type="text"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      className="enterprise-input"
                      placeholder="e.g. CAM-VALLEY-12"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="enterprise-label">Linked Active Survey Workspace *</label>
                    <select
                      required
                      value={surveyId}
                      onChange={(e) => setSurveyId(e.target.value)}
                      className={`enterprise-select ${formErrors.surveyId ? 'border-rose-500 focus:border-rose-500' : ''}`}
                    >
                      <option value="" disabled>Select Survey Workspace</option>
                      {surveys.map((svy) => (
                        <option key={svy.id} value={svy.id}>
                          {svy.name} ({svy.monitoring_location})
                        </option>
                      ))}
                    </select>
                    {formErrors.surveyId && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.surveyId}</p>}
                  </div>

                  <div>
                    <label className="enterprise-label">Linked Image Asset Evidence</label>
                    <select
                      value={uploadedImageId}
                      onChange={(e) => setUploadedImageId(e.target.value)}
                      className="enterprise-select"
                    >
                      <option value="">No Image Asset</option>
                      {images.map((img) => (
                        <option key={img.id} value={img.id}>
                          {img.filename ?? 'Unnamed File'} (ID: {img.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="enterprise-label">Linked Audio Asset Evidence</label>
                    <select
                      value={uploadedAudioId}
                      onChange={(e) => setUploadedAudioId(e.target.value)}
                      className="enterprise-select"
                    >
                      <option value="">No Audio Asset</option>
                      {audios.map((aud) => (
                        <option key={aud.id} value={aud.id}>
                          {aud.filename ?? 'Unnamed File'} (ID: {aud.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="enterprise-label">Observation Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="3"
                      className="enterprise-textarea h-20"
                      placeholder="Describe context, species behavior, or micro-habitat remarks..."
                    />
                  </div>
                </div>
              </div>

              <div className="enterprise-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={apiSaving}
                  className="enterprise-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={apiSaving}
                  className="enterprise-btn-primary flex items-center gap-2"
                >
                  {apiSaving && <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  <span>{isEditing ? 'Save Changes' : 'Log Observation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Observation Sighting Details Modal */}
      {inspectingObs && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal-card max-w-lg animate-fade-in shadow-2xl">
            <div className="enterprise-modal-header">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Observation Sighting Workspace
                </h3>
              </div>
              <button
                onClick={() => setInspectingObs(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="enterprise-modal-body space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-1">Species Name</span>
                  <span className="text-slate-900 dark:text-white font-extrabold italic text-sm">
                    {inspectingObs.species_name || inspectingObs.species || "False Trigger / Unknown"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-1">Sighting Count</span>
                  <span className="text-slate-900 dark:text-white font-extrabold text-sm">
                    x{inspectingObs.count ?? 0}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  <span className="block text-4xs uppercase tracking-wider text-slate-505 font-bold mb-1">Survey Workspace</span>
                  <span className="text-slate-900 dark:text-white font-bold truncate block">
                    {inspectingObs.survey?.name ?? getSurveyName(inspectingObs.survey_id)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  <span className="block text-4xs uppercase tracking-wider text-slate-505 font-bold mb-1">Monitoring Site</span>
                  <span className="text-slate-900 dark:text-white font-bold truncate block">
                    {inspectingObs.monitoring_site?.name ?? inspectingObs.site?.name ?? "Not Linked"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  <span className="block text-4xs uppercase tracking-wider text-slate-505 font-bold mb-1">Method & Hardware Tag</span>
                  <span className="text-slate-900 dark:text-white font-bold truncate block">
                    {inspectingObs.method ?? inspectingObs.observation_type ?? "N/A"} 
                    {inspectingObs.device_id ? ` (${inspectingObs.device_id})` : ''}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  <span className="block text-4xs uppercase tracking-wider text-slate-505 font-bold mb-1">Observation Timestamp</span>
                  <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-emerald-500" />
                    {(inspectingObs.timestamp || inspectingObs.observation_datetime) ? formatIST(inspectingObs.timestamp || inspectingObs.observation_datetime) : "—"}
                  </span>
                </div>

                {inspectingObs.animal_call_detected && (
                  <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-700 dark:text-slate-350">
                    <span className="block text-4xs uppercase tracking-wider text-slate-505 font-bold mb-1">Acoustic Classification</span>
                    <span className="text-emerald-600 dark:text-emerald-450 font-extrabold text-xs">
                      {inspectingObs.animal_call_category || "Environmental Noise"}
                    </span>
                  </div>
                )}
              </div>

              {/* Linked AI Prediction Audit Details */}
              {(() => {
                const matchedHist = predictionHistories.find(ph => ph.linked_observation_id === inspectingObs.id);
                if (!matchedHist) return null;
                return (
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5 text-xs text-slate-705 dark:text-slate-350 space-y-2">
                    <span className="block text-4xs uppercase tracking-wider text-emerald-600 dark:text-emerald-450 font-extrabold flex items-center gap-1">
                      <Cpu className="h-3.5 w-3.5" />
                      Associated AI Detection Telemetry
                    </span>
                    <div className="grid grid-cols-2 gap-2.5 text-2xs font-semibold pt-2 border-t border-emerald-500/10">
                      <div>
                        <span className="text-slate-400 font-medium">Original Filename:</span>
                        <p className="font-mono text-slate-900 dark:text-white truncate">{matchedHist.original_filename}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Confidence Score:</span>
                        <p className="text-slate-900 dark:text-white font-mono font-extrabold">{Math.round(matchedHist.confidence * 100)}%</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Threshold Filter Used:</span>
                        <p className="text-slate-900 dark:text-white font-mono">{Math.round(matchedHist.threshold_used * 100)}%</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Inference Time:</span>
                        <p className="text-slate-900 dark:text-white font-mono">{matchedHist.inference_time} ms</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Notes */}
              <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-700 dark:text-slate-300">
                <span className="block text-4xs uppercase tracking-wider text-slate-505 font-bold mb-1">Field Remarks / Notes</span>
                <p className="italic leading-relaxed font-semibold mt-1">
                  {inspectingObs.notes || "No micro-habitat remarks logged for this sighting."}
                </p>
              </div>

              {/* Media Previews */}
              {inspectingObs.image_upload && (
                <div className="space-y-2">
                  <span className="block text-4xs uppercase tracking-wider text-slate-505 font-bold">Linked Photo Evidence</span>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <img 
                      src={`${api.defaults.baseURL || 'http://localhost:8000'}${inspectingObs.image_upload.filepath}`}
                      alt="Sighting Evidence" 
                      className="w-full h-48 object-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&auto=format&fit=crop&q=60'; }}
                    />
                  </div>
                </div>
              )}

              {inspectingObs.audio_upload && (
                <div className="space-y-2">
                  <span className="block text-4xs uppercase tracking-wider text-slate-505 font-bold">Linked Acoustic Audio Evidence</span>
                  <div className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl flex flex-col gap-2">
                    <span className="text-2xs font-bold text-slate-700 dark:text-slate-300 truncate">{inspectingObs.audio_upload.filename}</span>
                    <audio 
                      src={`${api.defaults.baseURL || 'http://localhost:8000'}${inspectingObs.audio_upload.filepath}`}
                      controls 
                      className="w-full h-8 scale-98 mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="enterprise-modal-footer">
              <button
                onClick={() => setInspectingObs(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
              >
                Close Sighting Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Observation Sighting?"
        message="This action will permanently delete this catalogued wildlife sighting log. This action cannot be undone."
        confirmText="Delete Log"
        loading={deleteLoading}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-55 flex items-center gap-3 rounded-xl border p-4 text-xs font-bold shadow-2xl transition-all animate-fade-in ${
          toastType === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
            : 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-455'
        }`}>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="p-0.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-650 shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ObservationHistory;
