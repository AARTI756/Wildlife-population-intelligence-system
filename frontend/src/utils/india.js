/**
 * india.js — Indian localization constants and utilities for WPIS
 *
 * All placeholder/sample content reflects Indian wildlife monitoring
 * environments. Actual user-entered data is never restricted by this file.
 */

// ─── Indian Monitoring Locations ────────────────────────────────────────────
export const INDIA_WILDLIFE_LOCATIONS = [
  { name: 'Jim Corbett National Park',        region: 'Ramnagar, Nainital, Uttarakhand',           lat: 29.5300, lon: 78.7747 },
  { name: 'Kaziranga National Park',          region: 'Bokakhat, Golaghat, Assam',                 lat: 26.5775, lon: 93.1711 },
  { name: 'Ranthambore National Park',        region: 'Sawai Madhopur, Rajasthan',                 lat: 26.0173, lon: 76.5026 },
  { name: 'Gir National Park',                region: 'Sasan Gir, Junagadh, Gujarat',              lat: 21.1240, lon: 70.8240 },
  { name: 'Tadoba-Andhari Tiger Reserve',     region: 'Chandrapur, Maharashtra',                   lat: 20.2148, lon: 79.3120 },
  { name: 'Bandipur National Park',           region: 'Chamarajanagar, Karnataka',                 lat: 11.6694, lon: 76.6340 },
  { name: 'Nagarhole National Park',          region: 'Kodagu & Mysuru, Karnataka',                lat: 12.0365, lon: 76.1317 },
  { name: 'Kanha National Park',              region: 'Mandla & Balaghat, Madhya Pradesh',         lat: 22.3300, lon: 80.6100 },
  { name: 'Pench Tiger Reserve',              region: 'Seoni & Chhindwara, Madhya Pradesh',        lat: 21.7500, lon: 79.3100 },
  { name: 'Sundarbans National Park',         region: 'South 24 Parganas, West Bengal',            lat: 21.9497, lon: 88.8812 },
  { name: 'Periyar Tiger Reserve',            region: 'Thekkady, Idukki, Kerala',                  lat:  9.4685, lon: 77.2380 },
  { name: 'Mudumalai Tiger Reserve',          region: 'Nilgiris, Tamil Nadu',                      lat: 11.5700, lon: 76.6100 },
  { name: 'Sariska Tiger Reserve',            region: 'Alwar, Rajasthan',                          lat: 27.3421, lon: 76.3703 },
  { name: 'Panna National Park',              region: 'Panna, Madhya Pradesh',                     lat: 24.7169, lon: 80.2004 },
];

// Default map center for India (geographic centre, roughly)
export const INDIA_MAP_CENTER = [22.5937, 82.9629];
export const INDIA_MAP_ZOOM = 5;

// ─── Example Placeholder Data for Forms ─────────────────────────────────────
export const PLACEHOLDER_SITE_NAME     = 'e.g. Tadoba Core Zone Camera Network';
export const PLACEHOLDER_SITE_LOCATION = 'e.g. Tadoba-Andhari Tiger Reserve, Chandrapur, Maharashtra';
export const PLACEHOLDER_LATITUDE      = 'e.g. 20.2148 (Tadoba)';
export const PLACEHOLDER_LONGITUDE     = 'e.g. 79.3120 (Tadoba)';

export const PLACEHOLDER_SURVEY_NAME   = 'e.g. Jim Corbett Tiger Corridor Survey – Jul 2026';
export const PLACEHOLDER_SURVEY_LOC    = 'e.g. Bijrani Zone, Jim Corbett National Park, Uttarakhand';
export const PLACEHOLDER_SURVEY_LAT    = 'e.g. 29.5300 (Jim Corbett)';
export const PLACEHOLDER_SURVEY_LON    = 'e.g. 78.7747 (Jim Corbett)';

export const PLACEHOLDER_CAMERA_NAME   = 'e.g. Tadoba North Block Cam-07';
export const PLACEHOLDER_AUDIO_NAME    = 'e.g. Kaziranga Grassland Acoustic Node-03';

