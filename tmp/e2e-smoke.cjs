const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const { clerkClient } = require("@clerk/nextjs/server");
const { chromium } = require("/opt/homebrew/lib/node_modules/@playwright/mcp/node_modules/playwright");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const UPLOAD_PATH = path.join(process.cwd(), "tmp", "qa-upload.png");
const ROOM_NOTES = "Sofa is heavy, narrow stairs, lamp is fragile.";
const RETENTION_REASON = "VIP relocation flagged for manual handling.";

function log(step, detail) {
  console.log(`[smoke] ${step}${detail ? `: ${detail}` : ""}`);
}

function roomCard(page, roomName) {
  return page
    .getByRole("heading", { name: roomName, exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-2xl')][1]");
}

function surveyReviewCard(page, surveyTitle) {
  return page
    .getByRole("heading", { name: surveyTitle, exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-2xl')][1]");
}

async function waitForVisible(locator, timeout = 15000) {
  await locator.waitFor({ state: "visible", timeout });
}

async function waitForText(page, text, timeout = 15000) {
  await waitForVisible(page.getByText(text, { exact: false }).first(), timeout);
}

async function signIn(page, signInToken) {
  log("sign-in", "consuming backend sign-in token");
  const signInUrl = `${BASE_URL}/sign-in?__clerk_ticket=${encodeURIComponent(
    signInToken,
  )}&redirect_url=${encodeURIComponent(`${BASE_URL}/survey`)}`;

  await page.goto(signInUrl, { waitUntil: "domcontentloaded" });
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 30000 });
  await page.goto(`${BASE_URL}/survey`, { waitUntil: "networkidle" });
}

async function createSurvey(page, title) {
  log("survey", "creating draft");
  await waitForVisible(page.locator('input[name="title"]'));
  await page.locator('input[name="title"]').fill(title);
  await page.locator('select[name="propertyType"]').selectOption("House");
  await page.locator('input[name="originPostcode"]').fill("EC1A 1BB");
  await page.locator('input[name="destinationPostcode"]').fill("BS1 5AH");
  await page.locator('input[name="moveWindow"]').fill("Early July");
  await page.locator('textarea[name="notes"]').fill("E2E smoke test for volumetric survey flow.");

  await Promise.all([
    page.waitForURL((url) => /^\/survey\/[^/]+$/.test(url.pathname), { timeout: 30000 }),
    page.getByRole("button", { name: "Create survey draft" }).click(),
  ]);

  const match = page.url().match(/\/survey\/([^/?#]+)/);
  if (!match) {
    throw new Error(`Unable to parse survey id from ${page.url()}`);
  }

  log("survey", `created ${match[1]}`);
  return match[1];
}

async function uploadRoomMedia(page, surveyId) {
  log("upload", "attaching room media");
  await page.goto(`${BASE_URL}/survey/${surveyId}/upload`, { waitUntil: "networkidle" });
  await waitForVisible(page.locator('input[type="file"][name="file"]'));
  const uploadedRoomName = (await page.getByRole("heading", { level: 3 }).first().textContent())?.trim();
  if (!uploadedRoomName) {
    throw new Error("Unable to determine the uploaded room name.");
  }
  await page.locator('input[type="file"][name="file"]').setInputFiles(UPLOAD_PATH);

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/surveys/${surveyId}/upload`) &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30000 },
    ),
    page.getByRole("button", { name: "Upload media" }).click(),
  ]);

  await page.waitForLoadState("networkidle");
  await waitForText(page, "qa-upload.png", 30000);
  return uploadedRoomName;
}

async function saveRoomNotes(page, surveyId, uploadedRoomName) {
  log("upload", "saving room notes");
  const targetCard = roomCard(page, uploadedRoomName);
  const notesField = targetCard.getByPlaceholder(
    "Add packing instructions, access notes, fragile items, or missing details for this room.",
  );

  await notesField.fill(ROOM_NOTES);
  await page.waitForFunction(
    ({ value, placeholder }) => {
      const field = Array.from(document.querySelectorAll("textarea")).find(
        (entry) => entry.getAttribute("placeholder") === placeholder,
      );
      return field && field.value === value;
    },
    {
      value: ROOM_NOTES,
      placeholder:
        "Add packing instructions, access notes, fragile items, or missing details for this room.",
    },
    { timeout: 10000 },
  );
  await notesField.press("Tab");

  await targetCard.getByRole("button", { name: "Save notes" }).click();

  await waitForText(page, "Saved room notes.");
  await page.reload({ waitUntil: "networkidle" });

  const persistedNotes = await roomCard(page, uploadedRoomName)
    .getByPlaceholder(
      "Add packing instructions, access notes, fragile items, or missing details for this room.",
    )
    .inputValue();
  if (persistedNotes !== ROOM_NOTES) {
    throw new Error(`Room notes did not persist for ${uploadedRoomName}.`);
  }
}

async function markRoomComplete(page, surveyId, uploadedRoomName) {
  log("upload", "marking first room complete");
  const targetCard = roomCard(page, uploadedRoomName);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().includes(`/api/surveys/${surveyId}/rooms/`) &&
        response.request().postData()?.includes('"status":"COMPLETE"') &&
        response.ok(),
      { timeout: 30000 },
    ),
    targetCard.getByRole("button", { name: "Mark room complete" }).click(),
  ]);

  await page.waitForLoadState("networkidle");
  await waitForText(page, "COMPLETE");
}

async function runAiPrep(page, surveyId) {
  log("ai-preview", "syncing extraction artifacts");
  await page.goto(`${BASE_URL}/survey/${surveyId}/ai-preview`, { waitUntil: "networkidle" });
  await waitForVisible(page.getByRole("button", { name: "Sync extraction artifacts" }));

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/surveys/${surveyId}/extraction/sync`) &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30000 },
    ),
    page.getByRole("button", { name: "Sync extraction artifacts" }).click(),
  ]);

  await page.waitForLoadState("networkidle");
  await waitForText(page, "qa-upload.png", 30000);
  await waitForText(page, "PENDING", 30000);

  log("ai-preview", "running extraction processor");
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/surveys/${surveyId}/extraction/run`) &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30000 },
    ),
    page.getByRole("button", { name: "Run extraction processor" }).click(),
  ]);

  await page.waitForLoadState("networkidle");
  await waitForText(page, "COMPLETE", 30000);
  await waitForText(page, "Sofa", 30000);
  await waitForText(page, `Declared note: ${ROOM_NOTES}`, 30000);
}

async function verifySummaryAndExport(page, surveyId, surveyTitle) {
  log("summary", "checking summary and export");
  await page.goto(`${BASE_URL}/survey/${surveyId}/summary`, { waitUntil: "networkidle" });

  await waitForText(page, "Quote-ready survey summary", 30000);
  await waitForText(page, "Volume, packing, and handling", 30000);
  await waitForText(page, ROOM_NOTES, 30000);
  await waitForText(page, "Readiness and confidence", 30000);
  await waitForText(page, "1 to 3 major items surfaced", 30000);
  await waitForText(page, "Sofa", 30000);

  const jsonPath = path.join(process.cwd(), "tmp", `survey-export-${Date.now()}.json`);
  const [jsonDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 30000 }),
    page.getByRole("button", { name: "Download JSON" }).click(),
  ]);

  await jsonDownload.saveAs(jsonPath);
  const exported = JSON.parse(await fs.readFile(jsonPath, "utf8"));
  await fs.unlink(jsonPath).catch(() => undefined);

  if (exported.surveyPackage?.surveyTitle !== surveyTitle) {
    throw new Error(`Export title mismatch: ${exported.surveyPackage?.surveyTitle || "missing"}`);
  }

  const firstRoomWithNotes = exported.surveyPackage?.roomPackages?.find((room) => room.notes === ROOM_NOTES);
  if (!firstRoomWithNotes) {
    throw new Error("Export is missing the saved room notes.");
  }

  if (!exported.surveyPackage?.packingGuidance?.length) {
    throw new Error("Export is missing packing guidance.");
  }

  const csvPath = path.join(process.cwd(), "tmp", `survey-export-${Date.now()}.csv`);
  const [csvDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 30000 }),
    page.getByRole("button", { name: "Download CSV" }).click(),
  ]);

  await csvDownload.saveAs(csvPath);
  const csv = await fs.readFile(csvPath, "utf8");
  await fs.unlink(csvPath).catch(() => undefined);

  if (!csv.includes(surveyTitle) || !csv.includes("Sofa")) {
    throw new Error("CSV export is missing expected mover package rows.");
  }

  await page.goto(`${BASE_URL}/survey/${surveyId}/print`, { waitUntil: "networkidle" });
  await waitForText(page, surveyTitle, 30000);
  await waitForText(page, "Print / Save as PDF", 30000);

  await page.goto(`${BASE_URL}/ops/review`, { waitUntil: "networkidle" });
  await waitForText(page, "Survey review and retention queue", 30000);
  await waitForText(page, surveyTitle, 30000);
}

async function verifyShareAndUnlock(page, context, surveyId, surveyTitle) {
  log("share", "creating mover invite and share link");
  await page.goto(`${BASE_URL}/survey/${surveyId}/summary`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("mover@company.com").fill("mover@example.com");
  await page.getByPlaceholder("Company name").fill("Acme Movers");

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/surveys/${surveyId}/mover-unlocks`) &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30000 },
    ),
    page.getByRole("button", { name: "Create mover invite" }).click(),
  ]);

  await page.waitForLoadState("networkidle");
  await waitForText(page, "Acme Movers", 30000);
  await waitForText(page, "INVITED", 30000);
  await waitForText(page, "Payment not started", 30000);

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/surveys/${surveyId}/share`) &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30000 },
    ),
    page.getByRole("button", { name: "Create share link" }).click(),
  ]);

  await page.waitForFunction(
    () => document.body.innerText.includes("/shared/"),
    undefined,
    { timeout: 30000 },
  );

  const shareText = await page.locator("body").innerText();
  const shareUrlMatch = shareText.match(
    new RegExp(`${escapeRegExp(BASE_URL)}/shared/[A-Za-z0-9_-]+`),
  );
  if (!shareUrlMatch) {
    throw new Error("Share link was not rendered on the summary page.");
  }

  const sharedPage = await context.newPage();
  await sharedPage.goto(shareUrlMatch[0], { waitUntil: "networkidle" });
  await waitForText(sharedPage, surveyTitle, 30000);
  await waitForText(sharedPage, "Preview before unlock", 30000);
  const preUnlockText = await sharedPage.locator("body").innerText();
  if (preUnlockText.includes(ROOM_NOTES)) {
    throw new Error("Shared preview exposed full room notes before unlock.");
  }

  await Promise.all([
    sharedPage.waitForResponse(
      (response) =>
        response.url().includes("/api/shared/") &&
        response.url().endsWith("/unlock") &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30000 },
    ),
    sharedPage.getByRole("button", { name: /Unlock full survey/ }).click(),
  ]);

  await sharedPage.waitForLoadState("networkidle");
  await waitForText(sharedPage, "Unlocked mover review", 30000);
  await waitForText(sharedPage, ROOM_NOTES, 30000);
  await sharedPage.close();

  await page.goto(`${BASE_URL}/survey/${surveyId}/summary`, { waitUntil: "networkidle" });
  await waitForText(page, "UNLOCKED", 30000);
}

async function verifyOpsAdminAndRetention(page, surveyId, surveyTitle, email, adminUserId, prisma) {
  log("ops", "verifying admin queue, retention controls, and policy UI");
  await page.goto(`${BASE_URL}/ops/review`, { waitUntil: "networkidle" });
  await waitForText(page, "Survey review and retention queue", 30000);
  await waitForText(page, surveyTitle, 30000);

  let card = surveyReviewCard(page, surveyTitle);
  await card.getByLabel("Exemption reason").fill(RETENTION_REASON);

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/admin/surveys/${surveyId}/retention`) &&
        response.request().method() === "PATCH" &&
        response.ok(),
      { timeout: 30000 },
    ),
    card.getByRole("button", { name: "Mark exempt" }).click(),
  ]);
  await page.waitForLoadState("networkidle");
  await waitForText(page, "EXEMPT", 30000);
  await waitForText(page, `Exempt reason: ${RETENTION_REASON}`, 30000);
  const exempted = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: { retentionState: true, retentionExemptReason: true },
  });
  if (exempted?.retentionState !== "EXEMPT" || exempted.retentionExemptReason !== RETENTION_REASON) {
    throw new Error("Survey did not persist the exempt retention state.");
  }

  card = surveyReviewCard(page, surveyTitle);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/admin/surveys/${surveyId}/retention`) &&
        response.request().method() === "PATCH" &&
        response.ok(),
      { timeout: 30000 },
    ),
    card.getByRole("button", { name: "Clear exempt" }).click(),
  ]);
  await page.waitForLoadState("networkidle");
  const cleared = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: { retentionState: true, retentionExemptReason: true },
  });
  if (cleared?.retentionState !== "ACTIVE" || cleared.retentionExemptReason !== null) {
    throw new Error("Survey remained exempt after clearing exemption.");
  }

  card = surveyReviewCard(page, surveyTitle);
  await card.getByLabel("Archive after days override").fill("45");
  await card.getByLabel("Purge after days override").fill("120");
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/admin/surveys/${surveyId}/retention`) &&
        response.request().method() === "PATCH" &&
        response.ok(),
      { timeout: 30000 },
    ),
    card.getByRole("button", { name: "Save overrides" }).click(),
  ]);
  await page.waitForLoadState("networkidle");
  card = surveyReviewCard(page, surveyTitle);
  if ((await card.getByLabel("Archive after days override").inputValue()) !== "45") {
    throw new Error("Archive override did not persist.");
  }
  if ((await card.getByLabel("Purge after days override").inputValue()) !== "120") {
    throw new Error("Purge override did not persist.");
  }
  const overrides = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: { retentionArchiveAfterDays: true, retentionPurgeAfterDays: true },
  });
  if (overrides?.retentionArchiveAfterDays !== 45 || overrides.retentionPurgeAfterDays !== 120) {
    throw new Error("Retention overrides did not persist.");
  }

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/admin/surveys/${surveyId}/retention`) &&
        response.request().method() === "PATCH" &&
        response.ok(),
      { timeout: 30000 },
    ),
    card.getByRole("button", { name: "Archive now" }).click(),
  ]);
  await page.waitForLoadState("networkidle");
  await waitForText(page, "ARCHIVED", 30000);
  const archived = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: { retentionState: true, status: true },
  });
  if (archived?.retentionState !== "ARCHIVED" || archived.status !== "ARCHIVED") {
    throw new Error("Survey did not archive cleanly.");
  }

  card = surveyReviewCard(page, surveyTitle);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/admin/surveys/${surveyId}/retention`) &&
        response.request().method() === "PATCH" &&
        response.ok(),
      { timeout: 30000 },
    ),
    card.getByRole("button", { name: "Restore" }).click(),
  ]);
  await page.waitForLoadState("networkidle");
  await waitForText(page, "ACTIVE", 30000);
  const restored = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: { retentionState: true, status: true },
  });
  if (restored?.retentionState !== "ACTIVE" || restored.status === "ARCHIVED") {
    throw new Error("Survey did not restore from archive.");
  }

  await page.goto(`${BASE_URL}/ops/settings`, { waitUntil: "networkidle" });
  await waitForText(page, "Roles, policy, and retention runs", 30000);
  await waitForText(page, email, 30000);

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/admin/retention/run") &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30000 },
    ),
    page.getByRole("button", { name: "Run retention sweep now" }).click(),
  ]);
  await page.waitForLoadState("networkidle");
  const runs = await prisma.retentionRun.count({
    where: {
      triggeredByClerkUserId: adminUserId,
    },
  });
  if (runs < 1) {
    throw new Error("Retention sweep did not record a run.");
  }

  await page.getByLabel("Allow owners to permanently delete their own surveys").check();
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/admin/settings") &&
        response.request().method() === "PATCH" &&
        response.ok(),
      { timeout: 30000 },
    ),
    page.getByRole("button", { name: "Save policy" }).click(),
  ]);
  await page.waitForLoadState("networkidle");
  const policy = await prisma.retentionPolicy.findUnique({
    where: { key: "GLOBAL_DEFAULT" },
    select: { allowOwnerDelete: true },
  });
  if (!policy?.allowOwnerDelete) {
    throw new Error("Owner delete was not enabled in the retention policy.");
  }
}

