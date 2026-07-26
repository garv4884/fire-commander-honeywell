"""
sensor_fusion.py — Exponential sensor fusion for ESP32
W(e) = base × exp(α·T̃ + β·S̃ + γ·F) × (1 + δ·O)
"""

import math
from config import (
    ALPHA, BETA, GAMMA, DELTA,
    TEMP_AMBIENT, TEMP_BLOCK, SMOKE_BLOCK,
    TEMP_CAUTION, TEMP_WARNING, TEMP_DANGER,
    SMOKE_CAUTION, SMOKE_WARNING, SMOKE_DANGER
)


def classify_hazard(reading):
    """Classify a SensorReading into a hazard level string."""
    t = reading.temperature
    s = reading.smoke_ppm
    f = reading.flame_detected

    if t > TEMP_BLOCK or s > SMOKE_BLOCK:
        return 'BLOCKED'
    if t > TEMP_DANGER or s > SMOKE_DANGER or f:
        return 'DANGER'
    if t > TEMP_WARNING or s > SMOKE_WARNING:
        return 'WARNING'
    if t > TEMP_CAUTION or s > SMOKE_CAUTION:
        return 'CAUTION'
    return 'SAFE'


def _norm_temp(temp):
    """Normalise temperature to [0, 1]. 25°C → 0, 600°C → 1."""
    return max(0.0, min(1.0, (temp - TEMP_AMBIENT) / (600.0 - TEMP_AMBIENT)))


def _norm_smoke(ppm):
    """Normalise smoke PPM to [0, 1]. 0 → 0, 1000 → 1."""
    return max(0.0, min(1.0, ppm / 1000.0))


def compute_edge_weight(base_weight, from_reading, to_reading):
    """
    Compute dynamically fused traversal weight for an edge.

    Args:
        base_weight:  float — static distance cost of the edge
        from_reading: SensorReading | None — source zone
        to_reading:   SensorReading | None — destination zone

    Returns:
        (weight: float, blocked: bool, hazard: str)
    """
    # Use worst of the two zones (conservative)
    temp  = max(
        from_reading.temperature if from_reading else TEMP_AMBIENT,
        to_reading.temperature   if to_reading   else TEMP_AMBIENT,
    )
    smoke = max(
        from_reading.smoke_ppm if from_reading else 0,
        to_reading.smoke_ppm   if to_reading   else 0,
    )
    flame = (
        (from_reading.flame_detected if from_reading else False) or
        (to_reading.flame_detected   if to_reading   else False)
    )
    occ = to_reading.occupancy if to_reading else 0

    # Hard block — impassable
    if temp > TEMP_BLOCK or smoke > SMOKE_BLOCK:
        return (float('inf'), True, 'BLOCKED')

    # Exponential formula
    t_norm = _norm_temp(temp)
    s_norm = _norm_smoke(smoke)
    f_val  = 1.0 if flame else 0.0

    exponent   = ALPHA * t_norm + BETA * s_norm + GAMMA * f_val
    multiplier = math.exp(exponent)
    occ_factor = 1.0 + DELTA * occ

    weight = base_weight * multiplier * occ_factor

    # Determine hazard level
    from sensor_reader import SensorReading
    dummy = SensorReading('_', temperature=temp, smoke_ppm=smoke, flame_detected=flame)
    hazard = classify_hazard(dummy)

    return (weight, False, hazard)


def compute_zone_risk_score(reading):
    """
    Return a 0-100 risk score for display/gauges.
    Uses weighted sum (not exponential) for proportional display.
    """
    t_norm = _norm_temp(reading.temperature)
    s_norm = _norm_smoke(reading.smoke_ppm)
    f_val  = 1.0 if reading.flame_detected else 0.0

    total_weight = ALPHA + BETA + GAMMA
    score = (ALPHA * t_norm + BETA * s_norm + GAMMA * f_val) / total_weight
    return min(100, score * 100)
