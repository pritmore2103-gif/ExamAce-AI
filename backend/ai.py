from dotenv import load_dotenv
import os
import json
import re

from google import genai


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured in the backend .env file."
    )


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(
    api_key=api_key
)

MODEL_NAME = "gemini-2.5-flash"


# ============================================================
# TOKEN USAGE HELPER
# ============================================================

def get_token_usage(response):
    """
    Extract Gemini token usage from the response.

    Returns:
        input_tokens
        output_tokens
    """

    input_tokens = 0
    output_tokens = 0

    usage = getattr(response, "usage_metadata", None)

    if usage:

        input_tokens = (
            getattr(
                usage,
                "prompt_token_count",
                0
            )
            or 0
        )

        output_tokens = (
            getattr(
                usage,
                "candidates_token_count",
                0
            )
            or 0
        )

    return (
        int(input_tokens),
        int(output_tokens)
    )


# ============================================================
# MCQ GENERATOR
# ============================================================

def generate_mcqs(
    topic,
    difficulty,
    count,
    subject="General",
    exam="General"
):

    prompt = f"""
You are an expert exam-question generator for ExamAce AI.

Generate exactly {count} high-quality multiple-choice questions.

EXAM:
{exam}

SUBJECT:
{subject}

TOPIC:
{topic}

DIFFICULTY:
{difficulty}

IMPORTANT REQUIREMENTS:

1. Generate exactly {count} questions.
2. Every question must have exactly 4 options.
3. Options must be labeled A, B, C and D.
4. There must be exactly ONE correct answer.
5. The correct answer must be one of: A, B, C or D.
6. Do not reveal the answer inside the question.
7. Make incorrect options plausible and educational.
8. Avoid duplicate questions.
9. Avoid ambiguous questions.
10. Keep questions relevant to the specified topic.
11. Match the requested difficulty.
12. Make factual and mathematical information accurate.
13. For numerical questions, verify the calculation.
14. Provide a clear explanation for every answer.
15. Do not include markdown.
16. Do not include ```json.
17. Return ONLY valid JSON.

RETURN EXACTLY THIS STRUCTURE:

{{
  "questions": [
    {{
      "question": "Question text",
      "options": {{
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      }},
      "answer": "A",
      "explanation": "Clear explanation of why the answer is correct."
    }}
  ]
}}
"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )

    # --------------------------------------------------------
    # GET TOKEN USAGE
    # --------------------------------------------------------

    input_tokens, output_tokens = get_token_usage(
        response
    )

    # --------------------------------------------------------
    # GET RESPONSE TEXT
    # --------------------------------------------------------

    text = response.text.strip()

    # --------------------------------------------------------
    # REMOVE ACCIDENTAL MARKDOWN CODE FENCES
    # --------------------------------------------------------

    text = re.sub(
        r"^```json\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"^```\s*",
        "",
        text
    )

    text = re.sub(
        r"\s*```$",
        "",
        text
    )

    text = text.strip()

    # --------------------------------------------------------
    # PARSE JSON
    # --------------------------------------------------------

    try:

        data = json.loads(text)

    except json.JSONDecodeError as error:

        print("MCQ JSON parsing error:")
        print(error)

        print("\nGemini response:")
        print(text)

        raise ValueError(
            "AI returned invalid MCQ data."
        )

    # --------------------------------------------------------
    # VALIDATE STRUCTURE
    # --------------------------------------------------------

    if not isinstance(data, dict):

        raise ValueError(
            "AI response must be a JSON object."
        )

    questions = data.get("questions")

    if not isinstance(questions, list):

        raise ValueError(
            "AI response does not contain a valid questions list."
        )

    if len(questions) != count:

        raise ValueError(
            f"AI returned {len(questions)} questions "
            f"instead of {count}."
        )

    validated_questions = []

    # --------------------------------------------------------
    # VALIDATE EVERY QUESTION
    # --------------------------------------------------------

    for index, question in enumerate(questions):

        if not isinstance(question, dict):

            raise ValueError(
                f"Question {index + 1} has invalid format."
            )

        question_text = question.get(
            "question"
        )

        options = question.get(
            "options"
        )

        answer = question.get(
            "answer"
        )

        explanation = question.get(
            "explanation"
        )

        if not question_text:

            raise ValueError(
                f"Question {index + 1} is missing question text."
            )

        if not isinstance(options, dict):

            raise ValueError(
                f"Question {index + 1} has invalid options."
            )

        required_options = [
            "A",
            "B",
            "C",
            "D"
        ]

        # ----------------------------------------------------
        # VALIDATE OPTIONS
        # ----------------------------------------------------

        for option in required_options:

            if option not in options:

                raise ValueError(
                    f"Question {index + 1} "
                    f"is missing option {option}."
                )

            if not options[option]:

                raise ValueError(
                    f"Question {index + 1} "
                    f"has an empty option {option}."
                )

        # ----------------------------------------------------
        # VALIDATE ANSWER
        # ----------------------------------------------------

        if answer not in required_options:

            raise ValueError(
                f"Question {index + 1} "
                f"has invalid correct answer."
            )

        # ----------------------------------------------------
        # DEFAULT EXPLANATION
        # ----------------------------------------------------

        if not explanation:

            explanation = (
                f"The correct answer is {answer}."
            )

        # ----------------------------------------------------
        # STORE CLEAN QUESTION
        # ----------------------------------------------------

        validated_questions.append({

            "question":
                str(question_text).strip(),

            "options": {

                "A":
                    str(options["A"]).strip(),

                "B":
                    str(options["B"]).strip(),

                "C":
                    str(options["C"]).strip(),

                "D":
                    str(options["D"]).strip(),

            },

            "answer":
                answer,

            "explanation":
                str(explanation).strip(),

        })

    # --------------------------------------------------------
    # RETURN DATA + TOKEN USAGE
    # --------------------------------------------------------

    return (
        {
            "questions": validated_questions
        },
        input_tokens,
        output_tokens
    )


# ============================================================
# AI STUDY PLAN
# ============================================================

def generate_study_plan(
    exam,
    today,
    exam_date,
    days_remaining,
    hours_per_day,
    subjects
):

    prompt = f"""
