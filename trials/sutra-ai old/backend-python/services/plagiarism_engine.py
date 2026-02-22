import ast
import difflib
from typing import Dict
from services.gemini_service import GeminiService

class PlagiarismEngine:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service
        self.threshold = 80  # 80% similarity = plagiarism
    
    def check(self, user_code: str, language: str, problem_id: str, difficulty: str) -> Dict:
        """
        Check plagiarism for Medium/Hard questions
        1. Generate optimal solution using Gemini
        2. Compare using AST (for Python) or sequence matching
        3. Return similarity score
        """
        
        # Generate optimal solution
        # Note: You would fetch problem description from DB
        problem_description = f"Problem ID: {problem_id}"  # Replace with actual description
        
        optimal_solution = self.gemini.generate_optimal_solution(
            problem_description=problem_description,
            language=language
        )
        
        if not optimal_solution:
            return {
                "score": 0,
                "isPlagiarized": False,
                "optimalSolution": "",
                "message": "Unable to generate optimal solution"
            }
        
        # Calculate similarity
        if language.lower() == "python":
            similarity = self._compare_python_ast(user_code, optimal_solution)
        else:
            similarity = self._compare_sequence(user_code, optimal_solution)
        
        is_plagiarized = similarity >= self.threshold
        
        return {
            "score": round(similarity, 2),
            "isPlagiarized": is_plagiarized,
            "optimalSolution": optimal_solution,
            "message": "Plagiarism detected" if is_plagiarized else "Original work"
        }
    
    def _compare_python_ast(self, code1: str, code2: str) -> float:
        """
        Compare Python code using Abstract Syntax Tree
        More accurate than string comparison
        """
        try:
            tree1 = ast.parse(code1)
            tree2 = ast.parse(code2)
            
            # Convert AST to string representation
            dump1 = ast.dump(tree1)
            dump2 = ast.dump(tree2)
            
            # Calculate similarity
            similarity = difflib.SequenceMatcher(None, dump1, dump2).ratio() * 100
            return similarity
            
        except SyntaxError:
            # Fallback to sequence matching if AST fails
            return self._compare_sequence(code1, code2)
    
    def _compare_sequence(self, code1: str, code2: str) -> float:
        """
        Compare code using sequence matching
        Works for any language
        """
        # Normalize: remove whitespace and comments
        normalized1 = self._normalize_code(code1)
        normalized2 = self._normalize_code(code2)
        
        # Calculate similarity
        similarity = difflib.SequenceMatcher(None, normalized1, normalized2).ratio() * 100
        return similarity
    
    def _normalize_code(self, code: str) -> str:
        """Remove whitespace and normalize code for comparison"""
        lines = code.split('\n')
        # Remove comments and empty lines
        cleaned = []
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#') and not line.startswith('//'):
                cleaned.append(line)
        return ''.join(cleaned)
