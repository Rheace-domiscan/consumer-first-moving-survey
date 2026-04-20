import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SectionCard } from "@/components/ui/section-card";
import { CompanyBillingCard } from "@/components/mover/company-billing-card";
import { CompanyOnboardingForm } from "@/components/mover/company-onboarding-form";
import { getCompanyDashboard, getPrimaryCompanyMembership } from "@/lib/company-billing";
import { formatMoney } from "@/lib/payments";

export default async function MoverPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress ?? null;
  const membership = await getPrimaryCompanyMembership(userId);
  const dashboard = membership
    ? await getCompanyDashboard({
        companyId: membership.companyId,
        userEmail,
      })
    : null;

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionCard>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-200/80">Mover workspace</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Mover billing and survey access</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            This is the mover-side control plane for company billing, included unlock credits,
            shared survey access, and the Stripe-backed commercial workflow.
          </p>
        </SectionCard>

        {dashboard ? (
          <div className="mt-6 grid gap-6">
            <CompanyBillingCard
              companyName={dashboard.company.name}
              billingEmail={dashboard.company.billingEmail}
              creditsRemaining={dashboard.creditsRemaining}
              planKey={dashboard.company.planKey}
              subscriptionStatus={dashboard.company.subscriptionStatus}
              periodEndsAt={dashboard.company.currentPeriodEndsAt}
              membersCount={dashboard.company.memberships.length}
              includedUnlockCredits={dashboard.company.includedUnlockCredits}
              bonusUnlockCredits={dashboard.company.bonusUnlockCredits}
            />

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <SectionCard>
                <h2 className="text-xl font-semibold text-white">Pending and recent unlocks</h2>
                <div className="mt-4 grid gap-3">
                  {dashboard.company.moverUnlocks.length ? (
                    dashboard.company.moverUnlocks.map((unlock) => (
                      <div key={unlock.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {unlock.survey.title || "Untitled survey"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {unlock.moverEmail}
                              {unlock.companyName ? ` • ${unlock.companyName}` : ""}
                            </p>
                            <p className="mt-2 text-xs text-slate-400">
                              {formatMoney(unlock.quotedPriceCents, unlock.currency)}
                              {unlock.unlockCharges[0]
                                ? ` • ${unlock.unlockCharges[0].provider} ${unlock.unlockCharges[0].status}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                              {unlock.status}
                            </span>
                            {unlock.survey.shareToken ? (
                              <Link
                                href={`/shared/${unlock.survey.shareToken}`}
                                className="rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
                              >
                                Open shared survey
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState body="No mover unlocks are associated with this company yet. Once an owner shares or invites your team, those surveys will appear here." />
                  )}
                </div>
              </SectionCard>

              <SectionCard>
                <h2 className="text-xl font-semibold text-white">Active company access</h2>
                <div className="mt-4 grid gap-3">
                  {dashboard.company.accessEntitlements.length ? (
                    dashboard.company.accessEntitlements.map((entitlement) => (
                      <div key={entitlement.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-semibold text-white">
                          {entitlement.survey.title || "Untitled survey"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Granted {new Date(entitlement.grantedAt).toLocaleString()}
                        </p>
                        {entitlement.survey.shareToken ? (
                          <Link
                            href={`/shared/${entitlement.survey.shareToken}`}
                            className="mt-3 inline-flex rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
                          >
                            Re-open unlocked survey
                          </Link>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <EmptyState body="No active survey entitlements are attached to this company yet." />
                  )}
                </div>
              </SectionCard>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <CompanyOnboardingForm userEmail={userEmail} />
            <SectionCard>
              <h2 className="text-xl font-semibold text-white">What this unlocks</h2>
              <div className="mt-4 grid gap-3">
                {[
                  "Company billing profile linked to Stripe Checkout and the billing portal",
                  "Monthly included unlock credits for shared survey review",
                  "Company-level entitlements so any teammate can reopen purchased surveys",
                  "Pending owner invites and unlocked survey history in one dashboard",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyState({ body }: { body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-400">
      {body}
    </div>
  );
}
