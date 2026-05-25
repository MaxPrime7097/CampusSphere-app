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
# Prompts V2 — Annales (Smart)
# ---------------------------------------------------------------------------

_ANNALE_SMART_BASE = SPHERA_PERSONA + (
    "You are correcting a university exam. Follow these two steps:\n"
    "\n"
    "STEP 1 — IDENTIFY THE STRUCTURE: Read the exam and identify all sections and questions.\n"
    "STEP 2 — CORRECT EACH QUESTION: For every question identified, provide the full correction.\n"
    "\n"
    "IMPORTANT RULES:\n"
    "- Respect the original numbering (e.g. Section A Q1, Q2.a, Q2.b...).\n"
    "- Detect the type of each question and set the 'type' field accordingly:\n"
    "    'qcm'    → multiple choice: give the correct letter + short justification\n"
    "    'code'   → programming: provide working code + explanation\n"
    "    'preuve' → mathematical proof: demonstrate step by step\n"
    "    'ouvert' → open-ended: complete structured answer\n"
    "- If a question requires a diagram, describe it textually.\n"
    "- For 'code' answers: put ONLY the raw code in 'reponse', explanation in 'explication'.\n"
    "- No text before or after the JSON. JSON KEYS stay in French, VALUES in the SOURCE TEXT LANGUAGE.\n"
    "{mode_instruction}\n"
    "\n"
    "Strict JSON format:\n"
    "{{\n"
    '  "titre": "Exam Title",\n'
    '  "sections": [\n'
    "    {{\n"
    '      "nom": "Section name (e.g. Section A, Exercice 1, Partie I)",\n'
    '      "questions": [\n'
    "        {{\n"
    '          "numero": "1",\n'
    '          "enonce": "The question as written in the exam",\n'
    '          "reponse": "Complete and correct answer",\n'
    '          "explication": "Detailed explanation of the reasoning",\n'
    '          "type": "qcm|ouvert|code|preuve"\n'
    "        }}\n"
    "      ]\n"
    "    }}\n"
    "  ],\n"
    '  "conseils_generaux": ["general advice 1", "general advice 2"]\n'
    "}}\n\n"
    "Exam:\n{text}"
)

_ANNALE_SMART_AVEC_COURS_BASE = SPHERA_PERSONA + (
    "You are correcting a university exam using the provided course as reference. Follow these two steps:\n"
    "\n"
    "STEP 1 — IDENTIFY THE STRUCTURE: Read the exam and identify all sections and questions.\n"
    "STEP 2 — CORRECT EACH QUESTION: For every question, provide the full correction and cite the course reference.\n"
    "\n"
    "IMPORTANT RULES:\n"
    "- Respect the original numbering.\n"
    "- Detect the type of each question:\n"
    "    'qcm'    → give the correct letter + short justification\n"
    "    'code'   → provide working code (in 'reponse') + explanation (in 'explication')\n"
    "    'preuve' → demonstrate step by step\n"
    "    'ouvert' → complete structured answer\n"
    "- Add 'source_cours' citing the exact chapter/section from the course.\n"
    "- No text before or after the JSON. JSON KEYS stay in French, VALUES in the SOURCE TEXT LANGUAGE.\n"
    "{mode_instruction}\n"
    "\n"
    "Strict JSON format:\n"
    "{{\n"
    '  "titre": "Exam Title",\n'
    '  "sections": [\n'
    "    {{\n"
    '      "nom": "Section name",\n'
    '      "questions": [\n'
    "        {{\n"
    '          "numero": "1",\n'
    '          "enonce": "The question as written in the exam",\n'
    '          "reponse": "Complete and correct answer",\n'
    '          "explication": "Detailed explanation",\n'
    '          "source_cours": "Chapter/section reference from course",\n'
    '          "type": "qcm|ouvert|code|preuve"\n'
    "        }}\n"
    "      ]\n"
    "    }}\n"
    "  ],\n"
    '  "conseils_generaux": ["advice 1"]\n'
    "}}\n\n"
    "Course:\n{cours_text}\n\n"
    "Exam:\n{annale_text}"
)

_MODE_COMPLET = "Be thorough and detailed in every answer."
_MODE_RAPIDE = "Be concise — direct answers only, no long explanations."

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

def _call_claude(prompt: str, max_tokens: int = 3000) -> str:
    api_key = getattr(settings, "ANTHROPIC_API_KEY", None)
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY non configurée")
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


def _call_gemini(prompt: str, model_name: str = "gemini-2.5-flash") -> str:
    api_key = getattr(settings, "GEMINI_API_KEY", None)
    if not api_key:
        raise ValueError("GEMINI_API_KEY non configurée")
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return response.text


