import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import TimelineImageThumbnail from '../../components/common/TimelineImageThumbnail';
import BehaviourAnalysisPanel from '../../components/common/BehaviourAnalysisPanel';
import SpeciesIntelligencePanel from '../../components/common/SpeciesIntelligencePanel';
import { 
  RecordingQualityCard, 
  EnvironmentalNoiseCard, 
  NoiseMetricsCard, 
  ReliabilityIndicator, 
  AcousticRecommendations, 
  AudioMetadataCard, 
  WaveformDetectionOverlay 
} from '../../components/common/AcousticQualityAssessment';
import { analyzeAudioQuality } from '../../services/audioQualityService';
import { getSpeciesKnowledge } from '../../services/speciesKnowledgeService';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  Upload, 
  Sparkles, 
  AlertCircle, 
  AlertTriangle,
  Volume2, 
  ClipboardList, 
  MapPin, 
  Loader2, 
  CheckCircle,
  Clock,
  User,
  Cpu,
  X,
  Check,
  Play,
  Pause,
  Square,
  FileText,
  Download,
  Activity,
  Info,
  ChevronDown,
  ChevronUp,
  Plus
} from 'lucide-react';

const formatSecsToMinSec = (secs) => {
  const mins = Math.floor(secs / 60);
  const remainingSecs = Math.floor(secs % 60);
  return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
};
const detectionName = (det) => {
  const rawName = det?.species || det?.raw_prediction || det?.common_name || 'Unidentified species';
  return rawName === 'Unknown Species' ? 'Species Requires Verification' : rawName;
};

// Skeletons loader for analysis results
const AudioAnalysisSkeletonLoader = () => {
  return (
    <div className="space-y-6 animate-pulse w-full">
      <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
      <div className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
    </div>
  );
};

