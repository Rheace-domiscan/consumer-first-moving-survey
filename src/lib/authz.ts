import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const APP_ROLES = {
  OWNER: "OWNER",
  OPERATOR: "OPERATOR",
  ADMIN: "ADMIN",
} as const;

export type AppRoleName = (typeof APP_ROLES)[keyof typeof APP_ROLES];

const ROLE_RANK: Record<AppRoleName, number> = {
  [APP_ROLES.OWNER]: 0,
  [APP_ROLES.OPERATOR]: 1,
  [APP_ROLES.ADMIN]: 2,
};

export type UserAccess = {
  userId: string | null;
  role: AppRoleName | null;
  source: "anonymous" | "default-owner" | "db" | "env";
  assignmentId: string | null;
  isAuthenticated: boolean;
  isOps: boolean;
  isAdmin: boolean;
};

export class AuthzError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthzError";
    this.status = status;
  }
}

export function isRoleAtLeast(role: AppRoleName | null | undefined, minimum: AppRoleName) {
  if (!role) {
    return false;
  }

  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export async function getUserAccessById(userId: string | null): Promise<UserAccess> {
  if (!userId) {
    return {
      userId: null,
      role: null,
      source: "anonymous",
      assignmentId: null,
      isAuthenticated: false,
      isOps: false,
      isAdmin: false,
    };
  }

  if (env.adminClerkUserIds.includes(userId)) {
    return {
      userId,
      role: APP_ROLES.ADMIN,
      source: "env",
      assignmentId: null,
      isAuthenticated: true,
      isOps: true,
      isAdmin: true,
    };
  }

  const assignment = await prisma.appRoleAssignment.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  const role = (assignment?.role ?? APP_ROLES.OWNER) as AppRoleName;

  return {
    userId,
    role,
    source: assignment ? "db" : "default-owner",
    assignmentId: assignment?.id ?? null,
    isAuthenticated: true,
    isOps: isRoleAtLeast(role, APP_ROLES.OPERATOR),
    isAdmin: isRoleAtLeast(role, APP_ROLES.ADMIN),
  };
}

export async function getCurrentUserAccess() {
  const { userId } = await auth();
  return getUserAccessById(userId);
}

export async function requirePageUser() {
  const access = await getCurrentUserAccess();

  if (!access.userId) {
    redirect("/sign-in");
  }

  return access;
}

export async function requirePageRole(minimum: AppRoleName) {
  const access = await requirePageUser();

  if (!isRoleAtLeast(access.role, minimum)) {
    redirect("/survey/list");
  }

  return access;
}

export async function requireApiUser() {
  const access = await getCurrentUserAccess();

  if (!access.userId) {
    throw new AuthzError(401, "Unauthorized");
  }

  return access;
}

export async function requireApiRole(minimum: AppRoleName) {
  const access = await requireApiUser();

  if (!isRoleAtLeast(access.role, minimum)) {
    throw new AuthzError(403, "Forbidden");
  }

  return access;
}

export function canAccessSurvey(access: Pick<UserAccess, "role" | "userId">, ownerClerkUserId: string) {
  return access.userId === ownerClerkUserId || isRoleAtLeast(access.role, APP_ROLES.OPERATOR);
}

export function toAuthzErrorResponse(error: unknown) {
  if (error instanceof AuthzError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return null;
}
