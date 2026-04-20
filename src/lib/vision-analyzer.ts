import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { execFile as execFileCallback } from "node:child_process";
import { ensureLocalMediaMirror } from "@/lib/storage";

const execFile = promisify(execFileCallback);

export type VisionAnalysis = {
  version: string;
  kind: string;
  pixelWidth: number | null;
  pixelHeight: number | null;
  durationSeconds: number | null;
  framesAnalyzed: number;
  classifications: {
    identifier: string;
    confidence: number;
    source: string;
  }[];
  texts: {
    text: string;
    confidence: number;
    source: string;
  }[];
  issues: {
    code: string;
    message: string;
  }[];
};

export async function analyzeMediaWithVision(input: {
  mediaKind: string;
  storageKey: string;
  storageUrl?: string | null;
}) : Promise<VisionAnalysis | null> {
  const localPath = await ensureLocalMediaMirror({
    storageKey: input.storageKey,
    storageUrl: input.storageUrl,
  });

  if (!localPath) {
    return null;
  }

  const binary = await ensureVisionBinary().catch(() => null);

  if (!binary) {
    return null;
  }

  try {
    const { stdout } = await execFile(binary, ["--file", localPath, "--kind", input.mediaKind], {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });

    return JSON.parse(stdout) as VisionAnalysis;
  } catch {
    return null;
  }
}

async function ensureVisionBinary() {
  const sourcePath = path.join(/* turbopackIgnore: true */ process.cwd(), "scripts", "vision-analyzer.swift");
  const cacheDir = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "node_modules",
    ".cache",
    "consumer-first-moving-survey",
  );
  const binaryPath = path.join(cacheDir, "vision-analyzer");

  const [sourceStat, binaryStat] = await Promise.all([
    fs.stat(sourcePath),
    fs.stat(binaryPath).catch(() => null),
  ]);

  if (binaryStat && binaryStat.mtimeMs >= sourceStat.mtimeMs) {
    return binaryPath;
  }

  await fs.mkdir(cacheDir, { recursive: true });
  await execFile("swiftc", ["-O", "-o", binaryPath, sourcePath], {
    cwd: process.cwd(),
    maxBuffer: 10 * 1024 * 1024,
  });

  return binaryPath;
}
