"use client";

import { useState } from "react";

export function CompanyBillingCard(input: {
  companyName: string;
  billingEmail: string;
  creditsRemaining: number;
  planKey: string | null;
  subscriptionStatus: string | null;
  periodEndsAt: string | Date | null;
  membersCount: number;
  includedUnlockCredits: number;
  bonusUnlockCredits: number;
}) {
  const [pendingAction, setPendingAction] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setPendingAction("checkout");
    setError(null);

    const response = await fetch("/api/mover/company/subscription/checkout", {
      method: "POST",
    });
    const body = (await response.json().catch(() => null)) as
      | {
          error?: string;
          checkoutUrl?: string | null;
          mode?: string;
        }
      | null;

    if (!response.ok) {
      setError(body?.error ?? "Failed to start mover billing checkout.");
      setPendingAction(null);
      return;
    }

    if (body?.checkoutUrl) {
      window.location.href = body.checkoutUrl;
      return;
    }

    window.location.reload();
  }

  async function openPortal() {
    setPendingAction("portal");
    setError(null);

    const response = await fetch("/api/mover/company/subscription/portal", {
      method: "POST",
    });
    const body = (await response.json().catch(() => null)) as
      | {
          error?: string;
          url?: string;
        }
      | null;

    if (!response.ok || !body?.url) {
      setError(body?.error ?? "Failed to open the billing portal.");
      setPendingAction(null);
      return;
    }

    window.location.href = body.url;
  }

  const hasActivePlan = ["ACTIVE", "TRIALING"].includes((input.subscriptionStatus ?? "").toUpperCase());

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-violet-200/80">Company billing</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{input.companyName}</h2>
          <p className="mt-3 text-sm text-slate-300">
            Billing email {input.billingEmail} • {input.membersCount} teammate{input.membersCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Credits" value={String(input.creditsRemaining)} />
          <Metric label="Included" value={String(input.includedUnlockCredits)} />
          <Metric label="Bonus" value={String(input.bonusUnlockCredits)} />
          <Metric label="Status" value={input.subscriptionStatus ?? "Not active"} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-7 text-slate-200">
        {hasActivePlan
          ? `Team plan ${input.planKey ?? "active"} is live. Shared survey unlocks will consume included credits first, then fall back to per-unlock payment if no company credits remain.`
          : "No active company subscription exists yet. Activate the mover team plan to issue recurring unlock credits and use the billing portal for self-serve management."}
        {input.periodEndsAt ? ` Current period ends ${new Date(input.periodEndsAt).toLocaleString()}.` : ""}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={startCheckout}
          disabled={pendingAction !== null}
          className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingAction === "checkout"
            ? "Starting..."
            : hasActivePlan
              ? "Top up or switch plan"
              : "Activate mover team plan"}
        </button>
        {hasActivePlan ? (
          <button
            type="button"
            onClick={openPortal}
            disabled={pendingAction !== null}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "portal" ? "Opening portal..." : "Manage billing"}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-100">{value}</p>
    </div>
  );
}
