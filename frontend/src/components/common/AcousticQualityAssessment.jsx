import React from 'react';
import { 
  Wind, 
  CloudRain, 
  Waves, 
  UserCheck, 
  Car, 
  VolumeX, 
  BarChart, 
  ShieldAlert, 
  Award, 
  FileAudio, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Pause,
  Square,
  Sparkles,
  ShieldCheck,
  Percent,
  TrendingUp,
  Volume2
} from 'lucide-react';

// 1. RecordingQualityCard
export const RecordingQualityCard = ({ rating, snr, dynamicRange }) => {
  const getQualityStyle = (val) => {
    switch (val) {
      case 'Excellent':
        return {
          badge: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-450 border-emerald-200',
          bg: 'border-emerald-500/10 bg-emerald-500/5',
          desc: 'High clarity signal. Ambient noise is extremely minimal, ensuring maximum fidelity for model predictions.'
        };
      case 'Good':
        return {
          badge: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-450 border-blue-200',
          bg: 'border-blue-500/10 bg-blue-500/5',
          desc: 'Solid classification parameters. Low noise floor with clearly identifiable acoustic call triggers.'
        };
      case 'Fair':
        return {
          badge: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-450 border-amber-200',
          bg: 'border-amber-500/10 bg-amber-500/5',
          desc: 'Moderate background hiss or wind distortion present. Call signatures are present but slightly masked.'
        };
      case 'Poor':
      default:
        return {
          badge: 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-455 border-rose-200',
          bg: 'border-rose-500/10 bg-rose-500/5',
          desc: 'High ambient noise or clipped amplitude levels. Model classifications are highly susceptible to false positives.'
        };
    }
  };

  const style = getQualityStyle(rating);

  return (
    <div className={`glass-card p-5 border ${style.bg} space-y-3 animate-fade-in`}>
      <div className="flex justify-between items-center">
        <span className="text-4xs uppercase tracking-wider text-slate-500 font-bold">Acoustic Class</span>
        <span className={`px-2 py-0.5 rounded text-5xs font-bold border uppercase tracking-wider ${style.badge}`}>
          {rating}
        </span>
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
          <Award className="h-4 w-4 text-emerald-505" />
          Recording Quality
        </h4>
        <p className="text-2xs text-slate-655 dark:text-slate-400 font-semibold leading-relaxed">
          {style.desc}
        </p>
      </div>
    </div>
  );
};

// 2. EnvironmentalNoiseCard
export const EnvironmentalNoiseCard = ({ noiseLevel, source }) => {
  const getNoiseIcon = (src) => {
    const s = src.toLowerCase();
    if (s.includes('wind')) return <Wind className="h-5 w-5 text-blue-500 animate-pulse" />;
    if (s.includes('rain')) return <CloudRain className="h-5 w-5 text-indigo-500" />;
    if (s.includes('water') || s.includes('flow')) return <Waves className="h-5 w-5 text-teal-500" />;
    if (s.includes('human')) return <UserCheck className="h-5 w-5 text-amber-500" />;
    if (s.includes('vehicle') || s.includes('car')) return <Car className="h-5 w-5 text-rose-500" />;
    return <VolumeX className="h-5 w-5 text-slate-400" />;
  };

  const getNoiseBadge = (val) => {
    switch (val) {
      case 'Very Low':
      case 'Low':
        return 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-450 border border-emerald-250';
      case 'Moderate':
        return 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-450 border border-amber-250';
      case 'High':
      case 'Very High':
      default:
        return 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-455 border border-rose-250';
    }
  };

  return (
    <div className="glass-card p-5 space-y-3.5 border-slate-205 dark:border-slate-805">
      <div className="flex justify-between items-center">
        <span className="text-4xs uppercase tracking-wider text-slate-500 font-bold">Estimated Noise Floor</span>
        <span className={`px-2 py-0.5 rounded text-5xs font-bold uppercase tracking-wider ${getNoiseBadge(noiseLevel)}`}>
          {noiseLevel}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-805 flex items-center justify-center shrink-0">
          {getNoiseIcon(source)}
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-900 dark:text-white">Noise Source Prediction</h4>
          <p className="text-5xs text-slate-500 font-semibold font-mono uppercase mt-0.5">{source}</p>
        </div>
      </div>
    </div>
  );
};

