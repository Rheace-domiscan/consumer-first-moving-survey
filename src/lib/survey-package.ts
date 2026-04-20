type SurveyPackageInput = {
  id: string;
  title: string | null;
  propertyType: string | null;
  originPostcode: string | null;
  destinationPostcode: string | null;
  moveWindow: string | null;
  notes: string | null;
  shareToken?: string | null;
  rooms: {
    id: string;
    name: string;
    status: string | null;
    mediaCount: number;
    notes: string | null;
    media?: {
      id: string;
      fileName: string;
      kind: string;
      storageUrl: string | null;
    }[];
  }[];
  extractionJobs?: {
    id: string;
    status: string;
    mode: string;
    media: {
      fileName: string;
      surveyRoomId: string;
    };
    result: {
      surveyRoomId: string;
      needsReview: boolean;
      observedJson: string;
      declaredJson: string;
    } | null;
  }[];
  moverUnlocks?: {
    id: string;
    moverEmail: string;
    companyName: string | null;
    status: string;
    invitedAt: string | Date;
    viewedAt: string | Date | null;
    unlockedAt: string | Date | null;
  }[];
  auditEvents?: {
    id: string;
    actorType: string;
    eventType: string;
    createdAt: string | Date;
  }[];
};

export type SurveyPackage = {
  surveyId: string;
  surveyTitle: string;
  moveContext: {
    propertyType: string;
    originPostcode: string;
    destinationPostcode: string;
    moveWindow: string;
    overallNotes: string | null;
  };
  coverage: {
    totalRooms: number;
    completedRooms: number;
    roomsWithMedia: number;
    roomsWithNotes: number;
    completenessStatus: "Complete" | "Mostly complete" | "Incomplete" | "Review required";
    confidenceTier: "High" | "Medium" | "Low";
    confidenceScore: number;
    readyForMoverPreview: boolean;
    reviewReasons: string[];
    pendingExtractionJobs: number;
    failedExtractionJobs: number;
    processedExtractionJobs: number;
    surveyUsefulness: "Strong" | "Usable with review" | "Limited";
    indicativeMajorItemCountBand: string;
  };
  moverPreview: {
    indicativeMajorItemCountBand: string;
    estimatedVolumeBand: string;
    surveyUsefulness: "Strong" | "Usable with review" | "Limited";
    notesForMover: string | null;
  };
  roomPackages: {
    id: string;
    name: string;
    status: string;
    mediaCount: number;
    notes: string | null;
    coverageNote: string;
    mediaFiles: {
      id: string;
      fileName: string;
      kind: string;
      storageUrl: string | null;
    }[];
    items: {
      label: string;
      source: "Observed" | "Declared" | "Estimated";
      confidenceTier: "High" | "Medium" | "Low";
      confidenceScore: number | null;
      estimatedCubeFeet: number | null;
      estimatedCubeMeters: number | null;
      reviewRecommended: boolean;
    }[];
  }[];
  majorItemSummary: {
    totalItems: number;
    totalEstimatedCubeFeet: number;
    totalEstimatedCubeMeters: number;
    estimatedVolumeBand: string;
  };
  packingGuidance: {
    title: string;
    reason: string;
  }[];
  specialHandlingFlags: string[];
  moverUnlockSummary: {
    totalInvites: number;
    unlockedCount: number;
    latestStatus: string | null;
  };
  auditTrail: {
    id: string;
    actorType: string;
    eventType: string;
    createdAt: string | Date;
  }[];
  legend: {
    label: "Observed" | "Declared" | "Estimated" | "Review recommended";
    description: string;
  }[];
};

type Prior = {
  canonical: string;
  cubeFeet: number;
  packing: string[];
  flags: string[];
};

type RawObserved = {
  label: string;
  confidence: number;
};

type RawDeclared = {
  label: string;
};

