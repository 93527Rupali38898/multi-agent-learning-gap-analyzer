from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

from services.gemini_service import GeminiService
from services.plagiarism_engine import PlagiarismEngine
from services.analytics_service import AnalyticsService
# TODO: Fix RAG system - currently disabled because of Windows compatibility issues
# from services.rag_system import RAGSystem
from services.vision_service import VisionService

# RAG system disabled for now due to import issues
rag_system = None
from utils.code_linter import CodeLinter

load_dotenv()

app = FastAPI(title="Sutra AI - Python AI Engine")

# CORS - allowing all origins for development (TODO: restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # This should be changed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Services
gemini_service = GeminiService()
plagiarism_engine = PlagiarismEngine(gemini_service)
analytics_service = AnalyticsService(gemini_service)
vision_service = VisionService(gemini_service)
linter = CodeLinter()

# ==================== MODELS ====================

class CodeLintRequest(BaseModel):
    code: str
    language: str

class HintRequest(BaseModel):
    problemId: str
    problemTitle: str
    level: int  # 1-5
    userCode: str
    language: str

class PlagiarismCheckRequest(BaseModel):
    code: str
    language: str
    problemId: str

class VoiceRequest(BaseModel):
    problemTitle: str
    userQuestion: str

# ==================== ROOT ====================

@app.get("/")
def read_root():
    return {
        "message": "Sutra AI Python Engine",
        "version": "1.0.0",
        "status": "running"
    }

# ==================== HEALTH CHECK ====================

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# ==================== CODE LINTING ====================

@app.post("/lint")
def lint_code(request: CodeLintRequest):
    try:
        result = linter.lint(request.code, request.language)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== HINT SYSTEM (5 LEVELS) ====================

@app.post("/hint")
def get_hint(request: HintRequest):
    """
    5-Level Hint System:
    1. Tiny nudge
    2. Flow diagram (Gemini generates)
    3. Detailed explanation with code examples
    4. Error spotting
    5. Deep concept explanation (Gemini-based)
    """
    try:
        # All levels use Gemini now (RAG disabled for Windows)
        hint = gemini_service.generate_hint(
            problem_id=request.problemId,
            problem_title=request.problemTitle,
            level=request.level,
            user_code=request.userCode,
            language=request.language
        )
        
        return {
            "success": True,
            "level": request.level,
            "hint": hint
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PLAGIARISM CHECK ====================

@app.post("/plagiarism")
def check_plagiarism(request: PlagiarismCheckRequest):
    try:
        result = plagiarism_engine.check(
            code=request.code,
            language=request.language,
            problem_id=request.problemId
        )
        
        return {
            "success": True,
            "isPlagiarized": result["is_plagiarized"],
            "similarity": result["similarity_score"],
            "confidence": result["confidence"],
            "message": result["message"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== VISION (MOBILE LENS) ====================

@app.post("/vision/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze handwritten code from mobile camera
    """
    try:
        image_bytes = await file.read()
        
        result = vision_service.analyze_handwritten_code(image_bytes)
        
        return {
            "success": True,
            "extractedCode": result["code"],
            "language": result["language"],
            "confidence": result["confidence"],
            "suggestions": result["suggestions"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== VOICE PROCESSING ====================

@app.post("/voice/process")
def process_voice(request: VoiceRequest):
    """
    Process voice question about a problem
    """
    try:
        response = gemini_service.answer_voice_question(
            problem_title=request.problemTitle,
            question=request.userQuestion
        )
        
        return {
            "success": True,
            "response": response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ANALYTICS ====================

@app.get("/analytics/{uid}")
def get_analytics(uid: str):
    """
    Get user analytics for dashboard
    """
    try:
        analytics = analytics_service.generate_analytics(uid)
        return {"success": True, "data": analytics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)