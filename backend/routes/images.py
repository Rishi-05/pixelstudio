"""
routes/images.py
GET  /api/images              → list all jobs with images for current user
GET  /api/images/{job_id}     → single image metadata
DEL  /api/images/{job_id}     → delete image + job
POST /api/images/{job_id}/share → create share token
GET  /share/{token}           → public share redirect (no auth)
GET  /images/{filename}       → serve image file
"""
import secrets
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import CurrentUser
from core.config import get_settings
from database import get_db
from models.job import Job, JobStatus
from routes.generate import JobOut, _job_to_out

settings = get_settings()
router = APIRouter(tags=["images"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ShareOut(BaseModel):
    share_url: str
    share_token: str


# ── List / detail ─────────────────────────────────────────────────────────────

@router.get("/api/images", response_model=list[JobOut])
async def list_images(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 50,
    offset: int = 0,
):
    result = await db.execute(
        select(Job)
        .where(Job.user_id == current_user.id, Job.status == JobStatus.done)
        .order_by(Job.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    jobs = result.scalars().all()
    return [_job_to_out(j) for j in jobs]


@router.get("/api/images/{job_id}", response_model=JobOut)
async def get_image(
    job_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    job = await _owned_done_job(job_id, current_user.id, db)
    return _job_to_out(job)


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/api/images/{job_id}", status_code=204)
async def delete_image(
    job_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    job = await _owned_done_job(job_id, current_user.id, db)

    # Remove file from disk
    if job.image_filename:
        path = Path(settings.images_dir) / job.image_filename
        path.unlink(missing_ok=True)

    await db.delete(job)


# ── Share ─────────────────────────────────────────────────────────────────────

@router.post("/api/images/{job_id}/share", response_model=ShareOut)
async def create_share_link(
    job_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    job = await _owned_done_job(job_id, current_user.id, db)

    if not job.share_token:
        job.share_token = secrets.token_urlsafe(24)
        await db.flush()

    share_url = f"{settings.frontend_origin}/share/{job.share_token}"
    return ShareOut(share_url=share_url, share_token=job.share_token)


@router.get("/share/{token}", response_model=JobOut)
async def view_shared_image(
    token: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Public endpoint — no auth required. Returns image metadata."""
    result = await db.execute(select(Job).where(Job.share_token == token))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Shared image not found")
    return _job_to_out(job)


# ── Static file serving ───────────────────────────────────────────────────────

@router.get("/images/{filename}")
async def serve_image(filename: str):
    """Serve generated images directly."""
    # Prevent path traversal
    safe = Path(filename).name
    path = Path(settings.images_dir) / safe
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path, media_type="image/png")


# ── Download ──────────────────────────────────────────────────────────────────

@router.get("/api/images/{job_id}/download")
async def download_image(
    job_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    job = await _owned_done_job(job_id, current_user.id, db)
    path = Path(settings.images_dir) / job.image_filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image file not found on disk")
    return FileResponse(
        path,
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="{job.image_filename}"'},
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _owned_done_job(job_id: int, user_id: int, db: AsyncSession) -> Job:
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.user_id == user_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Image not found")
    if not job.image_filename:
        raise HTTPException(status_code=404, detail="Image not yet generated")
    return job
