import gradio as gr
from chatbot_core import (
    load_model, generate_response, format_chat_prompt,
    detect_crisis, CRISIS_RESPONSE
)

model, tokenizer, device = load_model()

def chat(message, history, situation):
    if detect_crisis(message):
        return CRISIS_RESPONSE

    prompt = format_chat_prompt(situation, message)
    response = generate_response(model, tokenizer, device, prompt)
    return response

with gr.Blocks(
    title="Mental Health Support Chatbot",
    theme=gr.themes.Soft(),
    css="""
    .crisis-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; border-radius: 6px; margin-bottom: 12px; }
    .disclaimer { font-size: 12px; color: #666; text-align: center; margin-top: 8px; }
    """
) as demo:
    gr.Markdown("# 🫂 Mental Health Support Chatbot")
    gr.Markdown(
        "This chatbot is fine-tuned to respond with empathy and emotional awareness. "
        "It is **not** a replacement for professional mental health support."
    )

    with gr.Row():
        situation_input = gr.Textbox(
            label="Your situation (optional)",
            placeholder="e.g. I've been feeling stressed about work lately...",
            lines=2,
        )

    chatbot = gr.ChatInterface(
        fn=chat,
        additional_inputs=[situation_input],
        title=None,
        description=None,
        examples=[
            ["I've been feeling really anxious about my exam tomorrow"],
            ["I feel like I'm not good enough at my job"],
            ["I had a fight with my best friend and I don't know what to do"],
        ],
    )

    gr.Markdown(
        '> **⚠️ Important:** If you are experiencing a crisis, please call or text **988** '
        '(Suicide & Crisis Lifeline) or text **HOME** to **741741** (Crisis Text Line).',
        elem_classes="disclaimer"
    )

if __name__ == "__main__":
    demo.launch(share=False)
