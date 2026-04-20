import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createCompanyForUser, getPrimaryCompanyMembership } from "@/lib/company-billing";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? null;

  if (!email) {
    return NextResponse.json({ error: "A primary email address is required." }, { status: 400 });
  }

  const existing = await getPrimaryCompanyMembership(userId);
  if (existing) {
    return NextResponse.json({ company: existing.company, created: false });
  }

  const body = (await request.json().catch(() => ({}))) as {
    companyName?: string;
  };

  if (!body.companyName?.trim()) {
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  }

  const company = await createCompanyForUser({
    userId,
    email,
    companyName: body.companyName,
  });

  return NextResponse.json({ company, created: true }, { status: 201 });
}
