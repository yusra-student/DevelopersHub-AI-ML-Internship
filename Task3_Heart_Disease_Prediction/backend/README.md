---
title: Heart Disease Prediction API
emoji: ❤️
colorFrom: red
colorTo: pink
sdk: docker
pinned: false
app_port: 7860
---

# Heart Disease Prediction API

FastAPI backend for heart disease prediction using Logistic Regression & Decision Tree models.

## API Endpoints

- `GET /` - Health check
- `POST /predict` - Predict heart disease risk from patient vitals
- `GET /metrics` - Model performance metrics
- `GET /eda-summary` - EDA statistics
- `GET /feature-importance` - Feature importance from both models
