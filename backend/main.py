from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import profile, roadmap, knowledge, jobs
from contextlib import asynccontextmanager
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis
import os
from dotenv import load_dotenv

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Redis caching
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
    try:
        redis = aioredis.from_url(redis_url, encoding="utf8", decode_responses=True)
        FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
        print("Redis Caching Successfully Initialized!")
    except Exception as e:
        print("Warning: Redis could not connect. Proceeding without cache.")
    yield

app = FastAPI(title="Career Advisory Agent API", lifespan=lifespan)

# Configure CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
# app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(roadmap.router)
app.include_router(knowledge.router)
app.include_router(jobs.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Career Advisory Agent API"}

