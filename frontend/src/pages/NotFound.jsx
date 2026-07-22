import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center">
      <div className="glass-card max-w-md p-8 border border-slate-800 bg-slate-900/40">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/40 text-emerald-500 border border-emerald-800/40">
          <HelpCircle className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-100">Page Not Found</h1>
        <p className="mb-6 text-slate-400 text-sm leading-relaxed">
          The page you are looking for does not exist or has been moved. Check the URL or return to safety.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-200 shadow-lg shadow-emerald-900/20"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
