const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { PrismaClient } = require("@prisma/client");
const { clerkClient } = require("@clerk/nextjs/server");
const { clerkSetup, setupClerkTestingToken } = require("@clerk/testing/playwright");
const Stripe = require("stripe");
const { chromium } = require("/opt/homebrew/lib/node_modules/@playwright/mcp/node_modules/playwright");

const execFileAsync = promisify(execFile);
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SIGNED_OUT_URL = `${BASE_URL}/signed-out`;
const JOB_RUNNER_SECRET = process.env.JOB_RUNNER_SECRET;
const ROOM_NOTES = "Sofa is heavy, narrow stairs, lamp is fragile.";
const UPLOAD_PATH = path.join(process.cwd(), "tmp", "qa-upload.png");
const VISION_PROBE_PATH = path.join(process.cwd(), "tmp", "e2e-failure-1776577081487.png");
const RETENTION_REASON = "VIP relocation flagged for manual handling.";

function log(step, detail) {
  console.log(`[platform] ${step}${detail ? `: ${detail}` : ""}`);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const prisma = new PrismaClient();
  const client = await clerkClient();
  const startAt = new Date();
  const ownerEmail = `qa-owner+clerk_test_${Date.now()}@example.com`;
  const moverEmail = `qa-mover+clerk_test_${Date.now()}@example.com`;
  const ownerPassword = `Owner!${crypto.randomBytes(10).toString("base64url")}9a#`;
  const moverPassword = `Mover!${crypto.randomBytes(10).toString("base64url")}9a#`;
  const surveyTitle = `Platform E2E ${Date.now()}`;
  const companyName = `Acme Movers ${Date.now()}`;
  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

  let browser;
  let ownerContext;
  let moverContext;
  let ownerPage;
  let moverPage;
  let ownerUser;
  let moverUser;
  let surveyId = null;
  let companyId = null;
  let stripeCustomerId = null;
  let stripeSubscriptionId = null;
  let initialPolicy = null;

  try {
    await clerkSetup({ dotenv: false });

    initialPolicy = await prisma.retentionPolicy.findUnique({
      where: { key: "GLOBAL_DEFAULT" },
    }).catch(() => null);

    ownerUser = await client.users.createUser({
      emailAddress: [ownerEmail],
      password: ownerPassword,
      skipPasswordChecks: true,
      skipPasswordRequirement: false,
    });
    moverUser = await client.users.createUser({
      emailAddress: [moverEmail],
      password: moverPassword,
      skipPasswordChecks: true,
      skipPasswordRequirement: false,
    });

    await prisma.appRoleAssignment.upsert({
      where: {
        clerkUserId: ownerUser.id,
      },
      update: {
        role: "ADMIN",
        note: "Platform E2E owner admin",
      },
      create: {
        clerkUserId: ownerUser.id,
        role: "ADMIN",
        note: "Platform E2E owner admin",
      },
    });

    await verifyVisionAnalyzer();

    browser = await chromium.launch({ headless: true });
    ownerContext = await browser.newContext({ acceptDownloads: true });
    moverContext = await browser.newContext({ acceptDownloads: true });
    ownerPage = await ownerContext.newPage();
    moverPage = await moverContext.newPage();
    ownerPage.setDefaultTimeout(30000);
    moverPage.setDefaultTimeout(30000);

    await signInWithUi(ownerPage, ownerEmail, ownerPassword, "/survey");
    surveyId = await createSurvey(ownerPage, surveyTitle);
    const uploadedRoomName = await uploadRoomMedia(ownerPage, surveyId);
    await saveRoomNotes(ownerPage, prisma, surveyId, uploadedRoomName);
    await markRoomComplete(ownerPage, surveyId, uploadedRoomName);
    await verifyLocalMirrorCreated(prisma, surveyId);
    await syncAiAndWaitForWorker(ownerPage, surveyId);
    await verifySummaryAndExports(ownerPage, surveyId, surveyTitle);
    const shareUrl = await createInviteAndShareLink(ownerPage, surveyId, moverEmail, companyName);

    await signInWithUi(moverPage, moverEmail, moverPassword, "/mover");
    companyId = await createMoverCompanyAndSubscribe(moverPage, prisma, moverUser.id, companyName);
    ({ stripeCustomerId, stripeSubscriptionId } = await verifyCompanyBillingState(prisma, companyId));
    ({ context: moverContext, page: moverPage } = await restartSession(browser, moverContext, moverEmail, moverPassword, "/mover"));
    await verifyBillingPortalProgrammatically(stripe, stripeCustomerId);
    await unlockSharedSurveyWithCompanyCredit(moverPage, shareUrl, surveyTitle);
    await verifyCompanyCreditConsumption(prisma, companyId, surveyId, moverEmail);
    await verifyOwnerUnlockView(ownerPage, surveyId);
    await verifyOpsAndInternalJobs(ownerPage, prisma, surveyId, surveyTitle, ownerEmail, ownerUser.id);
    await deleteSurveyViaOwnerControl(ownerPage, surveyId);
    surveyId = null;

    console.log(
      JSON.stringify(
        {
          ok: true,
          ownerEmail,
          moverEmail,
          companyId,
          stripeCustomerId,
          stripeSubscriptionId,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    if (ownerPage) {
      const screenshotPath = path.join(process.cwd(), "tmp", `platform-owner-failure-${Date.now()}.png`);
      await ownerPage.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);
      console.error(`[platform] owner screenshot: ${screenshotPath}`);
    }
    if (moverPage) {
      const screenshotPath = path.join(process.cwd(), "tmp", `platform-mover-failure-${Date.now()}.png`);
      await moverPage.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);
      console.error(`[platform] mover screenshot: ${screenshotPath}`);
    }

    throw error;
  } finally {
    await ownerPage?.goto(SIGNED_OUT_URL, { waitUntil: "networkidle" }).catch(() => undefined);
    await moverPage?.goto(SIGNED_OUT_URL, { waitUntil: "networkidle" }).catch(() => undefined);
    await wait(500);

    await ownerContext?.close().catch(() => undefined);
    await moverContext?.close().catch(() => undefined);
    await browser?.close().catch(() => undefined);

    if (ownerUser) {
      await revokeUserSessions(client, ownerUser.id).catch(() => undefined);
    }
    if (moverUser) {
      await revokeUserSessions(client, moverUser.id).catch(() => undefined);
    }
    await wait(750);

    if (stripe && stripeSubscriptionId) {
      await stripe.subscriptions.cancel(stripeSubscriptionId).catch(() => undefined);
    }
    if (stripe && stripeCustomerId) {
      await stripe.customers.del(stripeCustomerId).catch(() => undefined);
    }

    if (surveyId) {
      await prisma.survey.delete({ where: { id: surveyId } }).catch(() => undefined);
    }
    if (companyId) {
      await prisma.company.delete({ where: { id: companyId } }).catch(() => undefined);
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
    }

    await prisma.providerWebhookEvent
      .deleteMany({
        where: {
          createdAt: {
            gte: startAt,
          },
        },
      })
      .catch(() => undefined);
    await prisma.backgroundJobRun
      .deleteMany({
        where: {
          createdAt: {
            gte: startAt,
          },
        },
      })
      .catch(() => undefined);
    await prisma.retentionRun
      .deleteMany({
        where: {
          createdAt: {
            gte: startAt,
          },
        },
      })
      .catch(() => undefined);

    if (ownerUser) {
      await prisma.appRoleAssignment.deleteMany({ where: { clerkUserId: ownerUser.id } }).catch(() => undefined);
      await wait(500);
      await client.users.deleteUser(ownerUser.id).catch(() => undefined);
    }
    if (moverUser) {
      await wait(500);
      await client.users.deleteUser(moverUser.id).catch(() => undefined);
    }

    await prisma.$disconnect().catch(() => undefined);
  }
}

async function verifyVisionAnalyzer() {
  log("vision", "probing Apple Vision analyzer");
  const binaryPath = path.join(process.cwd(), "node_modules", ".cache", "consumer-first-moving-survey", "vision-analyzer");
  const sourcePath = path.join(process.cwd(), "scripts", "vision-analyzer.swift");
  try {
    await fs.access(binaryPath);
  } catch {
    await fs.mkdir(path.dirname(binaryPath), { recursive: true });
    await execFileAsync("swiftc", ["-O", "-o", binaryPath, sourcePath]);
  }
  const { stdout } = await execFileAsync(binaryPath, ["--file", VISION_PROBE_PATH, "--kind", "IMAGE"]);
  const analysis = JSON.parse(stdout);
  const labels = analysis.classifications.map((entry) => entry.identifier);
  if (!labels.includes("document") || !labels.includes("screenshot")) {
    throw new Error("Apple Vision analyzer did not return the expected screenshot/document classifications.");
  }
}

async function signInWithUi(page, email, password, redirectPath) {
  await setupClerkTestingToken({ page });
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: "domcontentloaded" });
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForURL(/\/sign-in\/factor-two/, { timeout: 30000 });
  await completeSignInSecondFactor(page);
  await page.goto(`${BASE_URL}${redirectPath}`, { waitUntil: "networkidle" });
}

