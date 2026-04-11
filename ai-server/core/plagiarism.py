import ast
import hashlib
import json
import os
import difflib
from typing import Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")


# ─────────────────────────────────────────────
# 1. AST FINGERPRINTER
#    Converts Python code into a structural
#    signature that ignores variable names,
#    function names, and string/number values.
#    Two codes with same logic → same fingerprint.
# ─────────────────────────────────────────────

class ASTFingerprinter(ast.NodeVisitor):
    """
    Walks the AST and builds a normalized sequence of tokens
    that captures STRUCTURE only — not naming choices.

    Example: def solve(n): vs def answer(x):
    Both produce:  ['FunctionDef', 'arg', ...]
    """

    def __init__(self):
        self.tokens = []

    def visit(self, node):
        node_type = type(node).__name__

        # Record node type
        self.tokens.append(node_type)

        # For certain nodes, record structural metadata (not values)
        if isinstance(node, ast.FunctionDef):
            # Record argument count, not argument names
            self.tokens.append(f"args:{len(node.args.args)}")

        elif isinstance(node, (ast.For, ast.While)):
            self.tokens.append("LOOP")

        elif isinstance(node, ast.If):
            # Record if it has an else branch
            self.tokens.append(f"IF_ELSE:{bool(node.orelse)}")

        elif isinstance(node, ast.Return):
            self.tokens.append("RETURN")

        elif isinstance(node, ast.BinOp):
            # Record the operator type, not the operands
            self.tokens.append(f"BINOP:{type(node.op).__name__}")

        elif isinstance(node, ast.Compare):
            ops = [type(op).__name__ for op in node.ops]
            self.tokens.append(f"CMP:{','.join(ops)}")

        elif isinstance(node, ast.Call):
            # Record number of args to the call, not the function name
            self.tokens.append(f"CALL:args={len(node.args)}")

        elif isinstance(node, ast.ListComp):
            self.tokens.append("LIST_COMP")

        elif isinstance(node, ast.Dict):
            self.tokens.append("DICT")

        elif isinstance(node, ast.List):
            self.tokens.append("LIST")

        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            self.tokens.append("IMPORT")

        elif isinstance(node, ast.ClassDef):
            self.tokens.append(f"CLASS:bases={len(node.bases)}")

        elif isinstance(node, ast.Try):
            self.tokens.append("TRY_EXCEPT")

        elif isinstance(node, ast.Lambda):
            self.tokens.append("LAMBDA")

        elif isinstance(node, ast.Assert):
            self.tokens.append("ASSERT")

        # Recurse into children
        self.generic_visit(node)

    def get_fingerprint(self) -> str:
        """Returns a normalized token string."""
        return " ".join(self.tokens)

    def get_hash(self) -> str:
        """Returns an MD5 hash of the fingerprint."""
        fp = self.get_fingerprint()
        return hashlib.md5(fp.encode()).hexdigest()


def extract_ast_fingerprint(code: str) -> dict:
    """
    Main function: parses code and returns
    fingerprint, hash, and structural metrics.
    """
    result = {
        "fingerprint": "",
        "hash": "",
        "parse_error": None,
        "metrics": {}
    }

    try:
        tree = ast.parse(code)
        visitor = ASTFingerprinter()
        visitor.visit(tree)

        result["fingerprint"] = visitor.get_fingerprint()
        result["hash"] = visitor.get_hash()

        # Structural metrics (for display in report)
        result["metrics"] = {
            "num_functions": sum(1 for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)),
            "num_loops": sum(1 for n in ast.walk(tree) if isinstance(n, (ast.For, ast.While))),
            "num_conditionals": sum(1 for n in ast.walk(tree) if isinstance(n, ast.If)),
            "num_returns": sum(1 for n in ast.walk(tree) if isinstance(n, ast.Return)),
            "nesting_depth": _get_max_depth(tree),
            "uses_recursion": _check_recursion(tree),
            "list_comps": sum(1 for n in ast.walk(tree) if isinstance(n, ast.ListComp)),
            "num_classes": sum(1 for n in ast.walk(tree) if isinstance(n, ast.ClassDef)),
        }

    except SyntaxError as e:
        result["parse_error"] = str(e)

    return result


