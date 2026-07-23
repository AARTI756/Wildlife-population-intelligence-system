import React, { useState, useEffect } from 'react';
import { getSpeciesImage } from '../../services/speciesImageService';
import { Volume2, Loader2, Bird } from 'lucide-react';

const TimelineImageThumbnail = ({ scientificName, commonName, className = "h-10 w-10 rounded-lg object-cover shrink-0 border border-slate-100 dark:border-slate-800" }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setImageUrl(null);
    setLoading(true);
    let active = true;
    const loadImage = async () => {
      try {
        const url = await getSpeciesImage(scientificName, commonName);
        if (active) {
          setImageUrl(url);
        }
      } catch (err) {
        console.warn("Failed to load thumbnail:", scientificName, err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadImage();
    return () => {
      active = false;
    };
  }, [scientificName, commonName]);

  if (loading) {
    return (
      <div className={`${className} bg-slate-100 dark:bg-slate-900 animate-pulse flex items-center justify-center`}>
        <Loader2 className="h-4 w-4 text-slate-350 dark:text-slate-600 animate-spin" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`${className} bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500`} title="Illustration placeholder">
        <Bird className="h-6 w-6 opacity-60" />
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={commonName} 
      className={className}
      onError={() => setImageUrl(null)}
    />
  );
};

export default TimelineImageThumbnail;
