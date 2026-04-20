import { Prisma, type RetentionPolicy } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deriveReadinessState } from "@/lib/readiness";
import { deleteFromObjectStorage } from "@/lib/storage";
import { deriveSurveyStatus } from "@/lib/survey-status";

const GLOBAL_POLICY_KEY = "GLOBAL_DEFAULT";
const DAY_MS = 24 * 60 * 60 * 1000;
const RETENTION_STATES = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  EXEMPT: "EXEMPT",
} as const;
const SURVEY_STATUSES = {
  DRAFT: "DRAFT",
  ARCHIVED: "ARCHIVED",
} as const;

type RetentionStateName = (typeof RETENTION_STATES)[keyof typeof RETENTION_STATES];
type SurveyRetentionInput = {
  id: string;
  updatedAt: Date;
  archivedAt: Date | null;
  retentionState: RetentionStateName;
  retentionArchiveAfterDays: number | null;
  retentionPurgeAfterDays: number | null;
  retentionExemptReason: string | null;
  status?: string;
  statusBeforeArchive?: string | null;
  readinessState?: string | null;
  readinessStateBeforeArchive?: string | null;
};

type SweepResult = {
  policy: RetentionPolicy;
  archivedSurveyIds: string[];
  purgedSurveyIds: string[];
  mediaPurgedCount: number;
  auditPurgedCount: number;
};

export type ResolvedSurveyRetention = {
  state: RetentionStateName;
  archiveAfterDays: number;
  purgeAfterDays: number;
  archiveDueAt: Date | null;
  purgeDueAt: Date | null;
  mediaPurgeDueAt: Date | null;
  auditCutoffAt: Date;
  exemptReason: string | null;
  isArchiveDue: boolean;
  isPurgeDue: boolean;
  isMediaPurgeDue: boolean;
};

export async function getOrCreateGlobalRetentionPolicy() {
  return prisma.retentionPolicy.upsert({
    where: {
      key: GLOBAL_POLICY_KEY,
    },
    update: {},
    create: {
      key: GLOBAL_POLICY_KEY,
    },
  });
}

export async function updateGlobalRetentionPolicy(
  input: {
    activeSurveyArchiveDays: number;
    archivedSurveyPurgeDays: number;
    mediaRetentionDays: number;
    auditRetentionDays: number;
    purgeEnabled: boolean;
    allowOwnerDelete: boolean;
  },
  updatedByClerkUserId: string,
) {
  const current = await getOrCreateGlobalRetentionPolicy();

  return prisma.retentionPolicy.update({
    where: {
      id: current.id,
    },
    data: {
      activeSurveyArchiveDays: input.activeSurveyArchiveDays,
      archivedSurveyPurgeDays: input.archivedSurveyPurgeDays,
      mediaRetentionDays: input.mediaRetentionDays,
      auditRetentionDays: input.auditRetentionDays,
      purgeEnabled: input.purgeEnabled,
      allowOwnerDelete: input.allowOwnerDelete,
      updatedByClerkUserId,
    },
  });
}

export function resolveSurveyRetention(
  policy: Pick<
    RetentionPolicy,
    | "activeSurveyArchiveDays"
    | "archivedSurveyPurgeDays"
    | "mediaRetentionDays"
    | "auditRetentionDays"
  >,
  survey: SurveyRetentionInput,
): ResolvedSurveyRetention {
  const archiveAfterDays = survey.retentionArchiveAfterDays ?? policy.activeSurveyArchiveDays;
  const purgeAfterDays = survey.retentionPurgeAfterDays ?? policy.archivedSurveyPurgeDays;
  const archiveDueAt =
    survey.retentionState === RETENTION_STATES.ACTIVE ? addDays(survey.updatedAt, archiveAfterDays) : null;
  const purgeDueAt =
    survey.retentionState === RETENTION_STATES.ARCHIVED && survey.archivedAt
      ? addDays(survey.archivedAt, purgeAfterDays)
      : null;
  const mediaPurgeDueAt =
    survey.retentionState === RETENTION_STATES.ARCHIVED && survey.archivedAt
      ? addDays(survey.archivedAt, policy.mediaRetentionDays)
      : null;
  const now = new Date();

  return {
    state: survey.retentionState,
    archiveAfterDays,
    purgeAfterDays,
    archiveDueAt,
    purgeDueAt,
    mediaPurgeDueAt,
    auditCutoffAt: addDays(now, -policy.auditRetentionDays),
    exemptReason: survey.retentionExemptReason,
    isArchiveDue: Boolean(archiveDueAt && archiveDueAt <= now),
    isPurgeDue: Boolean(purgeDueAt && purgeDueAt <= now),
    isMediaPurgeDue: Boolean(mediaPurgeDueAt && mediaPurgeDueAt <= now),
  };
}

