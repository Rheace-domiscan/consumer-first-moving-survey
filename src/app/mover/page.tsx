import { Header } from "@/components/layout/header";
import { SectionCard } from "@/components/ui/section-card";

const previewSections = [
  "Survey preview before unlock",
  "Room-by-room inventory review",
  "Major-item and volume summary",
  "Packing guidance and special handling flags",
  "Confidence and completeness indicators",
];

export default function MoverPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-4xl px-6 py-16">
        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">
            Mover workflow
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-white">
            Mover unlock and review placeholder
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            This route will become the mover-facing review layer with preview,
            unlock, structured survey inspection, and export actions.
          </p>
          <div className="mt-8 grid gap-3">
            {previewSections.map((section) => (
              <div
                key={section}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
              >
                {section}
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </main>
  );
}
