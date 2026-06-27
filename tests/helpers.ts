import type { Page } from '@playwright/test';

export type CanvasFrame = {
  colored: number;
  samples: number[];
};

export function captureBrowserErrors(page: Page) {
  const browserErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  return browserErrors;
}

export function imageDelta(first: CanvasFrame, second: CanvasFrame) {
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

export async function canvasFrame(page: Page): Promise<CanvasFrame> {
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

export async function scrollToPageY(page: Page, target: number) {
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

export async function currentPageY(page: Page) {
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
