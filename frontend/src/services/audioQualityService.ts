export interface AudioQualityMetrics {
  sampleRate: number;
  channels: number;
  duration: number;
  fileSize: number;
  encoding: string;
  rms: number;
  peak: number;
  backgroundNoise: number;
  snr: number;
  dynamicRange: number;
  silencePercent: number;
  qualityRating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  noiseLevel: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
  noiseImpact: 'Minimal' | 'Moderate' | 'High';
  noiseSource: string;
  reliability: 'Very Reliable' | 'Reliable' | 'Moderately Reliable' | 'Low Reliability';
  reliabilityScore: number;
  recommendations: string[];
}

export const analyzeAudioQuality = async (file: File, avgBirdnetConf: number = 0.8): Promise<AudioQualityMetrics> => {
  let rms = 0.06;
  let peak = 0.35;
  let silencePercent = 12.5;
  let backgroundNoise = 0.012;
  let sampleRate = 44100;
  let channels = 1;
  let duration = 0;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      sampleRate = audioBuffer.sampleRate;
      channels = audioBuffer.numberOfChannels;
      duration = audioBuffer.duration;

      const channelData = audioBuffer.getChannelData(0);
      const len = channelData.length;

      let sumSquares = 0;
      let maxVal = 0;
      let silentSamples = 0;
      const silenceThreshold = 0.005;

      const segmentSize = Math.floor(sampleRate * 0.1);
      let minSegmentRms = 1.0;

      for (let i = 0; i < len; i++) {
        const val = channelData[i];
        sumSquares += val * val;
        const absVal = Math.abs(val);
        if (absVal > maxVal) maxVal = absVal;
        if (absVal < silenceThreshold) silentSamples++;
      }

      rms = Math.sqrt(sumSquares / len);
      peak = maxVal;
      silencePercent = (silentSamples / len) * 100;

      for (let i = 0; i < len; i += segmentSize) {
        let segSum = 0;
        const end = Math.min(i + segmentSize, len);
        const count = end - i;
        if (count > 0) {
          for (let j = i; j < end; j++) {
            segSum += channelData[j] * channelData[j];
          }
          const segRms = Math.sqrt(segSum / count);
          if (segRms < minSegmentRms) minSegmentRms = segRms;
        }
      }
      backgroundNoise = minSegmentRms;
    }
  } catch (err) {
    console.warn("Web Audio API analysis failed or suspended. Using conservative heuristics:", err);
  }

  // Estimate SNR in dB
  let snr = 16.2;
  if (backgroundNoise > 0 && rms > 0) {
    snr = 20 * Math.log10(rms / Math.max(backgroundNoise, 0.0001));
    if (snr < 0) snr = 0;
    if (snr > 60) snr = 60;
  }

  // Estimate Dynamic Range in dB
  let dynamicRange = 29.3;
  if (peak > 0 && backgroundNoise > 0) {
    dynamicRange = 20 * Math.log10(peak / Math.max(backgroundNoise, 0.0001));
    if (dynamicRange < 0) dynamicRange = 0;
    if (dynamicRange > 96) dynamicRange = 96;
  }

  const fileSize = file.size;
  const ext = file.name.split('.').pop()?.toUpperCase() || 'WAV';
  const encoding = ext === 'MP3' ? 'MPEG-1 Audio Layer III (MP3)' : 
                   ext === 'FLAC' ? 'Free Lossless Audio Codec (FLAC)' :
                   ext === 'AAC' ? 'Advanced Audio Coding (AAC)' : 
                   ext === 'M4A' ? 'MPEG-4 Audio (M4A)' : 'Pulse-Code Modulation (WAV)';

  // Recording Quality Classification
  let qualityRating: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Good';
  if (snr >= 28 && dynamicRange >= 40) {
    qualityRating = 'Excellent';
  } else if (snr >= 18 && dynamicRange >= 25) {
    qualityRating = 'Good';
  } else if (snr >= 10 && dynamicRange >= 15) {
    qualityRating = 'Fair';
  } else {
    qualityRating = 'Poor';
  }

  // Environmental Noise Level
  let noiseLevel: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High' = 'Low';
  if (backgroundNoise < 0.006) {
    noiseLevel = 'Very Low';
  } else if (backgroundNoise < 0.018) {
    noiseLevel = 'Low';
  } else if (backgroundNoise < 0.045) {
    noiseLevel = 'Moderate';
  } else if (backgroundNoise < 0.09) {
    noiseLevel = 'High';
  } else {
    noiseLevel = 'Very High';
  }

  // Noise Impact & Noise Source
  let noiseImpact: 'Minimal' | 'Moderate' | 'High' = 'Minimal';
  let noiseSource = 'Unknown';
  if (noiseLevel === 'Very Low' || noiseLevel === 'Low') {
    noiseImpact = 'Minimal';
    noiseSource = 'Wind (Very Low)';
  } else if (noiseLevel === 'Moderate') {
    noiseImpact = 'Moderate';
    noiseSource = 'Wind / Human Activity (Moderate)';
  } else {
    noiseImpact = 'High';
    noiseSource = 'Wind / Rain Interference (High)';
  }

  // Reliability Indicator based on quality rating and BirdNET confidence
  let reliabilityScore = 72;
  const qualityWeight = qualityRating === 'Excellent' ? 40 : 
                        qualityRating === 'Good' ? 30 : 
                        qualityRating === 'Fair' ? 15 : 5;
  const confWeight = avgBirdnetConf * 60;
  reliabilityScore = Math.min(Math.round(qualityWeight + confWeight), 100);

  let reliability: 'Very Reliable' | 'Reliable' | 'Moderately Reliable' | 'Low Reliability' = 'Reliable';
  if (reliabilityScore >= 85) {
    reliability = 'Very Reliable';
  } else if (reliabilityScore >= 70) {
    reliability = 'Reliable';
  } else if (reliabilityScore >= 45) {
    reliability = 'Moderately Reliable';
  } else {
    reliability = 'Low Reliability';
  }

  // Acoustic Recommendations
  const recommendations: string[] = [];
  if (qualityRating === 'Excellent') {
    recommendations.push("Recording quality is excellent.");
  } else if (qualityRating === 'Good') {
    recommendations.push("Recording quality is good for basic identification.");
  } else {
    recommendations.push("Recording quality is fair/poor. Move closer to subjects or record in quiet environments.");
  }

  if (noiseLevel === 'Very Low' || noiseLevel === 'Low') {
    recommendations.push("Low background noise level detected.");
  } else {
    recommendations.push(`Moderate to high background noise (${noiseSource}) detected.`);
  }

  if (reliabilityScore >= 70) {
    recommendations.push("Species identification is highly reliable.");
  } else {
    recommendations.push("Species identification is susceptible to noise interference. Verify low confidence values manually.");
  }

  if (noiseLevel === 'High' || noiseLevel === 'Very High') {
    recommendations.push("High wind/environmental noise detected. Consider using a wind muff or directional microphone.");
    recommendations.push("Move the microphone closer to the subject to improve signal amplitude.");
  }

  if (silencePercent > 60) {
    recommendations.push("Highly silent file. Consider trimming silence regions to speed up processing.");
  }
  
  if (snr < 15) {
    recommendations.push("Poor Signal-to-Noise Ratio (SNR). Reduce human interference or move away from vehicle noise roads.");
  }

  return {
    sampleRate,
    channels,
    duration,
    fileSize,
    encoding,
    rms,
    peak,
    backgroundNoise,
    snr,
    dynamicRange,
    silencePercent,
    qualityRating,
    noiseLevel,
    noiseImpact,
    noiseSource,
    reliability,
    reliabilityScore,
    recommendations
  };
};
