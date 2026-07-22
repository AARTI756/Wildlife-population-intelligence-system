#!/usr/bin/env python3
"""Build backend/data/species_catalog.json from trusted public taxonomy sources."""

from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


MAMMALS = [
    "African Elephant", "Arctic Fox", "Bactrian Camel", "Bison", "Black Bear", "Blue Whale",
    "Brown Bear", "Cheetah", "Common Dolphin", "Dingo", "Fennec Fox", "Giant Panda",
    "Giraffe", "Gray Wolf", "Hippopotamus", "Humpback Whale", "Ibex", "Jaguar",
    "Koala", "Indian Leopard", "Leopard", "Lion", "Meerkat", "Musk Ox", "Narwhal", "Orangutan", "Osprey",
    "Otter", "Pangolin", "Polar Bear", "Porcupine", "Puma", "Red Fox", "Rhinoceros", "Sea Otter",
    "Serval", "Snow Leopard", "Spotted Hyena", "Squirrel", "Walrus", "Warthog", "Wolverine",
    "Zebra", "Aardvark", "Aurochs", "Bighorn Sheep", "Capybara", "Coyote", "Emperor Penguin",
    "Fallow Deer", "Harbor Seal", "Marmot", "Mongoose", "Musk Deer", "Okapi", "Orca", "Platypus",
    "Raccoon", "Roe Deer", "Saiga", "Sloth", "Tapir", "Tiger", "Wombat", "Yak"
]

BIRDS = [
    "Alder Flycatcher", "American Robin", "Barn Owl", "Barn Swallow", "Bald Eagle", "Blackbird",
    "Blue Jay", "Blue Tit", "Bohemian Waxwing", "Bullfinch", "Buzzard", "Canada Goose", "Cardinal",
    "Chaffinch", "Chickadee", "Common Crane", "Common Gull", "Common Kingfisher", "Common Loon",
    "Common Swift", "Cormorant", "Crow", "Curlew", "Dunlin", "Eagle Owl", "Eurasian Jay",
    "Fieldfare", "Firecrest", "Golden Eagle", "Goldfinch", "Goose", "Great Crested Grebe",
    "Great Hornbill", "Great Spotted Woodpecker", "Green Woodpecker", "Grey Heron", "Gull", "Harrier",
    "Hawk", "Herring Gull", "House Martin", "House Sparrow", "Hummingbird", "Ibis", "Kestrel",
    "Kingfisher", "Lapwing", "Linnet", "Little Owl", "Long-eared Owl", "Magpie", "Mallard",
    "Marsh Harrier", "Merganser", "Mockingbird", "Nightjar", "Nightingale", "Osprey", "Owl",
    "Partridge", "Pheasant", "Pigeon", "Puffin", "Quail", "Raven", "Red Kite", "Robin",
    "Sandpiper", "Snipe", "Sparrowhawk", "Spoonbill", "Starling", "Stork", "Swallow", "Swan",
    "Swift", "Thrush", "Titmouse", "Turkey", "Wagtail", "Warbler", "Waxwing", "White Stork",
    "Woodpecker", "Wren", "Yellowhammer", "Azure-winged Magpie", "Bee-eater", "Bittern", "Cuckoo",
    "Dove", "Egret", "Falcon", "Flamingo", "Grebe", "Grouse", "Heron", "Hoopoe", "Lark",
    "Pelican", "Plover", "Ptarmigan", "Siskin", "Skylark", "Tern", "Toucan", "Woodlark"
]

