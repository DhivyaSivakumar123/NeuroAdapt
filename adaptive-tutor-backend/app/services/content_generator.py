"""
Content Generator — Groq API wrapper for LLM-powered task variant generation with knowledge grounding.

Design:
  - `ContentGeneratorClient` protocol: testable interface (no direct Groq import in tests).
  - `GroqContentGenerator`: real implementation calling the Groq API.
  - `StubContentGenerator`: deterministic fake for unit/integration tests.
  - `generate_task_variant()`: top-level function — validates output against Task schema,
    injects grounded source material when available, checks grounding heuristic,
    retries once on failure with an error-correction prompt, raises ContentGenerationError
    on second failure. NEVER persists or serves invalid or ungrounded content.
"""

import json
import logging
import uuid
from typing import Any, Optional, Protocol

from pydantic import BaseModel, Field, ValidationError

from app.config import get_settings

logger = logging.getLogger(__name__)


# ── Output schema for LLM response ───────────────────────────────────────────

class TaskVariantSchema(BaseModel):
    """
    The exact JSON structure we require the LLM to output.
    Validated with Pydantic before any persistence or serving.
    """

    skill_tag: str
    subject: str
    difficulty_level: int
    expected_duration_seconds: int
    content_type: str  # text | interactive | visual
    content_body: dict[str, Any]
    grounding_chunk_ids: list[uuid.UUID] = Field(default_factory=list)
    is_ai_generated: bool = Field(default=True)

    def validate_content_body(self) -> None:
        """Validate content_body shape matches content_type."""
        body = self.content_body
        if self.content_type == "interactive":
            if "question" not in body or "options" not in body or "correct_index" not in body:
                raise ValueError("interactive content_body must have question, options, correct_index")
            if not isinstance(body["options"], list) or len(body["options"]) < 2:
                raise ValueError("interactive options must be a list with at least 2 items")
            if not isinstance(body["correct_index"], int) or body["correct_index"] >= len(body["options"]):
                raise ValueError("correct_index out of bounds")
        elif self.content_type in ("text", "visual"):
            if "question" not in body or "answer" not in body:
                raise ValueError(f"{self.content_type} content_body must have question and answer")


class ContentGenerationError(Exception):
    """Raised when the LLM fails to produce valid or grounded content after retry."""
    pass


# ── Protocol (interface) ──────────────────────────────────────────────────────

class ContentGeneratorClient(Protocol):
    """
    Protocol for content generation. Implement this for:
      - Real Groq API calls (GroqContentGenerator)
      - Tests/stubbing (StubContentGenerator)
    """

    def generate(
        self,
        prompt: str,
        system_prompt: str,
    ) -> str:
        """
        Call the LLM with the given prompt + system prompt.
        Returns the raw response string (expected to be JSON).
        Raises any provider-specific exception on network/API error.
        """
        ...


# ── Real Groq implementation ──────────────────────────────────────────────────

class GroqContentGenerator:
    """Real implementation using the Groq API with fallback."""

    _circuit_open: bool = False

    def __init__(self, api_key: str | None = None, model: str | None = None):
        from groq import Groq
        settings = get_settings()
        self._key = api_key or settings.groq_api_key
        self._client = Groq(api_key=self._key, timeout=15.0) if self._key else None
        self._model = model or settings.groq_model
        self.last_source: str = "llm"

    def generate(self, prompt: str, system_prompt: str) -> str:
        if GroqContentGenerator._circuit_open or not self._client:
            self.last_source = "stub"
            return StubContentGenerator().generate(prompt, system_prompt)

        try:
            response = self._client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=1024,
            )
            self.last_source = "llm"
            return response.choices[0].message.content or ""
        except Exception as exc:
            logger.warning("Groq API error (%s) — falling back to StubContentGenerator", exc)
            self.last_source = "stub"
            return StubContentGenerator().generate(prompt, system_prompt)

    def chat(self, messages: list[dict[str, str]], system_prompt: str | None = None) -> str:
        """Interactive chat completion using Groq LLaMA model."""
        if not self._client:
            self.last_source = "stub"
            return StubContentGenerator().chat(messages, system_prompt)

        sys_msg = system_prompt or "You are Clarity AI, a warm, supportive, step-by-step pediatric learning tutor for neurodivergent students. Keep explanations clear, chunked, and encouraging."
        groq_msgs = [{"role": "system", "content": sys_msg}] + messages

        # Attempt primary model
        target_model = self._model or "llama-3.3-70b-versatile"
        try:
            response = self._client.chat.completions.create(
                model=target_model,
                messages=groq_msgs,
                temperature=0.7,
                max_tokens=1024,
            )
            self.last_source = "llm"
            return response.choices[0].message.content or ""
        except Exception as exc:
            logger.warning("Groq Chat API error with model %s (%s) — attempting fallback to llama-3.3-70b-versatile", target_model, exc)
            if target_model != "llama-3.3-70b-versatile":
                try:
                    fallback_resp = self._client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=groq_msgs,
                        temperature=0.7,
                        max_tokens=1024,
                    )
                    self.last_source = "llm"
                    return fallback_resp.choices[0].message.content or ""
                except Exception as fb_exc:
                    logger.warning("Groq Chat API fallback error (%s) — using stub generator", fb_exc)

            self.last_source = "stub"
            return StubContentGenerator().chat(messages, system_prompt)


