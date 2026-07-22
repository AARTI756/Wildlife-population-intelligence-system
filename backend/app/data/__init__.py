"""Curated species profiles for the WPIS Species Knowledge Base."""


def entry(
    common_name,
    scientific_name,
    class_name,
    order,
    family,
    genus,
    iucn_status,
    diet,
    habitat,
    distribution,
    description,
    aliases=None,
    phylum="Chordata",
    kingdom="Animalia",
):
    return {
        "common_name": common_name,
        "scientific_name": scientific_name,
        "kingdom": kingdom,
        "phylum": phylum,
        "class_name": class_name,
        "order": order,
        "family": family,
        "genus": genus,
        "species": scientific_name,
        "iucn_status": iucn_status,
        "diet": diet,
        "habitat": habitat,
        "distribution": distribution,
        "description": description,
        "aliases": aliases or [],
    }