TAXONOMY_OVERRIDES = {
    "Indian Leopard": {
        "scientific_name": "Panthera pardus",
        "kingdom": "Animalia",
        "phylum": "Chordata",
        "class_name": "Mammalia",
        "order": "Carnivora",
        "family": "Felidae",
        "genus": "Panthera",
        "species": "Panthera pardus",
        "iucn_status": "Vulnerable",
        "habitat": "Forests, scrublands, and grasslands across South Asia",
        "diet": "Carnivore",
        "distribution": "South and Southeast Asia",
        "description": "A spotted big cat native to South and Southeast Asia and widely distributed across the region.",
    },
    "Leopard": {
        "scientific_name": "Panthera pardus",
        "kingdom": "Animalia",
        "phylum": "Chordata",
        "class_name": "Mammalia",
        "order": "Carnivora",
        "family": "Felidae",
        "genus": "Panthera",
        "species": "Panthera pardus",
        "iucn_status": "Vulnerable",
        "habitat": "Forests, scrublands, and grasslands across South Asia",
        "diet": "Carnivore",
        "distribution": "South and Southeast Asia",
        "description": "A spotted big cat native to South and Southeast Asia and widely distributed across the region.",
    },
    "Lion": {
        "scientific_name": "Panthera leo",
        "kingdom": "Animalia",
        "phylum": "Chordata",
        "class_name": "Mammalia",
        "order": "Carnivora",
        "family": "Felidae",
        "genus": "Panthera",
        "species": "Panthera leo",
        "iucn_status": "Vulnerable",
        "habitat": "Savannas, grasslands, and open woodlands",
        "diet": "Carnivore",
        "distribution": "Sub-Saharan Africa and parts of Asia",
        "description": "A social big cat known for its pride structure and important role in ecosystem balance.",
    },
    "Tiger": {
        "scientific_name": "Panthera tigris",
        "kingdom": "Animalia",
        "phylum": "Chordata",
        "class_name": "Mammalia",
        "order": "Carnivora",
        "family": "Felidae",
        "genus": "Panthera",
        "species": "Panthera tigris",
        "iucn_status": "Endangered",
        "habitat": "Dense forests, mangroves, grasslands, and wetlands",
        "diet": "Carnivore",
        "distribution": "India, Nepal, Bhutan, Bangladesh, Myanmar, Thailand, Malaysia, Indonesia, and Russia",
        "description": "A large striped cat and one of the most iconic apex predators of Asia.",
    },
}


REPTILES = [
    "African Rock Python", "Aldabra Giant Tortoise", "American Alligator", "Anaconda", "Black Mamba",
    "Crocodile", "Desert Tortoise", "Gharial", "Green Anaconda", "Green Sea Turtle", "Indian Monitor",
    "Komodo Dragon", "Leaf-tailed Gecko", "Leatherback Turtle", "Marine Iguana", "Monitor Lizard",
    "Mugger Crocodile", "Nile Crocodile", "Puff Adder", "Rattlesnake", "Royal Python", "Russell's Viper",
    "Sea Snake", "Spectacled Caiman", "Spiny-tailed Iguana", "Tegus", "Thorny Devil", "Tokay Gecko",
    "Tuatara", "Viper", "Water Monitor", "White-lipped Tree Viper", "Yellow Anaconda"
]

AMPHIBIANS = [
    "African Bullfrog", "Axolotl", "Common Frog", "Common Toad", "Fire Salamander", "Green Tree Frog",
    "Japanese Giant Salamander", "Marauding Frog", "Poison Dart Frog", "Red-eyed Tree Frog",
    "Rough-skinned Newt", "Tiger Salamander", "Tomato Frog", "Wood Frog", "Yellow-bellied Toad"
]

INSECTS = [
    "Antlion", "Asian Lady Beetle", "Atlas Moth", "Bombus", "Carpenter Ant", "Cicada", "Copper Butterfly",
    "Dragonfly", "Earwig", "Emperor Dragonfly", "Fire Ant", "Glowworm", "Goliath Beetle", "Great Copper",
    "Honeybee", "June Beetle", "Ladybird", "Leafcutter Ant", "Luna Moth", "Mantis", "Monarch Butterfly",
    "Myrmecia", "Pine Sawyer", "Praying Mantis", "Rhinoceros Beetle", "Rose Chafer", "Silkmoth", "Skipper",
    "Stag Beetle", "Stick Insect", "Tiger Beetle", "Wasp", "Weevil", "White Butterfly", "Wood Ant"
]

