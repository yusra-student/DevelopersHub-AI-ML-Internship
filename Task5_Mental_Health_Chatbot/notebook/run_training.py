"""
Full end-to-end training script matching finetune_mental_health.ipynb
"""
import torch
print(f"PyTorch: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")

# ── 2. LOAD DATASET ──
from datasets import load_dataset
dataset = load_dataset("facebook/empathetic_dialogues", trust_remote_code=True)
print(f"\nTrain samples: {len(dataset['train'])}")
print(f"Val samples: {len(dataset['validation'])}")

# ── 3. PREPROCESS DATA ──
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("distilgpt2")
tokenizer.pad_token = tokenizer.eos_token
print(f"Pad token: {tokenizer.pad_token} (ID: {tokenizer.pad_token_id})")

from collections import defaultdict

def build_prompt_response_pairs(dataset_split):
    convs = defaultdict(list)
    for sample in dataset_split:
        convs[sample['conv_id']].append({
            'situation': sample['prompt'],
            'utterance': sample['utterance'],
        })
    pairs = []
    for conv_id, turns in convs.items():
        situation = turns[0]['situation'] if turns[0]['situation'] else ""
        for i in range(len(turns) - 1):
            prompt = turns[i]['utterance']
            response = turns[i + 1]['utterance']
            pairs.append({'situation': situation, 'prompt': prompt, 'response': response})
    return pairs

train_pairs = build_prompt_response_pairs(dataset['train'])
val_pairs = build_prompt_response_pairs(dataset['validation'])
print(f"Train pairs: {len(train_pairs)}, Val pairs: {len(val_pairs)}")

def format_pairs(pairs):
    texts = []
    for p in pairs:
        sit = p['situation'] if p['situation'] else "[No context]"
        text = f"Context: {sit}\nUser: {p['prompt']}\nResponse: {p['response']}"
        texts.append(text)
    return texts

train_texts = format_pairs(train_pairs)
val_texts = format_pairs(val_pairs)

print("=== Formatted example ===")
print(train_texts[0])

train_enc = tokenizer(train_texts, max_length=128, truncation=True, padding=False)
val_enc = tokenizer(val_texts, max_length=128, truncation=True, padding=False)

decoded = tokenizer.decode(train_enc['input_ids'][0], skip_special_tokens=True)
print("\n=== Tokenized example (decoded back) ===")
print(decoded)
print(f"Token count: {len(train_enc['input_ids'][0])} tokens")

from torch.utils.data import Dataset

class EmpatheticDataset(Dataset):
    def __init__(self, input_ids, attention_mask):
        self.input_ids = input_ids
        self.attention_mask = attention_mask
    def __len__(self):
        return len(self.input_ids)
    def __getitem__(self, idx):
        return {
            "input_ids": self.input_ids[idx],
            "attention_mask": self.attention_mask[idx],
            "labels": self.input_ids[idx],
        }

train_dataset = EmpatheticDataset(train_enc['input_ids'], train_enc['attention_mask'])
val_dataset = EmpatheticDataset(val_enc['input_ids'], val_enc['attention_mask'])
print(f"\nTrain dataset: {len(train_dataset)}, Val dataset: {len(val_dataset)}")

# ── 4. LOAD PRETRAINED MODEL ──
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("distilgpt2")
total_params = sum(p.numel() for p in model.parameters())
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"\n=== Model: DistilGPT2 ===")
print(f"Total parameters: {total_params:,}")
print(f"Trainable parameters: {trainable_params:,}")
print(f"Memory estimate: {total_params * 4 / 1e6:.1f} MB (fp32)")

device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)
print(f"Model device: {device}")

# ── 5. FINE-TUNE USING Trainer API ──
from transformers import TrainingArguments, Trainer
from torch.nn.utils.rnn import pad_sequence