export async function updateSurveyRetentionOverrides(input: {
  surveyId: string;
  archiveAfterDays: number | null;
  purgeAfterDays: number | null;
  triggeredByClerkUserId: string;
}) {
  const policy = await getOrCreateGlobalRetentionPolicy();

  return prisma.$transaction(async (tx) => {
    const survey = await tx.survey.findUnique({
      where: {
        id: input.surveyId,
      },
    });

    if (!survey) {
      throw new Error("Survey not found.");
    }

    const updated = await tx.survey.update({
      where: {
        id: input.surveyId,
      },
      data: {
        retentionPolicyId: policy.id,
        retentionArchiveAfterDays: input.archiveAfterDays,
        retentionPurgeAfterDays: input.purgeAfterDays,
      },
    });

    await createAuditEvent(tx, {
      surveyId: input.surveyId,
      actorId: input.triggeredByClerkUserId,
      eventType: "retention_overrides_updated",
      payload: {
        retentionArchiveAfterDays: updated.retentionArchiveAfterDays,
        retentionPurgeAfterDays: updated.retentionPurgeAfterDays,
      },
    });

    return updated;
  });
}

export async function markSurveyExempt(input: {
  surveyId: string;
  reason: string;
  triggeredByClerkUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const survey = await tx.survey.findUnique({
      where: {
        id: input.surveyId,
      },
    });

    if (!survey) {
      throw new Error("Survey not found.");
    }

    if (survey.retentionState === RETENTION_STATES.ARCHIVED) {
      throw new Error("Restore the survey before marking it exempt.");
    }

    const updated = await tx.survey.update({
      where: {
        id: input.surveyId,
      },
      data: {
        retentionState: RETENTION_STATES.EXEMPT,
        retentionExemptReason: input.reason.trim(),
      },
    });

    await createAuditEvent(tx, {
      surveyId: input.surveyId,
      actorId: input.triggeredByClerkUserId,
      eventType: "retention_exempted",
      payload: { reason: updated.retentionExemptReason },
    });

    return updated;
  });
}

export async function clearSurveyExemption(input: {
  surveyId: string;
  triggeredByClerkUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const survey = await tx.survey.findUnique({
      where: {
        id: input.surveyId,
      },
    });

    if (!survey) {
      throw new Error("Survey not found.");
    }

    const updated = await tx.survey.update({
      where: {
        id: input.surveyId,
      },
      data: {
        retentionState: RETENTION_STATES.ACTIVE,
        retentionExemptReason: null,
      },
    });

    await createAuditEvent(tx, {
      surveyId: input.surveyId,
      actorId: input.triggeredByClerkUserId,
      eventType: "retention_exemption_cleared",
      payload: null,
    });

    return updated;
  });
}

