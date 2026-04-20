import { NextResponse } from "next/server";
import { runRetentionSweep } from "@/lib/retention";
import { hasValidJobRunnerSecret } from "@/lib/internal-jobs";

export async function POST(request: Request) {
  if (!hasValidJobRunnerSecret(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await runRetentionSweep({
    triggeredByClerkUserId: "system_scheduler",
  });

  return NextResponse.json(result);
}
