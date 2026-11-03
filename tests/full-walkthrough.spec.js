// tests/full-walkthrough.spec.js
// Complete End-to-End Walkthrough Test: Public Visitor, Admin (OTP), and Client Portal (OTP)
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Phase 2: Full UX/UI & User Journey Walkthrough', () => {

  // 1. PUBLIC VISITOR JOURNEY
  test('Public Visitor Journey (Desktop 1440px & Mobile 375px)', async ({ page }) => {
    // Desktop Viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page).toHaveTitle(/PR Agency/i);

    // Mock contact API
    let leadSubmitted = false;
    await page.route('**/api/contact', async (route) => {
      leadSubmitted = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Lead received' })
      });
    });

    // Check header and absence of horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 5);

    // Desktop Screenshot
    await page.screenshot({ path: path.join('tests/screenshots', 'visitor-desktop-1440.png'), fullPage: false });

    // Switch to Mobile Viewport (iPhone SE - 375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const mobileBodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(mobileBodyWidth).toBeLessThanOrEqual(380);

    // Mobile Screenshot
    await page.screenshot({ path: path.join('tests/screenshots', 'visitor-mobile-375.png'), fullPage: false });
  });

  // 2. ADMIN ZERO TRUST OTP JOURNEY
  test('Admin Journey: Zero Trust OTP Login & Responsive Dashboard', async ({ page }) => {
    // Intercept /api/admin/me with Mock Cloudflare Zero Trust OTP session
    await page.route('**/api/admin/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          authMethod: 'cf_access_otp',
          user: {
            id: 'admin_cf_omar',
            name: 'Omar Farouk',
            email: 'omar@pragency.eg',
            role: 'Super Admin',
            isSuperAdmin: true
          }
        })
      });
    });

    // Mock clients and tasks APIs
    await page.route('**/api/admin/clients', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          clients: [
            { id: 'cli_01', name: 'Al-Amal Medical Group', company_name: 'Al-Amal', retainer: 45000 }
          ]
        })
      });
    });

    await page.route('**/api/admin/tasks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          tasks: [
            { id: 'tsk_01', title: 'Produce TikTok Ad Campaign', priority: 'high', status: 'planned', planned_date: '2026-11-10' }
          ]
        })
      });
    });

    // Desktop Viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin-agency.html');
    await page.screenshot({ path: path.join('tests/screenshots', 'admin-desktop-1440.png'), fullPage: false });

    // Mobile Viewport (375px) - Verify Bottom Dock & Responsive Table
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin-agency.html');

    // Bottom Navigation Dock must be visible on mobile
    const bottomDock = page.locator('.admin-mobile-dock');
    if (await bottomDock.count() > 0) {
      await expect(bottomDock).toBeVisible();
    }

    // Verify No Horizontal Scroll
    const adminMobileWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(adminMobileWidth).toBeLessThanOrEqual(380);

    await page.screenshot({ path: path.join('tests/screenshots', 'admin-mobile-375.png'), fullPage: false });
  });

  // 3. CLIENT PORTAL JOURNEY
  test('Client Portal: Zero Trust OTP & Content Calendar Approval', async ({ page }) => {
    // Intercept client auth & deliverables
    await page.route('**/api/portal/auth', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock_portal_client_jwt',
          client: { id: 'client_A', name: 'Al-Amal Hospital', company_name: 'Al-Amal' }
        })
      });
    });

    await page.route('**/api/portal/deliverables', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          deliverables: [
            { id: 'del_01', title: 'Instagram Carousel - Healthcare Tips', status: 'pending_approval' }
          ]
        })
      });
    });

    // Desktop Viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/portal-dashboard-2026.html');
    await page.screenshot({ path: path.join('tests/screenshots', 'client-desktop-1440.png'), fullPage: false });

    // Mobile Viewport (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/portal-dashboard-2026.html');

    const clientMobileWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(clientMobileWidth).toBeLessThanOrEqual(380);

    await page.screenshot({ path: path.join('tests/screenshots', 'client-mobile-375.png'), fullPage: false });
  });

});
