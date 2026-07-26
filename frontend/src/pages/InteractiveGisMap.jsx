import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { useTheme } from '../hooks/useTheme';
import { formatIST, localizeSpeciesName } from '../utils/india';
import { Loader2 } from 'lucide-react';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

// Custom MarkerCluster component inside react-leaflet context
const MarkerCluster = ({ sitesData }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !sitesData || sitesData.length === 0) return;

    // Create marker cluster group
    const mcg = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true
    });

    sitesData.forEach((site) => {
      const markerColor = site.protected_area ? '#2E7D32' : '#1E88E5';
      const markerIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-110" style="background-color: ${markerColor}"><div class="h-2.5 w-2.5 rounded-full bg-slate-900 animate-pulse"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const popupHtml = `
        <div class="p-3 font-sans text-slate-900 max-w-[280px]">
          <h4 class="font-black text-sm text-slate-900 border-b border-slate-200 pb-1.5">
            📍 ${site.name}
          </h4>
          <div class="space-y-2 mt-2.5 text-[10px] font-semibold text-slate-700">
            <div class="flex items-center gap-2">
              <span class="text-slate-400 font-bold uppercase tracking-wider block text-[9px] w-24">Location:</span>
              <span class="text-slate-800 truncate">${site.location || 'Unknown coordinates'}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-slate-400 font-bold uppercase tracking-wider block text-[9px] w-24">Protected Status:</span>
              <span class="${site.protected_area ? 'text-emerald-600 font-bold' : 'text-blue-600 font-bold'}">
                ${site.protected_area ? 'Protected Area' : 'Standard Area'}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-slate-400 font-bold uppercase tracking-wider block text-[9px] w-24">Active Survey:</span>
              <span class="text-slate-900 font-black">${site.surveyName}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-slate-400 font-bold uppercase tracking-wider block text-[9px] w-24">Habitat:</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">${site.habitat_type || 'General Buffer'}</span>
            </div>
            <div class="flex items-start gap-2 pt-1 border-t border-slate-100">
              <span class="text-slate-400 font-bold uppercase tracking-wider block text-[9px] w-24 mt-0.5">Species Observed:</span>
              <span class="text-slate-800 font-bold truncate flex-1">${site.observedSpecies || 'None'}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-slate-400 font-bold uppercase tracking-wider block text-[9px] w-24">Animal Count:</span>
              <span class="text-emerald-650 font-black text-xs">${site.totalCount}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-slate-400 font-bold uppercase tracking-wider block text-[9px] w-24">Last Sighting:</span>
              <span class="text-slate-500 font-medium">${site.lastObservation}</span>
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([site.latitude, site.longitude], { icon: markerIcon });
      marker.bindPopup(popupHtml);
      mcg.addLayer(marker);
    });

    map.addLayer(mcg);

    // Zoom map to fit all markers
    if (sitesData.length > 0) {
      const bounds = L.latLngBounds(sitesData.map(s => [s.latitude, s.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      map.removeLayer(mcg);
    };
  }, [map, sitesData]);

  return null;
};

const InteractiveGisMap = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sitesData, setSitesData] = useState([]);

  useEffect(() => {
    const fetchGisData = async () => {
      try {
        const [sitesRes, obsRes, surveysRes] = await Promise.all([
          api.get('/api/monitoring-sites'),
          api.get('/api/observations'),
          api.get('/api/surveys')
        ]);

        const sites = sitesRes.data || [];
        const observations = obsRes.data || [];
        const surveys = surveysRes.data || [];

        // Map surveys & observations to monitoring sites
        const processedSites = sites.map((site) => {
          // Find survey name
          let surveyName = 'No Active Survey';
          if (site.survey_id) {
            const matchedSurvey = surveys.find(s => s.id === site.survey_id);
            if (matchedSurvey) surveyName = matchedSurvey.name;
          }

          // Filter observations matching this site
          const siteObs = observations.filter(o => o.monitoring_site_id === site.id);
          
          // Get unique species
          const speciesList = [...new Set(siteObs.map(o => localizeSpeciesName(o.species_name || o.species)))];
          const observedSpecies = speciesList.length > 0 ? speciesList.join(', ') : 'No recorded observations';

          // Get total count
          const totalCount = siteObs.reduce((sum, o) => sum + (o.count || 0), 0);

          // Get last observation timestamp
          let lastObservation = '—';
          if (siteObs.length > 0) {
            const sortedObs = [...siteObs].sort((a, b) => new Date(b.timestamp || b.observation_datetime) - new Date(a.timestamp || a.observation_datetime));
            const lastObsTime = sortedObs[0].timestamp || sortedObs[0].observation_datetime;
            if (lastObsTime) {
              lastObservation = formatIST(lastObsTime);
            }
          }

          return {
            ...site,
            surveyName,
            observedSpecies,
            totalCount,
            lastObservation
          };
        });

        setSitesData(processedSites);
      } catch (err) {
        console.error('Failed to load GIS mapping data:', err);
        setError('Failed to fetch monitoring telemetry coordinates.');
      } finally {
        setLoading(false);
      }
    };

    fetchGisData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            GIS Telemetry Tracking Map
          </h2>
          <p className="text-2xs sm:text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
            Interactive GIS monitoring visualization layer mapping camera traps, sensors, and observation counts.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="glass-card p-6 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col min-h-[500px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-emerald-500 gap-3">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-xs font-bold text-slate-655 dark:text-slate-400">Loading spatial GIS markers...</span>
          </div>
        ) : (
          <div className="flex-1 w-full rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-800 min-h-[480px]">
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              zoomControl={true}
              attributionControl={false}
              style={{ height: '100%', width: '100%', minHeight: '480px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MarkerCluster sitesData={sitesData} />
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveGisMap;
