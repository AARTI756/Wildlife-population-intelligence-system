import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { PLACEHOLDER_CAMERA_NAME, formatISTDate } from '../utils/india';
import ConfirmModal from '../components/common/ConfirmModal';
import { CardSkeleton, TableSkeleton } from '../components/common/Skeletons';
import { 
  Camera, 
  Plus, 
  Edit3, 
  Trash2, 
  Info,
  Calendar,
  Layers,
  Battery,
  Wifi,
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  Compass
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

const CameraTrapManagement = () => {
  const { hasRole } = useAuth();
  const [traps, setTraps] = useState([]);
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
  const [currentTrapId, setCurrentTrapId] = useState(null);
  const [apiSaving, setApiSaving] = useState(false);

  // Reusable Delete Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('model-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Form states
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState('Active');
  const [batteryLevel, setBatteryLevel] = useState('100');
  const [monitoringSiteId, setMonitoringSiteId] = useState('');
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const canEdit = hasRole(['Administrator', 'Forest Department Officer', 'Wildlife Researcher']);

  useEffect(() => {
    fetchTrapsAndSites();
  }, []);

  const fetchTrapsAndSites = async () => {
    try {
      const [trapsRes, sitesRes] = await Promise.all([
        api.get('/api/camera-traps'),
        api.get('/api/monitoring-sites')
      ]);
      setTraps(trapsRes.data);
      setSites(sitesRes.data);
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
    setModel('');
    setSerialNumber('');
    setStatus('Active');
    setBatteryLevel('100');
    const firstSite = sites[0];
    setMonitoringSiteId(firstSite?.id || '');
    setLatitude(firstSite?.latitude?.toString() || '');
    setLongitude(firstSite?.longitude?.toString() || '');
    setInstallationDate(new Date().toISOString().split('T')[0]);
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (trap) => {
    setIsEditing(true);
    setCurrentTrapId(trap.id);
    setName(trap.name || '');
    setModel(trap.model || '');
    setSerialNumber(trap.camera_id || '');
    setStatus(trap.status || 'Active');
    setBatteryLevel(trap.battery_level ? trap.battery_level.toString() : '100');
    setMonitoringSiteId(trap.location_id ? trap.location_id.toString() : '');
    setLatitude(trap.latitude ? trap.latitude.toString() : '');
    setLongitude(trap.longitude ? trap.longitude.toString() : '');
    setInstallationDate(trap.installation_date || '');
    setFormErrors({});
    setShowModal(true);
  };

  const handleSiteChange = (siteId) => {
    setMonitoringSiteId(siteId);
    const site = sites.find(s => s.id === parseInt(siteId));
    if (site) {
      setLatitude(site.latitude.toString());
      setLongitude(site.longitude.toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Field-level validations
    const errors = {};
    if (!name.trim()) errors.name = "Camera Name is required";
    if (!model.trim()) errors.model = "Model Name is required";
    if (!serialNumber.trim()) errors.serialNumber = "Camera Serial ID is required";
    if (!monitoringSiteId) errors.monitoringSiteId = "Monitoring Site selection is required";
    
    const parsedBattery = parseInt(batteryLevel);
    if (isNaN(parsedBattery) || parsedBattery < 0 || parsedBattery > 100) {
      errors.batteryLevel = "Battery level must be a valid percentage between 0 and 100";
    }

    const parsedLat = parseFloat(latitude);
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      errors.latitude = "Latitude must be a valid number between -90 and 90";
    }

    const parsedLng = parseFloat(longitude);
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      errors.longitude = "Longitude must be a valid number between -180 and 180";
    }

    if (!installationDate) errors.installationDate = "Installation Date is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setApiSaving(true);

    const payload = {
      name: name.trim(),
      camera_id: serialNumber.trim(),
      status,
      battery_level: parsedBattery,
      location_id: parseInt(monitoringSiteId),
      latitude: parsedLat,
      longitude: parsedLng,
      model: model.trim() || null,
      installation_date: installationDate
    };

    try {
      if (isEditing) {
        await api.put(`/api/camera-traps/${currentTrapId}`, payload);
        setToastMessage(`Camera trap '${name}' updated successfully`);
      } else {
        await api.post('/api/camera-traps', payload);
        setToastMessage(`Camera trap '${name}' registered successfully`);
      }
      setToastType('success');
      setTimeout(() => setToastMessage(null), 4000);
      setShowModal(false);
      fetchTrapsAndSites();
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
      await api.delete(`/api/camera-traps/${deletingId}`);
      setToastType('success');
      setToastMessage('Camera trap hardware node deleted successfully');
      setTimeout(() => setToastMessage(null), 4000);
      setDeleteModalOpen(false);
      fetchTrapsAndSites();
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

  const getSiteName = (siteId) => {
    const site = sites.find((s) => s.id === siteId);
    return site ? site.name : 'Unassigned';
  };

  const getBatteryIconColor = (level) => {
    if (level > 50) return 'text-emerald-500';
    if (level > 20) return 'text-amber-500';
    return 'text-rose-500';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setSortBy('model-asc');
    setCurrentPage(1);
  };

  // Search & Filter & Sort
  const filteredTraps = traps
    .filter((trap) => {
      const matchesSearch = 
        (trap.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trap.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trap.camera_id || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || trap.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'model-asc') return (a.model || '').localeCompare(b.model || '');
      if (sortBy === 'model-desc') return (b.model || '').localeCompare(a.model || '');
      if (sortBy === 'battery-desc') return b.battery_level - a.battery_level;
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredTraps.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTraps = filteredTraps.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const showClearButton = searchTerm !== '' || statusFilter !== 'All' || sortBy !== 'model-asc';

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Camera Trap Registry</h1>
          <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">Configure optical motion-sensor cameras deployed in research sectors.</p>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 self-start rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Device</span>
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
            placeholder="Search traps..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="block w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-all text-xs"
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
            className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-2xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Nodes</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-2xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500"
          >
            <option value="model-asc">Model name A-Z</option>
            <option value="model-desc">Model name Z-A</option>
            <option value="battery-desc">Highest Battery</option>
          </select>

          {/* View Toggler */}
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

      {/* Loading Skeletons */}
      {loading ? (
        viewMode === 'grid' ? <CardSkeleton count={6} /> : <TableSkeleton rows={6} cols={6} />
      ) : currentTraps.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentTraps.map((trap) => (
              <div key={trap.id} className="glass-card p-6 flex flex-col justify-between space-y-5 hover:border-emerald-500/25 transition-all shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-4xs font-bold border uppercase tracking-wider ${
                      trap.status === 'Active' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-405 border-emerald-205 dark:border-emerald-900/30' 
                        : trap.status === 'Maintenance' 
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-605 dark:text-amber-400 border-amber-205 dark:border-amber-900/30' 
                        : 'bg-slate-55 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-205 dark:border-slate-800'
                    }`}>
                      {trap.status}
                    </span>
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(trap)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          title="Edit Camera"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrigger(trap.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
                          title="Delete Camera"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1">{trap.name}</h3>
                  <p className="text-4xs text-slate-500 dark:text-slate-500 font-mono mt-1">Model: {trap.model} | S/N: {trap.camera_id}</p>
 
                  <div className="mt-4 space-y-2 text-xs text-slate-550 dark:text-slate-400 font-semibold">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate">Siting base: {getSiteName(trap.location_id)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Battery className={`h-4 w-4 shrink-0 ${getBatteryIconColor(trap.battery_level)}`} />
                      <span>Battery Charge: {trap.battery_level}%</span>
                    </div>
                    <div className="text-4xs text-slate-500 mt-1.5 font-mono">
                      GPS: {trap.latitude?.toFixed(4)}, {trap.longitude?.toFixed(4)} | Installed: {trap.installation_date}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-4xs text-slate-500 dark:text-slate-500 font-mono">
                  <span>Trap ID: TRP-{trap.id}</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <Wifi className="h-3 w-3 text-emerald-500" /> Connected
                  </span>
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
                    <th className="px-5 py-3.5">Model name</th>
                    <th className="px-5 py-3.5">Serial Number</th>
                    <th className="px-5 py-3.5">Assigned Monitoring Site</th>
                    <th className="px-5 py-3.5">Battery</th>
                    <th className="px-5 py-3.5">Status</th>
                    {canEdit && <th className="px-5 py-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60 font-semibold">
                  {currentTraps.map((trap) => (
                    <tr key={trap.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{trap.name} ({trap.model})</td>
                      <td className="px-5 py-4 font-mono text-2xs">{trap.camera_id}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-405">{getSiteName(trap.location_id)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 font-mono text-2xs">
                          <Battery className={`h-4.5 w-4.5 ${getBatteryIconColor(trap.battery_level)}`} />
                          <span>{trap.battery_level}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-1.5 py-0.2 rounded text-5xs font-bold border uppercase tracking-wider ${
                          trap.status === 'Active' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' 
                            : trap.status === 'Maintenance' 
                            ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-205 dark:border-amber-900/30' 
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-205 dark:border-slate-800'
                        }`}>
                          {trap.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(trap)}
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              title="Edit Camera"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTrigger(trap.id)}
                              className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                              title="Delete Camera"
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
          <Camera className="h-12 w-12 text-slate-400 dark:text-slate-650 mb-3" />
          <p className="text-sm font-bold text-slate-900 dark:text-slate-350">No Camera Traps Registered</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 text-center max-w-xs leading-normal">
            No camera traps match the current filters. Start by adding a new optical camera trap device.
          </p>
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-450 border border-emerald-500/25 bg-emerald-50/20 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            >
              Register Camera Trap
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
              {Math.min(indexOfLastItem, filteredTraps.length)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{filteredTraps.length}</strong> traps
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
                <Camera className="h-5 w-5 text-emerald-500 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Edit Camera Trap' : 'Add Camera Trap to Registry'}
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
                    <label className="enterprise-label">Camera Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`enterprise-input ${formErrors.name ? 'border-rose-500 focus:border-rose-500' : ''}`}
                      placeholder={PLACEHOLDER_CAMERA_NAME}
                    />
                    {formErrors.name && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="enterprise-label">Model Name *</label>
                    <input
                      type="text"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className={`enterprise-input ${formErrors.model ? 'border-rose-500 focus:border-rose-500' : ''}`}
                      placeholder="e.g. Bushnell Trophy Cam"
                    />
                    {formErrors.model && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.model}</p>}
                  </div>

                  <div>
                    <label className="enterprise-label">Camera Serial ID *</label>
                    <input
                      type="text"
                      required
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className={`enterprise-input ${formErrors.serialNumber ? 'border-rose-500 focus:border-rose-500' : ''}`}
                      placeholder="e.g. BC-920-X11"
                    />
                    {formErrors.serialNumber && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.serialNumber}</p>}
                  </div>

                  <div>
                    <label className="enterprise-label">Deploy Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="enterprise-select"
                    >
                      <option>Active</option>
                      <option>Maintenance</option>
                      <option>Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="enterprise-label">Battery Charge (%) *</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={batteryLevel}
                      onChange={(e) => setBatteryLevel(e.target.value)}
                      className={`enterprise-input ${formErrors.batteryLevel ? 'border-rose-500 focus:border-rose-500' : ''}`}
                    />
                    {formErrors.batteryLevel && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.batteryLevel}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="enterprise-label">Assigned Monitoring Site Location *</label>
                    <select
                      required
                      value={monitoringSiteId}
                      onChange={(e) => handleSiteChange(e.target.value)}
                      className={`enterprise-select ${formErrors.monitoringSiteId ? 'border-rose-500 focus:border-rose-500' : ''}`}
                    >
                      <option value="" disabled>Select Site</option>
                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name} ({site.location})
                        </option>
                      ))}
                    </select>
                    {formErrors.monitoringSiteId && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.monitoringSiteId}</p>}
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
                    />
                    {formErrors.longitude && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.longitude}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="enterprise-label">Installation Date *</label>
                    <input
                      type="date"
                      required
                      value={installationDate}
                      onChange={(e) => setInstallationDate(e.target.value)}
                      className={`enterprise-input ${formErrors.installationDate ? 'border-rose-500 focus:border-rose-500' : ''}`}
                    />
                    {formErrors.installationDate && <p className="text-rose-500 text-4xs font-bold mt-1">{formErrors.installationDate}</p>}
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
                  <span>{isEditing ? 'Save Changes' : 'Register Device'}</span>
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
        title="Delete Camera Trap?"
        message="This action will permanently delete this hardware device registration and clear its deployed status logs. This action cannot be undone."
        confirmText="Delete Trap"
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

export default CameraTrapManagement;
