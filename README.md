# AI Study Buddy – Personal AI Tutor

An intelligent personal AI tutor designed to help students understand difficult subjects, solve mathematical and programming problems step by step, explore real-world examples, simplify complex concepts, and practice with instant AI feedback.

---

## Features

1. **AI Doubt Solver** — Ask any academic question and receive clear, structured explanations.
2. **Learning Mode** — Switch dynamically between **Beginner**, **Intermediate**, and **Advanced** depths.
3. **Subject Selection** — Mathematics, Physics, Chemistry, Computer Science, Programming, Artificial Intelligence, English, and General Subjects.
4. **AI Chat Tutor** — Multi-turn interactive conversation with follow-up questions and chat history.
5. **Step-by-Step Solver** — Breaks down mathematical and programming problems into numbered steps rather than giving only a final answer.
6. **Example Generator** — One-click generation of 3 real-world examples for the topic.
7. **Practice Mode** — Generates 3 tailored practice questions, lets you write your answers, and provides constructive AI evaluation and model solutions.
8. **Explain Simply** — Re-explains difficult concepts in simple, everyday language with analogies.
9. **Study Dashboard** — Tracks topics studied, questions asked, recently studied subjects, and session history.
10. **Copy-Friendly Answers & Session Reset** — Copy answers/code blocks in one click, clear chat, or reset the entire session.

---

## Running the Python + Streamlit App in VS Code

### 1. Install Python
1. Download Python **3.10 or newer** from [python.org/downloads](https://www.python.org/downloads/).
2. On Windows, check **"Add Python to PATH"** during installation.
3. Verify installation in the VS Code terminal:
   ```bash
   python --version
   ```

### 2. Create a Virtual Environment & Install Dependencies
Open the project folder in **VS Code**, open the integrated terminal (`Ctrl + \``), and run:

```bash
# Create virtual environment
python -m venv .venv

# Activate on Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Activate on macOS / Linux
source .venv/bin/activate

# Install Python packages
pip install -r requirements.txt
```

### 3. Configure Your Gemini API Key
1. Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and replace `MY_GEMINI_API_KEY` with your real key:
   ```env
   GEMINI_API_KEY="your-actual-gemini-api-key"
   ```
   > **Security note:** `.env` is ignored by `.gitignore`. Never hardcode or commit your API key.

### 4. Run the Streamlit Application
```bash
streamlit run app.py
```
Streamlit will open automatically in your browser at `http://localhost:8501`.

---

## Sample Questions to Test

- **Mathematics (Step-by-Step Solver):** `Solve 2x^2 - 5x - 3 = 0 step by step using factoring and the quadratic formula.`
- **Programming:** `Write and trace a recursive Python function for binary search step by step.`
- **Physics:** `Explain Newton's Second Law with a real-world elevator acceleration problem.`
- **Artificial Intelligence:** `How does gradient descent minimize a loss function? Explain it in Beginner mode, then click Explain Simply.`
- **Chemistry:** `Balance Fe + O2 -> Fe2O3 and explain why each coefficient is needed.`