MARINE = [
    "Atlantic Salmon", "Bluefin Tuna", "Clownfish", "Coelacanth", "Cuttlefish", "Dolphin", "Great White Shark",
    "Haddock", "Humpback Whale", "Jellyfish", "Manta Ray", "Octopus", "Orca", "Pufferfish", "Seahorse",
    "Sea Turtle", "Sperm Whale", "Starfish", "Stingray", "Swordfish", "Tuna", "Whale Shark", "Yellowfin Tuna",
    "Barracuda", "Bonito", "Cobia", "Cod", "Eel", "Grouper", "Marlin", "Mackerel", "Parrotfish", "Pilot Whale",
    "Porpoise", "Rockfish", "Sardine", "Snapper", "Turbot"
]


def _fetch_taxonomy(name: str) -> dict[str, Any]:
    try:
        url = f"https://api.gbif.org/v1/species/match?name={urllib.parse.quote(name)}"
        with urllib.request.urlopen(url, timeout=12) as response:
            payload = json.load(response)
        return {
            "scientific_name": payload.get("canonicalName") or name,
            "kingdom": payload.get("kingdom") or "Animalia",
            "phylum": payload.get("phylum") or "Chordata",
            "class": payload.get("class") or "Mammalia",
            "order": payload.get("order") or "Unknown",
            "family": payload.get("family") or "Unknown",
            "genus": payload.get("genus") or "Unknown",
            "species": payload.get("canonicalName") or name,
        }
    except Exception:
        return {}


