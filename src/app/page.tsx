import { Hero } from "@/components/home/hero";
import { Header } from "@/components/layout/header";
import { SectionCard } from "@/components/ui/section-card";

const pillars = [
  {
    title: "Consumer survey flow",
    body: "Guided room-by-room capture with optional branching for lofts, garages, sheds, and inaccessible areas.",
  },
  {
    title: "Quote-ready structure",
    body: "PDF and JSON outputs designed for mover review, not just generic lead capture.",
  },
  {
    title: "Confidence-aware intelligence",
    body: "Major-item-first AI with completeness flags, declared versus observed distinction, and review routing later.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        {pillars.map((pillar) => (
          <SectionCard key={pillar.title}>
            <h2 className="text-lg font-semibold text-white">{pillar.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{pillar.body}</p>
          </SectionCard>
        ))}
      </section>
    </main>
  );
}
