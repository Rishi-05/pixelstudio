"""
main.py
PixelStudio — FastAPI backend entrypoint.

Run with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from database import init_db
from routes.auth import router as auth_router
from routes.generate import router as generate_router
from routes.images import router as images_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    print(f"✅  Database initialised")
    print(f"✅  ComfyUI target: {settings.comfy_base_url}")
    yield
    # Shutdown — nothing to clean up for SQLite


app = FastAPI(
    title="PixelStudio API",
    description="Local AI image generation — FastAPI backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(generate_router)
app.include_router(images_router)

# --- checkup ---------------------------------------------------------------------------
@app.get("/")
def read_root():
    return {"message": "Backend is running"}

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
async def health():
    from comfy_client import comfy_client
    comfy_ok = await comfy_client.health_check()
    return {
        "api": "ok",
        "comfyui": "reachable" if comfy_ok else "unreachable",
        "comfyui_url": settings.comfy_base_url,
    }
