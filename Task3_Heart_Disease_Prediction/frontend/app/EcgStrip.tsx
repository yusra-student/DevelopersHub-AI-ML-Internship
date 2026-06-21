"use client";

import React, { useRef, useEffect } from "react";

interface EcgStripProps {
  isHighRisk: boolean | null;
  heartRate: number | null;
}

export default function EcgStrip({ isHighRisk, heartRate }: EcgStripProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    // Handle high DPI screens
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // ECG wave properties
    const points: number[] = [];
    const maxPoints = width;
    
    // Wave configuration based on risk profile and heart rate
    // Steady sinus rhythm vs irregular/rapid rhythm
    const bpm = heartRate || 75;
    // Calculate cycle length in terms of canvas pixels (lower bpm -> wider cycle)
    const cycleLength = Math.max(Math.min((60 / bpm) * 120, 160), 60); 
    
    let time = 0;
    
    // Color scheme
    let strokeColor = "#A8A29E"; // Muted stone color when idle
    if (isHighRisk !== null) {
      strokeColor = isHighRisk ? "#D84315" : "#2E7D32"; // Red vs Green
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint background grid (medical paper aesthetic)
      ctx.strokeStyle = "rgba(120, 113, 108, 0.06)";
      ctx.lineWidth = 1;
      const gridSize = 15;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Calculate the next y value for the ECG signal
      // An ECG signal consists of P-wave, QRS complex, and T-wave.
      const phase = time % cycleLength;
      let yVal = height / 2;

      // Sinus rhythm modeling
      if (isHighRisk) {
        // Elevated risk: model slightly irregular tachycardic/hyperactive wave
        // Add random slight jitter (arrhythmia representation)
        const jitter = Math.sin(time * 0.5) * 1.5;
        
        if (phase > 10 && phase < 22) {
          // P Wave
          yVal -= Math.sin(((phase - 10) / 12) * Math.PI) * 4 + jitter;
        } else if (phase >= 25 && phase <= 27) {
          // Q Wave
          yVal += 4;
        } else if (phase > 27 && phase < 32) {
          // R Wave (Sharp high spike)
          const normDist = (phase - 27) / 5;
          yVal -= Math.sin(normDist * Math.PI) * 28 + jitter;
        } else if (phase >= 32 && phase <= 34) {
          // S Wave
          yVal += 7;
        } else if (phase > 42 && phase < 60) {
          // T Wave
          yVal -= Math.sin(((phase - 42) / 18) * Math.PI) * 6 + jitter;
        }
      } else {
        // Healthy state: calm, standard regular sinus rhythm
        if (phase > 15 && phase < 27) {
          // P Wave (atrial depolarization)
          yVal -= Math.sin(((phase - 15) / 12) * Math.PI) * 3;
        } else if (phase >= 30 && phase <= 32) {
          // Q Wave
          yVal += 3;
        } else if (phase > 32 && phase < 37) {
          // R Wave (ventricular depolarization - sharp peak)
          const normDist = (phase - 32) / 5;
          yVal -= Math.sin(normDist * Math.PI) * 22;
        } else if (phase >= 37 && phase <= 39) {
          // S Wave
          yVal += 5;
        } else if (phase > 48 && phase < 68) {
          // T Wave (ventricular repolarization)
          yVal -= Math.sin(((phase - 48) / 20) * Math.PI) * 5;
        }
      }

      points.push(yVal);
      if (points.length > maxPoints) {
        points.shift();
      }

      // Draw the ECG line
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      for (let i = 0; i < points.length; i++) {
        const px = i;
        const py = points[i];
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Draw blinking heartbeat indicator dot at the end
      if (points.length > 0) {
        const lx = points.length - 1;
        const ly = points[lx];
        ctx.beginPath();
        ctx.fillStyle = strokeColor;
        ctx.arc(lx, ly, 3.5, 0, 2 * Math.PI);
        ctx.fill();
      }

      time += isHighRisk ? 2.5 : 2.0; // speed up wave translation for higher risk (tachycardic visual feel)
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    // Responsive resize handler
    const handleResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isHighRisk, heartRate]);

  return (
    <div className="w-full bg-stone-100/30 rounded-xl overflow-hidden border border-stone-200/40 relative shadow-inner p-1 h-14">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Heart Symbol pulse icon overlay */}
      <div className="absolute top-2.5 right-4 flex items-center gap-1.5 bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded-full border border-stone-200/60 shadow-sm">
        <svg
          className={`w-3.5 h-3.5 ${
            isHighRisk === null
              ? "text-stone-400"
              : isHighRisk
              ? "text-rose-600 animate-pulse"
              : "text-emerald-700"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
        <span className="text-[9px] font-mono font-bold text-stone-600">
          {heartRate ? `${heartRate} BPM` : "ECG Monitoring"}
        </span>
      </div>
    </div>
  );
}
