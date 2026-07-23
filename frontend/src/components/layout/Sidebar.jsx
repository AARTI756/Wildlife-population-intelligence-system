import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  ClipboardList, 
  MapPin, 
  Camera, 
  Volume2, 
  History, 
  User, 
  Users, 
  Compass,
  ScanFace,
  Music4,
  TrendingUp,
  BarChart4,
  Leaf,
  HeartHandshake,
  FilePieChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Upload,
  Activity
} from 'lucide-react';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  const sections = [
    {
      title: 'Dashboard',
      items: [
        { name: 'Overview', path: '/', icon: LayoutDashboard, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] }
      ]
    },
    {
      title: 'Monitoring',
      items: [
        { name: 'Surveys', path: '/surveys', icon: ClipboardList, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] },
        { name: 'Monitoring Sites', path: '/sites', icon: MapPin, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] },
        { name: 'Camera Traps', path: '/camera-traps', icon: Camera, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] },
        { name: 'Audio Sensors', path: '/audio-sensors', icon: Volume2, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] },
        { name: 'Observations', path: '/observations', icon: History, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] }
      ]
    },
    {
      title: 'AI Analysis',
      items: [
        { name: 'Wildlife Image Analysis', path: '/ai/image-upload', icon: Upload, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] },
        { name: 'Wildlife Audio Analysis', path: '/ai/audio-upload', icon: Upload, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] },
        { name: 'Prediction History', path: '/ai/prediction-history', icon: History, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] },
        { name: 'Biodiversity Analytics', path: '/ai/biodiversity', icon: BarChart4, roles: ['Administrator', 'Wildlife Researcher'] },
        { name: 'Reports', path: '/reports', icon: FilePieChart, roles: ['Administrator', 'Wildlife Researcher'] }
      ]
    },
    {
      title: 'AI Intelligence',
      items: [
        { name: 'Intelligence Dashboard', path: '/ai/intelligence-dashboard', icon: LayoutDashboard, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] },
        { name: 'Population Estimation', path: '/ai/population-est', icon: TrendingUp, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] },
        { name: 'Habitat Intelligence', path: '/ai/habitat', icon: Leaf, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] },
        { name: 'Wildlife Health Scoring', path: '/ai/health-scoring', icon: Activity, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] },
        { name: 'Conservation Recommendations', path: '/ai/recommendations', icon: HeartHandshake, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] }
      ]
    },
    {
      title: 'Administration',
      items: [
        { name: 'Users & Roles', path: '/users', icon: Users, roles: ['Administrator'] },
        { name: 'Settings', path: '/settings', icon: Settings, roles: ['Administrator'] },
        { name: 'Profile', path: '/profile', icon: User, roles: ['Administrator', 'Wildlife Researcher', 'Conservation Officer', 'Forest Department Officer'] }
      ]
    }
  ];

  return (
    <aside 
      className={`fixed bottom-0 left-0 top-0 z-30 flex flex-col bg-slate-900 border-r border-slate-200 dark:border-slate-900 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-900 overflow-hidden">
        <div className="flex items-center gap-2.5 shrink-0">
          <Compass className="h-6 w-6 text-emerald-500 animate-spin-slow" />
          {!collapsed && (
            <span className="text-base font-black tracking-wider bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent uppercase">
              WPIS
            </span>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6">
        {sections.map((section) => {
          // Filter items based on user roles
          const filteredItems = section.items.filter(item => hasRole(item.roles));
          if (filteredItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1.5">
              {!collapsed && (
                <h4 className="px-3 text-4xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {section.title}
                </h4>
              )}
              
              <div className="space-y-0.5">
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      title={collapsed ? item.name : undefined}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100'}`} />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </div>
                      
                      {/* Placeholder indicators */}
                      {!collapsed && item.isPlaceholder && (
                        <span className="shrink-0 scale-90 px-1 py-0.2 text-5xs font-bold uppercase rounded border bg-slate-950 text-slate-500 border-slate-800">
                          Soon
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapse Toggle Button */}
      <div className="border-t border-slate-200 dark:border-slate-900 p-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-950 dark:hover:text-slate-100 transition-all shadow-sm"
        >
          {collapsed ? <ChevronRight className="h-4.5 w-4.5" /> : (
            <>
              <ChevronLeft className="h-4.5 w-4.5" />
              <span className="text-2xs font-bold uppercase tracking-wider">Collapse Menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
