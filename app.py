import json
import os
from datetime import datetime
from typing import Any, Dict, List

import streamlit as st
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables from .env without hardcoding secrets
load_dotenv()

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

SUBJECTS = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Computer Science",
    "Programming",
    "Artificial Intelligence",
    "English",
    "General Subjects",
]

LEARNING_MODES = ["Beginner", "Intermediate", "Advanced"]

SUGGESTED_QUESTIONS: Dict[str, List[str]] = {
    "Mathematics": [
        "Solve 2x^2 - 5x - 3 = 0 step by step using factoring and the quadratic formula.",
        "Explain derivatives intuitively and find the derivative of f(x) = 3x^3 - 4x + 7.",
        "Why does matrix multiplication require the inner dimensions to match?",
    ],
    "Physics": [
        "Explain Newton's Second Law with a real-world elevator acceleration problem.",
        "How do kinetic energy and potential energy trade off on a roller coaster?",
        "How does electromagnetic induction generate electricity in a power plant?",
    ],
    "Chemistry": [
        "Balance the chemical equation: Fe + O2 -> Fe2O3 and explain every step.",
        "Explain the difference between ionic and covalent bonding with everyday examples.",
        "What does pH actually measure in terms of hydrogen ion concentration?",
    ],
    "Computer Science": [
        "Explain Big-O time complexity with O(1), O(log n), O(n), and O(n^2) examples.",
        "How does a hash table resolve collisions using chaining vs. open addressing?",
        "Explain how the TCP three-way handshake guarantees reliable communication.",
    ],
    "Programming": [
        "Write and trace a recursive Python function for binary search step by step.",
        "Explain the difference between stack and heap memory with code examples.",
        "How do Python generators with yield save memory compared to lists?",
    ],
    "Artificial Intelligence": [
        "How does gradient descent minimize a loss function in neural networks?",
        "Explain overfitting vs. underfitting and how regularization helps.",
        "How does self-attention work inside a Transformer model?",
    ],
    "English": [
        "How do I structure a strong persuasive academic thesis and topic sentences?",
        "Explain active vs. passive voice with clear before-and-after examples.",
        "Analyze how foreshadowing and symbolism work together in storytelling.",
    ],
    "General Subjects": [
        "How do active recall and spaced repetition improve long-term exam memory?",
        "Explain supply and demand equilibrium when a market experiences a shortage.",
        "What were the main technological drivers of the Industrial Revolution?",
    ],
}


