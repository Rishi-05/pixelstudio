from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Float
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class JobStatus(str, PyEnum):
    pending = "pending"
    running = "running"
    done = "done"
    failed = "failed"


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # Prompt inputs
    positive_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    negative_prompt: Mapped[str] = mapped_column(Text, default="")
    width: Mapped[int] = mapped_column(Integer, default=768)
    height: Mapped[int] = mapped_column(Integer, default=768)
    steps: Mapped[int] = mapped_column(Integer, default=20)
    cfg: Mapped[float] = mapped_column(Float, default=7.0)
    sampler: Mapped[str] = mapped_column(String(32), default="dpmpp_2m")
    seed: Mapped[int] = mapped_column(Integer, default=-1)

    # State
    status: Mapped[JobStatus] = mapped_column(
        SAEnum(JobStatus), default=JobStatus.pending, nullable=False
    )
    progress: Mapped[int] = mapped_column(Integer, default=0)  # 0-100
    comfy_prompt_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Result
    image_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    share_token: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True, index=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="jobs")  # noqa: F821
