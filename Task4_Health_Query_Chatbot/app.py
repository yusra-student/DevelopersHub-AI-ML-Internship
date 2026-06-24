"""
app.py — Gradio chat UI for the Health Query Chatbot.

Why a separate file?
Chatbot logic lives in chatbot_core.py so you can reuse it from a
notebook, CLI script, or web framework without duplicating code.
This file only handles the UI layer.
"""

import os

import gradio as gr
from dotenv import load_dotenv

from chatbot_core import ask_health_bot, reset_conversation

# ---------------------------------------------------------------------------
# Load optional HF_TOKEN from .env
# ---------------------------------------------------------------------------
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Prefer GEMINI_API_KEY over GOOGLE_API_KEY to avoid stale keys
os.environ.pop("GOOGLE_API_KEY", None)
if not GEMINI_API_KEY:
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")


# ---------------------------------------------------------------------------
# Avatar helper — writes small SVG circles to temp files (Gradio 6 needs
# real file paths, not data URIs)
# ---------------------------------------------------------------------------
import tempfile


def _write_avatar_svg(emoji: str, bg: str) -> str:
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        f'<circle cx="50" cy="50" r="48" fill="{bg}"/>'
        f'<text x="50" y="68" font-size="44" text-anchor="middle" '
        f'fill="white">{emoji}</text></svg>'
    )
    fd, path = tempfile.mkstemp(suffix=".svg")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(svg)
    return path


USER_AVATAR = _write_avatar_svg("\U0001f9d1", "#1d4f91")
BOT_AVATAR = _write_avatar_svg("\U0001fa7a", "#2563ab")


# ---------------------------------------------------------------------------
# HTML snippets for header, disclaimer & footer
# ---------------------------------------------------------------------------
HEADER_HTML = """
<div class="ch-header">
    <div class="ch-header-icon">\U0001fa7a</div>
    <div class="ch-header-body">
        <div class="ch-header-title">CareLine Health Assistant</div>
        <div class="ch-header-subtitle">
            <span class="pulse-dot"></span>
            Online \u00b7 Educational guidance
        </div>
    </div>
</div>
"""

DISCLAIMER_HTML = """
<div class="ch-disclaimer">
    <span class="ch-disclaimer-icon">\U0001f6e1\ufe0f</span>
    <span class="ch-disclaimer-text">
        Educational information only \u2014 not a diagnosis.
        Always consult a qualified doctor for medical concerns.
    </span>
</div>
"""

FOOTER_HTML = """
<div class="ch-footer">
    \U0001f310 EN / UR \u00b7 \U0001f512 No data stored \u00b7 \u26a1 Demo build
</div>
"""


