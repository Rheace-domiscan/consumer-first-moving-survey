import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APP_ROLES, requireApiRole, toAuthzErrorResponse } from "@/lib/authz";
import { getOrCreateGlobalRetentionPolicy, updateGlobalRetentionPolicy } from "@/lib/retention";

export async function GET() {
  try {
    await requireApiRole(APP_ROLES.ADMIN);

    const [policy, recentRuns] = await Promise.all([
      getOrCreateGlobalRetentionPolicy(),
      prisma.retentionRun.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
    ]);

    return NextResponse.json({ policy, recentRuns });
  } catch (error) {
    return toAuthzErrorResponse(error) ?? NextResponse.json({ error: "Failed to load admin settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireApiRole(APP_ROLES.ADMIN);
    const body = (await request.json().catch(() => ({}))) as {
      activeSurveyArchiveDays?: number;
      archivedSurveyPurgeDays?: number;
      mediaRetentionDays?: number;
      auditRetentionDays?: number;
      purgeEnabled?: boolean;
      allowOwnerDelete?: boolean;
    };

    const policy = await updateGlobalRetentionPolicy(
      {
        activeSurveyArchiveDays: requirePositiveInt(body.activeSurveyArchiveDays, "Active survey archive days"),
        archivedSurveyPurgeDays: requirePositiveInt(body.archivedSurveyPurgeDays, "Archived survey purge days"),
        mediaRetentionDays: requirePositiveInt(body.mediaRetentionDays, "Media retention days"),
        auditRetentionDays: requirePositiveInt(body.auditRetentionDays, "Audit retention days"),
        purgeEnabled: Boolean(body.purgeEnabled),
        allowOwnerDelete: Boolean(body.allowOwnerDelete),
      },
      access.userId!,
    );

    return NextResponse.json(policy);
  } catch (error) {
    return (
      toAuthzErrorResponse(error) ??
      toRouteError(error, "Failed to update retention settings.")
    );
  }
}

function requirePositiveInt(value: number | undefined, label: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a whole number greater than 0.`);
  }

  return parsed;
}

function toRouteError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: fallback }, { status: 500 });
}
