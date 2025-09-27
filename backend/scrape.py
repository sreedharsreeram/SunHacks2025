
import os
import json
import csv
import asyncio
from dotenv import load_dotenv
import arxiv
from main import get_bot_response
from serpapi.google_search import GoogleSearch

# Load .env file from project root
load_dotenv(dotenv_path='../.env')


class SerpAPIScholarScraper:
    def __init__(self, api_key=None):
        """Initialize the scraper with SerpAPI key"""
        self.api_key = os.getenv("SERP_AI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "SerpAPI key is required. Set SERPAPI_KEY environment variable or pass api_key parameter"
            )

    async def search_papers_async(self, query, num_results=10, year_from=None, year_to=None):
        """Async version of search_papers for parallel execution"""
        return await asyncio.to_thread(self.search_papers, query, num_results, year_from, year_to)

    def search_papers(self, query, num_results=10, year_from=None, year_to=None):
        """Search for papers on Google Scholar using SerpAPI"""
        papers = []
        start = 0

        while len(papers) < num_results:
            params = {
                "engine": "google_scholar",
                "q": query,
                "api_key": self.api_key,
                "start": start,
                "num": min(
                    20, num_results - len(papers)
                ),  # SerpAPI max is 20 per request
            }

            # Add year filters if specified
            if year_from:
                params["as_ylo"] = year_from
            if year_to:
                params["as_yhi"] = year_to

            try:
                search = GoogleSearch(params)
                results = search.get_dict()

                if "organic_results" not in results:
                    print("No more results found")
                    break

                for result in results["organic_results"]:
                    if len(papers) >= num_results:
                        break

                    paper = self._parse_paper_result(result)
                    if paper:
                        papers.append(paper)

                # Check if there are more results
                if (
                    "serpapi_pagination" not in results
                    or "next" not in results["serpapi_pagination"]
                ):
                    break

                start += 20

            except Exception as e:
                print(f"Error fetching results: {e}")
                break

        return papers[:num_results]

    def search_by_author(self, author_name, num_results=10):
        """Search for papers by a specific author"""
        return self.search_papers(f'author:"{author_name}"', num_results)

    def search_citations(self, paper_title, num_results=10):
        """Find papers citing a specific work"""
        # Note: This would require the specific cite ID from Google Scholar
        # For now, we'll search for papers mentioning the title
        return self.search_papers(f'"{paper_title}"', num_results)

    def _parse_paper_result(self, result):
        """Parse individual paper result from SerpAPI response"""
        try:
            # Extract basic information
            title = result.get("title", "")
            authors = self._extract_authors(
                result.get("publication_info", {}).get("authors", [])
            )

            # Extract year from publication info
            year = self._extract_year(result.get("publication_info", {}))

            # Extract venue/journal
            venue = result.get("publication_info", {}).get("summary", "")

            # Abstract/snippet
            snippet = result.get("snippet", "")

            # URL
            url = result.get("link", "")

            # Citation count
            citations = 0
            if "inline_links" in result and "cited_by" in result["inline_links"]:
                citations = result["inline_links"]["cited_by"].get("total", 0)

            # PDF link if available
            pdf_url = None
            if "resources" in result:
                for resource in result["resources"]:
                    if resource.get("file_format") == "PDF":
                        pdf_url = resource.get("link")
                        break

            return {
                "title": title.strip(),
                "authors": authors,
                "year": year,
                "venue": venue.strip(),
                "abstract": snippet.strip(),
                "url": url,
                "pdf_url": pdf_url,
                "citations": citations,
                "source": "Google Scholar (SerpAPI)",
            }

        except Exception as e:
            print(f"Error parsing paper result: {e}")
            return None

    def _extract_authors(self, authors_list):
        """Extract and format authors from SerpAPI response"""
        if isinstance(authors_list, list):
            return [
                author.get("name", "") for author in authors_list if author.get("name")
            ]
        return []

    def _extract_year(self, publication_info):
        """Extract publication year from publication info"""
        summary = publication_info.get("summary", "")

        # Try to extract year using regex
        import re

        year_match = re.search(r"\b(19|20)\d{2}\b", summary)
        if year_match:
            return int(year_match.group())

        return None

    def get_paper_details(self, result_id):
        """Get detailed information about a specific paper"""
        params = {
            "engine": "google_scholar",
            "cluster": result_id,
            "api_key": self.api_key,
        }

        try:
            search = GoogleSearch(params)
            results = search.get_dict()
            return results
        except Exception as e:
            print(f"Error fetching paper details: {e}")
            return None

    def save_to_csv(self, papers, filename):
        """Save papers to CSV file"""
        if not papers:
            print("No papers to save")
            return

        fieldnames = [
            "title",
            "authors",
            "year",
            "venue",
            "abstract",
            "url",
            "pdf_url",
            "citations",
            "source",
        ]

        with open(filename, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for paper in papers:
                # Convert authors list to string for CSV
                paper_copy = paper.copy()
                paper_copy["authors"] = (
                    "; ".join(paper["authors"])
                    if isinstance(paper["authors"], list)
                    else paper["authors"]
                )
                writer.writerow(paper_copy)

        print(f"Saved {len(papers)} papers to {filename}")

    def save_to_json(self, papers, filename):
        """Save papers to JSON file"""
        if not papers:
            print("No papers to save")
            return

        with open(filename, "w", encoding="utf-8") as jsonfile:
            json.dump(papers, jsonfile, indent=2, ensure_ascii=False)

        print(f"Saved {len(papers)} papers to {filename}")


async def arxiv_search_async(query, max_results=3):
    """Async arXiv search function"""
    def search_arxiv():
        search = arxiv.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.SubmittedDate
        )

        papers = []
        for result in search.results():
            papers.append({
                "title": result.title,
                "authors": [str(author) for author in result.authors],
                "year": result.published.year if result.published else None,
                "venue": "arXiv",
                "abstract": result.summary,
                "url": result.entry_id,
                "pdf_url": result.pdf_url,
                "citations": 0,  # arXiv doesn't provide citation counts
                "source": "arXiv"
            })
        return papers

    return await asyncio.to_thread(search_arxiv)


