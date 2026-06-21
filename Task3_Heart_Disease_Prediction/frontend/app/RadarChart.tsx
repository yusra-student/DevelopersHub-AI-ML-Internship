"use client";

import React from "react";

interface RadarChartProps {
  vitals: {
    age: number;
    trestbps: number;
    chol: number;
    thalach: number;
    oldpeak: number;
  };
}

export default function RadarChart({ vitals }: RadarChartProps) {
  // Center and size of SVG
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 85; // Max radius of outer grid
  
  // 5 features to map
  const features = [
    { label: "Age / عمر", key: "age", min: 30, max: 80, refVal: 54 },
    { label: "Resting BP / بلڈ پریشر", key: "trestbps", min: 90, max: 180, refVal: 130 },
    { label: "Cholesterol / کولیسٹرول", key: "chol", min: 120, max: 360, refVal: 240 },
    { label: "Max Heart Rate / دھڑکن", key: "thalach", min: 80, max: 200, refVal: 150 },
    { label: "ST Depression / ڈپریشن", key: "oldpeak", min: 0.0, max: 5.0, refVal: 1.0 }
  ];

  const numAxes = features.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // Helper to get normalized value between 0.1 and 1.0
  const normalize = (val: number, min: number, max: number) => {
    if (val === undefined || val === null) return 0.1;
    const norm = (val - min) / (max - min);
    return Math.min(Math.max(norm, 0.1), 1.0);
  };

  // Generate SVG coordinates for a given set of normalized values
  const getCoordinates = (valueMapper: (feature: typeof features[0]) => number) => {
    return features.map((f, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const normalizedValue = valueMapper(f);
      const valR = normalizedValue * r;
      const x = cx + valR * Math.cos(angle);
      const y = cy + valR * Math.sin(angle);
      return { x, y };
    });
  };

  // 1. Coordinates for Patient's Vitals
  const patientNorms = (f: typeof features[0]) => {
    const val = (vitals as any)[f.key];
    return normalize(val, f.min, f.max);
  };
  const patientCoords = getCoordinates(patientNorms);
  const patientPointsStr = patientCoords.map(c => `${c.x},${c.y}`).join(" ");

  // 2. Coordinates for Healthy Reference baseline
  const referenceNorms = (f: typeof features[0]) => {
    return normalize(f.refVal, f.min, f.max);
  };
  const referenceCoords = getCoordinates(referenceNorms);
  const referencePointsStr = referenceCoords.map(c => `${c.x},${c.y}`).join(" ");

  // 3. Grid rings (25%, 50%, 75%, 100%)
  const gridRings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center p-4 bg-white border border-stone-200/60 rounded-2xl shadow-sm w-full">
      <div className="border-b border-stone-200/80 pb-2 mb-3 w-full text-center">
        <h4 className="text-sm font-serif font-bold text-stone-800">
          Vitals Profile Diagram
        </h4>
        <span className="text-[10px] text-stone-500">
          Patient vs. Healthy Baseline (Reference)
        </span>
      </div>

      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* Concentric Grid Polygons */}
          {gridRings.map((ring, idx) => {
            const ringCoords = features.map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const valR = ring * r;
              const x = cx + valR * Math.cos(angle);
              const y = cy + valR * Math.sin(angle);
              return `${x},${y}`;
            }).join(" ");

            return (
              <polygon
                key={idx}
                points={ringCoords}
                fill="none"
                stroke="#E7E5E4"
                strokeWidth="1"
                strokeDasharray={idx < 3 ? "2,3" : "none"}
              />
            );
          })}

          {/* Radial Axis Lines */}
          {features.map((f, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);

            // Label coordinates (pushed slightly further out)
            const labelDist = r + 20;
            const lx = cx + labelDist * Math.cos(angle);
            const ly = cy + labelDist * Math.sin(angle);

            let textAnchor: "middle" | "start" | "end" = "middle";
            if (Math.cos(angle) > 0.1) textAnchor = "start";
            if (Math.cos(angle) < -0.1) textAnchor = "end";

            return (
              <g key={i}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke="#E7E5E4"
                  strokeWidth="1.2"
                />
                {/* Feature Label text */}
                <text
                  x={lx}
                  y={ly + 4}
                  textAnchor={textAnchor}
                  fill="#78716C"
                  className="text-[9px] font-sans font-medium"
                >
                  {f.label}
                </text>
              </g>
            );
          })}

          {/* Healthy Reference Area (Muted Teal-Green) */}
          <polygon
            points={referencePointsStr}
            fill="rgba(20, 110, 120, 0.06)"
            stroke="rgba(20, 110, 120, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />

          {/* Patient Area (Warm Coral/Red) */}
          <polygon
            points={patientPointsStr}
            fill="rgba(216, 67, 21, 0.15)"
            stroke="#D84315"
            strokeWidth="2"
            className="transition-all duration-500 ease-out"
          />

          {/* Data Points Markers */}
          {patientCoords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r="3.5"
              fill="#D84315"
              stroke="#FFF"
              strokeWidth="1"
              className="transition-all duration-500 ease-out"
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-stone-500 mt-4 border-t border-stone-100 pt-2 w-full justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-orange-100 border border-orange-500 rounded-sm" />
          <span>Patient / مریض</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-teal-50 border border-teal-700 border-dashed rounded-sm" />
          <span>Healthy Baseline / نارمل حد</span>
        </div>
      </div>
    </div>
  );
}
