import { BillingReturnClient } from "@/app/billing-return/billing-return-client";

const DESTINATIONS = {
  success: "/mover?subscription=success",
  cancelled: "/mover?subscription=cancelled",
  portal: "/mover?portal=return",
} as const;

export default async function BillingReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const destination =
    state && Object.hasOwn(DESTINATIONS, state)
      ? DESTINATIONS[state as keyof typeof DESTINATIONS]
      : "/mover";

  return <BillingReturnClient destination={destination} />;
}