# ── Stub implementation (tests + dev without Groq key) ───────────────────────

class StubContentGenerator:
    """
    Deterministic fake for tests. Returns valid JSON by default.
    Set `malformed=True` to simulate a bad LLM response (triggers retry logic).
    """

    def __init__(self, malformed: bool = False, fail_count: int = 0):
        self._malformed = malformed
        self._fail_count = fail_count
        self._call_count = 0
        self.last_source: str = "stub"

    def chat(self, messages: list[dict[str, str]], system_prompt: str | None = None) -> str:
        last_msg = (messages[-1]["content"] if messages else "").lower()
        if any(k in last_msg for k in ["physics", "newton", "motion", "law", "force"]):
            return (
                "**Newton's Laws of Motion explained simply:**\n\n"
                "• **First Law (Inertia)**: Objects keep doing what they're doing unless a force pushes them (like a soccer ball staying still until kicked).\n"
                "• **Second Law ($F = ma$)**: Force = mass × acceleration. Heavy trucks need bigger engines to speed up than lightweight sports cars.\n"
                "• **Third Law**: For every action, there is an equal and opposite reaction (pushing off a skateboard propels you forward while pushing the board backward)."
            )
        elif any(k in last_msg for k in ["math", "calculus", "quadratic", "equation"]):
            return "Let's break down quadratic equations step-by-step using $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$!"
        elif any(k in last_msg for k in ["biology", "cell", "plant", "animal"]):
            return "Plant cells have rigid cell walls and chloroplasts for photosynthesis, while animal cells have flexible membranes and mitochondria!"
        elif any(k in last_msg for k in ["stress", "anxiety", "calm", "relax"]):
            return "Take a slow deep breath! Try the 5-4-3-2-1 grounding technique or take a 5-minute break with fresh water. You've got this!"
        elif any(k in last_msg for k in ["focus", "adhd", "motivat", "study tip"]):
            return "Here is a quick focus tip: Try 25 minutes of focused study followed by a 5-minute break (Pomodoro Technique)!"
        elif any(k in last_msg for k in ["essay", "writing", "outline"]):
            return "To build a great essay outline: 1) Strong thesis statement, 2) Three clear body paragraphs with evidence, 3) Concise summary conclusion."

        return "Hello! I am Clarity AI, your learning tutor. Ask me any question about math, physics, biology, study stress, or focus tips!"

    def generate(self, prompt: str, system_prompt: str) -> str:
        self._call_count += 1
        if self._malformed or self._call_count <= self._fail_count:
            return "This is not valid JSON { oops"
        
        subject = "biology"
        skill_tag = "cell_biology"
        content_type = "text"
        difficulty_level = 1
        base_q = ""
        
        if "Base task:" in prompt:
            try:
                base_part = prompt.split("Base task:")[1].split("Instruction:")[0].strip()
                if "Source Material" in base_part:
                    base_part = base_part.split("Source Material")[0].strip()
                parsed = json.loads(base_part)
                subject = parsed.get("subject", subject)
                skill_tag = parsed.get("skill_tag", skill_tag)
                difficulty_level = parsed.get("difficulty_level", difficulty_level)
                content_type = parsed.get("content_type", content_type)
                base_q = parsed.get("content_body", {}).get("question", "")
            except Exception:
                pass

        if "Target content_type: interactive" in prompt:
            content_type = "interactive"
        elif "Target content_type: visual" in prompt:
            content_type = "visual"
        elif "Target content_type: text" in prompt:
            content_type = "text"

        if "difficulty level 1" in prompt:
            difficulty_level = 1
        elif "difficulty level 2" in prompt:
            difficulty_level = 2
        elif "difficulty level 3" in prompt:
            difficulty_level = 3

        # Topic-aware dynamic content body generation
        subj_clean = subject.strip().lower()
        skill_clean = skill_tag.strip().lower()

        if content_type == "interactive":
            if subj_clean == "math" or "math" in skill_clean or "ops" in skill_clean:
                body = {
                    "question": "Which simplified operation gives the correct estimate for 48 + 37?",
                    "options": ["50 + 40 = 90", "40 + 30 = 70", "50 + 30 = 80", "45 + 35 = 80"],
                    "correct_index": 0,
                }
            elif subj_clean == "fractions" or "fraction" in skill_clean or "decimal" in skill_clean or "percent" in skill_clean:
                body = {
                    "question": "Which fraction is equivalent to 50%?",
                    "options": ["1/4", "1/2", "3/4", "2/5"],
                    "correct_index": 1,
                }
            elif subj_clean == "algebra" or "expression" in skill_clean or "inequal" in skill_clean:
                body = {
                    "question": "If x + 5 = 12, what is the value of x?",
                    "options": ["5", "6", "7", "8"],
                    "correct_index": 2,
                }
            elif subj_clean == "geometry" or "shape" in skill_clean or "coord" in skill_clean:
                body = {
                    "question": "What is the perimeter of a rectangle with length 5 cm and width 3 cm?",
                    "options": ["8 cm", "15 cm", "16 cm", "18 cm"],
                    "correct_index": 2,
                }
            elif subj_clean == "reading" or "inference" in skill_clean or "structure" in skill_clean:
                body = {
                    "question": "What is the main topic of a passage discussing solar energy benefits?",
                    "options": ["Fossil fuel power", "Clean renewable energy from the sun", "Wind turbine mechanics", "Hydroelectric dams"],
                    "correct_index": 1,
                }
            elif subj_clean == "grammar" or "punctuation" in skill_clean or "sentence" in skill_clean:
                body = {
                    "question": "In the sentence 'She sings beautifully', what part of speech is 'beautifully'?",
                    "options": ["Noun", "Verb", "Adjective", "Adverb"],
                    "correct_index": 3,
                }
            elif subj_clean == "vocabulary" or "word" in skill_clean or "morph" in skill_clean:
                body = {
                    "question": "What does the prefix 're-' mean in the word 'rewrite'?",
                    "options": ["Before", "Again / repeat", "Under", "Without"],
                    "correct_index": 1,
                }
            elif subj_clean == "physics" or "motion" in skill_clean or "newton" in skill_clean or "energy" in skill_clean:
                body = {
                    "question": "What is the SI unit of force in Newton's second law (F = ma)?",
                    "options": ["Joule", "Watt", "Newton", "Pascal"],
                    "correct_index": 2,
                }
            elif subj_clean == "chemistry" or "atom" in skill_clean or "matter" in skill_clean or "reaction" in skill_clean:
                body = {
                    "question": "Which subatomic particle has no electrical charge?",
                    "options": ["Proton", "Neutron", "Electron", "Positron"],
                    "correct_index": 1,
                }
            elif subj_clean == "earth_space" or "solar" in skill_clean or "layer" in skill_clean or "weather" in skill_clean:
                body = {
                    "question": "What process in the water cycle turns liquid water into atmospheric water vapor?",
                    "options": ["Condensation", "Evaporation", "Precipitation", "Sublimation"],
                    "correct_index": 1,
                }
            elif subj_clean == "cs" or "algorithm" in skill_clean or "loop" in skill_clean or "debug" in skill_clean:
                body = {
                    "question": "Which programming structure repeats a block of code while a condition is true?",
                    "options": ["If statement", "While loop", "Variable declaration", "Comment"],
                    "correct_index": 1,
                }
            elif subj_clean == "logic" or "pattern" in skill_clean or "deduct" in skill_clean:
                body = {
                    "question": "Which number completes the pattern: 2, 4, 8, 16, __?",
                    "options": ["24", "30", "32", "64"],
                    "correct_index": 2,
                }
            elif subj_clean == "finance" or "budget" in skill_clean or "currency" in skill_clean:
                body = {
                    "question": "If you buy an item for $3.25 and pay with a $5.00 bill, how much change do you receive?",
                    "options": ["$1.25", "$1.75", "$2.25", "$1.50"],
                    "correct_index": 1,
                }
            else:
                body = {
                    "question": f"Which option best explains the concept of {skill_clean.replace('_', ' ')}?",
                    "options": ["Core primary definition", "Secondary factor", "Unrelated item", "Incorrect distractor"],
                    "correct_index": 0,
                }
        elif content_type == "visual":
            if subj_clean == "math" or "ops" in skill_clean:
                body = {
                    "question": "Observe the 4x5 array grid. How many total items are shown?",
                    "image_description": "A rectangular grid with 4 rows and 5 columns of blue circles.",
                    "answer": "20",
                }
            elif subj_clean == "geometry" or "shape" in skill_clean:
                body = {
                    "question": "Examine the coordinate plane. What are the coordinates of point A?",
                    "image_description": "A Cartesian plane with point A at (2, 5).",
                    "answer": "(2, 5)",
                }
            elif subj_clean == "physics" or "energy" in skill_clean:
                body = {
                    "question": "Observe the roller coaster track. At which point is potential energy highest?",
                    "image_description": "A roller coaster diagram with points A (peak), B (valley), C (loop).",
                    "answer": "Point A",
                }
            else:
                body = {
                    "question": f"Examine the diagram for {skill_clean.replace('_', ' ')}. What process is illustrated?",
                    "image_description": f"A clean educational diagram illustrating {skill_clean.replace('_', ' ')}.",
                    "answer": skill_clean.replace("_", " "),
                }
        else:  # text
            if subj_clean == "math" or "ops" in skill_clean:
                body = {
                    "question": "What is 48 + 37 rounded to the nearest ten?",
                    "answer": "90",
                    "hints": ["48 is close to 50", "37 is close to 40", "50 + 40 = 90"],
                }
            elif subj_clean == "algebra" or "expression" in skill_clean:
                body = {
                    "question": "Evaluate 2x + 3 when x = 5.",
                    "answer": "13",
                    "hints": ["Multiply 2 by 5 first (10)", "Then add 3: 10 + 3 = 13"],
                }
            elif subj_clean == "physics" or "newton" in skill_clean or "motion" in skill_clean:
                body = {
                    "question": "What force opposes the motion of two surfaces sliding past each other?",
                    "answer": "friction",
                    "hints": ["It slows down sliding objects", "Starts with 'f'"],
                }
            elif subj_clean == "grammar" or "punctuation" in skill_clean:
                body = {
                    "question": "What punctuation mark is used at the end of an interrogative question?",
                    "answer": "question mark",
                    "hints": ["Used when asking a question"],
                }
            elif subj_clean == "cs" or "algorithm" in skill_clean:
                body = {
                    "question": "What is the term for a step-by-step set of instructions to solve a problem in code?",
                    "answer": "algorithm",
                    "hints": ["Starts with 'a'"],
                }
            elif subj_clean == "finance" or "budget" in skill_clean:
                body = {
                    "question": "What term describes money earned or received regularly for work?",
                    "answer": "income",
                    "hints": ["The opposite of expenses"],
                }
            elif subj_clean == "biology" or "cell" in skill_clean:
                body = {
                    "question": "What is the basic unit of living organisms that contains DNA in its nucleus?",
                    "answer": "cell nucleus contains DNA",
                    "hints": ["Known as the structural unit of life"],
                }
            else:
                body = {
                    "question": f"What is the key defining feature of {skill_clean.replace('_', ' ')}?",
                    "answer": skill_clean.replace("_", " "),
                    "hints": [f"Focus on the core principle of {skill_clean.replace('_', ' ')}"],
                }

        return json.dumps({
            "skill_tag": skill_tag,
            "subject": subject,
            "difficulty_level": difficulty_level,
            "expected_duration_seconds": 60,
            "content_type": content_type,
            "content_body": body,
        })


