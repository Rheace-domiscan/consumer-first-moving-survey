"use client";

export function PrintPackageActions() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full border border-slate-300/50 px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-500 hover:bg-slate-100 print:hidden"
    >
      Print / Save as PDF
    </button>
  );
}