const ITEM_PRIORS: Array<{ pattern: RegExp; prior: Prior }> = [
  {
    pattern: /(sofa|couch)/i,
    prior: {
      canonical: "Sofa",
      cubeFeet: 65,
      packing: ["Use furniture blankets or a sofa cover for upholstered seating."],
      flags: ["Bulky furniture handling likely."],
    },
  },
  {
    pattern: /(bed|mattress)/i,
    prior: {
      canonical: "Bed / mattress",
      cubeFeet: 55,
      packing: ["Add mattress protection and bed-frame wrap to the move plan."],
      flags: ["Bed or mattress handling needs protection."],
    },
  },
  {
    pattern: /(wardrobe|closet|chest of drawers|dresser)/i,
    prior: {
      canonical: "Wardrobe / drawers",
      cubeFeet: 45,
      packing: ["Plan wardrobe cartons or drawer-emptying for clothes storage."],
      flags: ["Heavy case furniture likely."],
    },
  },
  {
    pattern: /(table|dining)/i,
    prior: {
      canonical: "Table",
      cubeFeet: 30,
      packing: ["Protect table edges and surfaces with corner wrap or blankets."],
      flags: [],
    },
  },
  {
    pattern: /(desk)/i,
    prior: {
      canonical: "Desk",
      cubeFeet: 25,
      packing: ["Box desk contents separately and protect vulnerable edges."],
      flags: [],
    },
  },
  {
    pattern: /(fridge|freezer|major kitchen appliance|appliance)/i,
    prior: {
      canonical: "Large appliance",
      cubeFeet: 30,
      packing: ["Confirm appliance prep, disconnects, and upright transport handling."],
      flags: ["Appliance handling and disconnect planning required."],
    },
  },
  {
    pattern: /(washing machine|washer|dryer)/i,
    prior: {
      canonical: "Washer / dryer",
      cubeFeet: 22,
      packing: ["Check transit-bolt and disconnect requirements for laundry appliances."],
      flags: ["Heavy appliance handling likely."],
    },
  },
  {
    pattern: /(tv|monitor|screen)/i,
    prior: {
      canonical: "TV / monitor",
      cubeFeet: 12,
      packing: ["Use a screen carton or padded wrap for TVs and monitors."],
      flags: ["Fragile screen handling required."],
    },
  },
  {
    pattern: /(bookcase|bookshelf|shelving|shelf)/i,
    prior: {
      canonical: "Bookcase / shelving",
      cubeFeet: 28,
      packing: ["Plan separate cartons for shelf contents and protect shelving units."],
      flags: [],
    },
  },
  {
    pattern: /(armchair|chair)/i,
    prior: {
      canonical: "Chair",
      cubeFeet: 18,
      packing: ["Protect chair legs and stack where practical."],
      flags: [],
    },
  },
  {
    pattern: /(box|carton|bag)/i,
    prior: {
      canonical: "Cartons / bags",
      cubeFeet: 5,
      packing: ["Confirm final carton counts before locking the quote."],
      flags: [],
    },
  },
  {
    pattern: /(lamp)/i,
    prior: {
      canonical: "Lamp",
      cubeFeet: 4,
      packing: ["Lamp shades and bases should be wrapped and boxed separately."],
      flags: ["Fragile lamp or shade handling required."],
    },
  },
  {
    pattern: /(mirror|artwork|glass|picture)/i,
    prior: {
      canonical: "Mirror / artwork / glass item",
      cubeFeet: 8,
      packing: ["Use mirror or picture cartons with corner protection."],
      flags: ["Fragile specialty item noted."],
    },
  },
];