def _call_groq(prompt: str, max_tokens: int = 3000) -> str:
    api_key = getattr(settings, "GROQ_API_KEY", None)
    if not api_key:
        raise ValueError("GROQ_API_KEY non configurée")
    from groq import Groq
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


# Providers par défaut (V1 — fiches/quiz/flashcards)
PROVIDERS = [
    ("claude", lambda p: _call_claude(p, max_tokens=3000)),
    ("gemini-2.5-flash", lambda p: _call_gemini(p, "gemini-2.5-flash")),
    ("gemini-pro", lambda p: _call_gemini(p, "gemini-pro")),
    ("groq", lambda p: _call_groq(p, max_tokens=3000)),
]

# Providers pour les annales (JSON beaucoup plus volumineux)
PROVIDERS_ANNALE = [
    ("claude", lambda p: _call_claude(p, max_tokens=8000)),
    ("gemini-2.5-flash", lambda p: _call_gemini(p, "gemini-2.5-flash")),
    ("gemini-pro", lambda p: _call_gemini(p, "gemini-pro")),
    ("groq", lambda p: _call_groq(p, max_tokens=6000)),
]


def _call_with_fallback(prompt: str, providers=None) -> str:
    """Appelle les providers dans l'ordre, retourne le texte brut du premier qui réussit."""
    if providers is None:
        providers = PROVIDERS
    last_error = None
    for name, fn in providers:
        try:
            logger.info(f"[Sphera AI] Tentative avec : {name}")
            result = fn(prompt)
            logger.info(f"[Sphera AI] Succès avec : {name}")
            return result
        except Exception as e:
            logger.warning(f"[Sphera AI] {name} a échoué : {e}")
            last_error = e
    raise Exception(f"Tous les providers IA ont échoué. Dernière erreur : {last_error}")


def _repair_truncated_json(raw: str) -> str:
    """
    Tente de réparer un JSON tronqué en complétant les accolades/crochets manquants.
    Stratégie : trouver le dernier objet complet avant la troncature.
    """
    # Trouver le dernier } ou ] complet
    # On cherche la dernière position valide en remontant
    for end in range(len(raw), 0, -1):
        candidate = raw[:end].rstrip()
        if candidate and candidate[-1] in ('}', ']', '"'):
            # Compter les ouvertures/fermetures
            opens = candidate.count('{') - candidate.count('}')
            opens_arr = candidate.count('[') - candidate.count(']')
            if opens >= 0 and opens_arr >= 0:
                # Fermer proprement
                repaired = candidate
                # Fermer les tableaux/objets ouverts
                repaired += ']' * opens_arr + '}' * opens
                try:
                    json.loads(repaired)
                    return repaired
                except json.JSONDecodeError:
                    pass
    return raw


def _parse_json_with_fallback(raw: str) -> dict:
    """Parse JSON avec plusieurs stratégies de récupération."""
    # Tentative 1 : parsing direct
    try:
        return clean_json(raw)
    except json.JSONDecodeError:
        pass

    logger.warning("[Sphera AI] JSON mal formé, tentative de re-parsing...")

    # Tentative 2 : extraire le bloc { ... } principal
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(raw[start:end])
        except json.JSONDecodeError:
            pass

    # Tentative 3 : réparer le JSON tronqué
    logger.warning("[Sphera AI] Tentative de réparation du JSON tronqué...")
    if start != -1:
        try:
            repaired = _repair_truncated_json(raw[start:])
            return json.loads(repaired)
        except json.JSONDecodeError as e:
            logger.error(f"[Sphera AI] Impossible de réparer le JSON : {e}")

    raise json.JSONDecodeError("JSON irrécupérable", raw, 0)


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
    Corrige une annale selon le mode choisi avec le prompt intelligent (structure-first).

    Args:
        annale_text: Texte extrait de l'épreuve.
        mode: "complete" ou "rapide".
        cours_text: Texte du cours (optionnel, pour le mode croisé).

    Returns:
        dict: JSON structuré avec sections/questions typées.
    """
    if not annale_text or len(annale_text) < 50:
        raise ValueError("Le texte de l'annale est trop court.")

    mode_instruction = _MODE_RAPIDE if mode == "rapide" else _MODE_COMPLET

    if cours_text and len(cours_text) >= 50:
        # Mode croisé : annale + cours
        prompt = _ANNALE_SMART_AVEC_COURS_BASE.format(
            mode_instruction=mode_instruction,
            cours_text=cours_text,
            annale_text=annale_text,
        )
    else:
        prompt = _ANNALE_SMART_BASE.format(
            mode_instruction=mode_instruction,
            text=annale_text,
        )

    raw = _call_with_fallback(prompt, providers=PROVIDERS_ANNALE)
    return _parse_json_with_fallback(raw)
