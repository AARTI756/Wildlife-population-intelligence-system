"""Lightweight perceptual-hash framework; it never claims biometric certainty."""
import cv2
from app.models.observation import Observation

def crop_signature(path, bbox):
    image = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    if image is None: return None
    crop = image[max(0, bbox['y1']):max(0, bbox['y2']), max(0, bbox['x1']):max(0, bbox['x2'])]
    if crop.size == 0: return None
    resized = cv2.resize(crop, (9, 8))
    bits = resized[:, 1:] > resized[:, :-1]
    return format(int(''.join('1' if bit else '0' for bit in bits.flat), 2), '016x')

def _distance(left, right):
    return (int(left, 16) ^ int(right, 16)).bit_count()

def link_individual(db, species_name, signature):
    if not signature: return None, None, 0
    candidates = db.query(Observation).filter(Observation.species_name == species_name, Observation.individual_id.isnot(None)).all()
    hashes = [(observation, observation.individual_id.removeprefix('phash:')) for observation in candidates if observation.individual_id.startswith('phash:')]
    if hashes:
        match, existing = min(hashes, key=lambda item: _distance(signature, item[1]))
        distance = _distance(signature, existing)
        if distance <= 6:
            match.previous_sightings = (match.previous_sightings or 0) + 1
            return match.individual_id, round(max(0, 1 - distance / 64), 2), match.previous_sightings
    return f'phash:{signature}', None, 0
