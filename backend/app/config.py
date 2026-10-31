import os

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./voxcivis.db")

# JWT Security
SECRET_KEY = os.getenv("SECRET_KEY", "voxcivis_civic_secure_key_2026_super_secret_municipal_token")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Priority Scoring Weights
PRIORITY_BASE_SCORE = 10
PRIORITY_SEVERE_BONUS = 20
PRIORITY_CRITICAL_BONUS = 40
PRIORITY_IMPORTANT_AREA_BONUS = 10
PRIORITY_POINTS_PER_REPORT = 5
PRIORITY_POINTS_PER_DAY = 5

# Configurable Priority Thresholds
# Score >= 50 => Critical
# Score >= 30 => High
# Score >= 20 => Medium
# Else (< 20) => Low
PRIORITY_THRESHOLDS = {
    "Critical": 50,
    "High": 30,
    "Medium": 20,
    "Low": 0
}

# Similarity threshold for duplicate civic complaint detection (0.0 to 1.0)
DUPLICATE_SIMILARITY_THRESHOLD = 0.55

# Supported Municipal Departments
DEFAULT_DEPARTMENTS = [
    {"name": "Roads & Pavements", "code": "ROADS", "description": "Potholes, broken roads, damaged footpaths, resurfacing"},
    {"name": "Water Supply & Pipeline", "code": "WATER", "description": "Pipe bursts, water contamination, low pressure, shortage"},
    {"name": "Electricity & Power", "code": "POWER", "description": "Power outages, hanging wires, transformer sparks, voltage drops"},
    {"name": "Sanitation & Waste Management", "code": "SANITATION", "description": "Garbage piles, uncleaned dumpsters, littering, biohazard waste"},
    {"name": "Public Health & Disease Control", "code": "HEALTH", "description": "Mosquito breeding, stray animal disease, epidemic risks, dead animals"},
    {"name": "Street Lighting", "code": "LIGHTING", "description": "Non-working street lamps, broken poles, dark alleyways"},
    {"name": "Drainage & Sewerage", "code": "DRAINAGE", "description": "Sewage overflow, blocked drains, open manholes, rainwater clogging"},
    {"name": "Parks & Public Spaces", "code": "PARKS", "description": "Fallen trees, overgrown grass, vandalized public benches, park maintenance"},
    {"name": "Traffic & Road Safety", "code": "TRAFFIC", "description": "Broken traffic signals, missing road signs, dangerous road divider"},
    {"name": "Building & Structural Safety", "code": "BUILDING", "description": "Dilapidated structures, wall collapse risk, illegal construction hazards"}
]

# Municipal States and Districts for standard dropdown selection
LOCATION_DATA = {
    "Maharashtra": ["Mumbai City", "Mumbai Suburban", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur"],
    "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "South Delhi", "West Delhi"],
    "Karnataka": ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Mangaluru", "Hubballi-Dharwad", "Belagavi"],
    "Telangana": ["Hyderabad", "Ranga Reddy", "Medchal-Malkajgiri", "Warangal", "Nizamabad", "Karimnagar"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Gandhinagar"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Prayagraj", "Noida (Gautam Buddha Nagar)", "Ghaziabad", "Agra"],
    "West Bengal": ["Kolkata", "Howrah", "North 24 Parganas", "South 24 Parganas", "Darjeeling", "Siliguri"]
}
