import React from 'react';
import { HeartHandshake, Sparkles, HelpCircle } from 'lucide-react';

const ConservationRecommendations = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          AI Action Advisory
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          AI Conservation Recommendations
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Receive automated advisories regarding threat warnings, land restore steps, and asset positioning guidelines.
        </p>
      </div>

      <div className="glass-card p-8 min-h-[400px] flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 bg-slate-50/90 dark:bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 z-10">
          <HeartHandshake className="h-12 w-12 text-emerald-500 mb-4 animate-bounce" />
          <span className="px-2.5 py-0.5 rounded-full text-4xs font-bold uppercase border bg-emerald-950 text-emerald-400 border-emerald-900/40">
            Future Milestone
          </span>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-3">AI Conservation recommendations</h4>
          <p className="text-xs text-slate-500 dark:text-slate-500 max-w-sm mt-2 leading-relaxed">
            This module is scheduled for development in Milestone 3. Advisory logic will process threat alerts to recommend action priorities.
          </p>
        </div>

        <div className="space-y-3">
          <HelpCircle className="h-10 w-10 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">Awaiting Recommendation Triggers</h4>
        </div>
      </div>
    </div>
  );
};

export default ConservationRecommendations;
