const crypto = require("node:crypto");
const path = require("node:path");
const { clerkClient } = require("@clerk/nextjs/server");
const { clerkSetup, setupClerkTestingToken } = require("@clerk/testing/playwright");
const { chromium } = require("/opt/homebrew/lib/node_modules/@playwright/mcp/node_modules/playwright");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SIGNED_OUT_URL = `${BASE_URL}/signed-out`;

function log(step, detail) {
  console.log(`[auth-ui] ${step}${detail ? `: ${detail}` : ""}`);
}

async function main() {
  const client = await clerkClient();
  const createdEmails = new Set();
  let browser;

  await clerkSetup({ dotenv: false });

  try {
    browser = await chromium.launch({ headless: true });

    await verifyUiSignUp(browser, createdEmails);
    await verifyUiSignIn(browser, client, createdEmails);

    console.log(JSON.stringify({ ok: true }, null, 2));
  } catch (error) {
    throw error;
  } finally {
    await browser?.close().catch(() => undefined);
    await cleanupUsers(client, createdEmails);
  }
}

async function verifyUiSignUp(browser, createdEmails) {
  const email = `ui-signup+clerk_test_${Date.now()}@example.com`;
  const password = `SignUp!${crypto.randomBytes(8).toString("base64url")}9a#`;
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  createdEmails.add(email);

  try {
    log("sign-up", "loading Clerk sign-up");
    await setupClerkTestingToken({ page });
    await page.goto(`${BASE_URL}/sign-up`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".cl-signUp-root", { state: "attached" });

    const firstNameInput = page.locator("input[name=firstName]");
    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill("UI");
    }

    const lastNameInput = page.locator("input[name=lastName]");
    if (await lastNameInput.isVisible()) {
      await lastNameInput.fill("Auth");
    }

    const usernameInput = page.locator("input[name=username]");
    if (await usernameInput.isVisible()) {
      await usernameInput.fill(`uiauth${Date.now()}`);
    }

    const phoneInput = page.locator("input[name=phoneNumber]");
    if (await phoneInput.isVisible()) {
      await phoneInput.fill("+12015550100");
    }

    const legalCheckbox = page.locator("input[name=legalAccepted]");
    if (await legalCheckbox.isVisible()) {
      await legalCheckbox.check();
    }

    await page.locator("input[name=emailAddress]").fill(email);
    await page.locator("input[name=password]").fill(password);

    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes("prepare_verification") && response.status() === 200,
        { timeout: 30000 },
      ),
      page.getByRole("button", { name: "Continue", exact: true }).click(),
    ]);

    await completeOtpVerification(page, "/sign-up");
    await page.goto(`${BASE_URL}/survey`, { waitUntil: "networkidle" });
    await assertSurveyLanding(page, "sign-up");
  } catch (error) {
    await writeFailureArtifact(page, "sign-up");
    throw error;
  } finally {
    await signOutPage(page).catch(() => undefined);
    await context.close().catch(() => undefined);
  }
}

async function verifyUiSignIn(browser, client, createdEmails) {
  const email = `ui-signin+clerk_test_${Date.now()}@example.com`;
  const password = `SignIn!${crypto.randomBytes(8).toString("base64url")}9a#`;
  createdEmails.add(email);

  const user = await client.users.createUser({
    emailAddress: [email],
    password,
    skipPasswordChecks: true,
    skipPasswordRequirement: false,
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    log("sign-in", "loading Clerk sign-in");
    await setupClerkTestingToken({ page });
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: "domcontentloaded" });
    await page.getByLabel(/email address/i).fill(email);
    await page.getByLabel(/^password$/i).fill(password);

    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForURL(/\/sign-in\/factor-two/, { timeout: 30000 });
    await completeSignInSecondFactor(page);

    await page.goto(`${BASE_URL}/survey`, { waitUntil: "networkidle" });
    await assertSurveyLanding(page, "sign-in");
  } catch (error) {
    await writeFailureArtifact(page, "sign-in");
    throw error;
  } finally {
    await signOutPage(page).catch(() => undefined);
    await context.close().catch(() => undefined);
  }
}

async function completeOtpVerification(page, routePrefix) {
  const otpInput = page.getByRole("textbox", { name: "Enter verification code" });
  await otpInput.click();
  await otpInput.fill("424242");

  const continueButton = page.getByRole("button", { name: "Continue", exact: true });
  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click().catch(() => undefined);
  }

  await page.waitForURL((url) => !url.pathname.startsWith(routePrefix), { timeout: 30000 });
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

async function assertSurveyLanding(page, flowLabel) {
  const bodyText = await page.locator("body").innerText();
  if (!bodyText.includes("Create the survey draft")) {
    throw new Error(`${flowLabel} flow did not land on the authenticated survey page.`);
  }
}

async function cleanupUsers(client, createdEmails) {
  for (const email of createdEmails) {
    const users = await client.users.getUserList({ emailAddress: [email] }).catch(() => ({ data: [] }));
    for (const user of users.data || []) {
      await revokeUserSessions(client, user.id);
      await wait(500);
      await client.users.deleteUser(user.id).catch(() => undefined);
    }
  }
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

async function signOutPage(page) {
  if (!page || page.isClosed()) {
    return;
  }

  await page.goto(SIGNED_OUT_URL, { waitUntil: "domcontentloaded" }).catch(() => undefined);
  await page
    .waitForFunction(() => window.Clerk !== undefined && window.Clerk.loaded === true, { timeout: 10000 })
    .catch(() => undefined);
  await page
    .evaluate(async (redirectUrl) => {
      if (window.Clerk) {
        await window.Clerk.signOut({ redirectUrl });
      }
    }, SIGNED_OUT_URL)
    .catch(() => undefined);
  await page.waitForURL(/\/signed-out/, { timeout: 15000 }).catch(() => undefined);
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.context().clearCookies().catch(() => undefined);
  await wait(500);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeFailureArtifact(page, label) {
  const screenshotPath = path.join(process.cwd(), "tmp", `auth-ui-${label}-failure-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);
  console.error(`[auth-ui] ${label} screenshot: ${screenshotPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