const localEnrichment = {
  "giraffe": {
    scientific_name: "Giraffa camelopardalis",
    kingdom: "Animalia",
    phylum: "Chordata",
    class: "Mammalia",
    order: "Artiodactyla",
    family: "Giraffidae",
    genus: "Giraffa",
    iucn_status: "Vulnerable",
    habitat: "Savanna, Grassland, Woodland",
    diet: "Herbivore (Leaves, Shoots, Fruits)",
    distribution: "Sub-Saharan Africa",
    description: "The Giraffe is the tallest living terrestrial animal and the largest ruminant. It is characterized by its long neck and legs, horn-like ossicones, and distinctive coat patterns."
  },
  "snake": {
    scientific_name: "Serpentes",
    kingdom: "Animalia",
    phylum: "Chordata",
    class: "Reptilia",
    order: "Squamata",
    family: "Colubridae / Boidae",
    genus: "N/A",
    iucn_status: "Least Concern",
    habitat: "Forests, Grasslands, Deserts, Swamps",
    diet: "Carnivore (Rodents, Insects, Eggs)",
    distribution: "Worldwide",
    description: "Snakes are elongated, legless, carnivorous reptiles of the suborder Serpentes. They are ectothermic and covered in overlapping scales."
  },
  "bear": {
    scientific_name: "Ursidae",
    kingdom: "Animalia",
    phylum: "Chordata",
    class: "Mammalia",
    order: "Carnivora",
    family: "Ursidae",
    genus: "Ursus",
    iucn_status: "Vulnerable",
    habitat: "Forests, Tundra, Mountains",
    diet: "Omnivore (Berries, Fish, Small Mammals)",
    distribution: "Northern Hemisphere",
    description: "Bears are carnivoran mammals of the family Ursidae. They are classified as caniforms, or doglike carnivorans, with widespread habitats."
  },
  "brown bear": {
    scientific_name: "Ursus arctos",
    kingdom: "Animalia",
    phylum: "Chordata",
    class: "Mammalia",
    order: "Carnivora",
    family: "Ursidae",
    genus: "Ursus",
    iucn_status: "Least Concern",
    habitat: "Forests, Mountains, Tundra",
    diet: "Omnivore (Salmon, Berries, Roots)",
    distribution: "Eurasia and North America",
    description: "The Brown Bear is a large bear species distributed across much of northern Eurasia and North America."
  },
  "polar bear": {
    scientific_name: "Ursus maritimus",
    kingdom: "Animalia",
    phylum: "Chordata",
    class: "Mammalia",
    order: "Carnivora",
    family: "Ursidae",
    genus: "Ursus",
    iucn_status: "Vulnerable",
    habitat: "Arctic Sea Ice, Coastal Regions",
    diet: "Carnivore (Seals, Fish)",
    distribution: "Arctic Circle",
    description: "The Polar Bear is a hypercarnivorous bear whose native range lies largely within the Arctic Circle."
  },
  "deer": {
    scientific_name: "Cervidae",
    kingdom: "Animalia",
    phylum: "Chordata",
    class: "Mammalia",
    order: "Artiodactyla",
    family: "Cervidae",
    genus: "Odocoileus",
    iucn_status: "Least Concern",
    habitat: "Forests, Woodlands, Grasslands",
    diet: "Herbivore (Leaves, Bark, Grass)",
    distribution: "Worldwide",
    description: "Deer are hoofed ruminant mammals forming the family Cervidae. They are known for their spectacular antlers."
  },
  "woodpecker": {
    scientific_name: "Picidae",
    kingdom: "Animalia",
    phylum: "Chordata",
    class: "Aves",
    order: "Piciformes",
    family: "Picidae",
    genus: "Picus",
    iucn_status: "Least Concern",
    habitat: "Forests, Woodlands",
    diet: "Insectivore (Insects, Grubs)",
    distribution: "Worldwide",
    description: "Woodpeckers are members of the family Picidae. They are known for tapping on tree trunks to find food."
  },
  "leopard": {
    scientific_name: "Panthera pardus",
    kingdom: "Animalia",
    phylum: "Chordata",
    class: "Mammalia",
    order: "Carnivora",
    family: "Felidae",
    genus: "Panthera",
    iucn_status: "Vulnerable",
    habitat: "Forests, Savannas, Grasslands",
    diet: "Carnivore (Antelopes, Rodents)",
    distribution: "Africa and Asia",
    description: "The leopard is one of the five extant species in the genus Panthera. It is distinguished by its rosette patterns."
  },
  "indian leopard": {
    scientific_name: "Panthera pardus fusca",
    kingdom: "Animalia",
    phylum: "Chordata",
    class: "Mammalia",
    order: "Carnivora",
    family: "Felidae",
    genus: "Panthera",
    iucn_status: "Vulnerable",
    habitat: "Tropical Rainforests, Deciduous Forests",
    diet: "Carnivore (Chital, Sambar, Langurs)",
    distribution: "Indian Subcontinent",
    description: "The Indian leopard is a leopard subspecies native to the Indian subcontinent. It is listed as Vulnerable on the IUCN Red List."
  },
  "lion": {
    scientific_name: "Panthera leo",
    kingdom: "Animalia",
    phylum: "Chordata",
    class: "Mammalia",
    order: "Carnivora",
    family: "Felidae",
    genus: "Panthera",
    iucn_status: "Vulnerable",
    habitat: "Grasslands, Savannas, Shrublands",
    diet: "Carnivore (Ungulates, Zebras, Wildebeests)",
    distribution: "Sub-Saharan Africa and Gir Forest",
    description: "The lion is a large cat of the genus Panthera native to Africa and India. It has a muscular, deep-chested body."
  },
  "tiger": {
    scientific_name: "Panthera tigris",
    kingdom: "Animalia",
    phylum: "Chordata",
    class: "Mammalia",
    order: "Carnivora",
    family: "Felidae",
    genus: "Panthera",
    iucn_status: "Endangered",
    habitat: "Tropical Forests, Mangroves, Grasslands",
    diet: "Carnivore (Deer, Wild Boar, Gaur)",
    distribution: "Asia",
    description: "The tiger is the largest living cat species and a member of the genus Panthera. It is most recognizable for its dark vertical stripes."
  },
  "elephant": {
    scientific_name: "Elephas maximus",
    kingdom: "Animalia",
    phylum: "Chordata",
    class: "Mammalia",
    order: "Proboscidea",
    family: "Elephantidae",
    genus: "Elephas",
    iucn_status: "Endangered",
    habitat: "Forests, Grasslands, Scrublands",
    diet: "Herbivore (Grasses, Bark, Leaves)",
    distribution: "South and Southeast Asia",
    description: "The Asian elephant is the largest living land animal in Asia. It is widely distributed across forests and scrublands."
  },
  "rhinoceros": {
    scientific_name: "Rhinocerotidae",
    kingdom: "Animalia",
    phylum: "Chordata",
    class: "Mammalia",
    order: "Perissodactyla",
    family: "Rhinocerotidae",
    genus: "Rhinoceros",
    iucn_status: "Vulnerable",
    habitat: "Grasslands, Savannas, Swamps",
    diet: "Herbivore (Grass, Leaves, Twigs)",
    distribution: "Africa and Asia",
    description: "A rhinoceros is a member of any of the five extant species of odd-toed ungulates in the family Rhinocerotidae."
  },
  "rhino": {
    scientific_name: "Rhinocerotidae",
    kingdom: "Animalia",
    phylum: "Chordata",
    class: "Mammalia",
    order: "Perissodactyla",
    family: "Rhinocerotidae",
    genus: "Rhinoceros",
    iucn_status: "Vulnerable",
    habitat: "Grasslands, Savannas, Swamps",
    diet: "Herbivore (Grass, Leaves, Twigs)",
    distribution: "Africa and Asia",
    description: "A rhinoceros is a member of any of the five extant species of odd-toed ungulates in the family Rhinocerotidae."
  },
  "horse": {
    scientific_name: "Equus caballus",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Perissodactyla", family: "Equidae", genus: "Equus",
    iucn_status: "Domesticated",
    habitat: "Grasslands, Farmlands, Steppes",
    diet: "Herbivore (Grass, Hay, Grain)",
    distribution: "Worldwide",
    description: "The horse is a domesticated one-toed hoofed mammal belonging to the family Equidae."
  },
  "cow": {
    scientific_name: "Bos taurus",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Artiodactyla", family: "Bovidae", genus: "Bos",
    iucn_status: "Domesticated",
    habitat: "Farmlands, Grasslands",
    diet: "Herbivore (Grass, Hay, Silage)",
    distribution: "Worldwide",
    description: "Cattle are large domesticated cloven-hooved herbivores, a prominent modern member of the subfamily Bovinae."
  },
  "sheep": {
    scientific_name: "Ovis aries",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Artiodactyla", family: "Bovidae", genus: "Ovis",
    iucn_status: "Domesticated",
    habitat: "Grasslands, Mountains, Farmlands",
    diet: "Herbivore (Grass, Clover, Forbs)",
    distribution: "Worldwide",
    description: "Sheep are quadrupedal, ruminant mammals typically kept as livestock."
  },
  "cat": {
    scientific_name: "Felis catus",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Carnivora", family: "Felidae", genus: "Felis",
    iucn_status: "Domesticated",
    habitat: "Urban, Suburban, Rural",
    diet: "Carnivore (Small Mammals, Birds, Fish)",
    distribution: "Worldwide",
    description: "The domestic cat is a small, typically furry, carnivorous mammal widely kept as a pet."
  },
  "dog": {
    scientific_name: "Canis lupus familiaris",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Carnivora", family: "Canidae", genus: "Canis",
    iucn_status: "Domesticated",
    habitat: "Urban, Suburban, Rural",
    diet: "Omnivore (Meat, Grains, Vegetables)",
    distribution: "Worldwide",
    description: "The domestic dog is a domesticated descendant of the wolf, and the most widely abundant terrestrial carnivore."
  },
  "zebra": {
    scientific_name: "Equus quagga",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Perissodactyla", family: "Equidae", genus: "Equus",
    iucn_status: "Near Threatened",
    habitat: "Savannas, Grasslands, Woodlands",
    diet: "Herbivore (Grass, Shrubs, Bark)",
    distribution: "Eastern and Southern Africa",
    description: "Zebras are African equines with distinctive black-and-white striped coats."
  },
  "wolf": {
    scientific_name: "Canis lupus",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Carnivora", family: "Canidae", genus: "Canis",
    iucn_status: "Least Concern",
    habitat: "Forests, Tundra, Grasslands, Deserts",
    diet: "Carnivore (Deer, Elk, Moose)",
    distribution: "Northern Hemisphere",
    description: "The wolf is the largest extant member of the family Canidae, known for living and hunting in packs."
  },
  "fox": {
    scientific_name: "Vulpes vulpes",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Carnivora", family: "Canidae", genus: "Vulpes",
    iucn_status: "Least Concern",
    habitat: "Forests, Grasslands, Mountains, Urban",
    diet: "Omnivore (Rodents, Fruits, Insects)",
    distribution: "Northern Hemisphere",
    description: "The red fox is the largest of the true foxes and one of the most widely distributed members of the order Carnivora."
  },
  "rabbit": {
    scientific_name: "Oryctolagus cuniculus",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Lagomorpha", family: "Leporidae", genus: "Oryctolagus",
    iucn_status: "Near Threatened",
    habitat: "Meadows, Woodlands, Grasslands",
    diet: "Herbivore (Grass, Clover, Vegetables)",
    distribution: "Europe, introduced Worldwide",
    description: "The European rabbit is a species of rabbit native to the Iberian Peninsula, now found worldwide."
  },
  "monkey": {
    scientific_name: "Cercopithecidae",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Primates", family: "Cercopithecidae", genus: "Various",
    iucn_status: "Varies",
    habitat: "Tropical Forests, Savannas, Mountains",
    diet: "Omnivore (Fruits, Seeds, Insects)",
    distribution: "Africa, Asia, Central and South America",
    description: "Monkeys are non-hominoid simians, generally possessing tails."
  },
  "crocodile": {
    scientific_name: "Crocodylidae",
    kingdom: "Animalia", phylum: "Chordata", class: "Reptilia",
    order: "Crocodilia", family: "Crocodylidae", genus: "Crocodylus",
    iucn_status: "Vulnerable",
    habitat: "Rivers, Lakes, Wetlands, Estuaries",
    diet: "Carnivore (Fish, Mammals, Birds)",
    distribution: "Tropical regions Worldwide",
    description: "Crocodiles are large semiaquatic reptiles that live throughout the tropics."
  },
  "hippopotamus": {
    scientific_name: "Hippopotamus amphibius",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Artiodactyla", family: "Hippopotamidae", genus: "Hippopotamus",
    iucn_status: "Vulnerable",
    habitat: "Rivers, Lakes, Wetlands",
    diet: "Herbivore (Grasses)",
    distribution: "Sub-Saharan Africa",
    description: "The hippopotamus is a large, mostly herbivorous, semiaquatic mammal native to sub-Saharan Africa."
  },
  "hippo": {
    scientific_name: "Hippopotamus amphibius",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Artiodactyla", family: "Hippopotamidae", genus: "Hippopotamus",
    iucn_status: "Vulnerable",
    habitat: "Rivers, Lakes, Wetlands",
    diet: "Herbivore (Grasses)",
    distribution: "Sub-Saharan Africa",
    description: "The hippopotamus is a large, mostly herbivorous, semiaquatic mammal native to sub-Saharan Africa."
  },
  "cheetah": {
    scientific_name: "Acinonyx jubatus",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Carnivora", family: "Felidae", genus: "Acinonyx",
    iucn_status: "Vulnerable",
    habitat: "Savannas, Grasslands, Arid Regions",
    diet: "Carnivore (Gazelles, Impalas, Hares)",
    distribution: "Africa and Central Iran",
    description: "The cheetah is the fastest land animal, capable of running at speeds up to 112 km/h."
  },
  "gorilla": {
    scientific_name: "Gorilla gorilla",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Primates", family: "Hominidae", genus: "Gorilla",
    iucn_status: "Critically Endangered",
    habitat: "Tropical and Subtropical Forests",
    diet: "Herbivore (Leaves, Stems, Fruit)",
    distribution: "Central Africa",
    description: "Gorillas are the largest living primates, predominantly herbivorous apes that inhabit tropical forests of equatorial Africa."
  },
  "eagle": {
    scientific_name: "Aquila chrysaetos",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Accipitriformes", family: "Accipitridae", genus: "Aquila",
    iucn_status: "Least Concern",
    habitat: "Mountains, Forests, Open Plains",
    diet: "Carnivore (Rabbits, Marmots, Fish)",
    distribution: "Northern Hemisphere",
    description: "Eagles are large birds of prey known for their powerful build and keen eyesight."
  },
  "parrot": {
    scientific_name: "Psittaciformes",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Psittaciformes", family: "Psittacidae", genus: "Various",
    iucn_status: "Varies",
    habitat: "Tropical and Subtropical Forests",
    diet: "Omnivore (Seeds, Fruits, Nectar, Insects)",
    distribution: "Tropical and Subtropical regions",
    description: "Parrots are birds known for their colourful plumage, strong curved bill, and intelligence."
  },
  "penguin": {
    scientific_name: "Spheniscidae",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Sphenisciformes", family: "Spheniscidae", genus: "Various",
    iucn_status: "Varies",
    habitat: "Coastal and Marine",
    diet: "Carnivore (Fish, Krill, Squid)",
    distribution: "Southern Hemisphere",
    description: "Penguins are aquatic flightless birds highly adapted for life in the water."
  },
  "owl": {
    scientific_name: "Strigiformes",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Strigiformes", family: "Strigidae", genus: "Various",
    iucn_status: "Least Concern",
    habitat: "Forests, Deserts, Tundra",
    diet: "Carnivore (Rodents, Insects, Small Birds)",
    distribution: "Worldwide",
    description: "Owls are birds known for their nocturnal habits, binocular vision, and near-silent flight."
  },
  "hawk": {
    scientific_name: "Accipitridae",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Accipitriformes", family: "Accipitridae", genus: "Various",
    iucn_status: "Least Concern",
    habitat: "Forests, Grasslands, Mountains, Urban",
    diet: "Carnivore (Small Mammals, Birds, Reptiles)",
    distribution: "Worldwide",
    description: "Hawks are medium-sized diurnal birds of prey widely distributed throughout the world."
  },
  "pigeon": {
    scientific_name: "Columba livia",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Columbiformes", family: "Columbidae", genus: "Columba",
    iucn_status: "Least Concern",
    habitat: "Urban, Rocky Cliffs, Farmlands",
    diet: "Granivore (Seeds, Grains, Fruits)",
    distribution: "Worldwide",
    description: "The rock dove or common pigeon is a widely distributed member of the bird family Columbidae."
  },
  "rock pigeon": {
    scientific_name: "Columba livia",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Columbiformes", family: "Columbidae", genus: "Columba",
    iucn_status: "Least Concern",
    habitat: "Urban, Rocky Cliffs, Farmlands",
    diet: "Granivore (Seeds, Grains, Fruits)",
    distribution: "Worldwide",
    description: "The rock dove or common pigeon is a widely distributed member of the bird family Columbidae."
  },
  "sparrow": {
    scientific_name: "Passer domesticus",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Passeriformes", family: "Passeridae", genus: "Passer",
    iucn_status: "Least Concern",
    habitat: "Urban, Suburban, Farmlands",
    diet: "Granivore (Seeds, Insects)",
    distribution: "Worldwide",
    description: "The house sparrow is a small passerine bird found in most parts of the world, closely associated with human habitation."
  },
  "house sparrow": {
    scientific_name: "Passer domesticus",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Passeriformes", family: "Passeridae", genus: "Passer",
    iucn_status: "Least Concern",
    habitat: "Urban, Suburban, Farmlands",
    diet: "Granivore (Seeds, Insects)",
    distribution: "Worldwide",
    description: "The house sparrow is a small passerine bird found in most parts of the world, closely associated with human habitation."
  },
  "robin": {
    scientific_name: "Erithacus rubecula",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Passeriformes", family: "Muscicapidae", genus: "Erithacus",
    iucn_status: "Least Concern",
    habitat: "Woodlands, Gardens, Parks",
    diet: "Insectivore (Insects, Worms, Berries)",
    distribution: "Europe, Western Asia, North Africa",
    description: "The European robin is a small insectivorous passerine bird known for its distinctive red breast."
  },
  "crow": {
    scientific_name: "Corvus corone",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Passeriformes", family: "Corvidae", genus: "Corvus",
    iucn_status: "Least Concern",
    habitat: "Forests, Farmlands, Urban",
    diet: "Omnivore (Insects, Seeds, Carrion)",
    distribution: "Europe and Asia",
    description: "Crows are highly intelligent passerine birds of the genus Corvus known for their problem-solving abilities."
  },
  "indian cuckoo": {
    scientific_name: "Cuculus micropterus",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Cuculiformes", family: "Cuculidae", genus: "Cuculus",
    iucn_status: "Least Concern",
    habitat: "Forests, Woodlands",
    diet: "Insectivore (Caterpillars, Insects)",
    distribution: "South and Southeast Asia",
    description: "The Indian cuckoo is a member of the cuckoo family Cuculidae, known for its distinctive four-note call."
  },
  "common cuckoo": {
    scientific_name: "Cuculus canorus",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Cuculiformes", family: "Cuculidae", genus: "Cuculus",
    iucn_status: "Least Concern",
    habitat: "Woodlands, Marshes, Open Country",
    diet: "Insectivore (Caterpillars, Insects)",
    distribution: "Europe, Asia, Africa",
    description: "The common cuckoo is a member of the cuckoo order known for its brood parasitism behaviour."
  },
  "kingfisher": {
    scientific_name: "Alcedines",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Coraciiformes", family: "Alcedinidae", genus: "Various",
    iucn_status: "Least Concern",
    habitat: "Rivers, Lakes, Coastal Areas",
    diet: "Carnivore (Fish, Crustaceans, Insects)",
    distribution: "Worldwide",
    description: "Kingfishers are a group of small to medium-sized, brightly coloured birds known for diving to catch fish."
  },
  "flamingo": {
    scientific_name: "Phoenicopteridae",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Phoenicopteriformes", family: "Phoenicopteridae", genus: "Phoenicopterus",
    iucn_status: "Least Concern",
    habitat: "Alkaline Lakes, Lagoons, Estuaries",
    diet: "Omnivore (Algae, Crustaceans, Molluscs)",
    distribution: "Americas, Africa, Asia, Europe",
    description: "Flamingos are wading birds known for their vibrant pink plumage and distinctive downward-bending bills."
  },
  "heron": {
    scientific_name: "Ardeidae",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Pelecaniformes", family: "Ardeidae", genus: "Ardea",
    iucn_status: "Least Concern",
    habitat: "Wetlands, Rivers, Lakes, Coasts",
    diet: "Carnivore (Fish, Frogs, Insects)",
    distribution: "Worldwide",
    description: "Herons are long-legged freshwater and coastal birds in the family Ardeidae known for their patient hunting style."
  },
  "red-tailed hawk": {
    scientific_name: "Buteo jamaicensis",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Accipitriformes", family: "Accipitridae", genus: "Buteo",
    iucn_status: "Least Concern",
    habitat: "Open Country, Deserts, Forests",
    diet: "Carnivore (Rodents, Rabbits, Reptiles)",
    distribution: "North America",
    description: "The red-tailed hawk is the most common hawk in North America, known for its characteristic reddish-brown tail."
  },
  "red junglefowl": {
    scientific_name: "Gallus gallus",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Galliformes", family: "Phasianidae", genus: "Gallus",
    iucn_status: "Least Concern",
    habitat: "Tropical and Subtropical Forests",
    diet: "Omnivore (Seeds, Insects, Fruits)",
    distribution: "South and Southeast Asia",
    description: "The red junglefowl is a tropical bird in the family Phasianidae and is the primary ancestor of the domestic chicken."
  },
  "pacific chorus frog": {
    scientific_name: "Pseudacris regilla",
    kingdom: "Animalia", phylum: "Chordata", class: "Amphibia",
    order: "Anura", family: "Hylidae", genus: "Pseudacris",
    iucn_status: "Least Concern",
    habitat: "Wetlands, Forests, Grasslands",
    diet: "Insectivore (Insects, Spiders)",
    distribution: "Western North America",
    description: "The Pacific chorus frog is a small tree frog found in western North America, known for its distinctive ribbit call."
  },
  "common myna": {
    scientific_name: "Acridotheres tristis",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Passeriformes", family: "Sturnidae", genus: "Acridotheres",
    iucn_status: "Least Concern",
    habitat: "Urban, Suburban, Open Woodlands",
    diet: "Omnivore (Insects, Fruits, Grains)",
    distribution: "South and Southeast Asia, introduced Worldwide",
    description: "The common myna is an omnivorous open-woodland bird with a strong territorial instinct."
  },
  "indian peafowl": {
    scientific_name: "Pavo cristatus",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Galliformes", family: "Phasianidae", genus: "Pavo",
    iucn_status: "Least Concern",
    habitat: "Forests, Farmlands, Urban Parks",
    diet: "Omnivore (Seeds, Insects, Fruits, Reptiles)",
    distribution: "Indian Subcontinent",
    description: "The Indian peafowl, also known as the peacock, is a large bird native to South Asia renowned for its iridescent tail display."
  }
};