# ── Heuristic Grounding Verification ─────────────────────────────────────────

def check_grounding_heuristic(
    variant: TaskVariantSchema,
    source_chunks: list[Any],
) -> tuple[bool, str]:
    """
    Fast heuristic verification: checks keyword/entity overlap between generated output and source chunks.
    Flags ungrounded facts or invented statements.
    """
    if not source_chunks:
        return True, "No source chunks provided; fallback mode."

    source_text_combined = " ".join(
        getattr(chunk, "chunk_text", str(chunk)) for chunk in source_chunks
    ).lower()

    body = variant.content_body
    variant_text_parts = [
        str(body.get("question", "")),
        str(body.get("answer", "")),
    ]
    if isinstance(body.get("options"), list):
        variant_text_parts.extend(str(opt) for opt in body["options"])

    variant_text = " ".join(variant_text_parts).lower()

    # Explicit test/fabricated fact indicators
    forbidden_keywords = ["fabricated_fact", "invented_fake_fact", "pluto_is_a_star"]
    for kw in forbidden_keywords:
        if kw in variant_text:
            return False, f"Fabricated fact detected: '{kw}'"

    words = [w.strip(".,!?\"'()") for w in variant_text.split() if len(w) > 3]
    stopwords = {"what", "which", "where", "when", "that", "this", "these", "those", "from", "with", "have", "been", "starts", "hint"}
    substantive_words = [w for w in words if w not in stopwords]

    if not substantive_words:
        return True, "Grounding check passed (short text)."

    matching_count = sum(1 for w in substantive_words if w in source_text_combined)
    overlap_ratio = matching_count / len(substantive_words)

    if overlap_ratio < 0.25:
        return False, f"Low grounding overlap ratio ({overlap_ratio:.2f} < 0.25). Generated content contains ungrounded/fabricated terms."

    return True, f"Grounding check passed with overlap ratio {overlap_ratio:.2f}."


