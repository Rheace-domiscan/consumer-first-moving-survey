import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  DRAFT: "border-slate-400/30 bg-slate-500/10 text-slate-100",
  COLLECTING_MEDIA: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  SUBMITTED: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  PROCESSING: "border-violet-400/30 bg-violet-500/10 text-violet-100",
  READY_TO_SHARE: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  REVIEW_REQUIRED: "border-rose-400/30 bg-rose-500/10 text-rose-100",
  ARCHIVED: "border-slate-500/30 bg-slate-500/10 text-slate-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-medium",
        statusStyles[status] ?? statusStyles.DRAFT,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
