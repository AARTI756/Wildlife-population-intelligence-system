import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = 'Loading intelligence telemetry...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-emerald-500 font-sans min-h-[200px] ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
      <span className="text-sm font-semibold text-slate-650 dark:text-slate-400">
        {message}
      </span>
    </div>
  );
};

export default LoadingState;