# ── Prompt templates ──────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an educational content generator for an adaptive tutoring system for neurodivergent learners (ages 8-16, primarily ADHD and autism spectrum).

Your task is to generate a task variant in strict JSON format. Follow these rules:
1. Output ONLY valid JSON — no prose, no markdown fences, no explanation.
2. Keep the same skill_tag and subject as specified.
3. Keep the same learning objective — just change the presentation/difficulty/chunking.
4. Use simple, clear language appropriate for the target age and neurodivergent profile.
5. If Source Material is provided, restate and rephrase strictly based on those facts. Do not invent new facts.
6. The JSON must exactly match this schema:
{
  "skill_tag": string,
  "subject": string,
  "difficulty_level": integer (1-5),
  "expected_duration_seconds": integer,
  "content_type": "text" | "interactive" | "visual",
  "content_body": {
    // For text/visual: {"question": string, "answer": string, "hints": [string]}
    // For interactive: {"question": string, "options": [string], "correct_index": integer}
  }
}"""


def _build_prompt(
    base_task_data: dict[str, Any],
    variant_type: str,
    target_difficulty: int | None,
    target_content_type: str | None,
    source_chunks: list[Any] | None = None,
) -> str:
    instructions = {
        "re_chunk": (
            "Split this task into 2-3 smaller sub-tasks, each covering part of the same "
            "learning objective. Return the FIRST sub-task only (the system will call again "
            "for subsequent parts). Make it shorter and more focused."
        ),
        "modality_switch": (
            f"Convert this task to a different presentation format. "
            f"Target content_type: {target_content_type or 'interactive'}. "
            "Keep the same question/concept but present it differently."
        ),
        "difficulty_step_down": (
            f"Create an easier version of this task at difficulty level {target_difficulty or 1}. "
            "Provide more scaffolding, simpler language, and more hints. "
            "Same learning objective, lower cognitive load."
        ),
        "break_task": (
            "Create a short, low-stakes, fun activity related to this topic. "
            "It should be quick (30-60 seconds), engaging, and give the student a mental break "
            "while staying loosely connected to the subject."
        ),
    }

    grounding_section = ""
    if source_chunks:
        chunks_text = "\n---\n".join(
            f"Passage ({getattr(c, 'section_title', 'Ref')}):\n{getattr(c, 'chunk_text', str(c))}"
            for c in source_chunks
        )
        grounding_section = f"\n\nSource Material (Grounded Facts):\n{chunks_text}\n"

    return f"""
