loadIfPresent(".env.local");
loadIfPresent(".env");

import { runRetentionSweep } from "../src/lib/retention";

runRetentionSweep({
  triggeredByClerkUserId: "system_scheduler",
})
  .then((result) => {
    console.log(
      JSON.stringify(
        {
          at: new Date().toISOString(),
          archivedSurveyIds: result.archivedSurveyIds,
          purgedSurveyIds: result.purgedSurveyIds,
          mediaPurgedCount: result.mediaPurgedCount,
          auditPurgedCount: result.auditPurgedCount,
          runId: result.run.id,
        },
        null,
        2,
      ),
    );
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

function loadIfPresent(file: string) {
  try {
    process.loadEnvFile?.(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
      throw error;
    }
  }
}
