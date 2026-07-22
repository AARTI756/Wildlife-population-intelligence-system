import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  PLACEHOLDER_SURVEY_NAME,
  PLACEHOLDER_SURVEY_LOC,
  PLACEHOLDER_SURVEY_LAT,
  PLACEHOLDER_SURVEY_LON,
  formatISTDate,
} from '../utils/india';
import ConfirmModal from '../components/common/ConfirmModal';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeletons';
import { 
  ClipboardList, 
  Plus, 
  Edit3, 
  Trash2, 
  Info,
  Calendar,
  MapPin,
  Trees,
  Cpu,
  Search,
  SlidersHorizontal,
  ChevronDown,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
  Compass,
  Sparkles
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

const SurveyManagement = () => {
  const { hasRole } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Custom toast notification states
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  
  // View states
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSurveyId, setCurrentSurveyId] = useState(null);
  const [apiSaving, setApiSaving] = useState(false);

  // Reusable Delete Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Search, filter, sorting, pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('All');
  const [protectedFilter, setProtectedFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, name-asc, name-desc
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Form states
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [monitoringLocation, setMonitoringLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [habitatType, setHabitatType] = useState('Forest');
  const [monitoringDevice, setMonitoringDevice] = useState('Camera Trap');
  const [protectedArea, setProtectedArea] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [monitoringSites, setMonitoringSites] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Workspace Inspector states
  const [inspectingSurvey, setInspectingSurvey] = useState(null);
  const [inspectingSite, setInspectingSite] = useState(null);
  const [inspectingCameraTraps, setInspectingCameraTraps] = useState([]);
  const [inspectingAudioSensors, setInspectingAudioSensors] = useState([]);
  const [inspectingObservations, setInspectingObservations] = useState([]);
  const [inspectingImages, setInspectingImages] = useState([]);
  const [inspectingAudios, setInspectingAudios] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState('summary');

  // Allowed roles
  const canEdit = hasRole(['Administrator', 'Wildlife Researcher', 'Forest Department Officer']);

  const handleInspectWorkspace = async (survey) => {
    setInspectingSurvey(survey);
    setWorkspaceTab('summary');
    
    // Find the associated site
    const site = monitoringSites.find(s => s.id === survey.monitoring_site_id);
    setInspectingSite(site || null);
    
    setWorkspaceLoading(true);
    try {
      const [trapsRes, sensorsRes, obsRes, imagesRes, audiosRes] = await Promise.all([
        api.get('/api/camera-traps'),
        api.get('/api/audio-sensors'),
        api.get('/api/observations'),
        api.get('/api/uploads/images'),
        api.get('/api/uploads/audios')
      ]);
      
      const siteId = survey.monitoring_site_id;
      const associatedTraps = trapsRes.data.filter(t => t.location_id === siteId);
      const associatedSensors = sensorsRes.data.filter(s => s.location_id === siteId);
      const associatedObs = obsRes.data.filter(o => o.survey_id === survey.id);
      const associatedImages = imagesRes.data.filter(i => i.survey_id === survey.id);
      const associatedAudios = audiosRes.data.filter(a => a.survey_id === survey.id);
      
      setInspectingCameraTraps(associatedTraps);
      setInspectingAudioSensors(associatedSensors);
      setInspectingObservations(associatedObs);
      setInspectingImages(associatedImages);
      setInspectingAudios(associatedAudios);
    } catch (err) {
      console.error("Error loading survey workspace resources:", err);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const [surveysRes, sitesRes] = await Promise.all([
        api.get('/api/surveys'),
        api.get('/api/monitoring-sites')
      ]);
      setSurveys(surveysRes.data);
      setMonitoringSites(sitesRes.data);
    } catch (err) {
      setError('Connection to server failed. Please ensure the backend is active.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setName('');
    setDate(new Date().toISOString().split('T')[0]);
    setMonitoringLocation('');
    setLatitude('');
    setLongitude('');
    setHabitatType('Forest');
    setMonitoringDevice('Camera Trap');
    setProtectedArea(false);
    setDescription('');
    setSelectedSiteId('');
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (survey) => {
    setIsEditing(true);
    setCurrentSurveyId(survey.id);
    setName(survey.name);
    setDate(survey.date ? survey.date.split('T')[0] : '');
    setMonitoringLocation(survey.monitoring_location);
    setLatitude(survey.latitude.toString());
    setLongitude(survey.longitude.toString());
    setHabitatType(survey.habitat_type);
    setMonitoringDevice(survey.monitoring_device);
    setProtectedArea(survey.protected_area);
    setDescription(survey.description || '');
    setSelectedSiteId(survey.monitoring_site_id ? survey.monitoring_site_id.toString() : '');
    setFormErrors({});
    setShowModal(true);
  };

  const handleSiteChange = (e) => {
    const siteId = e.target.value;
    setSelectedSiteId(siteId);
    if (siteId) {
      const site = monitoringSites.find(s => s.id === parseInt(siteId));
      if (site) {
        setMonitoringLocation(site.location || '');
        setLatitude(site.latitude != null ? site.latitude.toString() : '');
        setLongitude(site.longitude != null ? site.longitude.toString() : '');
        setProtectedArea(!!site.protected_area);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field-level validations
    const errors = {};
    if (!name.trim()) errors.name = "Campaign Title is required";
    if (!date) errors.date = "Survey Campaign Date is required";
    if (!monitoringLocation.trim()) errors.monitoringLocation = "Monitoring Location base is required";
    
    const parsedLat = parseFloat(latitude);
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      errors.latitude = "Latitude must be a valid decimal number between -90 and 90";
    }

    const parsedLng = parseFloat(longitude);
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      errors.longitude = "Longitude must be a valid decimal number between -180 and 180";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setApiSaving(true);

    const payload = {
      name: name.trim(),
      date,
      monitoring_location: monitoringLocation.trim(),
      latitude: parsedLat,
      longitude: parsedLng,
      habitat_type: habitatType,
      monitoring_device: monitoringDevice,
      protected_area: protectedArea,
      description: description.trim() || null,
      monitoring_site_id: selectedSiteId ? parseInt(selectedSiteId) : null
    };

    try {
      if (isEditing) {
        await api.put(`/api/surveys/${currentSurveyId}`, payload);
        setToastMessage(`Survey campaign '${name}' updated successfully`);
      } else {
        await api.post('/api/surveys', payload);
        setToastMessage(`Survey campaign '${name}' created successfully`);
      }
      setToastType('success');
      setTimeout(() => setToastMessage(null), 4000);
      setShowModal(false);
      fetchSurveys();
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

  const handleDeleteTrigger = (id) => {
    setDeletingId(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/surveys/${deletingId}`);
      setToastType('success');
      setToastMessage('Survey campaign deleted successfully along with all telemetry links');
      setTimeout(() => setToastMessage(null), 4000);
      setDeleteModalOpen(false);
      fetchSurveys();
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

  const clearFilters = () => {
    setSearchTerm('');
    setDeviceFilter('All');
    setProtectedFilter('All');
    setSortBy('date-desc');
    setCurrentPage(1);
  };

  // Filter, sort and pagination logic
  const filteredSurveys = surveys
    .filter((survey) => {
      const matchesSearch = 
        (survey.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (survey.monitoring_location || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDevice = deviceFilter === 'All' || survey.monitoring_device === deviceFilter;
      
      const matchesProtected = 
        protectedFilter === 'All' || 
        (protectedFilter === 'Protected' && survey.protected_area) ||
        (protectedFilter === 'Standard' && !survey.protected_area);

      return matchesSearch && matchesDevice && matchesProtected;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      return 0;
    });

  // Calculate pagination
  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSurveys = filteredSurveys.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const showClearButton = searchTerm !== '' || deviceFilter !== 'All' || protectedFilter !== 'All' || sortBy !== 'date-desc';

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Survey Management</h1>
          <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">Configure and manage active ecological surveys and research scopes.</p>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 self-start rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Create Survey</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/35 p-4 text-sm text-rose-600 dark:text-rose-455">
          <Info className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Bar (Search, Filters, Sort, Layout Toggle) */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search surveys..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="block w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:border-emerald-505 dark:focus:border-emerald-505 outline-none transition-all text-xs"
          />
        </div>

        {/* Filters and sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {showClearButton && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.8 text-2xs font-bold text-slate-605 dark:text-slate-350 hover:bg-slate-105 dark:hover:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
          
          {/* Device filter */}
          <select
            value={deviceFilter}
            onChange={(e) => { setDeviceFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-2xs font-bold text-slate-705 dark:text-slate-300 outline-none focus:border-emerald-500"
          >
            <option value="All">All Devices</option>
            <option value="Camera Trap">Camera Trap</option>
            <option value="Audio Sensor">Audio Sensor</option>
            <option value="Visual Observation">Visual Observation</option>
          </select>

          {/* Protected Area Filter */}
          <select
            value={protectedFilter}
            onChange={(e) => { setProtectedFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-2xs font-bold text-slate-705 dark:text-slate-300 outline-none focus:border-emerald-500"
          >
            <option value="All">All Habitats</option>
            <option value="Protected">Protected Parks</option>
            <option value="Standard">Standard Area</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-2xs font-bold text-slate-750 dark:text-slate-300 outline-none focus:border-emerald-500"
          >
            <option value="date-desc">Newest Date</option>
            <option value="date-asc">Oldest Date</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>

          {/* Layout Toggle */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1.2 bg-slate-50 dark:bg-slate-950">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all focus:outline-none ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-450 shadow-sm' : 'text-slate-400'}`}
              title="Grid View"
            >
              <LayoutGrid className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all focus:outline-none ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-450 shadow-sm' : 'text-slate-400'}`}
              title="Table View"
            >
              <List className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table list */}
      {loading ? (
        viewMode === 'grid' ? <CardSkeleton count={6} /> : <TableSkeleton rows={6} cols={7} />
      ) : currentSurveys.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentSurveys.map((survey) => (
              <div key={survey.id} className="glass-card p-6 flex flex-col justify-between space-y-6 hover:border-emerald-500/25 transition-all duration-300 shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-4xs font-bold border uppercase tracking-wider ${
                      survey.protected_area 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-405 border-emerald-205 dark:border-emerald-900/30' 
                        : 'bg-slate-55 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-205 dark:border-slate-800'
                    }`}>
                      {survey.protected_area ? 'Protected Area' : 'Standard Area'}
                    </span>
                    
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(survey)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          title="Edit Survey"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(survey.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
                          title="Delete Survey"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1">{survey.name}</h3>
                  
                  <div className="mt-4 space-y-2 text-xs text-slate-555 dark:text-slate-400 font-semibold">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{survey.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate">{survey.monitoring_location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trees className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{survey.habitat_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{survey.monitoring_device}</span>
                    </div>
                    {survey.monitoring_site_id && (
                      <div className="flex items-center gap-2 text-2xs text-emerald-650 dark:text-emerald-405 font-bold">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>Site: {monitoringSites.find(s => s.id === survey.monitoring_site_id)?.name || 'Linked Site'}</span>
                      </div>
                    )}
                  </div>
                  {survey.description && (
                    <p className="text-3xs text-slate-550 dark:text-slate-400 mt-2 line-clamp-2 border-l border-emerald-500/25 pl-2 italic">
                      {survey.description}
                    </p>
                  )}

                  <button
                    onClick={() => handleInspectWorkspace(survey)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-emerald-500/25 bg-emerald-50/50 hover:bg-emerald-100/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <Compass className="h-4 w-4" />
                    <span>Open Survey Workspace</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-4xs text-slate-500 dark:text-slate-500 font-mono">
                  <span>ID: SVY-{survey.id}</span>
                  <span>GPS: {survey.latitude.toFixed(4)}, {survey.longitude.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-655 dark:text-slate-400 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Survey Title</th>
                    <th className="px-5 py-3.5">Monitoring Location</th>
                    <th className="px-5 py-3.5">Device Type</th>
                    <th className="px-5 py-3.5">Habitat type</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60 font-semibold">
                  {currentSurveys.map((survey) => (
                    <tr key={survey.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{survey.name}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-405">{survey.monitoring_location}</td>
                      <td className="px-5 py-4">{survey.monitoring_device}</td>
                      <td className="px-5 py-4">{survey.habitat_type}</td>
                      <td className="px-5 py-4 font-mono text-2xs">{formatISTDate(survey.date)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-1.5 py-0.2 rounded text-5xs font-bold border uppercase tracking-wider ${
                          survey.protected_area 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-405 border-emerald-202' 
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-202'
                        }`}>
                          {survey.protected_area ? 'Protected' : 'Standard'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleInspectWorkspace(survey)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            title="Open Survey Workspace"
                          >
                            <Compass className="h-3.5 w-3.5" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(survey)}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                title="Edit Survey"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTrigger(survey.id)}
                                className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                title="Delete Survey"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
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
          <ClipboardList className="h-12 w-12 text-slate-400 dark:text-slate-650 mb-3" />
          <p className="text-sm font-bold text-slate-900 dark:text-slate-350">No Survey Campaigns Registered</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 text-center max-w-xs leading-normal">
            No surveys match the filters. Start a new research campaign tracking parameters in a monitor sector.
          </p>
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-450 border border-emerald-500/25 bg-emerald-50/20 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            >
              Create Campaign
            </button>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl border border-slate-200 dark:border-slate-955 text-xs font-semibold">
          <span className="text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-800 dark:text-slate-200">{indexOfFirstItem + 1}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(indexOfLastItem, filteredSurveys.length)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{filteredSurveys.length}</strong> surveys
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
                <ClipboardList className="h-5 w-5 text-emerald-500 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Edit Survey Details' : 'Register New Survey'}
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
                    <label className="enterprise-label">Survey Name / Field Campaign Title *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`enterprise-input ${formErrors.name ? 'border-rose-500 focus:border-rose-500' : ''}`}
                      placeholder={PLACEHOLDER_SURVEY_NAME}
                    />
                    {formErrors.name && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="enterprise-label">Survey Date *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={`enterprise-input ${formErrors.date ? 'border-rose-500 focus:border-rose-500' : ''}`}
                    />
                    {formErrors.date && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.date}</p>}
                  </div>

                  <div>
                    <label className="enterprise-label">Linked Monitoring Site</label>
                    <select
                      value={selectedSiteId}
                      onChange={handleSiteChange}
                      className="enterprise-select"
                    >
                      <option value="">Independent Survey (No Linked Monitoring Site)</option>
                      {monitoringSites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name} ({site.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="enterprise-label">Monitoring Location / Forest Zone *</label>
                    <input
                      type="text"
                      required
                      value={monitoringLocation}
                      onChange={(e) => setMonitoringLocation(e.target.value)}
                      className={`enterprise-input ${formErrors.monitoringLocation ? 'border-rose-500 focus:border-rose-500' : ''}`}
                      placeholder={PLACEHOLDER_SURVEY_LOC}
                    />
                    {formErrors.monitoringLocation && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.monitoringLocation}</p>}
                  </div>

                  <div>
                    <label className="enterprise-label">Latitude (GPS Coordinates) *</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className={`enterprise-input ${formErrors.latitude ? 'border-rose-500 focus:border-rose-500' : ''}`}
                      placeholder={PLACEHOLDER_SURVEY_LAT}
                    />
                    {formErrors.latitude && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.latitude}</p>}
                  </div>

                  <div>
                    <label className="enterprise-label">Longitude (GPS Coordinates) *</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className={`enterprise-input ${formErrors.longitude ? 'border-rose-500 focus:border-rose-500' : ''}`}
                      placeholder={PLACEHOLDER_SURVEY_LON}
                    />
                    {formErrors.longitude && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.longitude}</p>}
                  </div>

                  <div>
                    <label className="enterprise-label">Habitat Type</label>
                    <select
                      value={habitatType}
                      onChange={(e) => setHabitatType(e.target.value)}
                      className="enterprise-select"
                    >
                      <option>Forest</option>
                      <option>Grassland</option>
                      <option>Wetland</option>
                      <option>Desert</option>
                      <option>Savannah</option>
                      <option>Marine</option>
                    </select>
                  </div>

                   <div>
                    <label className="enterprise-label">Monitoring Device</label>
                    <select
                      value={monitoringDevice}
                      onChange={(e) => setMonitoringDevice(e.target.value)}
                      className="enterprise-select"
                    >
                      <option>Camera Trap</option>
                      <option>Audio Sensor</option>
                      <option>Visual Observation</option>
                      <option>Combined Array</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="enterprise-label">Survey Description / Scope</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows="3"
                      className="enterprise-textarea h-20"
                      placeholder="Provide scope description of ecological monitoring target..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="protected_area"
                    type="checkbox"
                    checked={protectedArea}
                    onChange={(e) => setProtectedArea(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-350 dark:border-slate-805 bg-white dark:bg-slate-950 text-emerald-650 focus:ring-emerald-500"
                  />
                  <label htmlFor="protected_area" className="text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                    Located in a Tiger Reserve / National Park / Wildlife Sanctuary
                  </label>
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
                  <span>{isEditing ? 'Save Changes' : 'Create Survey'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Survey Workspace Inspector Modal */}
      {inspectingSurvey && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal-card max-w-4xl animate-fade-in shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
              <div>
                <span className="text-5xs font-bold uppercase px-2 py-0.5 rounded border border-emerald-500/25 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-605 dark:text-emerald-400">
                  Survey Workspace
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1 font-sans">
                  {inspectingSurvey.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectingSurvey(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Workspace tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto shrink-0 font-bold">
              {[
                { id: 'summary', name: 'Summary & Site' },
                { id: 'devices', name: 'Hardware Coverage' },
                { id: 'observations', name: 'Observations Log' },
                { id: 'media', name: 'Evidence Media' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setWorkspaceTab(tab.id)}
                  className={`px-4 py-3 text-xs border-b-2 transition-all focus:outline-none ${
                    workspaceTab === tab.id
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-slate-650 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto py-6 pr-1 font-semibold">
              {workspaceLoading ? (
                <div className="flex h-48 items-center justify-center text-emerald-500">
                  <span className="h-6 w-6 border-2 border-emerald-550 border-t-transparent rounded-full animate-spin"></span>
                  <span className="ml-2.5 text-xs font-bold text-slate-650 dark:text-slate-400">Aggregating telemetry workspace...</span>
                </div>
              ) : (
                <>
                  {workspaceTab === 'summary' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Info Block */}
                        <div className="space-y-4">
                          <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-500">Survey Coordinates</h4>
                          <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 grid grid-cols-2 gap-4 text-xs text-slate-700 dark:text-slate-300">
                            <div>
                              <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold">Date</span>
                              <span className="text-slate-900 dark:text-slate-100 font-bold">{inspectingSurvey.date}</span>
                            </div>
                            <div>
                              <span className="block text-4xs uppercase tracking-wider text-slate-505 font-bold">Habitat Type</span>
                              <span className="text-slate-900 dark:text-slate-100 font-bold">{inspectingSurvey.habitat_type}</span>
                            </div>
                            <div>
                              <span className="block text-4xs uppercase tracking-wider text-slate-505 font-bold">Device Class</span>
                              <span className="text-slate-900 dark:text-slate-100 font-bold">{inspectingSurvey.monitoring_device}</span>
                            </div>
                            <div>
                              <span className="block text-4xs uppercase tracking-wider text-slate-505 font-bold">GPS Coords</span>
                              <span className="font-mono text-2xs">{inspectingSurvey.latitude.toFixed(5)}, {inspectingSurvey.longitude.toFixed(5)}</span>
                            </div>
                          </div>

                          {inspectingSurvey.description && (
                            <div>
                              <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-2">Scope Description</h4>
                              <p className="text-xs text-slate-700 dark:text-slate-400 leading-relaxed border-l-2 border-emerald-500/30 pl-3.5 italic font-semibold">
                                {inspectingSurvey.description}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Connected Site Block */}
                        <div className="space-y-4">
                          <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-500">Connected Monitoring Site</h4>
                          {inspectingSite ? (
                            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/5 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{inspectingSite.name}</span>
                                <span className={`inline-flex px-1.5 py-0.2 rounded text-5xs font-bold border uppercase tracking-wider ${
                                  inspectingSite.protected_area 
                                    ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-300 text-emerald-605'
                                    : 'bg-slate-105 dark:bg-slate-950 border-slate-300 text-slate-600 dark:text-slate-400'
                                }`}>
                                  {inspectingSite.protected_area ? 'Reserve Sanctuary' : 'General Area'}
                                </span>
                              </div>
                              <p className="text-2xs text-slate-600 dark:text-slate-450">{inspectingSite.location}</p>
                              <div className="pt-2 border-t border-slate-150 dark:border-slate-805 text-3xs font-mono text-slate-500 flex justify-between">
                                <span>Lat: {inspectingSite.latitude.toFixed(5)}</span>
                                <span>Lng: {inspectingSite.longitude.toFixed(5)}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center py-8 text-xs text-slate-500">
                              No monitoring site linked.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {workspaceTab === 'devices' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Camera Traps */}
                      <div className="space-y-3">
                        <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-500">Camera Traps Deployed ({inspectingCameraTraps.length})</h4>
                        {inspectingCameraTraps.length > 0 ? (
                          <div className="space-y-2">
                            {inspectingCameraTraps.map(trap => (
                              <div key={trap.id} className="p-3 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center text-xs font-semibold">
                                <div>
                                  <span className="block text-slate-900 dark:text-white font-bold">{trap.name}</span>
                                  <span className="text-3xs text-slate-500 dark:text-slate-500 font-mono">ID: {trap.camera_id}</span>
                                </div>
                                <div className="text-right">
                                  <span className={`inline-flex px-1.5 py-0.2 rounded text-5xs font-bold border uppercase ${
                                    trap.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-202' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-202'
                                  }`}>
                                    {trap.status}
                                  </span>
                                  <span className="block text-4xs font-bold text-slate-500 mt-1">🔋 {trap.battery_level}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center py-8 text-2xs text-slate-500">
                             No camera traps deployed at the associated site.
                          </div>
                        )}
                      </div>

                      {/* Audio Sensors */}
                      <div className="space-y-3">
                        <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-500">Audio Sensors Deployed ({inspectingAudioSensors.length})</h4>
                        {inspectingAudioSensors.length > 0 ? (
                          <div className="space-y-2">
                            {inspectingAudioSensors.map(sensor => (
                              <div key={sensor.id} className="p-3 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center text-xs font-semibold">
                                <div>
                                  <span className="block text-slate-900 dark:text-white font-bold">{sensor.name}</span>
                                  <span className="text-3xs text-slate-500 dark:text-slate-500 font-mono">ID: {sensor.sensor_id}</span>
                                </div>
                                <div className="text-right">
                                  <span className={`inline-flex px-1.5 py-0.2 rounded text-5xs font-bold border uppercase ${
                                    sensor.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-202' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-202'
                                  }`}>
                                    {sensor.status}
                                  </span>
                                  <span className="block text-4xs font-bold text-slate-550 mt-1">🔋 {sensor.battery_level}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center py-8 text-2xs text-slate-500">
                            No audio sensors deployed at the associated site.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {workspaceTab === 'observations' && (
                    <div className="space-y-3">
                      <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-500">Logged Sighting Observations ({inspectingObservations.length})</h4>
                      {inspectingObservations.length > 0 ? (
                        <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950 font-bold text-slate-600 dark:text-slate-400 border-b border-slate-150">
                              <tr>
                                <th className="px-4 py-3">Species Name</th>
                                <th className="px-4 py-3">Count</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Device / Notes</th>
                                <th className="px-4 py-3 font-mono">Timestamp</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-semibold">
                              {inspectingObservations.map(obs => (
                                <tr key={obs.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white italic">{obs.species_name}</td>
                                  <td className="px-4 py-3 font-extrabold text-emerald-600 dark:text-emerald-400">{obs.count}</td>
                                  <td className="px-4 py-3 text-slate-650 dark:text-slate-400">{obs.observation_type}</td>
                                  <td className="px-4 py-3">
                                    <span className="block text-3xs font-mono text-slate-500">Dev: {obs.device_id || 'N/A'}</span>
                                    {obs.notes && <span className="block text-4xs text-slate-550 dark:text-slate-450 italic mt-0.5 truncate max-w-xs">{obs.notes}</span>}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-3xs text-slate-500">{obs.timestamp.replace('T', ' ')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center py-12 text-2xs text-slate-500">
                          No sightings have been logged under this survey yet.
                        </div>
                      )}
                    </div>
                  )}

                  {workspaceTab === 'media' && (
                    <div className="space-y-6">
                      {/* Image Assets */}
                      <div className="space-y-3">
                        <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-500">Optical Image Assets ({inspectingImages.length})</h4>
                        {inspectingImages.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {inspectingImages.map(img => (
                              <div key={img.id} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden shadow-sm hover:shadow transition-all">
                                <img
                                  src={`${api.defaults.baseURL || 'http://localhost:8000'}${img.filepath}`}
                                  alt={img.filename}
                                  className="h-28 w-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=200&auto=format&fit=crop&q=60'; }}
                                />
                                <div className="p-2 text-4xs font-bold text-slate-600 dark:text-slate-450">
                                  <span className="block font-extrabold text-slate-800 dark:text-slate-200 truncate">{img.filename}</span>
                                  <span className="block text-slate-500 mt-0.5">Uploader ID: {img.uploader_id}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center py-8 text-2xs text-slate-500">
                            No optical image files uploaded.
                          </div>
                        )}
                      </div>

                      {/* Audio Assets */}
                      <div className="space-y-3">
                        <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-500">Acoustic Audio Logs ({inspectingAudios.length})</h4>
                        {inspectingAudios.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {inspectingAudios.map(aud => (
                              <div key={aud.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between space-y-3 text-xs text-slate-650 dark:text-slate-300">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="truncate">
                                    <span className="block font-bold text-slate-800 dark:text-white truncate">{aud.filename}</span>
                                    <span className="block text-4xs text-slate-500 mt-0.5 font-mono">Uploader ID: {aud.uploader_id}</span>
                                  </div>
                                  <span className="text-5xs bg-slate-200 dark:bg-slate-900 text-slate-600 border border-slate-300 dark:border-slate-800 rounded px-1.5 py-0.2 uppercase font-bold">
                                    {aud.status}
                                  </span>
                                </div>
                                <audio 
                                  src={`${api.defaults.baseURL || 'http://localhost:8000'}${aud.filepath}`} 
                                  controls 
                                  className="w-full h-8 scale-95" 
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center py-8 text-2xs text-slate-500">
                            No acoustic audio logs uploaded.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Survey Campaign?"
        message="This action will permanently delete this survey campaign record along with all nested observation links and related telemetry tags. This action cannot be undone."
        confirmText="Delete Campaign"
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

export default SurveyManagement;
