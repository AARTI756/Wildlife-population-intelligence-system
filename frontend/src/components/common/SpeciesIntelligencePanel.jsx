import React from 'react';
import { ShieldCheck } from 'lucide-react';

const SpeciesIntelligencePanel = ({ profile = {}, profileAvailable }) => {
  if (!profileAvailable) {
    return (
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/20 dark:bg-slate-950/10 shadow-sm">
        <h4 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          Species Intelligence
        </h4>
        <p className="text-xs text-slate-500 mt-2 font-semibold">Species profile unavailable</p>
      </section>
    );
  }
  const threatened = ['Vulnerable', 'Endangered', 'Critically Endangered'].includes(profile.iucn_status);
  const priority = profile.iucn_status === 'Critically Endangered' ? 'Critical' : threatened ? 'High' : 'Routine';
  const rows = [
    ['Threat Level', profile.iucn_status || 'Not Available'],
    ['Conservation Priority', priority],
    ['Protection Recommendations', threatened ? 'Protect habitat, increase monitoring and notify conservation staff.' : 'Maintain monitoring and preserve habitat connectivity.'],
    ['Habitat Suitability', profile.habitat ? `Requires: ${profile.habitat}` : 'Not Available'],
    ['Human-Wildlife Conflict Risk', threatened ? 'Review local site conditions' : 'Assess from site observations'],
    ['Anti-poaching Recommendations', threatened ? 'Prioritise patrol coverage and secure detection locations.' : 'Continue routine patrol coverage.'],
  ];
  return (
    <section className="rounded-xl border border-emerald-250/70 dark:border-emerald-900/40 p-4 space-y-3 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm">
      <h4 className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        Species Intelligence
      </h4>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 text-3xs font-semibold">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between border-b border-emerald-100/70 dark:border-emerald-900/20 pb-1">
            <dt className="text-slate-500 font-medium">{label}</dt>
            <dd className="font-bold text-slate-900 dark:text-white text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
export default SpeciesIntelligencePanel;
