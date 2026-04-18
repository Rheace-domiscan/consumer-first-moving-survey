export function StatusBanner({
  readinessState,
  status,
}: {
  readinessState: string | null;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
      <p>
        Survey status: <span className="font-semibold text-white">{status.replaceAll("_", " ")}</span>
      </p>
      <p className="mt-2">
        Readiness: <span className="font-semibold text-white">{(readinessState || "NOT_READY").replaceAll("_", " ")}</span>
      </p>
    </div>
  );
}
