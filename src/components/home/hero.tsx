import Link from "next/link";
import { Tag } from "@/components/ui/tag";

export function Hero() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 md:py-24">
      <div className="flex flex-wrap gap-3">
        <Tag>Browser-first MVP</Tag>
        <Tag>Consumer-owned survey passport</Tag>
        <Tag>Mover-paid unlock</Tag>
      </div>
      <div className="max-w-4xl space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
          Create one structured moving survey, then share it with movers for faster,
          better quoting.
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-300">
          This product is being built as a consumer-first moving survey platform with
          room-by-room capture, major-item intelligence, completeness flags, and
          secure mover review workflows.
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link
          href="/survey"
          className="rounded-full bg-violet-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-400"
        >
          View survey flow
        </Link>
        <Link
          href="/mover"
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
        >
          View mover review flow
        </Link>
      </div>
    </section>
  );
}