async function restartSession(browser, existingContext, email, password, redirectPath) {
  await existingContext?.close().catch(() => undefined);

  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  await signInWithUi(page, email, password, redirectPath);

  return { context, page };
}

async function revokeUserSessions(client, userId) {
  const sessions = await client.sessions
    .getSessionList({
      userId,
      status: "active",
      limit: 100,
    })
    .catch(() => ({ data: [] }));

  for (const session of sessions.data || []) {
    await client.sessions.revokeSession(session.id).catch(() => undefined);
  }
}

async function completeSignInSecondFactor(page) {
  const result = await page.evaluate(async () => {
    const signIn = window.Clerk?.client?.signIn;

    if (!signIn) {
      return { ok: false, reason: "Clerk sign-in object is unavailable." };
    }

    await signIn.prepareSecondFactor({ strategy: "email_code" });
    const attempt = await signIn.attemptSecondFactor({ strategy: "email_code", code: "424242" });

    if (attempt.status === "complete") {
      await window.Clerk.setActive({ session: attempt.createdSessionId });
    }

    return {
      ok: attempt.status === "complete",
      status: attempt.status,
      createdSessionId: attempt.createdSessionId ?? null,
    };
  });

  if (!result?.ok) {
    throw new Error(
      `Sign-in second factor did not complete${result?.status ? ` (status: ${result.status})` : ""}${
        result?.reason ? `: ${result.reason}` : "."
      }`,
    );
  }

  await page.waitForFunction(() => window.Clerk?.user !== null, { timeout: 30000 });
}

