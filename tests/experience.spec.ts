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
    const xStep = Math.max(1, Math.floor(width / 24));
    const yStep = Math.max(1, Math.floor(height / 24));
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

test('renders the Evening Star product page without browser errors', async ({ page }) => {
  test.setTimeout(60000);

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
  await expect(page.getByRole('heading', { name: /Evening Star/i })).toBeVisible();
  await expect(page.locator('.site-mark')).toBeVisible();
  await expect(page.locator('.hero-heading__star')).toBeVisible();
  await expect(page.locator('.theme-root')).toHaveAttribute('data-variant', 'blue');
  await expect
    .poll(() => page.evaluate(() => document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href ?? ''))
    .toContain('/favicons/favicon-blue.svg');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#d8ecfb');
  const loader = page.locator('.loader');
  await expect(loader).toHaveAttribute('aria-hidden', 'true', { timeout: 15000 });
  await expect(loader).toHaveClass(/loader--hidden/);
  await page.waitForTimeout(750);

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(1250);

  const firstFrame = await canvasFrame(page);
  expect(firstFrame.colored).toBeGreaterThan(6);
  expect(modelResponses.length).toBeGreaterThan(0);

  await page.mouse.move(72, 84);
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
  await page.waitForTimeout(750);

  const movedFrame = await canvasFrame(page);
  expect(imageDelta(firstFrame, movedFrame)).toBeGreaterThan(2);
  expect(browserErrors).toEqual([]);
});