// ─── Indian Wildlife Species ─────────────────────────────────────────────────
export const INDIAN_SPECIES = [
  'Bengal Tiger',
  'Indian Leopard',
  'Asian Elephant',
  'Sloth Bear',
  'Indian Gaur (Bison)',
  'Sambar Deer',
  'Chital (Spotted Deer)',
  'Nilgai (Blue Bull)',
  'Indian Peafowl',
  'Great Hornbill',
  'Dhole (Indian Wild Dog)',
  'Mugger Crocodile',
  'Indian Rhinoceros',
  'Blackbuck',
  'Asiatic Lion',
  'Indian Wolf',
  'Gharial',
  'King Cobra',
  'Indian Pangolin',
  'Himalayan Black Bear',
];

// ─── Indian Forest Administrative Terms ─────────────────────────────────────
export const INDIA_ADMIN_TERMS = {
  site: 'Forest Range / Wildlife Division',
  protectedArea: 'Tiger Reserve / National Park / Wildlife Sanctuary',
  monitoring: 'Forest Beat Monitoring',
  division: 'Forest Circle & Division',
};

// ─── IST Timezone Formatter ───────────────────────────────────────────────────
const IST_LOCALE  = 'en-IN';
const IST_TZ      = 'Asia/Kolkata';

/**
 * Format any date/timestamp as IST, e.g.:
 *   "07 Jul 2026, 02:45 PM IST"
 *
 * @param {string|Date|null|undefined} value
 * @param {boolean} [showTime=true]
 * @returns {string}
 */
export function formatIST(value, showTime = true) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '—';

  const dateStr = d.toLocaleDateString(IST_LOCALE, {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
    timeZone: IST_TZ,
  });

  if (!showTime) return dateStr;

  const timeStr = d.toLocaleTimeString(IST_LOCALE, {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: IST_TZ,
  }).toUpperCase();

  return `${dateStr}, ${timeStr} IST`;
}

/**
 * Short date only (no time): "07 Jul 2026"
 */
export function formatISTDate(value) {
  return formatIST(value, false);
}

/**
 * Current date-time in IST as a local datetime-local string (for form defaults)
 * Returns "YYYY-MM-DDTHH:MM" adjusted to IST.
 */
export function nowISTLocal() {
  const now  = new Date();
  const ist  = new Date(now.toLocaleString('en-US', { timeZone: IST_TZ }));
  const pad  = (n) => String(n).padStart(2, '0');
  return `${ist.getFullYear()}-${pad(ist.getMonth()+1)}-${pad(ist.getDate())}T${pad(ist.getHours())}:${pad(ist.getMinutes())}`;
}

