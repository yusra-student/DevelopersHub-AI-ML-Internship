"use client";

import React from "react";

interface HistoryItem {
  id: string;
  date: string;
  age: number;
  bmi: number | null;
  riskPercent: number;
  isHighRisk: boolean;
}

interface HistoryListProps {
  items: HistoryItem[];
  onClearAll: () => void;
  onDeleteItem: (id: string) => void;
}

export default function HistoryList({ items, onClearAll, onDeleteItem }: HistoryListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white border border-stone-200/50 p-6 rounded-2xl text-center shadow-sm">
        <span className="text-sm font-medium text-stone-400">
          No records found. Submit predictions to populate history.
        </span>
        <div className="text-xs text-stone-300 mt-1">
          کوئی سابقہ ریکارڈ نہیں ملا۔
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200/60 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-stone-200 pb-2">
        <div className="flex flex-col">
          <h3 className="text-sm font-serif font-bold text-stone-800">
            Prediction History / <span className="font-normal text-stone-500 text-xs">سابقہ ریکارڈز</span>
          </h3>
          <span className="text-[10px] text-stone-400">Capped at 20 entries</span>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/60 px-2.5 py-1 rounded-md border border-rose-200/40 transition-all font-mono"
        >
          CLEAR ALL / صاف کریں
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center p-3 bg-stone-50 hover:bg-stone-100/50 border border-stone-200/40 rounded-xl transition-all group"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-700">
                  Age: {item.age}
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-[10px] text-stone-500">
                  BMI: {item.bmi ? item.bmi.toFixed(1) : "N/A"}
                </span>
              </div>
              <span className="text-[9px] text-stone-400 font-mono">
                {new Date(item.date).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Risk Status Indicator */}
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono font-bold text-stone-800">
                  {item.riskPercent.toFixed(0)}% Risk
                </span>
                <span className={`text-[9px] font-bold ${item.isHighRisk ? "text-rose-600" : "text-emerald-700"}`}>
                  {item.isHighRisk ? "Elevated / زیادہ" : "Normal / نارمل"}
                </span>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => onDeleteItem(item.id)}
                className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Delete entry"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
