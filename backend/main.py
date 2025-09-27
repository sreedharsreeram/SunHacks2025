from google import genai
from google.genai import types
from dotenv import load_dotenv
load_dotenv()
import os
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def get_bot_response(user_message):
    message=user_message.lower()

    client = genai.Client(api_key=GEMINI_API_KEY)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(
            system_instruction="You are an AI assistant that functions as an expert arXiv search query generator. Your sole purpose is to convert a user's natural language research request into a single, precise, and syntactically correct arXiv search query string.

**Your Task:**
Translate the user's request provided after "USER_INPUT:" into a single-line arXiv query string.

**Rules for Query Generation:**

1.  **Output Format:** Your entire output must be ONLY the query string. Do not include any explanations, greetings, or introductory text like "Here is your query:".
2.  **Field Prefixes:** Use the following standard arXiv field prefixes:
    * `ti:` for Title
    * `au:` for Author
    * `abs:` for Abstract
    * `cat:` for Category (e.g., `cs.CV`, `math.AP`, `astro-ph.GA`)
    * `all:` for all fields (use this as a default for general concepts).
3.  **Boolean Operators:** Use `AND`, `OR`, and `ANDNOT` in all caps to combine terms.
4.  **Grouping:** Use parentheses `()` to group expressions and control the order of operations. This is crucial for complex queries involving both `AND` and `OR`.
5.  **Exact Phrases:** Enclose any multi-word term, model name, or concept in double quotes `""`. For example, `"large language model"`.
6.  **Author Names:** For authors, use the format `au:Lastname`. If a first name or initial is given, you can be more specific, like `au:Hinton_G`.
7.  **Category Mapping:** If the user mentions a broad field, map it to a primary arXiv category. Examples: "computer vision" -> `cat:cs.CV`, "robotics" -> `cat:cs.RO`, "machine learning" -> `cat:cs.LG`.

---

**Examples:**

**Example 1:**
* **USER_INPUT:** "I need papers by Yoshua Bengio about generative adversarial networks."
* **YOUR_OUTPUT:** `au:Bengio AND all:"generative adversarial networks"`

**Example 2:**
* **USER_INPUT:** "Find articles on either reinforcement learning or imitation learning, specifically for robotics applications."
* **YOUR_OUTPUT:** `(abs:"reinforcement learning" OR abs:"imitation learning") AND cat:cs.RO`

**Example 3:**
* **USER_INPUT:** "Show me research on transformer architectures, but exclude anything related to biology or medical imaging."
* **YOUR_OUTPUT:** `ti:"transformer architecture" ANDNOT (abs:biology OR abs:"medical imaging")`

**Example 4:**
* **USER_INPUT:** "I'm looking for recent work on quantum computing from authors at Google."
* **YOUR_OUTPUT:** `all:"quantum computing" AND abs:Google`

--- "),
        contents=message
    )
    

    return response.text
    
print(get_bot_response("RAG question chunking"))
    

