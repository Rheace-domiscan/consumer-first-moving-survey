loadIfPresent(".env.local");
loadIfPresent(".env");

import { runExtractionWorkerOnce } from "../src/lib/extraction-worker";

const once = process.argv.includes("--once");
const intervalMs = Number(process.env.EXTRACTION_WORKER_POLL_MS || "8000");

async function runLoop() {
  do {
    const result = await runExtractionWorkerOnce({
      limit: Number(process.env.EXTRACTION_WORKER_BATCH_SIZE || "10"),
      trigger: once ? "worker_once_script" : "worker_poll_loop",
    });

    console.log(
      JSON.stringify(
        {
          at: new Date().toISOString(),
          ...result,
        },
        null,
        2,
      ),
    );

    if (once) {
      break;
    }

    await delay(intervalMs);
  } while (true);
}

runLoop().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadIfPresent(file: string) {
  try {
    process.loadEnvFile?.(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
      throw error;
    }
  }
}
