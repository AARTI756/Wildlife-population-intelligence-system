import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

const ImageQualityAssessment = ({ file, confidence, quality }) => {
  if (!file && !quality) return null;
  const resolution = quality?.resolution ? `${quality.resolution.width} × ${quality.resolution.height}` : (file?.width && file?.height ? `${file.width} × ${file.height}` : 'Unavailable');
  const metrics = [['Image Quality', quality?.image_quality || 'Unavailable'], ['Brightness', quality ? `${quality.brightness}` : 'Unavailable'], ['Contrast', quality ? `${quality.contrast}` : 'Unavailable'], ['Blur', quality?.blur || 'Unavailable'], ['Sharpness', quality ? `${quality.sharpness}` : 'Unavailable'], ['Occlusion', quality?.occlusion_estimate || 'Unavailable'], ['Exposure', quality?.exposure || 'Unavailable'], ['Resolution', resolution], ['Inference Confidence Impact', quality ? `${quality.inference_confidence_impact}%` : (confidence != null ? `${Math.round(confidence * 100)}%` : 'Unavailable')]];
  return <section className="glass-card p-5 space-y-3"><h3 className="flex items-center gap-2 text-xs font-bold"><ImageIcon className="h-4 w-4 text-emerald-600" />Image Quality Assessment</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">{metrics.map(([label, value]) => <div key={label}>{label}<strong className="block">{value}</strong></div>)}</div></section>;
};
export default ImageQualityAssessment;
