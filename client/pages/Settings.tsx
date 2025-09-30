import MainLayout from "@/components/layouts/MainLayout";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { getProfile, saveProfile } from "@/lib/vedaStore";
import { useI18n } from "@/lib/i18n";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useI18n();
  const [language, setLanguage] = useState<string>(lang);
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);
  const [fontScale, setFontScale] = useState(1);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto grid gap-6">
        <h1 className="text-2xl font-extrabold">Settings</h1>

        <section className="rounded-2xl border p-5 shadow-soft bg-card">
          <h2 className="font-bold mb-3">Theme</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={()=>setTheme("light")} className={`rounded-2xl px-4 py-2 border shadow-soft ${theme==="light"?"bg-veda-mint/20 border-veda-mint":""}`}>Light</button>
            <button onClick={()=>setTheme("dark")} className={`rounded-2xl px-4 py-2 border shadow-soft ${theme==="dark"?"bg-veda-sky/20 border-veda-sky":""}`}>Dark</button>
            <button onClick={()=>setTheme("system")} className={`rounded-2xl px-4 py-2 border shadow-soft ${theme==="system"?"bg-veda-yellow/30 border-veda-yellow":""}`}>System</button>
          </div>
        </section>

        <section className="rounded-2xl border p-5 shadow-soft bg-card">
          <h2 className="font-bold mb-3">Language</h2>
          <select value={language} onChange={(e)=>{ setLanguage(e.target.value); setLang(e.target.value as any); }} className="rounded-2xl border px-3 py-2 bg-background shadow-soft">
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </section>

        <section className="rounded-2xl border p-5 shadow-soft bg-card">
          <h2 className="font-bold mb-3">Notifications</h2>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={email} onChange={(e)=>setEmail(e.target.checked)} /> Email
          </label>
          <label className="flex items-center gap-3 mt-2">
            <input type="checkbox" checked={sms} onChange={(e)=>setSms(e.target.checked)} /> SMS
          </label>
        </section>

        <section className="rounded-2xl border p-5 shadow-soft bg-card">
          <h2 className="font-bold mb-3">Accessibility</h2>
          <label className="block text-sm mb-2">Font size</label>
          <input type="range" min={0.9} max={1.3} step={0.05} value={fontScale} onChange={(e)=>setFontScale(Number(e.target.value))} className="w-full" />
          <p className="mt-2 text-sm text-muted-foreground">Preview:</p>
          <p style={{ transform: `scale(${fontScale})`, transformOrigin: "left center" }} className="mt-1 rounded-2xl border px-3 py-2 inline-block shadow-soft">This text scales with your preference.</p>
        </section>
      </div>
    </MainLayout>
  );
}
