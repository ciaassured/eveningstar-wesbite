import { expect, test } from '@playwright/test';
import { eveningStarVariants } from '../src/variants';
import { canvasFrame, captureBrowserErrors } from './helpers';

test.describe('PCB variants', () => {
  test.skip(({ isMobile }) => isMobile, 'Variant smoke runs only in the desktop project.');

  test('renders every configured variant', async ({ page }) => {
    test.setTimeout(180000);

    const browserErrors = captureBrowserErrors(page);
    const loadedModels = new Set<string>();

    page.on('response', (response) => {
      for (const variant of eveningStarVariants) {
        if (response.url().includes(`/${variant.model}`) && response.ok()) {
          loadedModels.add(variant.id);
        }
      }
    });

    for (const variant of eveningStarVariants) {
      await page.goto(`./?variant=${variant.id}`, { waitUntil: 'networkidle' });
      await expect(page.locator('.theme-root')).toHaveAttribute('data-variant', variant.id);
      await expect(page.locator('head link[rel~="icon"]')).toHaveAttribute(
        'href',
        new RegExp(`favicons/favicon-${variant.id}\\.svg`)
      );
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', variant.fog);

      const loader = page.locator('.loader');
      await expect(loader).toHaveAttribute('aria-hidden', 'true', { timeout: 15000 });

      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();
      await page.waitForTimeout(750);

      const frame = await canvasFrame(page);
      expect(frame.colored).toBeGreaterThan(6);
      expect(loadedModels.has(variant.id)).toBe(true);
      expect(browserErrors).toEqual([]);
    }
  });
});