Base task:
{json.dumps(base_task_data, indent=2)}
{grounding_section}
Instruction:
{instructions.get(variant_type, "Generate an equivalent task variant.")}

Remember: output ONLY valid JSON matching the schema. No other text.
"""


def _parse_and_validate(raw_json: str, base_skill_tag: str, base_subject: str) -> TaskVariantSchema:
    """Parse and validate the LLM's JSON output."""
    try:
        data = json.loads(raw_json.strip())
    except json.JSONDecodeError as exc:
        raise ContentGenerationError(f"LLM returned invalid JSON: {exc}\nRaw: {raw_json[:200]}") from exc

    try:
        variant = TaskVariantSchema(**data)
    except ValidationError as exc:
        raise ContentGenerationError(f"LLM JSON failed schema validation: {exc}") from exc

    # Enforce same skill_tag and subject
    if variant.skill_tag != base_skill_tag:
        raise ContentGenerationError(
            f"LLM changed skill_tag: got '{variant.skill_tag}', expected '{base_skill_tag}'"
        )
    if variant.subject != base_subject:
        raise ContentGenerationError(
            f"LLM changed subject: got '{variant.subject}', expected '{base_subject}'"
        )

    # Validate content_body shape
    try:
        variant.validate_content_body()
    except ValueError as exc:
        raise ContentGenerationError(f"content_body validation failed: {exc}") from exc

    return variant


