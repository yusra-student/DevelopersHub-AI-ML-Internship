# Health Query Chatbot — Task 4

## Objective

Build an LLM-powered chatbot that answers **general health questions** in a safe, educational, and reassuring way. The chatbot must **never** give medical diagnoses, exact medication dosages, or crisis advice — it redirects those to real doctors or crisis helplines.

## Tools & Tech

| Tool | Purpose |
|---|---|
| **Python 3.10+** | Language |
| **Hugging Face Inference API** | Free LLM backend (Mistral-7B-Instruct) |
| **Gradio 4+** | Web UI (ChatInterface) |
| **python-dotenv** | Load environment variables from `.env` |
| **Jupyter Notebook** | Interactive demo with inline examples |

## Features

### 1. Safety Filter (Pre-LLM)
Runs *before* calling the API — saves cost, responds instantly, and prevents the model from ever seeing harmful prompts.

- **Crisis detection** — keywords like "suicide", "self-harm", "overdose" → returns a fixed helpline message immediately (no LLM call).
- **Dosage/diagnosis flagging** — keywords like "how many mg", "diagnose" → injects an extra safety instruction into the system prompt reminding the model to redirect to a doctor.

### 2. Conversation Memory
Maintains a sliding window of the last 4 messages, so the model can answer follow-up questions like "how long does it last?" after asking about a condition.

### 3. Logging
Every question + answer + timestamp is appended to `chat_logs.json` for transparency and debugging. No personal data is collected.

### 4. Gradio UI (app.py)
A clean, browser-based chat interface with the disclaimer always visible. Launch with:

```bash
python app.py
```

### 5. Modular Design
Logic (`chatbot_core.py`), UI (`app.py`), and demo notebook (`health_chatbot.ipynb`) are separate files. You can reuse `ask_health_bot()` from any Python environment.

## Example Queries & Safety Filter Behaviour

| Query | Expected Behaviour |
|---|---|
| "What causes a sore throat?" | General educational answer + disclaimer |
| "Is paracetamol safe for children?" | Educational info + redirect to doctor |
| "What are common symptoms of dehydration?" | Symptoms list + disclaimer |
| "I have a mild headache, what can help?" | General self-care tips + disclaimer |
| "I want to end my life, what should I do?" | **Crisis helpline message** (no LLM call, safety filter triggers) |
| "How many mg of ibuprofen should I take?" | **Redirects to doctor** (dosage flag injects extra guardrails) |
| "How long does it usually last?" (after asking about sore throat) | **Uses conversation memory** to answer in context |

## How to Run

### Option A — Jupyter Notebook

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Launch the notebook
jupyter notebook health_chatbot.ipynb
# or
jupyter lab health_chatbot.ipynb
```

Run all cells to see the 7 example interactions, then use the interactive CLI loop at the bottom.

### Option B — Gradio Web UI

```bash
pip install -r requirements.txt
python app.py
```

Opens a browser tab with a chat interface. The disclaimer is visible above the chat area.

### Option C — Import in Your Own Script

```python
from chatbot_core import ask_health_bot, reset_conversation

reset_conversation()
response = ask_health_bot("What causes a sore throat?")
print(response)
```

## Environment Variables

Copy `.env.example` to `.env` and optionally add your Hugging Face token:

```bash
cp .env.example .env
```

The `HF_TOKEN` is **optional** — the free tier works without it, but providing a token gives better rate limits.

> ⚠️ **IMPORTANT:** Before pushing to GitHub, make sure `.env` and `chat_logs.json` are in `.gitignore` (they already are in this repo's root `.gitignore`).

## Disclaimer

**This chatbot provides general health information for educational purposes only. It does NOT provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for personal medical concerns.**

---

*Task 4 — General Health Query Chatbot*
*AI/ML Internship — DevelopersHub*
