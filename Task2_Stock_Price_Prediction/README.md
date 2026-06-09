# 📈 Task 2: Stock Price Prediction Using Machine Learning

## 🎯 Task Objective
The objective of this task is to build a machine learning model to predict the future closing price of **Apple Inc. (AAPL)** based on historical data. This project demonstrates skills in financial data acquisition, time-series preprocessing, and applying regression algorithms for forecasting.

## 📊 Dataset Overview
- **Stock Ticker:** AAPL (Apple Inc.)
- **Source:** Yahoo Finance (via `yfinance` library)
- **Period:** January 1, 2020, to January 1, 2024
- **Features:** Open, High, Low, Volume
- **Target Variable:** Next day's Closing Price

## 🤖 Models Applied
1.  **Linear Regression:** Established a mathematical baseline using linear combinations of daily features.
2.  **Random Forest Regressor:** An ensemble method using 100 decision trees to capture non-linear market trends and volatility.

## 🏆 Results Summary
After training and testing on a chronological 80/20 split:
- **Random Forest** significantly outperformed Linear Regression in capturing the stock's price movements.
- **Key Metrics:**
    - Mean Absolute Error (MAE)
    - Root Mean Squared Error (RMSE)
    - R2 Score (Accuracy measure)
- Detailed comparisons and "Actual vs. Predicted" plots are available in the `plots/` folder and within the notebook.

## 📂 Folder Structure
- `notebook/`: Contains `stock_prediction.ipynb` (Fully executed).
- `plots/`: PNG visualizations including historical trends, heatmaps, and model results.
- `requirements.txt`: Python dependencies.
- `README.md`: Task documentation (this file).

## 🛠️ How to Run
1.  **Install Requirements:**
    ```bash
    pip install -r requirements.txt
    ```
2.  **Open the Notebook:**
    ```bash
    jupyter notebook notebook/stock_prediction.ipynb
    ```
3.  **Run All Cells:** All data is fetched dynamically via the `yfinance` API.

---
**DevelopersHub AI/ML Engineering Internship**  
*Task 2 Submission*
