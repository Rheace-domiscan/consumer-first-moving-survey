import { prisma } from "@/lib/prisma";
import { ENTITLEMENT_STATUSES } from "@/lib/payments";
import { ACTIVE_SUBSCRIPTION_STATUSES } from "@/lib/company-billing-core";
import { companyCreditsRemaining } from "@/lib/company-credits";

export async function getCompanyDashboard(input: {
  companyId: string;
  userEmail: string | null;
}) {
  const company = await prisma.company.findUnique({
    where: {
      id: input.companyId,
    },
    include: {
      memberships: {
        orderBy: {
          createdAt: "asc",
        },
      },
      subscriptions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
      moverUnlocks: {
        where: input.userEmail
          ? {
              OR: [
                {
                  moverEmail: input.userEmail,
                },
                {
                  companyId: input.companyId,
                },
              ],
            }
          : {
              companyId: input.companyId,
            },
        include: {
          survey: {
            select: {
              id: true,
              title: true,
              shareToken: true,
              updatedAt: true,
            },
          },
          accessEntitlement: true,
          unlockCharges: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      },
      accessEntitlements: {
        where: {
          status: ENTITLEMENT_STATUSES.ACTIVE,
        },
        include: {
          survey: {
            select: {
              id: true,
              title: true,
              shareToken: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      },
    },
  });

  if (!company) {
    return null;
  }

  const activeSubscription = company.subscriptions.find((subscription) =>
    ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status),
  );

  return {
    company,
    activeSubscription,
    creditsRemaining: companyCreditsRemaining(company),
  };
}