export function formatLastUpdated(dateVal = new Date()) {
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${day} ${month} ${year} • ${hours}:${minutes} IST`;
}

export const getUserAvatar = (user, baseURL = 'http://localhost:8000') => {
  if (user?.picture) {
    return user.picture.startsWith('http') ? user.picture : `${baseURL}${user.picture}`;
  }
  
  const name = user?.username || user?.role || user?.role_name || 'User';
  
  // Calculate initials: e.g. "John Doe" -> "JD", "researcher" -> "RE"
  let initials = '';
  const parts = name.trim().split(/[\s_-]+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (name.length >= 2) {
    initials = name.substring(0, 2).toUpperCase();
  } else {
    initials = name.substring(0, 1).toUpperCase();
  }

  // Beautiful deterministic background colors based on name hash
  const colorPalettes = [
    { bg: '#10b981', text: '#ffffff' }, // Emerald
    { bg: '#06b6d4', text: '#ffffff' }, // Cyan
    { bg: '#6366f1', text: '#ffffff' }, // Indigo
    { bg: '#f59e0b', text: '#ffffff' }, // Amber
    { bg: '#ec4899', text: '#ffffff' }, // Pink
    { bg: '#8b5cf6', text: '#ffffff' }, // Purple
    { bg: '#ef4444', text: '#ffffff' }  // Red
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPalettes.length;
  const palette = colorPalettes[index];

  // Render SVG initials avatar with rounded corners matching the UI theme style
  const svg = `<svg xmlns="http://www.w3.org/2005/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="28" fill="${palette.bg}"/>
    <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="900" fill="${palette.text}" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  </svg>`;
  
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Mapping of raw names to Standard Common and Scientific Name
export const SPECIES_NORMALIZATION_MAP = {
  'asiatic lion': { common: 'Asiatic Lion', scientific: 'Panthera leo persica' },
  'panthera leo': { common: 'Asiatic Lion', scientific: 'Panthera leo persica' },
  'panthera leo persica': { common: 'Asiatic Lion', scientific: 'Panthera leo persica' },
  'lion': { common: 'Asiatic Lion', scientific: 'Panthera leo persica' },
  
  'bengal tiger': { common: 'Bengal Tiger', scientific: 'Panthera tigris tigris' },
  'tiger': { common: 'Bengal Tiger', scientific: 'Panthera tigris tigris' },
  'panthera tigris': { common: 'Bengal Tiger', scientific: 'Panthera tigris tigris' },
  
  'sloth bear': { common: 'Sloth Bear', scientific: 'Melursus ursinus' },
  'bear': { common: 'Sloth Bear', scientific: 'Melursus ursinus' },
  'ursidae': { common: 'Sloth Bear', scientific: 'Melursus ursinus' },
  'melursus ursinus': { common: 'Sloth Bear', scientific: 'Melursus ursinus' },
  
  'sambar deer': { common: 'Sambar Deer', scientific: 'Rusa unicolor' },
  'deer': { common: 'Sambar Deer', scientific: 'Rusa unicolor' },
  'cervidae': { common: 'Sambar Deer', scientific: 'Rusa unicolor' },
  'rusa unicolor': { common: 'Sambar Deer', scientific: 'Rusa unicolor' },
  
  'chital': { common: 'Spotted Deer (Chital)', scientific: 'Axis axis' },
  'spotted deer': { common: 'Spotted Deer (Chital)', scientific: 'Axis axis' },
  'chital (spotted deer)': { common: 'Spotted Deer (Chital)', scientific: 'Axis axis' },
  'axis axis': { common: 'Spotted Deer (Chital)', scientific: 'Axis axis' },

  'koel': { common: 'Asian Koel', scientific: 'Eudynamys scolopaceus' },
  'koel koel': { common: 'Asian Koel', scientific: 'Eudynamys scolopaceus' },
  'asian koel': { common: 'Asian Koel', scientific: 'Eudynamys scolopaceus' },
  'eudynamys scolopaceus': { common: 'Asian Koel', scientific: 'Eudynamys scolopaceus' },
  
  'indian leopard': { common: 'Indian Leopard', scientific: 'Panthera pardus fusca' },
  'leopard': { common: 'Indian Leopard', scientific: 'Panthera pardus fusca' },
  'panthera pardus': { common: 'Indian Leopard', scientific: 'Panthera pardus fusca' },
  
  'asian elephant': { common: 'Asian Elephant', scientific: 'Elephas maximus' },
  'elephant': { common: 'Asian Elephant', scientific: 'Elephas maximus' },
  'elephas maximus': { common: 'Asian Elephant', scientific: 'Elephas maximus' },
  
  'indian gaur': { common: 'Indian Gaur (Bison)', scientific: 'Bos gaurus' },
  'gaur': { common: 'Indian Gaur (Bison)', scientific: 'Bos gaurus' },
  'gaur (bison)': { common: 'Indian Gaur (Bison)', scientific: 'Bos gaurus' },
  'bos gaurus': { common: 'Indian Gaur (Bison)', scientific: 'Bos gaurus' },
  
  'dhole': { common: 'Dhole (Indian Wild Dog)', scientific: 'Cuon alpinus' },
  'dhole (indian wild dog)': { common: 'Dhole (Indian Wild Dog)', scientific: 'Cuon alpinus' },
  'cuon alpinus': { common: 'Dhole (Indian Wild Dog)', scientific: 'Cuon alpinus' },
  
  'indian rhinoceros': { common: 'Indian Rhinoceros', scientific: 'Rhinoceros unicornis' },
  'rhinoceros': { common: 'Indian Rhinoceros', scientific: 'Rhinoceros unicornis' },
  'rhinoceros unicornis': { common: 'Indian Rhinoceros', scientific: 'Rhinoceros unicornis' },
  
  'nilgai': { common: 'Nilgai (Blue Bull)', scientific: 'Boselaphus tragocamelus' },
  'nilgai (blue bull)': { common: 'Nilgai (Blue Bull)', scientific: 'Boselaphus tragocamelus' },
  'indian peafowl': { common: 'Indian Peafowl', scientific: 'Pavo cristatus' },
  'peafowl': { common: 'Indian Peafowl', scientific: 'Pavo cristatus' },
  'great hornbill': { common: 'Great Hornbill', scientific: 'Buceros bicornis' },
  'hornbill': { common: 'Great Hornbill', scientific: 'Buceros bicornis' },
  'mugger crocodile': { common: 'Mugger Crocodile', scientific: 'Crocodylus palustris' },
  'blackbuck': { common: 'Blackbuck', scientific: 'Antilope cervicapra' },
  'indian wolf': { common: 'Indian Wolf', scientific: 'Canis lupus pallipes' },
  'gharial': { common: 'Gharial', scientific: 'Gavialis gangeticus' },
  'king cobra': { common: 'King Cobra', scientific: 'Ophiophagus hannah' },
  'indian pangolin': { common: 'Indian Pangolin', scientific: 'Manis crassicaudata' },
  'himalayan black bear': { common: 'Himalayan Black Bear', scientific: 'Ursus thibetanus laniger' },
};

export function normalizeSpecies(name) {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  
  // Explicit mapping check (Indian species map)
  if (SPECIES_NORMALIZATION_MAP[key]) {
    return SPECIES_NORMALIZATION_MAP[key];
  }

  // Substring checks against the Indian species map
  for (const [k, v] of Object.entries(SPECIES_NORMALIZATION_MAP)) {
    if (key === k || (key.length > 3 && k.length > 3 && (key.includes(k) || k.includes(key)))) {
      return v;
    }
  }

  // Generic fallback checks for common Indian species substrings
  if (key.includes('tiger') && !key.includes('shark') && !key.includes('salamander')) return SPECIES_NORMALIZATION_MAP['tiger'];
  if (key.includes('sloth bear') || (key.includes('bear') && key.includes('indian'))) return SPECIES_NORMALIZATION_MAP['bear'];
  if (key.includes('sambar') || (key.includes('deer') && !key.includes('spotted') && !key.includes('axis') && !key.includes('barking') && !key.includes('reindeer'))) return SPECIES_NORMALIZATION_MAP['deer'];
  if ((key.includes('asiatic') && key.includes('lion')) || (key === 'lion' && key.includes('asiatic'))) return SPECIES_NORMALIZATION_MAP['lion'];
  if (key.includes('koel')) return SPECIES_NORMALIZATION_MAP['koel'];
  if (key.includes('leopard') && (key.includes('indian') || key.includes('panthera'))) return SPECIES_NORMALIZATION_MAP['leopard'];
  if (key.includes('elephant') && (key.includes('asian') || key.includes('indian'))) return SPECIES_NORMALIZATION_MAP['elephant'];
  
  // No match found — return null (caller should use original name)
  return null;
}

export function localizeSpeciesName(name) {
  if (!name) return 'Unknown Species';
  const norm = normalizeSpecies(name);
  // If recognized as an Indian species, use the standardized common name.
  // If not recognized (global/demo species), return the original name unchanged.
  return norm ? norm.common : name;
}

export function getScientificName(name) {
  const norm = normalizeSpecies(name);
  // Return the scientific name if recognized, or the original name for global species
  return norm ? norm.scientific : (name || 'Unknown');
}

export function isIndianWildlife(name) {
  if (!name) return false;
  const key = name.toLowerCase().trim();
  // Known global/demo benchmark species are explicitly NOT Indian wildlife
  const globalSpecies = [
    'zebra', 'aardvark', 'canada goose', 'raccoon', 'kangaroo', 'giraffe',
    'koala', 'polar bear', 'hamster', 'hedgehog', 'hippopotamus', 'hippo',
    'panda', 'red panda', 'penguin', 'ostrich', 'gorilla', 'chimpanzee'
  ];
  if (globalSpecies.some(g => key.includes(g))) return false;
  return normalizeSpecies(name) !== null;
}
