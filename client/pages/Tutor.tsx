import MainLayout from "@/components/layouts/MainLayout";
import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles } from "lucide-react";

const mascotUrl = "https://cdn.builder.io/api/v1/image/assets%2F39ee7dd62eee466082afcbad8171f571%2F00dc3fb32365460fb80ddd8776526a6e?format=webp&width=800";

type Msg = { role: "user"|"assistant"; text: string };

export default function Tutor(){
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", text: "Ask me anything! I’ll explain it at your level." },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); },[msgs.length]);

  function send(){
    if (!input.trim()) return;
    const q = input.trim();
    setMsgs(m=>[...m, { role:"user", text:q }]);
    setInput("");
    setTimeout(()=>{
      const answer = simpleAnswer(q);
      setMsgs(m=>[...m, { role:"assistant", text: answer }]);
    }, 400);
  }

  return (
    <MainLayout>
      <div className="grid md:grid-cols-[260px,1fr] lg:grid-cols-[320px,1fr] xl:grid-cols-[380px,1fr] gap-4 lg:gap-8 items-start">
        {/* Left: mascot under logo */}
        <div className="relative -ml-2 sm:-ml-6 md:-ml-10 lg:-ml-16 xl:-ml-24 2xl:-ml-32">
          <img src={mascotUrl} alt="Tutor mascot" className="w-full max-w-[360px] md:max-w-[480px] lg:max-w-[640px] xl:max-w-[820px] 2xl:max-w-[1000px] animate-float pointer-events-none select-none"/>
                  </div>
        {/* Right: chat */}
        <div className="relative z-[1] rounded-2xl border shadow-soft bg-card transition-transform duration-300 ease-out transform-gpu hover:shadow-soft-lg hover:-translate-y-1">
          <div ref={listRef} className="h-[10cm] overflow-auto p-4 bg-[repeating-linear-gradient(0deg,transparent,transparent_28px,#eaeaea_29px,#eaeaea_30px)] rounded-t-2xl">
            {msgs.map((m, idx)=> (
              <div key={idx} className={`mb-2 flex ${m.role==="user"?"justify-end":"justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-lg animate-bubble-in ${m.role==="user"?"bg-veda-sky text-white":"bg-veda-lavender/40 text-foreground"}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 flex flex-wrap items-center gap-2 border-t">
            <Starter text="Explain this topic" onPick={setInput} />
            <Starter text="Solve this example" onPick={setInput} />
            <Starter text="Why is speed = distance ÷ time?" onPick={setInput} />
          </div>
          <div className="p-3 flex items-center gap-2">
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Type your question..." className="flex-1 rounded-2xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 transition-colors"/>
            <button onClick={send} className="rounded-2xl bg-foreground text-background px-4 py-2 shadow-soft flex items-center gap-2 transition-all active:scale-95"><Send size={16}/> Send</button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function Starter({ text, onPick }: { text: string; onPick: (v: string)=>void }){
  return (
    <button onClick={()=>onPick(text)} className="rounded-full bg-muted px-3 py-1 text-xs shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all flex items-center gap-1"><Sparkles size={14}/> {text}</button>
  );
}

function simpleAnswer(q: string){
  const lower = q.toLowerCase();
  if (lower.includes("speed")) return "Speed = distance ÷ time. If you travel 100 km in 2 hours, speed is 50 km/h.";
  if (lower.includes("example")) return "Sure! Try: 12 × 7 = 84. Notice 12 × 5 = 60 and 12 × 2 = 24, then 60 + 24 = 84.";
  if (lower.includes("explain")) return "I’ll tailor the explanation based on your class. Start with the definition, then a simple example, then a quick practice.";
  return "Great question! Let’s break it into simple steps and try a small example.";
}
