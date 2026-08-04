import React from 'react';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import { AlertCircle, Map, RefreshCw, Maximize, Sun, Moon, Download, Layers } from 'lucide-react';

const MapCard = ({
  title,
  subtitle,
  loading = false,
  error = null,
  isEmpty = false,
  emptyTitle = 'No Spatial Overlays Available',
  emptyDescription = 'No tracking coordinates have been configured for this intelligence layer.',
  mapRef,
  height = 'h-[500px] lg:h-[620px]',
  className = '',
  children,
  onResetView,
  onFitData,
  basemapMode = 'light',
  onToggleBasemap,
  showLegend = true,
  onToggleLegend,
  onExportPNG,
  infoPanel
}) => {
  return (
    <div className={`flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 shadow-sm overflow-hidden ${className}`}>
      {/* Header with standard GIS toolbar */}
      {title && (
        <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/20">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Map className="h-4 w-4 text-emerald-500 shrink-0" />
              {title}
            </h3>
            {subtitle && (
              <p className="text-3xs text-slate-550 dark:text-slate-455 mt-0.5 font-semibold">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Top toolbar overlays */}
          <div className="flex items-center gap-1.5 self-start sm:self-center bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-3xs">
            {onResetView && (
              <button 
                type="button" 
                onClick={onResetView}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 transition-colors"
                title="Reset View"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
            {onFitData && (
              <button 
                type="button" 
                onClick={onFitData}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 transition-colors"
                title="Fit to Data"
              >
                <Maximize className="h-3.5 w-3.5" />
              </button>
            )}
            {onToggleBasemap && (
              <button 
                type="button" 
                onClick={onToggleBasemap}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 transition-colors"
                title={`Switch to ${basemapMode === 'light' ? 'Dark' : 'Light'} Basemap`}
              >
                {basemapMode === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              </button>
            )}
            {onToggleLegend && (
              <button 
                type="button" 
                onClick={onToggleLegend}
                className={`p-1 rounded transition-colors ${showLegend ? 'bg-emerald-50 dark:bg-emerald-955/45 text-emerald-600 dark:text-emerald-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350'}`}
                title={showLegend ? 'Hide Legend' : 'Show Legend'}
              >
                <Layers className="h-3.5 w-3.5" />
              </button>
            )}
            {onExportPNG && (
              <button 
                type="button" 
                onClick={onExportPNG}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 transition-colors"
                title="Export Map Image"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Map view canvas */}
      <div className={`w-full relative ${height} bg-slate-50/20 dark:bg-slate-950/20`}>
        {loading ? (
          <LoadingState message="Initializing geospatial tiles..." className="absolute inset-0" />
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-rose-600 dark:text-rose-455 bg-rose-50/10">
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

      {/* Dedicated Information Panel below the map */}
      {infoPanel && (
        <div className="p-5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/10">
          {infoPanel}
        </div>
      )}
    </div>
  );
};

export default MapCard;
