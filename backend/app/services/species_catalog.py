"""
Centralized Species Knowledge Base for WPIS.

This module is the single source of truth for wildlife taxonomy data. The
catalog is persisted as JSON and loaded into memory once at startup so lookups
remain O(1) through a normalized dictionary and alias index.
"""

from __future__ import annotations

import json
import logging
import re
import threading
from collections.abc import Mapping
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

DEFAULT_CATALOG_PATH = Path(__file__).resolve().parents[2] / "data" / "species_catalog.json"

IUCN_TO_CONSERVATION = {
    "critically endangered": "Critical",
    "endangered": "High",
    "vulnerable": "Medium",
    "near threatened": "Moderate",
    "least concern": "Routine",
    "data deficient": "Unknown",
    "not evaluated": "Unknown",
}

IUCN_TO_THREAT = {
    "critically endangered": "Critical",
    "endangered": "High",
    "vulnerable": "Medium",
    "near threatened": "Low",
    "least concern": "Low",
    "data deficient": "Unknown",
    "not evaluated": "Unknown",
}


def normalize_key(name: str) -> str:
    return " ".join(re.sub(r"[^a-z0-9]+", " ", (name or "").lower()).split())


def derive_conservation_fields(iucn_status: str | None) -> tuple[str, str]:
    key = (iucn_status or "least concern").strip().lower()
    return (
        IUCN_TO_CONSERVATION.get(key, "Unknown"),
        IUCN_TO_THREAT.get(key, "Unknown"),
    )


def normalize_entry(raw: dict[str, Any], source: str = "catalog") -> dict[str, Any]:
    """Normalize a catalog entry to the canonical WPIS profile shape."""
    class_name = raw.get("class_name") or raw.get("class") or "Mammalia"
    iucn = raw.get("iucn_status") or "Least Concern"
    conservation_priority, threat_level = derive_conservation_fields(iucn)
    if raw.get("conservation_priority"):
        conservation_priority = raw["conservation_priority"]
    if raw.get("threat_level"):
        threat_level = raw["threat_level"]

    entry = {
        "common_name": raw.get("common_name") or "",
        "scientific_name": raw.get("scientific_name") or "",
        "kingdom": raw.get("kingdom") or "Animalia",
        "phylum": raw.get("phylum") or "Chordata",
        "class_name": class_name,
        "order": raw.get("order") or "",
        "family": raw.get("family") or "",
        "genus": raw.get("genus") or "",
        "species": raw.get("species") or raw.get("scientific_name") or "",
        "iucn_status": iucn,
        "diet": raw.get("diet") or "",
        "habitat": raw.get("habitat") or "",
        "distribution": raw.get("distribution") or "",
        "description": raw.get("description") or "",
        "conservation_priority": conservation_priority,
        "threat_level": threat_level,
        "source": source,
        "aliases": list(raw.get("aliases") or []),
    }
    return entry


def validate_profile(raw: dict[str, Any] | None, lookup_name: str) -> bool:
    if not isinstance(raw, Mapping):
        logger.warning("Rejected species profile for %s because it is not a mapping", lookup_name)
        return False

    common_name = str(raw.get("common_name") or "").strip()
    scientific_name = str(raw.get("scientific_name") or "").strip()
    if not common_name or not scientific_name:
        logger.warning("Rejected species profile for %s because key fields are missing", lookup_name)
        return False

    placeholder_markers = ["not available", "unknown", "placeholder"]
    lowered_common = common_name.lower()
    lowered_sci = scientific_name.lower()
    if any(marker in lowered_common for marker in placeholder_markers) or any(marker in lowered_sci for marker in placeholder_markers):
        logger.warning("Rejected species profile for %s because it contains placeholder taxonomy", lookup_name)
        return False

    required = ["kingdom", "phylum", "class_name", "order", "family", "genus", "habitat", "diet", "distribution", "description", "iucn_status"]
    for field in required:
        value = str(raw.get(field) or "").strip()
        if not value:
            logger.warning("Rejected species profile for %s because field %s is empty", lookup_name, field)
            return False

    return True


