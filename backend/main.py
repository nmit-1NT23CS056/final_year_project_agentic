from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, profile, roadmap

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Career Advisory Agent API")

# Configure CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(roadmap.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Career Advisory Agent API"}

