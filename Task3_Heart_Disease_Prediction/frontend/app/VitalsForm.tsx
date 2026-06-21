"use client";

import React, { useState, useEffect } from "react";
import BmiBar from "./BmiBar";
import VoiceInput from "./VoiceInput";

interface VitalsFormProps {
  vitals: { age: string; sex: string; cp: string; trestbps: string; chol: string; fbs: string; restecg: string; thalach: string; exang: string; oldpeak: string; slope: string; ca: string; thal: string };
  setVitals: React.Dispatch<React.SetStateAction<{ age: string; sex: string; cp: string; trestbps: string; chol: string; fbs: string; restecg: string; thalach: string; exang: string; oldpeak: string; slope: string; ca: string; thal: string }>>;
  height: string;
  setHeight: React.Dispatch<React.SetStateAction<string>>;
  weight: string;
  setWeight: React.Dispatch<React.SetStateAction<string>>;
  bmi: number | null;
  loading: boolean;
  onSubmit: (parsedVitals: any, bmi: number | null) => void;
  loadSample: (type: "normal" | "risk") => void;
  setError: React.Dispatch<React.SetStateAction<string>>;
}

export default function VitalsForm({
  vitals, setVitals,
  height, setHeight,
  weight, setWeight,
  bmi, loading,
  onSubmit, loadSample, setError,
}: VitalsFormProps) {
  const [voiceFilledFields, setVoiceFilledFields] = useState<string[]>([]);

  const handleFieldParsed = (fieldName: string, value: any) => {
    if (fieldName === "height") {
      setHeight(value.toString());
    } else if (fieldName === "weight") {
      setWeight(value.toString());
    } else {
      setVitals((prev) => ({ ...prev, [fieldName]: value.toString() }));
    }
    setVoiceFilledFields((prev) => [...prev, fieldName]);
    setTimeout(() => {
      setVoiceFilledFields((prev) => prev.filter((item) => item !== fieldName));
    }, 2500);
  };

  const update = (field: string, val: string) => setVitals((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsedVitals: any = {};
    for (const [key, val] of Object.entries(vitals)) {
      if (val === "") {
        setError(`Please fill out all medical fields. (Missing: ${key})`);
        return;
      }
      parsedVitals[key] = key === "oldpeak" ? parseFloat(val) : parseInt(val, 10);
    }
    onSubmit(parsedVitals, bmi);
  };

  return (
    <>
      <div className="flex items-center gap-3 bg-white p-4 border border-stone-200/60 rounded-2xl shadow-sm">
        <span className="text-xs font-semibold text-stone-500">Quick Pre-fill / جلد بھریں:</span>
        <button type="button" onClick={() => loadSample("normal")}
          className="text-xs text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/60 border border-emerald-200/40 px-3.5 py-1.5 rounded-lg font-medium transition-all">
          Healthy Patient / نارمل نمونہ
        </button>
        <button type="button" onClick={() => loadSample("risk")}
          className="text-xs text-rose-800 hover:text-rose-900 bg-rose-50 hover:bg-rose-100/60 border border-rose-200/40 px-3.5 py-1.5 rounded-lg font-medium transition-all">
          Elevated Risk / بیمار نمونہ
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-200/60 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
        <div className="border-b border-stone-100 pb-3 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-serif font-bold text-stone-800">Patient Vitals Entry</h2>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-mono">Fill in patient metrics</span>
          </div>
          <div id="voice-assistant" className="w-64">
            <VoiceInput onFieldParsed={handleFieldParsed} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <InputField label="Height (cm)" urdu="قد (سینٹی میٹر)" value={height} onChange={setHeight} placeholder="e.g. 175" highlighted={voiceFilledFields.includes("height")} />
          <InputField label="Weight (kg)" urdu="وزن (کلوگرام)" value={weight} onChange={setWeight} placeholder="e.g. 70" highlighted={voiceFilledFields.includes("weight")} />
          <div className="md:col-span-1 flex items-end"><BmiBar bmi={bmi} /></div>

          <div className="md:col-span-3 border-t border-stone-100 my-1" />

          <InputField label="Age (Years)" urdu="عمر (سال)" value={vitals.age} onChange={(v) => update("age", v)} placeholder="e.g. 54" highlighted={voiceFilledFields.includes("age")} />
          <SelectField label="Sex" urdu="جنس" value={vitals.sex} onChange={(v) => update("sex", v)} highlighted={voiceFilledFields.includes("sex")}
            options={[["1", "Male / مرد"], ["0", "Female / عورت"]]} />
          <SelectField label="Chest Pain Type (cp)" urdu="سینے کے درد کی قسم" value={vitals.cp} onChange={(v) => update("cp", v)} highlighted={voiceFilledFields.includes("cp")}
            options={[["0", "Typical Angina (0) / عام درد"], ["1", "Atypical Angina (1) / غیر معمولی درد"], ["2", "Non-anginal Pain (2) / غیر انجائنا درد"], ["3", "Asymptomatic (3) / کوئی علامت نہیں"]]} />
          <InputField label="Resting Blood Pressure (mm Hg)" urdu="آرام کی حالت میں بلڈ پریشر" value={vitals.trestbps} onChange={(v) => update("trestbps", v)} placeholder="e.g. 130" highlighted={voiceFilledFields.includes("trestbps")} />
          <InputField label="Serum Cholesterol (mg/dl)" urdu="کولیسٹرول کی سطح" value={vitals.chol} onChange={(v) => update("chol", v)} placeholder="e.g. 240" highlighted={voiceFilledFields.includes("chol")} />
          <SelectField label="Fasting Blood Sugar > 120 mg/dl" urdu="نہار منہ شوگر" value={vitals.fbs} onChange={(v) => update("fbs", v)} highlighted={voiceFilledFields.includes("fbs")}
            options={[["0", "Normal (≤ 120 mg/dl) / نارمل"], ["1", "Elevated (> 120 mg/dl) / بڑھا ہوا"]]} />
          <SelectField label="Resting ECG Results (restecg)" urdu="ای سی جی کے نتائج" value={vitals.restecg} onChange={(v) => update("restecg", v)} highlighted={voiceFilledFields.includes("restecg")}
            options={[["0", "Normal (0) / نارمل"], ["1", "ST-T Wave Abnormality (1) / غیر معمولی لہریں"], ["2", "Left Ventricular Hypertrophy (2) / دل کے پٹھے کا پھیلاؤ"]]} />
          <InputField label="Max Heart Rate Achieved (thalach)" urdu="زیادہ سے زیادہ دل کی دھڑکن" value={vitals.thalach} onChange={(v) => update("thalach", v)} placeholder="e.g. 150" highlighted={voiceFilledFields.includes("thalach")} />
          <SelectField label="Exercise Induced Angina" urdu="ورزش کے دوران سینے میں درد" value={vitals.exang} onChange={(v) => update("exang", v)} highlighted={voiceFilledFields.includes("exang")}
            options={[["0", "No (Absence) / نہیں"], ["1", "Yes (Presence) / ہاں"]]} />
          <InputField label="ST Depression (oldpeak)" urdu="ایس ٹی ڈپریشن" value={vitals.oldpeak} onChange={(v) => update("oldpeak", v)} placeholder="e.g. 1.5" step="0.1" highlighted={voiceFilledFields.includes("oldpeak")} />
          <SelectField label="ST Slope type" urdu="ایس ٹی ڈھلوان کی قسم" value={vitals.slope} onChange={(v) => update("slope", v)}
            options={[["0", "Upsloping (0) / اوپر کی طرف"], ["1", "Flat (1) / متوازن"], ["2", "Downsloping (2) / نیچے کی طرف"]]} />
          <SelectField label="Fluoroscopy Colored Vessels (ca)" urdu="بڑی رگوں کی تعداد" value={vitals.ca} onChange={(v) => update("ca", v)} highlighted={voiceFilledFields.includes("ca")}
            options={[["0", "0 Vessels"], ["1", "1 Vessel"], ["2", "2 Vessels"], ["3", "3 Vessels"], ["4", "4 Vessels (Unknown code)"]]} />
          <SelectField label="Thalassemia Type (thal)" urdu="تھلیسیمیا کی قسم" value={vitals.thal} onChange={(v) => update("thal", v)}
            options={[["0", "Normal/Unknown (0) / نارمل"], ["1", "Fixed Defect (1) / مستقل خرابی"], ["2", "Normal (2) / عمومی حالت"], ["3", "Reversible Defect (3) / عارضی خرابی"]]} />
        </div>

        <button type="submit" disabled={loading}
          className={`w-full py-3 rounded-xl font-serif text-sm font-bold shadow-md border text-white transition-all flex items-center justify-center gap-2 ${loading ? "bg-teal-800/60 border-teal-800 cursor-not-allowed" : "bg-teal-800 border-teal-900 hover:bg-teal-700 active:scale-[0.99]"}`}>
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Calculating risk...</>
          ) : (
            <span>ANALYZE VITALS / تجزیہ کریں</span>
          )}
        </button>
      </form>
    </>
  );
}

