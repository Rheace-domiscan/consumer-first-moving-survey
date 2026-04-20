"use client";

import { useEffect, useState } from "react";

export function SharedPreviewActions({
  token,
  moverEmailHint,
  alreadyUnlocked = false,
  amountFormatted = null,
  paymentStatus = null,
  latestChargeStatus = null,
  companyName = null,
  companyCreditsRemaining = 0,
  canUseCompanyCredit = false,
}: {
  token: string;
  moverEmailHint?: string | null;
  alreadyUnlocked?: boolean;
  amountFormatted?: string | null;
  paymentStatus?: string | null;
  latestChargeStatus?: string | null;
  companyName?: string | null;
  companyCreditsRemaining?: number;
  canUseCompanyCredit?: boolean;
}) {
  const [unlocking, setUnlocking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/shared/${token}/view`, { method: "POST" }).catch(() => undefined);
  }, [token]);

  async function unlock() {
    if (alreadyUnlocked) {
      return;
    }

    setUnlocking(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/shared/${token}/unlock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ moverEmail: moverEmailHint || undefined }),
    });

    const body = (await response.json().catch(() => null)) as
      | {
          error?: string;
          unlocked?: boolean;
          checkoutUrl?: string | null;
          mode?: string;
          amountFormatted?: string | null;
        }
      | null;

    if (!response.ok) {
      setError(body?.error ?? "Failed to unlock preview.");
      setUnlocking(false);
      return;
    }

    if (body?.checkoutUrl) {
      window.location.href = body.checkoutUrl;
      return;
    }

    setMessage(
      body?.mode === "mock"
        ? `Mock payment recorded${body.amountFormatted ? ` for ${body.amountFormatted}` : ""}.`
        : body?.mode === "company_credit"
          ? `${companyName || "Company"} credit applied.`
          : body?.mode === "company_entitled"
            ? `${companyName || "Company"} already has access.`
            : "Mover unlock recorded.",
    );
    setUnlocking(false);
    window.location.reload();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-semibold text-white">Mover access</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">
        This preview records view and unlock actions so the owner-side workflow can track mover engagement.
        {amountFormatted ? ` Unlock price: ${amountFormatted}.` : ""}
        {companyName
          ? ` Signed-in company: ${companyName}${canUseCompanyCredit ? ` (${companyCreditsRemaining} credits remaining).` : "."}`
          : ""}
      </p>
      {paymentStatus ? (
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
          Access state: {paymentStatus}
          {latestChargeStatus ? ` • Latest charge: ${latestChargeStatus}` : ""}
        </p>
      ) : null}
      <button
        type="button"
        onClick={unlock}
        disabled={unlocking || alreadyUnlocked}
        className="mt-4 rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {alreadyUnlocked
          ? "Access active"
          : unlocking
            ? "Starting checkout..."
            : canUseCompanyCredit
              ? `Use company credit${companyCreditsRemaining > 0 ? ` (${companyCreditsRemaining} left)` : ""}`
            : latestChargeStatus === "CHECKOUT_CREATED"
              ? "Continue to checkout"
              : amountFormatted
              ? `Unlock full survey for ${amountFormatted}`
              : "Unlock full survey"}
      </button>
      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
