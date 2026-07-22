// Species Image Lookup Service with priority fallbacks: Local -> Wikimedia -> GBIF -> eBird -> Placeholder
export const getSpeciesImage = async (scientificName: string, commonName: string): Promise<string | null> => {
  if (!scientificName) return null;
  
  const sName = scientificName.trim();
  const cName = commonName ? commonName.trim() : "";
  
  // Do not query or cache unmapped/unknown placeholders
  const isUnmapped = sName.toLowerCase().includes("unknown") || 
                     sName.toLowerCase().includes("no profile") ||
                     cName.toLowerCase().includes("unknown") || 
                     cName.toLowerCase().includes("no profile");
  if (isUnmapped) {
    return null;
  }
  const cacheKey = `wiki_img_${sName.replace(/\s+/g, '_')}`;
  
  // 1. Check local cache
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  // 2. Local Species Library mapping (optional local asset placeholders)
  const localLibrary: Record<string, string> = {
    "pavo cristatus": "/assets/hero.png"
  };
  
  const key = sName.toLowerCase();
  if (localLibrary[key]) {
    localStorage.setItem(cacheKey, localLibrary[key]);
    return localLibrary[key];
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
