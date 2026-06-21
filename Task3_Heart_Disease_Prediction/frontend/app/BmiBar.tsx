"use client";

import React from "react";

interface BmiBarProps {
  bmi: number | null;
}

export default function BmiBar({ bmi }: BmiBarProps) {
  if (bmi === null || isNaN(bmi) || bmi <= 0) {
    return (
      <div className="text-sm text-stone-500 italic">
        Enter height and weight to calculate BMI.
      </div>
    );
  }

  // Calculate percentage of marker on the bar (clamped between 15 and 40 for display purposes)
  const minBmiDisplay = 15;
  const maxBmiDisplay = 40;
  const percentage = Math.min(
    Math.max(((bmi - minBmiDisplay) / (maxBmiDisplay - minBmiDisplay)) * 100, 0),
    100
  );

  let category = "";
  let colorClass = "";
  let descriptionUrdu = "";

  if (bmi < 18.5) {
    category = "Underweight";
    colorClass = "text-sky-600";
    descriptionUrdu = "کم وزن";
  } else if (bmi >= 18.5 && bmi < 25) {
    category = "Normal Weight";
    colorClass = "text-emerald-700";
    descriptionUrdu = "نارمل وزن";
  } else if (bmi >= 25 && bmi < 30) {
    category = "Overweight";
    colorClass = "text-amber-600";
    descriptionUrdu = "زائد وزن";
  } else {
    category = "Obese";
    colorClass = "text-rose-600";
    descriptionUrdu = "موٹاپا";
  }

  return (
    <div className="w-full bg-stone-50 p-4 rounded-xl border border-stone-200/60 shadow-inner">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-stone-700">
          BMI Status / <span className="font-normal text-stone-500">بی ایم آئی کی صورتحال</span>
        </span>
        <span className={`text-sm font-bold ${colorClass} flex items-center gap-1.5`}>
          <span>{bmi.toFixed(1)}</span>
          <span className="text-xs font-normal">({category} / {descriptionUrdu})</span>
        </span>
      </div>

      {/* Visual Slider Bar */}
      <div className="relative w-full h-4 bg-stone-200 rounded-full overflow-visible mt-3">
        {/* Colors sectors */}
        <div className="absolute top-0 bottom-0 left-0 w-[14%] bg-sky-200 rounded-l-full border-r border-white/40" title="Underweight (< 18.5)" />
        <div className="absolute top-0 bottom-0 left-[14%] w-[26%] bg-emerald-200 border-r border-white/40" title="Normal (18.5 - 24.9)" />
        <div className="absolute top-0 bottom-0 left-[40%] w-[20%] bg-amber-200 border-r border-white/40" title="Overweight (25 - 29.9)" />
        <div className="absolute top-0 bottom-0 left-[60%] w-[40%] bg-rose-200 rounded-r-full" title="Obese (>= 30)" />

        {/* Marker */}
        <div
          className="absolute -top-1 w-6 h-6 bg-stone-800 border-2 border-white rounded-full shadow-md -ml-3 flex items-center justify-center transition-all duration-300 ease-out cursor-default"
          style={{ left: `${percentage}%` }}
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-stone-500 mt-2.5 px-1 font-mono">
        <span>15.0</span>
        <span>18.5</span>
        <span>25.0</span>
        <span>30.0</span>
        <span>40.0+</span>
      </div>
    </div>
  );
}