class SpeciesCatalog:
    """In-memory species knowledge base with alias-aware O(1) lookups."""

    def __init__(self, catalog_path: Path | None = None):
        self.catalog_path = catalog_path or DEFAULT_CATALOG_PATH
        self._entries: dict[str, dict[str, Any]] = {}
        self._alias_index: dict[str, str] = {}
        self._gemini_keys: set[str] = set()
        self._database_stored_count = 0
        self._lock = threading.Lock()
        self._loaded = False
        self.load()

    @property
    def loaded(self) -> bool:
        return self._loaded

    def _read_payload(self, path: Path) -> dict[str, Any]:
        if not path.exists() or path.stat().st_size == 0:
            return {
                "version": "1.0",
                "description": "WPIS Species Knowledge Base — curated Indian and global wildlife profiles",
                "species": [],
                "gemini_generated": [],
            }

        with open(path, encoding="utf-8") as handle:
            payload = json.load(handle)

        if isinstance(payload, dict):
            return payload

        return {
            "version": "1.0",
            "description": "WPIS Species Knowledge Base — curated Indian and global wildlife profiles",
            "species": [],
            "gemini_generated": [],
        }

    def load(self) -> None:
        with self._lock:
            payload = self._read_payload(self.catalog_path)
            if not payload.get("species") and self.catalog_path != DEFAULT_CATALOG_PATH and DEFAULT_CATALOG_PATH.exists():
                payload = self._read_payload(DEFAULT_CATALOG_PATH)
                self.catalog_path.parent.mkdir(parents=True, exist_ok=True)
                with open(self.catalog_path, "w", encoding="utf-8") as handle:
                    json.dump(payload, handle, indent=2, ensure_ascii=False)
            elif not self.catalog_path.exists():
                self.catalog_path.parent.mkdir(parents=True, exist_ok=True)
                with open(self.catalog_path, "w", encoding="utf-8") as handle:
                    json.dump(payload, handle, indent=2, ensure_ascii=False)

            self._entries.clear()
            self._alias_index.clear()
            self._gemini_keys.clear()

            for item in payload.get("species", []):
                self._register_entry(normalize_entry(item, source=item.get("source", "catalog")))

            for key in payload.get("gemini_generated", []):
                self._gemini_keys.add(normalize_key(key))

            self._loaded = True
            logger.info(
                "Species catalog loaded: %d entries (%d Gemini-generated keys tracked)",
                len(self._entries),
                len(self._gemini_keys),
            )

    def _register_entry(self, entry: dict[str, Any]) -> None:
        common_key = normalize_key(entry.get("common_name") or "")
        sci_key = normalize_key(entry.get("scientific_name") or "")
        if common_key:
            self._entries[common_key] = entry
            self._alias_index[common_key] = common_key
        if sci_key:
            self._entries[sci_key] = entry
            self._alias_index[sci_key] = common_key or sci_key

        for alias in entry.get("aliases", []):
            alias_key = normalize_key(alias)
            if alias_key:
                self._alias_index[alias_key] = common_key or sci_key or alias_key

    def lookup(self, raw_name: str) -> dict[str, Any] | None:
        if not self._loaded:
            self.load()

        key = normalize_key(raw_name)
        if not key:
            return None

        candidate = self._alias_index.get(key)
        if candidate and candidate in self._entries:
            logger.info("[SpeciesCatalog] Cache HIT: %s", raw_name)
            return dict(self._entries[candidate])

        if key in self._entries:
            logger.info("[SpeciesCatalog] Cache HIT: %s", raw_name)
            return dict(self._entries[key])

        for alias_key, canonical_key in self._alias_index.items():
            if key in alias_key or alias_key in key:
                entry = self._entries.get(canonical_key)
                if entry:
                    logger.info("[SpeciesCatalog] Cache HIT: %s", raw_name)
                    return dict(entry)

        logger.info("[SpeciesCatalog] Cache MISS: %s", raw_name)
        return None

    def append(self, raw: dict[str, Any], raw_lookup_name: str, source: str = "gemini") -> dict[str, Any] | bool:
        """Append a new species to the in-memory catalog and persist to disk."""
        entry = normalize_entry(raw, source=source)
        if not validate_profile(entry, raw_lookup_name):
            logger.warning("Rejected invalid species profile for %s; returning False", raw_lookup_name)
            return False

        lookup_key = normalize_key(raw_lookup_name)

        with self._lock:
            self._register_entry(entry)
            if source == "gemini":
                self._gemini_keys.add(lookup_key)
            self._persist()

        logger.info("Appended species '%s' to catalog (source=%s)", entry["common_name"], source)
        return entry

    def record_database_store(self) -> None:
        with self._lock:
            self._database_stored_count += 1

    def _persist(self) -> None:
        unique: dict[str, dict[str, Any]] = {}
        for entry in self._entries.values():
            unique[normalize_key(entry["common_name"])] = {
                k: v for k, v in entry.items() if k not in {"source"}
            }

        payload = {
            "version": "1.0",
            "description": "WPIS Species Knowledge Base — curated Indian and global wildlife profiles",
            "species": sorted(unique.values(), key=lambda item: item.get("common_name", "")),
            "gemini_generated": sorted(self._gemini_keys),
        }

        self.catalog_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.catalog_path, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2, ensure_ascii=False)

    def stats(self) -> dict[str, Any]:
        if not self._loaded:
            self.load()

        unique_entries: dict[str, dict[str, Any]] = {}
        for entry in self._entries.values():
            unique_entries[normalize_key(entry["common_name"])] = entry

        class_counts: dict[str, int] = {}
        for entry in unique_entries.values():
            taxon_class = entry.get("class_name") or "Unknown"
            class_counts[taxon_class] = class_counts.get(taxon_class, 0) + 1

        return {
            "total_species": len(unique_entries),
            "mammals": class_counts.get("Mammalia", 0),
            "birds": class_counts.get("Aves", 0),
            "reptiles": class_counts.get("Reptilia", 0),
            "amphibians": class_counts.get("Amphibia", 0),
            "fish": class_counts.get("Actinopterygii", 0) + class_counts.get("Chondrichthyes", 0),
            "insects": class_counts.get("Insecta", 0),
            "other": sum(
                count
                for cls, count in class_counts.items()
                if cls not in {"Mammalia", "Aves", "Reptilia", "Amphibia", "Actinopterygii", "Chondrichthyes", "Insecta"}
            ),
            "gemini_generated_profiles": len(self._gemini_keys),
            "database_stored_profiles": self._database_stored_count,
            "class_breakdown": class_counts,
        }


species_catalog = SpeciesCatalog()
