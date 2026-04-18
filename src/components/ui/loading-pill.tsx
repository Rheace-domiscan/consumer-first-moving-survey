export function LoadingPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-100">
      {label}
    </span>
  );
}
