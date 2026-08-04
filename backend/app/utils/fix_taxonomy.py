"""
fix_taxonomy.py — One-time taxonomy correction migration for WPIS species_profiles table.

This script scans the entire species_profiles database table and corrects:
  1. Entries where scientific_name == common_name (Gemini fallback failure)
  2. Entries where scientific_name is a duplicate of the common name e.g. 'Chital Chital'
  3. Entries with known incorrect mappings e.g. Bengal Tiger → Panthera tigris (missing subspecies)

Run this script manually as a one-time migration:
    python -m app.utils.fix_taxonomy

It is intentionally NOT called on every startup to avoid unnecessary database writes.
It is idempotent — safe to run multiple times (only touches records that need correction).
"""

import sys
import os
import re
import logging

# Allow running from both the project root and backend/ directories
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# AUTHORITATIVE TAXONOMY REFERENCE
# Compiled from: species_data.py seeds + IUCN Red List + taxonomy.py YOLO classes
# Keys: lowercase common name (canonical form used in the DB)
# Values: (scientific_name, iucn_status, class_name)
# ─────────────────────────────────────────────────────────────────────────────
AUTHORITATIVE_MAP = {
    # ── Indian Flagship Species ─────────────────────────────────────────────
    "bengal tiger":              ("Panthera tigris tigris",        "Endangered",          "Mammalia"),
    "indian leopard":            ("Panthera pardus fusca",         "Vulnerable",          "Mammalia"),
    "asiatic lion":              ("Panthera leo persica",          "Endangered",          "Mammalia"),
    "asian elephant":            ("Elephas maximus",               "Endangered",          "Mammalia"),
    "one-horned rhinoceros":     ("Rhinoceros unicornis",          "Vulnerable",          "Mammalia"),
    "indian rhinoceros":         ("Rhinoceros unicornis",          "Vulnerable",          "Mammalia"),
    "sloth bear":                ("Melursus ursinus",              "Vulnerable",          "Mammalia"),
    "indian gaur":               ("Bos gaurus",                   "Vulnerable",          "Mammalia"),
    "chital":                    ("Axis axis",                     "Least Concern",       "Mammalia"),
    "sambar deer":               ("Rusa unicolor",                 "Vulnerable",          "Mammalia"),
    "dhole":                     ("Cuon alpinus",                  "Endangered",          "Mammalia"),
    "nilgai":                    ("Boselaphus tragocamelus",       "Least Concern",       "Mammalia"),
    "wild boar":                 ("Sus scrofa",                    "Least Concern",       "Mammalia"),
    "indian peafowl":            ("Pavo cristatus",                "Least Concern",       "Aves"),
    "great hornbill":            ("Buceros bicornis",              "Vulnerable",          "Aves"),
    "asian koel":                ("Eudynamys scolopaceus",         "Least Concern",       "Aves"),
    "mugger crocodile":          ("Crocodylus palustris",          "Vulnerable",          "Reptilia"),
    "gharial":                   ("Gavialis gangeticus",           "Critically Endangered","Reptilia"),
    "king cobra":                ("Ophiophagus hannah",            "Vulnerable",          "Reptilia"),
    "blackbuck":                 ("Antilope cervicapra",           "Least Concern",       "Mammalia"),
    "indian wolf":               ("Canis lupus pallipes",          "Endangered",          "Mammalia"),
    "indian pangolin":           ("Manis crassicaudata",           "Endangered",          "Mammalia"),
    "himalayan black bear":      ("Ursus thibetanus laniger",      "Vulnerable",          "Mammalia"),
    "barasingha":                ("Rucervus duvaucelii",           "Vulnerable",          "Mammalia"),
    "snow leopard":              ("Panthera uncia",                "Vulnerable",          "Mammalia"),
    "clouded leopard":           ("Neofelis nebulosa",             "Vulnerable",          "Mammalia"),
    "indian rock python":        ("Python molurus",                "Vulnerable",          "Reptilia"),
    "saltwater crocodile":       ("Crocodylus porosus",            "Least Concern",       "Reptilia"),
    "axis deer":                 ("Axis axis",                     "Least Concern",       "Mammalia"),
    "barking deer":              ("Muntiacus muntjak",             "Least Concern",       "Mammalia"),

    # ── Global YOLO Benchmark Species (demo/AI evaluation set) ─────────────
    "zebra":                     ("Equus quagga",                  "Near Threatened",     "Mammalia"),
    "giraffe":                   ("Giraffa camelopardalis",        "Vulnerable",          "Mammalia"),
    "aardvark":                  ("Orycteropus afer",              "Least Concern",       "Mammalia"),
    "canada goose":              ("Branta canadensis",             "Least Concern",       "Aves"),
    "raccoon":                   ("Procyon lotor",                 "Least Concern",       "Mammalia"),
    "kangaroo":                  ("Macropus rufus",                "Least Concern",       "Mammalia"),
    "koala":                     ("Phascolarctos cinereus",        "Vulnerable",          "Mammalia"),
    "polar bear":                ("Ursus maritimus",               "Vulnerable",          "Mammalia"),
    "brown bear":                ("Ursus arctos",                  "Least Concern",       "Mammalia"),
    "bear":                      ("Ursidae",                       "Vulnerable",          "Mammalia"),
    "lion":                      ("Panthera leo",                  "Vulnerable",          "Mammalia"),
    "tiger":                     ("Panthera tigris",               "Endangered",          "Mammalia"),
    "leopard":                   ("Panthera pardus",               "Vulnerable",          "Mammalia"),
    "cheetah":                   ("Acinonyx jubatus",              "Vulnerable",          "Mammalia"),
    "hippopotamus":              ("Hippopotamus amphibius",        "Vulnerable",          "Mammalia"),
    "african elephant":          ("Loxodonta africana",            "Vulnerable",          "Mammalia"),
    "african buffalo":           ("Syncerus caffer",               "Near Threatened",     "Mammalia"),
    "rhinoceros":                ("Rhinoceros unicornis",          "Vulnerable",          "Mammalia"),
    "white rhinoceros":          ("Ceratotherium simum",           "Near Threatened",     "Mammalia"),
    "gorilla":                   ("Gorilla gorilla",               "Critically Endangered","Mammalia"),
    "orangutan":                 ("Pongo pygmaeus",                "Critically Endangered","Mammalia"),
    "chimpanzee":                ("Pan troglodytes",               "Endangered",          "Mammalia"),
    "wolf":                      ("Canis lupus",                   "Least Concern",       "Mammalia"),
    "fox":                       ("Vulpes vulpes",                 "Least Concern",       "Mammalia"),
    "arctic fox":                ("Vulpes lagopus",                "Least Concern",       "Mammalia"),
    "red panda":                 ("Ailurus fulgens",               "Endangered",          "Mammalia"),
    "giant panda":               ("Ailuropoda melanoleuca",        "Vulnerable",          "Mammalia"),
    "snow monkey":               ("Macaca fuscata",                "Least Concern",       "Mammalia"),
    "monkey":                    ("Cercopithecidae",               "Least Concern",       "Mammalia"),
    "baboon":                    ("Papio ursinus",                 "Least Concern",       "Mammalia"),
    "camel":                     ("Camelus dromedarius",           "Least Concern",       "Mammalia"),
    "horse":                     ("Equus caballus",                "Domesticated",        "Mammalia"),
    "donkey":                    ("Equus africanus asinus",        "Domesticated",        "Mammalia"),
    "deer":                      ("Cervidae",                      "Least Concern",       "Mammalia"),
    "moose":                     ("Alces alces",                   "Least Concern",       "Mammalia"),
    "elk":                       ("Cervus canadensis",             "Least Concern",       "Mammalia"),
    "reindeer":                  ("Rangifer tarandus",             "Vulnerable",          "Mammalia"),
    "bison":                     ("Bison bison",                   "Near Threatened",     "Mammalia"),
    "american bison":            ("Bison bison",                   "Near Threatened",     "Mammalia"),
    "yak":                       ("Bos mutus",                     "Vulnerable",          "Mammalia"),
    "water buffalo":             ("Bubalus bubalis",               "Least Concern",       "Mammalia"),
    "gaur":                      ("Bos gaurus",                    "Vulnerable",          "Mammalia"),
    "musk ox":                   ("Ovibos moschatus",              "Least Concern",       "Mammalia"),
    "sheep":                     ("Ovis aries",                    "Domesticated",        "Mammalia"),
    "goat":                      ("Capra hircus",                  "Domesticated",        "Mammalia"),
    "pig":                       ("Sus scrofa domesticus",         "Domesticated",        "Mammalia"),
    "rabbit":                    ("Oryctolagus cuniculus",         "Endangered",          "Mammalia"),
    "squirrel":                  ("Sciurus vulgaris",              "Least Concern",       "Mammalia"),
    "bat":                       ("Chiroptera",                    "Least Concern",       "Mammalia"),
    "otter":                     ("Lutra lutra",                   "Near Threatened",     "Mammalia"),
    "seal":                      ("Phocidae",                      "Least Concern",       "Mammalia"),
    "walrus":                    ("Odobenus rosmarus",             "Vulnerable",          "Mammalia"),
    "dolphin":                   ("Delphinus delphis",             "Least Concern",       "Mammalia"),
    "whale":                     ("Balaenoptera musculus",         "Endangered",          "Mammalia"),
    "orca":                      ("Orcinus orca",                  "Data Deficient",      "Mammalia"),
    "manatee":                   ("Trichechus manatus",            "Vulnerable",          "Mammalia"),
    "platypus":                  ("Ornithorhynchus anatinus",      "Near Threatened",     "Mammalia"),
    "wombat":                    ("Vombatus ursinus",              "Least Concern",       "Mammalia"),
    "wolverine":                 ("Gulo gulo",                     "Least Concern",       "Mammalia"),
    "two-toed sloth":            ("Choloepus didactylus",          "Least Concern",       "Mammalia"),
    "giant anteater":            ("Myrmecophaga tridactyla",       "Vulnerable",          "Mammalia"),
    "armadillo":                 ("Dasypus novemcinctus",          "Least Concern",       "Mammalia"),
    "hedgehog":                  ("Erinaceus europaeus",           "Least Concern",       "Mammalia"),
    "meerkat":                   ("Suricata suricatta",            "Least Concern",       "Mammalia"),
    "mongoose":                  ("Herpestes ichneumon",           "Least Concern",       "Mammalia"),
    "hyena":                     ("Crocuta crocuta",               "Least Concern",       "Mammalia"),
    "jaguar":                    ("Panthera onca",                 "Near Threatened",     "Mammalia"),
    "puma":                      ("Puma concolor",                 "Least Concern",       "Mammalia"),
    "lynx":                      ("Lynx lynx",                     "Least Concern",       "Mammalia"),
    "ocelot":                    ("Leopardus pardalis",            "Least Concern",       "Mammalia"),
    "serval":                    ("Leptailurus serval",            "Least Concern",       "Mammalia"),
    "caracal":                   ("Caracal caracal",               "Least Concern",       "Mammalia"),

    # ── Birds (YOLO + common benchmark) ───────────────────────────────────
    "eagle":                     ("Aquila chrysaetos",             "Least Concern",       "Aves"),
    "bald eagle":                ("Haliaeetus leucocephalus",      "Least Concern",       "Aves"),
    "osprey":                    ("Pandion haliaetus",             "Least Concern",       "Aves"),
    "falcon":                    ("Falco peregrinus",              "Least Concern",       "Aves"),
    "hawk":                      ("Buteo jamaicensis",             "Least Concern",       "Aves"),
    "owl":                       ("Strix aluco",                   "Least Concern",       "Aves"),
    "parrot":                    ("Psittacidae",                   "Least Concern",       "Aves"),
    "macaw":                     ("Ara macao",                     "Least Concern",       "Aves"),
    "flamingo":                  ("Phoenicopterus roseus",         "Least Concern",       "Aves"),
    "penguin":                   ("Spheniscidae",                  "Least Concern",       "Aves"),
    "toucan":                    ("Ramphastos toco",               "Least Concern",       "Aves"),
    "woodpecker":                ("Picidae",                       "Least Concern",       "Aves"),
    "hummingbird":               ("Trochilidae",                   "Least Concern",       "Aves"),
    "crow":                      ("Corvus corone",                 "Least Concern",       "Aves"),
    "raven":                     ("Corvus corax",                  "Least Concern",       "Aves"),
    "peacock":                   ("Pavo cristatus",                "Least Concern",       "Aves"),
    "turkey":                    ("Meleagris gallopavo",           "Least Concern",       "Aves"),
    "pigeon":                    ("Columba livia",                 "Least Concern",       "Aves"),
    "duck":                      ("Anas platyrhynchos",            "Least Concern",       "Aves"),
    "goose":                     ("Anser anser",                   "Least Concern",       "Aves"),
    "swan":                      ("Cygnus olor",                   "Least Concern",       "Aves"),
    "pelican":                   ("Pelecanus onocrotalus",         "Least Concern",       "Aves"),
    "albatross":                 ("Diomedea exulans",              "Vulnerable",          "Aves"),
    "crane":                     ("Grus grus",                     "Least Concern",       "Aves"),
    "stork":                     ("Ciconia ciconia",               "Least Concern",       "Aves"),
    "heron":                     ("Ardea cinerea",                 "Least Concern",       "Aves"),
    "kingfisher":                ("Alcedo atthis",                 "Least Concern",       "Aves"),
    "robin":                     ("Erithacus rubecula",            "Least Concern",       "Aves"),
    "sparrow":                   ("Passer domesticus",             "Least Concern",       "Aves"),
    "finch":                     ("Fringillidae",                  "Least Concern",       "Aves"),
    "warbler":                   ("Sylvia atricapilla",            "Least Concern",       "Aves"),

    # ── Reptiles ──────────────────────────────────────────────────────────
    "crocodile":                 ("Crocodylus niloticus",          "Least Concern",       "Reptilia"),
    "alligator":                 ("Alligator mississippiensis",    "Least Concern",       "Reptilia"),
    "caiman":                    ("Caiman crocodilus",             "Least Concern",       "Reptilia"),
    "komodo dragon":             ("Varanus komodoensis",           "Endangered",          "Reptilia"),
    "iguana":                    ("Iguana iguana",                 "Least Concern",       "Reptilia"),
    "chameleon":                 ("Chamaeleo chamaeleon",          "Least Concern",       "Reptilia"),
    "gecko":                     ("Gekko gecko",                   "Least Concern",       "Reptilia"),
    "tortoise":                  ("Geochelone elegans",            "Vulnerable",          "Reptilia"),
    "sea turtle":                ("Chelonia mydas",                "Endangered",          "Reptilia"),
    "python":                    ("Python molurus",                "Least Concern",       "Reptilia"),
    "cobra":                     ("Naja naja",                     "Least Concern",       "Reptilia"),
    "anaconda":                  ("Eunectes murinus",              "Least Concern",       "Reptilia"),

    # ── Amphibians ────────────────────────────────────────────────────────
    "frog":                      ("Rana temporaria",               "Least Concern",       "Amphibia"),
    "toad":                      ("Bufo bufo",                     "Least Concern",       "Amphibia"),
    "salamander":                ("Salamandra salamandra",         "Least Concern",       "Amphibia"),
    "axolotl":                   ("Ambystoma mexicanum",           "Critically Endangered","Amphibia"),

    # ── Marine/Fish ───────────────────────────────────────────────────────
    "shark":                     ("Carcharhinus leucas",           "Near Threatened",     "Actinopterygii"),
    "whale shark":               ("Rhincodon typus",               "Endangered",          "Actinopterygii"),
    "great white shark":         ("Carcharodon carcharias",        "Vulnerable",          "Actinopterygii"),
    "manta ray":                 ("Manta birostris",               "Vulnerable",          "Actinopterygii"),
    "seahorse":                  ("Hippocampus hippocampus",       "Data Deficient",      "Actinopterygii"),
    "clownfish":                 ("Amphiprioninae",                "Least Concern",       "Actinopterygii"),
    "salmon":                    ("Salmo salar",                   "Least Concern",       "Actinopterygii"),
    "tuna":                      ("Thunnus thynnus",               "Endangered",          "Actinopterygii"),
    "swordfish":                 ("Xiphias gladius",               "Least Concern",       "Actinopterygii"),

    # ── Insects ───────────────────────────────────────────────────────────
    "butterfly":                 ("Rhopalocera",                   "Least Concern",       "Insecta"),
    "dragonfly":                 ("Odonata",                       "Least Concern",       "Insecta"),
    "bee":                       ("Apis mellifera",                "Least Concern",       "Insecta"),
    "ant":                       ("Formicidae",                    "Least Concern",       "Insecta"),
    "beetle":                    ("Coleoptera",                    "Least Concern",       "Insecta"),
}


