"use client";

import Link from "next/link";
import { useEffect } from "react";

export function BillingReturnClient({ destination }: { destination: string }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      window.location.replace(destination);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [destination]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/30">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Billing handoff</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Returning to mover workspace</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          The billing provider handoff is complete. You are being redirected back into the mover dashboard.
        </p>
        <Link
          href={destination}
          className="mt-6 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
        >
          Continue now
        </Link>
      </div>
    </main>
  );
}
