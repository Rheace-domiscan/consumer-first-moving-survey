import { NextResponse } from "next/server";
import { runExtractionWorkerOnce } from "@/lib/extraction-worker";
import { hasValidJobRunnerSecret } from "@/lib/internal-jobs";

export async function POST(request: Request) {
  if (!hasValidJobRunnerSecret(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    limit?: number;
    surveyId?: string;
  };

  const result = await runExtractionWorkerOnce({
    limit: body.limit,
    surveyId: body.surveyId,
    trigger: "internal_route",
  });

  return NextResponse.json(result);
}
