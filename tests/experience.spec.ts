import { expect, type Page, test } from '@playwright/test';

type CanvasFrame = {
  colored: number;
  samples: number[];
};

function imageDelta(first: CanvasFrame, second: CanvasFrame) {
  const length = Math.min(first.samples.length, second.samples.length);
  let changed = 0;

  for (let index = 0; index < length; index += 4) {
    const delta =
      Math.abs(first.samples[index] - second.samples[index]) +
      Math.abs(first.samples[index + 1] - second.samples[index + 1]) +
      Math.abs(first.samples[index + 2] - second.samples[index + 2]) +
      Math.abs(first.samples[index + 3] - second.samples[index + 3]);

    if (delta > 36) {
      changed += 1;
    }
  }

  return changed;
}

async function canvasFrame(page: Page): Promise<CanvasFrame> {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const gl = canvas?.getContext('webgl2') ?? canvas?.getContext('webgl');

    if (!canvas || !gl) {
      return { colored: 0, samples: [] };
    }

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const xStep = Math.max(1, Math.floor(width / 36));
    const yStep = Math.max(1, Math.floor(height / 36));
    const pixel = new Uint8Array(4);
    const samples: number[] = [];
    let colored = 0;

    for (let y = 0; y < height; y += yStep) {
      for (let x = 0; x < width; x += xStep) {
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        samples.push(pixel[0], pixel[1], pixel[2], pixel[3]);

        if (pixel[3] > 10 && (pixel[0] > 12 || pixel[1] > 12 || pixel[2] > 12)) {
          colored += 1;
        }
      }
    }

    return { colored, samples };
  });
}

async function scrollToPageY(page: Page, target: number) {
  await page.evaluate((scrollTarget) => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';

    const scroller = document.scrollingElement ?? document.documentElement;
    scroller.scrollTop = scrollTarget;
    document.documentElement.scrollTop = scrollTarget;
    document.body.scrollTop = scrollTarget;
    window.scrollTo({ left: 0, top: scrollTarget, behavior: 'auto' });
  }, target);
}

async function currentPageY(page: Page) {
  return page.evaluate(() =>
    Math.round(
      Math.max(
        window.scrollY,
        document.documentElement.scrollTop,
        document.body.scrollTop,
        document.scrollingElement?.scrollTop ?? 0
      )
    )
  );
}

test('renders the Eveningstar product page without browser errors', async ({ page }) => {
  test.setTimeout(90000);

  const browserErrors: string[] = [];
  const modelResponses: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
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
