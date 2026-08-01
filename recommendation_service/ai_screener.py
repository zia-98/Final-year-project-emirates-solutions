import google.generativeai as genai
import json
import os
import re
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_CANDIDATES = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemma-3-4b-it",
]
_AVAILABLE_GENERATE_MODELS = None


def _is_rate_limit_error(error: Exception) -> bool:
    message = str(error).lower()
    status_code = getattr(error, "status_code", None)
    code = getattr(error, "code", None)
    return (
        status_code == 429
        or code == 429
        or "rate limit" in message
        or "resource_exhausted" in message
        or "quota" in message
        or "too many requests" in message
    )


def _is_model_not_found_error(error: Exception) -> bool:
    message = str(error).lower()
    status_code = getattr(error, "status_code", None)
    code = getattr(error, "code", None)
    return (
        status_code == 404
        or code == 404
        or "404" in message
        or "not found" in message
        or "model not found" in message
    )


def _get_available_generate_models() -> set:
    global _AVAILABLE_GENERATE_MODELS
    if _AVAILABLE_GENERATE_MODELS is not None:
        return _AVAILABLE_GENERATE_MODELS

    available = set()
    try:
        for model in genai.list_models():
            supported = getattr(model, "supported_generation_methods", []) or []
            if "generateContent" not in supported:
                continue

            model_name = getattr(model, "name", "")
            # API returns names like "models/gemini-1.5-flash".
            if isinstance(model_name, str) and model_name.startswith("models/"):
                available.add(model_name.split("models/", 1)[1])
            elif isinstance(model_name, str) and model_name:
                available.add(model_name)

        print(f"[ai_screener] Available generateContent models discovered: {sorted(available)}")
    except Exception as error:
        # Do not crash if model listing fails; continue with configured candidates.
        print(f"[ai_screener] Warning: Could not list models via SDK: {error}")

    _AVAILABLE_GENERATE_MODELS = available
    return available


def _is_retryable_model_error(error: Exception) -> bool:
    return _is_model_not_found_error(error) or _is_rate_limit_error(error)


def _get_selected_models() -> list:
    available_models = _get_available_generate_models()
    selected_models = [m for m in MODEL_CANDIDATES if m in available_models]
    print(f"[ai_screener] Selected models after filtering: {selected_models}")
    if not selected_models:
        raise Exception("No valid Gemini models available")
    return selected_models


async def _generate_with_model_name(model_name: str, prompt: str):
    try:
        model = genai.GenerativeModel(
            model_name,
            generation_config={"response_mime_type": "application/json"},
        )
        print(f"[ai_screener] Using model '{model_name}' with response_mime_type JSON mode.")
        response = await model.generate_content_async(prompt)
        if response is None:
            raise RuntimeError("Model returned empty response")
        return response
    except Exception as error:
        if "response_mime_type" in str(error):
            print(f"[ai_screener] Model '{model_name}' does not support response_mime_type. Retrying without it.")
            model = genai.GenerativeModel(model_name)
            print(f"[ai_screener] Using model '{model_name}' without response_mime_type.")
            response = await model.generate_content_async(prompt)
            if response is None:
                raise RuntimeError("Model returned empty response")
            return response
        raise


async def _generate_with_model_fallback(prompt: str):
    last_error = None
    error_by_model = {}
    selected_models = _get_selected_models()

    for model_name in selected_models:
        print(f"[ai_screener] Trying model: {model_name}")
        try:
            response = await _generate_with_model_name(model_name, prompt)
            return response, model_name
        except Exception as error:
            last_error = error
            error_by_model[model_name] = str(error)
            print(f"[ai_screener] Model {model_name} failed: {error}")
            print(f"[ai_screener] Fallback to next model after failure on '{model_name}'.")
            continue

    if last_error:
        raise RuntimeError(f"All model fallbacks failed. Errors by model: {error_by_model}") from last_error
    raise RuntimeError("No valid Gemini model could generate a response")


def _extract_response_text(response) -> str:
    text = getattr(response, "text", None)
    if isinstance(text, str) and text.strip():
        return text.strip()

    candidates = getattr(response, "candidates", None) or []
    if not isinstance(candidates, list):
        candidates = []

    if candidates:
        first_candidate = candidates[0]
        content = getattr(first_candidate, "content", None)
        parts = getattr(content, "parts", None) or []
        if isinstance(parts, list) and parts:
            chunks = []
            for part in parts:
                part_text = getattr(part, "text", None)
                if isinstance(part_text, str) and part_text:
                    chunks.append(part_text)
            combined = "".join(chunks).strip()
            if combined:
                return combined

    # Defensive fallback for dict-like response payloads.
    try:
        if isinstance(response, dict):
            candidate_text = response["candidates"][0]["content"]["parts"][0]["text"]
            if isinstance(candidate_text, str) and candidate_text.strip():
                return candidate_text.strip()
    except Exception:
        pass

    raise ValueError("Model response did not contain readable text output")


def _parse_model_json(raw_text: str) -> dict:
    cleaned = _clean_response_text(raw_text)
    print(f"[ai_screener] Cleaned response text: {cleaned[:1500]}")

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as decode_error:
        raise ValueError(f"Invalid or potentially truncated JSON output: {decode_error}") from decode_error

    if not isinstance(parsed, dict):
        raise ValueError("Parsed JSON is not an object")
    return parsed


