from supermemory import Supermemory
import os
from typing import Dict, List, Any, Optional
import requests
from datetime import datetime


class DocumentProcessor:
    def __init__(self):
        self.client = Supermemory(api_key=os.getenv("SUPERMEMORY_API_KEY"))

    def upload_url(
        self, url: str, collection: str, metadata: Dict[str, Any] = None
    ) -> Dict:
        """Upload URL content to Supermemory"""
        if metadata is None:
            metadata = {}

        try:
            result = self.client.memories.add(
                content=url,
                container_tag=collection,
                metadata={
                    "type": "url",
                    "originalUrl": url,
                    "uploadedAt": datetime.now().isoformat(),
                    **metadata,
                },
            )
            return result
        except Exception as e:
            print(f"URL upload error: {e}")
            raise

    def get_document_status(self, document_id: str) -> Dict:
        """Check document processing status"""
        try:
            memory = self.client.memories.get(document_id)
            return {
                "id": memory.id,
                "status": memory.status,
                "title": memory.title,
                "progress": memory.metadata.get("progress", 0)
                if memory.metadata
                else 0,
            }
        except Exception as e:
            print(f"Status check error: {e}")
            raise

    def list_documents(self, collection: str) -> List[Dict]:
        """List all documents in a collection"""
        try:
            memories = self.client.memories.list(
                container_tags=[collection], limit=50, sort="updatedAt", order="desc"
            )

            return [
                {
                    "id": memory.id,
                    "title": (
                        memory.title
                        or memory.metadata.get("originalName")
                        or "Untitled"
                        if memory.metadata
                        else "Untitled"
                    ),
                    "type": (
                        memory.metadata.get("fileType")
                        or memory.metadata.get("type")
                        or "unknown"
                        if memory.metadata
                        else "unknown"
                    ),
                    "uploadedAt": memory.metadata.get("uploadedAt")
                    if memory.metadata
                    else None,
                    "status": memory.status,
                    "url": memory.metadata.get("originalUrl")
                    if memory.metadata
                    else None,
                }
                for memory in memories.memories
            ]
        except Exception as e:
            print(f"List documents error: {e}")
            raise

    def check_paper_exists(self, title: str, collection: str) -> bool:
        """Check if a paper with exact title already exists in the collection"""
        try:
            existing_docs = self.list_documents(collection)
            existing_titles = [doc.get("title", "").strip() for doc in existing_docs]
            return title.strip() in existing_titles
        except Exception as e:
            print(f"Error checking for existing papers: {e}")
            return False

    def upload_arxiv_papers(self, collection: str = "arxiv-papers") -> List[Dict]:
        """Upload all papers from results_list to Supermemory"""
        try:
            # Import results_list dynamically to avoid circular import
            from scrape import results_list

            uploaded_papers = []
            skipped_papers = []

            for paper in results_list:
                paper_title = paper["title"]

                # Check if paper already exists
                if self.check_paper_exists(paper_title, collection):
                    print(f"Skipped (already exists): {paper_title}")
                    skipped_papers.append(paper_title)
                    continue

                metadata = {
                    "title": paper["title"],
                    "authors": paper["authors"],
                    "summary": paper["summary"],
                    "categories": paper["categories"],
                    "source": "arxiv",
                }

                result = self.upload_url(
                    url=paper["pdf_url"], collection=collection, metadata=metadata
                )

                uploaded_papers.append(result)
                print(f"Uploaded: {paper['title']}")

            print(f"\n=== Upload Summary ===")
            print(f"Successfully uploaded: {len(uploaded_papers)} papers")
            print(f"Skipped (duplicates): {len(skipped_papers)} papers")
            if skipped_papers:
                print(
                    f"Skipped papers: {', '.join(skipped_papers[:3])}{'...' if len(skipped_papers) > 3 else ''}"
                )

            return uploaded_papers

        except Exception as e:
            print(f"Error uploading arxiv papers: {e}")
            raise


# Usage example
if __name__ == "__main__":
    processor = DocumentProcessor()
    try:
        results = processor.upload_arxiv_papers()
        print(f"All {len(results)} papers uploaded successfully")
    except Exception as e:
        print(f"Upload failed: {e}")
