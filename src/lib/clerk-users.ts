import { clerkClient } from "@clerk/nextjs/server";
import { APP_ROLES, type AppRoleName } from "@/lib/authz";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const ROLE_RANK: Record<AppRoleName, number> = {
  [APP_ROLES.OWNER]: 0,
  [APP_ROLES.OPERATOR]: 1,
  [APP_ROLES.ADMIN]: 2,
};

export type ClerkUserSummary = {
  userId: string;
  displayName: string;
  email: string | null;
};

export type DetailedRoleAssignment = {
  id: string;
  clerkUserId: string;
  role: AppRoleName;
  effectiveRole: AppRoleName;
  grantedByClerkUserId: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  source: "db" | "env";
  user: ClerkUserSummary | null;
  grantedBy: ClerkUserSummary | null;
};

export async function getClerkUserSummaries(userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const summaries = new Map<string, ClerkUserSummary>();

  if (uniqueIds.length === 0) {
    return summaries;
  }

  const client = await clerkClient();

  for (let index = 0; index < uniqueIds.length; index += 100) {
    const batch = uniqueIds.slice(index, index + 100);
    const response = await client.users.getUserList({
      userId: batch,
      limit: batch.length,
    });

    for (const user of response.data) {
      summaries.set(user.id, toUserSummary(user));
    }
  }

  return summaries;
}

export async function resolveClerkIdentifier(identifier: string) {
  const trimmed = identifier.trim();

  if (!trimmed) {
    return null;
  }

  const client = await clerkClient();

  if (trimmed.startsWith("user_")) {
    const user = await client.users.getUser(trimmed).catch(() => null);
    return user ? toUserSummary(user) : null;
  }

  if (trimmed.includes("@")) {
    const response = await client.users.getUserList({
      emailAddress: [trimmed],
      limit: 10,
    });
    const exact =
      response.data.find((user) =>
        user.emailAddresses.some(
          (email) => email.emailAddress.toLowerCase() === trimmed.toLowerCase(),
        ),
      ) ?? response.data[0];

    return exact ? toUserSummary(exact) : null;
  }

  const response = await client.users.getUserList({
    query: trimmed,
    limit: 10,
  });
  const exact = response.data.find((user) => user.id === trimmed) ?? null;

  return exact ? toUserSummary(exact) : null;
}

export async function listDetailedRoleAssignments() {
  const dbAssignments = await prisma.appRoleAssignment.findMany({
    orderBy: [
      {
        updatedAt: "desc",
      },
    ],
  });

  const envOnlyAssignments = env.adminClerkUserIds
    .filter((clerkUserId) => !dbAssignments.some((assignment) => assignment.clerkUserId === clerkUserId))
    .map((clerkUserId) => ({
      id: `env:${clerkUserId}`,
      clerkUserId,
      role: APP_ROLES.ADMIN,
      effectiveRole: APP_ROLES.ADMIN,
      grantedByClerkUserId: null,
      note: "Bootstrap admin from ADMIN_CLERK_USER_IDS.",
      createdAt: new Date(0),
      updatedAt: new Date(0),
      source: "env" as const,
    }));

  const allAssignments = [
    ...dbAssignments.map((assignment) => ({
      ...assignment,
      effectiveRole: env.adminClerkUserIds.includes(assignment.clerkUserId)
        ? APP_ROLES.ADMIN
        : assignment.role,
      source: "db" as const,
    })),
    ...envOnlyAssignments,
  ].sort((left, right) => {
    const roleDelta = ROLE_RANK[right.effectiveRole] - ROLE_RANK[left.effectiveRole];

    if (roleDelta !== 0) {
      return roleDelta;
    }

    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });

  const userSummaries = await getClerkUserSummaries([
    ...allAssignments.map((assignment) => assignment.clerkUserId),
    ...allAssignments
      .map((assignment) => assignment.grantedByClerkUserId)
      .filter((value): value is string => Boolean(value)),
  ]);

  return allAssignments.map((assignment) => ({
    ...assignment,
    user: userSummaries.get(assignment.clerkUserId) ?? null,
    grantedBy: assignment.grantedByClerkUserId
      ? userSummaries.get(assignment.grantedByClerkUserId) ?? null
      : null,
  })) satisfies DetailedRoleAssignment[];
}

function toUserSummary(user: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { emailAddress: string }[];
}) {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  return {
    userId: user.id,
    displayName: displayName || user.emailAddresses[0]?.emailAddress || user.id,
    email: user.emailAddresses[0]?.emailAddress ?? null,
  };
}
