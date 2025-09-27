import arxiv

search = arxiv.Search(
  query = "Evaluating very long-term conversational memory of LLm Agents",
  max_results = 10,
)

# Iterate through the results and print the details
for result in search.results():
  print(f"📄 Title: {result.title}")
