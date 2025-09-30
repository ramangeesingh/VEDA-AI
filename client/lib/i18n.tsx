import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProfile, saveProfile } from "./vedaStore";

type Lang = "en" | "hi";

type Dict = Record<string, string>;
const dicts: Record<Lang, Dict> = {
  en: {
    xpPoints: "XP Points",
    streak: "Streak",
    badges: "Badges",
    leaderboard: "Leaderboard",
    rank: "Rank",
    name: "Name",
    class: "Class",
    score: "Score",
    date: "Date",
    download: "Download",
    downloadCards: "Downloadable Cards",
    practice: "Practice",
    question: "Question",
    submit: "Submit",
    scoreLabel: "Score",
    selectClassPrompt: "Please select your class first.",
    goToClassSelection: "Go to Class Selection",
    subject: "Subject",
    difficulty: "Difficulty",
    start: "Start",
  },
  hi: {
    xpPoints: "एक्सपी अंक",
    streak: "स्ट्रिक",
    badges: "बैज",
    leaderboard: "लीडरबोर्ड",
    rank: "रैंक",
    name: "नाम",
    class: "कक्षा",
    score: "स्कोर",
    date: "तारीख",
    download: "डाउनलोड",
    downloadCards: "डाउनलोड करने योग्य कार्ड",
    practice: "अभ्यास",
    question: "प्रश्न",
    submit: "जमा करें",
    scoreLabel: "अंक",
    selectClassPrompt: "कृपया पहले अपनी कक्षा चुनें।",
    goToClassSelection: "कक्षा चयन पर जाएं",
    subject: "विषय",
    difficulty: "कठिनाई",
    start: "शुरू करें",
  },
};

const I18nContext = createContext<{ lang: Lang; setLang: (l: Lang)=>void; t: (k: string)=>string }>({ lang: "en", setLang: ()=>{}, t: (k)=>k });

export function I18nProvider({ children }: { children: React.ReactNode }){
  const [lang, setLangState] = useState<Lang>(()=> (getProfile() as any).lang || "en");
  function setLang(l: Lang){
    const p = getProfile();
    (p as any).lang = l;
    saveProfile(p);
    setLangState(l);
  }
  const value = useMemo(()=>({ lang, setLang, t: (k: string)=> dicts[lang][k] ?? k }),[lang]);
  useEffect(()=>{},[lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(){ return useContext(I18nContext); }