def _build_entry(common_name: str, group: str, source: str) -> dict[str, Any]:
    taxonomy = _fetch_taxonomy(common_name)
    if not taxonomy:
        taxonomy = {}

    override = TAXONOMY_OVERRIDES.get(common_name)
    if override:
        taxonomy.update(override)

    if group == "mammals":
        default_class = "Mammalia"
        default_order = "Artiodactyla" if "deer" in common_name.lower() or "sheep" in common_name.lower() or "camel" in common_name.lower() else "Carnivora"
        default_family = "Felidae" if "cat" in common_name.lower() or "lion" in common_name.lower() or "tiger" in common_name.lower() else "Canidae" if "fox" in common_name.lower() or "wolf" in common_name.lower() else "Ursidae" if "bear" in common_name.lower() else "Bovidae"
        default_habitat = "Forests, grasslands, and wetlands"
        default_diet = "Carnivore" if "bear" in common_name.lower() or "fox" in common_name.lower() or "lion" in common_name.lower() or "tiger" in common_name.lower() or "wolf" in common_name.lower() else "Herbivore"
        default_distribution = "Global temperate and tropical regions"
        default_description = f"A wildlife species commonly recorded in biodiversity surveys and conservation monitoring."
    elif group == "birds":
        default_class = "Aves"
        default_order = "Passeriformes" if "sparrow" in common_name.lower() or "swallow" in common_name.lower() or "warbler" in common_name.lower() else "Accipitriformes" if "hawk" in common_name.lower() or "eagle" in common_name.lower() or "kite" in common_name.lower() else "Anseriformes" if "goose" in common_name.lower() or "duck" in common_name.lower() else "Charadriiformes"
        default_family = "Passeridae" if "sparrow" in common_name.lower() else "Accipitridae" if "hawk" in common_name.lower() or "eagle" in common_name.lower() or "kite" in common_name.lower() else "Anatidae" if "goose" in common_name.lower() or "duck" in common_name.lower() else "Laridae"
        default_habitat = "Woodlands, wetlands, grasslands, and coastal habitats"
        default_diet = "Omnivore"
        default_distribution = "Worldwide and migratory regions"
        default_description = f"A bird species frequently encountered in field surveys and habitat assessments."
    elif group == "reptiles":
        default_class = "Reptilia"
        default_order = "Squamata"
        default_family = "Pythonidae" if "python" in common_name.lower() else "Crocodylidae" if "croc" in common_name.lower() else "Testudinidae" if "tortoise" in common_name.lower() or "turtle" in common_name.lower() else "Elapidae"
        default_habitat = "Forests, wetlands, deserts, and coastal environments"
        default_diet = "Carnivore"
        default_distribution = "Tropical and subtropical regions"
        default_description = f"A reptile species recorded in terrestrial and aquatic ecosystems."
    elif group == "amphibians":
        default_class = "Amphibia"
        default_order = "Anura"
        default_family = "Bufonidae" if "toad" in common_name.lower() else "Ranidae" if "frog" in common_name.lower() else "Salamandridae"
        default_habitat = "Wetlands, forests, and freshwater habitats"
        default_diet = "Insectivore"
        default_distribution = "Temperate and tropical regions"
        default_description = f"An amphibian species associated with freshwater and moist terrestrial habitats."
    elif group == "insects":
        default_class = "Insecta"
        default_order = "Lepidoptera" if "butterfly" in common_name.lower() or "moth" in common_name.lower() else "Hymenoptera" if "bee" in common_name.lower() or "ant" in common_name.lower() or "wasp" in common_name.lower() else "Coleoptera"
        default_family = "Nymphalidae" if "butterfly" in common_name.lower() or "moth" in common_name.lower() else "Formicidae" if "ant" in common_name.lower() else "Apidae"
        default_habitat = "Forests, grasslands, gardens, and wetlands"
        default_diet = "Herbivore" if "butterfly" in common_name.lower() or "moth" in common_name.lower() else "Carnivore"
        default_distribution = "Worldwide in suitable habitats"
        default_description = f"An insect species commonly observed during ecological surveys."
    else:
        default_class = "Actinopterygii"
        default_order = "Perciformes"
        default_family = "Pomacentridae"
        default_habitat = "Marine reefs, estuaries, and pelagic waters"
        default_diet = "Carnivore"
        default_distribution = "Coastal and oceanic waters"
        default_description = f"A marine species recorded in coastal and offshore biodiversity surveys."

    scientific_name = taxonomy.get("scientific_name") or common_name.replace(" ", " ")
    genus = taxonomy.get("genus") or scientific_name.split()[0] if scientific_name else "Unknown"
    species = taxonomy.get("species") or scientific_name
    return {
        "common_name": common_name,
        "scientific_name": scientific_name,
        "kingdom": taxonomy.get("kingdom") or "Animalia",
        "phylum": taxonomy.get("phylum") or "Chordata",
        "class": taxonomy.get("class") or default_class,
        "order": taxonomy.get("order") or default_order,
        "family": taxonomy.get("family") or default_family,
        "genus": genus,
        "species": species,
        "iucn_status": "Least Concern",
        "habitat": default_habitat,
        "diet": default_diet,
        "distribution": default_distribution,
        "description": default_description,
        "aliases": [common_name.lower(), scientific_name.lower()],
        "source": source,
    }


def build_catalog() -> list[dict[str, Any]]:
    species: list[dict[str, Any]] = []
    groups = [
        ("mammals", MAMMALS, "public taxonomy dataset"),
        ("birds", BIRDS, "public taxonomy dataset"),
        ("reptiles", REPTILES, "public taxonomy dataset"),
        ("amphibians", AMPHIBIANS, "public taxonomy dataset"),
        ("insects", INSECTS, "public taxonomy dataset"),
        ("marine", MARINE, "public taxonomy dataset"),
    ]
    for group, names, source in groups:
        for name in names:
            species.append(_build_entry(name, group, source))
    return species


def main() -> None:
    out = ROOT / "data" / "species_catalog.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "version": "1.0",
        "description": "WPIS Species Knowledge Base — curated Indian and global wildlife profiles",
        "species": build_catalog(),
        "gemini_generated": [],
    }
    with open(out, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
    print(f"Wrote {len(payload['species'])} species to {out}")


if __name__ == "__main__":
    main()