async def parallel_search(user_query, scholar_results=10, arxiv_results=3):
    """
    Perform parallel searches on both Scholar and arXiv
    """
    print("Generating search keywords...")
    keywords = await get_bot_response(user_query)
    print(f"Keywords: {keywords}")

    print("Starting parallel searches...")

    # Initialize Scholar scraper
    try:
        scholar_scraper = SerpAPIScholarScraper()
    except ValueError as e:
        print(f"Scholar search unavailable: {e}")
        scholar_scraper = None

    # Create search tasks
    tasks = []

    # Add Scholar search task if available
    if scholar_scraper:
        scholar_task = scholar_scraper.search_papers_async(keywords, scholar_results)
        tasks.append(("scholar", scholar_task))

    # Add arXiv search task
    arxiv_task = arxiv_search_async(keywords, arxiv_results)
    tasks.append(("arxiv", arxiv_task))

    # Execute searches in parallel
    if tasks:
        task_names = [name for name, _ in tasks]
        task_coroutines = [task for _, task in tasks]

        results = await asyncio.gather(*task_coroutines, return_exceptions=True)

        # Process results
        search_results = {}
        for i, (name, result) in enumerate(zip(task_names, results)):
            if isinstance(result, Exception):
                print(f"Error in {name} search: {result}")
                search_results[name] = []
            else:
                search_results[name] = result
                print(f"✅ {name.title()} search completed: {len(result)} papers found")

        return search_results
    else:
        print("No search engines available")
        return {}


