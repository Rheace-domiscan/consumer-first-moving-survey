import type { VisionAnalysis } from "@/lib/vision-analyzer";

export function buildDeclaredItems(roomNotes: string | null) {
  const items: {
    label: string;
    source: "declared";
    evidence?: string[];
  }[] = [];

  if (!roomNotes?.trim()) {
    return items;
  }

  const normalized = normalize(roomNotes);
  const seen = new Set<string>();

  for (const item of MAJOR_ITEM_DETECTORS) {
    if (!item.patterns.some((pattern) => pattern.test(normalized))) {
      continue;
    }

    if (seen.has(item.label)) {
      continue;
    }

    seen.add(item.label);
    items.push({
      label: item.label,
      source: "declared",
      evidence: ["room_notes"],
    });
  }

  items.push({
    label: `Declared note: ${roomNotes.trim()}`,
    source: "declared",
    evidence: ["room_notes_raw"],
  });

  return items;
}

export function buildObservedItems(input: {
  roomName: string;
  roomNotes: string | null;
  fileName: string;
  mediaKind: string;
  vision: VisionAnalysis | null;
  declaredItems: { label: string }[];
}) {
  const candidates = new Map<
    string,
    {
      label: string;
      score: number;
      evidence: Set<string>;
    }
  >();

  const classificationText = (input.vision?.classifications ?? [])
    .map((entry) => `${entry.identifier}:${entry.confidence}`)
    .join(" ");
  const ocrText = (input.vision?.texts ?? []).map((entry) => entry.text).join(" ");
  const roomText = `${input.roomName} ${input.fileName}`;
  const noteText = input.roomNotes ?? "";

  registerSignals(candidates, roomText, "room_context", 0.22);
  registerSignals(candidates, noteText, "note_context", 0.16);
  registerSignals(candidates, classificationText, "vision_classification", 0.38);
  registerSignals(candidates, ocrText, "vision_text", 0.28);
  registerRoomPriors(candidates, input.roomName);

  const declaredLabels = new Set(
    input.declaredItems
      .map((item) => item.label)
      .filter((label) => !label.startsWith("Declared note:")),
  );

  for (const [label, candidate] of candidates) {
    if (declaredLabels.has(label)) {
      candidate.score += 0.08;
      candidate.evidence.add("declared_match");
    }
  }

  let observed = Array.from(candidates.values())
    .filter((candidate) => candidate.score >= 0.4)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((candidate) => ({
      label: candidate.label,
      confidence: clamp(roundToThree(candidate.score), 0.35, 0.96),
      source: "observed" as const,
      evidence: Array.from(candidate.evidence).sort(),
    }));

  if (observed.length === 0) {
    const roomPrior = fallbackRoomPrior(input.roomName);

    if (roomPrior) {
      observed = [
        {
          label: roomPrior,
          confidence: input.vision ? 0.46 : 0.39,
          source: "observed",
          evidence: [input.vision ? "room_prior" : "room_prior_fallback"],
        },
      ];
    }
  }

  if (input.mediaKind === "VIDEO") {
    observed = observed.map((item) => ({
      ...item,
      confidence: clamp(roundToThree(item.confidence + 0.03), 0.35, 0.97),
      evidence: [...(item.evidence ?? []), "video_capture"],
    }));
  }

  return observed;
}

export function buildReviewReasons(input: {
  observedItems: { confidence: number; evidence?: string[] }[];
  declaredItems: { label: string }[];
  vision: VisionAnalysis | null;
}) {
  const reasons: string[] = [];

  if (!input.vision) {
    reasons.push("Apple Vision analysis was unavailable, so the worker used room-prior fallback logic.");
  }

  for (const issue of input.vision?.issues ?? []) {
    reasons.push(issue.message);
  }

  const topClassifications = (input.vision?.classifications ?? []).map((entry) => entry.identifier.toLowerCase());
  if (topClassifications.some((entry) => /document|screenshot|printed_page|diagram|chart/.test(entry))) {
    reasons.push("Uploaded media appears closer to a document or screenshot than a room-photo capture.");
  }

  if (input.observedItems.length === 0) {
    reasons.push("No major items could be extracted from the uploaded media.");
  }

  if (input.observedItems.some((item) => item.confidence < 0.55)) {
    reasons.push("At least one observed item was extracted with low confidence and should be checked by an operator.");
  }

  if (input.declaredItems.some((item) => /Declared note:/i.test(item.label))) {
    reasons.push("Consumer notes contain handling context that should be preserved in mover review.");
  }

  return Array.from(new Set(reasons));
}

export function deriveConfidenceScore(input: {
  observedItems: { confidence: number }[];
  declaredItems: { label: string }[];
  vision: VisionAnalysis | null;
  reviewReasons: string[];
}) {
  let score = input.observedItems.length
    ? Math.round(
        (input.observedItems.reduce((sum, item) => sum + item.confidence, 0) / input.observedItems.length) * 100,
      )
    : 35;

  if (input.vision) {
    score += 12;
  } else {
    score -= 12;
  }

  if (input.declaredItems.length > 0) {
    score += 4;
  }

  score -= input.reviewReasons.length * 6;

  return clamp(score, 18, 96);
}

export function scoreToTier(score: number): "High" | "Medium" | "Low" {
  if (score >= 80) {
    return "High";
  }

  if (score >= 60) {
    return "Medium";
  }

  return "Low";
}

export function roundToThree(value: number) {
  return Math.round(value * 1000) / 1000;
}

