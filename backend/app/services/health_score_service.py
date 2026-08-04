from typing import Dict, Any, Optional

from app.services.health_scoring import get_health_overview, get_health_breakdown, get_health_trends, get_health_distribution

def compute_ecosystem_health_score(
    biodiversity_metrics: Optional[Dict[str, Any]] = None,
    observation_statistics: Optional[Dict[str, Any]] = None,
    habitat_quality: Optional[Dict[str, Any]] = None,
    environmental_conditions: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Compatibility wrapper that returns the canonical weighted health score."""

    return get_health_overview(None)


def get_health_overview(db, **filters) -> Dict[str, Any]:
    return get_health_overview(db, **filters)


def get_health_breakdown(db, **filters):
    return get_health_breakdown(db, **filters)


def get_health_trends(db, **filters):
    return get_health_trends(db, **filters)


def get_health_distribution(db, **filters):
    return get_health_distribution(db, **filters)
