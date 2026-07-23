import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import RequestContext, get_current_user, get_request_context
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal, get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.document_processing.embedding_store import delete_document_chunks
from app.services.document_processing.ingest import SUPPORTED_TYPES, ingest_document

router = APIRouter(prefix="/api/documents", tags=["documents"])
settings = get_settings()

MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB


def _file_type_from_name(filename: str) -> str:
    ext = Path(filename).suffix.lower().lstrip(".")
    return ext


async def _run_ingest_in_new_session(document_id: str, workspace_id: str, job_id: str | None = None) -> None:
    from app.models.job import BackgroundJob
    from app.models.mixins import utcnow
    
    async with AsyncSessionLocal() as session:
        document = await session.get(Document, document_id)
        job = await session.get(BackgroundJob, job_id) if job_id else None
        
        if job:
            job.status = "running"
            await session.commit()
            
        if document is not None:
            await ingest_document(session, document, workspace_id)
            
        if job:
            job.status = "completed" if document and document.status == "indexed" else "failed"
            if document and document.status == "failed":
                job.error_message = document.error_message
            job.completed_at = utcnow()
            await session.commit()


@router.post("", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="A filename is required.")

    file_type = _file_type_from_name(file.filename)
    if file_type not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{file_type}'. Supported: {', '.join(sorted(SUPPORTED_TYPES))}.",
        )

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds the 25 MB upload limit.")
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    workspace_id = ctx.workspace.id if ctx.workspace else "default"
    org_dir = settings.storage_dir / workspace_id
    org_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4()}.{file_type}"
    storage_path = org_dir / stored_name
    storage_path.write_bytes(contents)

    document = Document(
        workspace_id=workspace_id,
        uploaded_by=user.id,
        filename=file.filename,
        file_type=file_type,
        storage_path=str(storage_path),
        status="uploaded",
    )
    db.add(document)
    
    from app.models.job import BackgroundJob
    job = BackgroundJob(
        workspace_id=workspace_id,
        user_id=user.id,
        task_type="document_processing",
        status="pending"
    )
    db.add(job)
    
    await db.commit()
    await db.refresh(document)
    await db.refresh(job)

    background_tasks.add_task(_run_ingest_in_new_session, document.id, workspace_id, job.id)

    return DocumentResponse.model_validate(document)


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> list[DocumentResponse]:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    result = await db.execute(
        select(Document).where(Document.workspace_id == workspace_id).order_by(Document.created_at.desc())
    )
    documents = result.scalars().all()
    return [DocumentResponse.model_validate(d) for d in documents]


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    document = await db.get(Document, document_id)
    if document is None or document.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse.model_validate(document)


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    ctx: RequestContext = Depends(get_request_context),
    db: AsyncSession = Depends(get_db),
) -> None:
    workspace_id = ctx.workspace.id if ctx.workspace else None
    result = await db.execute(
        select(Document).where(Document.id == document_id).options(selectinload(Document.chunks))
    )
    document = result.scalar_one_or_none()
    if document is None or document.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Document not found")

    chunk_ids = [c.id for c in document.chunks]
    delete_document_chunks(workspace_id, chunk_ids)

    storage_file = Path(document.storage_path)
    if storage_file.exists():
        storage_file.unlink()

    await db.delete(document)
    await db.commit()
