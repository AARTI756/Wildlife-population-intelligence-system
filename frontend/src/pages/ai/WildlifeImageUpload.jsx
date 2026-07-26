import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { getSpeciesKnowledge } from '../../services/speciesKnowledgeService';
import BehaviourAnalysisPanel from '../../components/common/BehaviourAnalysisPanel';
import SpeciesIntelligencePanel from '../../components/common/SpeciesIntelligencePanel';
import ImageQualityAssessment from '../../components/common/ImageQualityAssessment';
import EcosystemHealthCard from '../../components/common/EcosystemHealthCard';
import { 
  Upload, 
  Sparkles, 
  AlertCircle, 
  AlertTriangle,
  FileImage, 
  ClipboardList, 
  MapPin, 
  Loader2, 
  CheckCircle,
  Clock,
  User,
  Cpu,
  X,
  Check,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Activity,
  FileText,
  Download,
  Plus
} from 'lucide-react';

const ImageAnalysisSkeletonLoader = () => {
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
    description: "The horse is a domesticated one-toed hoofed mammal belonging to the family Equidae, widely used for transport, agriculture, and companionship."
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
    description: "Sheep are quadrupedal, ruminant mammals typically kept as livestock. They were among the first animals to be domesticated."
  },
  "cat": {
    scientific_name: "Felis catus",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Carnivora", family: "Felidae", genus: "Felis",
    iucn_status: "Domesticated",
    habitat: "Urban, Suburban, Rural",
    diet: "Carnivore (Small Mammals, Birds, Fish)",
    distribution: "Worldwide",
    description: "The domestic cat is a small, typically furry, carnivorous mammal widely kept as a pet and for pest control."
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
    description: "Zebras are African equines with distinctive black-and-white striped coats. Their stripes are unique to each individual."
  },
  "wolf": {
    scientific_name: "Canis lupus",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Carnivora", family: "Canidae", genus: "Canis",
    iucn_status: "Least Concern",
    habitat: "Forests, Tundra, Grasslands, Deserts",
    diet: "Carnivore (Deer, Elk, Moose)",
    distribution: "Northern Hemisphere",
    description: "The wolf is the largest extant member of the family Canidae. It is a highly social animal known for living and hunting in packs."
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
    description: "The European rabbit is a species of rabbit native to the Iberian Peninsula, now found worldwide as both wild and domesticated populations."
  },
  "monkey": {
    scientific_name: "Cercopithecidae",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Primates", family: "Cercopithecidae", genus: "Various",
    iucn_status: "Varies",
    habitat: "Tropical Forests, Savannas, Mountains",
    diet: "Omnivore (Fruits, Seeds, Insects)",
    distribution: "Africa, Asia, Central and South America",
    description: "Monkeys are non-hominoid simians, generally possessing tails and comprising the infraorder Simiiformes."
  },
  "crocodile": {
    scientific_name: "Crocodylidae",
    kingdom: "Animalia", phylum: "Chordata", class: "Reptilia",
    order: "Crocodilia", family: "Crocodylidae", genus: "Crocodylus",
    iucn_status: "Vulnerable",
    habitat: "Rivers, Lakes, Wetlands, Estuaries",
    diet: "Carnivore (Fish, Mammals, Birds)",
    distribution: "Tropical regions Worldwide",
    description: "Crocodiles are large semiaquatic reptiles that live throughout the tropics in Africa, Asia, the Americas, and Australia."
  },
  "hippopotamus": {
    scientific_name: "Hippopotamus amphibius",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Artiodactyla", family: "Hippopotamidae", genus: "Hippopotamus",
    iucn_status: "Vulnerable",
    habitat: "Rivers, Lakes, Wetlands",
    diet: "Herbivore (Grasses)",
    distribution: "Sub-Saharan Africa",
    description: "The hippopotamus is a large, mostly herbivorous, semiaquatic mammal native to sub-Saharan Africa. It is the third-largest living land mammal."
  },
  "hippo": {
    scientific_name: "Hippopotamus amphibius",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Artiodactyla", family: "Hippopotamidae", genus: "Hippopotamus",
    iucn_status: "Vulnerable",
    habitat: "Rivers, Lakes, Wetlands",
    diet: "Herbivore (Grasses)",
    distribution: "Sub-Saharan Africa",
    description: "The hippopotamus is a large, mostly herbivorous, semiaquatic mammal native to sub-Saharan Africa. It is the third-largest living land mammal."
  },
  "cheetah": {
    scientific_name: "Acinonyx jubatus",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Carnivora", family: "Felidae", genus: "Acinonyx",
    iucn_status: "Vulnerable",
    habitat: "Savannas, Grasslands, Arid Regions",
    diet: "Carnivore (Gazelles, Impalas, Hares)",
    distribution: "Africa and Central Iran",
    description: "The cheetah is a large cat native to Africa and central Iran. It is the fastest land animal, capable of running at speeds up to 112 km/h."
  },
  "gorilla": {
    scientific_name: "Gorilla gorilla",
    kingdom: "Animalia", phylum: "Chordata", class: "Mammalia",
    order: "Primates", family: "Hominidae", genus: "Gorilla",
    iucn_status: "Critically Endangered",
    habitat: "Tropical and Subtropical Forests",
    diet: "Herbivore (Leaves, Stems, Fruit)",
    distribution: "Central Africa",
    description: "Gorillas are the largest living primates, predominantly herbivorous apes that inhabit the tropical forests of equatorial Africa."
  },
  "eagle": {
    scientific_name: "Aquila chrysaetos",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Accipitriformes", family: "Accipitridae", genus: "Aquila",
    iucn_status: "Least Concern",
    habitat: "Mountains, Forests, Open Plains",
    diet: "Carnivore (Rabbits, Marmots, Fish)",
    distribution: "Northern Hemisphere",
    description: "Eagles are large birds of prey belonging to the family Accipitridae, known for their powerful build and keen eyesight."
  },
  "parrot": {
    scientific_name: "Psittaciformes",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Psittaciformes", family: "Psittacidae", genus: "Various",
    iucn_status: "Varies",
    habitat: "Tropical and Subtropical Forests",
    diet: "Omnivore (Seeds, Fruits, Nectar, Insects)",
    distribution: "Tropical and Subtropical regions",
    description: "Parrots are birds with a strong curved bill, an upright stance, and clawed zygodactyl feet, known for their colourful plumage and intelligence."
  },
  "penguin": {
    scientific_name: "Spheniscidae",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Sphenisciformes", family: "Spheniscidae", genus: "Various",
    iucn_status: "Varies",
    habitat: "Coastal and Marine",
    diet: "Carnivore (Fish, Krill, Squid)",
    distribution: "Southern Hemisphere",
    description: "Penguins are a group of aquatic flightless birds highly adapted for life in the water, found almost exclusively in the Southern Hemisphere."
  },
  "owl": {
    scientific_name: "Strigiformes",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Strigiformes", family: "Strigidae", genus: "Various",
    iucn_status: "Least Concern",
    habitat: "Forests, Deserts, Tundra",
    diet: "Carnivore (Rodents, Insects, Small Birds)",
    distribution: "Worldwide",
    description: "Owls are birds from the order Strigiformes, known for their nocturnal habits, binocular vision, and near-silent flight."
  },
  "hawk": {
    scientific_name: "Accipitridae",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Accipitriformes", family: "Accipitridae", genus: "Various",
    iucn_status: "Least Concern",
    habitat: "Forests, Grasslands, Mountains, Urban",
    diet: "Carnivore (Small Mammals, Birds, Reptiles)",
    distribution: "Worldwide",
    description: "Hawks are medium-sized diurnal birds of prey widely distributed and varying greatly in size and plumage."
  },
  "pigeon": {
    scientific_name: "Columba livia",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Columbiformes", family: "Columbidae", genus: "Columba",
    iucn_status: "Least Concern",
    habitat: "Urban, Rocky Cliffs, Farmlands",
    diet: "Granivore (Seeds, Grains, Fruits)",
    distribution: "Worldwide",
    description: "The rock dove or common pigeon is a member of the bird family Columbidae, widely distributed throughout the world."
  },
  "rock pigeon": {
    scientific_name: "Columba livia",
    kingdom: "Animalia", phylum: "Chordata", class: "Aves",
    order: "Columbiformes", family: "Columbidae", genus: "Columba",
    iucn_status: "Least Concern",
    habitat: "Urban, Rocky Cliffs, Farmlands",
    diet: "Granivore (Seeds, Grains, Fruits)",
    distribution: "Worldwide",
    description: "The rock dove or common pigeon is a member of the bird family Columbidae, widely distributed throughout the world."
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
    description: "Kingfishers are brightly coloured birds known for diving to catch fish."
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
    description: "Herons are long-legged freshwater and coastal birds known for their patient hunting style."
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
    description: "The red junglefowl is a tropical bird and the primary ancestor of the domestic chicken."
  },
  "pacific chorus frog": {
    scientific_name: "Pseudacris regilla",
    kingdom: "Animalia", phylum: "Chordata", class: "Amphibia",
    order: "Anura", family: "Hylidae", genus: "Pseudacris",
    iucn_status: "Least Concern",
    habitat: "Wetlands, Forests, Grasslands",
    diet: "Insectivore (Insects, Spiders)",
    distribution: "Western North America",
    description: "The Pacific chorus frog is a small tree frog known for its distinctive ribbit call."
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
  const cName = det.raw_prediction || det.species || "";
  
  const enrichedProfile = { ...(det.species_profile || {}) };
  
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
      det.profile_available = true; // Force true so SpeciesIntelligencePanel renders
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

  // Basic description fallback generator
  if (!enrichedProfile.description || enrichedProfile.description.includes("profile not yet available")) {
    const commonName = det.species || det.raw_prediction || "Wildlife";
    enrichedProfile.description = `The ${commonName} is an important wildlife species observed and monitored within the local conservation zone. It plays a significant role in maintaining ecological balance and biodiversity.`;
  }
  
  return enrichedProfile;
};

