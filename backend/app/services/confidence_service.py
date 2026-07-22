"""
Confidence service for classifying prediction scores.
"""

def estimate_confidence(confidence: float) -> str:
    """
    Classify confidence score into HIGH, MEDIUM, LOW, or UNKNOWN levels.
    """
    if confidence >= 0.80:
        return "HIGH"
    elif confidence >= 0.60:
        return "MEDIUM"
    elif confidence >= 0.40:
        return "LOW"
    else:
        return "UNKNOWN"