async function createSurvey(page, title) {
  log("owner", "creating survey");
  await waitForVisible(page.locator('input[name="title"]'));
  await page.locator('input[name="title"]').fill(title);
  await page.locator('select[name="propertyType"]').selectOption("House");
  await page.locator('input[name="originPostcode"]').fill("EC1A 1BB");
  await page.locator('input[name="destinationPostcode"]').fill("BS1 5AH");
  await page.locator('input[name="moveWindow"]').fill("Early July");
  await page.locator('textarea[name="notes"]').fill("Platform end-to-end validation.");

  await Promise.all([
    page.waitForURL((url) => /^\/survey\/[^/]+$/.test(url.pathname), { timeout: 30000 }),
    page.getByRole("button", { name: "Create survey draft" }).click(),
  ]);

  const match = page.url().match(/\/survey\/([^/?#]+)/);
  if (!match) {
    throw new Error(`Unable to parse survey id from ${page.url()}`);
  }

  return match[1];
}

async function uploadRoomMedia(page, surveyId) {
  log("owner", "uploading room media");
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

  await waitForText(page, "qa-upload.png", 30000);
  return uploadedRoomName;
}

async function saveRoomNotes(page, prisma, surveyId, uploadedRoomName) {
  log("owner", "saving room notes");
  const targetCard = roomCard(page, uploadedRoomName);
  const notesField = targetCard.getByPlaceholder(
    "Add packing instructions, access notes, fragile items, or missing details for this room.",
  );

  await notesField.fill(ROOM_NOTES);
  const saveButton = targetCard.getByRole("button", { name: "Save notes" });
  await saveButton.scrollIntoViewIfNeeded();
  await saveButton.click();

  let persistedRoom = null;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    persistedRoom = await prisma.surveyRoom.findFirst({
      where: {
        surveyId,
        name: uploadedRoomName,
      },
      select: {
        notes: true,
      },
    });

    if (persistedRoom?.notes === ROOM_NOTES) {
      break;
    }

    await wait(500);
  }

  if (persistedRoom?.notes !== ROOM_NOTES) {
    throw new Error(`Room notes were not persisted to the database for ${uploadedRoomName}.`);
  }

  await page.reload({ waitUntil: "networkidle" });
  const reloadedNotesField = roomCard(page, uploadedRoomName).getByPlaceholder(
    "Add packing instructions, access notes, fragile items, or missing details for this room.",
  );
  let persistedNotes = "";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    persistedNotes = await reloadedNotesField.inputValue();
    if (persistedNotes === ROOM_NOTES) {
      break;
    }
    await wait(300);
  }

  if (persistedNotes !== ROOM_NOTES) {
    throw new Error(`Room notes did not persist for ${uploadedRoomName}.`);
  }
}

async function markRoomComplete(page, surveyId, uploadedRoomName) {
  log("owner", "marking room complete");
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
}

async function verifyLocalMirrorCreated(prisma, surveyId) {
  const media = await prisma.surveyMedia.findFirst({
    where: {
      surveyRoom: {
        surveyId,
      },
    },
  });
  if (!media) {
    throw new Error("Uploaded media record was not found in Prisma.");
  }
  const mirrorPath = path.join(process.cwd(), ".data", "media-cache", media.storageKey);
  await fs.access(mirrorPath);
}

async function syncAiAndWaitForWorker(page, surveyId) {
  log("extraction", "syncing jobs and waiting for async worker");
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

  await waitForText(page, "PENDING", 30000);

  for (let attempt = 0; attempt < 15; attempt += 1) {
    await page.reload({ waitUntil: "networkidle" });
    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("COMPLETE") && bodyText.includes("Sofa") && bodyText.includes(`Declared note: ${ROOM_NOTES}`)) {
      return;
    }
    await page.waitForTimeout(2500);
  }

  throw new Error("Async extraction worker did not complete the queued job.");
}

