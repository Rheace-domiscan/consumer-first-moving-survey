import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createCompanySubscriptionCheckout, getPrimaryCompanyMembership } from "@/lib/company-billing";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getPrimaryCompanyMembership(userId);

  if (!membership) {
    return NextResponse.json({ error: "Create or join a company first." }, { status: 404 });
  }

  const result = await createCompanySubscriptionCheckout({
    companyId: membership.companyId,
  });

  return NextResponse.json(result);
}
