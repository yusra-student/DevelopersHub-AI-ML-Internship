"use client";

import React from "react";

interface RiskGaugeProps {
  probability: number;
  label: string;
}

export default function RiskGauge({ probability, label }: RiskGaugeProps) {
  const percentage = probability * 100;
  
  // SVG coordinates for a semi-circle gauge (radius = 50, center = 60,60)
  // Arc starts at angle 180 degrees (left) and ends at 0 degrees (right)
  const r = 40;
  const cx = 50;
  const cy = 50;
  
  // Calculate stroke-dasharray parameters for the progress path
  // Circumference of semi-circle is PI * r = 125.66
  const circ = Math.PI * r;
  const strokeDashoffset = circ - (probability * circ);
  
  const isHighRisk = probability >= 0.5;
  const statusColor = isHighRisk ? "text-coral-500" : "text-teal-700";
  const ringColor = isHighRisk ? "stroke-[#E57373]" : "stroke-[#81C784]";
  const trackColor = "stroke-[#ECEFF1]";

  return (
    <div className="flex flex-col items-center p-4 bg-white border border-stone-200/50 rounded-2xl shadow-sm w-full">
      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
        {label}
      </span>
      
      <div className="relative w-28 h-20">
        <svg viewBox="0 0 100 60" className="w-full h-full">
          {/* Track Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            className={`${trackColor}`}
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Active Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            className={`${ringColor} transition-all duration-1000 ease-out`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        
        {/* Needle Pin / Center text */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-stone-800 leading-none">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      
      <div className="text-center mt-1">
        <span className={`text-[11px] font-bold ${isHighRisk ? "text-rose-600 bg-rose-50" : "text-emerald-700 bg-emerald-50"} px-2.5 py-0.5 rounded-full border border-current/20`}>
          {isHighRisk ? "Elevated / زائد خطرہ" : "Normal / نارمل حد"}
        </span>
      </div>
    </div>
  );
}
