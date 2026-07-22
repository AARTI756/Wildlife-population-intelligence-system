import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import api from '../../services/api';
import { 
  LogOut, 
  Sun, 
  Moon, 
  Bell, 
  User, 
  Shield,
  ChevronDown,
  Settings,
  Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserAvatar } from '../../utils/india';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Live IST clock
  const [istTime, setIstTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setIstTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeStyle = (roleName) => {
    switch (roleName) {
      case 'Administrator':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 border-rose-200 dark:border-rose-900/30';
      case 'Wildlife Researcher':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30';
      case 'Conservation Officer':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
      case 'Forest Department Officer':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-405 border-amber-200 dark:border-amber-900/30';
      default:
        return 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  const roleName = user?.roles?.[0]?.name || 'User';

  return (
    <header className="flex h-16 items-center justify-between bg-white dark:bg-slate-950 px-6 border-b border-slate-200 dark:border-slate-900 sticky top-0 z-20 transition-colors duration-300">
      
      {/* Left side: Logo and Full Branding Name */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Compass className="h-5 w-5 text-emerald-500" />
        </div>
        <div className="hidden lg:block">
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            Wildlife Population Intelligence System
          </h1>
          <p className="text-4xs text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-bold">
            AI-Powered Biodiversity Platform
          </p>
        </div>
        <div className="block lg:hidden">
          <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">WPIS</span>
        </div>
      </div>

      {/* Middle/Right: Controls */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Live IST Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-4xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">IST</span>
          <span className="text-2xs font-mono font-bold text-slate-700 dark:text-slate-300">{istTime}</span>
        </div>

        {/* Notifications Bell */}
        <button className="relative p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
          </span>
        </button>

        {/* Settings Shortcut */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

        {/* User Card & Dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-0.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-left"
            >
              <img
                src={getUserAvatar({ ...user, role: roleName }, api.defaults.baseURL)}
                alt="Avatar"
                className="h-7 w-7 rounded-lg object-cover border border-emerald-800"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'; }}
              />
              <div className="hidden sm:block pr-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{user.username}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div className="mt-0.5 leading-none">
                  <span className={`inline-flex px-1 py-0.2 rounded text-5xs font-bold border uppercase tracking-wider ${getRoleBadgeStyle(roleName)}`}>
                    {roleName}
                  </span>
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 z-30 animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-4xs font-bold text-slate-400 uppercase tracking-widest">Account Role</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">{roleName}</p>
                </div>
                
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
