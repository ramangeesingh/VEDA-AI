import { useRef } from "react";

export function StatCardSVG({ title, value, subtitle, color = "#6EC1E4" }: { title: string; value: string; subtitle?: string; color?: string }){
  const ref = useRef<SVGSVGElement | null>(null);
  async function download(){
    const svg = ref.current!;
    const s = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    await new Promise((res)=>{ img.onload = res; });
    const canvas = document.createElement('canvas');
    canvas.width = svg.viewBox.baseVal.width || 720;
    canvas.height = svg.viewBox.baseVal.height || 400;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${title.replace(/\s+/g,'-')}.png`;
    a.click();
  }
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <svg ref={ref} viewBox="0 0 720 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="720" height="400" rx="28" fill="url(#g)" stroke={color} strokeOpacity="0.3"/>
        <text x="40" y="90" fontSize="36" fontWeight="800" fill="#1f2937">{title}</text>
        <text x="40" y="170" fontSize="72" fontWeight="800" fill={color}>{value}</text>
        {subtitle && <text x="40" y="220" fontSize="20" fill="#374151">{subtitle}</text>}
        <text x="40" y="360" fontSize="14" fill="#6b7280">Veda — Adaptive Learning</text>
      </svg>
      <button onClick={download} className="mt-3 rounded-2xl bg-foreground text-background px-4 py-2 shadow-soft">Download</button>
    </div>
  );
}
