from typing import Dict, List
from services.gemini_service import GeminiService

class AnalyticsService:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service
    
    def analyze(self, code: str, language: str, problem_id: str, hints_used: List[dict]) -> Dict:
        """
        Analyze code and return:
        - Syntax Accuracy (0-100)
        - Logical Efficiency (0-100)
        - Concept Mastery (0-100)
        - Weak Topics (identified from hints used at level 4/5)
        """
        
        # Get Gemini analysis
        problem_context = f"Problem ID: {problem_id}"  # Replace with actual problem details
        
        quality_analysis = self.gemini.analyze_code_quality(
            code=code,
            language=language,
            problem_context=problem_context
        )
        
        # Identify weak topics from hints
        weak_topics = self._identify_weak_topics(hints_used, code, language)
        
        return {
            "syntaxAccuracy": quality_analysis.get("syntaxAccuracy", 50),
            "logicalEfficiency": quality_analysis.get("logicalEfficiency", 50),
            "conceptMastery": quality_analysis.get("conceptMastery", 50),
            "weakTopics": weak_topics,
            "feedback": quality_analysis.get("feedback", ""),
            "strengths": quality_analysis.get("strengths", []),
            "improvements": quality_analysis.get("improvements", [])
        }
    
    def _identify_weak_topics(self, hints_used: List[dict], code: str, language: str) -> List[str]:
        """
        Identify weak topics based on:
        1. Hints used at level 4/5 (error spotting, concept explanation)
        2. Code analysis for missing concepts
        """
        weak_topics = []
        
        # Check hints at level 4 or 5
        for hint in hints_used:
            if hint.get("level", 0) >= 4:
                # Extract topic from hint content (simple keyword matching)
                content = hint.get("content", "").lower()
                
                # Common topics to track
                topics = {
                    "recursion": ["recursion", "recursive", "base case"],
                    "loops": ["loop", "iteration", "for", "while"],
                    "arrays": ["array", "list", "index"],
                    "strings": ["string", "substring", "character"],
                    "dynamic_programming": ["dp", "dynamic programming", "memoization"],
                    "graphs": ["graph", "bfs", "dfs", "traversal"],
                    "trees": ["tree", "binary tree", "node"],
                    "sorting": ["sort", "quicksort", "mergesort"],
                    "searching": ["search", "binary search"],
                    "hash_tables": ["hash", "dictionary", "map"]
                }
                
                for topic, keywords in topics.items():
                    if any(keyword in content for keyword in keywords):
                        if topic not in weak_topics:
                            weak_topics.append(topic)
        
        # Additional analysis: Check for syntax errors (indicates weak syntax understanding)
        if self._has_syntax_errors(code, language):
            weak_topics.append("syntax")
        
        return weak_topics
    
    def _has_syntax_errors(self, code: str, language: str) -> bool:
        """Check if code has syntax errors"""
        if language.lower() == "python":
            try:
                compile(code, '<string>', 'exec')
                return False
            except SyntaxError:
                return True
        
        # For other languages, assume no errors (implement language-specific checks)
        return False