You are an expert academic study planner for ExamAce AI.

Create a personalized study plan for a student preparing for:

TARGET EXAM:
{exam}

CURRENT DATE:
{today}

EXAM DATE:
{exam_date}

DAYS REMAINING:
{days_remaining}

AVAILABLE STUDY HOURS PER DAY:
{hours_per_day}

SUBJECTS:
{subjects}


============================================================
IMPORTANT MATHEMATICAL FORMATTING RULES
============================================================

This is extremely important.

Whenever you write mathematics, ALWAYS use LaTeX.

Use inline LaTeX like:

$\\theta$

$\\lambda$

$\\alpha$

$\\beta$

$\\pi$

$x^2$

$x_1$

$\\sqrt{{x}}$

$\\frac{{a}}{{b}}$

$\\sin\\theta$

$\\cos\\theta$

$\\tan\\theta$

$\\sin^2\\theta$

$\\cos^2\\theta$

$\\tan^2\\theta$

$\\sin(\\theta)$

$\\cos(\\theta)$

$\\tan(\\theta)$

$\\log x$

$\\ln x$

$\\leq$

$\\geq$

$\\neq$

$\\rightarrow$

For longer equations use:

$$equation$$

Examples:

WRONG:
sin2theta + cos2theta = 1

WRONG:
sin²θ + cos²θ = 1

WRONG:
theta = 30

WRONG:
lambda/2

CORRECT:
$\\sin^2\\theta + \\cos^2\\theta = 1$

CORRECT:
$\\theta = 30^\\circ$

CORRECT:
$\\lambda/2$

CORRECT:
$\\sin(2\\theta)$

Do NOT write mathematical expressions using plain text when LaTeX can be used.

