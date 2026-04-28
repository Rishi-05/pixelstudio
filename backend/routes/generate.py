"""
routes/generate.py
POST  /api/generate          → submit a new generation job
GET   /api/generate/{job_id} → poll job status
WS    /ws/{job_id}           → stream real-time progress
"""
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from comfy_client import build_workflow, comfy_client
from core.auth import CurrentUser, decode_token
from core.config import get_settings
from database import AsyncSessionLocal, get_db
from models.job import Job, JobStatus
from ws_manager import ws_manager

settings = get_settings()
router = APIRouter(tags=["generate"])

# Ensure image storage dir exists
Path(settings.images_dir).mkdir(parents=True, exist_ok=True)


# ── Schemas ───────────────────────────────────────────────────────────────────

class GenerateIn(BaseModel):
    positive_prompt: str = Field(..., min_length=1, max_length=2000)
    negative_prompt: str = Field(default="", max_length=2000)
    width: int = Field(default=512, ge=256, le=2048, multiple_of=64)
    height: int = Field(default=512, ge=256, le=2048, multiple_of=64)
    steps: int = Field(default=20, ge=1, le=100)
    cfg: float = Field(default=7.0, ge=1.0, le=20.0)
    sampler: str = Field(default="dpmpp_2m")
    seed: int = Field(default=-1)


class JobOut(BaseModel):
    id: int
    status: JobStatus
    progress: int
    positive_prompt: str
    negative_prompt: str
    width: int
    height: int
    steps: int
    cfg: float
    sampler: str
    seed: int
    image_url: str | None = None
    share_token: str | None = None
    error_message: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Background worker ─────────────────────────────────────────────────────────

async def run_generation(job_id: int) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            return

        # Mark running
        job.status = JobStatus.running
        await db.commit()
        await ws_manager.broadcast_progress(job_id, 0, "running")

        try:
            # Check ComfyUI is alive
            if not await comfy_client.health_check():
                raise RuntimeError("ComfyUI is not reachable. Check Colab is still running.")

            # Build and submit workflow
            workflow = build_workflow(
                positive=job.positive_prompt,
                negative=job.negative_prompt,
                width=job.width,
                height=job.height,
                steps=job.steps,
                cfg=job.cfg,
                sampler=job.sampler,
                seed=job.seed,
            )
            prompt_id = await comfy_client.queue_prompt(workflow)
            job.comfy_prompt_id = prompt_id
            await db.commit()

            # Progress callback
            async def on_progress(pct: int):
                job.progress = pct
                await db.commit()
                await ws_manager.broadcast_progress(job_id, pct, "running")

            # Stream progress — returns image info dict
            image_info = await comfy_client.stream_progress(prompt_id, on_progress)

            if not image_info:
                raise RuntimeError("No output image produced by ComfyUI")

            # Download image FROM ComfyUI (works for local AND Colab)
            filename = image_info["filename"]
            subfolder = image_info.get("subfolder", "")
            dest_path = str(Path(settings.images_dir) / filename)

            ok = await comfy_client.download_image(
                filename=filename,
                subfolder=subfolder,
                dest_path=dest_path,
            )
            if not ok:
                raise RuntimeError(f"Failed to download image '{filename}' from ComfyUI")

            # Mark done
            job.image_filename = filename
            job.status = JobStatus.done
            job.progress = 100
            job.finished_at = datetime.now(timezone.utc)
            await db.commit()
            await ws_manager.broadcast_progress(job_id, 100, "done")

        except Exception as exc:
            job.status = JobStatus.failed
            job.error_message = str(exc)
            job.finished_at = datetime.now(timezone.utc)
            await db.commit()
            await ws_manager.broadcast_progress(job_id, job.progress, "failed")

        finally:
            await asyncio.sleep(1)
            await ws_manager.close_all(job_id)


# ── HTTP endpoints ────────────────────────────────────────────────────────────

@router.post("/api/generate", response_model=JobOut, status_code=202)
async def submit_job(
    body: GenerateIn,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    job = Job(
        user_id=current_user.id,
        positive_prompt=body.positive_prompt,
        negative_prompt=body.negative_prompt,
        width=body.width,
        height=body.height,
        steps=body.steps,
        cfg=body.cfg,
        sampler=body.sampler,
        seed=body.seed,
    )
    db.add(job)
    await db.flush()
    background_tasks.add_task(run_generation, job.id)
    return _job_to_out(job)


@router.get("/api/generate/{job_id}", response_model=JobOut)
async def get_job(
    job_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    job = await _get_owned_job(job_id, current_user.id, db)
    return _job_to_out(job)


# ── WebSocket endpoint ────────────────────────────────────────────────────────

@router.websocket("/ws/{job_id}")
async def job_progress_ws(job_id: int, websocket: WebSocket, token: str):
    try:
        decode_token(token)
    except HTTPException:
        await websocket.close(code=4001)
        return

    await ws_manager.connect(job_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(job_id, websocket)


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_owned_job(job_id: int, user_id: int, db: AsyncSession) -> Job:
    result = await db.execute(select(Job).where(Job.id == job_id, Job.user_id == user_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def _job_to_out(job: Job) -> JobOut:
    image_url = None
    if job.image_filename:
        image_url = f"/images/{job.image_filename}"
    return JobOut(
        id=job.id,
        status=job.status,
        progress=job.progress,
        positive_prompt=job.positive_prompt,
        negative_prompt=job.negative_prompt,
        width=job.width,
        height=job.height,
        steps=job.steps,
        cfg=job.cfg,
        sampler=job.sampler,
        seed=job.seed,
        image_url=image_url,
        share_token=job.share_token,
        error_message=job.error_message,
        created_at=job.created_at,
    )