async function deleteSurveyViaOwnerControl(page, surveyId) {
  log("survey", "deleting through owner control");
  await page.goto(`${BASE_URL}/survey/${surveyId}`, { waitUntil: "networkidle" });
  await waitForVisible(page.getByRole("button", { name: "Delete survey" }));
  const result = await page.evaluate(async (id) => {
    const response = await fetch(`/api/surveys/${id}`, {
      method: "DELETE",
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await response.json().catch(() => null),
    };
  }, surveyId);

  if (!result.ok) {
    throw new Error(`Owner delete failed with status ${result.status}: ${result.body?.error || "unknown error"}`);
  }

  await page.goto(`${BASE_URL}/survey/list`, { waitUntil: "networkidle" });
}

async function main() {
  const prisma = new PrismaClient();
  const client = await clerkClient();
  const initialPolicy = await prisma.retentionPolicy.findUnique({
    where: {
      key: "GLOBAL_DEFAULT",
    },
  }).catch(() => null);
  const email = `qa+${Date.now()}@example.com`;
  const surveyTitle = `E2E Volumetric Smoke ${Date.now()}`;
  const testPassword = `Smoke!${crypto.randomBytes(12).toString("base64url")}9a#`;
  const user = await client.users.createUser({
    emailAddress: [email],
    password: testPassword,
    skipPasswordChecks: true,
    skipPasswordRequirement: false,
  });
  const signInToken = await client.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 600,
  });

  let browser;
  let context;
  let page;
  let surveyId;

  try {
    await prisma.appRoleAssignment.upsert({
      where: {
        clerkUserId: user.id,
      },
      update: {
        role: "ADMIN",
        note: "E2E smoke admin user",
      },
      create: {
        clerkUserId: user.id,
        role: "ADMIN",
        note: "E2E smoke admin user",
      },
    });

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ acceptDownloads: true });
    page = await context.newPage();
    page.setDefaultTimeout(20000);

    await signIn(page, signInToken.token);
    surveyId = await createSurvey(page, surveyTitle);
    const uploadedRoomName = await uploadRoomMedia(page, surveyId);
    await saveRoomNotes(page, surveyId, uploadedRoomName);
    await markRoomComplete(page, surveyId, uploadedRoomName);
    await runAiPrep(page, surveyId);
    await verifySummaryAndExport(page, surveyId, surveyTitle);
    await verifyShareAndUnlock(page, context, surveyId, surveyTitle);
    await verifyOpsAdminAndRetention(page, surveyId, surveyTitle, email, user.id, prisma);
    await deleteSurveyViaOwnerControl(page, surveyId);
    surveyId = null;

    console.log(
      JSON.stringify(
        {
          ok: true,
          email,
          surveyTitle,
          surveyId,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    if (page) {
      const screenshotPath = path.join(process.cwd(), "tmp", `e2e-failure-${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);
      console.error(`[smoke] screenshot: ${screenshotPath}`);
    }

    throw error;
  } finally {
    await context?.close().catch(() => undefined);
    await browser?.close().catch(() => undefined);
    if (surveyId) {
      await prisma.survey.delete({ where: { id: surveyId } }).catch(() => undefined);
    }
    if (initialPolicy) {
      await prisma.retentionPolicy
        .update({
          where: {
            id: initialPolicy.id,
          },
          data: {
            activeSurveyArchiveDays: initialPolicy.activeSurveyArchiveDays,
            archivedSurveyPurgeDays: initialPolicy.archivedSurveyPurgeDays,
            mediaRetentionDays: initialPolicy.mediaRetentionDays,
            auditRetentionDays: initialPolicy.auditRetentionDays,
            purgeEnabled: initialPolicy.purgeEnabled,
            allowOwnerDelete: initialPolicy.allowOwnerDelete,
            updatedByClerkUserId: initialPolicy.updatedByClerkUserId,
          },
        })
        .catch(() => undefined);
    } else {
      await prisma.retentionRun
        .deleteMany({
          where: {
            triggeredByClerkUserId: user.id,
          },
        })
        .catch(() => undefined);
      await prisma.retentionPolicy
        .deleteMany({
          where: {
            key: "GLOBAL_DEFAULT",
          },
        })
        .catch(() => undefined);
    }
    await prisma.appRoleAssignment.deleteMany({ where: { clerkUserId: user.id } }).catch(() => undefined);
    await client.users.deleteUser(user.id).catch(() => undefined);
    await prisma.$disconnect().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
