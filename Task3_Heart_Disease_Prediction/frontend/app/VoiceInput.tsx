"use client";

import React, { useState, useEffect, useRef } from "react";

interface VoiceInputProps {
  onFieldParsed: (fieldName: string, value: any) => void;
}

export default function VoiceInput({ onFieldParsed }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<"en-US" | "ur-PK">("en-US");
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API Support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setFeedback("Listening... Speak now. / سن رہا ہوں... بولیں۔");
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        setFeedback("Microphone access denied. Please enable mic permissions.");
      } else {
        setFeedback(`Error: ${event.error}. Try again.`);
      }
    };

    rec.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setTranscript(resultText);
      parseSpeech(resultText);
    };

    recognitionRef.current = rec;
  }, []);

  // Update recognition language dynamically
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const toggleListening = () => {
    if (!isSupported) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      setFeedback("");
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Recognition start error:", err);
      }
    }
  };

  const parseSpeech = (text: string) => {
    const textLower = text.toLowerCase();
    let matchesFound = 0;
    
    // Detailed regex patterns for matching English and Urdu words followed by numbers
    const fieldPatterns: { [key: string]: { patterns: RegExp[]; parser: (val: string) => any } } = {
      age: {
        patterns: [
          /age\s*(\d+)/i,
          /عمر\s*(\d+)/,
          /(\d+)\s*years/i,
          /(\d+)\s*سال/
        ],
        parser: (val) => parseInt(val, 10)
      },
      height: {
        patterns: [
          /height\s*(\d+)/i,
          /قد\s*(\d+)/,
          /اونچائی\s*(\d+)/,
          /(\d+)\s*cm/i,
          /(\d+)\s*سینٹی/
        ],
        parser: (val) => parseInt(val, 10)
      },
      weight: {
        patterns: [
          /weight\s*(\d+)/i,
          /وزن\s*(\d+)/,
          /(\d+)\s*kg/i,
          /(\d+)\s*کلو/
        ],
        parser: (val) => parseInt(val, 10)
      },
      trestbps: {
        patterns: [
          /blood\s*pressure\s*(\d+)/i,
          /pressure\s*(\d+)/i,
          /بلڈ\s*پریشر\s*(\d+)/,
          /پریشر\s*(\d+)/
        ],
        parser: (val) => parseInt(val, 10)
      },
      chol: {
        patterns: [
          /cholesterol\s*(\d+)/i,
          /کولیسٹرول\s*(\d+)/
        ],
        parser: (val) => parseInt(val, 10)
      },
      thalach: {
        patterns: [
          /heart\s*rate\s*(\d+)/i,
          /pulse\s*(\d+)/i,
          /دل\s*کی\s*دھڑکن\s*(\d+)/,
          /دھڑکن\s*(\d+)/
        ],
        parser: (val) => parseInt(val, 10)
      },
      oldpeak: {
        patterns: [
          /depression\s*(\d+([.,]\d+)?)/i,
          /st\s*depression\s*(\d+([.,]\d+)?)/i,
          /اولڈ\s*پیک\s*(\d+([.,]\d+)?)/,
          /ڈپریشن\s*(\d+([.,]\d+)?)/
        ],
        parser: (val) => parseFloat(val.replace(",", "."))
      },
      ca: {
        patterns: [
          /vessels\s*(\d+)/i,
          /colored\s*vessels\s*(\d+)/i,
          /رگیں\s*(\d+)/,
          /رگوں\s*کی\s*تعداد\s*(\d+)/
        ],
        parser: (val) => parseInt(val, 10)
      }
    };

    // Parse numeric fields
    for (const [fieldName, config] of Object.entries(fieldPatterns)) {
      for (const pattern of config.patterns) {
        const match = textLower.match(pattern);
        if (match && match[1]) {
          const val = config.parser(match[1]);
          if (!isNaN(val)) {
            onFieldParsed(fieldName, val);
            matchesFound++;
            break;
          }
        }
      }
    }

    // Binary / Coded field parsing
    // 1. Sex
    if (textLower.includes("female") || textLower.includes("woman") || textLower.includes("عورت") || textLower.includes("خاتون")) {
      onFieldParsed("sex", 0);
      matchesFound++;
    } else if (textLower.includes("male") || textLower.includes(" man") || textLower.includes("مرد")) {
      onFieldParsed("sex", 1);
      matchesFound++;
    }

    // 2. Chest Pain (cp)
    if (textLower.includes("typical") || textLower.includes("عام درد")) {
      onFieldParsed("cp", 0);
      matchesFound++;
    } else if (textLower.includes("atypical") || textLower.includes("غیر معمولی")) {
      onFieldParsed("cp", 1);
      matchesFound++;
    } else if (textLower.includes("non-anginal") || textLower.includes("غیر انجائنا")) {
      onFieldParsed("cp", 2);
      matchesFound++;
    } else if (textLower.includes("asymptomatic") || textLower.includes("کوئی علامت نہیں")) {
      onFieldParsed("cp", 3);
      matchesFound++;
    }

    // 3. Fasting Blood Sugar (fbs)
    if (textLower.includes("sugar high") || textLower.includes("sugar elevated") || textLower.includes("شوگر زیادہ")) {
      onFieldParsed("fbs", 1);
      matchesFound++;
    } else if (textLower.includes("sugar normal") || textLower.includes("شوگر نارمل")) {
      onFieldParsed("fbs", 0);
      matchesFound++;
    }

    // 4. Exercise Induced Angina (exang)
    if (textLower.includes("angina yes") || textLower.includes("angina during exercise") || textLower.includes("درد ہے")) {
      onFieldParsed("exang", 1);
      matchesFound++;
    } else if (textLower.includes("angina no") || textLower.includes("درد نہیں ہے")) {
      onFieldParsed("exang", 0);
      matchesFound++;
    }

    // Provide immediate summary feedback to the user
    if (matchesFound > 0) {
      setFeedback(`Parsed ${matchesFound} fields successfully!`);
    } else {
      setFeedback("Spoken input did not match fields. Try saying e.g. 'Age 45, Cholesterol 210'.");
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-stone-50 border border-stone-200/60 rounded-2xl shadow-inner w-full">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-stone-700">Voice Assistant / <span className="font-normal text-stone-500 text-xs">صوتی معاون</span></span>
          <span className="text-[11px] text-stone-500">Auto-fill vitals by speaking</span>
        </div>
        
        {/* Language Toggle */}
        <div className="flex bg-stone-200/70 p-0.5 rounded-lg border border-stone-300/40 text-[11px] font-medium text-stone-600">
          <button
            type="button"
            className={`px-2.5 py-1 rounded-md transition-all ${
              language === "en-US"
                ? "bg-teal-700 text-white shadow-sm"
                : "hover:bg-stone-300/50"
            }`}
            onClick={() => setLanguage("en-US")}
          >
            EN
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 rounded-md transition-all ${
              language === "ur-PK"
                ? "bg-teal-700 text-white shadow-sm"
                : "hover:bg-stone-300/50"
            }`}
            onClick={() => setLanguage("ur-PK")}
          >
            اردو
          </button>
        </div>
      </div>

      {/* Control Strip */}
      <div className="flex items-center gap-3 mt-1.5">
        <button
          type="button"
          onClick={toggleListening}
          disabled={!isSupported}
          className={`flex items-center justify-center w-12 h-12 rounded-full border shadow-sm transition-all duration-300 ${
            !isSupported
              ? "bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed"
              : isListening
              ? "bg-rose-500 border-rose-600 text-white animate-pulse"
              : "bg-teal-800 border-teal-900 text-teal-50 hover:bg-teal-700 hover:scale-105 active:scale-95"
          }`}
          title={isSupported ? "Click to toggle voice input" : "Speech Recognition not supported in this browser"}
        >
          {isListening ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H10a1 1 0 01-1-1v-4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8A3 3 0 019 8V5a3 3 0 116 0v3a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        <div className="flex-1 text-xs">
          {transcript ? (
            <div className="text-stone-700 bg-stone-100/50 p-2 rounded-lg border border-stone-200/40 italic font-mono break-all line-clamp-2">
              "{transcript}"
            </div>
          ) : (
            <div className="text-stone-500 font-serif leading-tight">
              {isSupported ? (
                <>
                  Click mic and say: <strong className="text-teal-800 font-sans font-medium">"Age 45, weight 75"</strong> or <strong className="text-teal-800 font-sans font-medium">"عمر 45، وزن 75"</strong>
                </>
              ) : (
                <span className="text-rose-600">Speech recognition not supported in this browser.</span>
              )}
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <span className="text-[10px] text-teal-800/80 font-mono mt-1 px-1 bg-teal-50 border border-teal-100 rounded-md py-0.5 w-fit">
          {feedback}
        </span>
      )}
    </div>
  );
}
