import React from 'react';
import { Settings as SettingsIcon, Info, Globe, Shield } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6 animate-fade-in text-slate-800 font-sans">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
          <SettingsIcon className="h-3.5 w-3.5 text-emerald-500" />
          System Preferences
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
          Settings
        </h1>
        <p className="text-sm text-slate-600 mt-1 font-semibold">
          View system environment configuration and regional preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Information */}
        <div className="glass-card p-6 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Info className="h-4 w-4 text-emerald-500" />
            System Information
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">WPIS Version</span>
              <span className="font-extrabold text-slate-800">v4.0.0 (Milestone 4)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Environment</span>
              <span className="font-extrabold text-slate-800">Production</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Database Status</span>
              <span className="font-extrabold text-emerald-600">Connected (PostgreSQL)</span>
            </div>
          </div>
        </div>

        {/* Regional Preferences */}
        <div className="glass-card p-6 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-500" />
            Regional &amp; Localization
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Primary Time Zone</span>
              <span className="font-extrabold text-slate-800">India Standard Time (IST)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Measurement Units</span>
              <span className="font-extrabold text-slate-800">Metric System (Celsius, Meters)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">Language</span>
              <span className="font-extrabold text-slate-800">English (India)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