def _get_max_depth(tree, current=0) -> int:
    """Recursively find max nesting depth."""
    if not list(ast.iter_child_nodes(tree)):
        return current
    return max(_get_max_depth(child, current + 1) for child in ast.iter_child_nodes(tree))


def _check_recursion(tree) -> bool:
    """Check if any function calls itself (simple recursion check)."""
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            func_name = node.id if hasattr(node, 'id') else node.name
            for child in ast.walk(node):
                if isinstance(child, ast.Call):
                    if isinstance(child.func, ast.Name) and child.func.id == func_name:
                        return True
    return False


# ─────────────────────────────────────────────
# 2. SIMILARITY ENGINE
#    Compares fingerprints using two methods:
#    a) Token sequence similarity (difflib SequenceMatcher)
#    b) Hash match (exact structural copy)
# ─────────────────────────────────────────────

def compute_structural_similarity(fp1: str, fp2: str) -> float:
    """
    Uses difflib SequenceMatcher on token sequences.
    Returns a score from 0.0 (different) to 1.0 (identical).
    This catches structural copies even with different variable names.
    """
    tokens1 = fp1.split()
    tokens2 = fp2.split()

    if not tokens1 or not tokens2:
        return 0.0

    matcher = difflib.SequenceMatcher(None, tokens1, tokens2)
    return matcher.ratio()


def compute_text_similarity(code1: str, code2: str) -> float:
    """
    Raw text similarity after stripping comments and normalizing whitespace.
    Catches copy-paste with minor edits.
    """
    def normalize(code):
        lines = []
        for line in code.splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                lines.append(stripped)
        return " ".join(lines)

    normalized1 = normalize(code1)
    normalized2 = normalize(code2)

    if not normalized1 or not normalized2:
        return 0.0

    matcher = difflib.SequenceMatcher(None, normalized1, normalized2)
    return matcher.ratio()


def combined_similarity_score(
    structural: float,
    textual: float,
    hash_match: bool
) -> float:
    """
    Weighted combination:
    - Hash match (exact AST clone) → 95%
    - Structural (same logic, different names) → 70% weight
    - Textual (surface similarity) → 30% weight
    """
    if hash_match:
        return 0.95

    return round((structural * 0.70) + (textual * 0.30), 3)


# ─────────────────────────────────────────────
# 3. GEMINI SEMANTIC ANALYSIS
#    For pairs above threshold, Gemini explains
#    WHY the code is similar — not just a score.
# ─────────────────────────────────────────────

def gemini_plagiarism_analysis(
    submitted_code: str,
    matched_code: str,
    structural_score: float,
    problem_title: str
) -> dict:
    """
    Asks Gemini to:
    1. Confirm if similarity is genuine or coincidental
    2. Explain which parts are structurally similar
    3. Identify if it's a renamed copy vs independent solution
    Returns a structured JSON response.
    """

    prompt = f"""You are a plagiarism detection expert for a coding education platform.

Problem: "{problem_title}"

--- SUBMISSION A (Student's current code) ---
{submitted_code}

--- SUBMISSION B (Prior submission from database) ---
{matched_code}

Structural similarity score (AST-based): {structural_score:.1%}

Analyze these two code submissions and return ONLY a JSON object with this exact structure:
{{
  "verdict": "original" | "similar" | "suspect" | "copied",
  "confidence": 0.0 to 1.0,
  "explanation": "2-3 sentence explanation of your verdict",
  "similarities": ["list", "of", "specific", "structural", "similarities"],
  "differences": ["list", "of", "genuine", "differences"],
  "is_renamed_copy": true | false,
  "educational_note": "1 sentence advice for the student"
}}

Verdict guide:
- "original": Different approach, coincidental similarity
- "similar": Same approach, likely learned from same resource
- "suspect": Very similar structure, possibly shared work
- "copied": Structural clone, just variable/function names changed

Be fair and educational. Students can arrive at similar solutions independently."""

    try:
        response = model.generate_content(prompt)
        clean = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)
    except Exception as e:
        return {
            "verdict": "error",
            "confidence": 0.0,
            "explanation": f"Gemini analysis failed: {str(e)}",
            "similarities": [],
            "differences": [],
            "is_renamed_copy": False,
            "educational_note": "Please try again."
        }


