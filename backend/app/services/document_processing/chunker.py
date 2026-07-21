"""Splits extracted document text into overlapping chunks for retrieval."""


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 150) -> list[str]:
    text = text.strip()
    if not text:
        return []
    if len(text) <= chunk_size:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        # Prefer to break on a paragraph/sentence boundary near the end of the window.
        if end < len(text):
            boundary = text.rfind("\n\n", start, end)
            if boundary == -1 or boundary <= start + chunk_size // 2:
                boundary = text.rfind(". ", start, end)
            if boundary != -1 and boundary > start + chunk_size // 2:
                end = boundary + 1
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return chunks
