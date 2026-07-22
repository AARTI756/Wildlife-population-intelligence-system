import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center">
      <div className="glass-card max-w-md p-8 border border-rose-900/30 shadow-2xl bg-slate-900/40">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-950/50 text-rose-500 border border-rose-800/40">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-100">Access Denied</h1>
        <p className="mb-6 text-slate-400 text-sm leading-relaxed">
          You do not have the required permissions or role configurations to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all duration-200 border border-slate-700/60 shadow-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