# Custom collator: dynamically pad each batch to the longest sequence.
# In Transformers 5.x, DataCollatorForLanguageModeling internals changed,
# so we use a simple manual approach.
def data_collator(features):
    batch = {}
    batch["input_ids"] = pad_sequence(
        [torch.tensor(f["input_ids"], dtype=torch.long) for f in features],
        batch_first=True, padding_value=tokenizer.pad_token_id
    )
    batch["attention_mask"] = pad_sequence(
        [torch.tensor(f["attention_mask"], dtype=torch.long) for f in features],
        batch_first=True, padding_value=0
    )
    batch["labels"] = pad_sequence(
        [torch.tensor(f["labels"], dtype=torch.long) for f in features],
        batch_first=True, padding_value=-100  # ignore padding in loss
    )
    return batch

training_args = TrainingArguments(
    output_dir="./checkpoints",
    num_train_epochs=3,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    save_strategy="epoch",
    logging_steps=50,
    eval_strategy="epoch",
    report_to="none",
    save_total_limit=3,
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    greater_is_better=False,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    data_collator=data_collator,
    processing_class=tokenizer,
)

print("\n=== Starting Training ===")
train_result = trainer.train()

# Loss progression
logs = trainer.state.log_history
print("\n=== Training Loss Progression ===")
for entry in logs:
    if 'loss' in entry and 'eval_loss' not in entry:
        print(f"Step {entry['step']:>5d}: loss = {entry['loss']:.4f}")

print("\n=== Validation Loss Progression ===")
for entry in logs:
    if 'eval_loss' in entry:
        print(f"Epoch end: eval_loss = {entry['eval_loss']:.4f}")

# ── 6. BEFORE vs AFTER COMPARISON ──
original_model = AutoModelForCausalLM.from_pretrained("distilgpt2").to(device)

test_prompts = [
    "Context: I've been feeling really anxious about my upcoming exam\nUser: I can't stop worrying that I'll fail\nResponse:",
    "Context: I feel like I'm not good enough at my job\nUser: Everyone else seems to have it together except me\nResponse:",
    "Context: I had a fight with my best friend yesterday\nUser: I don't know if our friendship will survive this\nResponse:",
    "Context: I've been feeling lonely since I moved to a new city\nUser: I miss my old friends and haven't made new ones yet\nResponse:",
]

def generate_response(model, prompt, max_new_tokens=60):
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=True,
            temperature=0.7,
            pad_token_id=tokenizer.eos_token_id,
        )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

print("\n" + "=" * 60)
print("ORIGINAL DistilGPT2 Responses (before fine-tuning)")
print("=" * 60)
for i, prompt in enumerate(test_prompts, 1):
    response = generate_response(original_model, prompt)
    print(f"\nPrompt {i}:")
    print(f"  Response: {response}")

print("\n" + "=" * 60)
print("FINE-TUNED DistilGPT2 Responses")
print("=" * 60)
for i, prompt in enumerate(test_prompts, 1):
    response = generate_response(model, prompt)
    print(f"\nPrompt {i}:")
    print(f"  Response: {response}")

print("\n" + "=" * 60)
print("BEFORE vs AFTER (side-by-side)")
print("=" * 60)
for i, prompt in enumerate(test_prompts, 1):
    orig = generate_response(original_model, prompt)
    fine = generate_response(model, prompt)
    print(f"\nPrompt {i}:")
    print(f"  BEFORE: {orig}")
    print(f"  AFTER:  {fine}")

# ── 7. SAVE THE MODEL ──
import os
save_dir = r"D:\DevelopersHub-AI-ML-Internship\Task5_Mental_Health_Chatbot\model\fine_tuned_model"
os.makedirs(save_dir, exist_ok=True)

model.save_pretrained(save_dir)
tokenizer.save_pretrained(save_dir)

print(f"\n=== Model saved to {save_dir} ===")
for f in sorted(os.listdir(save_dir)):
    size = os.path.getsize(os.path.join(save_dir, f))
    print(f"  {f}  ({size/1024:.1f} KB)")

print("\n=== DONE ===")
