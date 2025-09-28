from supermemory import Supermemory
from dotenv import load_dotenv
from scrape import query
import os

load_dotenv("../.env")

client = Supermemory(api_key=os.environ.get("SUPERMEMORY_API_KEY"))

results = client.search.documents(q=query, limit=100)

print(f"Found {results.total} documents in {results.timing}ms")
print("LENGTH:", len(results.results))
