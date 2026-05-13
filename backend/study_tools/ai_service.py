"""
Service IA pour la génération d'outils de révision.

Chaîne de fallback : Claude Haiku → Gemini Flash → Groq Llama.
Si tous échouent, une exception est levée avec un message explicite.
"""

import json
import logging
import os
import tempfile

from django.conf import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

# --- PERSONA SPHERA ---
SPHERA_PERSONA = (
    "You are Sphera, the academic assistant for CampusSphere. "
    "You are intelligent, warm, and direct. "
    "Speak to students like a brilliant older sister who genuinely wants them to succeed. "
    "CRITICAL RULE: YOU MUST DETECT THE LANGUAGE OF THE SOURCE TEXT AND GENERATE ALL YOUR RESPONSES (except JSON keys) IN THAT EXACT SAME LANGUAGE. "
    "If the source text is in English, reply in English. "
    "If it is in French, reply in French. If it is in Spanish, reply in Spanish, etc.\n\n"
)

# --- PROMPTS ---

FICHE_PROMPT = SPHERA_PERSONA + """
Generate a structured study sheet in JSON format based on the provided course text.
No text before or after the JSON. The JSON KEYS must remain in French ("titre", "resume", etc.), but the VALUES must be written in the SAME LANGUAGE as the source text.

Strict JSON format:
{{
  "titre": "Course Title",
  "resume": "EXTREMELY DETAILED and EXHAUSTIVE summary of the course. You must write at least 3-4 long paragraphs rich in information to deeply cover the main ideas, context, challenges, examples, and main conclusions. Do not be brief.",
  "points_cles": ["very detailed key point 1", "key point 2", "key point 3", "key point 4"],
  "definitions": [{{"terme": "...", "definition": "Complete and precise definition..."}}],
  "formules": ["formula or abstract concept 1"],
  "a_retenir": ["practical revision advice 1", "trap to avoid 2"]
}}

Course Text:
{text}
"""

QUIZ_PROMPT = SPHERA_PERSONA + """
Generate 10 multiple-choice questions (MCQs) in JSON format based on the provided course text.
No text before or after the JSON. The JSON KEYS must remain in French ("question", "options", etc.), but the content must be in the SAME LANGUAGE as the source text.

Strict JSON format:
{{
  "titre": "Quiz - Course Title",
  "questions": [
    {{
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "bonne_reponse": "A",
      "explication": "Detailed explanation of the correct answer"
    }}
  ]
}}

Course Text:
{text}
"""

FLASHCARDS_PROMPT = SPHERA_PERSONA + """
Generate 10 front/back flashcards in JSON format based on the provided course text.
No text before or after the JSON. The JSON KEYS must remain in French ("recto", "verso", etc.), but the content must be in the SAME LANGUAGE as the source text.

Strict JSON format:
{{
  "titre": "Flashcards - Course Title",
  "cartes": [
    {{
      "recto": "Question or term",
      "verso": "Complete answer or definition"
    }}
  ]
}}

Course Text:
{text}
"""

_PROMPTS = {
    "fiche": FICHE_PROMPT,
    "quiz": QUIZ_PROMPT,
    "flashcards": FLASHCARDS_PROMPT,
}


def get_prompt(tool_type: str, text: str) -> str:
    template = _PROMPTS.get(tool_type)
    if not template:
        raise ValueError(f"Type d'outil inconnu : {tool_type}")
    return template.format(text=text)


# ---------------------------------------------------------------------------
# Extraction Texte
# ---------------------------------------------------------------------------

def extract_text_from_file(file_path: str, max_chars: int = 12000) -> str:
    """Extrait le texte d'un PDF, DOCX ou TXT. Tronque à max_chars."""
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    
    if ext == ".pdf":
        try:
            import fitz  # PyMuPDF
        except ImportError:
            raise ImportError(
                "PyMuPDF n'est pas installé. Exécutez : pip install pymupdf"
            )
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
                if len(text) >= max_chars:
                    break
            doc.close()
        except Exception as e:
            raise ValueError(f"Impossible de lire le PDF : {e}")
            
    elif ext == ".docx":
        try:
            import docx
        except ImportError:
            raise ImportError(
                "python-docx n'est pas installé. Exécutez : pip install python-docx"
            )
        try:
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
                if len(text) >= max_chars:
                    break
        except Exception as e:
            raise ValueError(f"Impossible de lire le DOCX : {e}")
            
    elif ext == ".txt":
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read(max_chars)
        except Exception as e:
            raise ValueError(f"Impossible de lire le TXT : {e}")
            
    else:
        # Default to raw text read attempt
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read(max_chars)
        except Exception as e:
            raise ValueError(f"Format non supporté ou fichier illisible : {ext}")

    return text[:max_chars].strip()


