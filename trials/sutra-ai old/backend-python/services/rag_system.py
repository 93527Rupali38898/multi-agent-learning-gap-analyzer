import os
from typing import List
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import requests
from bs4 import BeautifulSoup
from services.gemini_service import GeminiService

class RAGSystem:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service
        self.vector_store = None
        self.books_dir = "data/books"
        
        # ⚠️ IMPORTANT: Add your Gemini API key here
        api_key = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE")
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=api_key
        )
        
        # Load books into vector store
        self._initialize_vector_store()
    
    def _initialize_vector_store(self):
        """Load PDF books and create FAISS vector store"""
        try:
            # Check if vector store already exists
            if os.path.exists("vector_store"):
                print("📚 Loading existing vector store...")
                self.vector_store = FAISS.load_local(
                    "vector_store", 
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                print("✅ Vector store loaded")
                return
            
            # Load PDFs from books directory
            documents = []
            
            if os.path.exists(self.books_dir):
                pdf_files = [f for f in os.listdir(self.books_dir) if f.endswith('.pdf')]
                
                print(f"📚 Loading {len(pdf_files)} PDF books...")
                
                for pdf_file in pdf_files:
                    pdf_path = os.path.join(self.books_dir, pdf_file)
                    loader = PyPDFLoader(pdf_path)
                    docs = loader.load()
                    documents.extend(docs)
                    print(f"  ✅ Loaded: {pdf_file}")
            
            if not documents:
                print("⚠️  No PDF books found. RAG system will use web search fallback.")
                return
            
            # Split documents into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            splits = text_splitter.split_documents(documents)
            
            print(f"📄 Created {len(splits)} text chunks")
            
            # Create vector store
            print("🔧 Creating FAISS vector store...")
            self.vector_store = FAISS.from_documents(splits, self.embeddings)
            
            # Save for future use
            self.vector_store.save_local("vector_store")
            print("✅ Vector store created and saved")
            
        except Exception as e:
            print(f"❌ Error initializing vector store: {e}")
            print("⚠️  RAG system will use web search fallback")
    
    def get_concept_hint(self, problem_title: str, user_code: str = "") -> str:
        """
        Level 5 Hint: Get concept explanation from RAG
        1. Search in PDF books
        2. If not found, search web
        """
        
        # Try to find in books first
        if self.vector_store:
            book_result = self._search_books(problem_title, user_code)
            if book_result:
                return book_result
        
        # Fallback: Search web
        print("📡 Searching web for concept...")
        web_result = self._search_web(problem_title)
        
        if web_result:
            return web_result
        
        # Final fallback: Ask Gemini directly
        return self.gemini.generate_hint(
            problem_id="",
            problem_title=problem_title,
            level=3,
            user_code=user_code,
            language="python"
        )
    
    def _search_books(self, query: str, user_code: str = "") -> str:
        """Search for concept in loaded PDF books"""
        try:
            # Search vector store
            results = self.vector_store.similarity_search(query, k=3)
            
            if not results:
                return ""
            
            # Combine top results
            context = "\n\n".join([doc.page_content for doc in results])
            
            # Use Gemini to generate a hint based on the context
            prompt = f"""
You are a coding mentor. Based on this textbook content, explain the concept to help solve: "{query}"

Textbook Context:
{context[:2000]}  

User's current code:
{user_code[:500] if user_code else "No code yet"}

Provide a clear, educational explanation with code examples.
Focus on helping them understand the CONCEPT, not just giving the solution.

Explanation:
"""
            
            response = self.gemini.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            print(f"Error searching books: {e}")
            return ""
    
    def _search_web(self, query: str) -> str:
        """
        Search web for concept explanation
        Uses simple web scraping
        """
        try:
            # Search Google for concept
            search_query = f"{query} programming tutorial explanation"
            search_url = f"https://www.google.com/search?q={search_query.replace(' ', '+')}"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(search_url, headers=headers, timeout=5)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract snippets from search results
            snippets = []
            for result in soup.find_all('div', class_='BNeawe', limit=3):
                text = result.get_text()
                if len(text) > 50:
                    snippets.append(text)
            
            if not snippets:
                return ""
            
            # Use Gemini to synthesize the information
            context = "\n\n".join(snippets)
            
            prompt = f"""
Based on this web information, explain the concept to help solve: "{query}"

Web Context:
{context[:1500]}

Provide a clear, concise explanation with examples.

Explanation:
"""
            
            response = self.gemini.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            print(f"Error searching web: {e}")
            return ""
