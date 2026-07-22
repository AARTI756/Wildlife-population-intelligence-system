import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app.services import species_enrichment, species_resolver
from app.services.species_catalog import SpeciesCatalog


class DummyDB:
    def __init__(self):
        self.added = []

    def query(self, model):
        return self

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return None

    def all(self):
        return []

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        return None

    def rollback(self):
        return None

    def refresh(self, obj):
        return None


class SpeciesCatalogRefactorTests(unittest.TestCase):
    def test_catalog_contains_real_taxonomy_for_common_species(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            catalog = SpeciesCatalog(catalog_path=Path(tmpdir) / "species_catalog.json")
            catalog.load()

            entry = catalog.lookup("Indian Leopard")
            self.assertIsNotNone(entry)
            self.assertEqual(entry["scientific_name"], "Panthera pardus")
            self.assertEqual(entry["kingdom"], "Animalia")
            self.assertEqual(entry["class_name"], "Mammalia")
            self.assertNotEqual(entry["scientific_name"], "Panthera species")
            self.assertNotIn("species", entry["scientific_name"].lower())

    def test_enrichment_and_resolver_use_catalog_for_known_species(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            catalog = SpeciesCatalog(catalog_path=Path(tmpdir) / "species_catalog.json")
            catalog.load()
            species_enrichment.species_catalog = catalog
            species_resolver.species_catalog = catalog

            db = DummyDB()
            profile = species_enrichment.enrich_missing_profile("Tiger", db)
            self.assertIsNotNone(profile)
            self.assertEqual(profile.common_name, "Tiger")
            self.assertEqual(profile.scientific_name, "Panthera tigris")

            resolved = species_resolver.resolve_species_profile("Tiger", db)
            self.assertIsNotNone(resolved)
            self.assertEqual(resolved.scientific_name, "Panthera tigris")

    @patch("app.services.species_enrichment.generate_species_profile")
    def test_known_species_do_not_call_gemini(self, mock_generate):
        with tempfile.TemporaryDirectory() as tmpdir:
            catalog = SpeciesCatalog(catalog_path=Path(tmpdir) / "species_catalog.json")
            catalog.load()
            species_enrichment.species_catalog = catalog
            species_resolver.species_catalog = catalog

            db = DummyDB()
            profile = species_enrichment.enrich_missing_profile("Lion", db)
            self.assertIsNotNone(profile)
            self.assertEqual(profile.common_name, "Lion")
            mock_generate.assert_not_called()

    @patch("app.services.species_resolver.generate_species_profile")
    def test_unknown_species_call_gemini_once(self, mock_generate):
        with tempfile.TemporaryDirectory() as tmpdir:
            catalog = SpeciesCatalog(catalog_path=Path(tmpdir) / "species_catalog.json")
            catalog.load()
            species_enrichment.species_catalog = catalog
            species_resolver.species_catalog = catalog
            mock_generate.return_value = {
                "common_name": "Kangaroo",
                "scientific_name": "Macropus giganteus",
                "kingdom": "Animalia",
                "phylum": "Chordata",
                "class_name": "Mammalia",
                "order": "Diprotodontia",
                "family": "Macropodidae",
                "genus": "Macropus",
                "species": "Macropus giganteus",
                "iucn_status": "Least Concern",
                "habitat": "Grasslands",
                "diet": "Herbivore",
                "distribution": "Australia",
                "description": "A marsupial known for its powerful legs and hopping gait.",
            }

            db = DummyDB()
            resolved = species_resolver.resolve_species_profile("Kangaroo", db)
            self.assertIsNotNone(resolved)
            mock_generate.assert_called_once_with("Kangaroo")

    def test_append_returns_false_for_invalid_profile(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            catalog = SpeciesCatalog(catalog_path=Path(tmpdir) / "species_catalog.json")
            catalog.load()

            result = catalog.append({"common_name": "", "scientific_name": ""}, "Bad entry")
            self.assertFalse(result)

    @patch("app.services.species_enrichment.generate_species_profile")
    def test_invalid_gemini_profile_returns_minimal_profile(self, mock_generate):
        with tempfile.TemporaryDirectory() as tmpdir:
            catalog = SpeciesCatalog(catalog_path=Path(tmpdir) / "species_catalog.json")
            catalog.load()
            species_enrichment.species_catalog = catalog
            species_resolver.species_catalog = catalog
            mock_generate.return_value = {"common_name": "", "scientific_name": ""}

            db = DummyDB()
            profile = species_enrichment.enrich_missing_profile("Mystery Species", db)
            self.assertIsNotNone(profile)
            self.assertEqual(profile.common_name, "Mystery Species")
            self.assertEqual(profile.scientific_name, "Mystery Species")


if __name__ == "__main__":
    unittest.main()
