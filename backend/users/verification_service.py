import google.generativeai as genai
import json
import logging
from django.conf import settings
from PIL import Image
import io

logger = logging.getLogger(__name__)

def analyze_student_card(image_file, user_full_name, user_university):
    """
    Analyses a student card image using Gemini AI, with Groq Llama 3.2 Vision as fallback.
    """
    # 1. Try Gemini first
    gemini_key = getattr(settings, "GEMINI_API_KEY", None)
    if gemini_key:
        try:
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            img = Image.open(image_file)
            
            prompt = f"""
            Analyze this image and determine if it is a valid student identity card.
            Compare the information on the card with:
            - Name: {user_full_name}
            - University: {user_university}

            Return a JSON object with:
            - "is_student_card": boolean
            - "name_matches": boolean (high confidence match with {user_full_name})
            - "university_matches": boolean (match with {user_university})
            - "confidence_score": number (0-1)
            - "extracted_name": string
            - "extracted_university": string
            
            Only return the JSON.
            """
            response = model.generate_content([prompt, img])
            text_response = response.text.strip()
            if "```json" in text_response:
                text_response = text_response.split("```json")[1].split("```")[0].strip()
            elif "```" in text_response:
                text_response = text_response.split("```")[1].split("```")[0].strip()
            
            result = json.loads(text_response)
            if result.get("is_student_card") and result.get("name_matches") and result.get("confidence_score", 0) > 0.7:
                return {"verified": True, "data": result, "provider": "gemini"}
        except Exception as e:
            logger.warning(f"Gemini analysis failed, trying Groq fallback: {e}")

    # 2. Try Groq Llama 3.2 Vision Fallback
    groq_key = getattr(settings, "GROQ_API_KEY", None)
    if groq_key:
        try:
            import base64
            from groq import Groq
            
            client = Groq(api_key=groq_key)
            
            # Reset image pointer and read
            image_file.seek(0)
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            
            prompt = f"Is this a student card for {user_full_name} at {user_university}? Return JSON: {{\"is_student_card\": bool, \"name_matches\": bool, \"confidence\": float}}"
            
            completion = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                },
                            },
                        ],
                    }
                ],
                response_format={"type": "json_object"}
            )
            
            result = json.loads(completion.choices[0].message.content)
            if result.get("is_student_card") and result.get("name_matches") and result.get("confidence", 0) > 0.7:
                return {"verified": True, "data": result, "provider": "groq"}
                
        except Exception as e:
            logger.error(f"Groq analysis also failed: {e}")

    return {"verified": False, "reason": "All AI providers failed or mismatch"}