Use LaTeX for:
- trigonometry
- algebra
- calculus
- geometry
- physics equations
- chemistry equations containing mathematical notation
- symbols such as theta, lambda, alpha, beta, pi
- powers and indices
- fractions
- square roots
- inequalities


============================================================
STUDY PLAN REQUIREMENTS
============================================================

1. Return ONLY valid JSON.
2. Do not use markdown.
3. Do not use ```json.
4. Do not write anything before or after the JSON.
5. Create a plan for the entire preparation period.
6. Never exceed {hours_per_day} total study hours on any day.
7. Give more time to weak subjects.
8. Include concept learning.
9. Include practice questions/MCQs.
10. Include revision.
11. Include mock tests where appropriate.
12. Increase revision and testing near the exam.
13. Use actual dates.
14. Start from {today}.
15. Continue until {exam_date}.
16. Keep the workload realistic.
17. The sum of task hours for every day must not exceed {hours_per_day}.
18. Do not invent impossible schedules.
19. Keep topic names concise.
20. Make every mathematical topic use proper LaTeX notation.
21. Use correct mathematical terminology.


============================================================
JSON STRUCTURE
============================================================

{{
  "overview": "Short explanation of the strategy using LaTeX where necessary.",

  "phases": [
    {{
      "name": "Phase name",
      "start_day": 1,
      "end_day": 30,
      "goal": "Main goal of this phase. Use LaTeX for mathematical expressions."
    }}
  ],

  "daily_plan": [
    {{
      "day": 1,
      "date": "YYYY-MM-DD",

      "tasks": [
        {{
          "subject": "Mathematics",
          "topic": "Trigonometric identities: $\\\\sin^2\\\\theta + \\\\cos^2\\\\theta = 1$",
          "activity": "Concept Learning",
          "hours": 1.5
        }}
      ]
    }}
  ]
}}
"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
    )

    # --------------------------------------------------------
    # TOKEN USAGE
    # --------------------------------------------------------

    input_tokens, output_tokens = get_token_usage(response)

    # --------------------------------------------------------
    # RESPONSE TEXT
    # --------------------------------------------------------

    text = response.text.strip()

    # --------------------------------------------------------
    # REMOVE CODE FENCES IF GEMINI ADDS THEM
    # --------------------------------------------------------

    text = re.sub(
        r"^```json\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"^```\s*",
        "",
        text
    )

    text = re.sub(
        r"\s*```$",
        "",
        text
    )

    text = text.strip()

    # --------------------------------------------------------
    # PARSE + VALIDATE JSON
    # --------------------------------------------------------

    try:

        plan = json.loads(text)

    except json.JSONDecodeError as error:

        print("Study plan JSON parsing error:")
        print(error)

        print("\nGemini response:")
        print(text)

        raise ValueError(
            "AI returned invalid study plan data."
        )

    if not isinstance(plan, dict):

        raise ValueError(
            "AI study plan must be a JSON object."
        )

    if not isinstance(plan.get("phases"), list):

        plan["phases"] = []

    if not isinstance(plan.get("daily_plan"), list):

        plan["daily_plan"] = []

    # --------------------------------------------------------
    # BASIC PLAN VALIDATION
    # --------------------------------------------------------

    for day in plan["daily_plan"]:

        if not isinstance(day, dict):
            continue

        if not isinstance(day.get("tasks"), list):
            day["tasks"] = []

        total_hours = 0

        for task in day["tasks"]:

            if not isinstance(task, dict):
                continue

            try:
                task_hours = float(task.get("hours", 0))
            except (TypeError, ValueError):
                task_hours = 0

            task["hours"] = task_hours
            total_hours += task_hours

        # Never allow AI to exceed the requested daily hours.
        if total_hours > float(hours_per_day):

            print(
                f"Warning: Day {day.get('day')} "
                f"contains {total_hours} hours, "
                f"limit is {hours_per_day}."
            )

    # --------------------------------------------------------
    # RETURN JSON STRING + TOKEN USAGE
    # --------------------------------------------------------

    return (
        json.dumps(plan, ensure_ascii=False),
        input_tokens,
        output_tokens
    )
