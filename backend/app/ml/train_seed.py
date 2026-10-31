import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(MODEL_DIR, "department_classifier.joblib")

TRAINING_DATA = [
    # Roads & Pavements
    ("Huge pothole on the main road causing traffic delays and vehicle damage", "Roads & Pavements"),
    ("Asphalt is completely eroded on 4th cross road, gravel is loose", "Roads & Pavements"),
    ("Broken pavement sidewalk making it impossible for pedestrians to walk", "Roads & Pavements"),
    ("Deep crater in the middle of highway lane near market junction", "Roads & Pavements"),
    ("Road resurfacing was done poorly and road has developed uneven bumps", "Roads & Pavements"),
    ("Footpath tiles are broken and sticking out, tripping elderly people", "Roads & Pavements"),
    ("Tar is peeling off after the rain, large stones exposed on road", "Roads & Pavements"),
    ("Unpaved muddy road with deep tire ruts needing urgent tarring", "Roads & Pavements"),

    # Water Supply & Pipeline
    ("Main drinking water pipeline burst and clean water is flooding the street", "Water Supply & Pipeline"),
    ("Tap water is brown, muddy, and smelling foul for the past two days", "Water Supply & Pipeline"),
    ("No water supply in sector 4 for over 48 hours without prior notice", "Water Supply & Pipeline"),
    ("Water pressure is extremely low, unable to fill storage tanks", "Water Supply & Pipeline"),
    ("Underground supply line leaking under the street near water tank", "Water Supply & Pipeline"),
    ("Contaminated water coming from municipal tap, residents falling ill", "Water Supply & Pipeline"),
    ("Air lock in water pipeline, no flow coming to entire residential block", "Water Supply & Pipeline"),
    ("Water valve broken near corner house, massive wastage of potable water", "Water Supply & Pipeline"),

    # Electricity & Power
    ("High tension wire snapped and hanging dangerously close to pedestrian path", "Electricity & Power"),
    ("Transformer is sparking loudly and emitting black smoke near residential area", "Electricity & Power"),
    ("Complete power outage in phase 2 for the last 6 hours", "Electricity & Power"),
    ("Severe voltage fluctuations damaging household appliances", "Electricity & Power"),
    ("Electric junction box cover is open with exposed live wires accessible to children", "Electricity & Power"),
    ("Frequent power trips every 15 minutes due to overloaded local grid", "Electricity & Power"),
    ("Electric pole damaged after truck hit it, leaning at 45 degree angle", "Electricity & Power"),
    ("Short circuit sparks in distribution box causing fire scare", "Electricity & Power"),

    # Sanitation & Waste Management
    ("Garbage dumpster is overflowing and trash is scattered across the road", "Sanitation & Waste Management"),
    ("Sanitation workers have not picked up residential waste for an entire week", "Sanitation & Waste Management"),
    ("Huge mound of rotten organic waste producing horrible stench and flies", "Sanitation & Waste Management"),
    ("Illegal dumping of construction debris and plastic garbage in open plot", "Sanitation & Waste Management"),
    ("Commercial market bins left uncleaned, attracting stray animals and pests", "Sanitation & Waste Management"),
    ("Littering and piles of decaying food waste outside public school gate", "Sanitation & Waste Management"),
    ("Bio-waste and medical bottles dumped in ordinary community dustbin", "Sanitation & Waste Management"),
    ("Dead animal carcass lying uncollected on the side of the main street", "Sanitation & Waste Management"),

    # Public Health & Disease Control
    ("Stagnant water pool creating heavy mosquito breeding ground, risk of dengue", "Public Health & Disease Control"),
    ("Multiple cases of malaria reported in colony, municipal fumigation required", "Public Health & Disease Control"),
    ("Stray dog menace with aggressive pack biting pedestrians and school kids", "Public Health & Disease Control"),
    ("Foul smell and open slaughterhouse waste creating public epidemic hazard", "Public Health & Disease Control"),
    ("Dead rat and carcass decaying near public water fountain, health emergency", "Public Health & Disease Control"),
    ("Lack of hygiene inspection in public eateries causing stomach infections", "Public Health & Disease Control"),
    ("Need urgent anti-larval spray in swampy empty plots before monsoon", "Public Health & Disease Control"),
    ("Contagious skin disease spreading due to dirty public pond", "Public Health & Disease Control"),

    # Street Lighting
    ("Street lights on 5th avenue are not turning on at night, road is pitch dark", "Street Lighting"),
    ("Street light pole broken and bulb smashed after vehicle collision", "Street Lighting"),
    ("Halogen lamp flickering continuously and making loud buzzing noise", "Street Lighting"),
    ("Entire stretch of ring road has non-functional streetlights, unsafe for women", "Street Lighting"),
    ("Street light turns on during bright daylight and stays off after sunset", "Street Lighting"),
    ("Dark alleyway behind colony needs installation of new LED street lamps", "Street Lighting"),
    ("Wire disconnected from streetlight mast, leaving junction completely blacked out", "Street Lighting"),
    ("Streetlight timer malfunction keeps area in total darkness all night", "Street Lighting"),

    # Drainage & Sewerage
    ("Underground sewer line blocked and raw sewage is overflowing on the road", "Drainage & Sewerage"),
    ("Open manhole cover stolen or broken, deep death trap for motorists", "Drainage & Sewerage"),
    ("Stormwater drain choked with plastic bottles causing rain waterlogging", "Drainage & Sewerage"),
    ("Sewage water backing up into residential toilets and ground floor sinks", "Drainage & Sewerage"),
    ("Gutter wall collapsed and filthy sludge is spilling into street", "Drainage & Sewerage"),
    ("Monsoon rain has caused knee-deep flooding because drain outlets are clogged", "Drainage & Sewerage"),
    ("Foul sewer gases leaking from cracked drainage manhole in colony", "Drainage & Sewerage"),
    ("Manhole slab cracked and sinking into road under vehicle load", "Drainage & Sewerage"),

    # Parks & Public Spaces
    ("Children swings and slides in municipal park are broken with sharp metal edges", "Parks & Public Spaces"),
    ("Large tree branch fell on the walking track inside the public garden", "Parks & Public Spaces"),
    ("Overgrown grass and thorny bushes making community park unusable", "Parks & Public Spaces"),
    ("Public benches in municipal garden vandalized and broken", "Parks & Public Spaces"),
    ("Jogging track surface is dug up and not repaired in town park", "Parks & Public Spaces"),
    ("Park lighting is broken and anti-social elements gathering after hours", "Parks & Public Spaces"),
    ("Fountain in public square has stagnant green algae water and garbage", "Parks & Public Spaces"),
    ("Boundary wall of municipal playground has collapsed", "Parks & Public Spaces"),

    # Traffic & Road Safety
    ("Traffic signal lights at crossroad intersection are dead, causing massive jams", "Traffic & Road Safety"),
    ("Missing speed breaker warning sign near school, vehicles speeding dangerously", "Traffic & Road Safety"),
    ("Road median divider barrier is broken, vehicles taking illegal hazardous U-turns", "Traffic & Road Safety"),
    ("Blind corner turn needs convex mirror and warning reflector sign", "Traffic & Road Safety"),
    ("Zebra crossing paint completely faded away, pedestrians unable to cross safely", "Traffic & Road Safety"),
    ("Traffic signal stuck constantly on yellow light causing gridlock", "Traffic & Road Safety"),
    ("No parking sign fallen down, heavy trucks blocking two lanes", "Traffic & Road Safety"),
    ("Dangerous intersection with frequent accidents needs immediate rumble strips", "Traffic & Road Safety"),

    # Building & Structural Safety
    ("Old dilapidated building facade has developed massive cracks, risking collapse", "Building & Structural Safety"),
    ("Concrete chunks falling from underside of railway overbridge onto traffic", "Building & Structural Safety"),
    ("Illegal multi-story construction violating safety norms and leaning over neighbor", "Building & Structural Safety"),
    ("Retaining wall along the hillside road showing signs of buckling and slide", "Building & Structural Safety"),
    ("Flyover pillar concrete spalling with rusted steel reinforcement exposed", "Building & Structural Safety"),
    ("Abandoned building roof partially caved in, dangerous for passersby", "Building & Structural Safety"),
    ("Unstable construction scaffolding dangling precariously over sidewalk", "Building & Structural Safety"),
    ("Public foot-over-bridge vibrating severely with loose metal decking", "Building & Structural Safety")
]

def train_and_save_model():
    """Trains TF-IDF + Logistic Regression Classifier and saves to disk"""
    texts = [item[0] for item in TRAINING_DATA]
    labels = [item[1] for item in TRAINING_DATA]

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), stop_words="english", sublinear_tf=True)),
        ("clf", LogisticRegression(max_iter=1000, C=5.0))
    ])

    pipeline.fit(texts, labels)
    joblib.dump(pipeline, MODEL_FILE)
    print(f"VoxCivis ML Department Classifier successfully trained and saved to {MODEL_FILE}")
    return pipeline

if __name__ == "__main__":
    train_and_save_model()
