import MainLayout from "@/components/layouts/MainLayout";
import { setGrade, Grade, getProfile } from "@/lib/vedaStore";
import { useState } from "react";
import { Book, Blocks, Sparkles } from "lucide-react";

const GRADES: Grade[] = ["Nursery","KG","1","2","3","4","5","6","7","8","9","10","11","12"];

export default function ClassSelect() {
  const [selected, setSelected] = useState<Grade | null>(getProfile().grade ?? null);
  const [confirm, setConfirm] = useState<string>("");

  function choose(g: Grade) {
    setGrade(g);
    setSelected(g);
    setConfirm(`Great! You’re in Class ${g}. Let’s start learning!`);
    setTimeout(()=>setConfirm(""), 3000);
  }

  return (
    <MainLayout>
      <div className="relative">
        {confirm && (
          <div className="fixed left-1/2 top-20 -translate-x-1/2 z-50 rounded-2xl bg-white text-veda-primary-ink border shadow-soft-lg px-4 py-3">
            {confirm}
          </div>
        )}
        <header className="mb-6 flex items-center gap-3">
          <Sparkles className="text-veda-sky" />
          <h1 className="text-2xl font-extrabold">Select Your Class</h1>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {GRADES.map((g)=> (
            <button key={g} onClick={()=>choose(g)}
              className={`group rounded-2xl border bg-card p-5 text-left shadow-soft transition-all hover:-translate-y-1 hover:shadow-soft-lg active:scale-95 ${selected===g?"ring-2 ring-veda-sky":""}`}>
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-3 shadow-soft ${isYoung(g)?"bg-veda-yellow/40":"bg-veda-lavender/30"}`}>
                  {isYoung(g)? <Blocks className="text-veda-yellow" /> : <Book className="text-veda-lavender" />}
                </div>
                <div>
                  <div className="font-bold">{label(g)}</div>
                  <div className="text-xs text-muted-foreground">Tap to choose</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

function isYoung(g: Grade){ return ["Nursery","KG","1","2","3","4","5"].includes(g); }
function label(g: Grade){ return g==="Nursery"||g==="KG"? g : `Class ${g}`; }
