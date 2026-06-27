import { MODEL_PATH_COMPACT_WIDTH, type ModelPathStage } from './modelPath';

export type ModelPathName = 'compact' | 'desktop';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(value: number, min: number, max: number) {
  const amount = clamp((value - min) / (max - min), 0, 1);
  return amount * amount * (3 - 2 * amount);
}

export function getPageScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return maxScroll <= 0 ? 0 : clamp(window.scrollY / maxScroll, 0, 1);
}

export function getModelPathName(width: number): ModelPathName {
  return width <= MODEL_PATH_COMPACT_WIDTH ? 'compact' : 'desktop';
}

export function getModelPathSegment(path: readonly ModelPathStage[], progress: number) {
  const firstStage = path[0];

  if (progress <= firstStage.progress) {
    return { from: firstStage, to: firstStage, amount: 0 };
  }

  for (let index = 1; index < path.length; index += 1) {
    const nextStage = path[index];

    if (progress <= nextStage.progress) {
      const previousStage = path[index - 1];
      const stageDistance = nextStage.progress - previousStage.progress || 1;
      const linearAmount = clamp((progress - previousStage.progress) / stageDistance, 0, 1);

      return {
        from: previousStage,
        to: nextStage,
        amount: smoothstep(linearAmount, 0, 1)
      };
    }
  }

  const lastStage = path[path.length - 1];
  return { from: lastStage, to: lastStage, amount: 0 };
}

export function interpolateNumber(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}