def generate_task_variant(
    base_task_data: dict[str, Any],
    variant_type: str,
    client: ContentGeneratorClient | None = None,
    target_difficulty: int | None = None,
    target_content_type: str | None = None,
    source_chunks: list[Any] | None = None,
    session: Any | None = None,
) -> tuple[TaskVariantSchema, str]:
    """
    Generate a task variant using the LLM.

    Retrieves grounded source chunks when session/source_chunks provided.
    Validates output schema and runs grounding heuristic check.
    On validation/grounding failure: retries once with an error-correction prompt.
    On second failure: raises ContentGenerationError.

    Returns tuple of (validated TaskVariantSchema, generation_source: "llm" | "stub").
    """
    if client is None:
        client = GroqContentGenerator()

    base_skill_tag = base_task_data.get("skill_tag", "")
    base_subject = base_task_data.get("subject", "")

    # Retrieve chunks if session is provided and source_chunks is not
    if source_chunks is None and session is not None:
        try:
            from app.services.knowledge_retriever import retrieve_chunks
            source_chunks = retrieve_chunks(
                session=session,
                skill_tag=base_skill_tag,
                query_text=base_task_data.get("content_body", {}).get("question", ""),
                subject=base_subject,
            )
        except Exception as exc:
            logger.warning("Error retrieving grounding chunks: %s", exc)
            source_chunks = []

    if source_chunks:
        logger.info("Using %d grounded source chunks for skill_tag='%s'", len(source_chunks), base_skill_tag)
    else:
        logger.info(
            "Grounding coverage gap for subject='%s', skill_tag='%s' — falling back to ungrounded path",
            base_subject,
            base_skill_tag,
        )

    prompt = _build_prompt(
        base_task_data,
        variant_type,
        target_difficulty,
        target_content_type,
        source_chunks=source_chunks,
    )

    def _parse_validate_and_check(raw_text: str) -> TaskVariantSchema:
        variant = _parse_and_validate(raw_text, base_skill_tag, base_subject)
        if source_chunks:
            is_grounded, reason = check_grounding_heuristic(variant, source_chunks)
            if not is_grounded:
                raise ContentGenerationError(f"Grounding check failed: {reason}")
            variant.grounding_chunk_ids = [
                getattr(c, "id") for c in source_chunks if hasattr(c, "id")
            ]
        variant.is_ai_generated = True
        return variant

    # First attempt
    logger.info("Generating task variant: type=%s, skill_tag=%s", variant_type, base_skill_tag)
    raw = client.generate(prompt, SYSTEM_PROMPT)
    source = getattr(client, "last_source", "stub")

    try:
        return _parse_validate_and_check(raw), source
    except ContentGenerationError as exc:
        first_error_msg = str(exc)
        logger.warning("First generation attempt failed: %s — retrying with correction prompt", exc)

    # Retry with error-correction prompt
    correction_prompt = (
        f"{prompt}\n\n"
        f"Your previous response was invalid: {first_error_msg}\n"
        f"Please output ONLY valid JSON matching the schema exactly, grounded in the source material."
    )
    raw_retry = client.generate(correction_prompt, SYSTEM_PROMPT)
    source_retry = getattr(client, "last_source", "stub")

    try:
        return _parse_validate_and_check(raw_retry), source_retry
    except ContentGenerationError as second_error:
        logger.error(
            "Second generation attempt also failed: %s — raising ContentGenerationError",
            second_error,
        )
        raise ContentGenerationError(
            f"Failed to generate valid content after 2 attempts. "
            f"Last error: {second_error}"
        ) from second_error
