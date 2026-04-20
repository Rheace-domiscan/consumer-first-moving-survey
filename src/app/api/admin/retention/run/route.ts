import { NextResponse } from "next/server";
import { APP_ROLES, requireApiRole, toAuthzErrorResponse } from "@/lib/authz";
import { runRetentionSweep } from "@/lib/retention";

export async function POST() {
  try {
    const access = await requireApiRole(APP_ROLES.ADMIN);
    const result = await runRetentionSweep({
      triggeredByClerkUserId: access.userId!,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return (
      toAuthzErrorResponse(error) ??
      NextResponse.json({ error: "Failed to run the retention sweep." }, { status: 500 })
    );
  }
}
