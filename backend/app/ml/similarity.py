from typing import List, Optional, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from ..config import DUPLICATE_SIMILARITY_THRESHOLD

def find_duplicate_complaint(
    new_text: str,
    existing_candidates: List[dict] # list of dicts: {"id": int, "text": str}
) -> Optional[Tuple[int, float]]:
    """
    Compares new_text with existing candidate complaints in the same locality.
    Returns (parent_complaint_id, similarity_score) if above threshold, else None.
    """
    if not existing_candidates or not new_text.strip():
        return None

    texts = [cand["text"] for cand in existing_candidates]
    all_texts = [new_text] + texts

    try:
        vectorizer = TfidfVectorizer(ngram_range=(1, 1), stop_words="english")
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        
        # New text is at index 0, candidates are at 1..N
        sim_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

        max_idx = sim_scores.argmax()
        max_score = float(sim_scores[max_idx])

        if max_score >= DUPLICATE_SIMILARITY_THRESHOLD:
            return existing_candidates[max_idx]["id"], round(max_score, 3)
    except Exception:
        # Fallback if vocabulary issues occur
        return None

    return None
