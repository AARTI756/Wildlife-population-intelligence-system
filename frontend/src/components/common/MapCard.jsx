import React from 'react';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import { AlertCircle, Map } from 'lucide-react';

const MapCard = ({
  title,
  subtitle,
  loading = false,
  error = null,
  isEmpty = false,
  emptyTitle = 'No Spatial Overlays Available',
  emptyDescription = 'No tracking coordinates have been configured for this intelligence layer.',
  mapRef,
  height = 'min-h-[300px]',
  className = '',
  children
}) => {
  return (
    <div className={`glass-card p-6 flex flex-col justify-between border-slate-202 dark:border-slate-805 shadow-sm ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-3xs text-slate-550 dark:text-slate-400 mt-0.5 font-semibold">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className={`flex-1 w-full rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-800 ${height} shadow-inner bg-slate-50/20 dark:bg-slate-950/20`}>
        {loading ? (
          <LoadingState message="Initializing geospatial tiles..." className="absolute inset-0" />
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-rose-600 dark:text-rose-450 bg-rose-50/10">
            <AlertCircle className="h-8 w-8 mb-2 animate-bounce" />
            <h4 className="text-xs font-bold">Map Loading Interrupted</h4>
            <p className="text-3xs text-slate-550 dark:text-slate-500 mt-1">{error}</p>
          </div>
        ) : isEmpty ? (
          <EmptyState 
            title={emptyTitle} 
            description={emptyDescription} 
            icon={Map} 
            className="absolute inset-0 border-none bg-transparent"
          />
        ) : (
          <>
            {mapRef && <div ref={mapRef} className="absolute inset-0" />}
            {children}
          </>
        )}
      </div>
    </div>
  );
};

export default MapCard;
