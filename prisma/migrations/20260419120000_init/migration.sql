-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerClerkUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "retentionState" TEXT NOT NULL DEFAULT 'ACTIVE',
    "retentionPolicyId" TEXT,
    "retentionArchiveAfterDays" INTEGER,
    "retentionPurgeAfterDays" INTEGER,
    "retentionExemptReason" TEXT,
    "archivedAt" DATETIME,
    "archivedByClerkUserId" TEXT,
    "statusBeforeArchive" TEXT,
    "readinessStateBeforeArchive" TEXT,
    "shareToken" TEXT,
    "readinessState" TEXT DEFAULT 'NOT_READY',
    "title" TEXT,
    "originPostcode" TEXT,
    "destinationPostcode" TEXT,
    "propertyType" TEXT,
    "moveWindow" TEXT,
    "completeness" TEXT,
    "notes" TEXT,
    CONSTRAINT "Survey_retentionPolicyId_fkey" FOREIGN KEY ("retentionPolicyId") REFERENCES "RetentionPolicy" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurveyRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "surveyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "mediaCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    CONSTRAINT "SurveyRoom_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurveyMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "surveyRoomId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT,
    "fileSize" INTEGER,
    "storageKey" TEXT NOT NULL,
    "storageUrl" TEXT,
    "uploadStatus" TEXT NOT NULL DEFAULT 'UPLOADED',
    "notes" TEXT,
    CONSTRAINT "SurveyMedia_surveyRoomId_fkey" FOREIGN KEY ("surveyRoomId") REFERENCES "SurveyRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtractionJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "surveyId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "mode" TEXT NOT NULL,
    CONSTRAINT "ExtractionJob_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExtractionJob_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "SurveyMedia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtractionResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "extractionJobId" TEXT NOT NULL,
    "surveyRoomId" TEXT NOT NULL,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "observedJson" TEXT NOT NULL,
    "declaredJson" TEXT NOT NULL,
    CONSTRAINT "ExtractionResult_extractionJobId_fkey" FOREIGN KEY ("extractionJobId") REFERENCES "ExtractionJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExtractionResult_surveyRoomId_fkey" FOREIGN KEY ("surveyRoomId") REFERENCES "SurveyRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "surveyId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "eventType" TEXT NOT NULL,
    "payloadJson" TEXT,
    CONSTRAINT "AuditEvent_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MoverUnlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "surveyId" TEXT NOT NULL,
    "moverEmail" TEXT NOT NULL,
    "companyName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INVITED',
    "quotedPriceCents" INTEGER NOT NULL DEFAULT 2900,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeCustomerId" TEXT,
    "checkoutStartedAt" DATETIME,
    "paymentCapturedAt" DATETIME,
    "invitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" DATETIME,
    "unlockedAt" DATETIME,
    CONSTRAINT "MoverUnlock_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnlockCharge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "surveyId" TEXT NOT NULL,
    "moverUnlockId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MOCK',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "checkoutRequestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeCustomerId" TEXT,
    "checkoutUrl" TEXT,
    "metadataJson" TEXT,
    CONSTRAINT "UnlockCharge_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UnlockCharge_moverUnlockId_fkey" FOREIGN KEY ("moverUnlockId") REFERENCES "MoverUnlock" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccessEntitlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "surveyId" TEXT NOT NULL,
    "moverUnlockId" TEXT NOT NULL,
    "unlockChargeId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'PAYMENT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "revokedAt" DATETIME,
    "revokedReason" TEXT,
    CONSTRAINT "AccessEntitlement_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccessEntitlement_moverUnlockId_fkey" FOREIGN KEY ("moverUnlockId") REFERENCES "MoverUnlock" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccessEntitlement_unlockChargeId_fkey" FOREIGN KEY ("unlockChargeId") REFERENCES "UnlockCharge" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppRoleAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "grantedByClerkUserId" TEXT,
    "note" TEXT
);

-- CreateTable
CREATE TABLE "RetentionPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'GLOBAL_DEFAULT',
    "activeSurveyArchiveDays" INTEGER NOT NULL DEFAULT 30,
    "archivedSurveyPurgeDays" INTEGER NOT NULL DEFAULT 180,
    "mediaRetentionDays" INTEGER NOT NULL DEFAULT 180,
    "auditRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "purgeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowOwnerDelete" BOOLEAN NOT NULL DEFAULT false,
    "updatedByClerkUserId" TEXT
);

-- CreateTable
CREATE TABLE "RetentionRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "policyId" TEXT NOT NULL,
    "triggeredByClerkUserId" TEXT,
    "archivedCount" INTEGER NOT NULL DEFAULT 0,
    "mediaPurgedCount" INTEGER NOT NULL DEFAULT 0,
    "auditPurgedCount" INTEGER NOT NULL DEFAULT 0,
    "purgedCount" INTEGER NOT NULL DEFAULT 0,
    "archivedSurveyIdsJson" TEXT,
    "purgedSurveyIdsJson" TEXT,
    "notes" TEXT,
    CONSTRAINT "RetentionRun_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "RetentionPolicy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Survey_shareToken_key" ON "Survey"("shareToken");

-- CreateIndex
CREATE INDEX "Survey_ownerClerkUserId_updatedAt_idx" ON "Survey"("ownerClerkUserId", "updatedAt");

-- CreateIndex
CREATE INDEX "Survey_retentionState_updatedAt_idx" ON "Survey"("retentionState", "updatedAt");

-- CreateIndex
CREATE INDEX "Survey_retentionState_archivedAt_idx" ON "Survey"("retentionState", "archivedAt");

-- CreateIndex
CREATE INDEX "SurveyMedia_surveyRoomId_createdAt_idx" ON "SurveyMedia"("surveyRoomId", "createdAt");

-- CreateIndex
CREATE INDEX "SurveyMedia_uploadStatus_createdAt_idx" ON "SurveyMedia"("uploadStatus", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExtractionResult_extractionJobId_key" ON "ExtractionResult"("extractionJobId");

-- CreateIndex
CREATE INDEX "AuditEvent_surveyId_createdAt_idx" ON "AuditEvent"("surveyId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "MoverUnlock_surveyId_status_idx" ON "MoverUnlock"("surveyId", "status");

-- CreateIndex
CREATE INDEX "MoverUnlock_moverEmail_status_idx" ON "MoverUnlock"("moverEmail", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UnlockCharge_stripeCheckoutSessionId_key" ON "UnlockCharge"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "UnlockCharge_stripePaymentIntentId_key" ON "UnlockCharge"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "UnlockCharge_surveyId_createdAt_idx" ON "UnlockCharge"("surveyId", "createdAt");

-- CreateIndex
CREATE INDEX "UnlockCharge_moverUnlockId_createdAt_idx" ON "UnlockCharge"("moverUnlockId", "createdAt");

-- CreateIndex
CREATE INDEX "UnlockCharge_status_createdAt_idx" ON "UnlockCharge"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AccessEntitlement_moverUnlockId_key" ON "AccessEntitlement"("moverUnlockId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessEntitlement_unlockChargeId_key" ON "AccessEntitlement"("unlockChargeId");

-- CreateIndex
CREATE INDEX "AccessEntitlement_surveyId_status_idx" ON "AccessEntitlement"("surveyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AppRoleAssignment_clerkUserId_key" ON "AppRoleAssignment"("clerkUserId");

-- CreateIndex
CREATE INDEX "AppRoleAssignment_role_idx" ON "AppRoleAssignment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RetentionPolicy_key_key" ON "RetentionPolicy"("key");

-- CreateIndex
CREATE INDEX "RetentionRun_createdAt_idx" ON "RetentionRun"("createdAt");