export async function archiveSurvey(input: {
  surveyId: string;
  triggeredByClerkUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const survey = await tx.survey.findUnique({
      where: {
        id: input.surveyId,
      },
    });

    if (!survey) {
      throw new Error("Survey not found.");
    }

    if (survey.retentionState === RETENTION_STATES.ARCHIVED) {
      return survey;
    }

    const updated = await tx.survey.update({
      where: {
        id: input.surveyId,
      },
      data: {
        retentionState: RETENTION_STATES.ARCHIVED,
        retentionExemptReason: null,
        archivedAt: new Date(),
        archivedByClerkUserId: input.triggeredByClerkUserId,
        statusBeforeArchive:
          survey.status === SURVEY_STATUSES.ARCHIVED
            ? survey.statusBeforeArchive ?? SURVEY_STATUSES.DRAFT
            : survey.status,
        readinessStateBeforeArchive:
          survey.readinessStateBeforeArchive ?? survey.readinessState ?? "NOT_READY",
        status: SURVEY_STATUSES.ARCHIVED,
        readinessState: "ARCHIVED",
      },
    });

    await createAuditEvent(tx, {
      surveyId: input.surveyId,
      actorId: input.triggeredByClerkUserId,
      eventType: "retention_archived",
      payload: { archivedAt: updated.archivedAt?.toISOString() },
    });

    return updated;
  });
}

export async function restoreSurveyFromArchive(input: {
  surveyId: string;
  triggeredByClerkUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const survey = await tx.survey.findUnique({
      where: {
        id: input.surveyId,
      },
      include: {
        rooms: {
          select: {
            status: true,
            mediaCount: true,
          },
        },
      },
    });

    if (!survey) {
      throw new Error("Survey not found.");
    }

    if (survey.retentionState !== RETENTION_STATES.ARCHIVED) {
      throw new Error("Only archived surveys can be restored.");
    }

    const restoredStatus =
      survey.statusBeforeArchive ?? deriveSurveyStatus(survey.rooms);
    const restoredReadiness =
      survey.readinessStateBeforeArchive ?? deriveReadinessState(survey.rooms);

    const updated = await tx.survey.update({
      where: {
        id: input.surveyId,
      },
      data: {
        retentionState: RETENTION_STATES.ACTIVE,
        archivedAt: null,
        archivedByClerkUserId: null,
        status: restoredStatus,
        readinessState: restoredReadiness,
        statusBeforeArchive: null,
        readinessStateBeforeArchive: null,
      },
    });

    await createAuditEvent(tx, {
      surveyId: input.surveyId,
      actorId: input.triggeredByClerkUserId,
      eventType: "retention_restored",
      payload: { restoredStatus, restoredReadiness },
    });

    return updated;
  });
}

export async function purgeSurveyData(input: {
  surveyId: string;
  triggeredByClerkUserId: string;
  reason: string;
}) {
  const survey = await prisma.survey.findUnique({
    where: {
      id: input.surveyId,
    },
    include: {
      rooms: {
        include: {
          media: true,
        },
      },
    },
  });

  if (!survey) {
    throw new Error("Survey not found.");
  }

  let mediaPurgedCount = 0;

  for (const room of survey.rooms) {
    for (const media of room.media) {
      if (!media.storageKey || media.uploadStatus === "PURGED") {
        continue;
      }

      try {
        await deleteFromObjectStorage(media.storageKey);
      } catch {
        // Object storage may already be empty or unavailable. Purge should remain idempotent.
      }

      mediaPurgedCount += 1;
    }
  }

  await prisma.survey.delete({
    where: {
      id: input.surveyId,
    },
  });

  return {
    surveyId: survey.id,
    surveyTitle: survey.title,
    mediaPurgedCount,
    reason: input.reason,
    triggeredByClerkUserId: input.triggeredByClerkUserId,
  };
}