async function verifySummaryAndExports(page, surveyId, surveyTitle) {
  log("owner", "verifying summary, export, and print package");
  await page.goto(`${BASE_URL}/survey/${surveyId}/summary`, { waitUntil: "networkidle" });
  await waitForText(page, "Quote-ready survey summary", 30000);
  await waitForText(page, "Sofa", 30000);
  await waitForText(page, ROOM_NOTES, 30000);

  const jsonPath = path.join(process.cwd(), "tmp", `platform-export-${Date.now()}.json`);
  const [jsonDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 30000 }),
    page.getByRole("button", { name: "Download JSON" }).click(),
  ]);
  await jsonDownload.saveAs(jsonPath);
  const exported = JSON.parse(await fs.readFile(jsonPath, "utf8"));
  await fs.unlink(jsonPath).catch(() => undefined);
  if (exported.surveyPackage?.surveyTitle !== surveyTitle) {
    throw new Error("Summary export did not contain the expected survey title.");
  }

  await page.goto(`${BASE_URL}/survey/${surveyId}/print`, { waitUntil: "networkidle" });
  await waitForText(page, "Print / Save as PDF", 30000);
}

async function createInviteAndShareLink(page, surveyId, moverEmail, companyName) {
  log("owner", "creating mover invite and share link");
  await page.goto(`${BASE_URL}/survey/${surveyId}/summary`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("mover@company.com").fill(moverEmail);
  await page.getByPlaceholder("Company name").fill(companyName);

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

  await waitForText(page, moverEmail, 30000);

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/surveys/${surveyId}/share`) &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30000 },
    ),
    page.getByRole("button", { name: /Create share link|Regenerate link/ }).click(),
  ]);

  const shareText = await page.locator("body").innerText();
  const shareUrlMatch = shareText.match(new RegExp(`${escapeRegExp(BASE_URL)}/shared/[A-Za-z0-9_-]+`));
  if (!shareUrlMatch) {
    throw new Error("Share link was not rendered on the summary page.");
  }

  return shareUrlMatch[0];
}

async function createMoverCompanyAndSubscribe(page, prisma, moverUserId, companyName) {
  log("mover", "creating company profile");
  await page.goto(`${BASE_URL}/mover`, { waitUntil: "networkidle" });
  if (await page.getByRole("heading", { name: "Create mover company" }).count()) {
    await page.getByPlaceholder("Acme Moving & Storage").fill(companyName);
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/mover/company") &&
          response.request().method() === "POST" &&
          response.ok(),
        { timeout: 30000 },
      ),
      page.getByRole("button", { name: "Create company" }).click(),
    ]);
    await page.waitForURL(new RegExp(`${escapeRegExp(BASE_URL)}/mover(?:\\?.*)?$`), {
      timeout: 30000,
    }).catch(() => undefined);
    await page.waitForLoadState("networkidle").catch(() => undefined);
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const membership = await prisma.companyMembership.findFirst({
      where: {
        clerkUserId: moverUserId,
      },
    });
    if (membership) {
      await page.goto(`${BASE_URL}/mover`, { waitUntil: "networkidle" });
      break;
    }
    await page.waitForTimeout(1000);
  }

  const membership = await prisma.companyMembership.findFirst({
    where: {
      clerkUserId: moverUserId,
    },
  });
  if (!membership) {
    throw new Error("Mover company membership was not created.");
  }

  log("mover", "starting subscription checkout");
  await Promise.all([
    page.waitForURL(/checkout\.stripe\.com/, { timeout: 60000 }),
    page.getByRole("button", { name: /Activate mover team plan|Top up or switch plan/ }).click(),
  ]);

  await fillStripeCheckout(page);
  await page.waitForURL(new RegExp(`${escapeRegExp(BASE_URL)}/mover\\?subscription=success`), {
    timeout: 60000,
  });
  await page.goto(`${BASE_URL}/mover`, { waitUntil: "networkidle" });
  await wait(500);

  return membership.companyId;
}

async function fillStripeCheckout(page) {
  await page.waitForSelector('input[name="cardNumber"]', { timeout: 30000 });
  await page.locator('input[name="cardNumber"]').fill("4242424242424242");
  await page.locator('input[name="cardExpiry"]').fill("1234");
  await page.locator('input[name="cardCvc"]').fill("123");
  await page.locator('input[name="billingName"]').fill("Stripe Test Payer");
  await page.locator('select[name="billingCountry"]').selectOption({ value: "GB" }).catch(async () => {
    await page.locator('select[name="billingCountry"]').selectOption({ label: "United Kingdom" });
  });

  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.locator('button[type="submit"]').click(),
  ]);
}

async function verifyCompanyBillingState(prisma, companyId) {
  log("billing", "verifying subscription, credits, and webhook state");
  let company = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
      },
    });

    if (company?.subscriptionStatus === "ACTIVE" && company.includedUnlockCredits === 10) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  if (!company || company.subscriptionStatus !== "ACTIVE" || company.includedUnlockCredits !== 10) {
    throw new Error("Company subscription did not activate with the expected included unlock credits.");
  }

  const subscription = company.subscriptions.find((entry) => entry.status === "ACTIVE");
  if (!subscription?.stripeSubscriptionId) {
    throw new Error("BillingSubscription did not persist an active Stripe subscription id.");
  }

  const webhookEvents = await prisma.providerWebhookEvent.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 10 * 60 * 1000),
      },
    },
  });
  const eventTypes = webhookEvents.map((event) => event.eventType);
  if (!eventTypes.includes("invoice.paid") || !eventTypes.includes("checkout.session.completed")) {
    throw new Error("Expected Stripe webhook events were not recorded.");
  }

  return {
    stripeCustomerId: company.stripeCustomerId,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
  };
}

async function verifyBillingPortalProgrammatically(stripe, stripeCustomerId) {
  log("billing", "verifying billing portal link");
  if (!stripe || !process.env.APP_BASE_URL || !stripeCustomerId) {
    throw new Error("Stripe portal verification requires STRIPE_SECRET_KEY and APP_BASE_URL.");
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.APP_BASE_URL}/billing-return?state=portal`,
  });

  if (!portal?.url || !/billing\.stripe\.com/.test(portal.url)) {
    throw new Error("Programmatic billing portal session did not return a Stripe billing portal URL.");
  }
}

