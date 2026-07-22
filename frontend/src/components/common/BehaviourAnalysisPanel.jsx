import React from 'react';
import { BrainCircuit } from 'lucide-react';

const BehaviourAnalysisPanel = ({ behaviour }) => {
  const data = behaviour && typeof behaviour === 'object' ? behaviour : {};
  const val = data['behaviour'] || data['primary_behaviour'] || (typeof behaviour === 'string' ? behaviour : 'Unknown');
  const reasoning = data['reasoning'] || '';

  return (
    <section className="rounded-xl border border-violet-250/70 dark:border-violet-900/40 bg-violet-50/20 dark:bg-violet-950/10 p-3 space-y-2 shadow-sm">
      <div className="flex items-center gap-2">
        <BrainCircuit className="h-4 w-4 text-violet-600" />
        <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Behaviour Analysis</h4>
      </div>
      <div className="flex flex-col gap-1.5 text-3xs">
        <div className="flex justify-between border-b border-violet-100/70 dark:border-violet-900/20 pb-1">
          <span className="text-slate-400 font-medium">Primary Behaviour</span>
          <span className="font-bold text-slate-900 dark:text-white font-mono text-[10px]">{val}</span>
        </div>
        {reasoning && (
          <div className="mt-1">
            <span className="text-slate-400 font-medium block mb-0.5">Reasoning</span>
            <p className="text-slate-600 dark:text-slate-400 italic text-[10px] leading-relaxed">{reasoning}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default BehaviourAnalysisPanel;