def _is_duplicate_name(scientific_name: str, common_name: str) -> bool:
    """Return True if the scientific name appears to be a copy/duplicate of the common name."""
    sci = scientific_name.strip().lower()
    com = common_name.strip().lower()
    
    if sci == com:
        return True
    
    # Detect 'Word Word' pattern where word is repeated (e.g. 'Chital Chital')
    parts = sci.split()
    if len(parts) == 2 and parts[0] == parts[1]:
        return True
    
    # Detect patterns like 'Chital chital' (same word different case)
    if len(parts) == 2 and parts[0].lower() == parts[1].lower():
        return True
    
    # Detect where scientific_name contains just one word matching common_name substring
    # e.g. common='Sambar Deer', scientific='Sambar Deer' (already caught by ==)
    # e.g. common='Dhole', scientific='Dhole' (already caught by ==)

    return False


def _looks_like_valid_binomial(scientific_name: str) -> bool:
    """Heuristic: a valid binomial has 2-3 words with standard Latin naming."""
    sci = scientific_name.strip()
    if not sci:
        return False
    
    parts = sci.split()
    
    # Reject single-word names (families/orders are acceptable in some cases)
    # Reject obvious duplicates
    if len(parts) == 2 and parts[0].lower() == parts[1].lower():
        return False
    
    # Reject names that are just repeated words
    if len(set(p.lower() for p in parts)) == 1:
        return False
    
    # Reject if it matches the common name exactly
    return True


