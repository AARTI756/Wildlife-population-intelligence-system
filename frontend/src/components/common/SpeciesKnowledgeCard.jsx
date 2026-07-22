import React, { useState, useEffect } from 'react';
import { getSpeciesKnowledge } from '../../services/speciesKnowledgeService';
import { getSpeciesImage } from '../../services/speciesImageService';
import { 
  Volume2, 
  Loader2, 
  AlertTriangle, 
  ShieldAlert, 
  BookOpen, 
  Layers, 
  Tag, 
  Compass, 
  HeartPulse, 
  Leaf, 
  Apple 
} from 'lucide-react';

const SpeciesKnowledgeCard = ({ speciesName, confidence }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const confPercent = confidence < 1 ? confidence * 100 : confidence;
  const isLowConfidence = confPercent < 25;

  const profile = !isLowConfidence ? getSpeciesKnowledge(speciesName) : null;

  // Asynchronous image fetching from Wikimedia Commons with cache checks
  useEffect(() => {
    if (isLowConfidence) {
      setImageLoading(false);
      return;
    }

    let active = true;
    const fetchImage = async () => {
      // Use profile scientific/common name if available, fallback to raw speciesName
      const scientificName = profile?.scientific_name || speciesName;
      const commonName = profile?.common_name || speciesName;
      
      try {
        setImageLoading(true);
        setImageError(false);
        const url = await getSpeciesImage(scientificName, commonName);
        if (active) {
          if (url) {
            setImageUrl(url);
          } else {
            setImageError(true);
          }
        }
      } catch (err) {
        console.error("Image loading error in card:", err);
        if (active) {
          setImageError(true);
        }
      } finally {
        if (active) {
          setImageLoading(false);
        }
      }
    };

    fetchImage();
    return () => {
      active = false;
    };
  }, [speciesName, profile, isLowConfidence]);

  // IUCN Status color picker
  const getIucnColors = (code) => {
    switch (code) {
      case 'CR':
      case 'EN':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30';
      case 'VU':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30';
      case 'NT':
      case 'LC':
      default:
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/40';
    }
  };

  // 1. Render Low Confidence Warning (Confidence < 25%)
  if (isLowConfidence) {
    return (
      <div className="glass-card p-6 border-amber-300 dark:border-amber-800 bg-amber-50/5 dark:bg-amber-950/5 flex flex-col md:flex-row gap-5 items-center md:items-start shadow-sm animate-fade-in">
        <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800/40">
          <ShieldAlert className="h-10 w-10 animate-bounce" />
        </div>
        <div className="space-y-3 text-center md:text-left">
          <div className="space-y-1">
            <span className="inline-flex px-2 py-0.5 rounded text-5xs font-bold uppercase tracking-wider bg-amber-105 border border-amber-250 text-amber-700 dark:text-amber-400">
              Low Confidence Warning
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Unknown Species</h3>
            <p className="text-2xs font-mono text-slate-450 font-bold">Confidence: {confPercent.toFixed(0)}%</p>
          </div>
          <p className="text-xs font-semibold text-slate-655 dark:text-slate-400 leading-relaxed max-w-md">
            The bioacoustic prediction confidence is too low to accurately identify this target. Manual verification by an expert ornithologist/acoustic analyst is strongly recommended.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden border-slate-205 dark:border-slate-805 hover:border-emerald-500/20 shadow-sm transition-all group animate-fade-in bg-white dark:bg-slate-950 flex flex-col justify-between h-full">
      
      {/* Decorative header border matching IUCN color */}
      <div className={`h-1.5 w-full ${profile ? (profile.iucn_code === 'VU' ? 'bg-amber-500' : (profile.iucn_code === 'CR' || profile.iucn_code === 'EN' ? 'bg-rose-500' : 'bg-emerald-500')) : 'bg-slate-300 dark:bg-slate-800'}`} />
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        
        {/* Left Side: Image and Quick Stats */}
        <div className="space-y-4">
          <div className="h-44 rounded-2xl overflow-hidden relative bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-805 flex items-center justify-center shadow-xs">
            {imageLoading ? (
              <div className="h-full w-full bg-slate-100 dark:bg-slate-855 animate-pulse flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
              </div>
            ) : imageError || !imageUrl ? (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <Volume2 className="h-10 w-10 text-slate-350 dark:text-slate-600 mb-1" />
                <span className="text-5xs text-slate-500 uppercase tracking-widest font-extrabold">Image unavailable</span>
              </div>
            ) : (
              <img 
                src={imageUrl} 
                alt={profile?.common_name || speciesName} 
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={() => setImageError(true)}
              />
            )}
            
            {/* Confidence Badge */}
            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-5xs font-bold uppercase bg-slate-955/85 text-white font-mono border border-slate-800">
              {confPercent.toFixed(0)}% Conf
            </span>
          </div>

          {/* Quick Metrics */}
          {profile ? (
            <div className="grid grid-cols-2 gap-3 text-2xs font-semibold">
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-805/60 bg-slate-50/40 dark:bg-slate-900/20 space-y-1">
                <span className="flex items-center gap-1 text-slate-500 uppercase tracking-wider text-5xs font-bold">
                  <Leaf className="h-3 w-3 text-emerald-500" />
                  Habitat
                </span>
                <span className="text-slate-900 dark:text-white font-extrabold">{profile.habitat}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-805/60 bg-slate-50/40 dark:bg-slate-900/20 space-y-1">
                <span className="flex items-center gap-1 text-slate-500 uppercase tracking-wider text-5xs font-bold">
                  <Apple className="h-3 w-3 text-amber-500" />
                  Diet
                </span>
                <span className="text-slate-900 dark:text-white font-extrabold">{profile.diet}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Side (Span 2): Species taxonomy & metadata details */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            
            {/* Header info */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-50 dark:border-slate-850 pb-3">
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-900 dark:text-white truncate" title={profile?.common_name || speciesName}>
                  {profile?.common_name || speciesName}
                </h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400 italic font-semibold mt-0.5 break-all whitespace-normal">
                  {profile?.scientific_name || speciesName}
                </p>
              </div>

              {/* IUCN Status Badge */}
              {profile && (
                <div className={`px-2.5 py-1 rounded-xl text-5xs font-bold uppercase tracking-wider ${getIucnColors(profile.iucn_code)}`}>
                  IUCN: {profile.iucn_status}
                </div>
              )}
            </div>

            {/* Profile Info Details / Descriptions */}
            {profile ? (
              <div className="space-y-4">
                
                {/* Description text */}
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-5xs uppercase tracking-wider text-slate-550 dark:text-slate-400 font-extrabold">
                    <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                    Species Profile Summary
                  </span>
                  <p className="text-xs font-semibold text-slate-705 dark:text-slate-350 leading-relaxed">
                    {profile.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Taxonomy block */}
                  <div className="space-y-2">
                    <span className="flex items-center gap-1.5 text-5xs uppercase tracking-wider text-slate-550 dark:text-slate-400 font-extrabold">
                      <Layers className="h-3.5 w-3.5 text-purple-500" />
                      Taxonomic Classification
                    </span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-5xs font-mono font-bold text-slate-655 border border-slate-100 dark:border-slate-805 p-3 rounded-xl bg-slate-50/20 dark:bg-slate-900/10">
                      <div>Kingdom:</div>
                      <div className="text-slate-900 dark:text-white text-right">{profile.taxonomy.kingdom}</div>
                      <div>Phylum:</div>
                      <div className="text-slate-900 dark:text-white text-right">{profile.taxonomy.phylum}</div>
                      <div>Class:</div>
                      <div className="text-slate-900 dark:text-white text-right">{profile.taxonomy.class}</div>
                      <div>Order:</div>
                      <div className="text-slate-900 dark:text-white text-right">{profile.taxonomy.order}</div>
                      <div>Family:</div>
                      <div className="text-slate-900 dark:text-white text-right">{profile.taxonomy.family}</div>
                      <div>Genus:</div>
                      <div className="text-slate-900 dark:text-white text-right">{profile.taxonomy.genus}</div>
                      <div>Species:</div>
                      <div className="text-slate-900 dark:text-white text-right italic">{profile.taxonomy.species}</div>
                    </div>
                  </div>

                  {/* Distribution Tags */}
                  <div className="space-y-2">
                    <span className="flex items-center gap-1.5 text-5xs uppercase tracking-wider text-slate-550 dark:text-slate-400 font-extrabold">
                      <Compass className="h-3.5 w-3.5 text-blue-500" />
                      Native Distribution
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.distribution.map((dist, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-0.5 rounded text-5xs font-extrabold uppercase bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-505 dark:text-slate-400 tracking-wider shadow-xs"
                        >
                          {dist}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              // Species not found in database: show grace notice
              <div className="p-4 rounded-xl border border-dashed border-slate-205 dark:border-slate-805 bg-slate-50/20 dark:bg-slate-900/10 text-center flex flex-col items-center justify-center space-y-1 py-10">
                <AlertTriangle className="h-6 w-6 text-slate-400" />
                <h4 className="text-xs font-bold text-slate-705 dark:text-slate-350">Information currently unavailable</h4>
                <p className="text-5xs text-slate-500 font-semibold max-w-xs leading-normal">
                  Full taxonomic profile and conservation metadata is not registered in the system library for this species query.
                </p>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default SpeciesKnowledgeCard;
