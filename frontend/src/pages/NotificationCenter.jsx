import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, AlertTriangle, ShieldAlert, ShieldCheck, HelpCircle, 
  Settings, CheckCircle, Trash2, ArrowRight, Eye, RefreshCw, 
  Activity, Leaf, Search, Compass, AlertCircle
} from 'lucide-react';

import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import MetricCard from '../components/common/MetricCard';
import DashboardSection from '../components/common/DashboardSection';

const CATEGORIES = [
  "All",
  "Endangered Species Alert",
  "Population Decline Alert",
  "Habitat Degradation Alert",
  "Monitoring Device Alert",
  "Conservation Recommendation",
  "Wildlife Health Alert",
  "Biodiversity Change Alert",
  "AI Detection Alert",
  "System Notification"
];

const SEVERITIES = ["All", "Info", "Warning", "Critical"];
const PRIORITIES = ["All", "Low", "Medium", "High", "Urgent"];

const NotificationCenter = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole(['Administrator']);

  // Filters & State variables
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({ total: 0, unread: 0, critical: 0, warning: 0, info: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 15;

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [readFilter, setReadFilter] = useState("All"); // "All", "Unread", "Read"
  const [resolvedFilter, setResolvedFilter] = useState("All"); // "All", "Unresolved", "Resolved"

  // Fetch counts & notifications
  const fetchCounts = async () => {
    try {
      const res = await api.get('/api/notifications/count');
      setCounts(res.data);
    } catch (err) {
      console.error("Failed to fetch notification counts:", err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    // Compile query params
    const skip = (page - 1) * limit;
    const params = { skip, limit };
    
    if (selectedCategory !== "All") params.category = selectedCategory;
    if (selectedSeverity !== "All") params.severity = selectedSeverity;
    if (selectedPriority !== "All") params.priority = selectedPriority;
    if (readFilter === "Unread") params.is_read = false;
    if (readFilter === "Read") params.is_read = true;
    if (resolvedFilter === "Unresolved") params.resolved = false;
    if (resolvedFilter === "Resolved") params.resolved = true;
    
    try {
      const res = await api.get('/api/notifications', { params });
      let list = res.data || [];
      
      // Filter client-side search query
      if (search.trim() !== "") {
        const query = search.toLowerCase();
        list = list.filter(n => 
          n.title.toLowerCase().includes(query) || 
          n.message.toLowerCase().includes(query)
        );
      }
      
      setNotifications(list);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Failed to load notifications. Verify connection to API Gateway.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    fetchNotifications();
  }, [page, selectedCategory, selectedSeverity, selectedPriority, readFilter, resolvedFilter]);

  // Handle live clock relative time conversion
  const getRelativeTime = (timestampStr) => {
    try {
      const date = new Date(timestampStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} mins ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (err) {
      return '';
    }
  };

  // Group notifications timeline
  const groupNotifications = (list) => {
    const today = [];
    const yesterday = [];
    const earlier = [];
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    
    list.forEach(n => {
      const date = new Date(n.timestamp);
      if (date >= startOfToday) {
        today.push(n);
      } else if (date >= startOfYesterday) {
        yesterday.push(n);
      } else {
        earlier.push(n);
      }
    });
    
    return { today, yesterday, earlier };
  };

  // Quick actions handlers
  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      // Update UI state locally
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      fetchCounts();
      // Dispatch event to header bell badge
      window.dispatchEvent(new Event('refresh-unread-count'));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      fetchCounts();
      window.dispatchEvent(new Event('refresh-unread-count'));
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const handleResolve = async (id) => {
    try {
      const res = await api.patch(`/api/notifications/${id}/resolve`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, resolved: true, resolved_at: res.data.resolved_at } : n));
      fetchCounts();
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      fetchCounts();
      window.dispatchEvent(new Event('refresh-unread-count'));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleScanAlerts = async () => {
    setLoading(true);
    try {
      await api.post('/api/notifications/generate');
      // Wait briefly for background execution then refresh
      setTimeout(() => {
        fetchNotifications();
        fetchCounts();
        window.dispatchEvent(new Event('refresh-unread-count'));
      }, 800);
    } catch (err) {
      console.error("Failed to trigger rules generation scan:", err);
      setLoading(false);
    }
  };

  // Helper icons and styles mapping
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Endangered Species Alert':
        return ShieldAlert;
      case 'Population Decline Alert':
        return Activity;
      case 'Habitat Degradation Alert':
        return Leaf;
      case 'Monitoring Device Alert':
        return Settings;
      case 'Conservation Recommendation':
        return CheckCircle;
      case 'Wildlife Health Alert':
        return AlertCircle;
      default:
        return Bell;
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-100 dark:bg-rose-955/30 text-rose-700 dark:text-rose-455 border-rose-200 dark:border-rose-900/30';
      case 'High':
        return 'bg-amber-100 dark:bg-amber-955/30 text-amber-700 dark:text-amber-405 border-amber-200 dark:border-amber-900/30';
      case 'Medium':
        return 'bg-blue-100 dark:bg-blue-955/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
      default:
        return 'bg-slate-100 dark:bg-slate-900 text-slate-650 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'border-l-4 border-l-rose-500 bg-gradient-to-r from-rose-500/5 to-transparent';
      case 'Warning':
        return 'border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-500/5 to-transparent';
      default:
        return 'border-l-4 border-l-slate-400 bg-transparent';
    }
  };

  const { today, yesterday, earlier } = groupNotifications(notifications);

  const renderSectionList = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{title}</h3>
        <div className="space-y-2.5">
          {items.map(item => {
            const IconComponent = getCategoryIcon(item.category);
            return (
              <div 
                key={item.id} 
                className={`glass-card p-4 transition-all hover:shadow-md border-slate-200 dark:border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  getSeverityStyle(item.severity)
                } ${!item.is_read ? 'bg-slate-50/40 dark:bg-slate-900/10' : ''}`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 shadow-2xs`}>
                    <IconComponent className="h-4.5 w-4.5 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getPriorityStyle(item.priority)}`}>
                        {item.priority}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {item.source_module}
                      </span>
                      <span className="text-3xs text-slate-400 dark:text-slate-500 font-bold">• {getRelativeTime(item.timestamp)}</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{item.title}</h4>
                    <p className="text-xs font-semibold text-slate-655 dark:text-slate-400 leading-relaxed">{item.message}</p>
                    {item.resolved && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase">
                        <CheckCircle className="h-3 w-3" /> Resolved
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 md:justify-end">
                  {/* Deep link button to related AI engine route */}
                  {item.route && (
                    <button 
                      onClick={() => navigate(item.route)}
                      className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-3xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Dashboard
                    </button>
                  )}
                  
                  {/* Mark as read */}
                  {!item.is_read && (
                    <button 
                      onClick={() => handleMarkRead(item.id)}
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-3xs"
                    >
                      Mark Read
                    </button>
                  )}

                  {/* Resolve trigger */}
                  {!item.resolved && (
                    <button 
                      onClick={() => handleResolve(item.id)}
                      className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-emerald-650 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-3xs"
                    >
                      Resolve
                    </button>
                  )}

                  {/* Delete trace (Admin check) */}
                  {isAdmin && (
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-all"
                      title="Permanently Delete Notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-850 dark:text-slate-100 font-sans pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-405 uppercase tracking-widest flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Alert Management
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Notification Center
          </h1>
          <p className="text-sm text-slate-655 dark:text-slate-400 mt-1 font-semibold">
            Track automated system warning flags, endangered sightings, habitat alerts, and device telemetry reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleScanAlerts}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-bold text-xs shadow-xs focus:ring-2 focus:ring-emerald-500"
          >
            <RefreshCw className="h-4 w-4 text-emerald-500" />
            Scan Telemetry Alerts
          </button>
          <button 
            onClick={handleMarkAllRead}
            disabled={counts.unread === 0}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all font-bold text-xs shadow-xs focus:ring-2 focus:ring-emerald-500"
          >
            Mark All as Read
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard title="Total Alerts" value={counts.total} subtext="Lifetime logged events" icon={Bell} />
        <MetricCard title="Unread Actions" value={counts.unread} subtext="Requires attention" icon={Activity} colorClass="text-blue-600 dark:text-blue-450 bg-blue-50 dark:bg-blue-955/30 border-blue-200 dark:border-blue-900/30" />
        <MetricCard title="Critical Warnings" value={counts.critical} subtext="Ecosystem severity drops" icon={ShieldAlert} colorClass="text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-955/30 border-rose-200 dark:border-rose-900/30" />
        <MetricCard title="Device Telemetry Info" value={counts.info} subtext="Regular updates logs" icon={Settings} colorClass="text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-955/30 border-cyan-200 dark:border-cyan-900/30" />
      </div>

      {/* Sticky Filters bar */}
      <div className="sticky top-16 z-10 bg-slate-50 dark:bg-slate-950 py-3 border-b border-slate-200 dark:border-slate-900 transition-colors duration-300">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search alerts by title or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchNotifications()}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>
            
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-2 text-3xs font-semibold">
              <select 
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              >
                <option value="All">All Read States</option>
                <option value="Unread">Unread</option>
                <option value="Read">Read</option>
              </select>

              <select 
                value={resolvedFilter}
                onChange={(e) => setResolvedFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              >
                <option value="All">All Resolution States</option>
                <option value="Unresolved">Unresolved</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Quick Category Chips bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">Category:</span>
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-4xs font-black uppercase transition-all shrink-0 border ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350'
                }`}
              >
                {cat === 'All' ? 'Show All' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline List of Notifications */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="h-7 w-7 animate-spin text-emerald-500" />
          <span className="ml-3 text-xs font-bold text-slate-400">Loading alerts logs...</span>
        </div>
      ) : error ? (
        <div className="glass-card p-8 border-slate-202 dark:border-slate-805 text-center text-rose-500">
          <AlertCircle className="h-8 w-8 mx-auto text-rose-500 mb-2" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-12 border-slate-202 dark:border-slate-805 text-center text-slate-500">
          <Bell className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200">No Notifications Found</h3>
          <p className="text-3xs text-slate-450 mt-1 font-semibold">Try modifying your filter selections or scan for telemetry alerts.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {renderSectionList("Today", today)}
          {renderSectionList("Yesterday", yesterday)}
          {renderSectionList("Earlier", earlier)}
          
          {/* Pagination Controls */}
          <div className="flex justify-between items-center px-1 pt-4">
            <button 
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-3xs font-black uppercase text-slate-500 dark:text-slate-400">Page {page}</span>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={notifications.length < limit}
              className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
