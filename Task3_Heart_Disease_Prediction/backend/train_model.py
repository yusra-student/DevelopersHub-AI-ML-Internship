import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_curve, auc
import joblib

def main():
    # Setup paths
    base_dir = r"D:\DevelopersHub-AI-ML-Internship\Task3_Heart_Disease_Prediction\backend"
    data_path = os.path.join(base_dir, "data", "heart.csv")
    eda_dir = os.path.join(base_dir, "eda_output")
    models_dir = os.path.join(base_dir, "models")
    
    os.makedirs(eda_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)
    
    print("==================================================")
    print("STEP 1: LOADING & INSPECTING DATASET")
    print("==================================================")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")
        
    df = pd.read_csv(data_path)
    print(f"Dataset Shape: {df.shape}")
    print("\nData Types and Missing Values:")
    print(df.info())
    
    # --- CLEANING: Missing values ---
    # Why median instead of mean? Median is robust to outliers.
    # Mean gets pulled by extreme values (e.g., a chol of 600+), which then skews
    # the entire column's distribution. Median splits the data in half and is
    # unaffected by extreme tails — safer for medical features.
    missing_before = df.isnull().sum()
    print("\nMissing values BEFORE cleaning:")
    print(missing_before[missing_before > 0] if missing_before.any() else "  None — dataset is fully complete.")
    for col in df.select_dtypes(include=[np.number]).columns:
        df[col] = df[col].fillna(df[col].median())
    missing_after = df.isnull().sum()
    print("\nMissing values AFTER median fill:")
    print(missing_after[missing_after > 0] if missing_after.any() else "  None — all missing values handled.")
    
    # --- CLEANING: Duplicates ---
    # Duplicates artificially inflate the dataset size and can cause data leakage
    # (same patient appearing in both train and test sets), leading to over-optimistic
    # evaluation. We remove them before any split.
    dup_count = df.duplicated().sum()
    print(f"\nDuplicate rows found: {dup_count}")
    if dup_count > 0:
        df = df.drop_duplicates()
        print(f"Dropped {dup_count} duplicates. New shape: {df.shape}")
    
    print("\nTarget Class Distribution:")
    print(df['target'].value_counts())
    
    # ----------------------------------------------------
    # STEP 2: EXPLORATORY DATA ANALYSIS (EDA)
    # ----------------------------------------------------
    print("\n==================================================")
    print("STEP 2: RUNNING EXPLORATORY DATA ANALYSIS (EDA)")
    print("==================================================")
    
    # Set plotting style
    sns.set_theme(style="whitegrid")
    
    # 1. Target class distribution (countplot)
    plt.figure(figsize=(6, 5))
    ax = sns.countplot(x='target', hue='target', data=df, palette={0: '#2E7D32', 1: '#D84315', '0': '#2E7D32', '1': '#D84315'}, legend=False)
    plt.title('Target Class Distribution\n(0 = No Heart Disease, 1 = Heart Disease Presence)', fontsize=12, fontweight='bold')
    plt.xlabel('Target Class', fontsize=10)
    plt.ylabel('Patient Count', fontsize=10)
    # Add counts above bars
    for p in ax.patches:
        ax.annotate(f'{int(p.get_height())}', (p.get_x() + p.get_width() / 2., p.get_height() - 40),
                    ha='center', va='center', color='white', fontweight='bold', xytext=(0, 8),
                    textcoords='offset points')
    plt.tight_layout()
    plt.savefig(os.path.join(eda_dir, 'target_distribution.png'), dpi=300)
    plt.close()
    print("- Saved target_distribution.png")

    # 2. Age distribution split by target (histogram + KDE)
    plt.figure(figsize=(9, 5))
    sns.histplot(data=df, x='age', hue='target', kde=True, bins=20, 
                 palette={0: '#2E7D32', 1: '#D84315', '0': '#2E7D32', '1': '#D84315'}, multiple='layer', alpha=0.5)
    plt.title('Age Distribution Split by Heart Disease Target', fontsize=12, fontweight='bold')
    plt.xlabel('Age (Years)', fontsize=10)
    plt.ylabel('Count / Frequency', fontsize=10)
    plt.legend(title='Heart Disease', labels=['Present (1)', 'Absent (0)'])
    plt.tight_layout()
    plt.savefig(os.path.join(eda_dir, 'age_distribution.png'), dpi=300)
    plt.close()
    print("- Saved age_distribution.png")

    # 3. Correlation heatmap (all features vs target)
    plt.figure(figsize=(12, 10))
    corr_matrix = df.corr()
    # Sort correlations with target for clearer insights
    sorted_corr = corr_matrix[['target']].sort_values(by='target', ascending=False)
    
    sns.heatmap(corr_matrix, annot=True, fmt=".2f", cmap="coolwarm", cbar=True, square=True, 
                annot_kws={"size": 8})
    plt.title('Feature Correlation Heatmap', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(eda_dir, 'correlation_heatmap.png'), dpi=300)
    plt.close()
    print("- Saved correlation_heatmap.png")
    
    # Save correlation with target as a separate barplot for easy visual extraction
    plt.figure(figsize=(8, 6))
    sns.barplot(x=sorted_corr.index, y=sorted_corr['target'].values, palette='coolwarm')
    plt.title('Correlation of Features with Target Class', fontsize=12, fontweight='bold')
    plt.xticks(rotation=45, ha='right')
    plt.xlabel('Features')
    plt.ylabel('Correlation Coefficient')
    plt.tight_layout()
    plt.savefig(os.path.join(eda_dir, 'correlation_with_target.png'), dpi=300)
    plt.close()
    print("- Saved correlation_with_target.png")

    # 4. Chest pain type (cp) vs target countplot
    plt.figure(figsize=(8, 5))
    # Chest pain type labels: 0: Typical Angina, 1: Atypical Angina, 2: Non-anginal pain, 3: Asymptomatic
    cp_labels = {0: 'Typical Angina (0)', 1: 'Atypical Angina (1)', 2: 'Non-anginal (2)', 3: 'Asymptomatic (3)'}
    df_plot = df.copy()
    df_plot['Chest Pain Type'] = df_plot['cp'].map(cp_labels)
    sns.countplot(data=df_plot, x='Chest Pain Type', hue='target', 
                 palette={0: '#2E7D32', 1: '#D84315', '0': '#2E7D32', '1': '#D84315'},
                 order=[cp_labels[0], cp_labels[1], cp_labels[2], cp_labels[3]])
    plt.title('Heart Disease Prevalence by Chest Pain Type', fontsize=12, fontweight='bold')
    plt.xlabel('Chest Pain Type (cp)', fontsize=10)
    plt.ylabel('Count', fontsize=10)
    plt.legend(title='Heart Disease', labels=['Absent (0)', 'Present (1)'])
    plt.tight_layout()
    plt.savefig(os.path.join(eda_dir, 'cp_vs_target.png'), dpi=300)
    plt.close()
    print("- Saved cp_vs_target.png")
    
    # Save key correlation values to a json file for the GET /eda-summary endpoint
    # This keeps things decoupled and lets us easily load them at FastAPI startup
    eda_summary = {
        "dataset_shape": list(df.shape),
        "target_balance": df['target'].value_counts().to_dict(),
        "correlations": df.corr()['target'].drop('target').sort_values(ascending=False).to_dict(),
        "age_stats": {
            "mean": float(df['age'].mean()),
            "min": int(df['age'].min()),
            "max": int(df['age'].max()),
            "mean_with_disease": float(df[df['target'] == 1]['age'].mean()),
            "mean_without_disease": float(df[df['target'] == 0]['age'].mean())
        },
        "chest_pain_proportions": pd.crosstab(df['cp'], df['target'], normalize='index').to_dict()
    }
    joblib.dump(eda_summary, os.path.join(models_dir, 'eda_summary.pkl'))
    print("- Saved eda_summary.pkl metadata")

    # ----------------------------------------------------
    # STEP 3: PREPROCESSING
    # ----------------------------------------------------
    print("\n==================================================")
    print("STEP 3: PREPROCESSING & SPLITTING DATA")
    print("==================================================")
    
    X = df.drop(columns=['target'])
    y = df['target']
    
    # Split training and testing data
    # Why stratify matters (CRITICAL EDUCATION POINT):
    # Stratification ensures that the train and test splits have the same class proportions
    # as the original dataset. If we perform a random split on an imbalanced or even a small dataset,
    # we might accidentally end up with a test set that has very few positive cases, leading to highly
    # volatile or biased evaluation metrics. Stratify maintains the class ratio, ensuring that our models
    # are trained and evaluated on representative proportions of positive and negative classes.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Train split size: {X_train.shape[0]} samples")
    print(f"Test split size: {X_test.shape[0]} samples")
    print(f"Train class balance: {y_train.value_counts(normalize=True).to_dict()}")
    print(f"Test class balance: {y_test.value_counts(normalize=True).to_dict()}")
    
    # Scaling input features for Logistic Regression.
    # Note: Linear models like Logistic Regression are highly sensitive to feature scaling because
    # they compute weighted sums. Unscaled features with large ranges (e.g. cholesterol, blood pressure)
    # would dominate the weights and gradients, slowing convergence and skewing regularization.
    # Decision trees, on the other hand, split based on order/threshold rules of individual features
    # (scale-invariant), so they do not require scaled input.
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Save the scaler
    joblib.dump(scaler, os.path.join(models_dir, 'scaler.pkl'))
    print("- Scaler trained and saved as scaler.pkl")
    
    # ----------------------------------------------------
    # STEP 4: MODEL TRAINING
    # ----------------------------------------------------
    print("\n==================================================")
    print("STEP 4: TRAINING MODELS")
    print("==================================================")
    
    # 1. Logistic Regression (on scaled inputs)
    log_reg = LogisticRegression(max_iter=1000, random_state=42)
    log_reg.fit(X_train_scaled, y_train)
    joblib.dump(log_reg, os.path.join(models_dir, 'model_logreg.pkl'))
    print("- Logistic Regression model trained and saved as model_logreg.pkl")
    
    # 2. Decision Tree Classifier (on raw/unscaled inputs)
    dt_classifier = DecisionTreeClassifier(max_depth=4, random_state=42)
    dt_classifier.fit(X_train, y_train)
    joblib.dump(dt_classifier, os.path.join(models_dir, 'model_tree.pkl'))
    print("- Decision Tree model trained and saved as model_tree.pkl")
    
    # ----------------------------------------------------
    # STEP 5: EVALUATION
    # ----------------------------------------------------
    print("\n==================================================")
    print("STEP 5: EVALUATING MODELS")
    print("==================================================")
    
    # Predict probabilities and classes
    # Logistic Regression
    y_pred_lr = log_reg.predict(X_test_scaled)
    y_prob_lr = log_reg.predict_proba(X_test_scaled)[:, 1]
    
    # Decision Tree
    y_pred_dt = dt_classifier.predict(X_test)
    y_prob_dt = dt_classifier.predict_proba(X_test)[:, 1]
    
    # Compute metrics
    metrics = {
        'Logistic Regression': {
            'Accuracy': accuracy_score(y_test, y_pred_lr),
            'Precision': precision_score(y_test, y_pred_lr),
            'Recall': recall_score(y_test, y_pred_lr),
            'F1-Score': f1_score(y_test, y_pred_lr),
            'ROC-AUC': auc(*roc_curve(y_test, y_prob_lr)[:2]),
            'ConfMatrix': confusion_matrix(y_test, y_pred_lr).tolist()
        },
        'Decision Tree': {
            'Accuracy': accuracy_score(y_test, y_pred_dt),
            'Precision': precision_score(y_test, y_pred_dt),
            'Recall': recall_score(y_test, y_pred_dt),
            'F1-Score': f1_score(y_test, y_pred_dt),
            'ROC-AUC': auc(*roc_curve(y_test, y_prob_dt)[:2]),
            'ConfMatrix': confusion_matrix(y_test, y_pred_dt).tolist()
        }
    }
    
    # Save evaluation metrics for the API
    joblib.dump(metrics, os.path.join(models_dir, 'metrics.pkl'))
    
    # Print out metrics
    for model_name, model_metrics in metrics.items():
        print(f"\n--- {model_name} ---")
        print(f"Accuracy:  {model_metrics['Accuracy']:.4f}")
        print(f"Precision: {model_metrics['Precision']:.4f}")
        print(f"Recall:    {model_metrics['Recall']:.4f}")
        print(f"F1-Score:  {model_metrics['F1-Score']:.4f}")
        print(f"ROC-AUC:   {model_metrics['ROC-AUC']:.4f}")
        print("Confusion Matrix:")
        cm = model_metrics['ConfMatrix']
        print(f"   TN: {cm[0][0]} | FP: {cm[0][1]}")
        print(f"   FN: {cm[1][0]} | TP: {cm[1][1]}")
        
    # Model comparison explanation (CRITICAL EDUCATION POINT)
    # Why accuracy can mislead on imbalanced data:
    # Accuracy is the ratio of correct predictions to total predictions. For instance, if a dataset has
    # 95% healthy patients and 5% diseased patients, a dummy model that always predicts "healthy" will
    # achieve 95% accuracy. However, this model completely fails to identify patients with disease.
    # In medical diagnostics, missing a sick patient (a False Negative) is far more critical than a false
    # alarm (False Positive). Therefore, metrics like Recall/Sensitivity (percentage of actual sick patients
    # caught) and F1-score (balance of Precision and Recall) or ROC-AUC (performance across all decision
    # thresholds) provide a far more comprehensive and safe picture than accuracy alone.
    
    # 1. ROC Curves plot
    plt.figure(figsize=(8, 6))
    
    # LR ROC
    fpr_lr, tpr_lr, _ = roc_curve(y_test, y_prob_lr)
    roc_auc_lr = auc(fpr_lr, tpr_lr)
    plt.plot(fpr_lr, tpr_lr, color='#D84315', lw=2.5, 
             label=f'Logistic Regression (AUC = {roc_auc_lr:.4f})')
             
    # DT ROC
    fpr_dt, tpr_dt, _ = roc_curve(y_test, y_prob_dt)
    roc_auc_dt = auc(fpr_dt, tpr_dt)
    plt.plot(fpr_dt, tpr_dt, color='#1E88E5', lw=2.5, 
             label=f'Decision Tree (AUC = {roc_auc_dt:.4f})')
             
    plt.plot([0, 1], [0, 1], color='gray', lw=1.5, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate (1 - Specificity)', fontsize=10)
    plt.ylabel('True Positive Rate (Sensitivity / Recall)', fontsize=10)
    plt.title('ROC Curves Comparison', fontsize=12, fontweight='bold')
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(os.path.join(eda_dir, 'roc_comparison.png'), dpi=300)
    plt.close()
    print("\n- Saved roc_comparison.png")
    
    # ----------------------------------------------------
    # STEP 6: FEATURE IMPORTANCE
    # ----------------------------------------------------
    print("\n==================================================")
    print("STEP 6: EXTRACTING & PLOTTING FEATURE IMPORTANCE")
    print("==================================================")
    
    # 1. Logistic Regression coefficients
    lr_coefs = log_reg.coef_[0]
    lr_importance = pd.DataFrame({
        'Feature': X.columns,
        'Coefficient': lr_coefs,
        'AbsoluteImportance': np.abs(lr_coefs)
    }).sort_values(by='Coefficient', ascending=False)
    
    plt.figure(figsize=(10, 6))
    # Color coefficients: positive (risk up) red/orange, negative (risk down) green
    colors = ['#D84315' if c >= 0 else '#2E7D32' for c in lr_importance['Coefficient']]
    sns.barplot(data=lr_importance, x='Coefficient', y='Feature', hue='Feature', palette=colors, legend=False)
    plt.title('Logistic Regression Coefficients\n(Right = Increases risk, Left = Decreases risk)', fontsize=12, fontweight='bold')
    plt.xlabel('Coefficient Value (Scaled Inputs)', fontsize=10)
    plt.ylabel('Medical Feature', fontsize=10)
    plt.tight_layout()
    plt.savefig(os.path.join(eda_dir, 'feature_importance_lr.png'), dpi=300)
    plt.close()
    print("- Saved feature_importance_lr.png")
    
    # 2. Decision Tree Feature Importances
    dt_importances = dt_classifier.feature_importances_
    dt_importance_df = pd.DataFrame({
        'Feature': X.columns,
        'Importance': dt_importances
    }).sort_values(by='Importance', ascending=False)
    
    plt.figure(figsize=(10, 6))
    sns.barplot(data=dt_importance_df, x='Importance', y='Feature', hue='Feature', color='#1E88E5', legend=False)
    plt.title('Decision Tree Feature Importance\n(Split Gini Criterion contribution)', fontsize=12, fontweight='bold')
    plt.xlabel('Gini Importance', fontsize=10)
    plt.ylabel('Medical Feature', fontsize=10)
    plt.tight_layout()
    plt.savefig(os.path.join(eda_dir, 'feature_importance_dt.png'), dpi=300)
    plt.close()
    print("- Saved feature_importance_dt.png")
    
    # Save feature importances to JSON format for endpoints
    importance_summary = {
        'logistic_regression': lr_importance.drop(columns=['AbsoluteImportance']).to_dict(orient='records'),
        'decision_tree': dt_importance_df.to_dict(orient='records')
    }
    joblib.dump(importance_summary, os.path.join(models_dir, 'feature_importance.pkl'))
    print("- Saved feature_importance.pkl metadata")
    
    print("\n==================================================")
    print("SUMMARY COMPARISON")
    print("==================================================")
    better_model = "Logistic Regression" if metrics['Logistic Regression']['ROC-AUC'] > metrics['Decision Tree']['ROC-AUC'] else "Decision Tree"
    print(f"Based on ROC-AUC, the better performing model is: {better_model}")
    print(f"Logistic Regression ROC-AUC: {metrics['Logistic Regression']['ROC-AUC']:.4f}")
    print(f"Decision Tree ROC-AUC:        {metrics['Decision Tree']['ROC-AUC']:.4f}")
    print(f"Logistic Regression Accuracy:  {metrics['Logistic Regression']['Accuracy']:.4f}")
    print(f"Decision Tree Accuracy:        {metrics['Decision Tree']['Accuracy']:.4f}")
    print("\nPart 1 ML execution and plot saving is complete!")

if __name__ == "__main__":
    main()
