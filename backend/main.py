from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any
import os

# Import our modules
from scrape import scrape_papers
from ingest import DocumentProcessor
from search import search_documents

app = FastAPI()

class SearchRequest(BaseModel):
    query: str
    max_results: int = 5

@app.post("/")
async def home(search_query: str):
    return {"message": search_query}

@app.post("/chat")
async def chat(query: str):
    return {"message": query}

@app.get("/favorites")
async def favorites():
    return {"message": "Favorites"}

@app.post("/search")
async def search(request: SearchRequest):
    """
    Search endpoint that follows the flow: scrape -> ingest -> search
    """
    try:
        # Step 1: Scrape papers from arXiv
        request.query ="Machine learning papers"
        scraped_papers = scrape_papers(request.query, request.max_results)
        print(f"✅ Scraped {len(scraped_papers)} papers")
        
        # Step 2: Ingest papers into Supermemory
        print("📥 Ingesting papers into Supermemory...")
        processor = DocumentProcessor()
        ingested_papers = processor.ingest_papers(scraped_papers)
        print(f"✅ Ingested {len(ingested_papers)} papers")
        
        # Step 3: Search for documents in Supermemory
        print(f"🔎 Searching for documents with query: {request.query}")
        search_results = search_documents(request.query)
        print(f"✅ Found {search_results['count']} documents in {search_results['timing']}ms")
        
        return {
            "status": "success",
            "query": request.query,
            "scraped_count": len(scraped_papers),
            "ingested_count": len(ingested_papers),
            "search_results": search_results,
            "message": f"Successfully processed {len(scraped_papers)} papers and found {search_results['count']} relevant documents"
        }
        
    except Exception as e:
        print(f"❌ Error in search pipeline: {e}")
        return {
            "status": "error",
            "message": f"Search failed: {str(e)}",
            "query": request.query
        }

@app.get("/graph")
async def graph():
    return {"message": "Graph"}