# ─────────────────────────────────────────────
# 4. MAIN CHECK FUNCTION
#    Called by the FastAPI endpoint
# ─────────────────────────────────────────────

def run_plagiarism_check(
    submitted_code: str,
    problem_id: str,
    problem_title: str,
    user_id: str,
    stored_submissions: list  # fetched from MongoDB by the caller
) -> dict:
    """
    Full pipeline:
    1. Parse submitted code → AST fingerprint
    2. Compare against all stored submissions for this problem
    3. Find the most similar one above threshold
    4. Run Gemini analysis on the top match
    5. Return a complete report
    """

    SIMILARITY_THRESHOLD = 0.40  # only flag pairs above 40% similarity

    # Step 1: Fingerprint the submitted code
    submitted_fp_data = extract_ast_fingerprint(submitted_code)

    if submitted_fp_data["parse_error"]:
        return {
            "status": "parse_error",
            "message": f"Could not parse your code: {submitted_fp_data['parse_error']}",
            "score": 0,
            "matches": []
        }

    submitted_fp = submitted_fp_data["fingerprint"]
    submitted_hash = submitted_fp_data["hash"]
    submitted_metrics = submitted_fp_data["metrics"]

    # Step 2: Compare against each stored submission
    matches = []

    for submission in stored_submissions:
        # Skip the student's own previous submissions
        if submission.get("userId") == user_id:
            continue

        stored_code = submission.get("code", "")
        if not stored_code or len(stored_code.strip()) < 10:
            continue

        stored_fp_data = extract_ast_fingerprint(stored_code)
        if stored_fp_data["parse_error"]:
            continue

        stored_fp = stored_fp_data["fingerprint"]
        stored_hash = stored_fp_data["hash"]

        # Compute similarity scores
        structural = compute_structural_similarity(submitted_fp, stored_fp)
        textual = compute_text_similarity(submitted_code, stored_code)
        hash_match = (submitted_hash == stored_hash)

        combined = combined_similarity_score(structural, textual, hash_match)

        if combined >= SIMILARITY_THRESHOLD:
            matches.append({
                "submission_id": str(submission.get("_id", "")),
                "matched_user_id": submission.get("userId", "anonymous"),
                "structural_score": round(structural, 3),
                "textual_score": round(textual, 3),
                "combined_score": combined,
                "hash_match": hash_match,
                "matched_code": stored_code  # used for Gemini, not shown to student
            })

    # Sort by combined score, highest first
    matches.sort(key=lambda x: x["combined_score"], reverse=True)

    # Step 3: Gemini analysis on top match only (to save API calls)
    gemini_result = None
    top_match_score = 0.0

    if matches:
        top = matches[0]
        top_match_score = top["combined_score"]

        gemini_result = gemini_plagiarism_analysis(
            submitted_code=submitted_code,
            matched_code=top["matched_code"],
            structural_score=top["structural_score"],
            problem_title=problem_title
        )

        # Remove raw matched_code from response (privacy)
        for m in matches:
            m.pop("matched_code", None)

    # Step 4: Build the final report
    overall_score = int(top_match_score * 100) if matches else 0

    verdict = "original"
    if gemini_result:
        verdict = gemini_result.get("verdict", "original")

    return {
        "status": "success",
        "problem_id": problem_id,
        "user_id": user_id,
        "overall_score": overall_score,
        "verdict": verdict,
        "total_submissions_checked": len(stored_submissions),
        "matches_found": len(matches),
        "top_matches": matches[:3],  # return top 3 at most
        "gemini_analysis": gemini_result,
        "submitted_metrics": submitted_metrics,
        "submitted_fingerprint_hash": submitted_hash
    }
