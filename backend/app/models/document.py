from sqlalchemy import ForeignKey, Integer, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class Document(Base, IdMixin, TimestampMixin):
    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_workspace_created", "workspace_id", "created_at"),
        Index("ix_documents_workspace_status", "workspace_id", "status"),
        Index("ix_documents_workspace_type", "workspace_id", "file_type"),
        Index("ix_documents_workspace_uploader", "workspace_id", "uploaded_by"),
    )

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    uploaded_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    filename: Mapped[str] = mapped_column(String(500))
    file_type: Mapped[str] = mapped_column(String(20))
    storage_path: Mapped[str] = mapped_column(String(1000))
    status: Mapped[str] = mapped_column(String(20), default="uploaded")
    # uploaded -> parsing -> indexed -> failed
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)

    chunks: Mapped[list["DocumentChunk"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class DocumentChunk(Base, IdMixin, TimestampMixin):
    __tablename__ = "document_chunks"

    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id"), index=True)
    chunk_index: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)

    document: Mapped["Document"] = relationship(back_populates="chunks")