def get_gemini_client() -> genai.Client:
    """Initialize Google GenAI client using GEMINI_API_KEY from environment."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "MY_GEMINI_API_KEY":
        raise ValueError(
            "GEMINI_API_KEY is missing. Add your Gemini API key to a .env file in the project root."
        )
    return genai.Client(api_key=api_key)


def build_system_instruction(subject: str, learning_mode: str, action_mode: str) -> str:
    level_rules = {
        "Beginner": (
            "Use simple, friendly everyday language, intuitive analogies, short paragraphs, "
            "and clearly define any technical vocabulary."
        ),
        "Intermediate": (
            "Use clear college/high-school academic depth, connect core principles, "
            "include structured formulas or code snippets, and highlight common mistakes."
        ),
        "Advanced": (
            "Provide rigorous theoretical depth, formal mathematical or algorithmic notation, "
            "edge cases, and nuanced analysis."
        ),
    }

    mode_rules = {
        "tutor": (
            "Act as a supportive personal AI tutor. Explain clearly with examples. "
            "Whenever the student submits a mathematical or programming problem, ALWAYS explain "
            "the solution in clear numbered steps instead of giving only the final answer."
        ),
        "step_by_step": (
            "Deliver a rigorous Step-by-Step Solver breakdown. Number each step (Step 1, Step 2, ...), "
            "explain why each transformation or code line is needed, and finish with a quick verification."
        ),
        "explain_simply": (
            "Explain Simply Mode: Use ultra-simple, jargon-free language as if explaining to a curious friend. "
            "Include one vivid everyday analogy and one short example."
        ),
        "examples": (
            "Real-World Example Generator Mode: Provide 3 distinct, memorable real-world applications "
            "for this topic, explaining how the concept operates in practice in each case."
        ),
    }

    return (
        f"You are AI Study Buddy, a dedicated personal AI tutor specializing in {subject}.\n\n"
        f"Student Learning Mode: {learning_mode}. {level_rules.get(learning_mode, level_rules['Intermediate'])}\n\n"
        f"Instruction Mode: {mode_rules.get(action_mode, mode_rules['tutor'])}\n\n"
        "Format clearly using Markdown headings, numbered steps, bullet points, and fenced code blocks."
    )


def call_tutor_chat(
    prompt: str,
    history: List[Dict[str, Any]],
    subject: str,
    learning_mode: str,
    action_mode: str = "tutor",
) -> Dict[str, str]:
    """Send a multi-turn tutoring request to Gemini and return topic + markdown answer."""
    client = get_gemini_client()
    system_instruction = build_system_instruction(subject, learning_mode, action_mode)

    contents: List[types.Content] = []
    for item in history[-10:]:
        role = "model" if item["role"] == "assistant" else "user"
        contents.append(
            types.Content(role=role, parts=[types.Part.from_text(text=item["content"])])
        )
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=prompt)]))

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "topic_title": {
                        "type": "STRING",
                        "description": "Concise 2 to 5 word topic summary.",
                    },
                    "answer_markdown": {
                        "type": "STRING",
                        "description": "Detailed Markdown tutor response.",
                    },
                },
                "required": ["topic_title", "answer_markdown"],
            },
        ),
    )

    data = json.loads((response.text or "{}").strip())
    return {
        "topic": data.get("topic_title", f"{subject} Study"),
        "answer": data.get("answer_markdown", "Could not generate an answer."),
    }


def generate_practice_questions(
    topic: str, subject: str, learning_mode: str, context: str = ""
) -> List[Dict[str, str]]:
    """Generate 3 practice questions for the active topic, subject, and learning level."""
    client = get_gemini_client()
    prompt = (
        f"Generate exactly 3 practice questions for a {learning_mode}-level student studying "
        f"'{topic}' in {subject}.\n"
    )
    if context:
        prompt += f"\nRecent lesson context:\n{context[:1200]}\n"
    prompt += (
        "\nOrder them from foundational understanding to applied problem-solving and deeper reasoning."
    )

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=f"You are an expert {subject} tutor creating 3 practice problems.",
            response_mime_type="application/json",
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "questions": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "question": {"type": "STRING"},
                                "difficulty": {"type": "STRING"},
                                "hint": {"type": "STRING"},
                                "key_concept": {"type": "STRING"},
                            },
                            "required": ["question", "difficulty", "hint", "key_concept"],
                        },
                    }
                },
                "required": ["questions"],
            },
        ),
    )

    parsed = json.loads((response.text or "{}").strip())
    return parsed.get("questions", [])[:3]


def evaluate_practice_answer(
    question: str, student_answer: str, subject: str, learning_mode: str
) -> Dict[str, Any]:
    """Evaluate a student's practice answer and return structured educational feedback."""
    client = get_gemini_client()
    prompt = (
        f"Subject: {subject}\n"
        f"Student Level: {learning_mode}\n"
        f"Question: {question}\n"
        f"Student Answer: {student_answer}\n\n"
        "Evaluate the attempt kindly, clarify any mistakes, give a step-by-step model solution, "
        "and provide one key takeaway."
    )

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction="You are a patient, encouraging personal AI tutor.",
            response_mime_type="application/json",
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "is_correct": {"type": "BOOLEAN"},
                    "verdict": {"type": "STRING"},
                    "feedback": {"type": "STRING"},
                    "step_by_step_solution": {"type": "STRING"},
                    "key_takeaway": {"type": "STRING"},
                },
                "required": [
                    "is_correct",
                    "verdict",
                    "feedback",
                    "step_by_step_solution",
                    "key_takeaway",
                ],
            },
        ),
    )
    return json.loads((response.text or "{}").strip())


def init_session_state() -> None:
    defaults = {
        "messages": [],
        "subject": "Mathematics",
        "learning_mode": "Intermediate",
        "topics_studied": [],
        "recent_subjects": [],
        "session_history": [],
        "practice_topic": "",
        "practice_questions": [],
        "practice_feedback": {},
        "practice_completed_count": 0,
        "copy_preview_id": None,
        "active_page": "AI Chat Tutor",
    }
    for key, val in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = val


