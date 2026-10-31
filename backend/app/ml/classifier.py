import os
from typing import Tuple
import joblib
from .train_seed import MODEL_FILE, train_and_save_model

_model = None

def get_classifier():
    global _model
    if _model is not None:
        return _model

    if not os.path.exists(MODEL_FILE):
        _model = train_and_save_model()
    else:
        try:
            _model = joblib.load(MODEL_FILE)
        except Exception:
            _model = train_and_save_model()
    return _model

def predict_department(text: str) -> Tuple[str, float]:
    """
    Predicts the appropriate municipal department for given complaint text.
    Returns:
        (department_name, confidence_score)
    """
    if not text or not text.strip():
        return "Roads & Pavements", 0.0

    model = get_classifier()
    prediction = model.predict([text])[0]
    
    # Calculate probability if model supports predict_proba
    try:
        probs = model.predict_proba([text])[0]
        confidence = float(max(probs))
    except Exception:
        confidence = 0.85

    return str(prediction), round(confidence, 3)
