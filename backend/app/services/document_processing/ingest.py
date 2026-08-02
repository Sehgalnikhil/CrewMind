import logging
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentChunk
from app.services.document_processing.chunker import chunk_text
from app.services.document_processing.embedding_store import add_chunks
from app.services.document_processing.parsers import DocumentParseError, extract_text

logger = logging.getLogger("crewmind.ingest")

SUPPORTED_TYPES = {"pdf", "docx", "pptx", "xlsx", "csv"}


import asyncio
from app.api.ws import ws_manager

async def ingest_document(db: AsyncSession, document: Document, workspace_id: str) -> None:
    """Parse, chunk, and index a document. Mutates and persists its status."""
    document.status = "parsing"
    await db.commit()
    
    await ws_manager.broadcast(workspace_id, {
        "type": "document_status",
        "document_id": document.id,
        "status": "parsing",
        "message": "Extracting text and tables..."
    })

    try:
        text = extract_text(Path(document.storage_path), document.file_type)
        
        await ws_manager.broadcast(workspace_id, {
            "type": "document_status",
            "document_id": document.id,
            "status": "chunking",
            "message": "Chunking text for semantic search..."
        })
        
        chunks = chunk_text(text)
        if not chunks:
            raise DocumentParseError("No extractable text was found in this document.")

        chunk_rows = [
            DocumentChunk(document_id=document.id, chunk_index=i, text=chunk)
            for i, chunk in enumerate(chunks)
        ]
        db.add_all(chunk_rows)
        await db.flush()

        await ws_manager.broadcast(workspace_id, {
            "type": "document_status",
            "document_id": document.id,
            "status": "indexing",
            "message": f"Generating vector embeddings for {len(chunks)} chunks..."
        })

        add_chunks(
            workspace_id=workspace_id,
            document_id=document.id,
            chunk_ids=[row.id for row in chunk_rows],
            texts=chunks,
            uploaded_by=document.uploaded_by,
            created_at_iso=document.created_at.isoformat() if document.created_at else None,
            document_type=document.file_type
        )

        document.status = "indexed"
        document.chunk_count = len(chunks)
        document.error_message = None
        
        await ws_manager.broadcast(workspace_id, {
            "type": "document_status",
            "document_id": document.id,
            "status": "indexed",
            "message": "Document indexed successfully."
        })
    except DocumentParseError as exc:
        document.status = "failed"
        document.error_message = str(exc)
        await ws_manager.broadcast(workspace_id, {
            "type": "document_status",
            "document_id": document.id,
            "status": "failed",
            "message": str(exc)
        })
    except Exception as e:  # noqa: BLE001
        logger.exception("Unexpected error ingesting document %s", document.id)
        document.status = "failed"
        document.error_message = "Unexpected error while processing this document."
        await ws_manager.broadcast(workspace_id, {
            "type": "document_status",
            "document_id": document.id,
            "status": "failed",
            "message": "Unexpected error while processing this document."
        })

    await db.commit()
