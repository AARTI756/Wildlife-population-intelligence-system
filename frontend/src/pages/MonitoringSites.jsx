import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  PLACEHOLDER_SITE_NAME,
  PLACEHOLDER_SITE_LOCATION,
  PLACEHOLDER_LATITUDE,
  PLACEHOLDER_LONGITUDE,
} from '../utils/india';
import ConfirmModal from '../components/common/ConfirmModal';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeletons';
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  Info,
  Calendar,
  Layers,
  Activity,
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  X
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

const MonitoringSites = () => {
  const { hasRole } = useAuth();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Custom toast notification states
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  
  // View states
  const [viewMode, setViewMode] = useState('grid');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSiteId, setCurrentSiteId] = useState(null);
  const [apiSaving, setApiSaving] = useState(false);

  // Reusable Delete Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [description, setDescription] = useState('');
  const [protectedArea, setProtectedArea] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const canEdit = hasRole(['Administrator', 'Conservation Officer', 'Wildlife Researcher']);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await api.get('/api/monitoring-sites');
      setSites(response.data);
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
    setLocation('');
    setLatitude('');
    setLongitude('');
    setDescription('');
    setProtectedArea(false);
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (site) => {
    setIsEditing(true);
    setCurrentSiteId(site.id);
    setName(site.name);
    setLocation(site.location);
    setLatitude(site.latitude.toString());
    setLongitude(site.longitude.toString());
    setDescription(site.description || '');
    setProtectedArea(site.protected_area);
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field-level validations
    const errors = {};
    if (!name.trim()) errors.name = "Site Name is required";
    if (!location.trim()) errors.location = "Location Range Name is required";
    
    const parsedLat = parseFloat(latitude);
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      errors.latitude = "Latitude must be a valid number between -90 and 90";
    }

    const parsedLng = parseFloat(longitude);
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      errors.longitude = "Longitude must be a valid number between -180 and 180";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setApiSaving(true);

    const payload = {
      name: name.trim(),
      location: location.trim(),
      latitude: parsedLat,
      longitude: parsedLng,
      description: description.trim(),
      protected_area: protectedArea
    };

    try {
      if (isEditing) {
        await api.put(`/api/monitoring-sites/${currentSiteId}`, payload);
        setToastMessage(`Monitoring site '${name}' updated successfully`);
      } else {
        await api.post('/api/monitoring-sites', payload);
        setToastMessage(`Monitoring site '${name}' registered successfully`);
      }
      setToastType('success');
      setTimeout(() => setToastMessage(null), 4000);
      setShowModal(false);
      fetchSites();
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
      await api.delete(`/api/monitoring-sites/${deletingId}`);
      setToastType('success');
      setToastMessage('Monitoring site deleted successfully');
      setTimeout(() => setToastMessage(null), 4000);
      setDeleteModalOpen(false);
      fetchSites();
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
    setStatusFilter('All');
    setSortBy('name-asc');
    setCurrentPage(1);
  };

  // Search & Filter & Sort
  const filteredSites = sites
    .filter((site) => {
      const matchesSearch = 
        (site.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (site.location || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'All' || 
        (statusFilter === 'Protected' && site.protected_area) ||
        (statusFilter === 'Standard' && !site.protected_area);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      if (sortBy === 'location-asc') return (a.location || '').localeCompare(b.location || '');
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredSites.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSites = filteredSites.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const showClearButton = searchTerm !== '' || statusFilter !== 'All' || sortBy !== 'name-asc';

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Monitoring Sites</h1>
          <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">Register and audit field observation bases across Indian forest ranges and tiger reserves.</p>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 self-start rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Site</span>
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
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search sites..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="block w-full rounded-xl bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-805 pl-11 pr-4 py-2 text-slate-905 dark:text-slate-105 placeholder-slate-450 focus:border-emerald-505 dark:focus:border-emerald-505 outline-none transition-all text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {showClearButton && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.8 text-2xs font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </button>
          )}

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-2xs font-bold text-slate-705 dark:text-slate-300 outline-none focus:border-emerald-500"
          >
            <option value="All">All Types</option>
            <option value="Protected">Protected Areas</option>
            <option value="Standard">Standard Areas</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-2xs font-bold text-slate-705 dark:text-slate-300 outline-none focus:border-emerald-500"
          >
            <option value="name-asc">Site Name A-Z</option>
            <option value="name-desc">Site Name Z-A</option>
            <option value="location-asc">Location Name A-Z</option>
          </select>

          {/* View Mode toggler */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1.2 bg-slate-50 dark:bg-slate-950">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all focus:outline-none ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-405 shadow-sm' : 'text-slate-400'}`}
              title="Grid Layout"
            >
              <LayoutGrid className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all focus:outline-none ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-405 shadow-sm' : 'text-slate-400'}`}
              title="List Table Layout"
            >
              <List className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or list rendering */}
      {loading ? (
        viewMode === 'grid' ? <CardSkeleton count={6} /> : <TableSkeleton rows={6} cols={6} />
      ) : currentSites.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentSites.map((site) => (
              <div key={site.id} className="glass-card p-6 flex flex-col justify-between space-y-5 hover:border-emerald-500/25 transition-all shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-4xs font-bold border uppercase tracking-wider ${
                      site.protected_area 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-405 border-emerald-205 dark:border-emerald-900/30' 
                        : 'bg-slate-55 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-205 dark:border-slate-800'
                    }`}>
                      {site.protected_area ? 'Protected Area' : 'Standard Area'}
                    </span>
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(site)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          title="Edit Site"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(site.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
                          title="Delete Site"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1">{site.name}</h3>
                  <p className="text-2xs text-slate-555 dark:text-slate-400 mt-1 line-clamp-2 font-semibold">{site.description || 'No description provided'}</p>

                  <div className="mt-4 space-y-2 text-xs text-slate-555 dark:text-slate-400 font-semibold">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate">{site.location}</span>
                    </div>
                    {site.elevation && (
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Elevation: {site.elevation} meters</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-4xs text-slate-500 dark:text-slate-500 font-mono">
                  <span>Site ID: S-{site.id}</span>
                  <span>Coords: {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}</span>
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
                    <th className="px-5 py-3.5">Site Name</th>
                    <th className="px-5 py-3.5">General Location</th>
                    <th className="px-5 py-3.5">Coords (Lat, Lon)</th>
                    <th className="px-5 py-3.5">Elevation</th>
                    <th className="px-5 py-3.5">Protected State</th>
                    {canEdit && <th className="px-5 py-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60 font-semibold">
                  {currentSites.map((site) => (
                    <tr key={site.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{site.name}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-405">{site.location}</td>
                      <td className="px-5 py-4 font-mono text-2xs">{site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}</td>
                      <td className="px-5 py-4 font-mono text-2xs">{site.elevation ? `${site.elevation}m` : '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-1.5 py-0.2 rounded text-5xs font-bold border uppercase tracking-wider ${
                          site.protected_area 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' 
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-205 dark:border-slate-800'
                        }`}>
                          {site.protected_area ? 'Protected' : 'Standard'}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(site)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              title="Edit Site"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTrigger(site.id)}
                              className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-650 focus:outline-none focus:ring-2 focus:ring-rose-500"
                              title="Delete Site"
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
          <MapPin className="h-12 w-12 text-slate-400 dark:text-slate-650 mb-3" />
          <p className="text-sm font-bold text-slate-900 dark:text-slate-350">No Monitoring Sites Registered</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 text-center max-w-xs leading-normal">
            No monitoring locations found. Register a new forest range base to assign telemetry sensors.
          </p>
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-450 border border-emerald-500/25 bg-emerald-50/20 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            >
              Create Monitoring Site
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
              {Math.min(indexOfLastItem, filteredSites.length)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{filteredSites.length}</strong> sites
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

      {/* Dialog Modal */}
      {showModal && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal-card animate-fade-in shadow-2xl">
            <div className="enterprise-modal-header">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-500 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Edit Site Details' : 'Register New Monitoring Site'}
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
                    <label className="enterprise-label">Site Name / Forest Range Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`enterprise-input ${formErrors.name ? 'border-rose-500 focus:border-rose-500' : ''}`}
                      placeholder={PLACEHOLDER_SITE_NAME}
                    />
                    {formErrors.name && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.name}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="enterprise-label">General Area / Tiger Reserve / National Park *</label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={`enterprise-input ${formErrors.location ? 'border-rose-500 focus:border-rose-500' : ''}`}
                      placeholder={PLACEHOLDER_SITE_LOCATION}
                    />
                    {formErrors.location && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.location}</p>}
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
                      placeholder={PLACEHOLDER_LATITUDE}
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
                      placeholder={PLACEHOLDER_LONGITUDE}
                    />
                    {formErrors.longitude && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.longitude}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="enterprise-label">Site Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="enterprise-textarea h-20"
                      placeholder="Describe monitoring site focus..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="protected_area"
                    type="checkbox"
                    checked={protectedArea}
                    onChange={(e) => setProtectedArea(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-350 dark:border-slate-800 bg-white dark:bg-slate-950 text-emerald-650 focus:ring-emerald-500"
                  />
                  <label htmlFor="protected_area" className="text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                    Tiger Reserve / National Park / Wildlife Sanctuary (Protected Area)
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
                  <span>{isEditing ? 'Save Changes' : 'Create Site'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Monitoring Site?"
        message="This action will permanently delete this monitoring site, and will unbind any deployment relations with camera traps or audio sensors assigned to it. This action cannot be undone."
        confirmText="Delete Site"
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

export default MonitoringSites;
