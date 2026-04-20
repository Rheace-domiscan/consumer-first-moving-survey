import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { buildSurveyPackage } from "@/lib/survey-package";
import { formatMoney, hasActiveEntitlement } from "@/lib/payments";
import {
  companyCreditsRemaining,
  getPrimaryCompanyMembership,
  hasActiveCompanyEntitlement,
} from "@/lib/company-billing";
import { getSharedSurveyPreview } from "@/lib/surveys/repository";
import { Header } from "@/components/layout/header";
import { SharedPreview } from "@/components/survey/shared-preview";
import { SharedPreviewActions } from "@/components/survey/shared-preview-actions";

export default async function SharedSurveyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const userEmail = user?.emailAddresses[0]?.emailAddress ?? null;
  const membership = userId ? await getPrimaryCompanyMembership(userId) : null;
  const { token } = await params;

  const survey = await getSharedSurveyPreview(token);

  if (!survey) {
    notFound();
  }

  const primaryUnlock = survey.moverUnlocks[0] ?? null;
  const companyEntitled = membership
    ? await hasActiveCompanyEntitlement({
        companyId: membership.companyId,
        surveyId: survey.id,
      })
    : false;
  const unlocked = survey.moverUnlocks.some(
    (unlock) => unlock.status === "UNLOCKED" || hasActiveEntitlement(unlock.accessEntitlement),
  ) || companyEntitled;
  const surveyPackage = buildSurveyPackage(survey);

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <SharedPreview surveyPackage={surveyPackage} unlocked={unlocked} />
        <div className="mt-6">
          <SharedPreviewActions
            token={token}
            moverEmailHint={primaryUnlock?.moverEmail ?? userEmail ?? null}
            alreadyUnlocked={unlocked}
            amountFormatted={
              primaryUnlock
                ? formatMoney(primaryUnlock.quotedPriceCents, primaryUnlock.currency)
                : null
            }
            paymentStatus={primaryUnlock?.status ?? null}
            latestChargeStatus={primaryUnlock?.unlockCharges[0]?.status ?? null}
            companyName={membership?.company.name ?? null}
            companyCreditsRemaining={membership ? companyCreditsRemaining(membership.company) : 0}
            canUseCompanyCredit={Boolean(membership && companyCreditsRemaining(membership.company) > 0)}
          />
        </div>
      </section>
    </main>
  );
}
