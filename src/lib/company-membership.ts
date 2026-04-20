import { prisma } from "@/lib/prisma";
import { ensureUniqueSlug, slugify } from "@/lib/company-billing-core";

export async function getPrimaryCompanyMembership(userId: string) {
  return prisma.companyMembership.findFirst({
    where: {
      clerkUserId: userId,
      status: "ACTIVE",
    },
    include: {
      company: {
        include: {
          subscriptions: {
            orderBy: {
              createdAt: "desc",
            },
            take: 5,
          },
          memberships: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function createCompanyForUser(input: {
  userId: string;
  email: string;
  companyName: string;
}) {
  const normalizedName = input.companyName.trim();

  if (!normalizedName) {
    throw new Error("Company name is required.");
  }

  const existingMembership = await getPrimaryCompanyMembership(input.userId);

  if (existingMembership) {
    return existingMembership.company;
  }

  const slug = await ensureUniqueSlug(normalizedName);
  const domain = input.email.includes("@") ? input.email.split("@")[1].toLowerCase() : null;

  return prisma.company.create({
    data: {
      name: normalizedName,
      slug,
      billingEmail: input.email,
      domain,
      memberships: {
        create: {
          clerkUserId: input.userId,
          email: input.email,
          role: "OWNER",
          status: "ACTIVE",
        },
      },
    },
  });
}

export async function resolveCompanyForInvite(input: {
  moverEmail: string;
  companyName?: string | null;
}) {
  const emailDomain = input.moverEmail.includes("@")
    ? input.moverEmail.split("@")[1].toLowerCase()
    : null;
  const normalizedName = input.companyName?.trim() || null;

  if (normalizedName) {
    const slug = slugify(normalizedName);
    const exactName = await prisma.company.findFirst({
      where: {
        OR: [
          {
            slug,
          },
          {
            name: {
              equals: normalizedName,
            },
          },
        ],
      },
    });

    if (exactName) {
      return exactName;
    }
  }

  if (emailDomain) {
    const byDomain = await prisma.company.findFirst({
      where: {
        domain: emailDomain,
      },
    });

    if (byDomain) {
      return byDomain;
    }
  }

  return null;
}
