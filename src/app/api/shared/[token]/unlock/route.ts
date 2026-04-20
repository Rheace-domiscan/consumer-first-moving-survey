import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { startSharedSurveyUnlock } from "@/lib/unlock-flow";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { userId } = await auth();
    const user = userId ? await currentUser() : null;
    const userEmail = user?.emailAddresses[0]?.emailAddress ?? null;
    const { token } = await params;
    const body = (await request.json().catch(() => ({}))) as { moverEmail?: string };
    const result = await startSharedSurveyUnlock({
      token,
      userId,
      userEmail,
      requestedMoverEmail: body.moverEmail ?? null,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start mover checkout." },
      { status: 500 },
    );
  }
}
