import { NextResponse } from "next/server";
import { APP_ROLES, isRoleAtLeast, requireApiRole, toAuthzErrorResponse } from "@/lib/authz";
import {
  archiveSurvey,
  clearSurveyExemption,
  markSurveyExempt,
  purgeSurveyData,
  restoreSurveyFromArchive,
  updateSurveyRetentionOverrides,
} from "@/lib/retention";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> },
) {
  try {
    const access = await requireApiRole(APP_ROLES.OPERATOR);
    const { surveyId } = await params;
    const body = (await request.json().catch(() => ({}))) as
      | {
          action?: "set_overrides";
          retentionArchiveAfterDays?: number | null;
          retentionPurgeAfterDays?: number | null;
        }
      | { action?: "mark_exempt"; reason?: string }
      | { action?: "clear_exempt" }
      | { action?: "archive_now" }
      | { action?: "restore" }
      | { action?: "purge_now" };

    switch (body.action) {
      case "set_overrides": {
        const updated = await updateSurveyRetentionOverrides({
          surveyId,
          archiveAfterDays: normalizeOptionalInt(body.retentionArchiveAfterDays),
          purgeAfterDays: normalizeOptionalInt(body.retentionPurgeAfterDays),
          triggeredByClerkUserId: access.userId!,
        });

        return NextResponse.json(updated);
      }

      case "mark_exempt": {
        if (!body.reason?.trim()) {
          return NextResponse.json({ error: "An exemption reason is required." }, { status: 400 });
        }

        const updated = await markSurveyExempt({
          surveyId,
          reason: body.reason,
          triggeredByClerkUserId: access.userId!,
        });

        return NextResponse.json(updated);
      }

      case "clear_exempt": {
        const updated = await clearSurveyExemption({
          surveyId,
          triggeredByClerkUserId: access.userId!,
        });

        return NextResponse.json(updated);
      }

      case "archive_now": {
        const updated = await archiveSurvey({
          surveyId,
          triggeredByClerkUserId: access.userId!,
        });

        return NextResponse.json(updated);
      }

      case "restore": {
        const updated = await restoreSurveyFromArchive({
          surveyId,
          triggeredByClerkUserId: access.userId!,
        });

        return NextResponse.json(updated);
      }

      case "purge_now": {
        if (!isRoleAtLeast(access.role, APP_ROLES.ADMIN)) {
          return NextResponse.json(
            { error: "Only admins can purge survey data." },
            { status: 403 },
          );
        }

        const result = await purgeSurveyData({
          surveyId,
          triggeredByClerkUserId: access.userId!,
          reason: "manual_admin_purge",
        });

        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: "Unsupported retention action." }, { status: 400 });
    }
  } catch (error) {
    return toAuthzErrorResponse(error) ?? toRouteError(error);
  }
}

function normalizeOptionalInt(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("Retention overrides must be whole numbers greater than 0.");
  }

  return parsed;
}

function toRouteError(error: unknown) {
  if (error instanceof Error) {
    const status = error.message === "Survey not found." ? 404 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ error: "Failed to update survey retention." }, { status: 500 });
}