export function buildSurveyPackage(input: SurveyPackageInput): SurveyPackage {
  const extractionJobs = input.extractionJobs ?? [];
  const roomPackages = input.rooms.map((room) => {
    const jobs = extractionJobs.filter((job) => job.media.surveyRoomId === room.id);
    const rawObserved = jobs.flatMap((job) => parseObserved(job.result?.observedJson));
    const rawDeclaredFromResults = jobs.flatMap((job) => parseDeclared(job.result?.declaredJson));
    const rawDeclared =
      rawDeclaredFromResults.length > 0
        ? rawDeclaredFromResults
        : room.notes
          ? [{ label: `Declared note: ${room.notes}` }]
          : [];

    const observedItems = rawObserved.map((item) => buildPackageItem(item.label, "Observed", item.confidence, jobs.some((job) => job.result?.needsReview)));
    const declaredItems = rawDeclared.map((item) => buildPackageItem(item.label, "Declared", null, false));
    const items = [...observedItems, ...declaredItems];

    return {
      id: room.id,
      name: room.name,
      status: room.status || "AWAITING_CAPTURE",
      mediaCount: room.mediaCount,
      notes: room.notes || null,
      coverageNote: buildCoverageNote(room.mediaCount, room.status, jobs.length),
      mediaFiles: room.media ?? [],
      items,
    };
  });

  const totalRooms = roomPackages.length;
  const completedRooms = roomPackages.filter((room) => room.status === "COMPLETE").length;
  const roomsWithMedia = roomPackages.filter((room) => room.mediaCount > 0).length;
  const roomsWithNotes = roomPackages.filter((room) => Boolean(room.notes)).length;
  const pendingExtractionJobs = extractionJobs.filter((job) => job.status === "PENDING" || job.status === "PROCESSING").length;
  const failedExtractionJobs = extractionJobs.filter((job) => job.status === "FAILED").length;
  const processedExtractionJobs = extractionJobs.filter((job) => job.status === "COMPLETE").length;
  const totalItems = roomPackages.reduce((sum, room) => sum + room.items.length, 0);
  const totalEstimatedCubeFeet = roundToOne(
    roomPackages.reduce(
      (sum, room) => sum + room.items.reduce((roomSum, item) => roomSum + (item.estimatedCubeFeet ?? 0), 0),
      0,
    ),
  );
  const totalEstimatedCubeMeters = roundToTwo(totalEstimatedCubeFeet * 0.0283168);
  const reviewReasons = buildReviewReasons({
    totalRooms,
    completedRooms,
    roomsWithMedia,
    roomsWithNotes,
    pendingExtractionJobs,
    failedExtractionJobs,
    roomPackages,
  });
  const completenessStatus = deriveCompletenessStatus({
    totalRooms,
    completedRooms,
    roomsWithMedia,
    roomsWithNotes,
    pendingExtractionJobs,
    failedExtractionJobs,
  });
  const confidenceScore = deriveConfidenceScore({
    totalRooms,
    completedRooms,
    roomsWithMedia,
    pendingExtractionJobs,
    failedExtractionJobs,
    roomPackages,
  });
  const confidenceTier = scoreToTier(confidenceScore);
  const surveyUsefulness = deriveSurveyUsefulness(completenessStatus, confidenceTier);
  const estimatedVolumeBand = volumeBand(totalEstimatedCubeFeet);
  const indicativeMajorItemCountBand = itemCountBand(totalItems);
  const packingGuidance = buildPackingGuidance(roomPackages);
  const specialHandlingFlags = buildSpecialHandlingFlags({
    surveyNotes: input.notes,
    roomPackages,
  });
  const moverUnlocks = input.moverUnlocks ?? [];

  return {
    surveyId: input.id,
    surveyTitle: input.title || "Untitled draft survey",
    moveContext: {
      propertyType: input.propertyType || "Pending",
      originPostcode: input.originPostcode || "Pending",
      destinationPostcode: input.destinationPostcode || "Pending",
      moveWindow: input.moveWindow || "Pending",
      overallNotes: input.notes || null,
    },
    coverage: {
      totalRooms,
      completedRooms,
      roomsWithMedia,
      roomsWithNotes,
      completenessStatus,
      confidenceTier,
      confidenceScore,
      readyForMoverPreview:
        (completenessStatus === "Complete" || completenessStatus === "Mostly complete") &&
        roomsWithMedia > 0,
      reviewReasons,
      pendingExtractionJobs,
      failedExtractionJobs,
      processedExtractionJobs,
      surveyUsefulness,
      indicativeMajorItemCountBand,
    },
    moverPreview: {
      indicativeMajorItemCountBand,
      estimatedVolumeBand,
      surveyUsefulness,
      notesForMover: input.notes || null,
    },
    roomPackages,
    majorItemSummary: {
      totalItems,
      totalEstimatedCubeFeet,
      totalEstimatedCubeMeters,
      estimatedVolumeBand,
    },
    packingGuidance,
    specialHandlingFlags,
    moverUnlockSummary: {
      totalInvites: moverUnlocks.length,
      unlockedCount: moverUnlocks.filter((unlock) => unlock.status === "UNLOCKED").length,
      latestStatus: moverUnlocks[0]?.status ?? null,
    },
    auditTrail: (input.auditEvents ?? []).map((event) => ({
      id: event.id,
      actorType: event.actorType,
      eventType: event.eventType,
      createdAt: event.createdAt,
    })),
    legend: [
      {
        label: "Observed",
        description: "Detected from uploaded room media and included in the structured mover package.",
      },
      {
        label: "Declared",
        description: "Added from consumer notes or declarations and kept distinct from AI-observed items.",
      },
      {
        label: "Estimated",
        description: "Rules-based move volume or handling guidance inferred from detected categories.",
      },
      {
        label: "Review recommended",
        description: "Use mover or operator review where confidence is weaker or survey coverage is partial.",
      },
    ],
  };
}

export function buildExportDocument(input: SurveyPackageInput) {
  const surveyPackage = buildSurveyPackage(input);

  return {
    exportedAt: new Date().toISOString(),
    formatVersion: 2,
    surveyPackage,
  };
}

