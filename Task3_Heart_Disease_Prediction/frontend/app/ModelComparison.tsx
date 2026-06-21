"use client";

import React, { useState, useEffect } from "react";

interface MetricRowProps {
  label: string;
  val1: number;
  val2: number;
  isPercentage?: boolean;
}

function MetricRow({ label, val1, val2, isPercentage = true }: MetricRowProps) {
  const format = (v: number) => isPercentage ? `${(v * 100).toFixed(1)}%` : v.toFixed(3);
  const diff = val1 - val2;
  const isBetter1 = diff > 0;
  
  return (
    <tr className="border-b border-stone-200/50 text-xs">
      <td className="py-2.5 font-medium text-stone-600">{label}</td>
      <td className={`py-2.5 text-center font-mono ${isBetter1 ? "text-emerald-700 font-bold" : "text-stone-700"}`}>
        {format(val1)}
      </td>
      <td className={`py-2.5 text-center font-mono ${!isBetter1 ? "text-emerald-700 font-bold" : "text-stone-700"}`}>
        {format(val2)}
      </td>
    </tr>
  );
}

export default function ModelComparison() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch("/api/metrics");
        if (!response.ok) {
          throw new Error("Failed to load model metrics from backend.");
        }
        const data = await response.json();
        setMetrics(data);
      } catch (err: any) {
        setError(err.message || "Could not fetch comparison metrics.");
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-stone-200/50 shadow-sm min-h-[200px]">
        <div className="w-6 h-6 border-2 border-teal-800 border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-xs text-stone-500 font-mono">Loading model comparisons...</span>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100">
        Could not load model comparison metrics. Run backend FastAPI server.
      </div>
    );
  }

  const lr = metrics["Logistic Regression"];
  const dt = metrics["Decision Tree"];

  return (
    <div className="flex flex-col gap-5 p-5 bg-white border border-stone-200/60 rounded-2xl shadow-sm">
      <div className="border-b border-stone-200/80 pb-2">
        <h3 className="text-base font-serif font-bold text-stone-800">
          Model Comparison Benchmarks
        </h3>
        <p className="text-[11px] text-stone-500">
          Comparison evaluated on unseen test set (205 samples).
        </p>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-stone-300/60 text-[10px] text-stone-500 uppercase tracking-wider font-mono">
            <th className="pb-2">Performance Metric</th>
            <th className="pb-2 text-center text-teal-800">Logistic Regression</th>
            <th className="pb-2 text-center text-sky-800">Decision Tree</th>
          </tr>
        </thead>
        <tbody>
          <MetricRow label="Accuracy / درستگی" val1={lr.Accuracy} val2={dt.Accuracy} />
          <MetricRow label="Precision / درستی" val1={lr.Precision} val2={dt.Precision} />
          <MetricRow label="Recall (Sensitivity) / بازیافت" val1={lr.Recall} val2={dt.Recall} />
          <MetricRow label="F1-Score / متوازن پیمائش" val1={lr.F1} val2={dt.F1} isPercentage={false} />
          <MetricRow label="ROC-AUC Score / آر او سی ایریا" val1={lr["ROC-AUC"]} val2={dt["ROC-AUC"]} isPercentage={false} />
        </tbody>
      </table>

      {/* Confusion Matrices Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {/* LR Confusion Matrix */}
        <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/50">
          <span className="text-[10px] font-bold text-teal-800 uppercase font-mono tracking-wider">
            Logistic Regression Matrix
          </span>
          <div className="grid grid-cols-2 gap-1.5 mt-2 font-mono text-center">
            <div className="bg-emerald-100/60 p-2.5 rounded-lg border border-emerald-200/40">
              <div className="text-[10px] text-stone-500 uppercase">TN (True Neg)</div>
              <div className="text-sm font-bold text-emerald-800">{lr.ConfMatrix[0][0]}</div>
            </div>
            <div className="bg-rose-100/50 p-2.5 rounded-lg border border-rose-200/40">
              <div className="text-[10px] text-stone-500 uppercase">FP (False Pos)</div>
              <div className="text-sm font-bold text-rose-800">{lr.ConfMatrix[0][1]}</div>
            </div>
            <div className="bg-rose-100/50 p-2.5 rounded-lg border border-rose-200/40">
              <div className="text-[10px] text-stone-500 uppercase">FN (False Neg)</div>
              <div className="text-sm font-bold text-rose-800">{lr.ConfMatrix[1][0]}</div>
            </div>
            <div className="bg-emerald-100/60 p-2.5 rounded-lg border border-emerald-200/40">
              <div className="text-[10px] text-stone-500 uppercase">TP (True Pos)</div>
              <div className="text-sm font-bold text-emerald-800">{lr.ConfMatrix[1][1]}</div>
            </div>
          </div>
        </div>

        {/* DT Confusion Matrix */}
        <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/50">
          <span className="text-[10px] font-bold text-sky-800 uppercase font-mono tracking-wider">
            Decision Tree Matrix
          </span>
          <div className="grid grid-cols-2 gap-1.5 mt-2 font-mono text-center">
            <div className="bg-emerald-100/60 p-2.5 rounded-lg border border-emerald-200/40">
              <div className="text-[10px] text-stone-500 uppercase">TN (True Neg)</div>
              <div className="text-sm font-bold text-emerald-800">{dt.ConfMatrix[0][0]}</div>
            </div>
            <div className="bg-rose-100/50 p-2.5 rounded-lg border border-rose-200/40">
              <div className="text-[10px] text-stone-500 uppercase">FP (False Pos)</div>
              <div className="text-sm font-bold text-rose-800">{dt.ConfMatrix[0][1]}</div>
            </div>
            <div className="bg-rose-100/50 p-2.5 rounded-lg border border-rose-200/40">
              <div className="text-[10px] text-stone-500 uppercase">FN (False Neg)</div>
              <div className="text-sm font-bold text-rose-800">{dt.ConfMatrix[1][0]}</div>
            </div>
            <div className="bg-emerald-100/60 p-2.5 rounded-lg border border-emerald-200/40">
              <div className="text-[10px] text-stone-500 uppercase">TP (True Pos)</div>
              <div className="text-sm font-bold text-emerald-800">{dt.ConfMatrix[1][1]}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
