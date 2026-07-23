// Species Image Lookup Service with priority fallbacks: Local -> Wikimedia -> GBIF -> eBird -> Placeholder
export const getSpeciesImage = async (scientificName: string, commonName: string): Promise<string | null> => {
  const sName = scientificName ? scientificName.trim() : "";
  const cName = commonName ? commonName.trim() : "";
  
  if (!sName && !cName) return null;
  
  // Do not query or cache unmapped/unknown placeholders
  const isUnmapped = sName.toLowerCase().includes("unknown") || 
                     sName.toLowerCase().includes("no profile") ||
                     cName.toLowerCase().includes("unknown") || 
                     cName.toLowerCase().includes("no profile");
  if (isUnmapped) {
    return null;
  }

  // 1. Local Species Library mapping (optional local asset placeholders) - Check FIRST to avoid stale cache hits
  const localLibrary: Record<string, string> = {
    // 1. Indian Peafowl
    "pavo cristatus": "/assets/images/indian_peafowl.jpg",
    "indian peafowl": "/assets/images/indian_peafowl.jpg",
    // 2. Asian Koel
    "eudynamys scolopaceus": "/assets/images/asian_koel.jpg",
    "asian koel": "/assets/images/asian_koel.jpg",
    // 3. Coppersmith Barbet
    "psilopogon haemacephalus": "/assets/images/coppersmith_barbet.jpg",
    "coppersmith barbet": "/assets/images/coppersmith_barbet.jpg",
    // 4. Indian Pitta
    "pitta brachyura": "/assets/images/indian_pitta.jpg",
    "indian pitta": "/assets/images/indian_pitta.jpg",
    // 5. Rose-ringed Parakeet
    "psittacula krameri": "/assets/images/rose_ringed_parakeet.jpg",
    "rose-ringed parakeet": "/assets/images/rose_ringed_parakeet.jpg",
    // 6. Rock Pigeon
    "columba livia": "/assets/images/rock_pigeon.jpg",
    "rock pigeon": "/assets/images/rock_pigeon.jpg",
    // 7. House Sparrow
    "passer domesticus": "/assets/images/house_sparrow.jpg",
    "house sparrow": "/assets/images/house_sparrow.jpg",
    // 8. Common Myna
    "acridotheres tristis": "/assets/images/common_myna.jpg",
    "common myna": "/assets/images/common_myna.jpg",
    // 9. Jungle Myna
    "acridotheres fuscus": "/assets/images/jungle_myna.jpg",
    "jungle myna": "/assets/images/jungle_myna.jpg",
    // 10. Red-vented Bulbul
    "pycnonotus cafer": "/assets/images/red_vented_bulbul.jpg",
    "red-vented bulbul": "/assets/images/red_vented_bulbul.jpg",
    // 11. Red-whiskered Bulbul
    "pycnonotus jocosus": "/assets/images/red_whiskered_bulbul.jpg",
    "red-whiskered bulbul": "/assets/images/red_whiskered_bulbul.jpg",
    // 12. White-throated Kingfisher
    "halcyon smyrnensis": "/assets/images/white_throated_kingfisher.jpg",
    "white-throated kingfisher": "/assets/images/white_throated_kingfisher.jpg",
    // 13. Common Kingfisher
    "alcedo atthis": "/assets/images/common_kingfisher.jpg",
    "common kingfisher": "/assets/images/common_kingfisher.jpg",
    // 14. Green Bee-eater
    "merops orientalis": "/assets/images/green_bee_eater.jpg",
    "green bee-eater": "/assets/images/green_bee_eater.jpg",
    "green bee eater": "/assets/images/green_bee_eater.jpg",
    // 15. Black Drongo
    "dicrurus macrocercus": "/assets/images/black_drongo.jpg",
    "black drongo": "/assets/images/black_drongo.jpg",
    // 16. Oriental Magpie Robin
    "copsychus saularis": "/assets/images/oriental_magpie_robin.jpg",
    "oriental magpie robin": "/assets/images/oriental_magpie_robin.jpg",
    "oriental magpie-robin": "/assets/images/oriental_magpie_robin.jpg",
    // 17. Indian Robin
    "copsychus fulicatus": "/assets/images/indian_robin.jpg",
    "indian robin": "/assets/images/indian_robin.jpg",
    // 18. Purple Sunbird
    "cinnyris asiaticus": "/assets/images/purple_sunbird.jpg",
    "purple sunbird": "/assets/images/purple_sunbird.jpg",
    // 19. Spotted Dove
    "spilopelia chinensis": "/assets/images/spotted_dove.jpg",
    "spotted dove": "/assets/images/spotted_dove.jpg",
    // 20. Laughing Dove
    "spilopelia senegalensis": "/assets/images/laughing_dove.jpg",
    "laughing dove": "/assets/images/laughing_dove.jpg",
    // 21. Eurasian Collared Dove
    "streptopelia decaocto": "/assets/images/eurasian_collared_dove.jpg",
    "eurasian collared dove": "/assets/images/eurasian_collared_dove.jpg",
    // 22. Greater Coucal
    "centropus sinensis": "/assets/images/greater_coucal.jpg",
    "greater coucal": "/assets/images/greater_coucal.jpg",
    // 23. Indian Roller
    "coracias benghalensis": "/assets/images/indian_roller.jpg",
    "indian roller": "/assets/images/indian_roller.jpg",
    // 24. Barn Owl
    "tyto alba": "/assets/images/barn_owl.jpg",
    "barn owl": "/assets/images/barn_owl.jpg",
    // 25. Spotted Owlet
    "athene brama": "/assets/images/spotted_owlet.jpg",
    "spotted owlet": "/assets/images/spotted_owlet.jpg",
    // 26. Grey Hornbill
    "ocyceros birostris": "/assets/images/grey_hornbill.jpg",
    "grey hornbill": "/assets/images/grey_hornbill.jpg",
    "indian grey hornbill": "/assets/images/grey_hornbill.jpg",
    // 27. House Crow
    "corvus splendens": "/assets/images/house_crow.jpg",
    "house crow": "/assets/images/house_crow.jpg",
    // 28. Jungle Crow
    "corvus culminatus": "/assets/images/jungle_crow.jpg",
    "jungle crow": "/assets/images/jungle_crow.jpg",
    "indian jungle crow": "/assets/images/jungle_crow.jpg",
    // 29. Rufous Treepie
    "dendrocitta vagabunda": "/assets/images/rufous_treepie.jpg",
    "rufous treepie": "/assets/images/rufous_treepie.jpg",
    // 30. Brahminy Kite
    "haliastur indus": "/assets/images/brahminy_kite.jpg",
    "brahminy kite": "/assets/images/brahminy_kite.jpg"
  };
  
  // Robust normalization function
  const cleanLookup = (str: string): string => {
    if (!str) return "";
    let s = str.toLowerCase().trim().replace(/_/g, " ");
    const braceIdx = s.indexOf("(");
    if (braceIdx !== -1) {
      s = s.substring(0, braceIdx).trim();
    }
    return s.trim();
  };

  const cleanSci = cleanLookup(sName);
  const cleanCom = cleanLookup(cName);
  
  // Perform search in localLibrary keys
  for (const libKey of Object.keys(localLibrary)) {
    const normLibKey = libKey.toLowerCase().trim();
    if ((cleanSci && (normLibKey === cleanSci || cleanSci.includes(normLibKey) || normLibKey.includes(cleanSci))) ||
        (cleanCom && (normLibKey === cleanCom || cleanCom.includes(normLibKey) || normLibKey.includes(cleanCom)))) {
      return localLibrary[libKey];
    }
  }

  // 2. Check local cache (only for external API query results)
  const cacheKey = `wiki_img_${cleanSci.replace(/\s+/g, '_')}`;
  if (cleanSci) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  }

  // 3. Query Wikimedia Commons API
  const queryWiki = async (queryStr: string): Promise<string | null> => {
    try {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(queryStr)}&gsrnamespace=6&prop=imageinfo&iiprop=url&gsrlimit=1&format=json&origin=*`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const pages = data?.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const info = pages[pageId]?.imageinfo;
        if (info && info[0]?.url) {
          return info[0].url;
        }
      }
    } catch (e) {
      console.warn("Wiki search failed for:", queryStr, e);
    }
    return null;
  };

  // 4. Query GBIF Occurrence Media API
  const queryGBIF = async (sciName: string): Promise<string | null> => {
    try {
      const matchUrl = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(sciName)}`;
      const matchRes = await fetch(matchUrl);
      if (!matchRes.ok) return null;
      const matchData = await matchRes.json();
      const usageKey = matchData?.usageKey;
      if (usageKey) {
        const occUrl = `https://api.gbif.org/v1/occurrence/search?taxonKey=${usageKey}&mediaType=StillImage&limit=1`;
        const occRes = await fetch(occUrl);
        if (occRes.ok) {
          const occData = await occRes.json();
          const imgUrl = occData?.results?.[0]?.media?.[0]?.identifier;
          if (imgUrl) return imgUrl;
        }
      }
    } catch (e) {
      console.warn("GBIF lookup failed for:", sciName, e);
    }
    return null;
  };

  // 5. Query eBird/General Search Fallback
  const queryEBird = async (comName: string): Promise<string | null> => {
    try {
      const queryStr = `${comName} bird Macaulay`;
      return await queryWiki(queryStr);
    } catch (e) {
      console.warn("eBird fallback failed for:", comName, e);
    }
    return null;
  };

  try {
    // Step 1: Wikimedia Search by Scientific Name
    let imgUrl = await queryWiki(sName);
    
    // Step 2: Wikimedia Search by Common Name
    if (!imgUrl && cName) {
      imgUrl = await queryWiki(cName);
    }

    // Step 3: GBIF Sighting Occurrences
    if (!imgUrl && sName) {
      imgUrl = await queryGBIF(sName);
    }
    
    // Step 4: eBird Macaulay catalog fallback
    if (!imgUrl && cName) {
      imgUrl = await queryEBird(cName);
    }

    if (imgUrl) {
      localStorage.setItem(cacheKey, imgUrl);
      return imgUrl;
    }
  } catch (err) {
    console.warn("Species image retrieval error:", err);
  }

  return null;
};
