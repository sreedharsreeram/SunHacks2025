from supermemory import Supermemory
from dotenv import load_dotenv
from scrape import query
import os
from typing import List, Dict, Any

load_dotenv(".env")

def search_documents(search_query: str, limit: int = 100) -> Dict[str, Any]:
    """Search for documents in Supermemory using the given query"""
    try:
        client = Supermemory(api_key=os.environ.get("SUPERMEMORY_API_KEY"))
        
        results = client.search.documents(q=search_query, limit=limit)
        
        # Format results for API response
        formatted_results = []
        for result in results.results:
            title = getattr(result, "title", "No title")
            metadata = getattr(result, "metadata", {})
            authors = metadata.get("authors", [])
            authors_str = ", ".join(authors) if authors else "No authors"
            
            formatted_results.append({
                "title": title,
                "authors": authors_str,
                "metadata": metadata,
                "content": getattr(result, "content", ""),
                "url": getattr(result, "url", ""),
            })
        
        return {
            "total": results.total,
            "timing": results.timing,
            "results": formatted_results,
            "count": len(formatted_results)
        }
        
    except Exception as e:
        print(f"Search error: {e}")
        raise

# Default search for backward compatibility
if __name__ == "__main__":
    results = search_documents(query)
    
    print(f"Found {results['total']} documents in {results['timing']}ms")
    print("LENGTH:", results['count'])
    
    for result in results['results']:
        print(f"Title: {result['title']}")
        print(f"Authors: {result['authors']}")
        print("-" * 40)