export async function runRetentionSweep(input: {
  triggeredByClerkUserId: string;
}) {
  const policy = await getOrCreateGlobalRetentionPolicy();
  const activeCandidates = await prisma.survey.findMany({
    where: {
      retentionState: RETENTION_STATES.ACTIVE,
    },
    select: {
      id: true,
      updatedAt: true,
      archivedAt: true,
      retentionState: true,
      retentionArchiveAfterDays: true,
      retentionPurgeAfterDays: true,
      retentionExemptReason: true,
    },
  });

  const archivedSurveyIds: string[] = [];

  for (const candidate of activeCandidates) {
    const retention = resolveSurveyRetention(policy, candidate);

    if (!retention.isArchiveDue) {
      continue;
    }

    await archiveSurvey({
      surveyId: candidate.id,
      triggeredByClerkUserId: input.triggeredByClerkUserId,
    });
    archivedSurveyIds.push(candidate.id);
  }

  let mediaPurgedCount = 0;
  let auditPurgedCount = 0;
  const purgedSurveyIds: string[] = [];

  if (policy.purgeEnabled) {
    mediaPurgedCount = await purgeArchivedSurveyMedia(policy);
    auditPurgedCount = await purgeExpiredAuditEvents(policy);

    const archivedCandidates = await prisma.survey.findMany({
      where: {
        retentionState: RETENTION_STATES.ARCHIVED,
      },
      select: {
        id: true,
        updatedAt: true,
        archivedAt: true,
        retentionState: true,
        retentionArchiveAfterDays: true,
        retentionPurgeAfterDays: true,
        retentionExemptReason: true,
      },
    });

    for (const candidate of archivedCandidates) {
      const retention = resolveSurveyRetention(policy, candidate);

      if (!retention.isPurgeDue) {
        continue;
      }

      await purgeSurveyData({
        surveyId: candidate.id,
        triggeredByClerkUserId: input.triggeredByClerkUserId,
        reason: "retention_sweep",
      });
      purgedSurveyIds.push(candidate.id);
    }
  }

  const run = await prisma.retentionRun.create({
    data: {
      policyId: policy.id,
      triggeredByClerkUserId: input.triggeredByClerkUserId,
      archivedCount: archivedSurveyIds.length,
      mediaPurgedCount,
      auditPurgedCount,
      purgedCount: purgedSurveyIds.length,
      archivedSurveyIdsJson: JSON.stringify(archivedSurveyIds),
      purgedSurveyIdsJson: JSON.stringify(purgedSurveyIds),
      notes: policy.purgeEnabled
        ? "Retention sweep ran archive, media prune, audit prune, and purge actions."
        : "Retention sweep ran archive-only actions because purge is disabled.",
    },
  });

  return {
    policy,
    run,
    archivedSurveyIds,
    purgedSurveyIds,
    mediaPurgedCount,
    auditPurgedCount,
  } satisfies SweepResult & { run: typeof run };
}

async function purgeArchivedSurveyMedia(policy: Pick<RetentionPolicy, "mediaRetentionDays">) {
  const archivedSurveys = await prisma.survey.findMany({
    where: {
      retentionState: RETENTION_STATES.ARCHIVED,
      archivedAt: {
        lte: addDays(new Date(), -policy.mediaRetentionDays),
      },
    },
    include: {
      rooms: {
        include: {
          media: {
            where: {
              uploadStatus: {
                not: "PURGED",
              },
            },
          },
        },
      },
    },
  });

  let mediaPurgedCount = 0;

  for (const survey of archivedSurveys) {
    for (const room of survey.rooms) {
      for (const media of room.media) {
        try {
          await deleteFromObjectStorage(media.storageKey);
        } catch {
          // Purge must remain resilient when the object already disappeared.
        }

        await prisma.surveyMedia.update({
          where: {
            id: media.id,
          },
          data: {
            uploadStatus: "PURGED",
            storageUrl: null,
          },
        });
        mediaPurgedCount += 1;
      }
    }
  }

  return mediaPurgedCount;
}

async function purgeExpiredAuditEvents(policy: Pick<RetentionPolicy, "auditRetentionDays">) {
  const result = await prisma.auditEvent.deleteMany({
    where: {
      createdAt: {
        lt: addDays(new Date(), -policy.auditRetentionDays),
      },
      survey: {
        retentionState: {
          not: RETENTION_STATES.EXEMPT,
        },
      },
    },
  });

  return result.count;
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * DAY_MS);
}

async function createAuditEvent(
  tx: Prisma.TransactionClient,
  input: {
    surveyId: string;
    actorId: string | null;
    eventType: string;
    payload: unknown;
  },
) {
  await tx.auditEvent.create({
    data: {
      surveyId: input.surveyId,
      actorType: "ops",
      actorId: input.actorId,
      eventType: input.eventType,
      payloadJson: input.payload ? JSON.stringify(input.payload) : null,
    },
  });
}
