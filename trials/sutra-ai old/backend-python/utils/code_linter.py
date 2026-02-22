class CodeLinter:
    """
    Validate that user is running code in correct language environment
    Prevents running Python code in C++ environment, etc.
    """
    
    def validate(self, code: str, expected_language: str) -> dict:
        """
        Check if code matches expected language
        Returns: {"valid": bool, "error": str}
        """
        
        language = expected_language.lower()
        
        # Language-specific validation
        validators = {
            "python": self._is_python,
            "javascript": self._is_javascript,
            "java": self._is_java,
            "cpp": self._is_cpp,
            "c": self._is_c
        }
        
        validator = validators.get(language)
        
        if not validator:
            return {"valid": True, "error": ""}
        
        is_valid = validator(code)
        
        if not is_valid:
            return {
                "valid": False,
                "error": f"Code does not appear to be valid {expected_language}. Please check your language selection."
            }
        
        return {"valid": True, "error": ""}
    
    def _is_python(self, code: str) -> bool:
        """Check if code is Python"""
        python_keywords = ["def ", "import ", "class ", "if ", "for ", "while ", "print("]
        non_python = ["{", "}", ";}", "void ", "int main"]
        
        has_python = any(keyword in code for keyword in python_keywords)
        has_non_python = any(keyword in code for keyword in non_python)
        
        return has_python and not has_non_python
    
    def _is_javascript(self, code: str) -> bool:
        """Check if code is JavaScript"""
        js_keywords = ["function", "const ", "let ", "var ", "console.log", "=>"]
        return any(keyword in code for keyword in js_keywords)
    
    def _is_java(self, code: str) -> bool:
        """Check if code is Java"""
        java_keywords = ["public class", "public static void", "System.out"]
        return any(keyword in code for keyword in java_keywords)
    
    def _is_cpp(self, code: str) -> bool:
        """Check if code is C++"""
        cpp_keywords = ["#include", "cout", "cin", "namespace std", "std::"]
        return any(keyword in code for keyword in cpp_keywords)
    
    def _is_c(self, code: str) -> bool:
        """Check if code is C"""
        c_keywords = ["#include", "printf", "scanf", "int main"]
        cpp_specific = ["cout", "cin", "namespace", "std::"]
        
        has_c = any(keyword in code for keyword in c_keywords)
        has_cpp = any(keyword in code for keyword in cpp_specific)
        
        return has_c and not has_cpp
