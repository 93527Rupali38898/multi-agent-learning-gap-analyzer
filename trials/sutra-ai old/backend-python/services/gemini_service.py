import os
import google.generativeai as genai
from typing import Optional

class GeminiService:
    def __init__(self):
        # ⚠️ IMPORTANT: Add your Gemini API key here
        api_key = os.getenv("GEMINI_API_KEY", "AIzaSyAKvk7d8p-xxSRQNynuGVnmqc1DPCAmNL0")
        genai.configure(api_key=api_key)
        
        # Use gemini-1.5-flash for general tasks
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Use gemini-1.5-flash-vision for vision tasks
        self.vision_model = genai.GenerativeModel('gemini-1.5-flash')
    
    def generate_optimal_solution(self, problem_description: str, language: str) -> str:
        """Generate optimal solution for plagiarism comparison"""
        prompt = f"""
You are an expert programmer. Generate the MOST OPTIMAL solution for this problem in {language}.

Problem: {problem_description}

Requirements:
- Write clean, efficient code
- Use best practices
- Add comments explaining logic
- Return ONLY the code, no explanations

Code:
"""
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error generating solution: {e}")
            return ""
    
    def generate_hint(self, problem_id: str, problem_title: str, level: int, 
                     user_code: str, language: str) -> str:
        """
        Generate hints based on level (1-4)
        Level 5 uses RAG system
        """
        prompts = {
            1: f"""
You are a coding mentor. The user is solving: "{problem_title}"

Provide a GENTLE NUDGE to help them think about the problem.
- Don't give away the solution
- Ask a guiding question or hint at the approach
- Keep it to 2-3 sentences

Hint:
""",
            2: f"""
You are a coding mentor. The user is solving: "{problem_title}"

Create a FLOW DIAGRAM or PSEUDOCODE to visualize the solution approach.
- Use ASCII art or simple markdown
- Show the main steps
- Don't write actual code

Flow Diagram:
""",
            3: f"""
You are a coding mentor. The user is solving: "{problem_title}"
User's current code:
```{language}
{user_code}
```

Provide a DETAILED EXPLANATION with CODE EXAMPLES:
- Explain the concept they need to understand
- Show a small code snippet demonstrating the concept
- Guide them toward the solution
- Help them understand WHY this approach works

Explanation:
""",
            4: f"""
You are a code reviewer. The user is solving: "{problem_title}"
User's code:
```{language}
{user_code}
```

SPOT ERRORS and provide specific feedback:
- Identify logical errors
- Point out edge cases they missed
- Suggest what to fix (but don't fix it for them)
- Be constructive and encouraging

Error Analysis:
"""
        }
        
        prompt = prompts.get(level, prompts[1])
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error generating hint: {e}")
            return "Sorry, I couldn't generate a hint right now."
    
    def analyze_code_quality(self, code: str, language: str, problem_context: str) -> dict:
        """
        Analyze code for:
        - Syntax Accuracy (0-100)
        - Logical Efficiency (0-100)
        - Concept Mastery (0-100)
        """
        prompt = f"""
You are an expert code analyzer. Analyze this {language} code for a coding problem.

Problem Context: {problem_context}

Code:
```{language}
{code}
```

Provide a JSON response with these scores (0-100):
{{
  "syntaxAccuracy": <score>,
  "logicalEfficiency": <score>,
  "conceptMastery": <score>,
  "feedback": "<brief feedback>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"]
}}

Only return the JSON, no other text.
"""
        
        try:
            response = self.model.generate_content(prompt)
            # Parse JSON from response
            import json
            result = json.loads(response.text.strip())
            return result
        except Exception as e:
            print(f"Error analyzing code: {e}")
            return {
                "syntaxAccuracy": 50,
                "logicalEfficiency": 50,
                "conceptMastery": 50,
                "feedback": "Unable to analyze",
                "strengths": [],
                "improvements": []
            }
    
    def generate_voice_response(self, query: str, context: str = "") -> str:
        """Generate AI response for voice queries"""
        prompt = f"""
You are Sutra AI, a helpful coding assistant. The user asked via voice:

User Query: {query}

{f"Context: {context}" if context else ""}

Provide a clear, concise, spoken response (max 3-4 sentences).
Be helpful, friendly, and encouraging.

Response:
"""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error generating voice response: {e}")
            return "I'm having trouble processing that right now. Can you try again?"
    
    def analyze_vision_image(self, image_data: str) -> dict:
        """
        Analyze image from mobile camera
        Detects handwritten code, diagrams, notes
        """
        try:
            import base64
            from PIL import Image
            import io
            
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            prompt = """
Analyze this image of handwritten code or notes.

Extract:
1. Any code written
2. Diagrams or flowcharts
3. Key concepts or formulas
4. Suggestions to help the user

Provide a JSON response:
{
  "detected_text": "<extracted text>",
  "analysis": "<what you see>",
  "suggestions": ["<tip1>", "<tip2>"]
}

Only return JSON.
"""
            
            response = self.vision_model.generate_content([prompt, image])
            
            import json
            result = json.loads(response.text.strip())
            return result
            
        except Exception as e:
            print(f"Error analyzing vision: {e}")
            return {
                "detected_text": "",
                "analysis": "Unable to analyze image",
                "suggestions": []
            }
