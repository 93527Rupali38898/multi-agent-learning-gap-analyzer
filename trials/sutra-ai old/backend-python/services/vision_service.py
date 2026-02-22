from services.gemini_service import GeminiService

class VisionService:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service
    
    def analyze_frame(self, frame_base64: str) -> dict:
        """
        Analyze video frame from mobile camera
        Uses gemini-1.5-flash-vision
        """
        try:
            result = self.gemini.analyze_vision_image(frame_base64)
            
            return {
                "detected_text": result.get("detected_text", ""),
                "analysis": result.get("analysis", ""),
                "suggestions": result.get("suggestions", [])
            }
            
        except Exception as e:
            print(f"Error analyzing frame: {e}")
            return {
                "detected_text": "",
                "analysis": "Unable to analyze frame",
                "suggestions": []
            }
