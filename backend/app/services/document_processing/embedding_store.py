"""Thin wrapper around a persistent Chroma collection for semantic retrieval.

Uses Chroma's bundled default embedding function (a small local ONNX MiniLM
model) — no external API key, no torch dependency. One collection per
organization keeps tenants isolated.
"""

from functools import lru_cache

import chromadb

from app.core.config import get_settings

settings = get_settings()


@lru_cache
def _client() -> chromadb.ClientAPI:
    return chromadb.PersistentClient(path=str(settings.chroma_dir))


def _collection_name(workspace_id: str) -> str:
    return f"ws_{workspace_id.replace('-', '')}"


def get_collection(workspace_id: str):
    return _client().get_or_create_collection(name=_collection_name(workspace_id))


def add_chunks(
    workspace_id: str, 
    document_id: str, 
    chunk_ids: list[str], 
    texts: list[str],
    uploaded_by: str | None = None,
    created_at_iso: str | None = None,
    document_type: str | None = None
) -> None:
    if not texts:
        return
    collection = get_collection(workspace_id)
    
    metadata_template = {"workspace_id": workspace_id, "document_id": document_id}
    if uploaded_by:
        metadata_template["uploaded_by"] = uploaded_by
    if created_at_iso:
        metadata_template["created_at"] = created_at_iso
    if document_type:
        metadata_template["document_type"] = document_type

    collection.add(
        ids=chunk_ids,
        documents=texts,
        metadatas=[metadata_template for _ in texts],
    )


def delete_document_chunks(workspace_id: str, chunk_ids: list[str]) -> None:
    if not chunk_ids:
        return
    collection = get_collection(workspace_id)
    collection.delete(ids=chunk_ids)


def query(workspace_id: str, query_text: str, top_k: int = 8) -> list[str]:
    collection = get_collection(workspace_id)
    if collection.count() == 0:
        return []
        
    result = collection.query(
        query_texts=[query_text], 
        n_results=min(top_k * 2, collection.count()) # Over-fetch for filtering
    )
    
    if not result or not result.get("documents") or not result.get("metadatas"):
        return []
        
    # Defense in depth: Verify workspace_id strictly matches
    verified_docs = []
    docs = result["documents"][0]
    metadatas = result["metadatas"][0]
    
    for doc, metadata in zip(docs, metadatas):
        if metadata and metadata.get("workspace_id") == workspace_id:
            verified_docs.append(doc)
            if len(verified_docs) == top_k:
                break
                
    return verified_docs
