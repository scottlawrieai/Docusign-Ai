// Browser testing script using Playwright
// Install Playwright: npm install -D @playwright/test
// Run with: npx playwright test browser-testing.js

import { test, expect } from "@playwright/test";

// Replace with your actual deployed URL
const APP_URL = "https://your-app-url.com";

// Test user credentials - use a test account
const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "password123";

test.describe("DocuSign Clone E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
  });

  test("Login flow", async ({ page }) => {
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);

    // Fill login form
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after login
    await expect(page).toHaveURL(/.*dashboard/);

    // Dashboard should show user email
    await expect(page.locator("text=" + TEST_EMAIL)).toBeVisible();
  });

  test("Document upload", async ({ page }) => {
    // Login first
    await page.goto(APP_URL + "/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Click upload button
    await page.click("text=Upload");

    // Upload dialog should appear
    await expect(page.locator("text=Upload Document")).toBeVisible();

    // Upload a test PDF file
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.click("text=Select File");
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles("./test-files/sample.pdf");

    // Click upload and continue
    await page.click("text=Upload and Continue");

    // Should navigate to document editor
    await expect(page).toHaveURL(/.*document\//);
  });

  test("Add signature field", async ({ page }) => {
    // Login and navigate to a document
    await page.goto(APP_URL + "/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Click on first document
    await page.click(".document-card >> nth=0");

    // Should be in edit mode by default
    await expect(page.locator("text=Edit")).toHaveClass(/active/);

    // Click on document to add signature field
    await page.click(".document-container", { position: { x: 400, y: 300 } });

    // Signature field should appear
    await expect(page.locator(".signature-field")).toBeVisible();

    // Save document
    await page.click("text=Save");

    // Should show success message
    await expect(page.locator("text=Document saved")).toBeVisible();
  });

  test("Share document", async ({ page }) => {
    // Login and navigate to a document
    await page.goto(APP_URL + "/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Click on first document
    await page.click(".document-card >> nth=0");

    // Click send for signature
    await page.click("text=Send for Signature");

    // Share dialog should appear
    await expect(page.locator("text=Share for Signature")).toBeVisible();

    // Add recipient
    await page.fill(
      'input[placeholder="Email address"]',
      "recipient@example.com",
    );

    // Click send
    await page.click("text=Send for Signature >> button");

    // Should show success message
    await expect(page.locator("text=Signature Requests Sent")).toBeVisible();
  });
});
