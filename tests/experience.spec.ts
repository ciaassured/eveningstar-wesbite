import { expect, test } from '@playwright/test';
import { canvasFrame, captureBrowserErrors, currentPageY, imageDelta, scrollToPageY } from './helpers';

test('renders the Eveningstar product page without browser errors', async ({ page }) => {
  test.setTimeout(90000);

  const browserErrors = captureBrowserErrors(page);
  const modelResponses: string[] = [];

  page.on('response', (response) => {
    if (response.url().includes('/models/eveningstar-blue.glb') && response.ok()) {
      modelResponses.push(response.url());
    }
  });

  await page.goto('./?variant=blue', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: /Eveningstar/i })).toBeVisible();
  await expect(page.locator('.site-mark')).toBeVisible();
  await expect(page.locator('.hero-heading__star')).toBeVisible();
  await expect(page.locator('.theme-root')).toHaveAttribute('data-variant', 'blue');
  await expect(page.locator('head link[rel~="icon"]')).toHaveAttribute('href', /favicons\/favicon-blue\.svg/);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#d8ecfb');
  const loader = page.locator('.loader');
  await expect(loader).toHaveAttribute('aria-hidden', 'true', { timeout: 15000 });
  await expect(loader).toHaveClass(/loader--hidden/);
  await expect(page.locator('.loader__title')).toHaveText('Eveningstar');
  await page.waitForTimeout(750);

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(1250);

  const firstFrame = await canvasFrame(page);
  expect(firstFrame.colored).toBeGreaterThan(6);
  expect(modelResponses.length).toBeGreaterThan(0);

  await page.mouse.move(72, 84);
  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  await scrollToPageY(page, maxScroll);
  await expect.poll(() => currentPageY(page)).toBeGreaterThan(Math.round(maxScroll * 0.9));
  await expect(page.locator('.inspection-control-panel')).toHaveAttribute('data-visible', 'true');

  const flipControl = page.locator('.inspection-flip-control');
  await expect(flipControl).toBeVisible();
  await expect(flipControl).toHaveText(/show underside/i);
  await expect(flipControl).toHaveAttribute('aria-pressed', 'false');
  await flipControl.click();
  await expect(flipControl).toHaveText(/show top side/i);
  await expect(flipControl).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(300);

  const movedFrame = await canvasFrame(page);
  const movedDelta = imageDelta(firstFrame, movedFrame);
  expect(movedDelta).toBeGreaterThan(2);

  const viewport = page.viewportSize();

  if (viewport) {
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
  }

  await scrollToPageY(page, 0);
  await expect.poll(() => currentPageY(page)).toBe(0);
  await page.waitForTimeout(1200);
  await expect(page.locator('.inspection-control-panel')).toHaveAttribute('data-visible', 'false');
  await expect(page.locator('.inspection-flip-control')).toBeDisabled();
  await expect(page.locator('.inspection-flip-control')).toHaveAttribute('tabindex', '-1');

  const returnedFrame = await canvasFrame(page);
  const returnedDelta = imageDelta(firstFrame, returnedFrame);
  expect(returnedDelta).toBeLessThan(240);
  expect(browserErrors).toEqual([]);
});
