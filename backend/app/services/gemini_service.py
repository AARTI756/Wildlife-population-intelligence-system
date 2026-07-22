"""Optional Gemini services. AI enrichment never suppresses a model detection."""
import base64
import json
import logging
import re
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

def _generate(contents):
    if not settings.GEMINI_API_KEY:
        return None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    try:
        response = httpx.post(url, json={"contents": contents, "generationConfig": {"responseMimeType": "application/json"}}, timeout=35)
        response.raise_for_status()
        text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text)
    except Exception:
        logger.exception("Gemini request failed")
        return None

def generate_species_profile(name):
    prompt = (
        "You are generating a text-only taxonomy profile for a wildlife species. "
        "Return a verified species profile as JSON only for the wildlife name provided. "
        "Fields: common_name, scientific_name, kingdom, phylum, class_name, order, family, genus, species, "
        "iucn_status, habitat, diet, distribution, description. "
        "Use null if genuinely unknown; do not invent. Do not use image analysis. Name: " + name
    )
    return _generate([{"parts": [{"text": prompt}]}])

def analyze_behaviour(image_bytes, mime_type):
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is missing! Set it in backend/.env to run live behaviour analysis.")
        return None
        
    prompt = ("Analyze this cropped image of a detected animal. Determine the single visible behaviour of the animal from the following list:\n"
              "Resting, Standing, Walking, Running, Drinking Water, Feeding, Grazing, Sleeping, Hunting, Swimming, Flying, Perching, Calling, Climbing, Unknown.\n"
              "Return your response ONLY as a JSON object with two fields:\n"
              "1. 'behaviour': one of the allowed behaviour outputs, or 'Unknown' if not visible or confident.\n"
              "2. 'reasoning': a brief sentence explaining the physical evidence in the image supporting this behaviour.\n"
              "Choose 'Unknown' if the behaviour is not clearly discernible. Never guess or fabricate behaviour.")
              
    contents = [{"parts": [{"text": prompt}, {"inline_data": {"mime_type": mime_type, "data": base64.b64encode(image_bytes).decode()}}]}]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    try:
        response = httpx.post(url, json={"contents": contents, "generationConfig": {"responseMimeType": "application/json"}}, timeout=35)
        if response.status_code == 400 or response.status_code == 403:
            logger.error("Gemini API Key is invalid or call failed. Status: %s, Error: %s", response.status_code, response.text)
            return None
        response.raise_for_status()
        text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        res = json.loads(text)
        
        # Validate allowed behaviours
        allowed = ["Resting", "Standing", "Walking", "Running", "Drinking Water", "Feeding", "Grazing", "Sleeping", "Hunting", "Swimming", "Flying", "Perching", "Calling", "Climbing", "Unknown"]
        b_val = res.get("behaviour", "Unknown").strip().title()
        if b_val == "Drinking":
            b_val = "Drinking Water"
        if b_val not in allowed:
            b_val = "Unknown"
        return {
            "behaviour": b_val,
            "primary_behaviour": b_val,
            "reasoning": res.get("reasoning", "Behaviour verified via Gemini Vision analysis.")
        }
    except Exception as e:
        logger.error("Gemini Vision request failed: %s", str(e))
        return None
