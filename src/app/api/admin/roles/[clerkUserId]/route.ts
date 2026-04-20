import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { APP_ROLES, type AppRoleName, requireApiRole, toAuthzErrorResponse } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clerkUserId: string }> },
) {
  try {
    await requireApiRole(APP_ROLES.ADMIN);
    const { clerkUserId } = await params;

    if (env.adminClerkUserIds.includes(clerkUserId)) {
      return NextResponse.json(
        { error: "This admin is managed by ADMIN_CLERK_USER_IDS and cannot be edited here." },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      role?: AppRoleName;
      note?: string;
    };

    if (body.role !== APP_ROLES.OPERATOR && body.role !== APP_ROLES.ADMIN) {
      return NextResponse.json(
        { error: "Updated role must be OPERATOR or ADMIN." },
        { status: 400 },
      );
    }

    const assignment = await prisma.appRoleAssignment.upsert({
      where: {
        clerkUserId,
      },
      update: {
        role: body.role,
        note: body.note?.trim() || null,
      },
      create: {
        clerkUserId,
        role: body.role,
        note: body.note?.trim() || null,
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    return (
      toAuthzErrorResponse(error) ??
      NextResponse.json({ error: "Failed to update role assignment." }, { status: 500 })
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clerkUserId: string }> },
) {
  try {
    await requireApiRole(APP_ROLES.ADMIN);
    const { clerkUserId } = await params;

    if (env.adminClerkUserIds.includes(clerkUserId)) {
      return NextResponse.json(
        { error: "This admin is managed by ADMIN_CLERK_USER_IDS and cannot be removed here." },
        { status: 400 },
      );
    }

    await prisma.appRoleAssignment.deleteMany({
      where: {
        clerkUserId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return (
      toAuthzErrorResponse(error) ??
      NextResponse.json({ error: "Failed to remove role assignment." }, { status: 500 })
    );
  }
}
