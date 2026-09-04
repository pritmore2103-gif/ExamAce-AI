import os

from dotenv import load_dotenv
from google import genai


load_dotenv()


api_key = os.getenv(
    "GEMINI_API_KEY"
)

if not api_key:
    raise RuntimeError(
        "GEMINI_API_KEY is missing."
    )


client = genai.Client(
    api_key=api_key
)


MODEL_NAME = "gemini-2.5-flash"


# ============================================================
# GENERATE NOTES
# ============================================================

def generate_notes(topic):

    prompt = f"""
Create detailed study notes on:

{topic}

Requirements:

- Easy language
- Important definitions
- Key concepts
- Formulas if applicable
- Examples
- Exam tips
- Summary at the end

Format properly using headings.
"""


    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )


    usage = getattr(
        response,
        "usage_metadata",
        None
    )


    input_tokens = 0
    output_tokens = 0


    if usage:

        input_tokens = getattr(
            usage,
            "prompt_token_count",
            0
        ) or 0

        output_tokens = getattr(
            usage,
            "candidates_token_count",
            0
        ) or 0


    return (
        response.text,
        input_tokens,
        output_tokens
    )
