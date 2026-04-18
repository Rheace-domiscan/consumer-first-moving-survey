import { SectionCard } from "@/components/ui/section-card";

const guidance = [
  "Open cabinets, wardrobes, and storage spaces before filming when relevant.",
  "Capture large furniture from enough distance that size and shape are visible.",
  "Call out fragile, high-value, or awkward items in room notes if the media may undersell them.",
  "If access is difficult, add a short note instead of trying to force a bad clip.",
];

export function CaptureGuidance() {
  return (
    <SectionCard>
      <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Capture guidance</p>
      <h2 className="mt-4 text-xl font-semibold text-white">What to capture well</h2>
      <div className="mt-6 grid gap-3">
        {guidance.map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            {item}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
