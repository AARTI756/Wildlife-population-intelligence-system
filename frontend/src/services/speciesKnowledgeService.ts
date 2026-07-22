export interface SpeciesKnowledge {
  scientific_name: string;
  common_name: string;
  taxonomy: {
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
    genus: string;
    species: string;
  };
  iucn_status: string;
  iucn_code: string;
  description: string;
  habitat: string;
  diet: string;
  distribution: string[];
}

export const speciesDatabase: Record<string, SpeciesKnowledge> = {
  "pavo cristatus": {
    scientific_name: "Pavo cristatus",
    common_name: "Indian Peafowl",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Galliformes",
      family: "Phasianidae",
      genus: "Pavo",
      species: "P. cristatus"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "The national bird of India, celebrated for its brilliant fan-shaped crest and iridescent blue-green plumage. Males exhibit elaborate train feathers used in mating rituals. Commonly found in moist and dry deciduous forests, woodlands, and agricultural regions.",
    habitat: "Forest",
    diet: "Omnivore",
    distribution: ["India", "South Asia"]
  },
  "corvus splendens": {
    scientific_name: "Corvus splendens",
    common_name: "House Crow",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Passeriformes",
      family: "Corvidae",
      genus: "Corvus",
      species: "C. splendens"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A highly intelligent and highly adaptable passerine bird native to the Indian subcontinent. Characterized by a gray collar on its neck separating a black head and breast. They thrive in urban areas and agricultural lands, feeding on a diverse range of organic materials.",
    habitat: "Agricultural Land",
    diet: "Omnivore",
    distribution: ["India", "South Asia"]
  },
  "eudynamys scolopaceus": {
    scientific_name: "Eudynamys scolopaceus",
    common_name: "Asian Koel",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Cuculiformes",
      family: "Cuculidae",
      genus: "Eudynamys",
      species: "E. scolopaceus"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A large brood parasitic cuckoo species native to South and Southeast Asia. Males are glossy black with ruby-red eyes, whereas females are brownish-grey with white spots. Renowned for its distinctive, loud calling behavior during the summer mating season.",
    habitat: "Forest",
    diet: "Frugivore",
    distribution: ["India", "South Asia", "Southeast Asia"]
  },
  "psilopogon haemacephalus": {
    scientific_name: "Psilopogon haemacephalus",
    common_name: "Coppersmith Barbet",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Piciformes",
      family: "Megalaimidae",
      genus: "Psilopogon",
      species: "P. haemacephalus"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A colorful, small barbet found in South and Southeast Asia. Recognizable by its red forehead, yellow throat, and a repetitive metallic call resembling a coppersmith striking metal. It nests in tree cavities excavated by chiseling with its stout beak.",
    habitat: "Forest",
    diet: "Frugivore",
    distribution: ["India", "South Asia", "Southeast Asia"]
  },
  "pitta brachyura": {
    scientific_name: "Pitta brachyura",
    common_name: "Indian Pitta",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Passeriformes",
      family: "Pittidae",
      genus: "Pitta",
      species: "P. brachyura"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A medium-sized colorful passerine bird that breeds in the foothills of the Himalayas and winters in southern India. It has a striking nine-colored plumage and lives mostly on the forest floor, flipping leaf litter to hunt for insects.",
    habitat: "Forest",
    diet: "Insectivore",
    distribution: ["India", "South Asia"]
  },
  "psittacula krameri": {
    scientific_name: "Psittacula krameri",
    common_name: "Rose-ringed Parakeet",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Psittaciformes",
      family: "Psittaculidae",
      genus: "Psittacula",
      species: "P. krameri"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A medium-sized parrot species native to Africa and the Indian Subcontinent. Features a brilliant green plumage with rose-red neck rings on mature males. They are highly social, noisy, and consume wild seeds, fruits, and agricultural crops.",
    habitat: "Agricultural Land",
    diet: "Herbivore",
    distribution: ["India", "South Asia", "Africa"]
  },
  "acridotheres tristis": {
    scientific_name: "Acridotheres tristis",
    common_name: "Common Myna",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Passeriformes",
      family: "Sturnidae",
      genus: "Acridotheres",
      species: "A. tristis"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A brown passerine bird native to Asia, recognized by its yellow eye patch, beak, and legs. An extremely vocal scavenger that is highly adapted to urban settings. It feeds aggressively on insects, seeds, and scraps.",
    habitat: "Agricultural Land",
    diet: "Omnivore",
    distribution: ["India", "South Asia"]
  },
  "milvus migrans": {
    scientific_name: "Milvus migrans",
    common_name: "Black Kite",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Accipitrifomes",
      family: "Accipitridae",
      genus: "Milvus",
      species: "M. migrans"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A medium-sized bird of prey belonging to the family Accipitridae. Recognizable by its shallow-forked tail and soaring flight patterns. They are highly opportunistic predators and scavengers frequently spotted over urban landfills and river banks.",
    habitat: "Grassland",
    diet: "Carnivore",
    distribution: ["India", "South Asia", "Africa", "Europe"]
  },
  "pycnonotus cafer": {
    scientific_name: "Pycnonotus cafer",
    common_name: "Red-vented Bulbul",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Passeriformes",
      family: "Pycnonotidae",
      genus: "Pycnonotus",
      species: "P. cafer"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A prominent bulbul easily distinguished by its dark crest and red undertail feathers. Native across the Indian Subcontinent, it inhabits scrub forest, gardens, and agricultural land. Primarily feeds on fruits, flower buds, and insects.",
    habitat: "Forest",
    diet: "Omnivore",
    distribution: ["India", "South Asia"]
  },
  "copsychus saularis": {
    scientific_name: "Copsychus saularis",
    common_name: "Oriental Magpie-Robin",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Passeriformes",
      family: "Muscicapidae",
      genus: "Copsychus",
      species: "C. saularis"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A distinctive black-and-white robin native to South and Southeast Asia. They are renowned for their complex, melodic whistles and upright tails. Regularly found in open forests, agricultural borders, and urban parks.",
    habitat: "Forest",
    diet: "Insectivore",
    distribution: ["India", "South Asia", "Southeast Asia"]
  },
  "ploceus philippinus": {
    scientific_name: "Ploceus philippinus",
    common_name: "Baya Weaver",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Passeriformes",
      family: "Ploceidae",
      genus: "Ploceus",
      species: "P. philippinus"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A sparrow-sized weaver bird found across the Indian Subcontinent. Famous for nesting colonies of complex, retort-shaped hanging nests woven from grass strips. Breeding males display a bright yellow crown and breast mantle.",
    habitat: "Grassland",
    diet: "Granivore",
    distribution: ["India", "South Asia"]
  },
  "buceros bicornis": {
    scientific_name: "Buceros bicornis",
    common_name: "Great Indian Hornbill",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Bucerotiformes",
      family: "Bucerotidae",
      genus: "Buceros",
      species: "B. bicornis"
    },
    iucn_status: "Vulnerable",
    iucn_code: "VU",
    description: "A magnificent bird of the tropical rainforest canopy, characterized by a massive yellow and black bill with a prominent helmet-like casque. It plays a crucial ecological role as a seed disperser. Indicated as Vulnerable due to logging and habitat loss.",
    habitat: "Forest",
    diet: "Frugivore",
    distribution: ["India", "South Asia", "Southeast Asia"]
  },
  "passer domesticus": {
    scientific_name: "Passer domesticus",
    common_name: "House Sparrow",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Passeriformes",
      family: "Passeridae",
      genus: "Passer",
      species: "P. domesticus"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A small, globally abundant bird belonging to the sparrow family. Characterized by brown, grey, and black coloration with males displaying dark chest bibs. Strongly associated with human habitations and rural farms.",
    habitat: "Agricultural Land",
    diet: "Granivore",
    distribution: ["India", "South Asia", "Europe", "Americas"]
  },
  "columba livia": {
    scientific_name: "Columba livia",
    common_name: "Rock Pigeon",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Columbiformes",
      family: "Columbidae",
      genus: "Columba",
      species: "C. livia"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A stout bird characterized by slate-grey plumage, double wing bars, and iridescent neck collars. Originally nesting on sea cliffs and mountain ledges, it has successfully colonized urban crevices worldwide. Feeds on seeds, grains, and food debris.",
    habitat: "Mountain",
    diet: "Granivore",
    distribution: ["India", "South Asia", "Europe", "Africa"]
  },
  "bubulcus ibis": {
    scientific_name: "Bubulcus ibis",
    common_name: "Cattle Egret",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Pelecaniformes",
      family: "Ardeidae",
      genus: "Bubulcus",
      species: "B. ibis"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A cosmopolitan heron species with pure white plumage, yellow bill, and light legs. Regularly seen accompanying grazing cattle to feed on kicked-up ticks and grasshoppers. Highly social, nesting in noisy colonies near water channels.",
    habitat: "Wetland",
    diet: "Carnivore",
    distribution: ["India", "South Asia", "Africa", "Europe"]
  },
  "coracias benghalensis": {
    scientific_name: "Coracias benghalensis",
    common_name: "Indian Roller",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Coraciiformes",
      family: "Coraciidae",
      genus: "Coracias",
      species: "C. benghalensis"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "Famous for its spectacular aerobatic flight displays during mating rituals. Shows striking blue wing feathers when in flight. Primarily feeds on ground beetles, small reptiles, and frogs from low tree branches.",
    habitat: "Grassland",
    diet: "Carnivore",
    distribution: ["India", "South Asia"]
  },
  "spilopelia chinensis": {
    scientific_name: "Spilopelia chinensis",
    common_name: "Spotted Dove",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Columbiformes",
      family: "Columbidae",
      genus: "Spilopelia",
      species: "S. chinensis"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A small, long-tailed pigeon with a distinct black half-collar speckled with white spots on the neck. Extremely common in open forest and suburban habitats across Asia. Ground foragers eating grass seeds, grain, and fallen buds.",
    habitat: "Agricultural Land",
    diet: "Granivore",
    distribution: ["India", "South Asia", "Southeast Asia"]
  },
  "accipiter badius": {
    scientific_name: "Accipiter badius",
    common_name: "Shikra",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Accipitriformes",
      family: "Accipitridae",
      genus: "Accipiter",
      species: "A. badius"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A small bird of prey native to Asia and Africa. Possesses short rounded wings and a long tail suitable for maneuvering forest trees. Hunts lizards, small rodents, frogs, and grasshoppers from concealed tree branches.",
    habitat: "Forest",
    diet: "Carnivore",
    distribution: ["India", "South Asia", "Africa"]
  },
  "cinnyris asiaticus": {
    scientific_name: "Cinnyris asiaticus",
    common_name: "Purple Sunbird",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Passeriformes",
      family: "Nectariniidae",
      genus: "Cinnyris",
      species: "C. asiaticus"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A small sunbird with a downcurved bill specialized for nectar extraction. Breeding males have a brilliant purple-black iridescent plumage. They hover and fly rapidly to feed on forest flowers and garden shrubs.",
    habitat: "Forest",
    diet: "Nectarivore",
    distribution: ["India", "South Asia", "Middle East"]
  },
  "dicrurus adsimilis": {
    scientific_name: "Dicrurus adsimilis",
    common_name: "Fork-tailed Drongo",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Passeriformes",
      family: "Dicruridae",
      genus: "Dicrurus",
      species: "D. adsimilis"
    },
    iucn_status: "Least Concern",
    iucn_code: "LC",
    description: "A glossy black bird characterized by a prominent fork-tipped tail. Renowned for mimicry, aggressive defense of nest territory, and hunting flying insects from open branches. Found in savannahs, woodland edges, and scrub forest.",
    habitat: "Grassland",
    diet: "Insectivore",
    distribution: ["India", "South Asia", "Africa"]
  }
};

export const getSpeciesKnowledge = (name: string): SpeciesKnowledge | null => {
  if (!name) return null;
  const clean = name.toLowerCase().trim();
  
  // Try scientific name first
  if (speciesDatabase[clean]) {
    return speciesDatabase[clean];
  }
  
  // Try searching by common name
  const found = Object.values(speciesDatabase).find(
    (s) => s.common_name.toLowerCase() === clean
  );
  
  return found || null;
};