const WildlifeImageUpload = () => {
  const { user } = useAuth();
  
  // Metadata lists
  const [surveys, setSurveys] = useState([]);
  const [sites, setSites] = useState([]);
  const [cameraTraps, setCameraTraps] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [error, setError] = useState('');

  // Selected values
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedCameraTrapId, setSelectedCameraTrapId] = useState('');
  
  // File states
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resolution, setResolution] = useState('');
  
  // Upload status states
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  
  // Confidence and Step progress states
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.50);
  const [analysisStep, setAnalysisStep] = useState('Uploading');
  
  // Response details
  const [uploadedAsset, setUploadedAsset] = useState(null);

  // Zoom lightbox state
  const [zoomImage, setZoomImage] = useState(null);

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
    setManualNotes(`Manual observation overrides uncertain AI detection (Original raw prediction: ${det.raw_species}).`);
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
        device_id: selectedCameraTrapId ? selectedCameraTrapId : null,
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
  }, []);

  useEffect(() => {
    if (uploadedAsset?.detections) {
      const initial = {};
      uploadedAsset.detections.forEach((_, idx) => {
        initial[idx] = false;
      });
      setExpandedCards(initial);
    }
  }, [uploadedAsset]);

  const toggleCard = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const fetchMetadata = async () => {
    try {
      const [surveysRes, sitesRes, trapsRes] = await Promise.all([
        api.get('/api/surveys'),
        api.get('/api/monitoring-sites'),
        api.get('/api/camera-traps')
      ]);
      setSurveys(surveysRes.data);
      setSites(sitesRes.data);
      setCameraTraps(trapsRes.data);
    } catch (err) {
      console.error('Failed to load metadata:', err);
      setError('Failed to load active surveys, monitoring sites, and camera traps. Please verify server status.');
    } finally {
      setLoadingMetadata(false);
    }
  };

  const handleSurveyChange = (e) => {
    const surveyId = e.target.value;
    setSelectedSurveyId(surveyId);
    setSelectedCameraTrapId(''); // Reset camera trap selection
    setFile(null);
    setPreview(null);
    setResolution('');
    setSuccess(false);
    setUploadedAsset(null);

    // Auto-select site based on survey
    const survey = surveys.find(s => s.id === parseInt(surveyId));
    if (survey && survey.monitoring_site_id) {
      setSelectedSiteId(survey.monitoring_site_id.toString());
    } else {
      setSelectedSiteId('');
    }
  };

  const handleCameraTrapChange = (e) => {
    setSelectedCameraTrapId(e.target.value);
    setFile(null);
    setPreview(null);
    setResolution('');
    setSuccess(false);
    setUploadedAsset(null);
  };

  // Automatically filter camera traps by the selected monitoring site
  const filteredCameraTraps = selectedSiteId
    ? cameraTraps.filter(trap => trap.location_id === parseInt(selectedSiteId))
    : [];

  const selectedSurveyDetails = surveys.find(s => s.id === parseInt(selectedSurveyId));
  const selectedSiteDetails = sites.find(s => s.id === parseInt(selectedSiteId));
  const selectedTrapDetails = cameraTraps.find(t => t.id === parseInt(selectedCameraTrapId));

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    setSuccess(false);
    setUploadedAsset(null);
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a valid image (JPG, PNG, WEBP, or GIF).');
      return;
    }
    
    // Check file size (max 20MB)
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('File size too large. Maximum size allowed is 20MB.');
      return;
    }
    
    setFile(selectedFile);
    
    // Create preview URL and read resolution
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        setResolution(`${img.width} x ${img.height} pixels`);
      };
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!selectedCameraTrapId) return; 
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or drag an image file to upload.');
      return;
    }
    if (!selectedSurveyId) {
      setError('Please associate this asset with a valid survey.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setAnalysisStep('Uploading Image');
    setError('');
    setSuccess(false);
    setUploadedAsset(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('survey_id', selectedSurveyId);
    if (selectedSiteId) {
      formData.append('monitoring_site_id', selectedSiteId);
    }
    formData.append('confidence_threshold', confidenceThreshold);

    try {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 15) {
            setAnalysisStep('Uploading Image');
            return prev + 5;
          } else if (prev < 30) {
            setAnalysisStep('Loading AI Model');
            return prev + 5;
          } else if (prev < 50) {
            setAnalysisStep('Running YOLOv11 Detection');
            return prev + 5;
          } else if (prev < 70) {
            setAnalysisStep('Matching Species Profile');
            return prev + 5;
          } else if (prev < 85) {
            setAnalysisStep('Creating Observation');
            return prev + 5;
          } else if (prev < 98) {
            setAnalysisStep('Saving Prediction History');
            return prev + 5;
          } else {
            return prev;
          }
        });
      }, 100);

      const response = await api.post('/api/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(interval);
      setProgress(100);
      setAnalysisStep('Completed');
      setSuccess(true);
      setUploadedAsset(response.data);
      
      setFile(null);
      setPreview(null);
      setResolution('');
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'object'
        ? (detail.message || JSON.stringify(detail))
        : detail;
      setError(errorMsg || 'Image analysis failed. Please verify backend server state.');
    } finally {
      setUploading(false);
    }
  };

  if (loadingMetadata) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-emerald-500 font-sans">
        <span className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
        <span className="ml-3 text-lg font-bold text-slate-705 dark:text-slate-400">Initializing Optical Metadata...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-805 dark:text-slate-100 font-sans">
      
      {/* Zoom Lightbox Modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setZoomImage(null)}
        >
          <img 
            src={zoomImage} 
            alt="Zoomed Wildlife Capture" 
            className="max-h-[92vh] max-w-full rounded-2xl object-contain shadow-2xl transition-all duration-300 animate-scale-up" 
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&auto=format&fit=crop&q=60'; }}
          />
          <button 
            onClick={() => setZoomImage(null)}
            className="absolute top-6 right-6 text-white hover:text-emerald-400 bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-555" />
          Optical Monitoring Suite
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          Wildlife Image Analysis
        </h1>
        <p className="text-slate-655 dark:text-slate-400 text-sm mt-1 font-semibold">
          Upload and identify wildlife camera trap imagery using YOLOv11 computer vision models.
        </p>
      </div>

      <div className="space-y-6 max-w-5xl mx-auto">
        
        {/* 1. Survey & Camera Selection */}
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
                Camera Trap Node
              </label>
              <select 
                value={selectedCameraTrapId} 
                onChange={handleCameraTrapChange}
                disabled={!selectedSurveyId}
                className="enterprise-select py-2 px-3 text-xs w-full rounded-xl focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedSurveyId 
                    ? 'Choose Survey First' 
                    : filteredCameraTraps.length === 0 
                      ? 'No Camera Traps Deployed' 
                      : 'Select Camera Trap...'
                  }
                </option>
                {filteredCameraTraps.map((trap) => (
                  <option key={trap.id} value={trap.id}>
                    {trap.name} ({trap.camera_id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Context details */}
        {selectedSurveyDetails && (
          <div className="glass-card p-5 border border-emerald-500/15 bg-emerald-50/5 dark:bg-emerald-950/5 space-y-3.5 animate-fade-in shadow-sm">
            <h4 className="text-2xs font-extrabold uppercase tracking-wider text-slate-555 dark:text-slate-550">
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
                <span className="block text-4xs uppercase tracking-wider text-slate-555 font-bold mb-0.5">Camera Model</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{selectedTrapDetails?.model || 'Select Trap...'}</span>
              </div>
              <div>
                <span className="block text-4xs uppercase tracking-wider text-slate-555 font-bold mb-0.5">Status</span>
                <span className="inline-flex px-1.5 py-0.2 rounded text-5xs font-bold border border-emerald-250 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  {selectedTrapDetails?.status || 'Select Trap...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Image Upload Card */}
        {selectedCameraTrapId && !uploading && !success && (
          <div className="glass-card p-6 space-y-6 animate-fade-in shadow-sm border-slate-205 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileImage className="h-4.5 w-4.5 text-emerald-500" />
              Upload Wildlife Image
            </h3>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-955/40 border border-rose-200 dark:border-rose-900/35 p-4 text-xs text-rose-800 dark:text-rose-455 font-semibold">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Drag & Drop Upload Box */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 bg-slate-50/50 dark:bg-slate-950/15 cursor-pointer transition-all ${
                preview ? 'border-emerald-500/50' : 'border-slate-202 dark:border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              {preview ? (
                <div className="space-y-4 text-center">
                  <img 
                    src={preview} 
                    alt="Selected Preview" 
                    className="max-h-60 mx-auto rounded-xl border border-slate-200 dark:border-slate-805 shadow-md object-contain"
                  />
                  
                  {/* File Metadata Details Panel */}
                  <div className="max-w-md mx-auto p-4 rounded-xl border border-slate-202 dark:border-slate-800 bg-white dark:bg-slate-950 text-left grid grid-cols-2 gap-3 text-xs font-semibold text-slate-705 dark:text-slate-350 shadow-xs">
                    <div className="col-span-2 pb-2 border-b border-slate-100 dark:border-slate-805 flex justify-between items-center text-2xs font-bold text-emerald-600 uppercase">
                      <span>Ingestion Target Details</span>
                      <span>Pre-Upload Preview</span>
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
                      <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-0.5">Resolution</span>
                      <span className="text-slate-900 dark:text-white font-mono text-2xs">{resolution || 'Reading...'}</span>
                    </div>
                    <div>
                      <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-0.5">Campaign Survey</span>
                      <span className="text-slate-900 dark:text-white truncate block">{selectedSurveyDetails?.name}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); setResolution(''); }}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-3xs font-bold text-slate-655 hover:text-rose-500 hover:border-rose-500/30 transition-all bg-white dark:bg-slate-950 focus:outline-none"
                  >
                    Remove Imagery File
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                  <Upload className="h-10 w-10 text-slate-400 dark:text-slate-655 mb-3" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350">Drag & Drop Image Asset</h4>
                  <p className="text-3xs text-slate-555 mt-1">or click to browse local storage</p>
                  <span className="mt-3.5 px-3 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-202 dark:border-slate-800 text-5xs font-bold text-slate-505 uppercase tracking-widest">
                    PNG, JPG, WEBP, GIF up to 20MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>



            {/* Ingestion Submit trigger */}
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || !selectedSurveyId || !selectedSiteId || !selectedCameraTrapId}
              className="enterprise-btn-primary py-3 flex w-full justify-center items-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <span>Upload & Analyze Image</span>
            </button>
          </div>
        )}

        {/* Loading Progress State */}
        {uploading && (
          <div className="glass-card p-8 text-center flex flex-col items-center justify-center space-y-6">
            <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
            <div className="space-y-2 max-w-sm w-full">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Executing YOLOv11 Inference Pipeline...</h3>
              <p className="text-3xs text-slate-550 leading-normal font-semibold">
                Running computer vision classifier to identify mammals, reptiles, and key avian fauna.
              </p>
            </div>
            
            {/* Progress Stepper */}
            <div className="w-full max-w-md mx-auto space-y-3.5 text-left p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10">
              {[
                { key: 'Uploading Image', label: '1. Uploading Image' },
                { key: 'Loading AI Model', label: '2. Loading AI Model' },
                { key: 'Running YOLOv11 Detection', label: '3. Running YOLOv11 Detection' },
                { key: 'Matching Species Profile', label: '4. Matching Species Profile' },
                { key: 'Creating Observation', label: '5. Creating Observation' },
                { key: 'Saving Prediction History', label: '6. Saving Prediction History' },
                { key: 'Completed', label: '7. Completed' }
              ].map((s, idx) => {
                const stepsList = [
                  'Uploading Image', 
                  'Loading AI Model', 
                  'Running YOLOv11 Detection', 
                  'Matching Species Profile', 
                  'Creating Observation', 
                  'Saving Prediction History', 
                  'Completed'
                ];
                const isCurrent = analysisStep === s.key;
                const isDone = stepsList.indexOf(analysisStep) > idx;
                return (
                  <div key={s.key} className="flex items-center gap-3 text-xs">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border font-bold ${
                      isDone ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' :
                      isCurrent ? 'bg-emerald-500 text-white border-emerald-500 animate-pulse' :
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

            <ImageAnalysisSkeletonLoader />
          </div>
        )}

        {/* Success Results State (Azure/AWS Rekognition dashboard style) */}
        {success && uploadedAsset && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Banner Alert with bounce animation */}
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-450 font-extrabold text-sm">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 animate-bounce" />
                <span>AI Inference Completed Mapped successfully to database</span>
              </div>
              <button 
                onClick={() => { setSuccess(false); setUploadedAsset(null); }}
                className="text-3xs font-extrabold text-slate-500 hover:text-slate-800 dark:hover:text-white uppercase tracking-wider flex items-center gap-1"
              >
                Analyze Another Image
              </button>
            </div>

            {/* AI Summary Section */}
            <div className="glass-card p-6 border-slate-205 dark:border-slate-805 space-y-3">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-emerald-500" />
                AI Summary
              </h3>
              <p className="text-xs text-slate-705 dark:text-slate-300 leading-relaxed font-semibold">
                {uploadedAsset.ai_summary || "Wildlife species detection complete. Telemetry recorded in database logs."}
              </p>
            </div>

            {/* Image Visualizer Card (Original vs Annotated) */}
            <div className="glass-card p-6 border-slate-205 dark:border-slate-805 space-y-4">
              <h3 className="text-sm font-bold text-slate-905 dark:text-white">Image Analysis Visualizer</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Original Image View */}
                <div className="space-y-2">
                  <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold">
                    Original Image
                  </span>
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950/10 h-72">
                    <img
                      src={preview || `${api.defaults.baseURL || 'http://localhost:8000'}${uploadedAsset.filepath}`}
                      alt="Original Wildlife"
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&auto=format&fit=crop&q=60'; }}
                    />
                  </div>
                </div>

                {/* 2. Detected Image (With YOLO Bounding Boxes) */}
                <div className="space-y-2">
                  <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold">
                    Detected Image (YOLOv11 Bounding Boxes)
                  </span>
                  <div className="relative group rounded-xl overflow-hidden border border-emerald-500/20 bg-slate-950/10 h-72">
                    <img
                      src={`${api.defaults.baseURL || 'http://127.0.0.1:8000'}${uploadedAsset.filepath}?t=${new Date().getTime()}`}
                      alt="Annotated Wildlife"
                      className="w-full h-full object-contain cursor-zoom-in"
                      onClick={() => setZoomImage(`${api.defaults.baseURL || 'http://127.0.0.1:8000'}${uploadedAsset.filepath}`)}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&auto=format&fit=crop&q=60'; }}
                    />
                    <div 
                      onClick={() => setZoomImage(`${api.defaults.baseURL || 'http://127.0.0.1:8000'}${uploadedAsset.filepath}`)}
                      className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg cursor-pointer transition-all shadow-sm"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </div>
                  </div>
                  
                  {/* Download annotated image button */}
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <span className="text-[10px] text-slate-550 font-mono">Annotated Bounding Box view</span>
                    <a
                      href={`${api.defaults.baseURL || 'http://127.0.0.1:8000'}${uploadedAsset.filepath}`}
                      download={uploadedAsset.filename}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-2xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors bg-white dark:bg-slate-950"
                    >
                      <Download className="h-4 w-4 text-emerald-500" />
                      <span>Download Annotated Image</span>
                    </a>
                  </div>
                </div>

              </div>
              <p className="text-5xs text-slate-400 font-mono text-center pt-2">
                Click annotated image to view in high-resolution full screen lightbox.
              </p>
            </div>

            <ImageQualityAssessment
              file={file || { name: uploadedAsset.filename, width: resolution?.split('×')[0], height: resolution?.split('×')[1] }}
              confidence={uploadedAsset.detections?.length ? Math.max(...uploadedAsset.detections.map((d) => d.confidence)) : null}
              quality={uploadedAsset.image_quality}
            />

            {uploadedAsset.ecosystem_health_score && (
              <EcosystemHealthCard healthData={uploadedAsset.ecosystem_health_score} />
            )}

            {/* Predictions Details (Expandable Cards List) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-emerald-500" />
                Detections List
              </h3>

              {!uploadedAsset.detections || uploadedAsset.detections.length === 0 ? (
                <div className="glass-card p-6 border-slate-205 text-center text-slate-500 text-xs">
                  No wildlife species detected.
                </div>
              ) : (
                <div className="space-y-4">
                  {uploadedAsset.detections.map((det, index) => {
                    const profile = enrichSpeciesDetails(det);
                    const tax = {
                      kingdom: profile.kingdom || "Animalia",
                      phylum: profile.phylum || "Chordata",
                      class: profile.class_name || profile.class || "Mammalia",
                      order: profile.order || "Data unavailable",
                      family: profile.family || "Data unavailable",
                      genus: profile.genus || "Data unavailable"
                    };
                    const isExpanded = expandedCards[index] === true;
                    
                    // Map IUCN status to colors
                    const iucn = profile.iucn_status || "Least Concern";
                    let iucnColor = "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/35 dark:text-emerald-400 dark:border-emerald-900/30";
                    if (["Vulnerable", "Near Threatened", "Vulnerable (VU)"].includes(iucn) || iucn.includes("VU") || iucn.includes("Threatened")) {
                      iucnColor = "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/35 dark:text-amber-450 dark:border-amber-900/30";
                    } else if (["Endangered", "Critically Endangered", "Endangered (EN)"].includes(iucn) || iucn.includes("EN") || iucn.includes("CR")) {
                      iucnColor = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/30 dark:text-rose-455 dark:border-rose-900/30";
                    }

                    // Map confidence colors
                    const confPct = Math.round(det.confidence * 100);
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

                    return (
                      <React.Fragment key={index}>
                        {index > 0 && <div className="border-t border-slate-200 dark:border-slate-800 my-6 opacity-60" />}
                        <div 
                          className="glass-card overflow-hidden border-slate-205 dark:border-slate-805 shadow-sm transition-all duration-200"
                        >
                        {/* Expandable Header */}
                        <div 
                          onClick={() => toggleCard(index)}
                          className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                              Detection #{index + 1}
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {det.species === "Unknown Species" ? "Species Requires Verification" : det.species}
                            </span>
                            <span className="text-3xs italic text-slate-500">
                              {profile.scientific_name || "Unknown"}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Confidence percentage badge */}
                            <span className={`px-2 py-0.5 rounded-full text-5xs font-bold border uppercase tracking-wider font-mono ${confBadgeColor}`}>
                              {confPct}% Conf
                            </span>
                            
                            {/* Collapse Toggle Arrow */}
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
                                                       {det.is_unknown ? (
                              <div className="p-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-955/10 flex flex-col gap-4 text-slate-800 dark:text-slate-200">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                      {det.ecological_plausibility === 'Low' ? '⚠️ Low Ecological Plausibility' : '⚠️ Manual Verification Recommended'}
                                    </h4>
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                                      {det.ecological_plausibility === 'Low'
                                        ? (det.plausibility_reason || 'Terrestrial camera trap detected marine life. Manual verification is highly recommended.')
                                        : `Unable to confidently identify this species. The classification confidence (${confPct}%) is below the minimum operational threshold.`}
                                    </p>
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-4">
                                  <div className="space-y-0.5">
                                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Inference Action</span>
                                    <span className="text-3xs font-semibold text-slate-600 dark:text-slate-400">Manual override will register this camera trap sighting instantly.</span>
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
                                
                                {/* Large Species details grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                  
                                  {/* Classification column */}
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
                                    <div>
                                      {det.is_possible_species ? (
                                        <div className="mb-2">
                                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-955/20 dark:text-amber-400 text-5xs font-black uppercase tracking-wider">
                                            Possible Species ( Felidae Ambiguity )
                                          </span>
                                          <div className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-350 space-y-1.5">
                                            <p className="text-3xs text-slate-500 font-medium">Candidate List (close confidence predictions):</p>
                                            <div className="flex flex-wrap gap-2">
                                              {det.candidates.map((c, cIdx) => (
                                                <span key={cIdx} className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-3xs font-bold border border-slate-200 dark:border-slate-800">
                                                  {c.species} ({Math.round(c.confidence * 100)}%)
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      ) : det.is_likely ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded border border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-900/40 dark:bg-orange-955/20 dark:text-orange-400 text-5xs font-black uppercase tracking-wider mb-2">
                                          Likely Species
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-955/20 dark:text-emerald-400 text-5xs font-black uppercase tracking-wider mb-2">
                                          Confirmed Species
                                        </span>
                                      )}
                                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                        {det.species}
                                      </h2>
                                      <p className="text-xs italic text-slate-500 mt-0.5">
                                        {profile.scientific_name || "Unknown scientific name"}
                                      </p>
                                    </div>

                                    {/* Confidence Gauge / Progress Bar */}
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center text-xs sm:text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold">
                                        <span>Classification Confidence</span>
                                        <span className="font-mono">{confPct}%</span>
                                      </div>
                                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-300 ${confBarColor}`}
                                          style={{ width: `${confPct}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* Description — hidden if empty */}
                                    {profile.description && (
                                    <div className="space-y-1">
                                      <span className="block text-xs sm:text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold">Description</span>
                                      <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed font-semibold">
                                        {profile.description}
                                      </p>
                                    </div>
                                    )}
                                  </div>

                                  {/* Taxonomy & Metadata column */}
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
                                        <p className="text-3xs text-slate-900 dark:text-white font-extrabold">{tax.class || "Mammalia"}</p>
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
                                        <p className="text-3xs text-slate-900 dark:text-white font-extrabold">🟢 AI Image</p>
                                      </div>
                                      <div className="sm:col-span-2">
                                        <span className="text-slate-400 font-medium uppercase text-[9px] block mb-0.5">Timestamp</span>
                                        <p className="text-3xs text-slate-900 dark:text-white font-extrabold font-mono">
                                          {uploadedAsset.created_at ? new Date(uploadedAsset.created_at).toLocaleTimeString() : 'Data unavailable'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                </div>

                                <div className="md:col-span-3">
                                  <BehaviourAnalysisPanel behaviour={det.behaviour} />
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
              )}
            </div>

            {/* Controls panel */}
            <div className="pt-6 flex flex-wrap justify-center gap-3.5 border-t border-slate-100 dark:border-slate-800 mt-6 w-full">
              <button
                onClick={() => { setSuccess(false); setUploadedAsset(null); }}
                className="px-4 py-2.5 rounded-xl border border-slate-205 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none transition-all shadow-sm"
              >
                Upload Another Image
              </button>
              <Link
                to="/observations"
                className="px-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center"
              >
                View Observation
              </Link>
              <Link
                to="/ai/prediction-history"
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm flex items-center justify-center"
              >
                View Prediction History
              </Link>
            </div>
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

export default WildlifeImageUpload;