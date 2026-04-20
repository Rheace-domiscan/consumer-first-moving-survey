import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { buildSurveyItemsCsv } from "@/lib/export";
import { getOwnerSurveyPackage } from "@/lib/surveys/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ surveyId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { surveyId } = await params;

  const survey = await getOwnerSurveyPackage({
    surveyId,
    userId,
  });

  if (!survey) {
    return NextResponse.json({ error: "Survey not found." }, { status: 404 });
  }

  return new NextResponse(buildSurveyItemsCsv(survey), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"survey-${surveyId}-items.csv\"`,
    },
  });
}
