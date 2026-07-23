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
  
  // Extended fields
  threat_level?: string;
  conservation_priority?: string;
  protection_recommendations?: string;
  habitat_suitability?: string;
  human_wildlife_conflict?: string;
  anti_poaching_recommendations?: string;
}

export const speciesDatabase: Record<string, SpeciesKnowledge> = {
  // 1. Indian Peafowl
  "pavo cristatus": {
    scientific_name: "Pavo cristatus",
    common_name: "Indian Peafowl",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Galliformes", family: "Phasianidae", genus: "Pavo", species: "P. cristatus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "The national bird of India, celebrated for its brilliant fan-shaped crest and iridescent blue-green plumage. Males exhibit elaborate train feathers used in mating rituals. Commonly found in moist and dry deciduous forests, woodlands, and agricultural regions.",
    habitat: "Forests, Scrublands, Cultivated Lands", diet: "Omnivore (Seeds, Insects, Small Reptiles)", distribution: ["India", "South Asia"]
  },
  "peacock": {
    scientific_name: "Pavo cristatus",
    common_name: "Indian Peafowl",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Galliformes", family: "Phasianidae", genus: "Pavo", species: "P. cristatus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "The national bird of India, celebrated for its brilliant fan-shaped crest and iridescent blue-green plumage. Males exhibit elaborate train feathers used in mating rituals. Commonly found in moist and dry deciduous forests, woodlands, and agricultural regions.",
    habitat: "Forests, Scrublands, Cultivated Lands", diet: "Omnivore (Seeds, Insects, Small Reptiles)", distribution: ["India", "South Asia"]
  },
  // 2. House Crow
  "corvus splendens": {
    scientific_name: "Corvus splendens",
    common_name: "House Crow",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Corvidae", genus: "Corvus", species: "C. splendens" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A highly intelligent and highly adaptable passerine bird native to the Indian subcontinent. Characterized by a gray collar on its neck separating a black head and breast. They thrive in urban areas and agricultural lands, feeding on a diverse range of organic materials.",
    habitat: "Agricultural Land, Urban Centers", diet: "Omnivore (Seeds, Scraps, Insects)", distribution: ["India", "South Asia"]
  },
  // 3. Asian Koel
  "eudynamys scolopaceus": {
    scientific_name: "Eudynamys scolopaceus",
    common_name: "Asian Koel",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Cuculiformes", family: "Cuculidae", genus: "Eudynamys", species: "E. scolopaceus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A large brood parasitic cuckoo species native to South and Southeast Asia. Males are glossy black with ruby-red eyes, whereas females are brownish-grey with white spots. Renowned for its distinctive, loud calling behavior during the summer mating season.",
    habitat: "Deciduous Woodlands, Gardens", diet: "Frugivore (Fruits, Berries)", distribution: ["India", "South Asia", "Southeast Asia"]
  },
  // 4. Coppersmith Barbet
  "psilopogon haemacephalus": {
    scientific_name: "Psilopogon haemacephalus",
    common_name: "Coppersmith Barbet",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Piciformes", family: "Megalaimidae", genus: "Psilopogon", species: "P. haemacephalus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A colorful, small barbet found in South and Southeast Asia. Recognizable by its red forehead, yellow throat, and a repetitive metallic call resembling a coppersmith striking metal. It nests in tree cavities excavated by chiseling with its stout beak.",
    habitat: "Woodlands, Urban Gardens", diet: "Frugivore (Figs, Wild Fruits)", distribution: ["India", "South Asia", "Southeast Asia"]
  },
  // 5. Indian Pitta
  "pitta brachyura": {
    scientific_name: "Pitta brachyura",
    common_name: "Indian Pitta",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Pittidae", genus: "Pitta", species: "P. brachyura" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A medium-sized colorful passerine bird that breeds in the foothills of the Himalayas and winters in southern India. It has a striking nine-colored plumage and lives mostly on the forest floor, flipping leaf litter to hunt for insects.",
    habitat: "Undergrowth of Deciduous Forests, Scrub", diet: "Insectivore (Insects, Grubs, Worms)", distribution: ["India", "South Asia"]
  },
  // 6. Rose-ringed Parakeet
  "psittacula krameri": {
    scientific_name: "Psittacula krameri",
    common_name: "Rose-ringed Parakeet",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Psittaciformes", family: "Psittaculidae", genus: "Psittacula", species: "P. krameri" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A medium-sized parrot species native to Africa and the Indian Subcontinent. Features a brilliant green plumage with rose-red neck rings on mature males. They are highly social, noisy, and consume wild seeds, fruits, and agricultural crops.",
    habitat: "Agricultural Land, Urban Areas", diet: "Herbivore (Seeds, Fruits, Nectar)", distribution: ["India", "South Asia", "Africa"]
  },
  // 7. Common Myna
  "acridotheres tristis": {
    scientific_name: "Acridotheres tristis",
    common_name: "Common Myna",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Sturnidae", genus: "Acridotheres", species: "A. tristis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A brown passerine bird native to Asia, recognized by its yellow eye patch, beak, and legs. An extremely vocal scavenger that is highly adapted to urban settings. It feeds aggressively on insects, seeds, and scraps.",
    habitat: "Agricultural Land, Cities, Open Forests", diet: "Omnivore (Insects, Grains, Scraps)", distribution: ["India", "South Asia"]
  },
  // 8. Black Kite
  "milvus migrans": {
    scientific_name: "Milvus migrans",
    common_name: "Black Kite",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Accipitriformes", family: "Accipitridae", genus: "Milvus", species: "M. migrans" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A medium-sized bird of prey belonging to the family Accipitridae. Recognizable by its shallow-forked tail and soaring flight patterns. They are highly opportunistic predators and scavengers frequently spotted over urban landfills and river banks.",
    habitat: "Grasslands, Wetlands, Cities", diet: "Carnivore (Small Mammals, Fish, Carrion)", distribution: ["India", "South Asia", "Africa", "Europe"]
  },
  // 9. Red-vented Bulbul
  "pycnonotus cafer": {
    scientific_name: "Pycnonotus cafer",
    common_name: "Red-vented Bulbul",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Pycnonotidae", genus: "Pycnonotus", species: "P. cafer" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A prominent bulbul easily distinguished by its dark crest and red undertail feathers. Native across the Indian Subcontinent, it inhabits scrub forest, gardens, and agricultural land. Primarily feeds on fruits, flower buds, and insects.",
    habitat: "Deciduous Forests, Gardens, Scrub lands", diet: "Omnivore (Fruits, Nectar, Insects)", distribution: ["India", "South Asia"]
  },
  // 10. Oriental Magpie-Robin
  "copsychus saularis": {
    scientific_name: "Copsychus saularis",
    common_name: "Oriental Magpie-Robin",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Muscicapidae", genus: "Copsychus", species: "C. saularis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A distinctive black-and-white robin native to South and Southeast Asia. They are renowned for their complex, melodic whistles and upright tails. Regularly found in open forests, agricultural borders, and urban parks.",
    habitat: "Open Woodlands, Cultivated Gardens", diet: "Insectivore (Insects, Earthworms)", distribution: ["India", "South Asia", "Southeast Asia"]
  },
  // 11. Baya Weaver
  "ploceus philippinus": {
    scientific_name: "Ploceus philippinus",
    common_name: "Baya Weaver",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Ploceidae", genus: "Ploceus", species: "P. philippinus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A sparrow-sized weaver bird found across the Indian Subcontinent. Famous for nesting colonies of complex, retort-shaped hanging nests woven from grass strips. Breeding males display a bright yellow crown and breast mantle.",
    habitat: "Grassland, Wetland Edges, Farmlands", diet: "Granivore (Grass Seeds, Rice Grains)", distribution: ["India", "South Asia"]
  },
  // 12. Great Indian Hornbill
  "buceros bicornis": {
    scientific_name: "Buceros bicornis",
    common_name: "Great Indian Hornbill",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Bucerotiformes", family: "Bucerotidae", genus: "Buceros", species: "B. bicornis" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "A magnificent bird of the tropical rainforest canopy, characterized by a massive yellow and black bill with a prominent helmet-like casque. It plays a crucial ecological role as a seed disperser. Indicated as Vulnerable due to logging and habitat loss.",
    habitat: "Primary Wet Evergreen Forests", diet: "Frugivore (Figs, Wild Nutmeg, Small Vertebrates)", distribution: ["India", "South Asia", "Southeast Asia"]
  },
  // 13. House Sparrow
  "passer domesticus": {
    scientific_name: "Passer domesticus",
    common_name: "House Sparrow",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Passeridae", genus: "Passer", species: "P. domesticus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small, globally abundant bird belonging to the sparrow family. Characterized by brown, grey, and black coloration with males displaying dark chest bibs. Strongly associated with human habitations and rural farms.",
    habitat: "Urban and Suburban Neighborhoods, Farms", diet: "Granivore (Seeds, Grains, Small Insects)", distribution: ["India", "South Asia", "Europe", "Americas"]
  },
  // 14. Rock Pigeon
  "columba livia": {
    scientific_name: "Columba livia",
    common_name: "Rock Pigeon",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Columbiformes", family: "Columbidae", genus: "Columba", species: "C. livia" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A stout bird characterized by slate-grey plumage, double wing bars, and iridescent neck collars. Originally nesting on sea cliffs and mountain ledges, it has successfully colonized urban crevices worldwide. Feeds on seeds, grains, and food debris.",
    habitat: "Cliffs, Rocky Canyons, Urban Ledges", diet: "Granivore (Seeds, Grains, Food Waste)", distribution: ["India", "South Asia", "Europe", "Africa"]
  },
  // 15. Cattle Egret
  "bubulcus ibis": {
    scientific_name: "Bubulcus ibis",
    common_name: "Cattle Egret",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Pelecaniformes", family: "Ardeidae", genus: "Bubulcus", species: "B. ibis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A cosmopolitan heron species with pure white plumage, yellow bill, and light legs. Regularly seen accompanying grazing cattle to feed on kicked-up ticks and grasshoppers. Highly social, nesting in noisy colonies near water channels.",
    habitat: "Wetlands, Pastures, Agricultural Lands", diet: "Carnivore (Insects, Frogs, Small Fish)", distribution: ["India", "South Asia", "Africa", "Europe"]
  },
  // 16. Indian Roller
  "coracias benghalensis": {
    scientific_name: "Coracias benghalensis",
    common_name: "Indian Roller",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Coraciiformes", family: "Coraciidae", genus: "Coracias", species: "C. benghalensis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Famous for its spectacular aerobatic flight displays during mating rituals. Shows striking blue wing feathers when in flight. Primarily feeds on ground beetles, small reptiles, and frogs from low tree branches.",
    habitat: "Open Grasslands, Scrub Forests, Roadside Perches", diet: "Carnivore (Beetles, Lizards, Frogs)", distribution: ["India", "South Asia"]
  },
  // 17. Spotted Dove
  "spilopelia chinensis": {
    scientific_name: "Spilopelia chinensis",
    common_name: "Spotted Dove",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Columbiformes", family: "Columbidae", genus: "Spilopelia", species: "S. chinensis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small, long-tailed pigeon with a distinct black half-collar speckled with white spots on the neck. Extremely common in open forest and suburban habitats across Asia. Ground foragers eating grass seeds, grain, and fallen buds.",
    habitat: "Dry Deciduous Woodlands, Gardens", diet: "Granivore (Seeds, Grains, Fallen Buds)", distribution: ["India", "South Asia", "Southeast Asia"]
  },
  // 18. Shikra
  "accipiter badius": {
    scientific_name: "Accipiter badius",
    common_name: "Shikra",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Accipitriformes", family: "Accipitridae", genus: "Accipiter", species: "A. badius" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small bird of prey native to Asia and Africa. Possesses short rounded wings and a long tail suitable for maneuvering forest trees. Hunts lizards, small rodents, frogs, and grasshoppers from concealed tree branches.",
    habitat: "Deciduous Forests, Savannahs, Urban Parks", diet: "Carnivore (Lizards, Rodents, Frogs, Small Birds)", distribution: ["India", "South Asia", "Africa"]
  },
  // 19. Purple Sunbird
  "cinnyris asiaticus": {
    scientific_name: "Cinnyris asiaticus",
    common_name: "Purple Sunbird",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Nectariniidae", genus: "Cinnyris", species: "C. asiaticus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small sunbird with a downcurved bill specialized for nectar extraction. Breeding males have a brilliant purple-black iridescent plumage. They hover and fly rapidly to feed on forest flowers and garden shrubs.",
    habitat: "Gardens, Deciduous Forests, Scrublands", diet: "Nectarivore (Nectar, Small Insects)", distribution: ["India", "South Asia", "Middle East"]
  },
  // 20. Fork-tailed Drongo
  "dicrurus adsimilis": {
    scientific_name: "Dicrurus adsimilis",
    common_name: "Fork-tailed Drongo",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Dicruridae", genus: "Dicrurus", species: "D. adsimilis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A glossy black bird characterized by a prominent fork-tipped tail. Renowned for mimicry, aggressive defense of nest territory, and hunting flying insects from open branches. Found in savannahs, woodland edges, and scrub forest.",
    habitat: "Open Savannahs, Wooded Grasslands", diet: "Insectivore (Termites, Bees, Flies)", distribution: ["India", "South Asia", "Africa"]
  },
  
  // -- YOLO & LEOPARD CLASSES --
  // 21. Tiger
  "tiger": {
    scientific_name: "Panthera tigris",
    common_name: "Tiger",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Felidae", genus: "Panthera", species: "P. tigris" },
    iucn_status: "Endangered", iucn_code: "EN",
    description: "The largest of all wild cat species. Instantly recognizable by its vertical orange and black stripes. An apex predator that plays a crucial role in maintaining the structure of forest ecosystems.",
    habitat: "Tropical Forests, Mangroves, Grasslands", diet: "Carnivore (Deer, Wild Boar, Gaur)", distribution: ["India", "Southeast Asia", "Siberia"]
  },
  // 22. Lion
  "lion": {
    scientific_name: "Panthera leo",
    common_name: "Lion",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Felidae", genus: "Panthera", species: "P. leo" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "A muscular, deep-chested wild cat with a prominent social structure called a pride. Males display thick dark manes. Key umbrella species for savannah ecosystems.",
    habitat: "Open Savannahs, Grasslands, Shrublands", diet: "Carnivore (Wildebeest, Zebras, Antelopes)", distribution: ["Sub-Saharan Africa", "Gir Forest (India)"]
  },
  // 23. Leopard
  "leopard": {
    scientific_name: "Panthera pardus",
    common_name: "Leopard",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Felidae", genus: "Panthera", species: "P. pardus" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "A highly adaptable wild cat with rosette-patterned fur, renowned for its climbing ability and strength, often hauling heavy carcasses up tree branches.",
    habitat: "Rainforests, Savannahs, Grasslands, Mountains", diet: "Carnivore (Deer, Rodents, Monkeys)", distribution: ["Africa", "Asia", "India"]
  },
  // 24. Indian Leopard
  "indian leopard": {
    scientific_name: "Panthera pardus fusca",
    common_name: "Indian Leopard",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Felidae", genus: "Panthera", species: "P. pardus fusca" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "A leopard subspecies native to the Indian Subcontinent. Highly elusive, solitary, and nocturnal. Well known for coexisting in close proximity to human settlements.",
    habitat: "Deciduous Forests, Scrublands, Agricultural Borders", diet: "Carnivore (Langurs, Chital, Hare, Pigs)", distribution: ["India", "Nepal", "Bhutan"]
  },
  // 25. Cheetah
  "cheetah": {
    scientific_name: "Acinonyx jubatus",
    common_name: "Cheetah",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Felidae", genus: "Acinonyx", species: "A. jubatus" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "The fastest land mammal on Earth, characterized by a slender body, deep chest, black teardrop facial lines, and spotted coat. Hunts during the day to avoid larger predators.",
    habitat: "Savannahs, Grasslands, Semiarid Deserts", diet: "Carnivore (Gazelles, Impalas, Hares)", distribution: ["Africa", "Central Iran"]
  },
  // 26. Giraffe
  "giraffe": {
    scientific_name: "Giraffa camelopardalis",
    common_name: "Giraffe",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Artiodactyla", family: "Giraffidae", genus: "Giraffa", species: "G. camelopardalis" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "The tallest living terrestrial animal. Features an extremely long neck, unique coat patch patterns, and horn-like ossicones. Feeds on high tree leaves using its long prehensile tongue.",
    habitat: "Savannas, Grasslands, Open Woodlands", diet: "Herbivore (Acacia Leaves, Shoots)", distribution: ["Sub-Saharan Africa"]
  },
  // 27. Asian Elephant
  "elephant": {
    scientific_name: "Elephas maximus",
    common_name: "Asian Elephant",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Proboscidea", family: "Elephantidae", genus: "Elephas", species: "E. maximus" },
    iucn_status: "Endangered", iucn_code: "EN",
    description: "A massive herbivorous mammal distinguished by its dexterous trunk, smaller ears than its African relative, and highly developed social intelligence.",
    habitat: "Tropical Rainforests, Scrublands, Grasslands", diet: "Herbivore (Grass, Leaves, Bamboo, Bark)", distribution: ["India", "Southeast Asia"]
  },
  // 28. Rhinoceros
  "rhinoceros": {
    scientific_name: "Rhinocerotidae",
    common_name: "Rhinoceros",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Perissodactyla", family: "Rhinocerotidae", genus: "Rhinoceros", species: "R. unicornis" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "A large thick-skinned odd-toed ungulate characterized by one or two prominent horns. Highly threatened by poaching for horn trade.",
    habitat: "Alluvial Grasslands, Swamps, Shrublands", diet: "Herbivore (Grasses, Aquatic Plants, Shrubs)", distribution: ["Africa", "South Asia", "India"]
  },
  "rhino": {
    scientific_name: "Rhinocerotidae",
    common_name: "Rhinoceros",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Perissodactyla", family: "Rhinocerotidae", genus: "Rhinoceros", species: "R. unicornis" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "A large thick-skinned odd-toed ungulate characterized by one or two prominent horns. Highly threatened by poaching for horn trade.",
    habitat: "Alluvial Grasslands, Swamps, Shrublands", diet: "Herbivore (Grasses, Aquatic Plants, Shrubs)", distribution: ["Africa", "South Asia", "India"]
  },
  // 29. Hippopotamus
  "hippopotamus": {
    scientific_name: "Hippopotamus amphibius",
    common_name: "Hippopotamus",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Artiodactyla", family: "Hippopotamidae", genus: "Hippopotamus", species: "H. amphibius" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "A large, semiaquatic mammal native to sub-Saharan Africa. Renowned for its barrel-shaped body, massive canine teeth, and territorial behavior in water channels.",
    habitat: "Rivers, Lakes, Wetland Swamps", diet: "Herbivore (Short Grasses)", distribution: ["Sub-Saharan Africa"]
  },
  "hippo": {
    scientific_name: "Hippopotamus amphibius",
    common_name: "Hippopotamus",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Artiodactyla", family: "Hippopotamidae", genus: "Hippopotamus", species: "H. amphibius" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "A large, semiaquatic mammal native to sub-Saharan Africa. Renowned for its barrel-shaped body, massive canine teeth, and territorial behavior in water channels.",
    habitat: "Rivers, Lakes, Wetland Swamps", diet: "Herbivore (Short Grasses)", distribution: ["Sub-Saharan Africa"]
  },
  // 30. Gorilla
  "gorilla": {
    scientific_name: "Gorilla gorilla",
    common_name: "Gorilla",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Primates", family: "Hominidae", genus: "Gorilla", species: "G. gorilla" },
    iucn_status: "Critically Endangered", iucn_code: "CR",
    description: "The largest living primate, possessing a stocky build, broad chest, and dark skin. Lives in structured family groups led by an older silverback male.",
    habitat: "Subtropical and Montane Rain Forests", diet: "Herbivore (Foliage, Stems, Shoots, Fruits)", distribution: ["Equatorial Central Africa"]
  },
  // 31. Bear / Brown Bear
  "bear": {
    scientific_name: "Ursidae",
    common_name: "Bear",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Ursidae", genus: "Ursus", species: "Ursus" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "Large mammalian carnivores characterized by heavy bodies, thick fur, stocky legs, and short tails. Possess a keen sense of smell and complex hibernation behaviors.",
    habitat: "Temperate Forests, Tundra, Mountains", diet: "Omnivore (Berries, Insects, Fish, Small Mammals)", distribution: ["Northern Hemisphere", "South America"]
  },
  "brown bear": {
    scientific_name: "Ursus arctos",
    common_name: "Brown Bear",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Ursidae", genus: "Ursus", species: "U. arctos" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A large bear species distributed across northern Eurasia and North America. Notable for its hump of muscle over its shoulders and ability to catch migrating salmon.",
    habitat: "Temperate Forests, Alpine Meadows, Coastal Estuaries", diet: "Omnivore (Salmon, Roots, Berries, Grasses)", distribution: ["Eurasia", "North America"]
  },
  "brown-bear": {
    scientific_name: "Ursus arctos",
    common_name: "Brown Bear",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Ursidae", genus: "Ursus", species: "U. arctos" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A large bear species distributed across northern Eurasia and North America. Notable for its hump of muscle over its shoulders and ability to catch migrating salmon.",
    habitat: "Temperate Forests, Alpine Meadows, Coastal Estuaries", diet: "Omnivore (Salmon, Roots, Berries, Grasses)", distribution: ["Eurasia", "North America"]
  },
  // 32. Polar Bear
  "polar bear": {
    scientific_name: "Ursus maritimus",
    common_name: "Polar Bear",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Ursidae", genus: "Ursus", species: "U. maritimus" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "A hypercarnivorous bear whose native range lies largely within the Arctic Circle. Highly adapted to marine life, with thick fat layers and water-repellent fur.",
    habitat: "Arctic Sea Ice, Coastal Tundra", diet: "Carnivore (Ringed Seals, Bearded Seals)", distribution: ["Arctic Circle"]
  },
  "polar-bear": {
    scientific_name: "Ursus maritimus",
    common_name: "Polar Bear",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Ursidae", genus: "Ursus", species: "U. maritimus" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "A hypercarnivorous bear whose native range lies largely within the Arctic Circle. Highly adapted to marine life, with thick fat layers and water-repellent fur.",
    habitat: "Arctic Sea Ice, Coastal Tundra", diet: "Carnivore (Ringed Seals, Bearded Seals)", distribution: ["Arctic Circle"]
  },
  // 33. Wolf
  "wolf": {
    scientific_name: "Canis lupus",
    common_name: "Wolf",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Canidae", genus: "Canis", species: "C. lupus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A highly social wild canine species, hunting in packs led by dominant breeding pairs. Play a critical role in controlling herbivore populations in northern ecosystems.",
    habitat: "Forests, Grasslands, Mountains, Tundra", diet: "Carnivore (Deer, Elk, Moose, Small Hares)", distribution: ["North America", "Eurasia"]
  },
  // 34. Red Fox
  "fox": {
    scientific_name: "Vulpes vulpes",
    common_name: "Red Fox",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Canidae", genus: "Vulpes", species: "V. vulpes" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "The largest of the true foxes, characterized by a bright orange-red coat, white chest, and a fluffy white-tipped tail. Highly resourceful and successful in suburban areas.",
    habitat: "Forest Borders, Woodlands, Meadows, Cities", diet: "Omnivore (Rodents, Birds, Fruits, Insects)", distribution: ["Eurasia", "North America", "Australia"]
  },
  // 35. Deer
  "deer": {
    scientific_name: "Cervidae",
    common_name: "Deer",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Artiodactyla", family: "Cervidae", genus: "Cervus", species: "Cervidae" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Hoofed ruminant mammals known for their branching bony antlers (grown and shed annually by males). Highly alert herbivores with rapid cursorial motion.",
    habitat: "Forests, Woodlands, Grasslands", diet: "Herbivore (Leaves, Shoots, Bark, Grasses)", distribution: ["Worldwide"]
  },
  // 36. Zebra
  "zebra": {
    scientific_name: "Equus quagga",
    common_name: "Zebra",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Perissodactyla", family: "Equidae", genus: "Equus", species: "E. quagga" },
    iucn_status: "Near Threatened", iucn_code: "NT",
    description: "African wild equines instantly recognized by their distinct black and white striped coats. Highly social animals that migrate in massive mixed-species herds.",
    habitat: "Savannah Grasslands, Woodlands", diet: "Herbivore (Coarse Grasses, Shrubs)", distribution: ["East and South Africa"]
  },
  // 37. Crocodile
  "crocodile": {
    scientific_name: "Crocodylidae",
    common_name: "Crocodile",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Reptilia", order: "Crocodilia", family: "Crocodylidae", genus: "Crocodylus", species: "C. palustris" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "Large, semiaquatic predatory reptiles that inhabit tropical regions. Possess powerful jaws, armored skin, and are highly adapted to sit-and-wait hunting in water channels.",
    habitat: "Rivers, Lakes, Lagoons, Swamps", diet: "Carnivore (Fish, Mammals, Waterfowl)", distribution: ["Worldwide Tropics"]
  },
  // 38. Snake / Python Snake
  "snake": {
    scientific_name: "Pythonidae",
    common_name: "Python Snake",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Reptilia", order: "Squamata", family: "Pythonidae", genus: "Python", species: "P. molurus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Elongated, legless, carnivorous reptiles covered in overlapping scales. Capture prey using constriction or venom. Play vital ecological roles in controlling rodent populations.",
    habitat: "Forests, Deserts, Grasslands, Water Bodies", diet: "Carnivore (Rodents, Birds, Eggs)", distribution: ["Worldwide"]
  },
  // 40. Monkey
  "monkey": {
    scientific_name: "Cercopithecidae",
    common_name: "Monkey",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Primates", family: "Cercopithecidae", genus: "Macaca", species: "Cercopithecidae" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Highly social and active primates generally possessing tails. Exhibit advanced problem-solving abilities, dexterous hands, and complex vocal communication.",
    habitat: "Forest Canopies, Scrublands, Urban Areas", diet: "Omnivore (Fruits, Seeds, Leaves, Insects)", distribution: ["Asia", "Africa", "Central/South America"]
  },
  // 41. Pig / Wild Boar
  "pig": {
    scientific_name: "Sus scrofa",
    common_name: "Wild Boar",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Artiodactyla", family: "Suidae", genus: "Sus", species: "S. scrofa" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A stout-bodied suid with a large head, short limbs, and coarse bristle coat. Renowned for their rooting behaviors and high intelligence.",
    habitat: "Deciduous Forests, Scrublands, Agricultural Lands", diet: "Omnivore (Roots, Tubers, Insects, Small Mammals)", distribution: ["Eurasia", "introduced Worldwide"]
  },
  "wild boar": {
    scientific_name: "Sus scrofa",
    common_name: "Wild Boar",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Artiodactyla", family: "Suidae", genus: "Sus", species: "S. scrofa" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A stout-bodied suid with a large head, short limbs, and coarse bristle coat. Renowned for their rooting behaviors and high intelligence.",
    habitat: "Deciduous Forests, Scrublands, Agricultural Lands", diet: "Omnivore (Roots, Tubers, Insects, Small Mammals)", distribution: ["Eurasia", "introduced Worldwide"]
  },
  // 42. Rabbit
  "rabbit": {
    scientific_name: "Oryctolagus cuniculus",
    common_name: "Rabbit",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Lagomorpha", family: "Leporidae", genus: "Oryctolagus", species: "O. cuniculus" },
    iucn_status: "Near Threatened", iucn_code: "NT",
    description: "Small burrowing mammals characterized by long ears, long hind legs, and short fluffy tails. Move using hopping locomotion and feed heavily in meadows.",
    habitat: "Meadows, Shrublands, Forest Borders", diet: "Herbivore (Grasses, Clover, Leaves)", distribution: ["Worldwide"]
  },
  // 43. Horse
  "horse": {
    scientific_name: "Equus caballus",
    common_name: "Horse",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Perissodactyla", family: "Equidae", genus: "Equus", species: "E. caballus" },
    iucn_status: "Domesticated", iucn_code: "DOM",
    description: "Large, single-toed odd-toed ungulates domesticated by humans over 5000 years ago. Widely utilized for transport, agriculture, and companion sports.",
    habitat: "Grasslands, Pastures, Farmlands", diet: "Herbivore (Grasses, Hay, Grains)", distribution: ["Worldwide"]
  },
  // 44. Cow / Cattle
  "cow": {
    scientific_name: "Bos taurus",
    common_name: "Cattle",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Artiodactyla", family: "Bovidae", genus: "Bos", species: "B. taurus" },
    iucn_status: "Domesticated", iucn_code: "DOM",
    description: "Large cloven-hoofed domesticated ruminants. Kept as livestock for meat, milk, and draft labor. Significant modern member of agricultural ecosystems.",
    habitat: "Pastures, Rangelands, Farms", diet: "Herbivore (Grasses, Silage, Hay)", distribution: ["Worldwide"]
  },
  "cattle": {
    scientific_name: "Bos taurus",
    common_name: "Cattle",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Artiodactyla", family: "Bovidae", genus: "Bos", species: "B. taurus" },
    iucn_status: "Domesticated", iucn_code: "DOM",
    description: "Large cloven-hoofed domesticated ruminants. Kept as livestock for meat, milk, and draft labor. Significant modern member of agricultural ecosystems.",
    habitat: "Pastures, Rangelands, Farms", diet: "Herbivore (Grasses, Silage, Hay)", distribution: ["Worldwide"]
  },
  "bull": {
    scientific_name: "Bos taurus",
    common_name: "Cattle",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Artiodactyla", family: "Bovidae", genus: "Bos", species: "B. taurus" },
    iucn_status: "Domesticated", iucn_code: "DOM",
    description: "Large cloven-hoofed domesticated ruminants. Kept as livestock for meat, milk, and draft labor. Significant modern member of agricultural ecosystems.",
    habitat: "Pastures, Rangelands, Farms", diet: "Herbivore (Grasses, Silage, Hay)", distribution: ["Worldwide"]
  },
  // 45. Sheep
  "sheep": {
    scientific_name: "Ovis aries",
    common_name: "Sheep",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Artiodactyla", family: "Bovidae", genus: "Ovis", species: "O. aries" },
    iucn_status: "Domesticated", iucn_code: "DOM",
    description: "Domesticated woolly ruminant mammals. Bred extensively for fleece wool, meat, and milk. Highly gregarious and prone to flocking behaviors.",
    habitat: "Grasslands, Highlands, Farmlands", diet: "Herbivore (Grass, Clover, Legumes)", distribution: ["Worldwide"]
  },
  // 46. Cat
  "cat": {
    scientific_name: "Felis catus",
    common_name: "Cat",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Felidae", genus: "Felis", species: "F. catus" },
    iucn_status: "Domesticated", iucn_code: "DOM",
    description: "Small, carnivorous domestic mammals. Highly skilled predators of rodents and birds, kept widely as companions and household pets.",
    habitat: "Suburban Gardens, Urban Areas, Households", diet: "Carnivore (Meat, Fish, Small Rodents)", distribution: ["Worldwide"]
  },
  // 47. Dog
  "dog": {
    scientific_name: "Canis lupus familiaris",
    common_name: "Dog",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Canidae", genus: "Canis", species: "C. lupus familiaris" },
    iucn_status: "Domesticated", iucn_code: "DOM",
    description: "The first domesticated species, derived from an extinct wolf ancestor. Highly social, loyal, and trained for guard, herding, and companionship work.",
    habitat: "Urban and Rural Human Dwellings", diet: "Omnivore (Grains, Meat, Vegetables)", distribution: ["Worldwide"]
  },
  // 48. Flamingo
  "flamingo": {
    scientific_name: "Phoenicopteridae",
    common_name: "Flamingo",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Phoenicopteriformes", family: "Phoenicopteridae", genus: "Phoenicopterus", species: "P. roseus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Large wading birds famous for their bright pink feathers, long legs, and curved filter-feeding beaks. Feed by stirring up mud in shallow salt lagoons.",
    habitat: "Saline Lakes, Coastal Estuaries, Alkaline Wetlands", diet: "Omnivore (Algae, Brine Shrimp, Molluscs)", distribution: ["Africa", "Asia", "Americas", "Europe"]
  },
  // 49. Heron
  "heron": {
    scientific_name: "Ardeidae",
    common_name: "Heron",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Pelecaniformes", family: "Ardeidae", genus: "Ardea", species: "Ardeidae" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Long-legged, long-necked freshwater wading birds. Hunt patiently by standing motionless at water borders and spearing prey with dagger-like bills.",
    habitat: "Swamps, Wetlands, Lakeshores, Coastal Marshes", diet: "Carnivore (Fish, Frogs, Small Reptiles, Insects)", distribution: ["Worldwide"]
  },
  // 50. Red Junglefowl
  "red junglefowl": {
    scientific_name: "Gallus gallus",
    common_name: "Red Junglefowl",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Galliformes", family: "Phasianidae", genus: "Gallus", species: "G. gallus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A colorful tropical bird of the pheasant family. The primary biological ancestor of the domestic chicken. Displays sexual dimorphism with ornate males.",
    habitat: "Dense Secondary Forests, Scrub Woodlands", diet: "Omnivore (Insects, Grains, Fallen Seeds, Berries)", distribution: ["South and Southeast Asia"]
  },
  
  // -- ADDITIONAL GROUPS (INVERTEBRATES, marine, etc.) --
  // 51. Butterfly
  "butterfly": {
    scientific_name: "Lepidoptera",
    common_name: "Butterfly",
    taxonomy: { kingdom: "Animalia", phylum: "Arthropoda", class: "Insecta", order: "Lepidoptera", family: "Nymphalidae", genus: "Papilio", species: "Lepidoptera" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Beautiful scale-winged insects characterized by a four-stage life cycle (egg, caterpillar, pupa, adult). Play critical roles as flower pollinators.",
    habitat: "Meadows, Forests, Gardens, Meadows", diet: "Herbivore (Flower Nectar, Plant Sap)", distribution: ["Worldwide"]
  },
  "moths-and-butterflies": {
    scientific_name: "Lepidoptera",
    common_name: "Butterfly",
    taxonomy: { kingdom: "Animalia", phylum: "Arthropoda", class: "Insecta", order: "Lepidoptera", family: "Nymphalidae", genus: "Papilio", species: "Lepidoptera" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Beautiful scale-winged insects characterized by a four-stage life cycle (egg, caterpillar, pupa, adult). Play critical roles as flower pollinators.",
    habitat: "Meadows, Forests, Gardens, Meadows", diet: "Herbivore (Flower Nectar, Plant Sap)", distribution: ["Worldwide"]
  },
  // 52. Jellyfish
  "jellyfish": {
    scientific_name: "Medusozoa",
    common_name: "Jellyfish",
    taxonomy: { kingdom: "Animalia", phylum: "Cnidaria", class: "Scyphozoa", order: "Semaeostomeae", family: "Cyaneidae", genus: "Aurelia", species: "Medusozoa" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Gelatinous, free-swimming marine animals with trailing stinging tentacles. Drift in ocean currents and capture plankton and small fish larvae.",
    habitat: "Pelagic Ocean Zones, Shallow Coastal Waters", diet: "Carnivore (Zooplankton, Small Fish, Larvae)", distribution: ["Worldwide Oceans"]
  },
  // 53. Shark
  "shark": {
    scientific_name: "Selachimorpha",
    common_name: "Shark",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Chondrichthyes", order: "Carcharhiniformes", family: "Carcharhinidae", genus: "Carcharhinus", species: "Selachimorpha" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "Cartilaginous predatory fish characterized by five to seven gill slits, multiple rows of replaceable teeth, and sharp placoid dermal scales.",
    habitat: "Marine Marine Pelagic, Shallow Coral Reefs", diet: "Carnivore (Fish, Marine Mammals, Squid)", distribution: ["Worldwide Oceans"]
  },
  
  // -- ADDITIONAL BIRDNET BIRDS GENERATED IN STEP --
  // 54. Rock Pigeon
  "rock pigeon": {
    scientific_name: "Columba livia",
    common_name: "Rock Pigeon",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Columbiformes", family: "Columbidae", genus: "Columba", species: "C. livia" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A stout bird characterized by slate-grey plumage, double wing bars, and iridescent neck collars. Originally nesting on sea cliffs and mountain ledges, it has successfully colonized urban crevices worldwide.",
    habitat: "Cliffs, Rocky Canyons, Urban Ledges", diet: "Granivore (Seeds, Grains, Food Waste)", distribution: ["Worldwide"]
  },
  "pigeon": {
    scientific_name: "Columba livia",
    common_name: "Rock Pigeon",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Columbiformes", family: "Columbidae", genus: "Columba", species: "C. livia" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A stout bird characterized by slate-grey plumage, double wing bars, and iridescent neck collars. Originally nesting on sea cliffs and mountain ledges, it has successfully colonized urban crevices worldwide.",
    habitat: "Cliffs, Rocky Canyons, Urban Ledges", diet: "Granivore (Seeds, Grains, Food Waste)", distribution: ["Worldwide"]
  },
  // 55. House Sparrow
  "house sparrow": {
    scientific_name: "Passer domesticus",
    common_name: "House Sparrow",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Passeridae", genus: "Passer", species: "P. domesticus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small, globally abundant bird belonging to the sparrow family. Characterized by brown, grey, and black coloration with males displaying dark chest bibs.",
    habitat: "Urban and Suburban Neighborhoods, Farms", diet: "Granivore (Seeds, Grains, Small Insects)", distribution: ["Worldwide"]
  },
  "sparrow": {
    scientific_name: "Passer domesticus",
    common_name: "House Sparrow",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Passeridae", genus: "Passer", species: "P. domesticus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small, globally abundant bird belonging to the sparrow family. Characterized by brown, grey, and black coloration with males displaying dark chest bibs.",
    habitat: "Urban and Suburban Neighborhoods, Farms", diet: "Granivore (Seeds, Grains, Small Insects)", distribution: ["Worldwide"]
  },
  // 56. Common Myna
  "common myna": {
    scientific_name: "Acridotheres tristis",
    common_name: "Common Myna",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Sturnidae", genus: "Acridotheres", species: "A. tristis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A brown passerine bird native to Asia, recognized by its yellow eye patch, beak, and legs. An extremely vocal scavenger that is highly adapted to urban settings.",
    habitat: "Agricultural Land, Cities, Open Forests", diet: "Omnivore (Insects, Grains, Scraps)", distribution: ["South Asia"]
  },
  // 57. Jungle Myna
  "jungle myna": {
    scientific_name: "Acridotheres fuscus",
    common_name: "Jungle Myna",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Sturnidae", genus: "Acridotheres", species: "A. fuscus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Similar to the Common Myna but distinguished by a tuft of feathers forming a small crest on its forehead. Feeds heavily around tea plantations and forest edges.",
    habitat: "Forest Margins, Grasslands, Cultivated Valleys", diet: "Omnivore (Insects, Berries, Seeds)", distribution: ["India", "South Asia"]
  },
  // 58. Red-vented Bulbul
  "red-vented bulbul": {
    scientific_name: "Pycnonotus cafer",
    common_name: "Red-vented Bulbul",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Pycnonotidae", genus: "Pycnonotus", species: "P. cafer" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A prominent bulbul easily distinguished by its dark crest and red undertail feathers. Native across the Indian Subcontinent, it inhabits scrub forest and gardens.",
    habitat: "Deciduous Forests, Gardens, Scrub lands", diet: "Omnivore (Fruits, Nectar, Insects)", distribution: ["South Asia"]
  },
  // 59. Red-whiskered Bulbul
  "red-whiskered bulbul": {
    scientific_name: "Pycnonotus jocosus",
    common_name: "Red-whiskered Bulbul",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Pycnonotidae", genus: "Pycnonotus", species: "P. jocosus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Distinguished by a tall pointed black crest, red cheek patches ('whiskers'), and white throat. Highly vocal and active in garden orchards.",
    habitat: "Orchards, Forest Openings, Suburban Gardens", diet: "Frugivore (Fruits, Flower Nectar, Small Beetles)", distribution: ["India", "South Asia"]
  },
  // 60. White-throated Kingfisher
  "white-throated kingfisher": {
    scientific_name: "Halcyon smyrnensis",
    common_name: "White-throated Kingfisher",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Coraciiformes", family: "Alcedinidae", genus: "Halcyon", species: "H. smyrnensis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A large kingfisher with a bright blue back, brown head and shoulders, and a distinct pure white throat patch. Hunts away from water more than other kingfishers.",
    habitat: "Agricultural Plains, Canal Banks, Dry Deciduous Scrub", diet: "Carnivore (Large Insects, Lizards, Small Mice, Frogs)", distribution: ["South Asia", "Middle East"]
  },
  // 61. Common Kingfisher
  "common kingfisher": {
    scientific_name: "Alcedo atthis",
    common_name: "Common Kingfisher",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Coraciiformes", family: "Alcedinidae", genus: "Alcedo", species: "A. atthis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small, sparrow-sized kingfisher with a brilliant metallic-blue back, orange breast, and long dagger bill. Dives rapidly from streamside perches to spear fish.",
    habitat: "Slow-flowing Rivers, Streams, Estuaries", diet: "Carnivore (Small Freshwater Fish, Aquatic Insects)", distribution: ["Europe", "Asia", "North Africa"]
  },
  "kingfisher": {
    scientific_name: "Alcedo atthis",
    common_name: "Common Kingfisher",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Coraciiformes", family: "Alcedinidae", genus: "Alcedo", species: "A. atthis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small, sparrow-sized kingfisher with a brilliant metallic-blue back, orange breast, and long dagger bill. Dives rapidly from streamside perches to spear fish.",
    habitat: "Slow-flowing Rivers, Streams, Estuaries", diet: "Carnivore (Small Freshwater Fish, Aquatic Insects)", distribution: ["Europe", "Asia", "North Africa"]
  },
  // 62. Green Bee-eater
  "green-bee-eater": {
    scientific_name: "Merops orientalis",
    common_name: "Green Bee-eater",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Coraciiformes", family: "Meropidae", genus: "Merops", species: "M. orientalis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A slender green bird with central tail streamers and a black collar line. Expert aerial hunters that capture bees and wasps on the wing, rubbing them on twigs to remove stings.",
    habitat: "Semi-arid Grasslands, Farmlands, Canal Scrubber", diet: "Insectivore (Bees, Wasps, Ants, Dragonflies)", distribution: ["South Asia", "Middle East"]
  },
  "green bee-eater": {
    scientific_name: "Merops orientalis",
    common_name: "Green Bee-eater",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Coraciiformes", family: "Meropidae", genus: "Merops", species: "M. orientalis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A slender green bird with central tail streamers and a black collar line. Expert aerial hunters that capture bees and wasps on the wing, rubbing them on twigs to remove stings.",
    habitat: "Semi-arid Grasslands, Farmlands, Canal Scrubber", diet: "Insectivore (Bees, Wasps, Ants, Dragonflies)", distribution: ["South Asia", "Middle East"]
  },
  // 63. Black Drongo
  "black-drongo": {
    scientific_name: "Dicrurus macrocercus",
    common_name: "Black Drongo",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Dicruridae", genus: "Dicrurus", species: "D. macrocercus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A glossy jet-black bird with a deeply forked tail. Highly aggressive towards larger raptors encroaching on its territory, earning it the nickname 'King Crow'.",
    habitat: "Open Pastures, Agricultural Fences, Canal Scrublands", diet: "Insectivore (Flies, Grasshoppers, Cicadas)", distribution: ["South and Southeast Asia"]
  },
  "black drongo": {
    scientific_name: "Dicrurus macrocercus",
    common_name: "Black Drongo",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Dicruridae", genus: "Dicrurus", species: "D. macrocercus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A glossy jet-black bird with a deeply forked tail. Highly aggressive towards larger raptors encroaching on its territory, earning it the nickname 'King Crow'.",
    habitat: "Open Pastures, Agricultural Fences, Canal Scrublands", diet: "Insectivore (Flies, Grasshoppers, Cicadas)", distribution: ["South and Southeast Asia"]
  },
  // 64. Oriental Magpie Robin
  "oriental magpie robin": {
    scientific_name: "Copsychus saularis",
    common_name: "Oriental Magpie-Robin",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Muscicapidae", genus: "Copsychus", species: "C. saularis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A distinctive black-and-white robin native to South and Southeast Asia. They are renowned for their complex, melodic whistles and upright tails.",
    habitat: "Open Woodlands, Cultivated Gardens", diet: "Insectivore (Insects, Earthworms)", distribution: ["South and Southeast Asia"]
  },
  // 65. Indian Robin
  "indian-robin": {
    scientific_name: "Copsychus fulicatus",
    common_name: "Indian Robin",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Muscicapidae", genus: "Copsychus", species: "C. fulicatus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small bird with a long tail that is frequently cocked upright. Males are glossy black with a white shoulder patch and chestnut undertail coverts.",
    habitat: "Stony Scrublands, Open Dry Woodlands", diet: "Insectivore (Ants, Beetles, Caterpillars)", distribution: ["Indian Subcontinent"]
  },
  "indian robin": {
    scientific_name: "Copsychus fulicatus",
    common_name: "Indian Robin",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Muscicapidae", genus: "Copsychus", species: "C. fulicatus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small bird with a long tail that is frequently cocked upright. Males are glossy black with a white shoulder patch and chestnut undertail coverts.",
    habitat: "Stony Scrublands, Open Dry Woodlands", diet: "Insectivore (Ants, Beetles, Caterpillars)", distribution: ["Indian Subcontinent"]
  },
  // 66. Purple Sunbird
  "purple sunbird": {
    scientific_name: "Cinnyris asiaticus",
    common_name: "Purple Sunbird",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Nectariniidae", genus: "Cinnyris", species: "C. asiaticus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small sunbird with a downcurved bill specialized for nectar extraction. Breeding males have a brilliant purple-black iridescent plumage.",
    habitat: "Gardens, Deciduous Forests, Scrublands", diet: "Nectarivore (Nectar, Small Insects)", distribution: ["South Asia", "Middle East"]
  },
  // 67. Spotted Dove
  "spotted dove": {
    scientific_name: "Spilopelia chinensis",
    common_name: "Spotted Dove",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Columbiformes", family: "Columbidae", genus: "Spilopelia", species: "S. chinensis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small, long-tailed pigeon with a distinct black half-collar speckled with white spots on the neck. Extremely common in open forest and suburban habitats across Asia.",
    habitat: "Dry Deciduous Woodlands, Gardens", diet: "Granivore (Seeds, Grains, Fallen Buds)", distribution: ["South Asia", "Southeast Asia"]
  },
  // 68. Laughing Dove
  "laughing-dove": {
    scientific_name: "Spilopelia senegalensis",
    common_name: "Laughing Dove",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Columbiformes", family: "Columbidae", genus: "Spilopelia", species: "S. senegalensis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small, long-tailed dove with a pinkish-grey head and neck. Named for its soft cooing call that resembles a gentle human chuckle.",
    habitat: "Dry Scrublands, Urban Parks, Semi-deserts", diet: "Granivore (Grass Seeds, Grains, Fallen Buds)", distribution: ["Africa", "Middle East", "India"]
  },
  "laughing dove": {
    scientific_name: "Spilopelia senegalensis",
    common_name: "Laughing Dove",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Columbiformes", family: "Columbidae", genus: "Spilopelia", species: "S. senegalensis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small, long-tailed dove with a pinkish-grey head and neck. Named for its soft cooing call that resembles a gentle human chuckle.",
    habitat: "Dry Scrublands, Urban Parks, Semi-deserts", diet: "Granivore (Grass Seeds, Grains, Fallen Buds)", distribution: ["Africa", "Middle East", "India"]
  },
  // 69. Eurasian Collared Dove
  "eurasian-collared-dove": {
    scientific_name: "Streptopelia decaocto",
    common_name: "Eurasian Collared Dove",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Columbiformes", family: "Columbidae", genus: "Streptopelia", species: "S. decaocto" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A medium-sized dove with a sandy-grey back and a thin black collar ring on the back of its neck. One of the most successful colonizing species in the world.",
    habitat: "Urban Suburbs, Farmlands, Orchard Woodlands", diet: "Granivore (Cereal Grains, Seeds, Small Berries)", distribution: ["Europe", "Asia", "North America"]
  },
  "eurasian collared dove": {
    scientific_name: "Streptopelia decaocto",
    common_name: "Eurasian Collared Dove",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Columbiformes", family: "Columbidae", genus: "Streptopelia", species: "S. decaocto" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A medium-sized dove with a sandy-grey back and a thin black collar ring on the back of its neck. One of the most successful colonizing species in the world.",
    habitat: "Urban Suburbs, Farmlands, Orchard Woodlands", diet: "Granivore (Cereal Grains, Seeds, Small Berries)", distribution: ["Europe", "Asia", "North America"]
  },
  // 70. Greater Coucal
  "greater-coucal": {
    scientific_name: "Centropus sinensis",
    common_name: "Greater Coucal",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Cuculiformes", family: "Cuculidae", genus: "Centropus", species: "C. sinensis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A large, crow-like cuckoo with a glossy black body, chestnut wings, and long tail. Known for its low resonant 'hoop-hoop' calls. Primarily terrestrial hunter.",
    habitat: "Tall Grasslands, Marshy Borders, Scrublands", diet: "Carnivore (Caterpillars, Lizards, Frogs, Bird Eggs)", distribution: ["South and Southeast Asia"]
  },
  "greater coucal": {
    scientific_name: "Centropus sinensis",
    common_name: "Greater Coucal",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Cuculiformes", family: "Cuculidae", genus: "Centropus", species: "C. sinensis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A large, crow-like cuckoo with a glossy black body, chestnut wings, and long tail. Known for its low resonant 'hoop-hoop' calls. Primarily terrestrial hunter.",
    habitat: "Tall Grasslands, Marshy Borders, Scrublands", diet: "Carnivore (Caterpillars, Lizards, Frogs, Bird Eggs)", distribution: ["South and Southeast Asia"]
  },
  // 71. Indian Roller
  "indian roller": {
    scientific_name: "Coracias benghalensis",
    common_name: "Indian Roller",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Coraciiformes", family: "Coraciidae", genus: "Coracias", species: "C. benghalensis" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Famous for its spectacular aerobatic flight displays during mating rituals. Shows striking blue wing feathers when in flight.",
    habitat: "Open Grasslands, Scrub Forests, Roadside Perches", diet: "Carnivore (Beetles, Lizards, Frogs)", distribution: ["South Asia"]
  },
  // 72. Barn Owl
  "barn-owl": {
    scientific_name: "Tyto alba",
    common_name: "Barn Owl",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Strigiformes", family: "Tytonidae", genus: "Tyto", species: "T. alba" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A pale, long-winged nocturnal owl with a distinct white heart-shaped face. Highly specialized hearing allows it to hunt rodents in total darkness.",
    habitat: "Agricultural Barns, Hollow Trees, Cliff Crevices", diet: "Carnivore (Mice, Voles, Shrews, Beetles)", distribution: ["Worldwide"]
  },
  "barn owl": {
    scientific_name: "Tyto alba",
    common_name: "Barn Owl",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Strigiformes", family: "Tytonidae", genus: "Tyto", species: "T. alba" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A pale, long-winged nocturnal owl with a distinct white heart-shaped face. Highly specialized hearing allows it to hunt rodents in total darkness.",
    habitat: "Agricultural Barns, Hollow Trees, Cliff Crevices", diet: "Carnivore (Mice, Voles, Shrews, Beetles)", distribution: ["Worldwide"]
  },
  // 73. Spotted Owlet
  "spotted-owlet": {
    scientific_name: "Athene brama",
    common_name: "Spotted Owlet",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Strigiformes", family: "Strigidae", genus: "Athene", species: "A. brama" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small, stocky owl with yellow eyes and heavily white-spotted brown plumage. Regularly roosts in groups of two or three inside tree hollows.",
    habitat: "Deciduous Woods, Farmlands, Suburb Trees", diet: "Carnivore (Beetles, Lizards, Mice, Locusts)", distribution: ["South Asia"]
  },
  "spotted owlet": {
    scientific_name: "Athene brama",
    common_name: "Spotted Owlet",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Strigiformes", family: "Strigidae", genus: "Athene", species: "A. brama" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small, stocky owl with yellow eyes and heavily white-spotted brown plumage. Regularly roosts in groups of two or three inside tree hollows.",
    habitat: "Deciduous Woods, Farmlands, Suburb Trees", diet: "Carnivore (Beetles, Lizards, Mice, Locusts)", distribution: ["South Asia"]
  },
  // 74. Grey Hornbill
  "grey-hornbill": {
    scientific_name: "Ocyceros birostris",
    common_name: "Indian Grey Hornbill",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Bucerotiformes", family: "Bucerotidae", genus: "Ocyceros", species: "O. birostris" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A medium-sized hornbill characterized by grey body plumage and a black-and-grey casque horn above its curved bill. Plays vital role in seed dispersal.",
    habitat: "Deciduous Forests, Urban Parks, Roadside Fig Trees", diet: "Frugivore (Wild Figs, Berries, Lizards, Eggs)", distribution: ["India", "Nepal"]
  },
  "grey hornbill": {
    scientific_name: "Ocyceros birostris",
    common_name: "Indian Grey Hornbill",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Bucerotiformes", family: "Bucerotidae", genus: "Ocyceros", species: "O. birostris" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A medium-sized hornbill characterized by grey body plumage and a black-and-grey casque horn above its curved bill. Plays vital role in seed dispersal.",
    habitat: "Deciduous Forests, Urban Parks, Roadside Fig Trees", diet: "Frugivore (Wild Figs, Berries, Lizards, Eggs)", distribution: ["India", "Nepal"]
  },
  "indian grey hornbill": {
    scientific_name: "Ocyceros birostris",
    common_name: "Indian Grey Hornbill",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Bucerotiformes", family: "Bucerotidae", genus: "Ocyceros", species: "O. birostris" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A medium-sized hornbill characterized by grey body plumage and a black-and-grey casque horn above its curved bill. Plays vital role in seed dispersal.",
    habitat: "Deciduous Forests, Urban Parks, Roadside Fig Trees", diet: "Frugivore (Wild Figs, Berries, Lizards, Eggs)", distribution: ["India", "Nepal"]
  },
  // 75. Jungle Crow
  "jungle-crow": {
    scientific_name: "Corvus culminatus",
    common_name: "Indian Jungle Crow",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Corvidae", genus: "Corvus", species: "C. culminatus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A large wild crow native to the Indian Subcontinent, completely jet-black with a heavy black bill. Shows preference for forested valleys.",
    habitat: "Deciduous Scrublands, Forest Openings, Farms", diet: "Omnivore (Seeds, Small Mammals, Insects, Carrion)", distribution: ["India", "Sri Lanka"]
  },
  "jungle crow": {
    scientific_name: "Corvus culminatus",
    common_name: "Indian Jungle Crow",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Corvidae", genus: "Corvus", species: "C. culminatus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A large wild crow native to the Indian Subcontinent, completely jet-black with a heavy black bill. Shows preference for forested valleys.",
    habitat: "Deciduous Scrublands, Forest Openings, Farms", diet: "Omnivore (Seeds, Small Mammals, Insects, Carrion)", distribution: ["India", "Sri Lanka"]
  },
  "indian jungle crow": {
    scientific_name: "Corvus culminatus",
    common_name: "Indian Jungle Crow",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Corvidae", genus: "Corvus", species: "C. culminatus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A large wild crow native to the Indian Subcontinent, completely jet-black with a heavy black bill. Shows preference for forested valleys.",
    habitat: "Deciduous Scrublands, Forest Openings, Farms", diet: "Omnivore (Seeds, Small Mammals, Insects, Carrion)", distribution: ["India", "Sri Lanka"]
  },
  // 76. Rufous Treepie
  "rufous-treepie": {
    scientific_name: "Dendrocitta vagabunda",
    common_name: "Rufous Treepie",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Corvidae", genus: "Dendrocitta", species: "D. vagabunda" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A loud member of the crow family characterized by a long, grey tail tipped with black, rufous body, and a dark head. Highly opportunistic.",
    habitat: "Deciduous Forests, Scrub Woodlands, Parks", diet: "Omnivore (Insects, Fruits, Small Frogs, Bird Eggs)", distribution: ["India", "South Asia"]
  },
  "rufous treepie": {
    scientific_name: "Dendrocitta vagabunda",
    common_name: "Rufous Treepie",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Corvidae", genus: "Dendrocitta", species: "D. vagabunda" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A loud member of the crow family characterized by a long, grey tail tipped with black, rufous body, and a dark head. Highly opportunistic.",
    habitat: "Deciduous Forests, Scrub Woodlands, Parks", diet: "Omnivore (Insects, Fruits, Small Frogs, Bird Eggs)", distribution: ["India", "South Asia"]
  },
  // 77. Brahminy Kite
  "brahminy-kite": {
    scientific_name: "Haliastur indus",
    common_name: "Brahminy Kite",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Accipitriformes", family: "Accipitridae", genus: "Haliastur", species: "H. indus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A medium-sized bird of prey distinguished by its chestnut plumage contrasting with a white head and chest. Often seen soaring over coastal marshes and wetlands.",
    habitat: "Estuaries, Coastal Mangroves, Lakes, Rivers", diet: "Carnivore (Dead Fish, Small Crabs, Frogs, Mice)", distribution: ["South and Southeast Asia", "Australia"]
  },
  "brahminy kite": {
    scientific_name: "Haliastur indus",
    common_name: "Brahminy Kite",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Accipitriformes", family: "Accipitridae", genus: "Haliastur", species: "H. indus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A medium-sized bird of prey distinguished by its chestnut plumage contrasting with a white head and chest. Often seen soaring over coastal marshes and wetlands.",
    habitat: "Estuaries, Coastal Mangroves, Lakes, Rivers", diet: "Carnivore (Dead Fish, Small Crabs, Frogs, Mice)", distribution: ["South and Southeast Asia", "Australia"]
  },
  
  // -- NEWLY COMPLETED AUDITED YOLO/WPIS LEGACY SPECIES --
  // 78. Lynx
  "lynx": {
    scientific_name: "Lynx lynx",
    common_name: "Lynx",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Felidae", genus: "Lynx", species: "L. lynx" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A medium-sized wild cat characterized by beautiful tufts of black hair on its ears and large padded paws suitable for walking on snow.",
    habitat: "Boreal Forests, Montane Woodlands", diet: "Carnivore (Hares, Deer, Birds)", distribution: ["Siberia", "Northern Europe", "Central Asia"]
  },
  // 79. Kangaroo
  "kangaroo": {
    scientific_name: "Macropodidae",
    common_name: "Kangaroo",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Diprotodontia", family: "Macropodidae", genus: "Macropus", species: "M. rufus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "The largest marsupial on Earth. Recognized by its powerful hind legs, large feet, long muscular tail, and pouch in females used to carry young.",
    habitat: "Savannah Grasslands, Scrublands, Semi-arid Deserts", diet: "Herbivore (Grasses, Shrubs, Shoots)", distribution: ["Australia"]
  },
  // 80. Koala
  "koala": {
    scientific_name: "Phascolarctos cinereus",
    common_name: "Koala",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Diprotodontia", family: "Phascolarctidae", genus: "Phascolarctos", species: "P. cinereus" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "An arboreal herbivorous marsupial native to Australia. Instantly recognizable by its stout, tailless body, large round ears, and prominent nose.",
    habitat: "Eucalyptus Woodlands", diet: "Herbivore (Eucalyptus Leaves)", distribution: ["Eastern Australia"]
  },
  // 81. Mouse
  "mouse": {
    scientific_name: "Mus musculus",
    common_name: "Mouse",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Rodentia", family: "Muridae", genus: "Mus", species: "M. musculus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small rodent characterized by a pointed snout, large rounded ears, and a long, nearly hairless tail. Highly adaptable to urban environments.",
    habitat: "Urban Dwellings, Grasslands, Agricultural Barns", diet: "Omnivore (Grains, Seeds, Fruit, Scraps)", distribution: ["Worldwide"]
  },
  // 82. Camel
  "camel": {
    scientific_name: "Camelus dromedarius",
    common_name: "Camel",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Artiodactyla", family: "Camelidae", genus: "Camelus", species: "C. dromedarius" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "An even-toed ungulate bearing distinctive fatty humps on its back. Adapted to arid conditions by storing fat and conserving water efficiently.",
    habitat: "Sandy Deserts, Semi-arid Grasslands", diet: "Herbivore (Acacia Leaves, Thorny Plants, Grasses)", distribution: ["North Africa", "Middle East", "Central Asia"]
  },
  // 83. Canary
  "canary": {
    scientific_name: "Serinus canaria",
    common_name: "Canary",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Fringillidae", genus: "Serinus", species: "S. canaria" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A small passerine bird in the finch family. Noted for its beautiful singing voice and bright yellow domestic coloration.",
    habitat: "Forests, Woodlands, Cultivated Gardens", diet: "Granivore (Seeds, Grains)", distribution: ["Macaronesia", "introduced Worldwide"]
  },
  // 84. Caterpillar
  "caterpillar": {
    scientific_name: "Lepidoptera larva",
    common_name: "Caterpillar",
    taxonomy: { kingdom: "Animalia", phylum: "Arthropoda", class: "Insecta", order: "Lepidoptera", family: "Various", genus: "Various", species: "Lepidoptera larva" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "The larval stage of a member of the order Lepidoptera (butterflies and moths). Voracious feeders of leaves and plant tissues.",
    habitat: "Gardens, Deciduous Forests, Meadows", diet: "Herbivore (Leaves, Shoots)", distribution: ["Worldwide"]
  },
  // 85. Centipede
  "centipede": {
    scientific_name: "Chilopoda",
    common_name: "Centipede",
    taxonomy: { kingdom: "Animalia", phylum: "Arthropoda", class: "Insecta", order: "Scolopendromorpha", family: "Scolopendridae", genus: "Scolopendra", species: "Chilopoda" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Elongated, metameric predatory arthropods having one pair of legs per body segment. Possess venomous claws used for hunting insects.",
    habitat: "Soil, Leaf Litter, Under Damp Rocks", diet: "Carnivore (Insects, Worms, Spiders)", distribution: ["Worldwide"]
  },
  // 86. Chicken
  "chicken": {
    scientific_name: "Gallus gallus domesticus",
    common_name: "Chicken",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Galliformes", family: "Phasianidae", genus: "Gallus", species: "G. gallus domesticus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A species of domesticated junglefowl, one of the most common and widespread domestic animals in the world.",
    habitat: "Grasslands, Pastures, Farmlands", diet: "Omnivore (Grains, Seeds, Worms, Insects)", distribution: ["Worldwide"]
  },
  // 87. Duck
  "duck": {
    scientific_name: "Anatidae",
    common_name: "Duck",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Anseriformes", family: "Anatidae", genus: "Anas", species: "Anatidae" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Waterfowl species in the family Anatidae, characterized by broad bills, webbed feet, and water-shedding feathers.",
    habitat: "Freshwater Ponds, Lakes, Swamps, Estuaries", diet: "Omnivore (Aquatic Vegetation, Small Fish, Larvae)", distribution: ["Worldwide"]
  },
  // 88. Goat
  "goat": {
    scientific_name: "Capra hircus",
    common_name: "Goat",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Artiodactyla", family: "Bovidae", genus: "Capra", species: "C. hircus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A hardy domesticated mammal bred for milk, meat, fur, and skins. Excellent climbers adapted to rugged mountainous terrain.",
    habitat: "Dry Grasslands, Rugged Hills, Farmlands", diet: "Herbivore (Shrubs, Leaves, Grasses)", distribution: ["Worldwide"]
  },
  // 89. Goose
  "goose": {
    scientific_name: "Anserini",
    common_name: "Goose",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Anseriformes", family: "Anatidae", genus: "Aner", species: "Anserini" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Medium to large waterfowl belonging to the family Anatidae. Notable for their loud honking calls and migratory formations.",
    habitat: "Fields, Wetlands, Lakeshores, Open Meadows", diet: "Herbivore (Grasses, Grains, Aquatic Weeds)", distribution: ["Worldwide"]
  },
  // 90. Hamster
  "hamster": {
    scientific_name: "Cricetinae",
    common_name: "Hamster",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Rodentia", family: "Cricetidae", genus: "Mesocricetus", species: "Cricetinae" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Small burrowing rodents with short tails, stubby legs, and large cheek pouches used to carry food to their underground nests.",
    habitat: "Dry Meadows, Steppes, Grasslands", diet: "Omnivore (Grains, Grains, Seeds, Small Beetles)", distribution: ["Eurasia", "introduced Worldwide"]
  },
  // 91. Hedgehog
  "hedgehog": {
    scientific_name: "Erinaceinae",
    common_name: "Hedgehog",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Eulipotyphla", family: "Erinaceidae", genus: "Erinaceus", species: "Erinaceinae" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Small spiny mammals characterized by protective needle-like spines covering their backs, curling into a tight ball when threatened.",
    habitat: "Woodland Borders, Shrublands, Domestic Gardens", diet: "Insectivore (Beetles, Snails, Slugs, Worms)", distribution: ["Europe", "Asia", "Africa"]
  },
  // 92. Ladybug
  "ladybug": {
    scientific_name: "Coccinellidae",
    common_name: "Ladybug",
    taxonomy: { kingdom: "Animalia", phylum: "Arthropoda", class: "Insecta", order: "Coleoptera", family: "Coccinellidae", genus: "Coccinella", species: "Coccinellidae" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Small dome-shaped beetles with striking red or yellow wing covers dotted with black spots. Beneficial predator of garden pests.",
    habitat: "Crop Fields, Forest Canopies, Gardens", diet: "Carnivore (Aphids, Scale Mites)", distribution: ["Worldwide"]
  },
  // 93. Lizard
  "lizard": {
    scientific_name: "Lacertilia",
    common_name: "Lizard",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Reptilia", order: "Squamata", family: "Lacertidae", genus: "Lacerta", species: "Lacertilia" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A widespread group of squamate reptiles characterized by four legs, external ears, movable eyelids, and regenerative tail capabilities.",
    habitat: "Rock Crevices, Sandy Deserts, Forests", diet: "Insectivore (Spiders, Flies, Ants)", distribution: ["Worldwide"]
  },
  // 94. Magpie
  "magpie": {
    scientific_name: "Pica pica",
    common_name: "Eurasian Magpie",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Corvidae", genus: "Pica", species: "P. pica" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Highly intelligent black-and-white corvid bird with a long green-blue iridescent tail. Known for self-recognition and problem solving.",
    habitat: "Woodlands, Pastures, Urban Parks", diet: "Omnivore (Carrion, Seeds, Eggs, Insects)", distribution: ["Eurasia"]
  },
  // 95. Mule
  "mule": {
    scientific_name: "Equus asinus x Equus caballus",
    common_name: "Mule",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Perissodactyla", family: "Equidae", genus: "Equus", species: "Mule" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "The sterile hybrid offspring of a male donkey and a female horse, valued for its hardiness, sure-footedness, and pack strength.",
    habitat: "Mountainous Trails, Farmlands, Pastures", diet: "Herbivore (Grasses, Hay, Grains)", distribution: ["Worldwide"]
  },
  // 96. Ostrich
  "ostrich": {
    scientific_name: "Struthio camelus",
    common_name: "Common Ostrich",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Struthioniformes", family: "Struthionidae", genus: "Struthio", species: "S. camelus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "The largest living species of bird, flightless, possessing powerful long legs capable of running at speeds up to 70 km/h.",
    habitat: "Dry Savannahs, Sandy Semi-deserts", diet: "Herbivore (Seeds, Grasses, Leaves, Shrubs)", distribution: ["Africa"]
  },
  // 97. Otter
  "otter": {
    scientific_name: "Lutrinae",
    common_name: "Otter",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Mustelidae", genus: "Lutra", species: "Lutrinae" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Semiaquatic carnivorous mammals in the weasel family, noted for their playful behaviors, dense water-repellent fur, and webbed paws.",
    habitat: "Rivers, Lakes, Wetland Swamps, Estuaries", diet: "Carnivore (Fish, Crabs, Frogs, Crayfish)", distribution: ["Worldwide"]
  },
  // 98. Giant Panda
  "panda": {
    scientific_name: "Ailuropoda melanoleuca",
    common_name: "Giant Panda",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Ursidae", genus: "Ailuropoda", species: "A. melanoleuca" },
    iucn_status: "Vulnerable", iucn_code: "VU",
    description: "A bear species native to south central China, characterized by large black patches around its eyes, ears, and across its round body.",
    habitat: "Montane Wet Evergreen Bamboo Forests", diet: "Herbivore (Bamboo Shoots, Leaves)", distribution: ["South Central China"]
  },
  // 99. Raccoon
  "raccoon": {
    scientific_name: "Procyon lotor",
    common_name: "Raccoon",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Procyonidae", genus: "Procyon", species: "P. lotor" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Medium-sized mammal noted for its ringed tail, black mask around its eyes, and extremely dexterous front paws used to explore objects.",
    habitat: "Wetlands, Moist Forests, Urban Neighborhoods", diet: "Omnivore (Insects, Frogs, Fruits, Scraps)", distribution: ["North America"]
  },
  // 100. Raven
  "raven": {
    scientific_name: "Corvus corax",
    common_name: "Common Raven",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Passeriformes", family: "Corvidae", genus: "Corvus", species: "C. corax" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A massive, all-black corvid bird. Highly intelligent, with complex vocalizations, aerial acrobatics, and opportunistic scavenging habits.",
    habitat: "Coniferous Forests, Mountain Cliffs, Coastal Tundra", diet: "Omnivore (Carrion, Rodents, Seeds, Eggs)", distribution: ["Northern Hemisphere"]
  },
  // 101. Red Panda
  "red-panda": {
    scientific_name: "Ailurus fulgens",
    common_name: "Red Panda",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Ailuridae", genus: "Ailurus", species: "A. fulgens" },
    iucn_status: "Endangered", iucn_code: "EN",
    description: "A small arboreal mammal native to the eastern Himalayas. Features reddish-brown fur, a long shaggy ringed tail, and a waddling gait.",
    habitat: "Temperate Broadleaf Forests with Bamboo Understory", diet: "Herbivore (Bamboo Leaves, Berries, Blossoms)", distribution: ["Himalayas", "Southwestern China"]
  },
  // 102. Scorpion
  "scorpion": {
    scientific_name: "Scorpiones",
    common_name: "Scorpion",
    taxonomy: { kingdom: "Animalia", phylum: "Arthropoda", class: "Insecta", order: "Scorpiones", family: "Buthidae", genus: "Androctonus", species: "Scorpiones" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Predatory arachnids having eight legs, grasping pincers, and a narrow segmented tail ending in a venomous stinger.",
    habitat: "Desert Sand, Rock Crevices, Dry Savannahs", diet: "Carnivore (Insects, Spiders, Small Lizards)", distribution: ["Worldwide"]
  },
  // 103. Spider
  "spider": {
    scientific_name: "Araneae",
    common_name: "Spider",
    taxonomy: { kingdom: "Animalia", phylum: "Arthropoda", class: "Insecta", order: "Araneae", family: "Araneidae", genus: "Araneus", species: "Araneae" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Air-breathing arthropods with eight legs, chelicerae with fangs that inject venom, and spinnerets that extrude silk webs.",
    habitat: "Forest Understories, Grasslands, Human Dwellings", diet: "Carnivore (Flies, Mosquitoes, Moths)", distribution: ["Worldwide"]
  },
  // 104. Swan
  "swan": {
    scientific_name: "Cygnus",
    common_name: "Swan",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Anseriformes", family: "Anatidae", genus: "Cygnus", species: "Cygnus" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "Large, graceful waterfowl in the family Anatidae, renowned for their long curved necks, white plumage, and lifelong mate pairing.",
    habitat: "Freshwater Estuaries, Rivers, Ponds, Swamps", diet: "Herbivore (Submerged Vegetation, Pondweeds)", distribution: ["Worldwide"]
  },
  // 105. Turkey
  "turkey": {
    scientific_name: "Meleagris gallopavo",
    common_name: "Turkey",
    taxonomy: { kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Galliformes", family: "Phasianidae", genus: "Meleagris", species: "M. gallopavo" },
    iucn_status: "Least Concern", iucn_code: "LC",
    description: "A large game bird native to North America, characterized by a featherless head, fleshy wattle, and large fan-shaped tail.",
    habitat: "Deciduous Hardwood Forests, Open Glades, Pastures", diet: "Omnivore (Acorns, Seeds, Berries, Beetles)", distribution: ["North America"]
  }
};

// Curated lookup function with robust name matching and automatic professional field calculation
export const getSpeciesKnowledge = (name: string): SpeciesKnowledge | null => {
  if (!name) return null;
  
  const cleanLookup = (str: string): string => {
    let s = str.toLowerCase().trim().replace(/_/g, " ").replace(/-/g, " ");
    const braceIdx = s.indexOf("(");
    if (braceIdx !== -1) {
      s = s.substring(0, braceIdx).trim();
    }
    return s.trim();
  };

  const clean = cleanLookup(name);
  if (!clean) return null;

  // 1. Direct scientific match
  let found = speciesDatabase[clean];

  // 2. Search common name match
  if (!found) {
    found = Object.values(speciesDatabase).find(
      (s) => cleanLookup(s.common_name) === clean
    ) || null;
  }

  // 3. Containment check fallback
  if (!found) {
    found = Object.values(speciesDatabase).find(
      (s) => clean.includes(cleanLookup(s.scientific_name)) || 
             clean.includes(cleanLookup(s.common_name)) ||
             cleanLookup(s.scientific_name).includes(clean) ||
             cleanLookup(s.common_name).includes(clean)
    ) || null;
  }

  if (!found) return null;

  // Make a shallow copy to enrich dynamic fields professionally
  const profile = { ...found };
  const className = profile.taxonomy.class.toLowerCase();
  const iucn = profile.iucn_status;
  const isThreatened = ["Vulnerable", "Endangered", "Critically Endangered"].includes(iucn);
  
  // Calculate Threat Level & Conservation Priority biologically
  profile.threat_level = profile.threat_level || (iucn === "Critically Endangered" ? "Critical" : isThreatened ? "High" : "Low");
  profile.conservation_priority = profile.conservation_priority || (iucn === "Critically Endangered" ? "Critical" : isThreatened ? "High" : "Routine");

  // Custom curated recommendations based on animal groups and status
  if (["mammalia", "reptilia"].includes(className) && ["tiger", "lion", "leopard", "cheetah", "wolf", "crocodile", "shark", "lynx"].some(x => profile.common_name.toLowerCase().includes(x))) {
    // Large Predators
    profile.habitat_suitability = profile.habitat_suitability || `Optimal in core dense ${profile.habitat.toLowerCase()} with abundant prey populations.`;
    profile.human_wildlife_conflict = profile.human_wildlife_conflict || "High risk of livestock depredation in buffer zones. Community livestock compensation schemes recommended.";
    profile.protection_recommendations = profile.protection_recommendations || "Enforce core forest boundary protections, minimize human buffer encroachment, and establish wildlife corridors.";
    profile.anti_poaching_recommendations = profile.anti_poaching_recommendations || "Deploy smart camera grids at boundary crossings, conduct daily anti-snare sweeps, and run targeted informant networks.";
  } 
  else if (["elephant", "rhinoceros", "rhino", "hippopotamus", "hippo", "giraffe", "zebra", "camel"].some(x => profile.common_name.toLowerCase().includes(x))) {
    // Large Herbivores
    profile.habitat_suitability = profile.habitat_suitability || `Optimal in contiguous ${profile.habitat.toLowerCase()} with open water corridors.`;
    profile.human_wildlife_conflict = profile.human_wildlife_conflict || "High risk of crop raiding and fence destruction. Non-lethal deterrents (electric fencing, bee hives, deep trenches) recommended.";
    profile.protection_recommendations = profile.protection_recommendations || "Secure migration paths and stopover wetlands from industrial development.";
    profile.anti_poaching_recommendations = profile.anti_poaching_recommendations || "Conduct daily foot patrols around waterholes, monitor boundary fences, and enforce severe ivory/horn trade penalties.";
  }
  else if (["gorilla", "monkey", "primate", "koala"].some(x => profile.common_name.toLowerCase().includes(x))) {
    // Primates & Arboreal Marsupials
    profile.habitat_suitability = profile.habitat_suitability || `Requires connected ${profile.habitat.toLowerCase()} canopy tree cover.`;
    profile.human_wildlife_conflict = profile.human_wildlife_conflict || "High risk of crop raiding and property foraging. Human food waste secure storage recommended.";
    profile.protection_recommendations = profile.protection_recommendations || "Preserve old-growth canopy cover and enforce canopy bridge corridors over roads.";
    profile.anti_poaching_recommendations = profile.anti_poaching_recommendations || "Enforce bushmeat trade regulations and monitor local illegal pet trade markets.";
  }
  else if (className === "aves" && ["eagle", "hawk", "owl", "kite", "falcon", "shikra"].some(x => profile.common_name.toLowerCase().includes(x))) {
    // Birds of Prey
    profile.habitat_suitability = profile.habitat_suitability || `Optimal in undisturbed nesting trees overlooking open ${profile.habitat.toLowerCase()}.`;
    profile.human_wildlife_conflict = profile.human_wildlife_conflict || "Minor conflict involving poultry predation. Recommend predator-proof poultry wire mesh pens.";
    profile.protection_recommendations = profile.protection_recommendations || "Protect old-growth nesting trees and install insulation on power line poles.";
    profile.anti_poaching_recommendations = profile.anti_poaching_recommendations || "Monitor nest sites during breeding season and ban illegal pesticide-laden baiting.";
  }
  else if (className === "aves") {
    // Passerines and common forest/aquatic birds
    profile.habitat_suitability = profile.habitat_suitability || `Optimal in diverse ${profile.habitat.toLowerCase()} with abundant nesting materials.`;
    profile.human_wildlife_conflict = profile.human_wildlife_conflict || "Negligible conflict. Grain-eaters and frugivores may feed on crop grains or orchard harvests.";
    profile.protection_recommendations = profile.protection_recommendations || "Preserve local tree groves, wetlands, and bush shelter zones.";
    profile.anti_poaching_recommendations = profile.anti_poaching_recommendations || "Monitor and raid wild bird markets to stop illegal trapping for cage bird trade.";
  }
  else if (["insecta", "arachnida", "chilopoda"].includes(className)) {
    // Insects / Arthropods
    profile.habitat_suitability = profile.habitat_suitability || `Optimal in diverse vegetation zones rich in flowering plants or damp organic soil litter.`;
    profile.human_wildlife_conflict = profile.human_wildlife_conflict || "None. Key beneficial pollinators or insect control predators for crop cultivation and wild flora ecosystems.";
    profile.protection_recommendations = profile.protection_recommendations || "Ban wide-scale chemical pesticide spraying and preserve native wild vegetation corridors.";
    profile.anti_poaching_recommendations = profile.anti_poaching_recommendations || "Monitor commercial collector trading and protect sensitive breeding hosts.";
  }
  else if (profile.scientific_name.toLowerCase() === "medusozoa") {
    // Jellyfish
    profile.habitat_suitability = profile.habitat_suitability || "Requires warm pelagic marine conditions with moderate currents.";
    profile.human_wildlife_conflict = profile.human_wildlife_conflict || "High stinging hazard for swimmers during bloom events. Beach safety warning signs recommended.";
    profile.protection_recommendations = profile.protection_recommendations || "Maintain water quality checks and prevent agricultural nutrient runoffs that trigger blooms.";
    profile.anti_poaching_recommendations = profile.anti_poaching_recommendations || "Not applicable. Maintain ecological monitoring of ocean warming cycles.";
  }
  else {
    // Fallback for general species (e.g. domestic animals, rodents, marsupials like Kangaroo)
    profile.habitat_suitability = profile.habitat_suitability || `Optimal in open ${profile.habitat.toLowerCase()}.`;
    profile.human_wildlife_conflict = profile.human_wildlife_conflict || "Minor competition for grazing land. Avoid overgrazing inside protected wild territory borders.";
    profile.protection_recommendations = profile.protection_recommendations || "Encourage sustainable agriculture practices and secure boundaries from predators.";
    profile.anti_poaching_recommendations = profile.anti_poaching_recommendations || "Perform routine boundary checks to prevent domestic animal entry into reserves.";
  }

  return profile;
};
