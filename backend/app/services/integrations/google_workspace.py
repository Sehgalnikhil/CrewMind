import logging
from typing import Any
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger("crewmind.integrations.google")

class GoogleWorkspaceService:
    def __init__(self, access_token: str, refresh_token: str | None = None, client_id: str | None = None, client_secret: str | None = None):
        self.credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
        )

    def search_drive(self, query: str) -> list[dict[str, Any]]:
        """Search Google Drive for files matching a query."""
        try:
            service = build('drive', 'v3', credentials=self.credentials)
            # Using fullText contains for a broad search
            results = service.files().list(
                q=f"fullText contains '{query}'",
                pageSize=10,
                fields="nextPageToken, files(id, name, mimeType, webViewLink)"
            ).execute()
            items = results.get('files', [])
            return items
        except HttpError as error:
            logger.error(f"An error occurred: {error}")
            return []

    def read_document(self, document_id: str) -> str:
        """Read text content from a Google Doc."""
        try:
            service = build('docs', 'v1', credentials=self.credentials)
            document = service.documents().get(documentId=document_id).execute()
            
            # Extract text from document body
            text_content = ""
            for element in document.get('body', {}).get('content', []):
                if 'paragraph' in element:
                    for e in element['paragraph'].get('elements', []):
                        if 'textRun' in e:
                            text_content += e['textRun']['content']
            return text_content
        except HttpError as error:
            logger.error(f"An error occurred reading document: {error}")
            return f"Error: {error}"