export function buildSurveyItemsCsv(input: SurveyPackageInput) {
  const surveyPackage = buildSurveyPackage(input);
  const rows = [
    [
      "survey_id",
      "survey_title",
      "room",
      "room_status",
      "media_count",
      "item_label",
      "source",
      "confidence_tier",
      "confidence_score",
      "estimated_cube_feet",
      "review_recommended",
    ],
  ];

  for (const room of surveyPackage.roomPackages) {
    if (room.items.length === 0) {
      rows.push([
        surveyPackage.surveyId,
        surveyPackage.surveyTitle,
        room.name,
        room.status,
        String(room.mediaCount),
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
      continue;
    }

    for (const item of room.items) {
      rows.push([
        surveyPackage.surveyId,
        surveyPackage.surveyTitle,
        room.name,
        room.status,
        String(room.mediaCount),
        item.label,
        item.source,
        item.confidenceTier,
        item.confidenceScore === null ? "" : String(item.confidenceScore),
        item.estimatedCubeFeet === null ? "" : String(item.estimatedCubeFeet),
        item.reviewRecommended ? "yes" : "no",
      ]);
    }
  }

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function buildPackageItem(
  label: string,
  source: "Observed" | "Declared" | "Estimated",
  confidence: number | null,
  reviewRecommended: boolean,
) {
  const prior = findPrior(label);
  const confidenceTier: SurveyPackage["roomPackages"][number]["items"][number]["confidenceTier"] =
    source === "Observed" ? scoreToTier(Math.round((confidence ?? 0.5) * 100)) : source === "Declared" ? "Medium" : "Low";

  return {
    label,
    source,
    confidenceTier,
    confidenceScore: confidence === null ? null : Math.round(confidence * 100),
    estimatedCubeFeet: prior?.cubeFeet ?? null,
    estimatedCubeMeters: prior ? roundToTwo(prior.cubeFeet * 0.0283168) : null,
    reviewRecommended,
  };
}

function buildCoverageNote(mediaCount: number, status: string | null, extractionJobs: number) {
  if (mediaCount === 0 && !status) {
    return "No room media or completion marker has been added yet.";
  }

  if (mediaCount === 0) {
    return "Room is marked for progress, but no supporting media is attached yet.";
  }

  if (status !== "COMPLETE") {
    return "Media exists, but the room is not yet marked complete.";
  }

  if (extractionJobs === 0) {
    return "Room media is present, but AI extraction has not been synced yet.";
  }

  return "Room capture, processing, and notes are present for mover review.";
}

function buildReviewReasons(input: {
  totalRooms: number;
  completedRooms: number;
  roomsWithMedia: number;
  roomsWithNotes: number;
  pendingExtractionJobs: number;
  failedExtractionJobs: number;
  roomPackages: SurveyPackage["roomPackages"];
}) {
  const reasons: string[] = [];

  if (input.roomsWithMedia < input.totalRooms) {
    reasons.push("Some selected rooms do not yet have uploaded media.");
  }
  if (input.completedRooms < input.totalRooms) {
    reasons.push("Not every selected room is marked complete yet.");
  }
  if (input.pendingExtractionJobs > 0) {
    reasons.push("Some AI extraction jobs are still pending or processing.");
  }
  if (input.failedExtractionJobs > 0) {
    reasons.push("At least one extraction job failed and needs manual follow-up.");
  }
  if (input.roomPackages.some((room) => room.items.some((item) => item.reviewRecommended))) {
    reasons.push("At least one detected item is flagged for mover or operator review.");
  }
  if (input.roomsWithNotes === 0) {
    reasons.push("No room notes have been added to help movers understand access or handling constraints.");
  }

  return Array.from(new Set(reasons));
}

function deriveCompletenessStatus(input: {
  totalRooms: number;
  completedRooms: number;
  roomsWithMedia: number;
  roomsWithNotes: number;
  pendingExtractionJobs: number;
  failedExtractionJobs: number;
}) {
  if (input.failedExtractionJobs > 0 || input.pendingExtractionJobs > 0) {
    return "Review required";
  }

  if (input.totalRooms === 0) {
    return "Incomplete";
  }

  if (input.completedRooms === input.totalRooms && input.roomsWithMedia === input.totalRooms) {
    return "Complete";
  }

  const coverageRatio = Math.max(input.completedRooms, input.roomsWithMedia + input.roomsWithNotes) / input.totalRooms;
  return coverageRatio >= 0.75 ? "Mostly complete" : "Incomplete";
}

function deriveConfidenceScore(input: {
  totalRooms: number;
  completedRooms: number;
  roomsWithMedia: number;
  pendingExtractionJobs: number;
  failedExtractionJobs: number;
  roomPackages: SurveyPackage["roomPackages"];
}) {
  if (input.totalRooms === 0) {
    return 20;
  }

  let score = 35;
  score += Math.round((input.roomsWithMedia / input.totalRooms) * 25);
  score += Math.round((input.completedRooms / input.totalRooms) * 20);
  score += Math.min(
    15,
    input.roomPackages.reduce((sum, room) => sum + room.items.filter((item) => item.source === "Observed").length, 0) * 3,
  );

  if (input.pendingExtractionJobs > 0) score -= 10;
  if (input.failedExtractionJobs > 0) score -= 15;
  if (input.roomPackages.some((room) => room.items.some((item) => item.reviewRecommended))) score -= 5;

  return clamp(score, 10, 95);
}

function scoreToTier(score: number) {
  if (score >= 80) return "High";
  if (score >= 55) return "Medium";
  return "Low";
}

function deriveSurveyUsefulness(
  completenessStatus: SurveyPackage["coverage"]["completenessStatus"],
  confidenceTier: SurveyPackage["coverage"]["confidenceTier"],
) {
  if (completenessStatus === "Complete" && confidenceTier !== "Low") {
    return "Strong";
  }

  if (completenessStatus === "Incomplete" && confidenceTier === "Low") {
    return "Limited";
  }

  return "Usable with review";
}

function buildPackingGuidance(roomPackages: SurveyPackage["roomPackages"]) {
  const entries = new Map<string, string>();

  for (const room of roomPackages) {
    for (const item of room.items) {
      const prior = findPrior(item.label);
      if (!prior) continue;

      for (const suggestion of prior.packing) {
        entries.set(suggestion, `Triggered by ${prior.canonical.toLowerCase()} in ${room.name}.`);
      }
    }

    const roomNotes = room.notes?.toLowerCase() ?? "";
    if (/(fragile|glass|mirror|lamp|art)/.test(roomNotes)) {
      entries.set(
        "Pack delicate items with extra cushioning and clearly labelled fragile cartons.",
        `Room notes in ${room.name} mention fragile or delicate contents.`,
      );
    }
    if (/(stairs|narrow|tight|access|parking|lift)/.test(roomNotes)) {
      entries.set(
        "Allow extra survey review for access constraints, stairs, or loading restrictions.",
        `Room notes in ${room.name} mention access limitations.`,
      );
    }
  }

  return Array.from(entries.entries())
    .slice(0, 8)
    .map(([title, reason]) => ({ title, reason }));
}

function buildSpecialHandlingFlags(input: {
  surveyNotes: string | null;
  roomPackages: SurveyPackage["roomPackages"];
}) {
  const flags = new Set<string>();
  const notePool = [input.surveyNotes, ...input.roomPackages.map((room) => room.notes)].join(" ").toLowerCase();

  if (/(fragile|glass|mirror|art|lamp)/.test(notePool)) {
    flags.add("Fragile or delicate contents are noted and should be reviewed before quoting.");
  }
  if (/(stairs|narrow|tight|lift|parking|access)/.test(notePool)) {
    flags.add("Access constraints are present and may affect crew size, route planning, or quote risk.");
  }
  if (/(heavy|piano|safe|appliance|wardrobe)/.test(notePool)) {
    flags.add("Heavy or awkward items are likely and may require additional handling allowance.");
  }

  for (const room of input.roomPackages) {
    for (const item of room.items) {
      const prior = findPrior(item.label);
      prior?.flags.forEach((flag) => flags.add(flag));
    }
  }

  return Array.from(flags).slice(0, 6);
}

function findPrior(label: string) {
  return ITEM_PRIORS.find((entry) => entry.pattern.test(label))?.prior ?? null;
}

function parseObserved(raw: string | undefined) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as RawObserved[];
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item.label === "string" && typeof item.confidence === "number")
      : [];
  } catch {
    return [];
  }
}

function parseDeclared(raw: string | undefined) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as RawDeclared[];
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item.label === "string")
      : [];
  } catch {
    return [];
  }
}

function itemCountBand(totalItems: number) {
  if (totalItems === 0) return "No major items surfaced yet";
  if (totalItems <= 3) return "1 to 3 major items surfaced";
  if (totalItems <= 7) return "4 to 7 major items surfaced";
  if (totalItems <= 12) return "8 to 12 major items surfaced";
  return "12+ major items surfaced";
}

function volumeBand(cubeFeet: number) {
  if (cubeFeet === 0) return "No volume estimate yet";
  if (cubeFeet < 120) return "Light move volume";
  if (cubeFeet < 280) return "Moderate move volume";
  if (cubeFeet < 500) return "Large move volume";
  return "Very large move volume";
}

function csvEscape(value: string) {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundToOne(value: number) {
  return Math.round(value * 10) / 10;
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}
