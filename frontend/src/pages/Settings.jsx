import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Bell, Globe, Palette, User, Database, Sparkles, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('Theme');
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [seedError, setSeedError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const tabs = [
    { name: 'Theme', icon: Palette },
    { name: 'Notifications', icon: Bell },
    { name: 'Language', icon: Globe },
    { name: 'Security', icon: Shield },
    { name: 'System Preferences', icon: Database }
  ];

  const handleSeedDemoData = async () => {
    setSeeding(true);
    setSeedResult(null);
    setSeedError(null);
    try {
      const response = await api.post('/api/admin/seed-demo');
      setSeedResult(response.data.message);
    } catch (err) {
      setSeedError(err.response?.data?.detail || 'Failed to seed demo data. Please try again.');
    } finally {
      setSeeding(false);
    }
  };

  const handleSyncSpeciesCatalog = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const response = await api.post('/api/species/sync');
      setSyncResult(response.data);
    } catch (err) {
      setSyncError(err.response?.data?.detail || 'Failed to synchronize species catalog. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100 font-sans">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
          <SettingsIcon className="h-3.5 w-3.5 text-emerald-555" />
          User Control Panel
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          System Settings
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-semibold">
          Adjust notifications, security keys, language profiles, and node preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar inside Settings */}
        <div className="glass-card p-4 space-y-1 shadow-sm border-slate-205 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isTabActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Configurations Area */}
        <div className="glass-card p-6 lg:col-span-3 min-h-[300px] flex flex-col justify-between shadow-sm border-slate-205 dark:border-slate-800">
          {activeTab === 'Theme' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Appearance Settings</h3>
                <p className="text-2xs text-slate-550 dark:text-slate-400 mt-0.5 font-semibold">Toggle default color schemes for system displays</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/45 flex items-center justify-between shadow-xs">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Light / Dark Interface</h4>
                  <p className="text-4xs text-slate-550 dark:text-slate-500 mt-0.5 font-semibold">Switch between dark deep-navy theme and clean white light theme</p>
                </div>
                
                <button
                  onClick={toggleTheme}
                  className="px-4.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-emerald-505"
                >
                  Switch to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
            </div>
          ) : activeTab === 'System Preferences' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">System Preferences & Tools</h3>
                <p className="text-2xs text-slate-550 dark:text-slate-400 mt-0.5 font-semibold">Configure system-wide datasets and administrative utilities</p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/45 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Database className="h-4.5 w-4.5 text-emerald-500" />
                    Indian Wildlife Demonstration Dataset
                  </h4>
                  <p className="text-4xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed font-semibold">
                    Generate a biologically realistic demo dataset for testing. The dataset features 20+ protected zones (like Tadoba, Gir, Jim Corbett, Kaziranga), 35+ camera traps and audio sensors, uploads, and 50+ species observations mapped to their respective geographic distributions.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSeedDemoData}
                    disabled={seeding}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {seeding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating Datasets...</span>
                      </>
                    ) : (
                      <span>Generate Milestone 1 Demo Dataset</span>
                    )}
                  </button>
                </div>

                {seedResult && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-250 dark:border-emerald-900/35 p-4 text-2xs text-emerald-700 dark:text-emerald-400 font-semibold mt-4">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    <div>
                      <p className="font-bold">✔ Generation Success</p>
                      <p className="font-medium mt-0.5">{seedResult}</p>
                    </div>
                  </div>
                )}

                {seedError && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/35 p-4 text-2xs text-rose-605 dark:text-rose-400 font-semibold mt-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
                    <div>
                      <p className="font-bold">Generation Failed</p>
                      <p className="font-medium mt-0.5">{seedError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Species Catalog Synchronization Section */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/45 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Database className="h-4.5 w-4.5 text-emerald-500" />
                    Species Profile Database Synchronization
                  </h4>
                  <p className="text-4xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed font-semibold">
                    Synchronize the global offline knowledge base with the local PostgreSQL database. This migration imports and registers all missing Indian and global species profiles, ensuring 100% catalog completeness.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSyncSpeciesCatalog}
                    disabled={syncing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Synchronizing Profiles...</span>
                      </>
                    ) : (
                      <span>Synchronize Species Catalog</span>
                    )}
                  </button>
                </div>

                {syncResult && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-250 dark:border-emerald-900/35 p-4 text-2xs text-emerald-700 dark:text-emerald-400 font-semibold mt-4">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    <div>
                      <p className="font-bold">✔ Sync Success</p>
                      <p className="font-medium mt-1">{syncResult.message}</p>
                      <p className="text-3xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                        Added: <span className="font-bold">{syncResult.added}</span> | Updated: <span className="font-bold">{syncResult.updated}</span> | Total Profiles: <span className="font-bold">{syncResult.total_db}</span>
                      </p>
                    </div>
                  </div>
                )}

                {syncError && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-955/40 border border-rose-200 dark:border-rose-900/35 p-4 text-2xs text-rose-605 dark:text-rose-455 font-semibold mt-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
                    <div>
                      <p className="font-bold">Sync Failed</p>
                      <p className="font-medium mt-0.5">{syncError}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-50/90 dark:bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 z-10">
                <Sparkles className="h-10 w-10 text-emerald-500 mb-3 animate-pulse" />
                <span className="px-2 py-0.5 rounded text-5xs font-bold uppercase border bg-emerald-950 text-emerald-400 border-emerald-900/40">
                  Future Module
                </span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-3">{activeTab} Configs</h4>
                <p className="text-4xs text-slate-550 dark:text-slate-400 max-w-[240px] mt-1 leading-relaxed font-semibold">
                  Adjustable configuration arrays for {activeTab.toLowerCase()} will become active in future WPIS releases.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
