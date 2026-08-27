import os
from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from clerk_backend_api import Clerk

# Get clerk instance
clerk = Clerk(bearer_auth=os.environ.get("CLERK_SECRET_KEY"))

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security), request: Request = None):
    token = credentials.credentials
    try:
        # Since authenticate_request needs a standard Request object (like urllib/httpx format),
        # an easier way for a simple FastAPI app is to just decode the JWT using clerk's JWKS
        # Or better, use clerk SDK to verify a token if it supports it directly.
        # Let's decode it manually since Clerk v1 SDK authenticate_request expects a specific Request object.
        pass
    except Exception as e:
        pass
    
    return None
