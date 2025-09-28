import arxiv


query = "find me rag paper talking about magnetoelectric coupling"
search = arxiv.Search(
    query=query,
    max_results=5,
)

# Create a list of dictionaries for each result
results_list = []

# Iterate through the results and create dictionaries
for result in search.results():
    result_dict = {
        "title": result.title,
        "authors": [author.name for author in result.authors],
        "summary": result.summary,
        "pdf_url": result.pdf_url,
        "categories": result.categories,
    }
    results_list.append(result_dict)


# Print the results
# print(results_list)

# Run auto-ingestion when script is executed directly
if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("🚀 Starting auto-ingestion to Supermemory...")
    print("=" * 50)
    auto_ingest()
