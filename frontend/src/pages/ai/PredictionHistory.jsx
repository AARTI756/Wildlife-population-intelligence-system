import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  AlertCircle, 
  Loader2, 
  FileAudio,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const formatSpeciesNameDisplay = (name) => {
  if (!name) return "False Trigger / Unknown";
  if (name === "Unknown Species") return "Species Requires Verification";
  return name;
};

const PredictionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, confidence_high, confidence_low
  const [includeUnknown, setIncludeUnknown] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Detail Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchHistory(includeUnknown);
  }, [includeUnknown]);

  const fetchHistory = async (incUnknown = false) => {
    try {
      const response = await api.get('/api/uploads/prediction-history', { params: { include_unknown: incUnknown } });
      setHistory(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch prediction history log. Please verify server status.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered & Sorted Records
  const processedRecords = useMemo(() => {
    let result = [...history];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.species_predicted.toLowerCase().includes(term) ||
        r.original_filename.toLowerCase().includes(term) ||
        (r.user?.username && r.user.username.toLowerCase().includes(term))
      );
    }

    // Type filter
    if (selectedType !== 'All') {
      result = result.filter(r => r.prediction_type === selectedType);
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      result = result.filter(r => new Date(r.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(r => new Date(r.date) <= end);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === 'oldest') {
        return new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'confidence_high') {
        return b.confidence - a.confidence;
      } else if (sortBy === 'confidence_low') {
        return a.confidence - b.confidence;
      }
      return 0;
    });

    return result;
  }, [history, searchTerm, selectedType, startDate, endDate, sortBy]);

  // Paginated Records
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedRecords.slice(start, start + itemsPerPage);
  }, [processedRecords, currentPage]);

  const totalPages = Math.ceil(processedRecords.length / itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, startDate, endDate, sortBy, includeUnknown]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-emerald-500 font-sans">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3 text-lg font-bold">Loading Prediction Registry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-900/60">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            AI Audit Logs
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Prediction History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            Audit and review all deep learning inference pipelines executed across camera traps and bioacoustic sensors.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/35 p-4 text-xs text-rose-800 dark:text-rose-400 font-semibold max-w-7xl mx-auto">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Acoustic History Fetch Fault</p>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Filters Card */}
      <div className="glass-card p-5 space-y-4 shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/45">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search species, file name, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="enterprise-input h-10 !pl-10 !pr-4 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="enterprise-select h-10 !px-3.5 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <option value="All">All Types</option>
              <option value="Image">🟢 AI Image</option>
              <option value="Audio">🔵 AI Audio</option>
            </select>
          </div>

          {/* Date Filter Start */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="enterprise-input h-10 !pl-4 !pr-10 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Calendar className="h-4 w-4" />
            </span>
          </div>

          {/* Date Filter End */}
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="enterprise-input h-10 !pl-4 !pr-10 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Calendar className="h-4 w-4" />
            </span>
          </div>

        </div>

        {/* Sort and Clear buttons */}
        <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-3xs">Sort By</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="enterprise-select py-1 px-2.5 text-xs rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="confidence_high">Highest Confidence</option>
                <option value="confidence_low">Lowest Confidence</option>
              </select>
            </div>

            {/* Include Unknown Species Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={includeUnknown}
                onChange={(e) => setIncludeUnknown(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 h-3.5 w-3.5"
              />
              <span className="text-slate-500 dark:text-slate-300 font-bold text-3xs uppercase tracking-wider">Include Unknown Species</span>
            </label>
          </div>

          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedType('All');
              setStartDate('');
              setEndDate('');
              setSortBy('newest');
              setIncludeUnknown(false);
            }}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold hover:underline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* History Table Card */}
      <div className="glass-card overflow-hidden shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                <th className="p-4 w-16">Thumbnail</th>
                <th className="p-4">Type</th>
                <th className="p-4">Species Predicted</th>
                <th className="p-4">Confidence</th>
                <th className="p-4">Inference Date</th>
                <th className="p-4">Uploaded By</th>
                <th className="p-4">Linked Observation</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-slate-400 font-medium">
                    No prediction audit records found matching the active filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const confVal = Math.round(r.confidence * 100);
                  let confColor = "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400";
                  if (confVal >= 90) {
                    confColor = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400";
                  } else if (confVal >= 70) {
                    confColor = "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400";
                  } else if (confVal >= 50) {
                    confColor = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
                  }

                  const formattedDate = new Date(r.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  // Resolve download URL helper
                  const assetUrl = `${api.defaults.baseURL || 'http://127.0.0.1:8000'}${
                    r.prediction_type === 'Image' ? `/uploads/images/${r.stored_filename}` : `/uploads/audio/${r.stored_filename}`
                  }`;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/5 transition-colors">
                      <td className="p-4">
                        {r.prediction_type === 'Image' ? (
                          <div className="h-10 w-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 animate-fade-in">
                            <img 
                              src={`${api.defaults.baseURL || 'http://127.0.0.1:8000'}/uploads/images/${r.stored_filename}`} 
                              alt="Thumbnail" 
                              className="h-full w-full object-cover"
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=80&auto=format&fit=crop&q=60'; }}
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/10 shrink-0">
                            <FileAudio className="h-5 w-5" />
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {r.prediction_type === 'Image' ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30 animate-fade-in">
                            🟢 AI Image
                          </span>
                        ) : (
                          (!r.animal_call_detected || r.animal_call_category === 'Environmental Noise') ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800 animate-fade-in">
                              🔘 Environmental Noise
                            </span>
                          ) : ["Mammal Vocalization", "Amphibian Call", "Insect Sound", "Generic Animal Vocalization"].includes(r.species_predicted) ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30 animate-fade-in">
                              🔵 Animal Call Category
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30 animate-fade-in">
                              🟢 Bird Species
                            </span>
                          )
                        )}
                      </td>
                      <td className="p-4 font-extrabold text-slate-900 dark:text-white">
                        {formatSpeciesNameDisplay(r.species_predicted)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-3xs border ${confColor}`}>
                          {confVal}%
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-[11px]">
                        {formattedDate}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 font-semibold">
                        {r.user?.username || 'System AI'}
                      </td>
                      <td className="p-4">
                        {r.linked_observation_id ? (
                          <Link 
                            to="/observations" 
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-500 font-black hover:underline"
                          >
                            OBS-#{r.linked_observation_id}
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">Unlinked</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(r)}
                            title="Inspect Details"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-950"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>
                          <a
                            href={assetUrl}
                            download={r.original_filename}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Download original file"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-950"
                          >
                            <Download className="h-4.5 w-4.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/20 dark:bg-slate-900/5">
            <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider">
              Showing page {currentPage} of {totalPages} ({processedRecords.length} entries)
            </span>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all bg-white dark:bg-slate-950"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all bg-white dark:bg-slate-950"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="glass-card w-full max-w-2xl bg-white dark:bg-slate-950 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <div>
                <span className="text-4xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Audit Entry ID #{selectedRecord.id}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  AI Prediction Details
                </h3>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all bg-white dark:bg-slate-950 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Asset Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/5">
                  <span className="block text-4xs uppercase tracking-wider text-slate-400 font-bold mb-1">Original File</span>
                  <p className="text-slate-900 dark:text-white font-mono text-2xs truncate">{selectedRecord.original_filename}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/5">
                  <span className="block text-4xs uppercase tracking-wider text-slate-400 font-bold mb-1">Stored Filename</span>
                  <p className="text-slate-900 dark:text-white font-mono text-2xs truncate">{selectedRecord.stored_filename}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/5">
                  <span className="block text-4xs uppercase tracking-wider text-slate-400 font-bold mb-1">Confidence Threshold Used</span>
                  <p className="text-slate-900 dark:text-white font-mono text-2xs">{Math.round(selectedRecord.threshold_used * 100)}%</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/5">
                  <span className="block text-4xs uppercase tracking-wider text-slate-400 font-bold mb-1">GPU/CPU Inference Time</span>
                  <p className="text-slate-900 dark:text-white font-mono text-2xs">{selectedRecord.inference_time} ms</p>
                </div>
              </div>

              {/* Taxonomy Details Card */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/5 space-y-4">
                <h4 className="text-3xs uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">
                  Taxonomic Resolution
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3.5 text-xs text-slate-500 font-semibold">
                  {!["Mammal Vocalization", "Amphibian Call", "Insect Sound", "Generic Animal Vocalization", "Environmental Noise"].includes(selectedRecord.species_predicted) && (
                    <>
                      <div>
                        <span className="block text-4xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Kingdom</span>
                        <p className="text-slate-800 dark:text-slate-200">Animalia</p>
                      </div>
                      <div>
                        <span className="block text-4xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Phylum</span>
                        <p className="text-slate-800 dark:text-slate-200">Chordata</p>
                      </div>
                      <div>
                        <span className="block text-4xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Class</span>
                        <p className="text-slate-800 dark:text-slate-200">{selectedRecord.prediction_type === 'Image' ? 'Mammalia / Reptilia' : 'Aves'}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="block text-4xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Resolved Common Name</span>
                    <p className="text-slate-900 dark:text-white font-extrabold">
                      {["Mammal Vocalization", "Amphibian Call", "Insect Sound", "Generic Animal Vocalization", "Environmental Noise"].includes(selectedRecord.species_predicted) 
                        ? selectedRecord.species_predicted 
                        : formatSpeciesNameDisplay(selectedRecord.species_predicted)}
                    </p>
                  </div>
                  <div>
                    <span className="block text-4xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Status</span>
                    <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      {["Mammal Vocalization", "Amphibian Call", "Insect Sound", "Generic Animal Vocalization", "Environmental Noise"].includes(selectedRecord.species_predicted)
                        ? "Requires Species Identification"
                        : "Verified AI Generated"}
                    </span>
                  </div>
                  {selectedRecord.prediction_type === 'Audio' && (
                    <>
                      <div>
                        <span className="block text-4xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Animal Call Detected</span>
                        <p className="text-slate-800 dark:text-slate-200">{selectedRecord.animal_call_detected ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <span className="block text-4xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Audio Classification</span>
                        <p className="text-slate-900 dark:text-white font-extrabold text-emerald-600 dark:text-emerald-400">{selectedRecord.animal_call_category || "Environmental Noise"}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 hover:bg-slate-100 transition-colors focus:outline-none"
              >
                Close Audit Entry
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PredictionHistory;
