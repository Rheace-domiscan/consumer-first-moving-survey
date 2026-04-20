import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const surveyPackageRoomMediaSelect = {
  id: true,
  fileName: true,
  kind: true,
  storageUrl: true,
} as const;

const surveyPackageRoomsInclude = {
  include: {
    media: {
      orderBy: {
        createdAt: "desc",
      },
      select: surveyPackageRoomMediaSelect,
    },
  },
  orderBy: {
    createdAt: "asc",
  },
} as const;

const surveyPackageExtractionJobsInclude = {
  include: {
    media: {
      select: {
        fileName: true,
        surveyRoomId: true,
      },
    },
    result: {
      select: {
        surveyRoomId: true,
        needsReview: true,
        observedJson: true,
        declaredJson: true,
      },
    },
  },
  orderBy: {
    createdAt: "desc",
  },
} as const;

const ownerSummaryMoverUnlocksInclude = {
  include: {
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
} as const;

const packageMoverUnlocksInclude = {
  orderBy: {
    createdAt: "desc",
  },
} as const;

function auditEventsInclude(take: number) {
  return {
    orderBy: {
      createdAt: "desc" as const,
    },
    take,
  };
}

const ownerSurveySummaryArgs = Prisma.validator<Prisma.SurveyDefaultArgs>()({
  include: {
    rooms: surveyPackageRoomsInclude,
    extractionJobs: surveyPackageExtractionJobsInclude,
    moverUnlocks: ownerSummaryMoverUnlocksInclude,
    auditEvents: auditEventsInclude(12),
  },
});

const ownerSurveyPackageArgs = Prisma.validator<Prisma.SurveyDefaultArgs>()({
  include: {
    rooms: surveyPackageRoomsInclude,
    extractionJobs: surveyPackageExtractionJobsInclude,
    moverUnlocks: packageMoverUnlocksInclude,
    auditEvents: auditEventsInclude(25),
  },
});

const sharedSurveyPreviewArgs = Prisma.validator<Prisma.SurveyDefaultArgs>()({
  include: {
    rooms: surveyPackageRoomsInclude,
    extractionJobs: surveyPackageExtractionJobsInclude,
    moverUnlocks: ownerSummaryMoverUnlocksInclude,
  },
});

const sharedSurveyUnlockArgs = Prisma.validator<Prisma.SurveyDefaultArgs>()({
  include: {
    rooms: {
      select: {
        id: true,
        mediaCount: true,
      },
    },
    moverUnlocks: {
      include: {
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
    },
  },
});

const opsSurveyReviewArgs = Prisma.validator<Prisma.SurveyDefaultArgs>()({
  include: {
    rooms: surveyPackageRoomsInclude,
    extractionJobs: surveyPackageExtractionJobsInclude,
    moverUnlocks: packageMoverUnlocksInclude,
    auditEvents: auditEventsInclude(12),
  },
});

const opsSurveyListArgs = Prisma.validator<Prisma.SurveyDefaultArgs>()({
  select: {
    id: true,
    title: true,
    ownerClerkUserId: true,
    updatedAt: true,
    shareToken: true,
    retentionState: true,
    status: true,
    readinessState: true,
    rooms: {
      select: {
        id: true,
        status: true,
        mediaCount: true,
        notes: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    },
    extractionJobs: {
      select: {
        status: true,
        result: {
          select: {
            needsReview: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    },
    moverUnlocks: {
      select: {
        status: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    },
  },
});

const ownerSurveyDetailArgs = Prisma.validator<Prisma.SurveyDefaultArgs>()({
  include: {
    rooms: {
      orderBy: {
        createdAt: "asc",
      },
    },
    auditEvents: auditEventsInclude(8),
  },
});

const ownerSurveyAiPreviewArgs = Prisma.validator<Prisma.SurveyDefaultArgs>()({
  include: {
    rooms: {
      include: {
        media: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    },
    extractionJobs: {
      include: {
        media: true,
        result: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    },
  },
});

export type OwnerSurveySummaryRecord = Prisma.SurveyGetPayload<typeof ownerSurveySummaryArgs>;
export type OwnerSurveyPackageRecord = Prisma.SurveyGetPayload<typeof ownerSurveyPackageArgs>;
export type SharedSurveyPreviewRecord = Prisma.SurveyGetPayload<typeof sharedSurveyPreviewArgs>;
export type SharedSurveyUnlockRecord = Prisma.SurveyGetPayload<typeof sharedSurveyUnlockArgs>;
export type OpsSurveyReviewRecord = Prisma.SurveyGetPayload<typeof opsSurveyReviewArgs>;
export type OpsSurveyReviewListRecord = Prisma.SurveyGetPayload<typeof opsSurveyListArgs>;
export type OwnerSurveyDetailRecord = Prisma.SurveyGetPayload<typeof ownerSurveyDetailArgs>;
export type OwnerSurveyAiPreviewRecord = Prisma.SurveyGetPayload<typeof ownerSurveyAiPreviewArgs>;

export const OPS_REVIEW_PAGE_SIZE = 8;
export type OpsSurveyReviewView = "all" | "review" | "archived" | "exempt" | "unlocked";

export async function getOwnerSurveySummary(input: {
  surveyId: string;
  userId: string;
}) {
  return prisma.survey.findFirst({
    ...ownerSurveySummaryArgs,
    where: {
      id: input.surveyId,
      ownerClerkUserId: input.userId,
    },
  });
}

export async function getOwnerSurveyPackage(input: {
  surveyId: string;
  userId: string;
}) {
  return prisma.survey.findFirst({
    ...ownerSurveyPackageArgs,
    where: {
      id: input.surveyId,
      ownerClerkUserId: input.userId,
    },
  });
}

export async function getSharedSurveyPreview(token: string) {
  return prisma.survey.findFirst({
    ...sharedSurveyPreviewArgs,
    where: {
      shareToken: token,
    },
  });
}

export async function getSharedSurveyUnlockContext(token: string) {
  return prisma.survey.findFirst({
    ...sharedSurveyUnlockArgs,
    where: {
      shareToken: token,
    },
  });
}

export async function listOpsSurveyReviewPage(input: {
  page: number;
  view: OpsSurveyReviewView;
}) {
  const where = buildOpsSurveyReviewWhere(input.view);
  const totalCount = await prisma.survey.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / OPS_REVIEW_PAGE_SIZE));
  const page = Math.min(Math.max(1, input.page), totalPages);
  const surveys = await prisma.survey.findMany({
    ...opsSurveyListArgs,
    where,
    orderBy: [
      {
        updatedAt: "desc",
      },
    ],
    skip: (page - 1) * OPS_REVIEW_PAGE_SIZE,
    take: OPS_REVIEW_PAGE_SIZE,
  });

  return {
    surveys,
    page,
    totalCount,
    totalPages,
    pageSize: OPS_REVIEW_PAGE_SIZE,
  };
}

export async function getOpsSurveyReviewStats() {
  const reviewWhere = buildOpsSurveyReviewWhere("review");
  const [totalSurveys, needsReviewCount, archivedCount, exemptCount, unlockedCount] = await Promise.all([
    prisma.survey.count(),
    prisma.survey.count({ where: reviewWhere }),
    prisma.survey.count({ where: { retentionState: "ARCHIVED" } }),
    prisma.survey.count({ where: { retentionState: "EXEMPT" } }),
    prisma.survey.count({
      where: {
        moverUnlocks: {
          some: {
            status: "UNLOCKED",
          },
        },
      },
    }),
  ]);

  return {
    totalSurveys,
    needsReviewCount,
    archivedCount,
    exemptCount,
    unlockedCount,
  };
}

export async function getOpsSurveyReviewDetail(surveyId: string) {
  return prisma.survey.findFirst({
    ...opsSurveyReviewArgs,
    where: {
      id: surveyId,
    },
  });
}

export async function getOwnerSurveyDetail(input: {
  surveyId: string;
  userId: string;
}) {
  return prisma.survey.findFirst({
    ...ownerSurveyDetailArgs,
    where: {
      id: input.surveyId,
      ownerClerkUserId: input.userId,
    },
  });
}

export async function getOwnerSurveyAiPreview(input: {
  surveyId: string;
  userId: string;
}) {
  return prisma.survey.findFirst({
    ...ownerSurveyAiPreviewArgs,
    where: {
      id: input.surveyId,
      ownerClerkUserId: input.userId,
    },
  });
}

function buildOpsSurveyReviewWhere(view: OpsSurveyReviewView): Prisma.SurveyWhereInput | undefined {
  switch (view) {
    case "review":
      return {
        OR: [
          {
            rooms: {
              some: {
                mediaCount: 0,
              },
            },
          },
          {
            rooms: {
              some: {
                OR: [
                  {
                    status: null,
                  },
                  {
                    status: {
                      not: "COMPLETE",
                    },
                  },
                ],
              },
            },
          },
          {
            extractionJobs: {
              some: {
                status: {
                  in: ["PENDING", "PROCESSING", "FAILED"],
                },
              },
            },
          },
          {
            extractionJobs: {
              some: {
                result: {
                  is: {
                    needsReview: true,
                  },
                },
              },
            },
          },
        ],
      };
    case "archived":
      return {
        retentionState: "ARCHIVED",
      };
    case "exempt":
      return {
        retentionState: "EXEMPT",
      };
    case "unlocked":
      return {
        moverUnlocks: {
          some: {
            status: "UNLOCKED",
          },
        },
      };
    default:
      return undefined;
  }
}
