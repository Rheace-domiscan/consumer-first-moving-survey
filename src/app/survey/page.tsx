import { Header } from "@/components/layout/header";
import { SectionCard } from "@/components/ui/section-card";

const steps = [
  "Move basics and property profile",
  "Room and area selection",
  "Per-room upload and capture",
  "Manual declarations for inaccessible or missed items",
  "Completeness review and final share",
];

export default function SurveyPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-4xl px-6 py-16">
        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">
            Consumer survey flow
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-white">
            Guided self-survey placeholder
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            This route will become the actual browser-first self-survey experience.
            For now it anchors the v1 structure and keeps the main workflow visible in
            the app scaffold.
          </p>
          <ol className="mt-8 space-y-3 text-sm text-slate-200">
            {steps.map((step, index) => (
              <li
                key={step}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <span className="mr-3 text-violet-300">0{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </SectionCard>
      </section>
    </main>
  );
}