const enrichSpeciesDetails = (det) => {
  const sName = det.scientific_name || "";
  const cName = det.species || det.raw_prediction || "";
  
  const enrichedProfile = { ...(det.species_profile || {}) };
  
  // Check curated database first
  const knowledge = getSpeciesKnowledge(sName) || getSpeciesKnowledge(cName);
  
  if (knowledge) {
    det.profile_available = true; // Force true so SpeciesIntelligencePanel renders
    enrichedProfile.scientific_name = knowledge.scientific_name;
    enrichedProfile.kingdom = knowledge.taxonomy.kingdom;
    enrichedProfile.phylum = knowledge.taxonomy.phylum;
    enrichedProfile.class_name = knowledge.taxonomy.class;
    enrichedProfile.order = knowledge.taxonomy.order;
    enrichedProfile.family = knowledge.taxonomy.family;
    enrichedProfile.genus = knowledge.taxonomy.genus;
    enrichedProfile.iucn_status = knowledge.iucn_status;
    enrichedProfile.habitat = knowledge.habitat;
    enrichedProfile.diet = knowledge.diet;
    enrichedProfile.distribution = Array.isArray(knowledge.distribution) ? knowledge.distribution.join(", ") : knowledge.distribution;
    enrichedProfile.description = knowledge.description;
    
    // Extended fields
    enrichedProfile.threat_level = knowledge.threat_level;
    enrichedProfile.conservation_priority = knowledge.conservation_priority;
    enrichedProfile.protection_recommendations = knowledge.protection_recommendations;
    enrichedProfile.habitat_suitability = knowledge.habitat_suitability;
    enrichedProfile.human_wildlife_conflict = knowledge.human_wildlife_conflict;
    enrichedProfile.anti_poaching_recommendations = knowledge.anti_poaching_recommendations;
  } else {
    // Fallback to localEnrichment dictionary
    const nameKey = cName.toLowerCase().trim();
    const matched = localEnrichment[nameKey] || Object.values(localEnrichment).find(v => nameKey.includes(v.scientific_name.toLowerCase()));
    
    if (matched) {
      if (!enrichedProfile.scientific_name || enrichedProfile.scientific_name === "Not Available") {
        enrichedProfile.scientific_name = matched.scientific_name;
      }
      if (!enrichedProfile.kingdom || enrichedProfile.kingdom === "Not Available") {
        enrichedProfile.kingdom = matched.kingdom;
      }
      if (!enrichedProfile.phylum || enrichedProfile.phylum === "Not Available") {
        enrichedProfile.phylum = matched.phylum;
      }
      if (!enrichedProfile.class_name || enrichedProfile.class_name === "Not Available" || enrichedProfile.class === "Not Available") {
        enrichedProfile.class_name = matched.class;
      }
      if (!enrichedProfile.order || enrichedProfile.order === "Not Available") {
        enrichedProfile.order = matched.order;
      }
      if (!enrichedProfile.family || enrichedProfile.family === "Not Available") {
        enrichedProfile.family = matched.family;
      }
      if (!enrichedProfile.genus || enrichedProfile.genus === "Not Available") {
        enrichedProfile.genus = matched.genus;
      }
      if (!enrichedProfile.iucn_status || enrichedProfile.iucn_status === "Not Available") {
        enrichedProfile.iucn_status = matched.iucn_status;
      }
      if (!enrichedProfile.habitat || enrichedProfile.habitat === "Not Available") {
        enrichedProfile.habitat = matched.habitat;
      }
      if (!enrichedProfile.diet || enrichedProfile.diet === "Not Available") {
        enrichedProfile.diet = matched.diet;
      }
      if (!enrichedProfile.distribution || enrichedProfile.distribution === "Not Available") {
        enrichedProfile.distribution = matched.distribution;
      }
      if (!enrichedProfile.description || enrichedProfile.description.includes("profile not yet available")) {
        enrichedProfile.description = matched.description;
      }
    }
  }

  // Clean up "Not Available" or placeholders to be empty/Data unavailable
  Object.keys(enrichedProfile).forEach(key => {
    if (typeof enrichedProfile[key] === 'string' && (enrichedProfile[key].toLowerCase().includes("not available") || enrichedProfile[key].toLowerCase().includes("unavailable"))) {
      enrichedProfile[key] = "Data unavailable";
    }
  });

  return enrichedProfile;
};

