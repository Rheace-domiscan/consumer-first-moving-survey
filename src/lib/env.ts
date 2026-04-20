function splitList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function readOptional(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readInteger(name: string, fallback: number, minimum = 0) {
  const raw = readOptional(name);

  if (!raw) {
    return fallback;
  }

  if (!/^-?\d+$/.test(raw)) {
    throw new Error(`Environment variable ${name} must be an integer.`);
  }

  const value = Number(raw);

  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`Environment variable ${name} must be an integer greater than or equal to ${minimum}.`);
  }

  return value;
}

function readEnum<T extends readonly string[]>(
  name: string,
  values: T,
): T[number] | undefined {
  const raw = readOptional(name);

  if (!raw) {
    return undefined;
  }

  if (!values.includes(raw as T[number])) {
    throw new Error(`Environment variable ${name} must be one of: ${values.join(", ")}.`);
  }

  return raw as T[number];
}

function normalizeUrl(value: string | undefined) {
  return value?.replace(/\/$/, "");
}

const paymentsProvider = readEnum("PAYMENTS_PROVIDER", ["mock", "stripe"] as const);
const appBaseUrl = normalizeUrl(readOptional("APP_BASE_URL") ?? readOptional("NEXT_PUBLIC_APP_URL"));
const storage = {
  bucket: readOptional("STORAGE_BUCKET"),
  region: readOptional("STORAGE_REGION"),
  endpoint: readOptional("STORAGE_ENDPOINT"),
  accessKeyId: readOptional("STORAGE_ACCESS_KEY_ID"),
  secretAccessKey: readOptional("STORAGE_SECRET_ACCESS_KEY"),
  publicBaseUrl: normalizeUrl(readOptional("STORAGE_PUBLIC_BASE_URL")),
};
const s3StorageConfigured = Boolean(
  storage.bucket &&
    storage.region &&
    storage.endpoint &&
    storage.accessKeyId &&
    storage.secretAccessKey,
);
const hasPartialS3Config = Boolean(
  storage.bucket ||
    storage.region ||
    storage.endpoint ||
    storage.accessKeyId ||
    storage.secretAccessKey,
);

if (hasPartialS3Config && !s3StorageConfigured) {
  throw new Error(
    "S3-compatible storage configuration is incomplete. Set STORAGE_BUCKET, STORAGE_REGION, STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID, and STORAGE_SECRET_ACCESS_KEY together.",
  );
}

if (paymentsProvider === "stripe" && (!appBaseUrl || !readOptional("STRIPE_SECRET_KEY"))) {
  throw new Error("Stripe payments require APP_BASE_URL (or NEXT_PUBLIC_APP_URL) and STRIPE_SECRET_KEY.");
}

export const env = {
  clerkPublishableKey: readOptional("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
  clerkSecretKey: readOptional("CLERK_SECRET_KEY"),
  adminClerkUserIds: splitList(process.env.ADMIN_CLERK_USER_IDS),
  appBaseUrl,
  paymentsProvider,
  paymentsCurrency: (readOptional("PAYMENTS_CURRENCY") ?? "usd").toLowerCase(),
  unlockPriceStandardCents: readInteger("UNLOCK_PRICE_STANDARD_CENTS", 2900, 0),
  unlockPricePremiumCents: readInteger("UNLOCK_PRICE_PREMIUM_CENTS", 5900, 0),
  stripeCompanyTeamPriceId: readOptional("STRIPE_COMPANY_TEAM_PRICE_ID"),
  companyTeamPlanIncludedUnlocks: readInteger("COMPANY_TEAM_PLAN_INCLUDED_UNLOCKS", 10, 0),
  stripeSecretKey: readOptional("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: readOptional("STRIPE_WEBHOOK_SECRET"),
  extractionRetryLimit: readInteger("EXTRACTION_RETRY_LIMIT", 3, 0),
  extractionWorkerLeaseSeconds: readInteger("EXTRACTION_WORKER_LEASE_SECONDS", 120, 1),
  extractionWorkerPollMs: readInteger("EXTRACTION_WORKER_POLL_MS", 8000, 1),
  jobRunnerSecret: readOptional("JOB_RUNNER_SECRET"),
  localMediaRoot: readOptional("LOCAL_MEDIA_ROOT"),
  storageBucket: storage.bucket,
  storageRegion: storage.region,
  storageEndpoint: storage.endpoint,
  storageAccessKeyId: storage.accessKeyId,
  storageSecretAccessKey: storage.secretAccessKey,
  storagePublicBaseUrl: storage.publicBaseUrl,
  s3StorageConfigured,
};
