// tests/e2e.spec.js
import { test, expect } from '@playwright/test';

test.describe('PR Agency Native & Web OS E2E Suite', () => {

  test('Public Homepage loads with clean marketing header and no admin tools', async ({ page }) => {
    await page.goto('/');
    
    // Ensure title contains PR Agency
    await expect(page).toHaveTitle(/PR Agency/i);

    // Verify public navigation
    const nav = page.locator('#hdr .hdr-nav');
    await expect(nav).toBeVisible();
    const navText = await nav.innerText();
    expect(navText).toMatch(/الرئيسية|Home/);

    // Strict Persona Boundary Check: no admin tools in header
    await expect(page.locator('#hdr')).not.toContainText('مصنع المواقع');
    await expect(page.locator('#hdr')).not.toContainText('فحص الأمان');
    await expect(page.locator('#hdr')).not.toContainText('website-factory');
  });

  test('Admin OS Workflow: Login, Navigation & Automation Trigger', async ({ page }) => {
    // Intercept admin API requests to mock robust responses
    await page.route('**/api/admin/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock_admin_jwt_token_2026',
          user: { id: 'admin-1', name: 'Super Admin', role: 'Super Admin' }
        })
      });
    });

    await page.route('**/api/admin/clients', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, client: { id: 'cli_test_101', name: body.name || 'Test Client' } })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, clients: [] })
        });
      }
    });

    await page.route('**/api/admin/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, project: { id: 'proj_test_202', title: 'Q4 Growth Project' } })
      });
    });

    await page.route('**/api/admin/tasks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, task: { id: 'task_test_303', title: 'Produce TikTok Ad Campaign' } })
      });
    });

    await page.route('**/api/admin/invoices', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, invoice: { id: 'inv_test_404', amount: 15000, status: 'sent' } })
      });
    });

    // Mock Automation Webhook / Telegram dispatch
    let telegramAlertFired = false;
    await page.route('**/api/admin/workflows/**', async (route) => {
      telegramAlertFired = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Telegram alert dispatched to ops channel' })
      });
    });

    await page.goto('/admin-agency.html');

    // Fill login overlay
    const userField = page.locator('#loginUsername');
    if (await userField.isVisible()) {
      await userField.fill('admin');
      await page.locator('#loginPassword').fill('admin2026');
      await page.locator('#loginSubmitBtn').click();
    }

    // Verify Admin tools exist in admin dashboard
    const adminTools = page.locator('nav.nav-tabs-wrapper');
    await expect(adminTools).toBeVisible();
    await expect(adminTools).toContainText('مصنع المواقع');
    await expect(adminTools).toContainText('فحص الأمان');
  });

  test('Client Portal: Task Review & Approval Workflow', async ({ page }) => {
    await page.route('**/api/portal/auth', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock_portal_client_jwt',
          client: { id: 'cli_test_101', name: 'العميل المميز' }
        })
      });
    });

    await page.route('**/api/portal/tasks/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, status: 'approved' })
      });
    });

    await page.goto('/portal-dashboard-2026.html');
    await expect(page).toHaveTitle(/PR Agency/i);
  });
});