# ---------------------------------------------------------------------------
# Custom CSS
# ---------------------------------------------------------------------------
CUSTOM_CSS = r"""
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* ---- Page background ---- */
body {
    background-color: #f1f5f9 !important;
    font-family: 'Inter', Arial, sans-serif !important;
}

/* ---- Centered card container ---- */
.gradio-container {
    max-width: 560px !important;
    margin: 0 auto !important;
    padding: 0 !important;
    background: #ffffff;
    border-radius: 18px !important;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08) !important;
    border: 1px solid #e2e8f0 !important;
    overflow: hidden !important;
}

.gradio-container .main {
    padding: 0 !important;
    background: transparent !important;
    font-family: 'Inter', Arial, sans-serif !important;
}

/* ---- Header ---- */
.ch-header {
    background: linear-gradient(135deg, #1d4f91 0%, #2563ab 100%);
    padding: 24px 28px;
    display: flex;
    align-items: center;
    gap: 16px;
    color: #ffffff;
}

.ch-header-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
}

.ch-header-title {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.01em;
}

.ch-header-subtitle {
    font-size: 13px;
    opacity: 0.85;
    margin-top: 2px;
    display: flex;
    align-items: center;
    gap: 6px;
}

/* ---- Pulse dot animation ---- */
.pulse-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: #22c55e;
    border-radius: 50%;
    animation: pulse-dot 2s ease-in-out infinite;
    flex-shrink: 0;
}

@keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
}

/* ---- Disclaimer banner ---- */
.ch-disclaimer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background-color: #f0f6ff;
    border-bottom: 1px solid #e2e8f0;
    font-size: 12px;
    color: #64748b;
    line-height: 1.4;
}

.ch-disclaimer-icon {
    font-size: 14px;
    flex-shrink: 0;
}

.ch-disclaimer-text {
    flex: 1;
}

/* ---- Chatbot display area (no top rounding — header handles it) ---- */
[data-testid="chatbot"] {
    border-radius: 0 !important;
    border: none !important;
    border-bottom: 1px solid #e2e8f0 !important;
    box-shadow: none !important;
    background-color: #ffffff !important;
}

/* ---- User message bubble ---- */
.message.user,
[data-testid="user"] .message {
    background-color: #1d4f91 !important;
    color: #ffffff !important;
    border-radius: 18px 18px 4px 18px !important;
}

/* ---- Bot message bubble ---- */
.message.bot,
[data-testid="bot"] .message {
    background-color: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 18px 18px 18px 4px !important;
    color: #1e293b !important;
}

/* ---- Avatar images (round circles) ---- */
img.avatar-image,
img[alt="avatar"],
.chatbot-avatar img,
[data-testid="chatbot"] img[src*="data:image/svg+xml"] {
    border-radius: 50% !important;
    width: 40px !important;
    height: 40px !important;
    object-fit: cover !important;
}

/* ---- Input textbox (pill shape) ---- */
textarea, input[type="text"], .gr-text-input {
    border-radius: 24px !important;
    background-color: #f1f5f9 !important;
    border: 1px solid #cbd5e1 !important;
    padding: 10px 20px !important;
    font-family: 'Inter', Arial, sans-serif !important;
}

textarea:focus, input[type="text"]:focus, .gr-text-input:focus {
    border-color: #1d4f91 !important;
    box-shadow: 0 0 0 3px rgba(29, 79, 145, 0.15) !important;
    background-color: #f8fafc !important;
}

/* ---- Send button (circular) ---- */
.chatbot-input .gr-button,
.chat-input-container .gr-button,
.form .gr-button:last-child {
    border-radius: 50% !important;
    min-width: 44px !important;
    min-height: 44px !important;
    width: 44px !important;
    height: 44px !important;
    padding: 0 !important;
    background-color: #1d4f91 !important;
    border: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #ffffff !important;
    box-shadow: 0 2px 8px rgba(29, 79, 145, 0.3) !important;
    transition: all 0.2s ease !important;
}

.chatbot-input .gr-button:hover,
.chat-input-container .gr-button:hover,
.form .gr-button:last-child:hover {
    background-color: #2563eb !important;
    box-shadow: 0 4px 14px rgba(29, 79, 145, 0.4) !important;
    transform: scale(1.05);
}

.chatbot-input .gr-button svg,
.chat-input-container .gr-button svg,
.form .gr-button:last-child svg {
    fill: #ffffff !important;
    width: 20px !important;
    height: 20px !important;
}

/* ---- Footer ---- */
.ch-footer {
    text-align: center;
    padding: 14px 20px;
    font-size: 12px;
    color: #94a3b8;
    background-color: #ffffff;
}
"""


# ---------------------------------------------------------------------------
# Custom Theme
# ---------------------------------------------------------------------------
custom_theme = gr.themes.Soft(
    primary_hue=gr.themes.Color(
        c50="#eff6ff",
        c100="#dbeafe",
        c200="#bfdbfe",
        c300="#93c5fd",
        c400="#60a5fa",
        c500="#2563eb",
        c600="#1d4f91",
        c700="#1e40af",
        c800="#1e3a8a",
        c900="#0f172a",
        c950="#0c1222",
    ),
    font=gr.themes.GoogleFont("Inter"),
    font_mono=gr.themes.GoogleFont("Inter"),
).set(
    body_background_fill="#f1f5f9",
    body_background_fill_dark="#f1f5f9",
    background_fill_primary="#ffffff",
    block_background_fill="#ffffff",
    block_border_color="#e2e8f0",
    block_radius="18px",
    button_primary_background_fill="#1d4f91",
    button_primary_background_fill_hover="#2563eb",
    button_primary_border_color="transparent",
    button_primary_text_color="#ffffff",
    input_background_fill="#f1f5f9",
    input_border_color="#cbd5e1",
    input_radius="24px",
)


# ---------------------------------------------------------------------------
# Chat callback
# ---------------------------------------------------------------------------
def respond(message: str, history: list) -> str:
    return ask_health_bot(message, hf_token=HF_TOKEN, gemini_api_key=GEMINI_API_KEY)


# ---------------------------------------------------------------------------
# UI — Gradio Blocks (centered-widget layout)
# ---------------------------------------------------------------------------
with gr.Blocks(title="CareLine Health Assistant") as demo:
    with gr.Column(elem_classes="app-col"):
        gr.HTML(HEADER_HTML)
        gr.HTML(DISCLAIMER_HTML)

        gr.ChatInterface(
            fn=respond,
            chatbot=gr.Chatbot(avatar_images=(USER_AVATAR, BOT_AVATAR)),
        )

        gr.HTML(FOOTER_HTML)


if __name__ == "__main__":
    reset_conversation()
    demo.launch(theme=custom_theme, css=CUSTOM_CSS)
