"""
Service IA pour Sphera — V1 (Fiche, Quiz, Flashcards) + V2 (Q&A, Annales).

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
# Persona Sphera
# ---------------------------------------------------------------------------

SPHERA_PERSONA = (
    "You are Sphera, the academic assistant for CampusSphere. "
    "You are intelligent, warm, and direct. "
    "Speak to students like a brilliant older sister who genuinely wants them to succeed. "
    "CRITICAL RULE: YOU MUST DETECT THE LANGUAGE OF THE SOURCE TEXT AND GENERATE ALL YOUR RESPONSES (except JSON keys) IN THAT EXACT SAME LANGUAGE. "
    "If the source text is in English, reply in English. "
    "If it is in French, reply in French. If it is in Spanish, reply in Spanish, etc.\n\n"
)

# ---------------------------------------------------------------------------
# Prompts V1 — Fiche, Quiz, Flashcards
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Prompts V2 — Q&A
# ---------------------------------------------------------------------------

QA_PROMPT = SPHERA_PERSONA + (
    "You are a tutor based ONLY on the provided university course.\n"
    "Answer the question using ONLY the content of the provided course.\n"
    "If the answer is not in the course, say exactly:\n"
    "\"Cette information ne se trouve pas dans ton cours.\"\n"
    "Be clear, precise, and pedagogical.\n\n"
    "Course:\n{text}\n\n"
    "Question: {question}"
)

# ---------------------------------------------------------------------------
# Prompts V2 — Annales
# ---------------------------------------------------------------------------

ANNALE_COMPLETE_PROMPT = SPHERA_PERSONA + (
    "Correct this exam in a complete and structured manner in JSON only.\n"
    "No text before or after the JSON. The JSON KEYS must remain in French, but the VALUES must be written in the SAME LANGUAGE as the source text.\n\n"
    "Strict JSON format:\n"
    "{{\n"
    '  "titre": "Exam Title",\n'
    '  "corrections": [\n'
    "    {{\n"
    '      "question": "Question text",\n'
    '      "reponse": "Complete and correct answer",\n'
    '      "explication": "Detailed explanation of the reasoning",\n'
    '      "chapitre": "Chapter or concept involved",\n'
    '      "a_retenir": "Key point to memorize for the exam"\n'
    "    }}\n"
    "  ],\n"
    '  "conseils_generaux": ["advice 1", "advice 2"]\n'
    "}}\n\n"
    "Exam:\n{text}"
)

ANNALE_RAPIDE_PROMPT = SPHERA_PERSONA + (
    "Correct this exam in a concise manner in JSON only.\n"
    "No text before or after the JSON. The JSON KEYS must remain in French, but the VALUES must be written in the SAME LANGUAGE as the source text.\n"
    "No long explanations — direct answers only.\n\n"
    "Strict JSON format:\n"
    "{{\n"
    '  "titre": "Exam Title",\n'
    '  "corrections": [\n'
    "    {{\n"
    '      "question": "Question text",\n'
    '      "reponse": "Direct and concise answer"\n'
    "    }}\n"
    "  ]\n"
    "}}\n\n"
    "Exam:\n{text}"
)

ANNALE_AVEC_COURS_PROMPT = SPHERA_PERSONA + (
    "Correct this exam based on the provided course text.\n"
    "No text before or after the JSON. The JSON KEYS must remain in French, but the VALUES must be written in the SAME LANGUAGE as the source text.\n"
    "For each answer, cite the chapter or section of the course involved.\n\n"
    "Strict JSON format:\n"
    "{{\n"
    '  "titre": "Exam Title",\n'
    '  "corrections": [\n'
    "    {{\n"
    '      "question": "Question text",\n'
    '      "reponse": "Complete and correct answer",\n'
    '      "explication": "Detailed explanation of the reasoning",\n'
    '      "chapitre": "Chapter or concept involved",\n'
    '      "a_retenir": "Key point to memorize for the exam",\n'
    '      "source_cours": "Exact reference in the course (e.g. Chapter 3, Section 2.1)"\n'
    "    }}\n"
    "  ],\n"
    '  "conseils_generaux": ["advice 1", "advice 2"]\n'
    "}}\n\n"
    "Course:\n{cours_text}\n\n"
    "Exam:\n{annale_text}"
)

# ---------------------------------------------------------------------------
# Mapping prompts V1
# ---------------------------------------------------------------------------

_PROMPTS_V1 = {
    "fiche": FICHE_PROMPT,
    "quiz": QUIZ_PROMPT,
    "flashcards": FLASHCARDS_PROMPT,
}


def get_prompt(tool_type: str, text: str) -> str:
    template = _PROMPTS_V1.get(tool_type)
    if not template:
        raise ValueError(f"Type d'outil inconnu : {tool_type}")
    return template.format(text=text)


# ---------------------------------------------------------------------------
# Extraction de texte
# ---------------------------------------------------------------------------

def extract_text_from_file(file_path: str, max_chars: int = 12000) -> str:
    """Extrait le texte d'un PDF, DOCX ou TXT. Tronque à max_chars."""
    ext = os.path.splitext(file_path)[1].lower()
    text = ""

    if ext == ".pdf":
        try:
            import fitz  # PyMuPDF
        except ImportError:
            raise ImportError("PyMuPDF n'est pas installé. Exécutez : pip install pymupdf")
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
            raise ImportError("python-docx n'est pas installé. Exécutez : pip install python-docx")
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
    if raw.startswith("```"):
        lines = raw.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw = "\n".join(lines).strip()
    return json.loads(raw)


