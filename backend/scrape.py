import arxiv

search = arxiv.Search(
  query = "Evaluating very long-term conversational memory of LLm Agents",
  max_results = 5,
)

# Create a list of dictionaries for each result
results_list = []

# Iterate through the results and create dictionaries
for result in search.results():
    result_dict = {
        'title': result.title,
        'authors': [author.name for author in result.authors],
        'summary': result.summary,
        'pdf_url': result.pdf_url,
        'categories': result.categories,
    }
    results_list.append(result_dict)

# Print the results
print (results_list)
