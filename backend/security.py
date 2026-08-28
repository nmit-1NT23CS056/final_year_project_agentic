import os
import jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer()

CLERK_FRONTEND_API = os.environ.get("CLERK_FRONTEND_API")
if not CLERK_FRONTEND_API:
    CLERK_FRONTEND_API = "united-louse-3570.clerk.accounts.dev"

JWKS_URL = f"https://{CLERK_FRONTEND_API}/.well-known/jwks.json"
jwks_client = jwt.PyJWKClient(JWKS_URL)

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError as e:
        print(f"JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