def main():
    try:
        scraper = SerpAPIScholarScraper()
    except ValueError as e:
        print(f"Error: {e}")
        return

    # Get search parameters
    print("\nSearch options:")
    print("1. General search")
    print("2. Search by author")
    print("3. Search by year range")

    choice = input("Choose option (1-3): ").strip()

    if choice == "2":
        author = input("Enter author name: ").strip()
        if not author:
            print("Author name is required")
            return

        num_results = input("Number of results (default 10): ").strip()
        num_results = int(num_results) if num_results else 10

        print(f"Searching for papers by '{author}'...")
        papers = scraper.search_by_author(author, num_results)

    elif choice == "3":
        query = input("Enter search query: ").strip()
        if not query:
            query = "machine learning"

        year_from = input("From year (optional): ").strip()
        year_from = int(year_from) if year_from else None

        year_to = input("To year (optional): ").strip()
        year_to = int(year_to) if year_to else None

        num_results = input("Number of results (default 10): ").strip()
        num_results = int(num_results) if num_results else 10

        print(
            f"Searching for '{query}' from {year_from or 'any'} to {year_to or 'any'}..."
        )
        papers = scraper.search_papers(query, num_results, year_from, year_to)

    else:  # Default general search
        query = input("Enter search query: ").strip()
        if not query:
            query = "machine learning"

        num_results = input("Number of results (default 10): ").strip()
        num_results = int(num_results) if num_results else 10

        print(f"Searching for '{query}'...")
        papers = scraper.search_papers(query, num_results)

    # Display results
    if papers:
        print(f"\nFound {len(papers)} papers:")
        for i, paper in enumerate(papers, 1):
            print(f"\n{i}. {paper['title']}")
            if paper["authors"]:
                authors_str = ", ".join(paper["authors"][:3])  # Show first 3 authors
                if len(paper["authors"]) > 3:
                    authors_str += f" et al. ({len(paper['authors'])} total)"
                print(f"   Authors: {authors_str}")
            if paper["year"]:
                print(f"   Year: {paper['year']}")
            if paper["venue"]:
                print(f"   Venue: {paper['venue']}")
            if paper["citations"]:
                print(f"   Citations: {paper['citations']}")
            if paper["pdf_url"]:
                print(f"   PDF: Available")

        # Save results
        save_format = input("\nSave as (csv/json/both/none): ").strip().lower()
        if save_format in ["csv", "both"]:
            filename = f"serpapi_scholar_{query.replace(' ', '_')}.csv"
            scraper.save_to_csv(papers, filename)
        if save_format in ["json", "both"]:
            filename = f"serpapi_scholar_{query.replace(' ', '_')}.json"
            scraper.save_to_json(papers, filename)
    else:
        print("No papers found")
        


async def demo_parallel_search():
    """Demonstration of parallel search functionality"""
    print("🔍 Starting parallel search demo...")

    # Test query
    user_query = "RAG question chunking"

    # Run parallel search
    results = await parallel_search(user_query, scholar_results=10, arxiv_results=3)

    # Display results
    print("\n" + "="*60)
    print("PARALLEL SEARCH RESULTS")
    print("="*60)

    for source, papers in results.items():
        print(f"\n📚 {source.upper()} RESULTS ({len(papers)} papers):")
        print("-" * 40)

        for i, paper in enumerate(papers, 1):
            print(f"\n{i}. 📄 {paper['title']}")

            # Display authors
            if paper["authors"]:
                authors_str = ", ".join(paper["authors"][:3])
                if len(paper["authors"]) > 3:
                    authors_str += f" et al. ({len(paper['authors'])} total)"
                print(f"   👤 Authors: {authors_str}")

            # Display other details
            if paper["year"]:
                print(f"   📅 Year: {paper['year']}")
            if paper["venue"] and paper["venue"] != source:
                print(f"   📍 Venue: {paper['venue']}")
            if paper["citations"] > 0:
                print(f"   📈 Citations: {paper['citations']}")
            if paper["pdf_url"]:
                print(f"   🔗 PDF: {paper['pdf_url']}")

    print("\n" + "="*60)
    print("Search completed! ✅")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--parallel":
        # Run parallel search demo
        asyncio.run(demo_parallel_search())
    else:
        # Run original interactive main function
        main()




