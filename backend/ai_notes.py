import google.generativeai as genai

model = genai.GenerativeModel(
    "gemini-2.5-flash"
)

def generate_notes(topic):

    prompt = f"""
Create detailed study notes on:

{topic}

Requirements:

- Easy language
- Important definitions
- Key concepts
- Formulas (if applicable)
- Examples
- Exam tips
- Summary at the end

Format properly using headings.
"""

    response = model.generate_content(prompt)

    return response.text