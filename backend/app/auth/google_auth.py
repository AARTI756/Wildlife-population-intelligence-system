from google.oauth2 import id_token
from google.auth.transport import requests
from app.config import settings

def verify_google_token(token: str):
    """
    Verify the Google ID token.
    Returns a dict with user info if valid, raises Exception if invalid.
    """
    try:
        # Specify the CLIENT_ID of the app that accesses the backend:
        idinfo = id_token.verify_oauth2_token(
            token, requests.Request(), settings.GOOGLE_CLIENT_ID
        )

        return idinfo
    except ValueError as e:
        # Invalid token
        raise ValueError(f"Invalid Google token: {e}")