function InputField({ label, urdu, value, onChange, placeholder, step, highlighted }: {
  label: string; urdu: string; value: string; onChange: (v: string) => void; placeholder?: string; step?: string; highlighted?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 transition-all ${highlighted ? "scale-105" : ""}`}>
      <label className="text-xs font-semibold text-stone-700 flex flex-col">
        <span>{label}</span>
        <span className="text-[10px] text-stone-400 font-normal">{urdu}</span>
      </label>
      <input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`bg-stone-50 border px-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/30 transition-all ${highlighted ? "border-teal-500 bg-teal-50/20" : "border-stone-200"}`} />
    </div>
  );
}

function SelectField({ label, urdu, value, onChange, options, highlighted }: {
  label: string; urdu: string; value: string; onChange: (v: string) => void; options: [string, string][]; highlighted?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 transition-all ${highlighted ? "scale-105" : ""}`}>
      <label className="text-xs font-semibold text-stone-700 flex flex-col">
        <span>{label}</span>
        <span className="text-[10px] text-stone-400 font-normal">{urdu}</span>
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`bg-stone-50 border px-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700/30 transition-all ${highlighted ? "border-teal-500 bg-teal-50/20" : "border-stone-200"}`}>
        {options.map(([val, display]) => <option key={val} value={val}>{display}</option>)}
      </select>
    </div>
  );
}
