import re
from typing import Dict, List

# Tier 1: Extreme Life Threat / Critical Catastrophe Hazards
CRITICAL_HAZARD_PATTERNS = [
    # Electrical catastrophes
    r"\b(spark|sparks|sparking|live\s*wire|live\s*wires|overhead\s*wire|electric\s*wire|electrical\s*wire|high\s*voltage|electrocution|electric\s*shock|transformer|short\s*circuit)\b",
    # Fire & Explosions
    r"\b(fire|flame|flames|blaze|gas\s*leak|cylinder\s*leak|explosion|exploded|blast|combustion|burning)\b",
    # Lethal Physical Traps & Collapse
    r"\b(open\s*manhole|uncovered\s*drain|manhole\s*without\s*cover|sinkhole|collapse|collapsed|collapsing|caved?\s*in|falling\s*debris|cracked\s*pillar|bridge\s*damage|building\s*tilt)\b",
    # Disaster Flooding
    r"\b(flash\s*flood|water\s*entering\s*homes|drowning\s*risk|submerged)\b",
    # Explicit Human Peril
    r"\b(life\s*threatening|critical|fatal|fatality|casualty|ambulance\s*blocked|people\s*injured|bleeding)\b"
]

# Tier 2: Severe Civic Infrastructure & Public Health Issues
SEVERE_ISSUE_PATTERNS = [
    # Danger & Urgency keywords
    r"\b(danger|dangerous|dangerously|hazard|hazardous|urgent|urgently|urgency|severe|severity|serious|seriously|emergency|unsafe)\b",
    # Road hazards & accidents
    r"\b(deep\s*pothole|huge\s*pothole|potholes?|crater|accident|accidents|crash|crashed|injury|injured|hurt|vehicle\s*damage|broken\s*divider)\b",
    # Pipeline & Sewerage
    r"\b(pipe\s*burst|pipeline\s*burst|burst\s*pipe|flood|flooding|waterlogging|waterlogged|sewage|sewer|drainage|manhole)\b",
    # Public health & toxicity
    r"\b(toxic|poisonous|contamination|contaminated|epidemic|dengue|malaria|cholera|dead\s*animal|carcass|rotting|foul\s*stench|biohazard)\b",
    # Dark & unsafe infrastructure
    r"\b(blackout|pitch\s*dark|dark\s*road|dark\s*street|broken\s*signal|traffic\s*jam|traffic\s*gridlock)\b"
]

# Tier 3: Important Civic Area / Landmark mentions
IMPORTANT_AREA_PATTERNS = [
    r"\b(hospital|clinic|nursing\s*home|dispensary|school|college|university|kindergarten)\b",
    r"\b(main\s*road|highway|expressway|ring\s*road|junction|crossroad|flyover)\b",
    r"\b(market|bazaar|metro\s*station|railway\s*station|bus\s*depot|bus\s*stand|bus\s*stop)\b"
]

COMPILED_CRITICAL = [re.compile(p, re.IGNORECASE) for p in CRITICAL_HAZARD_PATTERNS]
COMPILED_SEVERE = [re.compile(p, re.IGNORECASE) for p in SEVERE_ISSUE_PATTERNS]
COMPILED_AREAS = [re.compile(p, re.IGNORECASE) for p in IMPORTANT_AREA_PATTERNS]

def detect_severity(text: str, address: str = "") -> Dict:
    """
    Comprehensive NLP/regex analysis of civic grievance text to assess:
    - is_critical (bool): immediate life/public disaster danger
    - is_severe (bool): major civic hazard or infrastructure breakdown
    - severity_bonus (int): dynamic points to add (+40 for critical, +20 for severe)
    - auto_important_area (bool): whether text/address refers to high-traffic public institutions
    - matched_cues (list): specific triggers detected
    """
    if not text:
        return {
            "is_critical": False,
            "is_severe": False,
            "severity_bonus": 0,
            "auto_important_area": False,
            "matched_cues": []
        }

    combined_text = f"{text} {address}".lower()
    matched_cues = []

    # 1. Check Critical Hazards
    is_critical = False
    for p in COMPILED_CRITICAL:
        m = p.findall(combined_text)
        if m:
            is_critical = True
            for match in m:
                matched_cues.append(match[0] if isinstance(match, tuple) else match)

    # 2. Check Severe Issues
    is_severe = is_critical
    for p in COMPILED_SEVERE:
        m = p.findall(combined_text)
        if m:
            is_severe = True
            for match in m:
                matched_cues.append(match[0] if isinstance(match, tuple) else match)

    # 3. Check Area Importance
    auto_important_area = False
    for p in COMPILED_AREAS:
        if p.search(combined_text):
            auto_important_area = True
            break

    # Calculate severity bonus:
    # Critical Hazard: +40 points (Guarantees Critical score >= 50 on Day 0)
    # Severe Issue: +20 points (Guarantees High score >= 30 on Day 0)
    # Normal/Routine: 0 points (Stays Low 10 pts)
    if is_critical:
        severity_bonus = 40
    elif is_severe:
        severity_bonus = 20
    else:
        severity_bonus = 0

    return {
        "is_critical": is_critical,
        "is_severe": is_severe,
        "severity_bonus": severity_bonus,
        "auto_important_area": auto_important_area,
        "matched_cues": list(set(matched_cues))
    }