# ---------------------------------------------------------------------------
# Providers IA
# ---------------------------------------------------------------------------

def _call_claude(prompt: str) -> str:
    api_key = getattr(settings, "ANTHROPIC_API_KEY", None)
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY non configurée")
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


def _call_gemini(prompt: str) -> str:
    api_key = getattr(settings, "GEMINI_API_KEY", None)
    if not api_key:
        raise ValueError("GEMINI_API_KEY non configurée")
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content(prompt)
    return response.text


def _call_groq(prompt: str) -> str:
    api_key = getattr(settings, "GROQ_API_KEY", None)
    if not api_key:
        raise ValueError("GROQ_API_KEY non configurée")
    from groq import Groq
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


PROVIDERS = [
    ("claude", _call_claude),
    ("gemini", _call_gemini),
    ("groq", _call_groq),
]


def _call_with_fallback(prompt: str) -> str:
    """Appelle les providers dans l'ordre, retourne le texte brut du premier qui réussit."""
    last_error = None
    for name, fn in PROVIDERS:
        try:
            logger.info(f"[Sphera AI] Tentative avec : {name}")
            result = fn(prompt)
            logger.info(f"[Sphera AI] Succès avec : {name}")
            return result
        except Exception as e:
            logger.warning(f"[Sphera AI] {name} a échoué : {e}")
            last_error = e
    raise Exception(f"Tous les providers IA ont échoué. Dernière erreur : {last_error}")


def _parse_json_with_fallback(raw: str) -> dict:
    """Parse JSON, avec fallback pour trouver le bloc entre { }."""
    try:
        return clean_json(raw)
    except json.JSONDecodeError:
        logger.warning("[Sphera AI] JSON mal formé, tentative de re-parsing...")
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])
        raise


# ---------------------------------------------------------------------------
# Fonctions publiques V1
# ---------------------------------------------------------------------------

def generate_with_fallback(text: str, tool_type: str) -> dict:
    """
    Génère un outil V1 (fiche/quiz/flashcards) avec fallback entre providers.
    Lève une exception si tous les providers échouent.
    """
    if not text or len(text) < 50:
        raise ValueError(
            "Le texte extrait est trop court. "
            "Ce document ne contient pas de texte extractible. "
            "Essaie avec un document numérique contenant du vrai texte."
        )
    prompt = get_prompt(tool_type, text)
    raw = _call_with_fallback(prompt)
    return _parse_json_with_fallback(raw)


# ---------------------------------------------------------------------------
# Fonctions publiques V2 — Q&A
# ---------------------------------------------------------------------------

def generate_qa_answer(cours_text: str, question: str) -> str:
    """
    Répond à une question basée exclusivement sur le contenu du cours.
    Retourne du texte pur (pas JSON).
    """
    if not cours_text or len(cours_text) < 50:
        raise ValueError("Le texte du cours est trop court pour répondre à des questions.")
    prompt = QA_PROMPT.format(text=cours_text, question=question)
    return _call_with_fallback(prompt).strip()


# ---------------------------------------------------------------------------
# Fonctions publiques V2 — Annales
# ---------------------------------------------------------------------------

def generate_annale(annale_text: str, mode: str, cours_text: str = None) -> dict:
    """
    Corrige une annale selon le mode choisi.

    Args:
        annale_text: Texte extrait de l'épreuve.
        mode: "complete" ou "rapide".
        cours_text: Texte du cours (optionnel, pour le mode croisé).

    Returns:
        dict: JSON de correction structuré.
    """
    if not annale_text or len(annale_text) < 50:
        raise ValueError("Le texte de l'annale est trop court.")

    if cours_text and len(cours_text) >= 50:
        # Mode croisé : annale + cours
        prompt = ANNALE_AVEC_COURS_PROMPT.format(
            cours_text=cours_text,
            annale_text=annale_text,
        )
    elif mode == "rapide":
        prompt = ANNALE_RAPIDE_PROMPT.format(text=annale_text)
    else:
        # Mode complet par défaut
        prompt = ANNALE_COMPLETE_PROMPT.format(text=annale_text)

    raw = _call_with_fallback(prompt)
    return _parse_json_with_fallback(raw)
