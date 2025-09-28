from fastapi import FastAPI
form requests import Request

app = FastAPI()

@app.post("/")
async def home( search_query: str):
    return {"message": search_query}

@app.post("/chat")
async def chat(query: str):
    return {"message": query}

@app.get("/favorites")
async def favorites():
    return {"message": "Favorites"}

@app.get("/search")
async def search(query: str):
    return {"message": "Search results for " + query}

@app.get("/graph")
async def graph():
    return {"message": "Graph"}
