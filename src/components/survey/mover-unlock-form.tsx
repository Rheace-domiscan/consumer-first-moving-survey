"use client";

import { useState } from "react";

export function MoverUnlockForm({ surveyId }: { surveyId: string }) {
  const [moverEmail, setMoverEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/surveys/${surveyId}/mover-unlocks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ moverEmail, companyName }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to create mover invite.");
      setPending(false);
      return;
    }

    setMessage("Mover invite created with commercial unlock pricing.");
    setMoverEmail("");
    setCompanyName("");
    setPending(false);
    window.location.reload();
  }

  return (
    <form className="rounded-2xl border border-white/10 bg-white/5 p-5" onSubmit={submit}>
      <h3 className="text-lg font-semibold text-white">Invite mover</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        Create the commercial unlock record the mover will use to pay for and access the
        structured survey package.
      </p>
      <div className="mt-4 grid gap-4">
        <input
          value={moverEmail}
          onChange={(event) => setMoverEmail(event.target.value)}
          placeholder="mover@company.com"
          className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <input
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          placeholder="Company name"
          className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create mover invite"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}
