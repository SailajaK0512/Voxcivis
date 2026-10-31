from datetime import datetime
from typing import Tuple
from ..config import (
    PRIORITY_BASE_SCORE,
    PRIORITY_SEVERE_BONUS,
    PRIORITY_CRITICAL_BONUS,
    PRIORITY_IMPORTANT_AREA_BONUS,
    PRIORITY_POINTS_PER_REPORT,
    PRIORITY_POINTS_PER_DAY,
    PRIORITY_THRESHOLDS
)

def calculate_priority_score(
    is_severe: bool,
    area_importance: int,
    number_of_reports: int = 1,
    issue_time: datetime = None,
    status: str = "Pending",
    resolved_at: datetime = None,
    is_critical: bool = False,
    severity_bonus: int = 0
) -> Tuple[int, str]:
    """
    Calculates dynamic priority score and classification based on municipal rules:
    - Base: 10 pts
    - Critical hazard: +40 pts (Total >= 50 => Critical)
    - Severe issue: +20 pts (Total >= 35 => High with area/reports)
    - Important Area: +10 pts
    - Additional reports: +5 pts per extra report
    - Unresolved delay: +5 pts per day elapsed
    Returns:
        (priority_score: int, priority_classification: str)
    """
    score = PRIORITY_BASE_SCORE

    if severity_bonus > 0:
        score += severity_bonus
    elif is_critical:
        score += PRIORITY_CRITICAL_BONUS
    elif is_severe:
        score += PRIORITY_SEVERE_BONUS

    if area_importance > 0:
        score += PRIORITY_IMPORTANT_AREA_BONUS

    # Additional reports bonus (+5 points for each report beyond the first)
    if number_of_reports > 1:
        score += (number_of_reports - 1) * PRIORITY_POINTS_PER_REPORT

    # Aging bonus (+5 points per day unresolved)
    if issue_time:
        ref_time = resolved_at if status == "Solved" and resolved_at else datetime.utcnow()
        days_elapsed = max(0, (ref_time - issue_time).days)
        score += days_elapsed * PRIORITY_POINTS_PER_DAY

    # Classification against configurable thresholds
    if score >= PRIORITY_THRESHOLDS["Critical"]:
        classification = "Critical"
    elif score >= PRIORITY_THRESHOLDS["High"]:
        classification = "High"
    elif score >= PRIORITY_THRESHOLDS["Medium"]:
        classification = "Medium"
    else:
        classification = "Low"

    return score, classification