async function unlockSharedSurveyWithCompanyCredit(page, shareUrl, surveyTitle) {
  log("mover", "unlocking shared survey with company credit");
  await page.goto(shareUrl, { waitUntil: "networkidle" });
  await waitForText(page, surveyTitle, 30000);
  await waitForText(page, "Preview before unlock", 30000);
  await waitForText(page, "Use company credit", 30000);

  const preUnlockText = await page.locator("body").innerText();
  if (preUnlockText.includes(ROOM_NOTES)) {
    throw new Error("Shared preview exposed room notes before company unlock.");
  }

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/shared/") &&
        response.url().endsWith("/unlock") &&
        response.request().method() === "POST" &&
        response.ok(),
      { timeout: 30000 },
    ),
    page.getByRole("button", { name: /Use company credit/ }).click(),
  ]);

  await page.waitForLoadState("networkidle");
  await waitForText(page, "Unlocked mover review", 30000);
  await waitForText(page, ROOM_NOTES, 30000);
}

async function verifyCompanyCreditConsumption(prisma, companyId, surveyId, moverEmail) {
  log("billing", "verifying company credit consumption");
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    const unlock = await prisma.moverUnlock.findFirst({
      where: {
        surveyId,
        moverEmail,
      },
      include: {
        accessEntitlement: true,
        unlockCharges: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (
      company?.includedUnlockCredits === 9 &&
      unlock?.status === "UNLOCKED" &&
      unlock.unlockCharges[0]?.provider === "COMPANY_CREDIT" &&
      unlock.accessEntitlement?.status === "ACTIVE"
    ) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Company credit unlock state did not persist as expected.");
}

async function verifyOwnerUnlockView(page, surveyId) {
  log("owner", "verifying owner-side company unlock state");
  await page.goto(`${BASE_URL}/survey/${surveyId}/summary`, { waitUntil: "networkidle" });
  await waitForText(page, "UNLOCKED", 30000);
  await waitForText(page, "COMPANY_CREDIT PAID", 30000);
  await waitForText(page, "Access active", 30000);
}

async function verifyOpsAndInternalJobs(page, prisma, surveyId, surveyTitle, ownerEmail, ownerUserId) {
  log("ops", "verifying internal jobs, ops review, retention, and health");

  if (!JOB_RUNNER_SECRET) {
    throw new Error("JOB_RUNNER_SECRET must be available for internal route verification.");
  }

  const extractionResponse = await fetch(`${BASE_URL}/api/internal/jobs/extraction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-job-secret": JOB_RUNNER_SECRET,
    },
    body: JSON.stringify({ limit: 5 }),
  });
  if (!extractionResponse.ok) {
    throw new Error("Internal extraction job route returned a non-200 response.");
  }

  const retentionResponse = await fetch(`${BASE_URL}/api/internal/jobs/retention`, {
    method: "POST",
    headers: {
      "x-job-secret": JOB_RUNNER_SECRET,
    },
  });
  if (!retentionResponse.ok) {
    throw new Error("Internal retention job route returned a non-200 response.");
  }
  const retentionBody = await retentionResponse.json();
  if (!retentionBody?.run?.id) {
    throw new Error("Internal retention job route did not return a run id.");
  }

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
  await waitForText(page, "EXEMPT", 30000);
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

  await page.goto(`${BASE_URL}/ops/settings`, { waitUntil: "networkidle" });
  await waitForText(page, "Roles, policy, and retention runs", 30000);
  await waitForText(page, ownerEmail, 30000);

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

  await page.goto(`${BASE_URL}/ops/health`, { waitUntil: "networkidle" });
  await waitForText(page, "System health and background jobs", 30000);
  await waitForText(page, "Recent webhook events", 30000);
  await waitForText(page, "Latest retention sweep", 30000);

  const systemRuns = await prisma.retentionRun.count({
    where: {
      triggeredByClerkUserId: "system_scheduler",
    },
  });
  if (systemRuns < 1) {
    throw new Error("System retention route did not persist a retention run.");
  }

  const failedWebhooks = await prisma.providerWebhookEvent.count({
    where: {
      status: "FAILED",
    },
  });
  if (failedWebhooks !== 0) {
    throw new Error("At least one provider webhook event failed during the platform smoke.");
  }

  const processedWorkerRuns = await prisma.backgroundJobRun.count({
    where: {
      processedCount: {
        gt: 0,
      },
    },
  });
  if (processedWorkerRuns < 1) {
    throw new Error("No successful extraction worker runs were recorded.");
  }
}

async function deleteSurveyViaOwnerControl(page, surveyId) {
  log("owner", "deleting survey via owner control");
  await page.goto(`${BASE_URL}/survey/${surveyId}`, { waitUntil: "networkidle" });
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
