# Fine-Tuned DistilGPT2 Model

This directory contains the fine-tuned DistilGPT2 model for empathetic mental health support.

## Getting the model weights

The model weights (`model.safetensors`, ~320 MB) are not stored in git due to size.

### Option 1: Download from Hugging Face (coming soon)
The model may be uploaded to Hugging Face Model Hub.

### Option 2: Train it yourself in Colab
1. Open `notebook/finetune_mental_health.ipynb` in Google Colab
2. Set runtime to **T4 GPU** (Runtime → Change runtime type)
3. Run all cells (~20 minutes)
4. The model will save to this directory automatically

### Option 3: Use the base model (fallback)
The app (`app.py`) automatically falls back to the base `distilgpt2` if the fine-tuned weights are missing — you can run the chat interface right away without fine-tuning.

## Files
- `config.json` — Model configuration
- `generation_config.json` — Generation parameters
- `tokenizer.json` — Tokenizer vocabulary
- `tokenizer_config.json` — Tokenizer configuration
- `README.md` — This file
