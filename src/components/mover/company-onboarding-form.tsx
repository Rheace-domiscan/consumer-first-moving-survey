"use client";

import { useState } from "react";

export function CompanyOnboardingForm({ userEmail }: { userEmail: string | null }) {
  const [companyName, setCompanyName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch("/api/mover/company", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ companyName }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to create mover company.");
      setPending(false);
      return;
    }

    window.location.reload();
  }

  return (
    <form className="rounded-2xl border border-white/10 bg-white/5 p-5" onSubmit={submit}>
      <h2 className="text-xl font-semibold text-white">Create mover company</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        Attach your signed-in mover account to a company billing profile so survey unlocks,
        entitlements, and team credits can be managed centrally.
      </p>
      <div className="mt-4 grid gap-4">
        <input
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          placeholder="Acme Moving & Storage"
          className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
          Billing email: {userEmail ?? "No primary email available"}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create company"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}