// 3. NoiseMetricsCard (Dashboard stats)
export const NoiseMetricsCard = ({ snr, backgroundNoise, rms, silencePercent, dynamicRange }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {/* SNR */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 shadow-xs flex flex-col justify-between">
        <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-1">Signal-to-Noise (SNR)</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black text-slate-900 dark:text-white">{snr.toFixed(1)}</span>
          <span className="text-5xs text-slate-400 font-mono font-bold">dB</span>
        </div>
      </div>

      {/* Noise Level */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 shadow-xs flex flex-col justify-between">
        <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-1">Noise Floor (RMS)</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black text-slate-900 dark:text-white">{backgroundNoise.toFixed(4)}</span>
          <span className="text-5xs text-slate-400 font-mono font-bold">RMS</span>
        </div>
      </div>

      {/* Average Loudness */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 shadow-xs flex flex-col justify-between">
        <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-1">Avg Loudness</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black text-slate-900 dark:text-white">{(20 * Math.log10(rms || 0.0001)).toFixed(1)}</span>
          <span className="text-5xs text-slate-400 font-mono font-bold">dB RMS</span>
        </div>
      </div>

      {/* Silence Percent */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 shadow-xs flex flex-col justify-between">
        <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-1">Silence Percentage</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black text-slate-900 dark:text-white">{silencePercent.toFixed(1)}</span>
          <span className="text-5xs text-slate-400 font-mono font-bold">%</span>
        </div>
      </div>

      {/* Dynamic Range */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 shadow-xs flex flex-col justify-between">
        <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-1">Dynamic Range</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black text-slate-900 dark:text-white">{dynamicRange.toFixed(1)}</span>
          <span className="text-5xs text-slate-400 font-mono font-bold">dB</span>
        </div>
      </div>

      {/* Peak Level */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 shadow-xs flex flex-col justify-between">
        <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-1">Peak Amplitude</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black text-slate-900 dark:text-white">{(20 * Math.log10(rms || 0.0001)).toFixed(1)}</span>
          <span className="text-5xs text-slate-400 font-mono font-bold">dBFS</span>
        </div>
      </div>
    </div>
  );
};

// 4. ReliabilityIndicator
export const ReliabilityIndicator = ({ reliability, score }) => {
  const getReliabilityStyle = (val) => {
    switch (val) {
      case 'Very Reliable':
        return { color: 'bg-emerald-500', text: 'text-emerald-500', badge: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-250 text-emerald-700 dark:text-emerald-450' };
      case 'Reliable':
        return { color: 'bg-blue-500', text: 'text-blue-500', badge: 'bg-blue-50 dark:bg-blue-950 border-blue-200 text-blue-700 dark:text-blue-450' };
      case 'Moderately Reliable':
        return { color: 'bg-amber-500', text: 'text-amber-500', badge: 'bg-amber-50 dark:bg-amber-950 border-amber-250 text-amber-700 dark:text-amber-450' };
      case 'Low Reliability':
      default:
        return { color: 'bg-rose-500', text: 'text-rose-500', badge: 'bg-rose-50 dark:bg-rose-950 border-rose-200 text-rose-700 dark:text-rose-455' };
    }
  };

  const style = getReliabilityStyle(reliability);

  return (
    <div className="glass-card p-5 space-y-4 border-slate-205 dark:border-slate-805">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
            Analysis Reliability
          </h4>
          <p className="text-4xs text-slate-500 font-semibold mt-0.5">Calculated based on recording quality and prediction scores</p>
        </div>
        <span className={`px-2 py-0.5 rounded text-5xs font-bold border uppercase tracking-wider ${style.badge}`}>
          {reliability}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-2xs font-mono font-bold text-slate-655">
          <span>Reliability Index</span>
          <span>{score}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-805">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${style.color}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// 5. AcousticRecommendations
export const AcousticRecommendations = ({ recommendations }) => {
  return (
    <div className="glass-card p-5 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-950/10 dark:to-teal-950/5 border-emerald-500/15 space-y-3.5 shadow-xs">
      <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
        <Info className="h-4.5 w-4.5 text-emerald-505" />
        Acoustic Telemetry Recommendations
      </h4>

      <ul className="space-y-2 text-2xs font-semibold text-slate-705 dark:text-slate-350">
        {recommendations.map((rec, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// 6. AudioMetadataCard
export const AudioMetadataCard = ({ sampleRate, channels, fileSize, encoding, duration }) => {
  return (
    <div className="glass-card p-5 space-y-4 border-slate-205 dark:border-slate-805">
      <h4 className="text-xs font-black text-slate-905 dark:text-white flex items-center gap-1.5">
        <FileAudio className="h-4.5 w-4.5 text-emerald-500" />
        Audio Stream Metadata
      </h4>

      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-2xs font-semibold text-slate-655">
        <div className="border-b border-slate-50 dark:border-slate-900 pb-1.5 flex justify-between">
          <span>Encoding</span>
          <span className="text-slate-900 dark:text-white text-right font-extrabold truncate max-w-[120px]" title={encoding}>{encoding}</span>
        </div>
        <div className="border-b border-slate-50 dark:border-slate-900 pb-1.5 flex justify-between">
          <span>Sample Rate</span>
          <span className="text-slate-900 dark:text-white text-right font-extrabold font-mono">{sampleRate} Hz</span>
        </div>
        <div className="border-b border-slate-50 dark:border-slate-900 pb-1.5 flex justify-between">
          <span>Audio Channels</span>
          <span className="text-slate-900 dark:text-white text-right font-extrabold font-mono">{channels === 1 ? 'Mono (1ch)' : 'Stereo (2ch)'}</span>
        </div>
        <div className="border-b border-slate-50 dark:border-slate-900 pb-1.5 flex justify-between">
          <span>File Size</span>
          <span className="text-slate-900 dark:text-white text-right font-extrabold font-mono">{(fileSize / (1024 * 1024)).toFixed(2)} MB</span>
        </div>
      </div>
    </div>
  );
};

// 7. WaveformDetectionOverlay (Incorporates Playback cursor, markers, and click-to-seek)
export const WaveformDetectionOverlay = ({ 
  audioRef,
  preview,
  waveformBars, 
  currentTime, 
  duration, 
  onSeek, 
  detections,
  handleAudioTimeUpdate,
  handleAudioMetadataLoad,
  handleAudioEnded
}) => {
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  
  const handleSeekClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newRatio = clickX / width;
    onSeek(newRatio * duration);
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds === null) return '00:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert "MM:SS" back to seconds
  const parseTimestampToSeconds = (timestampStr) => {
    if (!timestampStr) return 0;
    const parts = timestampStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  };

  return (
    <div className="glass-card p-6 space-y-6 border-slate-205 dark:border-slate-805 animate-fade-in shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Volume2 className="h-4.5 w-4.5 text-emerald-500" />
          Audio Timeline & Playback
        </h3>
        <span className="text-5xs font-mono font-extrabold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 border border-slate-200 dark:border-slate-800 rounded">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Visual seekable timeline */}
      <div className="space-y-4">
        
        {/* Waveform Bars Container */}
        <div 
          onClick={handleSeekClick}
          className="h-20 flex items-center justify-between gap-1 px-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-150 dark:border-slate-800/80 overflow-hidden relative cursor-pointer group"
        >
          {waveformBars.map((height, idx) => {
            const barRatio = idx / waveformBars.length;
            const isPlayed = barRatio <= progressRatio;
            
            return (
              <div 
                key={idx}
                className="flex-1 rounded-full transition-all duration-300"
                style={{ 
                  height: `${height}%`,
                  backgroundColor: isPlayed ? '#10b981' : 'var(--color-slate-250, #cbd5e1)' 
                }}
              />
            );
          })}

          {/* Click seek visual line indicator */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-emerald-500/80 pointer-events-none transition-all duration-75"
            style={{ left: `${progressRatio * 100}%` }}
          />

          {/* Detections markers overlaid directly on waveform */}
          {detections.map((det, index) => {
            const sec = parseTimestampToSeconds(det.timestamp);
            const posRatio = duration > 0 ? sec / duration : 0;
            if (posRatio < 0 || posRatio > 1) return null;

            return (
              <div 
                key={index}
                className="absolute top-0 bottom-0 flex flex-col items-center group/marker"
                style={{ left: `${posRatio * 100}%` }}
              >
                {/* Visual marker line */}
                <div className="w-[1.5px] h-full bg-indigo-500/55 group-hover/marker:w-0.5 group-hover/marker:bg-indigo-500 transition-all" />
                
                {/* Small indicator dot on waveform floor */}
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 absolute bottom-1 shadow-xs" />
                
                {/* Floating details overlay on hover */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg p-2.5 shadow-lg border border-slate-800 text-[10px] hidden group-hover/marker:flex flex-col gap-0.5 z-40 whitespace-nowrap min-w-[120px] pointer-events-none">
                  <span className="font-extrabold block text-xs">{det.common_name}</span>
                  <span className="font-mono text-emerald-400 font-bold">Conf: {(det.confidence * 100).toFixed(0)}%</span>
                  <span className="font-mono text-slate-400 font-bold">Offset: {det.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Playback Controls (Native HTML5 Player consolidated inside card) */}
        {preview && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <audio 
              ref={audioRef}
              controls
              src={preview}
              onTimeUpdate={handleAudioTimeUpdate}
              onLoadedMetadata={handleAudioMetadataLoad}
              onEnded={handleAudioEnded}
              className="w-full accent-emerald-500 rounded-lg animate-fade-in"
            />
          </div>
        )}

      </div>

    </div>
  );
};
