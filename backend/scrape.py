
import arxiv
from main import get_bot_response

# Construct the search query
# You can search by query, id_list, or a combination of both.
# You can also sort results by relevance, lastUpdatedDate, or submittedDate.
print ("hello")
prompt = get_bot_response("RAG question chunking")
print("prompt: ", prompt)
search = arxiv.Search(
  query = prompt,
  max_results = 3,
  sort_by = arxiv.SortCriterion.SubmittedDate
)

# Iterate through the results and print the details
for result in search.results():
  print(f"📄 Title: {result.title}")
  
  # Get the first author
  first_author = result.authors[0]
  print(f"👤 Author: {first_author}")
  
  print(f"📝 Summary: {result.summary}")
  print(f"🔗 PDF Link: {result.pdf_url}")
  print("-" * 20) # Separator for readability