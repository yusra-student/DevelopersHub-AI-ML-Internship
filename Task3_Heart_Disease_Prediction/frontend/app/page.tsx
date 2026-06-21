"use client";

import React, { useState, useEffect } from "react";
import VitalsForm from "./VitalsForm";
import RiskGauge from "./RiskGauge";
import RadarChart from "./RadarChart";
import ModelComparison from "./ModelComparison";
import HistoryList from "./HistoryList";
import EcgStrip from "./EcgStrip";

interface HistoryItem {
  id: string;
  date: string;
  age: number;
  bmi: number | null;
  riskPercent: number;
  isHighRisk: boolean;
}

export default function HeartPredictionPage() {
  const [vitals, setVitals] = useState({
    age: "",
    sex: "1",
    cp: "0",
    trestbps: "",
    chol: "",
    fbs: "0",
    restecg: "1",
    thalach: "",
    exang: "0",
    oldpeak: "",
    slope: "2",
    ca: "0",
    thal: "2",
  });

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [predictions, setPredictions] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem("heart_disease_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      setBmi(w / ((h / 100) ** 2));
    } else {
      setBmi(null);
    }
  }, [height, weight]);

  const loadSample = (type: "normal" | "risk") => {
    setError("");
    setPredictions(null);
    if (type === "normal") {
      setVitals({ age: "52", sex: "1", cp: "0", trestbps: "125", chol: "212", fbs: "0", restecg: "1", thalach: "168", exang: "0", oldpeak: "1.0", slope: "2", ca: "2", thal: "3" });
      setHeight("176"); setWeight("71");
    } else {
      setVitals({ age: "67", sex: "1", cp: "0", trestbps: "160", chol: "286", fbs: "0", restecg: "0", thalach: "108", exang: "1", oldpeak: "1.5", slope: "1", ca: "3", thal: "2" });
      setHeight("170"); setWeight("92");
    }
  };

  const handleSubmit = async (parsedVitals: any, currentBmi: number | null) => {
    setError("");
    setLoading(true);
    setPredictions(null);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedVitals),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Internal Server Error from ML backend");
      }

      const result = await response.json();
      setPredictions(result);

      const isElevated = result.logistic_probability >= 0.5 || result.tree_probability >= 0.5;
      const historyItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        age: parsedVitals.age,
        bmi: currentBmi,
        riskPercent: Math.max(result.logistic_probability, result.tree_probability) * 100,
        isHighRisk: isElevated,
      };

      const updatedHistory = [historyItem, ...history].slice(0, 20);
      setHistory(updatedHistory);
      localStorage.setItem("heart_disease_history", JSON.stringify(updatedHistory));
    } catch (err: any) {
      setError(err.message || "Failed to parse prediction result.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("heart_disease_history");
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("heart_disease_history", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2C3E35] font-sans antialiased selection:bg-teal-700/10 selection:text-teal-900 pb-16">
      
      {/* HEADER SECTION (Print Hidden) */}
      <header className="no-print bg-white border-b border-stone-200/60 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-teal-800 rounded-xl flex items-center justify-center text-teal-50 shadow-md">
              <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-md font-serif font-bold text-stone-900 tracking-tight leading-none">
                CardioSentry AI
              </h1>
              <span className="text-[9px] text-stone-400 font-mono">TASK 3 INTERNSHIP ASSIGNMENT</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-3.5 py-1.5 rounded-lg border border-stone-300/40 transition-all font-medium"
            >
              {showComparison ? "Hide Model Benchmarks" : "View Model Benchmarks"}
            </button>
            
            {predictions && (
              <button
                onClick={() => window.print()}
                className="text-xs bg-teal-800 hover:bg-teal-700 text-teal-50 px-3.5 py-1.5 rounded-lg border border-teal-900 shadow-sm transition-all font-medium"
              >
                Download PDF / پرنٹ کریں
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6">
        
        {/* ECG Live visualizer (Print Hidden) */}
        <div className="no-print mb-6">
          <EcgStrip
            isHighRisk={
              predictions
                ? predictions.logistic_probability >= 0.5 || predictions.tree_probability >= 0.5
                : null
            }
            heartRate={vitals.thalach ? parseInt(vitals.thalach, 10) : null}
          />
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200/50 rounded-2xl text-rose-800 text-xs flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Model Benchmarks section */}
        {showComparison && (
          <div className="no-print mb-6 transition-all duration-300">
            <ModelComparison />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT/CENTER COLUMN: Form Panel (Print Hidden) */}
          <div className="no-print lg:col-span-2 flex flex-col gap-6">
            
            {/* Disclaimer Overlay */}
            <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 flex gap-3 shadow-inner">
              <span className="text-lg">⚠️</span>
              <div className="flex flex-col text-[11px] text-amber-900/80 leading-relaxed font-serif">
                <span>
                  <strong>Educational Disclaimer:</strong> This is a student software engineering project.
                  The predictions outputted are simulated and should never replace professional medical evaluations or clinical diagnostics.
                </span>
                <span className="mt-1.5 font-sans rtl">
                  <strong>تعلیمی ڈسکلیمر:</strong> یہ ایک تعلیمی طالب علم کا پروجیکٹ ہے۔ فراہم کردہ نتائج کو تشخیصی یا حقیقی طبی مشورہ نہ سمجھا جائے۔
                </span>
              </div>
            </div>

            <VitalsForm
              vitals={vitals}
              setVitals={setVitals}
              height={height}
              setHeight={setHeight}
              weight={weight}
              setWeight={setWeight}
              bmi={bmi}
              loading={loading}
              onSubmit={handleSubmit}
              loadSample={loadSample}
              setError={setError}
            />
            
          </div>

          {/* RIGHT COLUMN: Results, Diagram & History Panels */}
          <div className="flex flex-col gap-6">
            
            {/* Live Results Panel */}
            {predictions ? (
              <div className="bg-white border border-stone-200/60 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
                <div className="border-b border-stone-100 pb-2">
                  <h3 className="text-base font-serif font-bold text-stone-800">
                    Analysis Diagnostic Report
                  </h3>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider font-mono">Heart Disease Risk Summary</span>
                </div>

                {/* Prediction Risk Gauges */}
                <div className="grid grid-cols-2 gap-3.5">
                  <RiskGauge
                    probability={predictions.logistic_probability}
                    label="Logistic Regression"
                  />
                  <RiskGauge
                    probability={predictions.tree_probability}
                    label="Decision Tree"
                  />
                </div>

                {/* Combined Clinical Message */}
                <div className={`p-4 rounded-xl border flex gap-3 ${
                  predictions.interpretation.risk_category === "Elevated Risk"
                    ? "bg-rose-50 border-rose-200/50 text-rose-900"
                    : "bg-emerald-50 border-emerald-200/50 text-emerald-900"
                }`}>
                  <span className="text-xl">
                    {predictions.interpretation.risk_category === "Elevated Risk" ? "⚠️" : "✅"}
                  </span>
                  <div className="flex flex-col text-xs leading-relaxed">
                    <span className="font-semibold text-[13px]">
                      {predictions.interpretation.risk_category} / {predictions.interpretation.risk_category === "Elevated Risk" ? "زائد خطرہ" : "نارمل خطرہ"}
                    </span>
                    <span className="mt-1 font-serif">{predictions.interpretation.clinical_message}</span>
                    <span className="text-[10px] mt-1.5 opacity-80 border-t border-current/15 pt-1 font-mono">
                      Model Agreement: {predictions.model_agreement ? "Consensus Reached / اتفاق رائے" : "Discrepancy observed / اختلاف رائے"}
                    </span>
                  </div>
                </div>

                {/* Top Risk Factors list */}
                {predictions.top_factors && predictions.top_factors.length > 0 && (
                  <div className="bg-stone-50 p-4 border border-stone-200/50 rounded-xl">
                    <span className="text-[10px] font-bold text-stone-500 uppercase font-mono tracking-wider">
                      Primary Risk Contributors (LR)
                    </span>
                    <ul className="list-disc list-inside text-xs text-stone-700 mt-2 flex flex-col gap-1.5">
                      {predictions.top_factors.map((factor: string, idx: number) => (
                        <li key={idx} className="font-medium">
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* PDF printable version (Hidden on screen, styled for paper/A4) */}
                <div className="hidden print:block font-serif text-stone-800 p-6 bg-white border border-stone-300">
                  <div className="text-center border-b-2 border-stone-800 pb-3 mb-4">
                    <h1 className="text-xl font-bold font-serif uppercase tracking-wider">CardioSentry AI - Heart Disease Risk Report</h1>
                    <span className="text-xs">DevelopersHub Internship Academic Submission</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                    <div>
                      <h3 className="font-bold border-b border-stone-300 pb-1">Patient Identification</h3>
                      <p className="mt-1">Age: <span className="font-mono">{vitals.age}</span> Years</p>
                      <p>Sex: <span className="font-mono">{vitals.sex === "1" ? "Male" : "Female"}</span></p>
                      <p>BMI: <span className="font-mono">{bmi ? bmi.toFixed(2) : "N/A"}</span></p>
                    </div>
                    <div>
                      <h3 className="font-bold border-b border-stone-300 pb-1">Test Details</h3>
                      <p className="mt-1">Date: <span className="font-mono">{new Date().toLocaleDateString()}</span></p>
                      <p>Time: <span className="font-mono">{new Date().toLocaleTimeString()}</span></p>
                    </div>
                  </div>

                  <div className="border border-stone-300 p-3 rounded-lg mb-4">
                    <h3 className="font-bold border-b border-stone-200 pb-1 text-xs">Prediction Probabilities</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                      <div>Logistic Regression: <span className="font-bold font-mono">{(predictions.logistic_probability * 100).toFixed(2)}%</span></div>
                      <div>Decision Tree: <span className="font-bold font-mono">{(predictions.tree_probability * 100).toFixed(2)}%</span></div>
                    </div>
                  </div>

                  <div className="border border-stone-300 p-3 rounded-lg mb-4">
                    <h3 className="font-bold border-b border-stone-200 pb-1 text-xs">Primary Indicators Identified</h3>
                    <ul className="list-decimal list-inside mt-2 text-xs">
                      {predictions.top_factors?.map((f: string, idx: number) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-stone-50 border border-stone-300 p-4 text-xs italic">
                    <strong>Educational Disclaimer:</strong> This is a simulation model submission for DevelopersHub Corporation by student Yusra Waheed (Virtual University). It does not hold diagnosis certification and should not be used as professional medical advice.
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-stone-200/50 p-6 rounded-2xl text-center shadow-sm h-40 flex flex-col items-center justify-center">
                <span className="text-sm font-medium text-stone-400">
                  Submit form to view prediction results.
                </span>
                <span className="text-[11px] text-stone-300 mt-1">
                  تجزیہ کے نتائج یہاں دکھائے جائیں گے۔
                </span>
              </div>
            )}

            {/* Radar Vitals profile Diagram */}
            {vitals.age && vitals.trestbps && vitals.chol && vitals.thalach && (
              <div className="no-print w-full">
                <RadarChart
                  vitals={{
                    age: parseInt(vitals.age, 10),
                    trestbps: parseInt(vitals.trestbps, 10),
                    chol: parseInt(vitals.chol, 10),
                    thalach: parseInt(vitals.thalach, 10),
                    oldpeak: vitals.oldpeak ? parseFloat(vitals.oldpeak) : 0.0
                  }}
                />
              </div>
            )}

            {/* LocalStorage History list */}
            <div id="history-records" className="no-print">
              <HistoryList
                items={history}
                onClearAll={handleClearHistory}
                onDeleteItem={handleDeleteHistoryItem}
              />
            </div>

          </div>

        </div>

      </main>

      {/* FOOTER SECTION */}
      <footer className="max-w-5xl mx-auto px-4 mt-16 pt-6 border-t border-stone-200/60 text-center">
        <p className="text-[11px] text-stone-400 font-serif">
          CardioSentry AI - DevelopersHub AI/ML Engineering Internship Portfolio Task 3
        </p>
        <p className="text-[10px] text-stone-300 font-mono mt-1 uppercase">
          Prepared by Yusra Waheed | Virtual University Student
        </p>
      </footer>
    </div>
  );
}