def inject_custom_css() -> None:
    st.markdown(
        """
        <style>
        .stApp {
            background: linear-gradient(160deg, #080D1A 0%, #0D142B 55%, #13112D 100%);
            color: #F1F5F9;
        }
        [data-testid="stSidebar"] {
            background-color: #0B1224;
            border-right: 1px solid rgba(148, 163, 184, 0.16);
        }
        .study-card {
            background-color: #0F172A;
            border: 1px solid rgba(139, 92, 246, 0.25);
            border-radius: 14px;
            padding: 1.25rem;
            margin-bottom: 1rem;
        }
        .metric-card {
            background-color: #0F172A;
            border: 1px solid rgba(148, 163, 184, 0.18);
            border-radius: 12px;
            padding: 1rem 1.2rem;
        }
        .metric-label {
            color: #94A3B8;
            font-size: 0.8rem;
            margin-bottom: 0.25rem;
        }
        .metric-value {
            color: #F8FAFC;
            font-size: 1.75rem;
            font-weight: 700;
        }
        .stButton > button {
            border-radius: 10px;
            border: 1px solid rgba(139, 92, 246, 0.35);
            transition: all 0.18s ease;
        }
        .stButton > button:hover {
            border-color: #8B5CF6;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def record_study_activity(
    topic: str, subject: str, learning_mode: str, question_text: str
) -> None:
    clean_topic = topic.strip() or f"{subject} Study"
    if clean_topic not in st.session_state.topics_studied:
        st.session_state.topics_studied.insert(0, clean_topic)
    if subject in st.session_state.recent_subjects:
        st.session_state.recent_subjects.remove(subject)
    st.session_state.recent_subjects.insert(0, subject)
    st.session_state.session_history.insert(
        0,
        {
            "time": datetime.now().strftime("%H:%M"),
            "topic": clean_topic,
            "subject": subject,
            "learning_mode": learning_mode,
            "question": question_text[:120],
        },
    )


def handle_tutor_request(prompt: str, action_mode: str = "tutor") -> None:
    subject = st.session_state.subject
    learning_mode = st.session_state.learning_mode

    st.session_state.messages.append(
        {
            "id": f"u-{len(st.session_state.messages)}",
            "role": "user",
            "content": prompt,
            "subject": subject,
            "learning_mode": learning_mode,
            "time": datetime.now().strftime("%H:%M"),
        }
    )

    try:
        with st.spinner(f"Preparing {learning_mode.lower()} explanation..."):
            result = call_tutor_chat(
                prompt=prompt,
                history=st.session_state.messages[:-1],
                subject=subject,
                learning_mode=learning_mode,
                action_mode=action_mode,
            )
        st.session_state.messages.append(
            {
                "id": f"a-{len(st.session_state.messages)}",
                "role": "assistant",
                "content": result["answer"],
                "topic": result["topic"],
                "subject": subject,
                "learning_mode": learning_mode,
                "time": datetime.now().strftime("%H:%M"),
            }
        )
        st.session_state.practice_topic = result["topic"]
        record_study_activity(result["topic"], subject, learning_mode, prompt)
    except Exception as exc:
        st.error(f"Tutor Error: {exc}")


def render_sidebar() -> None:
    with st.sidebar:
        st.title("AI Study Buddy")
        st.caption("Personal AI Tutor")

        st.session_state.active_page = st.radio(
            "Navigation",
            ["AI Chat Tutor", "Practice Mode", "Study Dashboard"],
            index=["AI Chat Tutor", "Practice Mode", "Study Dashboard"].index(
                st.session_state.active_page
            ),
        )

        st.divider()

        st.session_state.learning_mode = st.selectbox(
            "Learning Mode",
            LEARNING_MODES,
            index=LEARNING_MODES.index(st.session_state.learning_mode),
        )

        st.session_state.subject = st.selectbox(
            "Subject Selection",
            SUBJECTS,
            index=SUBJECTS.index(st.session_state.subject),
        )

        st.divider()
        st.subheader("Suggested Questions")
        for idx, q in enumerate(SUGGESTED_QUESTIONS[st.session_state.subject]):
            if st.button(q, key=f"suggested_{st.session_state.subject}_{idx}", use_container_width=True):
                st.session_state.active_page = "AI Chat Tutor"
                handle_tutor_request(q, "tutor")
                st.rerun()

        st.divider()
        col1, col2 = st.columns(2)
        with col1:
            if st.button("Clear Chat", use_container_width=True):
                st.session_state.messages = []
                st.rerun()
        with col2:
            if st.button("Reset All", use_container_width=True):
                for key in list(st.session_state.keys()):
                    del st.session_state[key]
                init_session_state()
                st.rerun()


def render_chat_tutor() -> None:
    st.header("AI Doubt Solver & Chat Tutor")
    st.caption(
        f"Subject: {st.session_state.subject}  ·  Learning Mode: {st.session_state.learning_mode}"
    )

    mode_choice = st.segmented_control(
        "Solver Style",
        options=["Auto Tutor", "Step-by-Step", "Explain Simply", "Real-World Examples"],
        default="Auto Tutor",
    )
    mode_map = {
        "Auto Tutor": "tutor",
        "Step-by-Step": "step_by_step",
        "Explain Simply": "explain_simply",
        "Real-World Examples": "examples",
    }

    if not st.session_state.messages:
        st.markdown(
            """
            <div class="study-card">
                <h4>Welcome to AI Study Buddy</h4>
                <p style="color:#CBD5E1; margin-bottom:0;">
                    Ask any academic question below or pick a suggested question from the sidebar.
                    Math and programming problems are automatically solved step by step.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            meta = f"{msg['subject']} · {msg['learning_mode']} · {msg['time']}"
            if msg.get("topic"):
                meta = f"{msg['topic']} · {meta}"
            st.caption(meta)
            st.markdown(msg["content"])

            if msg["role"] == "assistant":
                c1, c2, c3, c4, c5 = st.columns(5)
                msg_id = msg["id"]
                topic = msg.get("topic", st.session_state.subject)
                with c1:
                    if st.button("Explain Simply", key=f"simple_{msg_id}", use_container_width=True):
                        handle_tutor_request(
                            f"Explain '{topic}' in very simple language with an easy analogy and example.",
                            "explain_simply",
                        )
                        st.rerun()
                with c2:
                    if st.button("Step-by-Step", key=f"steps_{msg_id}", use_container_width=True):
                        handle_tutor_request(
                            f"Show a detailed step-by-step breakdown for '{topic}'.",
                            "step_by_step",
                        )
                        st.rerun()
                with c3:
                    if st.button("Examples", key=f"examples_{msg_id}", use_container_width=True):
                        handle_tutor_request(
                            f"Generate 3 real-world examples for '{topic}'.",
                            "examples",
                        )
                        st.rerun()
                with c4:
                    if st.button("Practice (3 Qs)", key=f"practice_{msg_id}", use_container_width=True):
                        st.session_state.practice_topic = topic
                        st.session_state.active_page = "Practice Mode"
                        try:
                            with st.spinner("Generating 3 practice questions..."):
                                st.session_state.practice_questions = generate_practice_questions(
                                    topic,
                                    st.session_state.subject,
                                    st.session_state.learning_mode,
                                    msg["content"],
                                )
                                st.session_state.practice_feedback = {}
                        except Exception as exc:
                            st.error(f"Practice generation error: {exc}")
                        st.rerun()
                with c5:
                    if st.button("Copy Text", key=f"copy_{msg_id}", use_container_width=True):
                        st.session_state.copy_preview_id = (
                            None if st.session_state.copy_preview_id == msg_id else msg_id
                        )

                if st.session_state.copy_preview_id == msg_id:
                    st.code(msg["content"], language="markdown")

    user_prompt = st.chat_input(
        f"Ask a {st.session_state.subject} question ({st.session_state.learning_mode} level)..."
    )
    if user_prompt:
        selected_action = mode_map.get(mode_choice or "Auto Tutor", "tutor")
        handle_tutor_request(user_prompt, selected_action)
        st.rerun()


def render_practice_mode() -> None:
    st.header("Practice Mode")
    st.caption(
        f"Generate 3 practice questions tailored to {st.session_state.subject} ({st.session_state.learning_mode})."
    )

    with st.form("practice_generator_form"):
        topic_input = st.text_input(
            "Topic to Practice",
            value=st.session_state.practice_topic,
            placeholder=f"e.g., Quadratic Equations, Binary Search, Newton's Laws...",
        )
        submitted = st.form_submit_button("Generate 3 Practice Questions")
        if submitted:
            target = topic_input.strip() or f"Core concepts in {st.session_state.subject}"
            st.session_state.practice_topic = target
            try:
                with st.spinner("Generating 3 practice questions..."):
                    st.session_state.practice_questions = generate_practice_questions(
                        target, st.session_state.subject, st.session_state.learning_mode
                    )
                    st.session_state.practice_feedback = {}
            except Exception as exc:
                st.error(f"Error generating practice questions: {exc}")

    if not st.session_state.practice_questions:
        st.info("Enter a topic above and click 'Generate 3 Practice Questions' to begin.")
        return

    for idx, q in enumerate(st.session_state.practice_questions):
        st.markdown(
            f"""
            <div class="study-card">
                <div style="font-size:0.8rem; color:#A78BFA; margin-bottom:0.4rem;">
                    Question {idx + 1} · {q.get('key_concept', '')} · {q.get('difficulty', '')}
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        st.markdown(q["question"])

        with st.expander("Need a Hint?"):
            st.write(q["hint"])

        ans = st.text_area(
            f"Your Answer (Question {idx + 1})",
            key=f"practice_ans_{idx}",
            height=110,
            placeholder="Write your solution steps or explanation here...",
        )

        if st.button(f"Check Answer {idx + 1}", key=f"check_ans_{idx}"):
            if not ans.strip():
                st.warning("Please enter an answer before checking.")
            else:
                try:
                    with st.spinner("Evaluating your answer..."):
                        fb = evaluate_practice_answer(
                            q["question"],
                            ans,
                            st.session_state.subject,
                            st.session_state.learning_mode,
                        )
                    if idx not in st.session_state.practice_feedback:
                        st.session_state.practice_completed_count += 1
                    st.session_state.practice_feedback[idx] = fb
                except Exception as exc:
                    st.error(f"Evaluation failed: {exc}")

        if idx in st.session_state.practice_feedback:
            fb = st.session_state.practice_feedback[idx]
            if fb.get("is_correct"):
                st.success(f"{fb.get('verdict', 'Correct')}: {fb.get('feedback', '')}")
            else:
                st.warning(f"{fb.get('verdict', 'Needs Review')}: {fb.get('feedback', '')}")
            st.markdown("**Step-by-Step Solution:**")
            st.markdown(fb.get("step_by_step_solution", ""))
            st.info(f"Key Takeaway: {fb.get('key_takeaway', '')}")

        st.divider()


def render_dashboard() -> None:
    st.header("Study Dashboard")
    st.caption("Session overview, topics studied, and question history.")

    c1, c2, c3, c4 = st.columns(4)
    metrics = [
        ("Questions Asked", len(st.session_state.session_history)),
        ("Topics Studied", len(st.session_state.topics_studied)),
        ("Practice Checked", st.session_state.practice_completed_count),
        ("Subjects Studied", len(st.session_state.recent_subjects)),
    ]
    for col, (label, value) in zip([c1, c2, c3, c4], metrics):
        with col:
            st.markdown(
                f"""
                <div class="metric-card">
                    <div class="metric-label">{label}</div>
                    <div class="metric-value">{value}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    st.write("")
    left, right = st.columns(2)
    with left:
        st.subheader("Topics Studied")
        if not st.session_state.topics_studied:
            st.write("No topics studied yet during this session.")
        else:
            for topic in st.session_state.topics_studied:
                st.write(f"- {topic}")

    with right:
        st.subheader("Recently Studied Subjects")
        if not st.session_state.recent_subjects:
            st.write("No subjects studied yet during this session.")
        else:
            for subj in st.session_state.recent_subjects:
                count = sum(
                    1 for entry in st.session_state.session_history if entry["subject"] == subj
                )
                st.write(f"- **{subj}** ({count} questions)")

    st.divider()
    st.subheader("Study Session History")
    if not st.session_state.session_history:
        st.write("Your session history will appear here once you ask a question.")
    else:
        st.dataframe(st.session_state.session_history, use_container_width=True, hide_index=True)


def main() -> None:
    st.set_page_config(
        page_title="AI Study Buddy – Personal AI Tutor",
        page_icon="🎓",
        layout="wide",
    )
    init_session_state()
    inject_custom_css()
    render_sidebar()

    page = st.session_state.active_page
    if page == "AI Chat Tutor":
        render_chat_tutor()
    elif page == "Practice Mode":
        render_practice_mode()
    else:
        render_dashboard()


if __name__ == "__main__":
    main()
