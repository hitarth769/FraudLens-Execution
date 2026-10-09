import google.generativeai as genai
from typing import Optional, Dict, Any, Tuple
from app.core.config import settings
import logging
import concurrent.futures

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._initialized = False

    def _initialize(self):
        if not self.api_key:
            return False
        try:
            genai.configure(api_key=self.api_key)
            self._initialized = True
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Gemini SDK: {e}")
            return False

    def generate_narrative(self, ctx_evidence: Dict[str, Any], pattern_scores: list) -> Optional[str]:
        if not self._initialize():
            return None

        try:
            # Use a ThreadPoolExecutor to enforce a strict timeout on the API call
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(self._call_gemini_api, ctx_evidence, pattern_scores)
                # 10 second timeout to prevent investigation hangs
                return future.result(timeout=10)
        except concurrent.futures.TimeoutError:
            logger.error("Gemini API request timed out after 10 seconds")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during LLM narrative generation: {e}")
            return None

    def _call_gemini_api(self, ctx_evidence: Dict[str, Any], pattern_scores: list) -> str:
        model = genai.GenerativeModel(self.model_name)

        # Grounding the prompt in deterministic findings
        evidence_summary = "\n".join([
            f"- [{ev.id}] {ev.title}: {ev.observed} (Severity: {ev.severity})"
            for ev in ctx_evidence.values()
        ])

        scores_summary = "\n".join([
            f"- {ps.pattern}: Score {ps.score}/100"
            for ps in pattern_scores
        ])

        prompt = (
            "You are a senior fraud analyst. Generate a professional, evidence-grounded "
            "investigation narrative for a fraud case. \n\n"
            "DETERMINISTIC FINDINGS:\n"
            f"{evidence_summary}\n\n"
            "PATTERN SCORES:\n"
            f"{scores_summary}\n\n"
            "GUIDELINES:\n"
            "1. Use ONLY the provided evidence. Do not invent new transactions or findings.\n"
            "2. When referencing a finding, include the evidence ID in brackets, e.g., [EV-123].\n"
            "3. Do not calculate new scores; use the provided pattern scores.\n"
            "4. Be concise and objective. Explain WHY the evidence leads to the result.\n"
            "5. Maintain a professional tone suitable for a regulatory report.\n\n"
            "Narrative:"
        )

        response = model.generate_content(prompt)
        return response.text.strip()

    def check_availability(self) -> bool:
        if not self.api_key:
            return False
        try:
            self._initialize()
            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content("ping", generation_config={"max_output_tokens": 1})
            return response is not None
        except Exception:
            return False

llm_service = LLMService()
