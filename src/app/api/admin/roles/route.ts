import { NextResponse } from "next/server";
import { listDetailedRoleAssignments, resolveClerkIdentifier } from "@/lib/clerk-users";
import { APP_ROLES, type AppRoleName, requireApiRole, toAuthzErrorResponse } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireApiRole(APP_ROLES.ADMIN);
    const assignments = await listDetailedRoleAssignments();
    return NextResponse.json(assignments);
  } catch (error) {
    return toAuthzErrorResponse(error) ?? NextResponse.json({ error: "Failed to load role assignments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireApiRole(APP_ROLES.ADMIN);
    const body = (await request.json().catch(() => ({}))) as {
      identifier?: string;
      role?: AppRoleName;
      note?: string;
    };

    if (!body.identifier?.trim()) {
      return NextResponse.json({ error: "A Clerk user ID or email is required." }, { status: 400 });
    }

    if (body.role !== APP_ROLES.OPERATOR && body.role !== APP_ROLES.ADMIN) {
      return NextResponse.json(
        { error: "Role assignment must be OPERATOR or ADMIN." },
        { status: 400 },
      );
    }

    const targetUser = await resolveClerkIdentifier(body.identifier);

    if (!targetUser) {
      return NextResponse.json({ error: "Clerk user not found." }, { status: 404 });
    }

    const assignment = await prisma.appRoleAssignment.upsert({
      where: {
        clerkUserId: targetUser.userId,
      },
      update: {
        role: body.role,
        note: body.note?.trim() || null,
        grantedByClerkUserId: access.userId!,
      },
      create: {
        clerkUserId: targetUser.userId,
        role: body.role,
        note: body.note?.trim() || null,
        grantedByClerkUserId: access.userId!,
      },
    });

    return NextResponse.json({ assignment, targetUser }, { status: 201 });
  } catch (error) {
    return (
      toAuthzErrorResponse(error) ??
      NextResponse.json({ error: "Failed to assign the requested role." }, { status: 500 })
    );
  }
}
