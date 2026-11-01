// tests/mobile-responsive.spec.js
import { test, expect } from '@playwright/test';
import path from 'path';

const viewports = [
  { name: 'iPhone SE (375px)', width: 375, height: 667 },
  { name: 'iPhone 14 (390px)', width: 390, height: 844 }
];

test.describe('📱 Mobile Responsiveness & Zero Horizontal Overflow Suite', () => {

  for (const vp of viewports) {
    test(`Admin OS (admin-agency.html) is responsive on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Mock admin authentication
      await page.addInitScript(() => {
        localStorage.setItem('admin_jwt', 'mock_jwt_for_e2e_testing');
        localStorage.setItem('agency_admin_token', 'mock_jwt_for_e2e_testing');
      });

      // Intercept admin API requests to avoid unauthenticated redirects
      await page.route('**/api/admin/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, authenticated: true, user: { name: 'Super Admin', role: 'Super Admin' } })
        });
      });

      await page.route('**/api/admin/agent-actions*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, actions: [], stats: { pending: 0, sent: 0, rejected: 0, total: 0 } })
        });
      });

      await page.route('**/api/admin/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] })
        });
      });

      await page.goto('/admin-agency');
      await page.waitForLoadState('domcontentloaded');

      // Ensure login overlay is dismissed for E2E testing
      await page.evaluate(() => {
        const overlay = document.getElementById('admin-login-overlay');
        if (overlay) overlay.style.display = 'none';
      });

      // 1. Verify Hamburger Button is visible
      const hamburger = page.locator('#adminMobileMenuBtn');
      await expect(hamburger).toBeVisible();

      // 2. Verify Desktop Navigation Tabs are hidden
      const desktopTabs = page.locator('#topNavTabs');
      await expect(desktopTabs).toBeHidden();

      // 3. Test Drawer Open & Close
      await hamburger.click();
      const drawer = page.locator('#adminMobileDrawer');
      await expect(drawer).toHaveClass(/open/);

      // Verify drawer links
      const agentsDrawerBtn = page.locator('#adminMobileDrawer button[data-tab="agents"]');
      await expect(agentsDrawerBtn).toBeVisible();

      // Close drawer
      const drawerClose = page.locator('.admin-drawer-close');
      await drawerClose.click();
      await expect(drawer).not.toHaveClass(/open/);

      // 4. Critical check: Zero Horizontal Scrolling
      const overflowResult = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const bodyWidth = document.body.scrollWidth;
        return {
          scrollWidth: Math.max(docWidth, bodyWidth),
          innerWidth: winWidth,
          hasHorizontalScroll: Math.max(docWidth, bodyWidth) > winWidth
        };
      });

      console.log(`[Admin OS on ${vp.name}] Result:`, overflowResult);
      expect(overflowResult.hasHorizontalScroll).toBe(false);

      // Screenshot for proof
      await page.screenshot({
        path: `test-results/admin-agency-${vp.width}px.png`,
        fullPage: false
      });
    });

    test(`Sales CRM (sales-crm-2026.html) is responsive on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.route('**/api/admin/sales/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, leads: [] })
        });
      });

      await page.goto('/sales-crm-2026');
      await page.waitForLoadState('domcontentloaded');

      // 1. Verify Hamburger Menu Button is visible
      const menuBtn = page.locator('.mobile-menu-btn');
      await expect(menuBtn).toBeVisible();

      // 2. Test Sidebar toggle
      await menuBtn.click();
      const sidebar = page.locator('#sidebar');
      await expect(sidebar).toHaveClass(/open/);

      // Click backdrop to close
      const backdrop = page.locator('#sidebarBackdrop');
      await backdrop.evaluate(el => el.click());
      await expect(sidebar).not.toHaveClass(/open/);

      // 3. Critical check: Zero Horizontal Scrolling
      const overflowResult = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const bodyWidth = document.body.scrollWidth;
        return {
          scrollWidth: Math.max(docWidth, bodyWidth),
          innerWidth: winWidth,
          hasHorizontalScroll: Math.max(docWidth, bodyWidth) > winWidth
        };
      });

      console.log(`[Sales CRM on ${vp.name}] Result:`, overflowResult);
      expect(overflowResult.hasHorizontalScroll).toBe(false);

      // Screenshot for proof
      await page.screenshot({
        path: `test-results/sales-crm-${vp.width}px.png`,
        fullPage: false
      });
    });

    test(`Client Portal (portal-dashboard-2026.html) is responsive on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.addInitScript(() => {
        localStorage.setItem('client_jwt', 'mock_client_jwt');
      });

      await page.route('**/api/portal/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, deliverables: [], client: { company_name: 'شركة تجريبية' } })
        });
      });

      await page.goto('/portal-dashboard-2026');
      await page.waitForLoadState('domcontentloaded');

      // Critical check: Zero Horizontal Scrolling
      const overflowResult = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const bodyWidth = document.body.scrollWidth;
        return {
          scrollWidth: Math.max(docWidth, bodyWidth),
          innerWidth: winWidth,
          hasHorizontalScroll: Math.max(docWidth, bodyWidth) > winWidth
        };
      });

      console.log(`[Client Portal on ${vp.name}] Result:`, overflowResult);
      expect(overflowResult.hasHorizontalScroll).toBe(false);

      // Screenshot for proof
      await page.screenshot({
        path: `test-results/portal-${vp.width}px.png`,
        fullPage: false
      });
    });
  }

});