def _clean_response_text(raw_text: str) -> str:
    text = (raw_text or "").strip()
    if not text:
        raise ValueError("Empty model response")

    # Remove markdown fences like ```json ... ``` or ``` ... ```.
    cleaned = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned).strip()

    # If model included extra text, isolate the JSON object payload.
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        cleaned = match.group(0).strip()

    return cleaned


def _normalize_result(result: dict) -> dict:
    normalized = {
        "candidate_name": str(result.get("candidate_name") or "Unknown Candidate"),
        "email": str(result.get("email") or "N/A"),
        "phone": str(result.get("phone") or "N/A"),
        "skills_matched": result.get("skills_matched") if isinstance(result.get("skills_matched"), list) else [],
        "skills_missing": result.get("skills_missing") if isinstance(result.get("skills_missing"), list) else [],
        "education": str(result.get("education") or "N/A"),
        "experience_years": result.get("experience_years", 0),
        "match_score": result.get("match_score", 0),
        "strengths": result.get("strengths") if isinstance(result.get("strengths"), list) else [],
        "weaknesses": result.get("weaknesses") if isinstance(result.get("weaknesses"), list) else [],
        "recommendation": str(result.get("recommendation") or "Reject"),
        "summary": str(result.get("summary") or "No summary provided."),
    }

    try:
        normalized["experience_years"] = float(normalized["experience_years"])
    except Exception:
        normalized["experience_years"] = 0.0

    try:
        normalized["match_score"] = int(float(normalized["match_score"]))
    except Exception:
        normalized["match_score"] = 0

    normalized["match_score"] = max(0, min(100, normalized["match_score"]))
    return normalized

def _error_response(message: str, error: Exception | None = None) -> dict:
    payload = {
        "success": False,
        "error": message,
    }
    if error is not None:
        payload["error_detail"] = {
            "type": type(error).__name__,
            "message": str(error),
        }
    return payload


async def evaluate_resume(criteria: dict, resume_text: str) -> dict:
    """Evaluate a resume against criteria using Gemini API.

    Returns:
        {"success": True, "data": <normalized-evaluation-dict>} on success
        {"success": False, "error": <message>, ...} on failure
    """
    
    system_prompt = """You are an expert HR recruiter and resume evaluator. 
Your job is to evaluate resumes against internship criteria and 
return ONLY a valid JSON object with no extra text."""

    user_prompt = f"""
Internship Criteria:
{json.dumps(criteria, indent=2)}

Resume Text:
{resume_text}

Evaluate this resume and return a JSON object with EXACTLY this schema:
{{
  "candidate_name": "string",
  "email": "string",
  "phone": "string",
  "skills_matched": ["string"],
  "skills_missing": ["string"],
  "education": "string",
  "experience_years": 0,
  "match_score": 0,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendation": "Shortlist|Maybe|Reject",
  "summary": "string"
}}

Rules:
- Return ONLY valid JSON. No explanation, no extra text.
- match_score must be an integer between 0 and 100.
- summary must be maximum 2 sentences.
"""

    full_prompt = f"{system_prompt}\n\n{user_prompt}"
    model_errors = {}

    try:
        selected_models = _get_selected_models()
    except Exception as e:
        print(f"[ai_screener] Error selecting models: {e}")
        return _error_response("No valid Gemini models available", e)

    for used_model in selected_models:
        print(f"[ai_screener] Trying model: {used_model}")
        try:
            response = await _generate_with_model_name(used_model, full_prompt)
            print(f"[ai_screener] Raw response object: {repr(response)[:1200]}")

            response_text = _extract_response_text(response)
            print(f"[ai_screener] Extracted response text: {response_text[:1500]}")

            try:
                result = _parse_model_json(response_text)
                print(f"[ai_screener] JSON parsing succeeded for model '{used_model}'.")
            except Exception as parse_error:
                print(f"[ai_screener] Warning: JSON parsing failed for model '{used_model}': {parse_error}")
                print(f"[ai_screener] Warning: response may be truncated. Retrying once with same model '{used_model}'.")
                retry_response = await _generate_with_model_name(used_model, full_prompt)
                print(f"[ai_screener] Raw retry response object: {repr(retry_response)[:1200]}")
                retry_text = _extract_response_text(retry_response)
                print(f"[ai_screener] Extracted retry response text: {retry_text[:1500]}")
                try:
                    result = _parse_model_json(retry_text)
                    print(f"[ai_screener] JSON parsing succeeded after retry for model '{used_model}'.")
                except Exception as retry_parse_error:
                    model_errors[used_model] = f"Parse failed after retry: {retry_parse_error}"
                    print(f"[ai_screener] Model {used_model} failed after retry parse: {retry_parse_error}")
                    print(f"[ai_screener] Fallback to next model after parse failure on '{used_model}'.")
                    continue

            normalized = _normalize_result(result)
            print(f"[ai_screener] Parsed JSON result: {json.dumps(normalized, ensure_ascii=False)[:1200]}")
            print(f"[ai_screener] Model {used_model} succeeded")
            return {
                "success": True,
                "data": normalized,
            }
        except Exception as model_error:
            model_errors[used_model] = str(model_error)
            print(f"[ai_screener] Model {used_model} failed: {model_error}")
            print(f"[ai_screener] Fallback to next model after failure on '{used_model}'.")
            continue

    e = RuntimeError(f"All selected models failed to produce valid JSON. Errors by model: {model_errors}")
    print(f"[ai_screener] Error calling Gemini API: {e}")
    return _error_response(str(e), e)
