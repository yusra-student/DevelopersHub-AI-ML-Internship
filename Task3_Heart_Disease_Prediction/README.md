# CardioSentry AI — Heart Disease Prediction

A full-stack heart disease prediction application using Logistic Regression and Decision Tree models.

## Project Structure

```
Task3_Heart_Disease_Prediction/
├── backend/                  # FastAPI ML service
│   ├── main.py               # API server with /predict, /eda-summary, /feature-importance, /metrics
│   ├── train_model.py        # Trains both models, runs EDA, saves artifacts
│   ├── requirements.txt      # Python dependencies
│   ├── data/heart.csv        # UCI Heart Disease dataset
│   ├── models/               # Trained .pkl files (loaded at startup)
│   └── eda_output/           # EDA visualizations (PNG)
├── frontend/                 # Next.js (App Router) UI
│   ├── app/
│   │   ├── page.tsx          # Main page orchestrating all components
│   │   ├── VitalsForm.tsx    # 13-field patient form with Urdu labels
│   │   ├── BmiBar.tsx        # Live BMI scale
│   │   ├── VoiceInput.tsx    # Web Speech API (en-US / ur-PK)
│   │   ├── RiskGauge.tsx     # SVG semi-circle gauge
│   │   ├── ModelComparison.tsx # Side-by-side model metrics + confusion matrices
│   │   ├── RadarChart.tsx    # SVG radar (patient vs healthy baseline)
│   │   ├── HistoryList.tsx   # localStorage, capped at 20
│   │   ├── EcgStrip.tsx      # Animated ECG canvas
│   │   ├── globals.css       # Tailwind v4 + print styles
│   │   ├── layout.tsx        # Root layout (Fraunces + Inter fonts)
│   │   └── api/              # Next.js API route proxies to FastAPI
│   ├── package.json
│   └── next.config.ts
└── README.md
```

## Run Commands

### 1. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The API is available at `http://127.0.0.1:8000`.

Endpoints:
- `GET  /` — health check
- `POST /predict` — predict heart disease probability
- `GET  /eda-summary` — correlation numbers and dataset stats
- `GET  /feature-importance` — both models' feature importance
- `GET  /metrics` — accuracy, precision, recall, F1, ROC-AUC

### 2. Frontend (Next.js)

Open a **separate terminal** and run:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in a browser.

### 3. Sample /predict Request

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age": 54, "sex": 1, "cp": 0, "trestbps": 130,
    "chol": 240, "fbs": 0, "restecg": 1, "thalach": 150,
    "exang": 0, "oldpeak": 1.5, "slope": 2, "ca": 0, "thal": 2
  }'
```

Example response:

```json
{
  "logistic_probability": 0.5217,
  "tree_probability": 0.9444,
  "model_agreement": true,
  "top_factors": [
    "Number of Colored Major Vessels (ca)",
    "Exercise Induced Angina",
    "ST Slope"
  ]
}
```

## Notes

- Models are trained by `train_model.py` and saved as `.pkl` files under `backend/models/`.
- The FastAPI server loads all artifacts at startup — no retraining per request.
- CORS is enabled for development (allow all origins).
- The frontend proxies all API calls through Next.js route handlers (`/app/api/*/route.ts`).
- The medical disclaimer (English + Urdu) is displayed on every page — this is an educational project.
