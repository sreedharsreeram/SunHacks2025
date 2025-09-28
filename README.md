
# 📖 CiteSight – AI-Powered Academic Paper Discovery

Discover, search, and chat with academic papers effortlessly.  
Built at **SunHacks 2025** for researchers, students, and curious minds by Aniketh Mungara, Sreeram Sreedhar, Tarun Chengappa Chottera, Monish Chengappa Chottera.

---

##  Key Features

###  Smart Paper Discovery
- AI-enhanced **natural language search**
- Intelligent **query expansion** with acronyms, synonyms & context
- Advanced filtering by relevance, category, and date

###  Interactive Chat with Papers
- Real-time **Q&A on research papers**
- Get **summaries, explanations, and clarifications**
- Save and manage favorite papers

###  Semantic Search & Memory
- **Supermemory integration** for deep semantic search
- Context-aware results across multiple documents
- Personalized paper recommendations

---

##  Tech Stack

- **Frontend**: Next.js + TypeScript + Tailwind CSS  
- **Backend**: FastAPI + Python  
- **AI**: Google Gemini API  
- **Search**: arXiv scraping + semantic indexing  

---

##  Quick Start

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/sunhacks2025.git
   cd sunhacks2025
   ```

2. **Install dependencies**
   ```bash
   bun install
   cd frontend/my-app && bun install
   cd ../../backend && pip install -r requirements.txt
   ```

3. **Set environment variables**
   ```bash
   GEMINI_API_KEY=your_api_key
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run the app**
   ```bash
   # Backend
   cd backend && python main.py

   # Frontend
   cd frontend/my-app && bun dev
   ```

5. **Open browser**
   → [http://localhost:3000](http://localhost:3000)

---

##  Screenshots

###  Home Page
![Home Page](homepage.jpg)
*Minimalist landing page with sleek search bar and modern design.*

###  Chat Interface
![Chat Interface](Chatbot.jpg)
*Engage directly with academic papers through AI-powered conversations.*

---

##  API Overview

- `GET /api/arxiv` → Search papers  
- `POST /api/search` → AI-enhanced search  
- `POST /api/supermemory/qa` → Chat with papers  
- `GET /favorites` → Retrieve saved papers  

---

## Contributing

We welcome contributions!  
- Fork the repo  
- Create a feature branch  
- Open a Pull Request  

---

## 📄 License

Licensed under the **MIT License**.  
See [LICENSE](LICENSE) for details.

---

<div align="center">

###  Built for Researchers, by Researchers
[🌐 Website](https://sunhacks2025.com) · [📖 Docs](https://docs.sunhacks2025.com) · [💬 Discord](https://discord.gg/sunhacks2025)

</div>
