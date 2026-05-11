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

FICHE_PROMPT = """Tu es un assistant pédagogique pour étudiants universitaires africains.
Depuis ce cours, génère une fiche de révision structurée en JSON uniquement.
Aucun texte avant ou après le JSON.

Format JSON strict :
{{
  "titre": "Titre du cours",
  "resume": "Paragraphe structuré et complet résumant les grandes idées du cours, le contexte, les enjeux et les conclusions principales. Minimum 6-8 phrases.",
  "points_cles": ["point 1", "point 2", "point 3"],
  "definitions": [{{"terme": "...", "definition": "..."}}],
  "formules": ["formule 1"],
  "a_retenir": ["conseil de révision 1"]
}}

Cours :
{text}"""

QUIZ_PROMPT = """Tu es un assistant pédagogique pour étudiants universitaires africains.
Depuis ce cours, génère 10 questions QCM en JSON uniquement.
Aucun texte avant ou après le JSON.

Format JSON strict :
{{
  "titre": "Quiz - Titre du cours",
  "questions": [
    {{
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "bonne_reponse": "A",
      "explication": "Explication détaillée de la bonne réponse"
    }}
  ]
}}

Cours :
{text}"""

FLASHCARDS_PROMPT = """Tu es un assistant pédagogique pour étudiants universitaires africains.
Depuis ce cours, génère 10 flashcards recto/verso en JSON uniquement.
Aucun texte avant ou après le JSON.

Format JSON strict :
{{
  "titre": "Flashcards - Titre du cours",
  "cartes": [
    {{
      "recto": "Question ou terme",
      "verso": "Réponse ou définition complète"
    }}
  ]
}}

Cours :
{text}"""

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
# Extraction PDF
# ---------------------------------------------------------------------------

def extract_text_from_pdf(file_path: str, max_chars: int = 12000) -> str:
    """Extrait le texte d'un PDF via PyMuPDF. Tronque à max_chars."""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise ImportError(
            "PyMuPDF n'est pas installé. Exécutez : pip install pymupdf"
        )

    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
            if len(text) >= max_chars:
                break
        doc.close()
    except Exception as e:
        raise ValueError(f"Impossible de lire le PDF : {e}")

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
            "Ce PDF ne contient pas de texte extractible. "
            "Essaie avec un PDF numérique (non scanné)."
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
