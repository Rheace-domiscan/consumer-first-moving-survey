import { CreateSurveyForm } from "@/components/survey/create-survey-form";
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
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <SectionCard>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">
              Consumer survey flow
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white">
              Create the survey draft
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              This is the first real product slice. It captures move basics, room
              structure, and enough context to anchor later upload, extraction, and
              share flows.
            </p>

            <div className="mt-8">
              <CreateSurveyForm />
            </div>
          </SectionCard>

          <SectionCard className="h-fit">
            <h2 className="text-lg font-semibold text-white">Planned flow after draft creation</h2>
            <ol className="mt-6 space-y-3 text-sm text-slate-200">
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
        </div>
      </section>
    </main>
  );
}
