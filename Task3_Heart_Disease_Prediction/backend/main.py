import os
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib

# Initialize FastAPI App
app = FastAPI(
    title="Heart Disease Prediction API",
    description="FastAPI service for predicting heart disease presence using Logistic Regression and Decision Tree models.",
    version="1.0.0"
)

# Enable CORS for local Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the client origin (e.g., http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Global variables to store loaded models/artifacts
model_logreg = None
model_tree = None
scaler = None
metrics = None
eda_summary = None
feature_importance = None

@app.on_event("startup")
def load_artifacts():
    global model_logreg, model_tree, scaler, metrics, eda_summary, feature_importance
    try:
        print("Loading ML models and precomputed summaries...")
        model_logreg = joblib.load(os.path.join(MODELS_DIR, "model_logreg.pkl"))
        model_tree = joblib.load(os.path.join(MODELS_DIR, "model_tree.pkl"))
        scaler = joblib.load(os.path.join(MODELS_DIR, "scaler.pkl"))
        metrics = joblib.load(os.path.join(MODELS_DIR, "metrics.pkl"))
        eda_summary = joblib.load(os.path.join(MODELS_DIR, "eda_summary.pkl"))
        feature_importance = joblib.load(os.path.join(MODELS_DIR, "feature_importance.pkl"))
        print("All artifacts loaded successfully!")
    except Exception as e:
        print(f"Error loading model artifacts: {e}")
        raise RuntimeError(f"Could not initialize models. Make sure train_model.py has run successfully. Error: {e}")

# Define request schema matching the 13 raw input features
class PatientVitals(BaseModel):
    age: int = Field(..., description="Age in years", ge=1, le=120)
    sex: int = Field(..., description="Sex (1 = male, 0 = female)", ge=0, le=1)
    cp: int = Field(..., description="Chest pain type (0-3)", ge=0, le=3)
    trestbps: int = Field(..., description="Resting blood pressure in mm Hg", ge=50, le=250)
    chol: int = Field(..., description="Serum cholesterol in mg/dl", ge=100, le=600)
    fbs: int = Field(..., description="Fasting blood sugar > 120 mg/dl (1 = true, 0 = false)", ge=0, le=1)
    restecg: int = Field(..., description="Resting electrocardiographic results (0-2)", ge=0, le=2)
    thalach: int = Field(..., description="Maximum heart rate achieved", ge=60, le=220)
    exang: int = Field(..., description="Exercise induced angina (1 = yes, 0 = no)", ge=0, le=1)
    oldpeak: float = Field(..., description="ST depression induced by exercise relative to rest", ge=0.0, le=10.0)
    slope: int = Field(..., description="The slope of the peak exercise ST segment (0-2)", ge=0, le=2)
    ca: int = Field(..., description="Number of major vessels (0-4) colored by fluoroscopy", ge=0, le=4)
    thal: int = Field(..., description="Thalassemia (0-3)", ge=0, le=3)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Heart Disease Prediction FastAPI Service is active.",
        "project": "Task 3 DevelopersHub Internship",
        "developer": "Yusra Waheed (Virtual University Student)"
    }

@app.get("/eda-summary")
def get_eda_summary():
    """Exposes data profiling and EDA summary cached from train.py."""
    if eda_summary is None:
        raise HTTPException(status_code=503, detail="EDA Summary not loaded.")
    return eda_summary

@app.get("/feature-importance")
def get_feature_importance():
    """Exposes coefficients (Logistic Regression) and Gini Importance (Decision Tree) for comparison."""
    if feature_importance is None:
        raise HTTPException(status_code=503, detail="Feature Importance data not loaded.")
    return feature_importance

@app.get("/metrics")
def get_metrics():
    """Exposes accuracy, precision, recall, F1, and confusion matrices for both models."""
    if metrics is None:
        raise HTTPException(status_code=503, detail="Model metrics not loaded.")
    return metrics

@app.post("/predict")
def predict(vitals: PatientVitals):
    """
    Accepts patient vitals, scales inputs for Logistic Regression,
    runs prediction on both models, and computes risk probability, agreement, and top factors.
    """
    if model_logreg is None or model_tree is None or scaler is None:
        raise HTTPException(status_code=503, detail="Model models or scaler are not loaded.")

    # Convert request data to DataFrame to maintain proper feature names
    data_dict = vitals.model_dump()
    df_features = pd.DataFrame([data_dict])

    try:
        # 1. Scale input for Logistic Regression
        scaled_features = scaler.transform(df_features)
        logistic_prob = float(model_logreg.predict_proba(scaled_features)[0][1])
        logistic_pred = int(model_logreg.predict(scaled_features)[0])

        # 2. Raw input for Decision Tree
        tree_prob = float(model_tree.predict_proba(df_features)[0][1])
        tree_pred = int(model_tree.predict(df_features)[0])

        # 3. Model Agreement check
        agreement = (logistic_pred == tree_pred)

        # 4. Extract top risk factors using Logistic Regression coefficients
        # Calculate individual feature contributions: scaled_val * coefficient
        coefs = model_logreg.coef_[0]
        contributions = scaled_features[0] * coefs
        
        # Match features with their contribution score
        feature_names = df_features.columns.tolist()
        contrib_mapping = list(zip(feature_names, contributions))
        
        # Sort by contribution value in descending order (highest risk drivers first)
        # Note: Features with positive contributions are pushing the risk up.
        # Even if a coefficient is positive, if the scaled value is negative (below average),
        # it might reduce the risk contribution. Thus, scaled_val * coef is the true prediction contribution.
        contrib_mapping_sorted = sorted(contrib_mapping, key=lambda x: x[1], reverse=True)
        
        # Provide user-friendly display labels for the top risk drivers
        friendly_labels = {
            "age": "Age",
            "sex": "Biological Sex",
            "cp": "Chest Pain Type (cp)",
            "trestbps": "Resting Blood Pressure",
            "chol": "Serum Cholesterol",
            "fbs": "Fasting Blood Sugar",
            "restecg": "Resting ECG Results",
            "thalach": "Max Heart Rate Achieved",
            "exang": "Exercise Induced Angina",
            "oldpeak": "ST Depression (oldpeak)",
            "slope": "ST Slope",
            "ca": "Number of Colored Major Vessels (ca)",
            "thal": "Thalassemia Type (thal)"
        }
        
        # Get top 3 factors that push the risk up the most
        # (or just top 3 features by absolute contribution if all are negative)
        top_factors = [friendly_labels[name] for name, score in contrib_mapping_sorted[:3]]

        return {
            "logistic_probability": round(logistic_prob, 4),
            "logistic_prediction": logistic_pred,
            "tree_probability": round(tree_prob, 4),
            "tree_prediction": tree_pred,
            "model_agreement": agreement,
            "top_factors": top_factors,
            "interpretation": {
                "risk_category": "Elevated Risk" if (logistic_prob >= 0.5 or tree_prob >= 0.5) else "Normal Risk",
                "clinical_message": (
                    "Warning: Vitals show elevated markers correlated with heart disease. "
                    "Further screening recommended."
                    if (logistic_prob >= 0.5 or tree_prob >= 0.5)
                    else "Vitals are within typical boundaries based on reference models."
                )
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