const WildlifeAudioUpload = () => {
  const { user } = useAuth();
  const audioRef = useRef(null);

  // Metadata lists
  const [surveys, setSurveys] = useState([]);
  const [sites, setSites] = useState([]);
  const [audioSensors, setAudioSensors] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [error, setError] = useState('');

  // Selected values
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedAudioSensorId, setSelectedAudioSensorId] = useState('');
  
  // File states
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  // Audio playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [formattedDuration, setFormattedDuration] = useState('00:00');
  
  // Upload & Inference status states
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.50);
  const [analysisStep, setAnalysisStep] = useState('Uploading');
  const [analysisError, setAnalysisError] = useState('');

  // Response details
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // Sorting state for timeline
  const [sortBy, setSortBy] = useState('confidence'); // 'confidence' | 'frequency' | 'alphabetical'
  
  // Waveform bars heights helper
  const [waveformBars, setWaveformBars] = useState([]);

  // Acoustic Quality assessment states
  const [qualityMetrics, setQualityMetrics] = useState(null);
  const [qualityExpanded, setQualityExpanded] = useState(false);

  // Collapsible cards state
  const [expandedCards, setExpandedCards] = useState({});

  // Manual Sighting modal states
  const [manualObsModalOpen, setManualObsModalOpen] = useState(false);
  const [manualObsData, setManualObsData] = useState(null);
  const [manualSpeciesName, setManualSpeciesName] = useState('');
  const [manualCount, setManualCount] = useState('1');
  const [manualNotes, setManualNotes] = useState('');
  const [manualObsSaving, setManualObsSaving] = useState(false);

  const handleTriggerManualObs = (det) => {
    setManualObsData(det);
    setManualSpeciesName('');
    setManualCount('1');
    setManualNotes(`Manual observation overrides uncertain AI detection (Original raw prediction: ${det.raw_prediction || detectionName(det)}).`);
    setManualObsModalOpen(true);
  };

  const handleSaveManualObs = async () => {
    if (!manualSpeciesName.trim()) {
      alert("Please specify a valid species name.");
      return;
    }
    setManualObsSaving(true);
    try {
      const payload = {
        survey_id: parseInt(selectedSurveyId),
        monitoring_site_id: selectedSiteId ? parseInt(selectedSiteId) : null,
        species_name: manualSpeciesName.trim(),
        count: parseInt(manualCount) || 1,
        timestamp: new Date().toISOString(),
        observation_type: "Visual", // Manual sighting
        device_id: selectedAudioSensorId ? selectedAudioSensorId : null,
        notes: manualNotes,
        status: "Analyzed"
      };
      
      await api.post('/api/observations', payload);
      alert("Manual Observation logged successfully!");
      setManualObsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save manual observation. Please check the fields.");
    } finally {
      setManualObsSaving(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    // Generate random mock heights for waveform visualization
    const heights = Array.from({ length: 48 }, () => Math.floor(Math.random() * 32) + 6);
    setWaveformBars(heights);
  }, []);

  useEffect(() => {
    if (analysisResult?.detections) {
      const initial = {};
      analysisResult.detections.forEach((_, idx) => {
        initial[idx] = false;
      });
      setExpandedCards(initial);
    }
  }, [analysisResult]);

  const toggleCard = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSeek = (newTime) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const fetchMetadata = async () => {
    try {
      const [surveysRes, sitesRes, sensorsRes] = await Promise.all([
        api.get('/api/surveys'),
        api.get('/api/monitoring-sites'),
        api.get('/api/audio-sensors')
      ]);
      setSurveys(surveysRes.data);
      setSites(sitesRes.data);
      setAudioSensors(sensorsRes.data);
    } catch (err) {
      console.error('Failed to load metadata:', err);
      setError('Failed to load active surveys, monitoring sites, and audio sensors. Please verify server status.');
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleSurveyChange = (e) => {
    const surveyId = e.target.value;
    setSelectedSurveyId(surveyId);
    setSelectedAudioSensorId(''); // Reset selection
    resetStates();

    // Auto-select site based on survey
    const survey = surveys.find(s => s.id === parseInt(surveyId));
    if (survey && survey.monitoring_site_id) {
      setSelectedSiteId(survey.monitoring_site_id.toString());
    } else {
      setSelectedSiteId('');
    }
  };

  const handleAudioSensorChange = (e) => {
    setSelectedAudioSensorId(e.target.value);
    resetStates();
  };

  const resetStates = () => {
    setFile(null);
    setPreview(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(0);
    setFormattedDuration('00:00');
    setSuccess(false);
    setAnalysisResult(null);
    setAnalysisError('');
    setProgress(0);
    setQualityExpanded(false);
  };

  // Automatically filter audio sensors by the selected monitoring site
  const filteredAudioSensors = selectedSiteId
    ? audioSensors.filter(sensor => sensor.location_id === parseInt(selectedSiteId))
    : [];

  const selectedSurveyDetails = surveys.find(s => s.id === parseInt(selectedSurveyId));
  const selectedSiteDetails = sites.find(s => s.id === parseInt(selectedSiteId));
  const selectedSensorDetails = audioSensors.find(s => s.id === parseInt(selectedAudioSensorId));

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    setSuccess(false);
    setAnalysisResult(null);
    setAnalysisError('');
    
    // Check file type
    const validExtensions = ['.mp3', '.wav', '.flac', '.aac', '.m4a'];
    const hasValidExt = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
    if (!selectedFile.type.startsWith('audio/') && !hasValidExt) {
      setError('Invalid file type. Supported audio formats: WAV, MP3, FLAC, AAC.');
      return;
    }
    
    // Check file size (max 30MB)
    if (selectedFile.size > 30 * 1024 * 1024) {
      setError('File size too large. Maximum size allowed is 30MB.');
      return;
    }
    
    setFile(selectedFile);
    
    // Create preview URL
    const fileUrl = URL.createObjectURL(selectedFile);
    setPreview(fileUrl);

    // Initial audio quality metrics analysis
    analyzeAudioQuality(selectedFile, 0.8)
      .then(metrics => setQualityMetrics(metrics))
      .catch(err => console.warn("Quality metrics initial extraction failed:", err));
  };

  const handleAudioMetadataLoad = (e) => {
    if (e.target.duration) {
      setAudioDuration(e.target.duration);
      const minutes = Math.floor(e.target.duration / 60);
      const seconds = Math.floor(e.target.duration % 60).toString().padStart(2, '0');
      setFormattedDuration(`${minutes}:${seconds}`);
    }
  };

  const handleAudioTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!selectedAudioSensorId) return; 
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleAnalyzeAudio = async () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    setAnalysisStep('Upload Audio');
    setAnalysisError('');
    setSuccess(false);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('survey_id', selectedSurveyId);
    if (selectedSiteId) {
      formData.append('monitoring_site_id', selectedSiteId);
    }
    if (selectedAudioSensorId) {
      formData.append('audio_sensor_id', selectedAudioSensorId);
    }
    formData.append('confidence_threshold', confidenceThreshold);

    try {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 15) {
            setAnalysisStep('Upload Audio');
            return prev + 5;
          } else if (prev < 30) {
            setAnalysisStep('Extract Audio Features');
            return prev + 5;
          } else if (prev < 50) {
            setAnalysisStep('Run Bioacoustic Classifier');
            return prev + 5;
          } else if (prev < 70) {
            setAnalysisStep('Match Species');
            return prev + 5;
          } else if (prev < 85) {
            setAnalysisStep('Save Observation');
            return prev + 5;
          } else if (prev < 98) {
            setAnalysisStep('Save Prediction History');
            return prev + 5;
          } else {
            return prev;
          }
        });
      }, 100);

      const response = await api.post('/api/audio/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(interval);
      setProgress(100);
      setAnalysisStep('Completed');
      setSuccess(true);
      setAnalysisResult(response.data);

      // Recalculate metrics with true Bioacoustic confidence score
      const detections = response.data?.detections || [];
      const avgConf = detections.length > 0
        ? detections.reduce((acc, d) => acc + d.confidence, 0) / detections.length
        : 0.85;
      const metrics = await analyzeAudioQuality(file, avgConf);
      setQualityMetrics(metrics);
      
      // Keep file and preview URL active to enable playback during results inspection
      // setFile(null);
      // setPreview(null);
    } catch (err) {
      console.error(err);
      setAnalysisError(err.response?.data?.detail || 'Audio analysis failed. Please verify backend server state.');
    } finally {
      setUploading(false);
    }
  };

  const lineChartData = useMemo(() => {
    if (!analysisResult?.detections) return [];
    return [...analysisResult.detections]
      .sort((a, b) => a.start_time - b.start_time)
      .map(d => ({
        timestamp: formatSecsToMinSec(d.start_time),
        confidence: Math.round(d.confidence * 100),
        species: detectionName(d)
      }));
  }, [analysisResult]);

  const sortedDetections = useMemo(() => {
    if (!analysisResult?.detections) return [];
    return [...analysisResult.detections].sort((a, b) => {
      if (sortBy === 'confidence') {
        return b.confidence - a.confidence;
      } else {
        return detectionName(a).localeCompare(detectionName(b));
      }
    });
  }, [analysisResult, sortBy]);

  const chronologicalDetections = useMemo(() => {
    if (!analysisResult?.detections) return [];
    return [...analysisResult.detections].sort((a, b) => a.start_time - b.start_time);
  }, [analysisResult]);

  const hasBirdDetections = useMemo(() => {
    if (!analysisResult?.detections) return false;
    return analysisResult.detections.length > 0 && !analysisResult.detections.some(d => 
      ["Mammal Vocalization", "Amphibian Call", "Insect Sound", "Generic Animal Vocalization", "Environmental Noise"].includes(d.species)
    );
  }, [analysisResult]);

  const displayCategory = useMemo(() => {
    if (!analysisResult) return "";
    if (hasBirdDetections) return "Bird Vocalization";
    return analysisResult.animal_call_category || "Environmental Noise";
  }, [analysisResult, hasBirdDetections]);

  const groupedDetections = useMemo(() => {
    if (!analysisResult?.detections) return [];
    const groups = {};
    analysisResult.detections.forEach(det => {
      const name = detectionName(det);
      const isFallback = ["Mammal Vocalization", "Amphibian Call", "Insect Sound", "Generic Animal Vocalization", "Environmental Noise"].includes(name);
      if (hasBirdDetections && isFallback) {
        return;
      }
      if (!groups[name]) {
        groups[name] = {
          name,
          detections: [],
          primaryDet: det
        };
      }
      groups[name].detections.push(det);
    });

    return Object.values(groups).map((g, idx) => {
      const avgConfidence = g.detections.reduce((acc, d) => acc + d.confidence, 0) / g.detections.length;
      const sortedDets = [...g.detections].sort((a, b) => a.start_time - b.start_time);
      return {
        id: idx,
        name: g.name,
        detections: sortedDets,
        primaryDet: g.primaryDet,
        avgConfidence
      };
    });
  }, [analysisResult, hasBirdDetections]);

  const averageConfidence = useMemo(() => {
    if (!analysisResult?.detections || analysisResult.detections.length === 0) return 0;
    const sum = analysisResult.detections.reduce((acc, d) => acc + d.confidence, 0);
    return sum / analysisResult.detections.length;
  }, [analysisResult]);

  const uniqueSpeciesCount = useMemo(() => {
    if (!analysisResult?.detections) return 0;
    return new Set(analysisResult.detections.map(d => detectionName(d))).size;
  }, [analysisResult]);

  const handleExportCSV = () => {
    if (!analysisResult || !analysisResult.detections.length) return;
    const headers = ["Common Name", "Scientific Name", "Confidence", "Start Time (s)", "End Time (s)"];
    const rows = analysisResult.detections.map(d => [
      `"${detectionName(d)}"`,
      `"${d.scientific_name}"`,
      `"${(d.confidence * 100).toFixed(0)}%"`,
      d.start_time,
      d.end_time
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bioacoustic_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    alert("Generating PDF report payload. Ready in Milestone 2.");
  };

  if (loadingMetadata) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-emerald-500 font-sans">
        <span className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
        <span className="ml-3 text-lg font-bold text-slate-755 dark:text-slate-400">Initializing Acoustic Metadata...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-850 dark:text-slate-100 font-sans">
      


      {/* Page Header */}
      <div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-455 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-555" />
          Bioacoustic Monitoring Suite
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          Bioacoustic Recognition Interface
        </h1>
        <p className="text-slate-655 dark:text-slate-400 text-sm mt-1 font-semibold">
          Upload and analyze field audio recordings using deep learning bioacoustic recognition models.
        </p>
      </div>

      {/* Error Alert Display */}
      {analysisError && (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30 p-4 text-xs text-rose-800 dark:text-rose-455 font-semibold max-w-5xl mx-auto">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Acoustic Analysis Telemetry Fault</p>
            <p className="font-medium">{analysisError}</p>
            <button
              type="button"
              onClick={() => setAnalysisError('')}
              className="text-rose-600 dark:text-rose-400 underline font-bold mt-1 block focus:outline-none"
            >
              Dismiss Error
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6 max-w-5xl mx-auto">
        
        {/* 1. Survey & Audio Sensor Selection */}
        <div className="glass-card p-6 space-y-4 shadow-sm border-slate-205 dark:border-slate-805">
          <h3 className="text-sm font-bold text-slate-905 dark:text-white flex items-center gap-2">
            <ClipboardList className="h-4.5 w-4.5 text-emerald-500" />
            Deployment Association
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                Active Survey Context
              </label>
              <select 
                value={selectedSurveyId} 
                onChange={handleSurveyChange}
                className="enterprise-select py-2 px-3 text-xs w-full rounded-xl focus:outline-none"
              >
                <option value="">Select Survey...</option>
                {surveys.map((survey) => (
                  <option key={survey.id} value={survey.id}>
                    {survey.name} ({survey.date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                Associated Site
              </label>
              <select 
                disabled 
                value={selectedSiteId} 
                className="enterprise-select py-2 px-3 text-xs w-full rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-900 opacity-60 cursor-not-allowed"
              >
                <option value="">
                  {!selectedSurveyId 
                    ? 'Survey Site Context' 
                    : selectedSiteDetails 
                      ? selectedSiteDetails.name 
                      : 'No site mapped'
                  }
                </option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                Acoustic Monitoring Sensor
              </label>
              <select 
                value={selectedAudioSensorId} 
                onChange={handleAudioSensorChange}
                disabled={!selectedSurveyId}
                className="enterprise-select py-2 px-3 text-xs w-full rounded-xl focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedSurveyId 
                    ? 'Choose Survey First' 
                    : filteredAudioSensors.length === 0 
                      ? 'No Audio Sensors Deployed' 
                      : 'Select Audio Sensor...'
                  }
                </option>
                {filteredAudioSensors.map((sensor) => (
                  <option key={sensor.id} value={sensor.id}>
                    {sensor.name} ({sensor.sensor_id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Context details */}
        {selectedSurveyDetails && (
          <div className="glass-card p-5 border border-emerald-500/15 bg-emerald-50/5 dark:bg-emerald-950/5 space-y-3.5 animate-fade-in shadow-sm">
            <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-555 dark:text-slate-500">
              Selected Deployment Context Info
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-xs font-semibold text-slate-705 dark:text-slate-350">
              <div>
                <span className="block text-4xs uppercase tracking-wider text-slate-555 font-bold mb-0.5">Survey Name</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{selectedSurveyDetails.name}</span>
              </div>
              <div>
                <span className="block text-4xs uppercase tracking-wider text-slate-555 font-bold mb-0.5">Monitoring Site</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{selectedSiteDetails?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-4xs uppercase tracking-wider text-slate-555 font-bold mb-0.5">Habitat Type</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{selectedSurveyDetails.habitat_type}</span>
              </div>
              <div>
                <span className="block text-4xs uppercase tracking-wider text-slate-555 font-bold mb-0.5">Acoustic Model</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{selectedSensorDetails?.model || 'Select Sensor...'}</span>
              </div>
              <div>
                <span className="block text-4xs uppercase tracking-wider text-slate-555 font-bold mb-0.5">Status</span>
                <span className="inline-flex px-1.5 py-0.2 rounded text-5xs font-bold border border-emerald-250 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  {selectedSensorDetails?.status || 'Select Sensor...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Audio Upload Card */}
        {selectedAudioSensorId && !uploading && !success && (
          <div className="glass-card p-6 space-y-6 animate-fade-in shadow-sm border-slate-205 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Volume2 className="h-4.5 w-4.5 text-emerald-500" />
              Upload Wildlife Audio
            </h3>

            {/* Drag & Drop Audio Upload Area */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 bg-slate-50/50 dark:bg-slate-950/15 cursor-pointer transition-all ${
                preview ? 'border-emerald-500/50' : 'border-slate-202 dark:border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              {preview ? (
                <div className="space-y-4 w-full text-center">
                  <div className="max-w-md mx-auto p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm space-y-3">
                    <Volume2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto animate-bounce" />
                    
                    <div className="pt-2 border-t border-slate-105 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-705 dark:text-slate-350 text-left">
                      <div className="col-span-2 text-2xs font-bold text-emerald-600 uppercase border-b border-slate-50 pb-1">
                        Acoustic Ingestion Target
                      </div>
                      <div>
                        <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-0.5">Filename</span>
                        <span className="truncate block font-mono text-slate-900 dark:text-white text-2xs">{file?.name}</span>
                      </div>
                      <div>
                        <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-0.5">File Size</span>
                        <span className="text-slate-900 dark:text-white font-mono text-2xs">{(file?.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                      <div>
                        <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-0.5">Duration</span>
                        <span className="text-slate-900 dark:text-white font-mono text-2xs">{formattedDuration}</span>
                      </div>
                      <div>
                        <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-0.5">Survey</span>
                        <span className="text-slate-900 dark:text-white truncate block">{selectedSurveyDetails?.name}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100/50">
                      <audio 
                        ref={audioRef}
                        controls
                        src={preview}
                        onTimeUpdate={handleAudioTimeUpdate}
                        onLoadedMetadata={handleAudioMetadataLoad}
                        onEnded={handleAudioEnded}
                        className="w-full accent-emerald-500 rounded-lg mt-2"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={resetStates}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-3xs font-bold text-slate-655 hover:text-rose-500 hover:border-rose-500/30 transition-all bg-white dark:bg-slate-950 focus:outline-none"
                  >
                    Remove Audio File
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                  <Upload className="h-10 w-10 text-slate-400 dark:text-slate-655 mb-3" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350">Drag & Drop Audio Asset</h4>
                  <p className="text-3xs text-slate-555 mt-1">or click to browse local storage</p>
                  <span className="mt-3.5 px-3 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-5xs font-bold text-slate-505 uppercase tracking-widest">
                    WAV, MP3, FLAC, AAC up to 30MB
                  </span>
                  <input
                    type="file"
                    accept=".wav,.mp3,.flac,.aac,.m4a"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>



            {/* Ingestion Submit trigger */}
            <button
              type="button"
              onClick={handleAnalyzeAudio}
              disabled={!file || !selectedSurveyId || !selectedSiteId || !selectedAudioSensorId}
              className="enterprise-btn-primary py-3 flex w-full justify-center items-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <span>Upload & Analyze Audio</span>
            </button>
          </div>
        )}

        {/* Loading Progress State */}
        {uploading && (
          <div className="glass-card p-8 text-center flex flex-col items-center justify-center space-y-6">
            <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
            <div className="space-y-2 max-w-sm w-full">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Executing Bioacoustic AI Inference Pipeline...</h3>
              <p className="text-3xs text-slate-555 leading-normal font-semibold">
                Running bioacoustic classifier to parse sound segments and identify animal vocalizations.
              </p>
            </div>
            
            {/* Progress Stepper */}
            <div className="w-full max-w-md mx-auto space-y-3.5 text-left p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10">
              {[
                { key: 'Upload Audio', label: '1. Upload Audio' },
                { key: 'Extract Audio Features', label: '2. Extract Audio Features' },
                { key: 'Run Bioacoustic Classifier', label: '3. Run Bioacoustic Classifier' },
                { key: 'Match Species', label: '4. Match Species' },
                { key: 'Save Observation', label: '5. Save Observation' },
                { key: 'Save Prediction History', label: '6. Save Prediction History' },
                { key: 'Completed', label: '7. Completed' }
              ].map((s, idx) => {
                const stepsList = [
                  'Upload Audio', 
                  'Extract Audio Features', 
                  'Run Bioacoustic Classifier', 
                  'Match Species', 
                  'Save Observation', 
                  'Save Prediction History', 
                  'Completed'
                ];
                const isCurrent = analysisStep === s.key;
                const isDone = stepsList.indexOf(analysisStep) > idx;
                return (
                  <div key={s.key} className="flex items-center gap-3 text-xs">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border font-bold ${
                      isDone ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' :
                      isCurrent ? 'bg-emerald-50 text-white border-emerald-500 animate-pulse' :
                      'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                    }`}>
                      {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                    </div>
                    <span className={`font-semibold ${isCurrent ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <AudioAnalysisSkeletonLoader />
          </div>
        )}

        {/* Success Results State */}
        {success && analysisResult && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Banner Alert */}
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-450 font-extrabold text-sm">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 animate-bounce" />
                <span>AI Inference Completed & Mapped successfully to database</span>
              </div>
              <button 
                onClick={resetStates}
                className="text-3xs font-extrabold text-slate-500 hover:text-slate-800 dark:hover:text-white uppercase tracking-wider flex items-center gap-1"
              >
                Analyze Another Audio File
              </button>
            </div>

            {/* AI Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 border-slate-205 dark:border-slate-805 space-y-3 md:col-span-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-emerald-500" />
                  AI Summary
                </h3>
                <p className="text-xs text-slate-705 dark:text-slate-300 leading-relaxed font-semibold">
                  {analysisResult.ai_summary || "Bioacoustic recognition complete. Telemetry recorded in database logs."}
                </p>
              </div>
              <div className="glass-card p-6 border-slate-205 dark:border-slate-805 space-y-3">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Volume2 className="h-4.5 w-4.5 text-emerald-500" />
                  Bioacoustic Call Detection
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-0.5">Call Detected</span>
                    <span className={`px-2 py-0.5 rounded-full text-5xs font-bold border uppercase tracking-wider font-mono ${
                      analysisResult.animal_call_detected 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-450 dark:border-emerald-900/30'
                        : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'
                    }`}>
                      {analysisResult.animal_call_detected ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-0.5">Call Category</span>
                    <span className="text-slate-900 dark:text-white font-extrabold text-xs">
                      {displayCategory}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Interactive Waveform & Playback Controls */}
            <div className="space-y-4">
              <WaveformDetectionOverlay 
                audioRef={audioRef}
                preview={preview}
                waveformBars={waveformBars}
                currentTime={currentTime}
                duration={audioDuration}
                onSeek={handleSeek}
                detections={analysisResult.detections || []}
                handleAudioTimeUpdate={handleAudioTimeUpdate}
                handleAudioMetadataLoad={handleAudioMetadataLoad}
                handleAudioEnded={handleAudioEnded}
              />
            </div>

            {/* Empty Results State */}
            {analysisResult.detections.length === 0 && (
              <div className="glass-card p-10 flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto border-slate-200 dark:border-slate-800 bg-slate-50/5 dark:bg-slate-900/5 animate-fade-in">
                <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 flex items-center justify-center shadow-xs">
                  <Volume2 className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">No Biological Calls Detected</h3>
                  <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 leading-normal max-w-sm">
                    No biological calls detected. Recording classified as Environmental Noise.
                  </p>
                  <div className="text-[11px] text-slate-450 dark:text-slate-500 max-w-xs mx-auto leading-relaxed pt-1.5 border-t border-slate-150 dark:border-slate-800 mt-1.5">
                    <p className="font-bold mb-0.5">Examples may include:</p>
                    <ul className="list-disc text-left pl-5 inline-block">
                      <li>wind</li>
                      <li>rain</li>
                      <li>river flow</li>
                      <li>insects below threshold</li>
                      <li>machinery</li>
                    </ul>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={resetStates} 
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-305 bg-white dark:bg-slate-950 hover:bg-slate-100 transition-colors focus:outline-none"
                >
                  Upload Another File
                </button>
              </div>
            )}

            {/* Analysis Metrics Summary */}
            {analysisResult.detections.length > 0 && (
              <div className="glass-card p-5 border border-slate-202 bg-white dark:bg-slate-950 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-900 pb-3">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-505" />
                    Bioacoustic Analysis Summary
                  </h3>
                  <span className="text-5xs font-extrabold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-250 uppercase tracking-widest font-mono">
                    Inference Matrix
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-2xs font-semibold text-slate-655 dark:text-slate-450">
                  <div>
                    <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-0.5">Species Detected</span>
                    <span className="text-slate-900 dark:text-white font-extrabold text-xs">{uniqueSpeciesCount} species</span>
                  </div>
                  <div>
                    <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-0.5">Total Detections</span>
                    <span className="text-slate-900 dark:text-white font-extrabold text-xs">{analysisResult.detections.length} signals</span>
                  </div>
                  <div>
                    <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-0.5">Average Confidence</span>
                    <span className="text-slate-900 dark:text-white font-extrabold text-xs">{Math.round(averageConfidence * 100)}%</span>
                  </div>
                  <div>
                    <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-0.5">Recording Duration</span>
                    <span className="text-slate-900 dark:text-white font-extrabold text-xs">{formattedDuration}</span>
                  </div>
                  <div>
                    <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-0.5">Noise Quality</span>
                    <span className="text-slate-900 dark:text-white font-extrabold text-xs">{qualityMetrics?.qualityRating || 'Good'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Detections List (Collapsible Card list matching image analysis layout) */}
            {analysisResult.detections.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-emerald-500" />
                  Detections List
                </h3>

                <div className="space-y-4">
                  {groupedDetections.map((group, index) => {
                    const det = group.primaryDet;
                    const profile = enrichSpeciesDetails(det);
                    const tax = {
                      kingdom: profile.kingdom || "Animalia",
                      phylum: profile.phylum || "Chordata",
                      class: profile.class_name || profile.class || "Aves",
                      order: profile.order || "Data unavailable",
                      family: profile.family || "Data unavailable",
                      genus: profile.genus || "Data unavailable"
                    };
                    const name = group.name;
                    const isExpanded = expandedCards[group.name] === true;
                    
                    // Map IUCN status to colors
                    const iucn = profile.iucn_status || "Least Concern";
                    let iucnColor = "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900/30";
                    if (["Vulnerable", "Near Threatened", "Vulnerable (VU)"].includes(iucn) || iucn.includes("VU") || iucn.includes("Threatened")) {
                      iucnColor = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-955/30 dark:text-amber-400 dark:border-amber-900/30";
                    } else if (["Endangered", "Critically Endangered", "Endangered (EN)"].includes(iucn) || iucn.includes("EN") || iucn.includes("CR")) {
                      iucnColor = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/30 dark:text-rose-455 dark:border-rose-900/30";
                    }

                    // Map confidence colors
                    const confPct = Math.round(group.avgConfidence * 100);
                    let confBarColor = "bg-rose-500";
                    let confBadgeColor = "bg-rose-600 text-white border-transparent font-sans";
                    if (confPct >= 80) {
                      confBarColor = "bg-emerald-500";
                      confBadgeColor = "bg-emerald-600 text-white border-transparent font-sans";
                    } else if (confPct >= 60) {
                      confBarColor = "bg-yellow-500";
                      confBadgeColor = "bg-yellow-500 text-slate-900 border-transparent font-sans";
                    } else if (confPct >= 40) {
                      confBarColor = "bg-orange-500";
                      confBadgeColor = "bg-orange-500 text-white border-transparent font-sans";
                    }

                    const isYamnetCategory = ["Mammal Vocalization", "Amphibian Call", "Insect Sound", "Generic Animal Vocalization"].includes(det.species);

                    return (
                      <React.Fragment key={`${group.name}-${index}`}>
                        {index > 0 && <div className="border-t border-slate-200 dark:border-slate-800 my-6 opacity-60" />}
                        <div 
                          className="glass-card overflow-hidden border-slate-205 dark:border-slate-805 shadow-sm transition-all duration-200"
                        >
                        {/* Expandable Header */}
                        <div 
                          onClick={() => toggleCard(group.name)}
                          className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                              {group.detections.length} {group.detections.length === 1 ? 'Detection' : 'Detections'}
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {name}
                            </span>
                            {!isYamnetCategory && (
                              <span className="text-3xs italic text-slate-500">
                                {profile.scientific_name || "Unknown"}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-4xs font-mono font-bold text-slate-400">
                              Timeline: {group.detections.map(d => formatSecsToMinSec(d.start_time)).join(", ")}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-5xs font-bold border uppercase tracking-wider font-mono ${confBadgeColor}`}>
                              {confPct}% Avg Conf
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4.5 w-4.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-4.5 w-4.5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Expandable Content body */}
                        {isExpanded && (
                          <div className="p-5 space-y-4 animate-slide-down">
                            
                            {isYamnetCategory ? (
                              /* YAMNet Result Layout */
                              <div className="grid grid-cols-1 gap-6 animate-fade-in">
                                <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5 text-slate-800 dark:text-slate-200">
                                  <h4 className="text-base font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-450 mb-3 flex items-center gap-2">
                                    <Volume2 className="h-5 w-5" />
                                    Animal Call Detected
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold mb-4">
                                    <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
                                      <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-1">Category</span>
                                      <span className="text-slate-900 dark:text-white font-extrabold text-sm">{det.species}</span>
                                    </div>
                                    <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
                                      <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-1">Confidence</span>
                                      <span className="text-slate-900 dark:text-white font-extrabold text-sm">{confPct}%</span>
                                    </div>
                                    <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
                                      <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-1">Status</span>
                                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-250 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30">
                                        Requires Species Identification
                                      </span>
                                    </div>
                                  </div>
                                  <div className="space-y-2 text-xs font-semibold leading-relaxed">
                                    <p className="font-extrabold text-slate-900 dark:text-white">Explanation:</p>
                                    <p className="text-slate-655 dark:text-slate-350">
                                      This recording contains a {det.species.toLowerCase().replace(" vocalization", "").replace(" call", "").replace(" sound", "")} call.
                                    </p>
                                    <p className="text-slate-655 dark:text-slate-350">
                                      Current AI models can classify the sound as belonging to a {det.species.toLowerCase().replace(" vocalization", "").replace(" call", "").replace(" sound", "")} but cannot reliably identify the exact species.
                                    </p>
                                    <p className="text-slate-655 dark:text-slate-350">
                                      Further expert verification or a species-level classifier is required.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : det.is_unknown ? (
                              <div className="p-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-955/10 flex flex-col gap-4 text-slate-800 dark:text-slate-200">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                      ⚠️ Manual Verification Recommended
                                    </h4>
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                                      Unable to confidently identify this species. The classification confidence ({confPct}%) is below the minimum operational threshold.
                                    </p>
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-4">
                                  <div className="space-y-0.5">
                                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Inference Action</span>
                                    <span className="text-3xs font-semibold text-slate-600 dark:text-slate-400">Manual override will register this audio sensor sighting instantly.</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerManualObs(det)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all focus:outline-none shadow-sm"
                                  >
                                    <Plus className="h-4 w-4" />
                                    <span>File Manual Sighting Override</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Endangered Species Alert Banner */}
                                {det.is_endangered && (
                                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-955/5 flex items-start gap-3 text-xs text-rose-705 dark:text-rose-400">
                                    <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
                                    <div className="space-y-1">
                                      <span className="font-extrabold uppercase tracking-wider text-[10px] text-rose-650 dark:text-rose-350">
                                        ⚠️ Conservation Alert — Threatened Species Detected
                                      </span>
                                      <p className="font-semibold text-slate-700 dark:text-slate-350">
                                        This animal is classified as <span className="font-bold underline">{profile.iucn_status}</span>. Immediate protection actions are recommended.
                                      </p>
                                      <div className="pt-1.5 flex flex-wrap gap-4 text-3xs font-bold text-slate-500 dark:text-slate-400">
                                        <span>Priority Level: <span className="text-rose-600 dark:text-rose-455">{profile.iucn_status === 'Critically Endangered' ? 'High Priority (Critical)' : (profile.iucn_status === 'Endangered' ? 'High Priority' : 'Medium-High Priority')}</span></span>
                                        <span>Recommended Actions: Enable continuous camera surveillance & restrict zone entry.</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start animate-fade-in">
                                  
                                  <div className="space-y-4 md:col-span-2">
                                    {det.is_likely && (
                                      <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 dark:bg-orange-955/5 flex items-start gap-3 text-xs text-orange-700 dark:text-orange-400 mb-4">
                                        <AlertTriangle className="h-5 w-5 shrink-0 text-orange-500 mt-0.5" />
                                        <div className="space-y-1 font-sans">
                                          <span className="font-extrabold uppercase tracking-wider text-[10px] text-orange-600 dark:text-orange-350">
                                            ⚠️ Likely Species — Low Confidence Prediction
                                          </span>
                                          <p className="font-semibold text-slate-700 dark:text-slate-350">
                                            Low confidence prediction. Manual verification is recommended.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-start gap-4">
                                      {/* Bird Thumbnail */}
                                      <TimelineImageThumbnail 
                                        key={`${profile.scientific_name}-${name}`}
                                        scientificName={profile.scientific_name} 
                                        commonName={name} 
                                        className="h-20 w-20 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm"
                                      />
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-semibold">
                                        <div>
                                          <span className="block text-4xs uppercase tracking-wider text-slate-400 font-bold mb-0.5">Common Name</span>
                                          <span className="text-slate-900 dark:text-white font-extrabold text-sm">{name}</span>
                                        </div>
                                        <div>
                                          <span className="block text-4xs uppercase tracking-wider text-slate-400 font-bold mb-0.5">Scientific Name</span>
                                          <span className="text-slate-900 dark:text-white font-extrabold italic text-sm">{profile.scientific_name || "Unknown"}</span>
                                        </div>
                                        <div>
                                          <span className="block text-4xs uppercase tracking-wider text-slate-400 font-bold mb-0.5">Confidence</span>
                                          <span className="text-slate-900 dark:text-white font-extrabold text-sm">{confPct}% Avg Conf</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Description — hidden if empty */}
                                    {(profile.description && !profile.description.includes('profile not yet available') && profile.description !== 'Data unavailable') && (
                                    <div className="space-y-1">
                                      <span className="block text-xs sm:text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold">Description</span>
                                      <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed font-semibold">
                                        {profile.description}
                                      </p>
                                    </div>
                                    )}

                                    {/* Group timeline segment click-to-seeks */}
                                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20">
                                      <span className="block text-4xs uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                                        Detection Timeline
                                      </span>
                                      <div className="flex flex-wrap gap-2">
                                        {group.detections.map((d, dIdx) => (
                                          <div 
                                            key={dIdx} 
                                            onClick={() => handleSeek(d.start_time)}
                                            className="px-2.5 py-1 rounded-lg border border-emerald-500/10 hover:border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-3xs font-mono font-bold text-emerald-600 dark:text-emerald-455 cursor-pointer transition-all flex items-center gap-1"
                                            title="Click to seek to this offset"
                                          >
                                            <span>{formatSecsToMinSec(d.start_time)} - {formatSecsToMinSec(d.end_time)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/5 shadow-xs">
                                    <h4 className="block text-xs sm:text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold mb-2.5">
                                      Sighting Metadata & Taxonomy
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-[10px] font-semibold text-slate-750 dark:text-slate-400">
                                      <div>
                                        <span className="text-slate-400 font-medium uppercase text-[9px] block mb-0.5">Kingdom</span>
                                        <p className="text-3xs text-slate-900 dark:text-white font-extrabold">{tax.kingdom || "Animalia"}</p>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 font-medium uppercase text-[9px] block mb-0.5">Phylum</span>
                                        <p className="text-3xs text-slate-900 dark:text-white font-extrabold">{tax.phylum || "Chordata"}</p>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 font-medium uppercase text-[9px] block mb-0.5">Class</span>
                                        <p className="text-3xs text-slate-900 dark:text-white font-extrabold">{tax.class || "Aves"}</p>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 font-medium uppercase text-[9px] block mb-0.5">Order</span>
                                        <p className="text-3xs text-slate-900 dark:text-white font-extrabold">{tax.order || "Data unavailable"}</p>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 font-medium uppercase text-[9px] block mb-0.5">Family</span>
                                        <p className="text-3xs text-slate-900 dark:text-white font-extrabold">{tax.family || "Data unavailable"}</p>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 font-medium uppercase text-[9px] block mb-0.5">Genus</span>
                                        <p className="text-3xs text-slate-900 dark:text-white font-extrabold">{tax.genus || "Data unavailable"}</p>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 font-medium uppercase text-[9px] block mb-0.5">IUCN Status</span>
                                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${iucnColor}`}>
                                          {iucn}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 font-medium uppercase text-[9px] block mb-0.5">Diet</span>
                                        <p className="text-3xs text-slate-900 dark:text-white font-extrabold truncate" title={profile.diet}>{profile.diet || "Data unavailable"}</p>
                                      </div>
                                      <div className="sm:col-span-2">
                                        <span className="text-slate-400 font-medium uppercase text-[9px] block mb-0.5">Habitat</span>
                                        <p className="text-3xs text-slate-900 dark:text-white font-extrabold truncate" title={profile.habitat}>{profile.habitat || "Data unavailable"}</p>
                                      </div>
                                      <div className="sm:col-span-2">
                                        <span className="text-slate-400 font-medium uppercase text-[9px] block mb-0.5">Distribution</span>
                                        <p className="text-3xs text-slate-900 dark:text-white font-extrabold truncate" title={profile.distribution}>{profile.distribution || "Data unavailable"}</p>
                                      </div>
                                      <div className="sm:col-span-2">
                                        <span className="text-slate-400 font-medium uppercase text-[9px] block mb-0.5">Source</span>
                                        <p className="text-3xs text-slate-900 dark:text-white font-extrabold">🔵 AI Audio</p>
                                      </div>
                                      <div className="sm:col-span-2">
                                        <span className="text-slate-400 font-medium uppercase text-[9px] block mb-0.5">Upload Timestamp</span>
                                        <p className="text-3xs text-slate-900 dark:text-white font-extrabold font-mono">
                                          {analysisResult.uploaded_at ? new Date(analysisResult.uploaded_at).toLocaleString() : new Date().toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                </div>

                                <div className="md:col-span-3">
                                  <SpeciesIntelligencePanel profile={profile} profileAvailable={det.profile_available} />
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. Chronological Detection Timeline */}
            {analysisResult.detections.length > 0 && (
              <div className="glass-card p-6 space-y-6 border-slate-205 dark:border-slate-805">
                <h3 className="text-xs font-bold text-slate-905 dark:text-white uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2">
                  <Activity className="h-4 w-4 text-emerald-505" />
                  Chronological Detection Timeline
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Timeline cards stack */}
                  <div className="md:col-span-1 space-y-3 max-h-[350px] overflow-y-auto pr-2">
                    {chronologicalDetections.map((det, idx) => (
                      <div 
                        key={`${detectionName(det)}-${det.start_time}-${idx}`} 
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/10 gap-3 shadow-3xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="font-mono text-emerald-600 dark:text-emerald-455 font-black text-[10px] shrink-0 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10">
                            {formatSecsToMinSec(det.start_time)}
                          </span>
                          
                          {["Mammal Vocalization", "Amphibian Call", "Insect Sound", "Generic Animal Vocalization"].includes(detectionName(det)) ? (
                            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 flex items-center justify-center border border-emerald-500/10 shrink-0">
                              <Volume2 className="h-5 w-5" />
                            </div>
                          ) : (
                            <TimelineImageThumbnail 
                              key={`${det.scientific_name}-${detectionName(det)}`}
                              scientificName={det.scientific_name} 
                              commonName={detectionName(det)} 
                              className="h-10 w-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm"
                            />
                          )}
                          
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-slate-900 dark:text-white block truncate" title={detectionName(det)}>
                              {detectionName(det)}
                            </span>
                            {!["Mammal Vocalization", "Amphibian Call", "Insect Sound", "Generic Animal Vocalization"].includes(detectionName(det)) && (
                              <span className="text-[9px] text-slate-550 italic block mt-0.5 truncate" title={det.scientific_name}>
                                {det.scientific_name}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <span className="px-1.5 py-0.5 rounded bg-emerald-55 border border-emerald-250 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-455 font-bold font-mono text-[9px] shrink-0">
                          {(det.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Line Chart */}
                  <div className="md:col-span-2 space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Acoustic Signal Amplitude Graph</h4>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                          <XAxis dataKey="timestamp" stroke="#64748b" fontSize={9} />
                          <YAxis stroke="#64748b" fontSize={9} unit="%" />
                          <Tooltip 
                            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                            formatter={(value, name, props) => [`${value}%`, props.payload.species]}
                          />
                          <Line type="monotone" dataKey="confidence" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 8. Environmental Noise & Acoustic Quality Assessment (collapsible) */}
            {qualityMetrics && (
              <div className="glass-card p-5 border border-slate-205 dark:border-slate-805 space-y-4 bg-white dark:bg-slate-950">
                <button 
                  type="button"
                  onClick={() => setQualityExpanded(!qualityExpanded)}
                  className="flex w-full items-center justify-between focus:outline-none"
                >
                  <div className="text-left">
                    <span className="text-xs font-bold text-emerald-655 dark:text-emerald-455 uppercase tracking-widest flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5" />
                      Environmental Noise & Acoustic Quality Assessment
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                      Acoustic Quality Assessment
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded border border-emerald-250 uppercase tracking-wider transition-colors hover:bg-emerald-100/50">
                    {qualityExpanded ? 'Collapse' : 'Expand Details'}
                  </span>
                </button>

                {qualityExpanded && (
                  <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-855 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <RecordingQualityCard 
                        rating={qualityMetrics.qualityRating}
                        snr={qualityMetrics.snr}
                        dynamicRange={qualityMetrics.dynamicRange}
                      />
                      <EnvironmentalNoiseCard 
                        noiseLevel={qualityMetrics.noiseLevel}
                        source={qualityMetrics.noiseSource}
                      />
                      <ReliabilityIndicator 
                        reliability={qualityMetrics.reliability}
                        score={qualityMetrics.reliabilityScore}
                      />
                    </div>

                    <NoiseMetricsCard 
                      snr={qualityMetrics.snr}
                      backgroundNoise={qualityMetrics.backgroundNoise}
                      rms={qualityMetrics.rms}
                      silencePercent={qualityMetrics.silencePercent}
                      dynamicRange={qualityMetrics.dynamicRange}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <AcousticRecommendations recommendations={qualityMetrics.recommendations} />
                      <AudioMetadataCard 
                        sampleRate={qualityMetrics.sampleRate}
                        channels={qualityMetrics.channels}
                        fileSize={qualityMetrics.fileSize}
                        encoding={qualityMetrics.encoding}
                        duration={qualityMetrics.duration}
                      />
                    </div>
                    
                    {/* Noise Impact Analysis Banner */}
                    <div className="glass-card p-5 border border-slate-205 dark:border-slate-805 bg-slate-50/10 dark:bg-slate-900/10 flex items-start gap-3">
                      <Info className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          Noise Impact Level:
                          <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                            qualityMetrics.noiseImpact === 'Minimal' ? 'bg-emerald-50 text-emerald-700' :
                            qualityMetrics.noiseImpact === 'Moderate' ? 'bg-amber-50 text-amber-750' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {qualityMetrics.noiseImpact} Impact
                          </span>
                        </h4>
                        <p className="text-2xs text-slate-550 dark:text-slate-400 mt-1 leading-relaxed">
                          Environmental noise assessment indicates {qualityMetrics.noiseImpact.toLowerCase()} impact on bioacoustic inference. 
                          {qualityMetrics.noiseImpact === 'High' 
                            ? ' Signals are heavily masked; high likelihood of missing faint species calls. Manual verification check is recommended.' 
                            : ' Signals are clear and distinct; high confidence in automated classification accuracy.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Controls panel */}
            <div className="pt-6 flex flex-wrap justify-center gap-3.5 border-t border-slate-100 dark:border-slate-800 mt-6 w-full">
              <button
                type="button"
                onClick={resetStates}
                className="px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none transition-all shadow-sm"
              >
                Upload Another Audio
              </button>
              <Link
                to="/observations"
                className="px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center"
              >
                View Observation
              </Link>
              <Link
                to="/ai/prediction-history"
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-202 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-305 text-xs font-bold transition-all shadow-sm flex items-center justify-center"
              >
                View Prediction History
              </Link>
            </div>

          </div>
        )}

        {/* Initial Empty / Awaiting state */}
        {!preview && !success && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/30 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-202 dark:border-slate-800 text-center">
            <Volume2 className="h-12 w-12 text-slate-400 dark:text-slate-655 mb-3 animate-pulse" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-350">Awaiting Bioacoustic File</h4>
            <p className="text-4xs text-slate-500 dark:text-slate-500 mt-1 max-w-xs leading-normal font-semibold">
              Please select survey coordinates and associate an acoustic sensor to trigger the local file upload system.
            </p>
          </div>
        )}

      </div>
      {/* Manual Sighting Modal Form */}
      {manualObsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-rose-500" />
              File Manual Sighting Override
            </h3>
            
            <p className="text-3xs text-slate-500 leading-normal">
              Pre-populated context will be associated with this sighting. Specify the correct species taxonomy manually below.
            </p>
            
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-4xs uppercase tracking-wider text-slate-505 font-bold mb-1">
                  Taxonomic Common Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bengal Tiger, Bonnet Macaque..."
                  value={manualSpeciesName}
                  onChange={(e) => setManualSpeciesName(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs w-full focus:outline-none focus:border-rose-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-4xs uppercase tracking-wider text-slate-505 font-bold mb-1">
                    Sighted Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={manualCount}
                    onChange={(e) => setManualCount(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs w-full focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-4xs uppercase tracking-wider text-slate-505 font-bold mb-1">
                    Sighting Type
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Visual Sighting"
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-955 px-3 py-2 text-xs w-full text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-4xs uppercase tracking-wider text-slate-505 font-bold mb-1">
                  Field Investigator Remarks
                </label>
                <textarea
                  rows="3"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs w-full focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
            
            <div className="pt-3 flex justify-end gap-2 text-2xs">
              <button
                type="button"
                onClick={() => setManualObsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 focus:outline-none transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveManualObs}
                disabled={manualObsSaving}
                className="px-4 py-2 rounded-xl bg-rose-605 hover:bg-rose-500 text-white font-bold transition-all focus:outline-none disabled:opacity-40"
              >
                {manualObsSaving ? "Logging..." : "Log Sighting"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WildlifeAudioUpload;
