# Task 2: Stock Price Prediction Using Machine Learning

## Task Objective
The objective of this task is to build a machine learning model to predict the future closing price of a stock (AAPL) based on historical data. This project demonstrates data acquisition, preprocessing, exploratory data analysis, and the application of regression models for financial forecasting.

## Dataset Used
- **Stock:** Apple Inc. (AAPL)
- **Source:** Yahoo Finance (via `yfinance` library)
- **Period:** 2020-01-01 to 2024-01-01

## Models Applied
1. **Linear Regression:** A fundamental regression algorithm that assumes a linear relationship between features and the target variable.
2. **Random Forest Regressor:** An ensemble learning method that uses multiple decision trees to improve prediction accuracy and handle non-linear relationships.

## Results Summary
- Both models were evaluated using Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and R2 Score.
- Random Forest generally captures non-linear trends better, while Linear Regression provides a strong baseline.
- Detailed performance comparison is available in the notebook and the comparison plots.

## Folder Structure
- `notebook/`: Contains the `stock_prediction.ipynb` Jupyter Notebook.
- `plots/`: Contains all generated visualizations (PNG format).
- `requirements.txt`: List of required Python libraries.
- `README.md`: Project overview and instructions.

## How to Run the Notebook
1. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Navigate to the `notebook/` directory.
3. Launch Jupyter Notebook:
   ```bash
   jupyter notebook
   ```
4. Open `stock_prediction.ipynb` and run all cells.

## Requirements
- Python 3.8+
- yfinance
- pandas
- numpy
- matplotlib
- seaborn
- scikit-learn
- jupyter
