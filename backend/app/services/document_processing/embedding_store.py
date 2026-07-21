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


def _collection_name(org_id: str) -> str:
    return f"org_{org_id.replace('-', '')}"


def get_collection(org_id: str):
    return _client().get_or_create_collection(name=_collection_name(org_id))


def add_chunks(org_id: str, document_id: str, chunk_ids: list[str], texts: list[str]) -> None:
    if not texts:
        return
    collection = get_collection(org_id)
    collection.add(
        ids=chunk_ids,
        documents=texts,
        metadatas=[{"document_id": document_id} for _ in texts],
    )


def delete_document_chunks(org_id: str, chunk_ids: list[str]) -> None:
    if not chunk_ids:
        return
    collection = get_collection(org_id)
    collection.delete(ids=chunk_ids)


def query(org_id: str, query_text: str, top_k: int = 8) -> list[str]:
    collection = get_collection(org_id)
    if collection.count() == 0:
        return []
    result = collection.query(query_texts=[query_text], n_results=min(top_k, collection.count()))
    documents = result.get("documents") or [[]]
    return documents[0]
