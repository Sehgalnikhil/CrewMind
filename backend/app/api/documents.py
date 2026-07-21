import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_org, get_current_user
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal, get_db
from app.models.document import Document
from app.models.organization import Organization
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


async def _run_ingest_in_new_session(document_id: str, org_id: str) -> None:
    async with AsyncSessionLocal() as session:
        document = await session.get(Document, document_id)
        if document is not None:
            await ingest_document(session, document, org_id)


@router.post("", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
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

    org_dir = settings.storage_dir / org.id
    org_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4()}.{file_type}"
    storage_path = org_dir / stored_name
    storage_path.write_bytes(contents)

    document = Document(
        org_id=org.id,
        uploaded_by=user.id,
        filename=file.filename,
        file_type=file_type,
        storage_path=str(storage_path),
        status="uploaded",
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    background_tasks.add_task(_run_ingest_in_new_session, document.id, org.id)

    return DocumentResponse.model_validate(document)


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> list[DocumentResponse]:
    result = await db.execute(
        select(Document).where(Document.org_id == org.id).order_by(Document.created_at.desc())
    )
    documents = result.scalars().all()
    return [DocumentResponse.model_validate(d) for d in documents]


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    document = await db.get(Document, document_id)
    if document is None or document.org_id != org.id:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse.model_validate(document)


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(Document).where(Document.id == document_id).options(selectinload(Document.chunks))
    )
    document = result.scalar_one_or_none()
    if document is None or document.org_id != org.id:
        raise HTTPException(status_code=404, detail="Document not found")

    chunk_ids = [c.id for c in document.chunks]
    delete_document_chunks(org.id, chunk_ids)

    storage_file = Path(document.storage_path)
    if storage_file.exists():
        storage_file.unlink()

    await db.delete(document)
    await db.commit()