# ---------------------------------------------------------------------------
# Nettoyage JSON
# ---------------------------------------------------------------------------

def clean_json(raw: str) -> dict:
    """Supprime les balises markdown autour du JSON et parse."""
    raw = raw.strip()
    # Supprimer les blocs ```json ... ```
    if raw.startswith("```"):
        lines = raw.split("\n")
        # Supprimer première et dernière ligne si ce sont des délimiteurs
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw = "\n".join(lines).strip()

    return json.loads(raw)


# ---------------------------------------------------------------------------
# Providers IA
# ---------------------------------------------------------------------------

def generate_with_claude(text: str, tool_type: str) -> dict:
    """Génération via Anthropic Claude Haiku."""
    api_key = getattr(settings, "ANTHROPIC_API_KEY", None)
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY non configurée")

    import anthropic

    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=3000,
        messages=[{"role": "user", "content": get_prompt(tool_type, text)}],
    )
    raw = response.content[0].text
    try:
        return clean_json(raw)
    except json.JSONDecodeError:
        # Retry une fois avec le même résultat brut nettoyé différemment
        logger.warning("[AI] Claude : JSON mal formé, tentative de re-parsing...")
        # Cherche le premier { et dernier }
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])
        raise


def generate_with_gemini(text: str, tool_type: str) -> dict:
    """Génération via Google Gemini Flash."""
    api_key = getattr(settings, "GEMINI_API_KEY", None)
    if not api_key:
        raise ValueError("GEMINI_API_KEY non configurée")

    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(get_prompt(tool_type, text))
    raw = response.text
    try:
        return clean_json(raw)
    except json.JSONDecodeError:
        logger.warning("[AI] Gemini : JSON mal formé, tentative de re-parsing...")
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])
        raise


def generate_with_groq(text: str, tool_type: str) -> dict:
    """Génération via Groq Llama (gratuit)."""
    api_key = getattr(settings, "GROQ_API_KEY", None)
    if not api_key:
        raise ValueError("GROQ_API_KEY non configurée")

    from groq import Groq

    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=3000,
        messages=[{"role": "user", "content": get_prompt(tool_type, text)}],
    )
    raw = response.choices[0].message.content
    try:
        return clean_json(raw)
    except json.JSONDecodeError:
        logger.warning("[AI] Groq : JSON mal formé, tentative de re-parsing...")
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])
        raise


# ---------------------------------------------------------------------------
# Orchestrateur avec fallback
# ---------------------------------------------------------------------------

PROVIDERS = [
    ("claude", generate_with_claude),
    ("gemini", generate_with_gemini),
    ("groq", generate_with_groq),
]


def generate_with_fallback(text: str, tool_type: str) -> dict:
    """
    Essaie chaque provider dans l'ordre.
    Passe au suivant si erreur (rate limit, timeout, JSON invalide...).
    Lève une exception seulement si tous les providers échouent.
    """
    if not text or len(text) < 50:
        raise ValueError(
            "Le texte extrait est trop court. "
            "Ce document ne contient pas de texte extractible. "
            "Essaie avec un document numérique contenant du vrai texte."
        )

    last_error = None
    for provider_name, provider_fn in PROVIDERS:
        try:
            logger.info(f"[AI] Tentative avec : {provider_name}")
            result = provider_fn(text, tool_type)
            logger.info(f"[AI] Succès avec : {provider_name}")
            return result
        except Exception as e:
            logger.warning(f"[AI] {provider_name} a échoué : {e}")
            last_error = e

    raise Exception(
        f"Tous les providers IA ont échoué. Dernière erreur : {last_error}"
    )