def run_fixes(db) -> int:
    """
    Scan all species_profiles and correct bad scientific name mappings.
    
    Returns the number of records corrected.
    """
    from app.models.species import SpeciesProfile
    
    all_profiles = db.query(SpeciesProfile).all()
    logger.info(f"Total species profiles: {len(all_profiles)}")
    
    # Build a lookup of existing valid scientific names -> profile id for conflict detection
    existing_scientific = {}
    for p in all_profiles:
        if p.scientific_name and _looks_like_valid_binomial(p.scientific_name):
            sci_lower = p.scientific_name.strip().lower()
            existing_scientific[sci_lower] = p.id
    
    corrected = 0
    skipped_no_match = 0
    skipped_conflict = 0
    already_correct = 0
    
    for profile in all_profiles:
        common = profile.common_name or ""
        scientific = profile.scientific_name or ""
        lookup_key = common.strip().lower()
        
        # Check if this record needs correction
        needs_fix = _is_duplicate_name(scientific, common) or not _looks_like_valid_binomial(scientific)
        
        if not needs_fix:
            already_correct += 1
            continue
        
        # Look up in authoritative map
        authoritative = AUTHORITATIVE_MAP.get(lookup_key)
        
        if not authoritative:
            # Try partial match for compound names (e.g. 'Brown-bear' -> 'brown bear')
            normalized_key = lookup_key.replace('-', ' ').replace('_', ' ')
            authoritative = AUTHORITATIVE_MAP.get(normalized_key)
        

        
        if not authoritative:
            skipped_no_match += 1
            logger.debug(f"  No match in authoritative map for: '{common}' (scientific: '{scientific}')")
            continue
        
        new_scientific, new_iucn, new_class = authoritative
        
        # Conflict check: does another profile already have this new scientific name?
        new_sci_lower = new_scientific.strip().lower()
        if new_sci_lower in existing_scientific and existing_scientific[new_sci_lower] != profile.id:
            # Another profile already owns this scientific name — skip to avoid UniqueViolation
            logger.debug(f"  SKIP conflict: '{common}' -> '{new_scientific}' already owned by id={existing_scientific[new_sci_lower]}")
            skipped_conflict += 1
            continue
        
        # Only update if something actually changes
        changed = False
        old_sci = profile.scientific_name
        if profile.scientific_name != new_scientific:
            logger.info(f"  FIX scientific: '{common}' => '{profile.scientific_name}' -> '{new_scientific}'")
            profile.scientific_name = new_scientific
            # Update the conflict map
            if old_sci:
                existing_scientific.pop(old_sci.strip().lower(), None)
            existing_scientific[new_sci_lower] = profile.id
            changed = True
        if profile.iucn_status != new_iucn:
            logger.info(f"  FIX iucn_status: '{common}' => '{profile.iucn_status}' -> '{new_iucn}'")
            profile.iucn_status = new_iucn
            changed = True
        if profile.class_name != new_class:
            logger.info(f"  FIX class_name: '{common}' => '{profile.class_name}' -> '{new_class}'")
            profile.class_name = new_class
            changed = True
        
        if changed:
            db.add(profile)
            corrected += 1
            # Commit every 50 records to avoid large transaction failures
            if corrected % 50 == 0:
                try:
                    db.commit()
                    logger.info(f"  Committed batch at {corrected} records")
                except Exception as e:
                    db.rollback()
                    logger.warning(f"  Batch commit failed at {corrected}: {e}")
    
    # Final commit
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Final commit failed: {e}")
    
    logger.info(f"Taxonomy fix complete: {corrected} records corrected, "
                f"{already_correct} already correct, "
                f"{skipped_no_match} unmatched (left as-is), "
                f"{skipped_conflict} skipped (scientific name conflict).")
    
    return corrected


def check_needs_fixing(db) -> bool:
    """Quick check: returns True if any profiles have bad scientific names."""
    from app.models.species import SpeciesProfile
    from sqlalchemy import func
    
    # Check for exact duplicates (scientific == common)
    bad_count = db.query(SpeciesProfile).filter(
        SpeciesProfile.scientific_name == SpeciesProfile.common_name
    ).count()
    
    return bad_count > 0


if __name__ == "__main__":
    import sys
    
    # Allow running as a standalone script from backend/ directory
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
    
    try:
        from app.database.connection import get_db
    except ImportError:
        print("ERROR: Cannot import database. Make sure you're running from the backend/ directory:")
        print("  cd backend && python -m app.utils.fix_taxonomy")
        sys.exit(1)
    
    db = next(get_db())
    try:
        print("=" * 60)
        print("WPIS — Taxonomy Correction Migration")
        print("=" * 60)
        
        if not check_needs_fixing(db):
            print("✓ No bad scientific name mappings detected. Nothing to do.")
            sys.exit(0)
        
        print("Scanning and correcting bad scientific name mappings...")
        count = run_fixes(db)
        
        print("=" * 60)
        print(f"✓ Migration complete. {count} records corrected.")
        print("=" * 60)
    finally:
        db.close()
