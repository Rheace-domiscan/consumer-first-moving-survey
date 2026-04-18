import { Header } from "@/components/layout/header";
import { SectionCard } from "@/components/ui/section-card";

const previewSections = [
  "Shared survey preview link",
  "Structured room and move summary",
  "First-pass inventory review",
  "Quote prep inputs and special handling flags",
  "Unlock/commercial gating later",
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
            Mover preview and unlock foundation
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            This route now represents the mover-facing preview direction. The live shared
            preview route is token-based and lays the groundwork for the eventual unlock flow.
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