function registerSignals(
  candidates: Map<string, { label: string; score: number; evidence: Set<string> }>,
  rawText: string,
  evidence: string,
  weight: number,
) {
  const text = normalize(rawText);

  if (!text) {
    return;
  }

  for (const detector of MAJOR_ITEM_DETECTORS) {
    if (!detector.patterns.some((pattern) => pattern.test(text))) {
      continue;
    }

    const current = candidates.get(detector.label) ?? {
      label: detector.label,
      score: 0,
      evidence: new Set<string>(),
    };

    current.score += weight;
    current.evidence.add(evidence);
    candidates.set(detector.label, current);
  }
}

function registerRoomPriors(
  candidates: Map<string, { label: string; score: number; evidence: Set<string> }>,
  roomName: string,
) {
  const normalized = normalize(roomName);

  for (const prior of ROOM_PRIORS) {
    if (!prior.pattern.test(normalized)) {
      continue;
    }

    for (const item of prior.items) {
      const current = candidates.get(item.label) ?? {
        label: item.label,
        score: 0,
        evidence: new Set<string>(),
      };
      current.score += item.weight;
      current.evidence.add("room_prior");
      candidates.set(item.label, current);
    }
  }
}

function fallbackRoomPrior(roomName: string) {
  const normalized = normalize(roomName);
  const prior = ROOM_PRIORS.find((entry) => entry.pattern.test(normalized));
  return prior?.items[0]?.label ?? null;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/[^\p{L}\p{N}\s/.-]+/gu, " ");
}

const MAJOR_ITEM_DETECTORS = [
  {
    label: "Sofa",
    patterns: [/\bsofa\b/i, /\bcouch\b/i, /\bloveseat\b/i, /\bliving room\b/i],
  },
  {
    label: "Bed / mattress",
    patterns: [/\bbed\b/i, /\bmattress\b/i, /\bbedroom\b/i],
  },
  {
    label: "Wardrobe / drawers",
    patterns: [/\bwardrobe\b/i, /\bdresser\b/i, /\bcloset\b/i, /\bchest of drawers\b/i],
  },
  {
    label: "Table",
    patterns: [/\btable\b/i, /\bdining\b/i, /\bcoffee table\b/i],
  },
  {
    label: "Desk",
    patterns: [/\bdesk\b/i, /\boffice\b/i, /\bstudy\b/i],
  },
  {
    label: "Fridge / major kitchen appliance",
    patterns: [/\bfridge\b/i, /\bfreezer\b/i, /\bappliance\b/i, /\bkitchen\b/i],
  },
  {
    label: "Washing machine / dryer",
    patterns: [/\bwasher\b/i, /\bdryer\b/i, /\bwashing machine\b/i, /\blaundry\b/i],
  },
  {
    label: "TV / monitor",
    patterns: [/\btv\b/i, /\btelevision\b/i, /\bmonitor\b/i, /\bscreen\b/i],
  },
  {
    label: "Bookcase / shelving",
    patterns: [/\bbookcase\b/i, /\bbookshelf\b/i, /\bshelf\b/i, /\bshelving\b/i],
  },
  {
    label: "Armchair / chair",
    patterns: [/\bchair\b/i, /\barmchair\b/i, /\bstool\b/i],
  },
  {
    label: "Cartons / bags",
    patterns: [/\bbox\b/i, /\bboxes\b/i, /\bcarton\b/i, /\bbag\b/i, /\bstorage\b/i],
  },
  {
    label: "Lamp",
    patterns: [/\blamp\b/i],
  },
  {
    label: "Mirror / artwork / glass item",
    patterns: [/\bmirror\b/i, /\bart\b/i, /\bartwork\b/i, /\bglass\b/i, /\bpicture\b/i],
  },
];

const ROOM_PRIORS = [
  {
    pattern: /\bliving\b|\blounge\b|\breception\b/i,
    items: [
      { label: "Sofa", weight: 0.42 },
      { label: "TV / monitor", weight: 0.24 },
      { label: "Table", weight: 0.18 },
      { label: "Lamp", weight: 0.15 },
    ],
  },
  {
    pattern: /\bbed\b|\bbedroom\b|\bmaster\b|\bguest\b/i,
    items: [
      { label: "Bed / mattress", weight: 0.46 },
      { label: "Wardrobe / drawers", weight: 0.24 },
      { label: "Lamp", weight: 0.16 },
    ],
  },
  {
    pattern: /\bkitchen\b|\butility\b|\blaundry\b/i,
    items: [
      { label: "Fridge / major kitchen appliance", weight: 0.44 },
      { label: "Washing machine / dryer", weight: 0.22 },
      { label: "Table", weight: 0.14 },
    ],
  },
  {
    pattern: /\bdining\b/i,
    items: [
      { label: "Table", weight: 0.4 },
      { label: "Armchair / chair", weight: 0.24 },
    ],
  },
  {
    pattern: /\boffice\b|\bstudy\b/i,
    items: [
      { label: "Desk", weight: 0.44 },
      { label: "Armchair / chair", weight: 0.18 },
      { label: "Bookcase / shelving", weight: 0.18 },
      { label: "TV / monitor", weight: 0.18 },
    ],
  },
  {
    pattern: /\bgarage\b|\bloft\b|\bbasement\b|\bstorage\b/i,
    items: [
      { label: "Cartons / bags", weight: 0.34 },
      { label: "Bookcase / shelving", weight: 0.18 },
    ],
  },
  {
    pattern: /\bhall\b|\blanding\b|\bentry\b/i,
    items: [
      { label: "Mirror / artwork / glass item", weight: 0.2 },
      { label: "Cartons / bags", weight: 0.16 },
    ],
  },
];
