import type { SpeedChange } from "@/lib/db/schema";

export function generateSequence(
  length: number,
  nValue: number,
  matchProbability = 0.33,
): number[] {
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    if (i >= nValue && Math.random() < matchProbability) {
      seq.push(seq[i - nValue]);
    } else {
      let pos: number;
      do {
        pos = Math.floor(Math.random() * 9);
      } while (i >= nValue && pos === seq[i - nValue]);
      seq.push(pos);
    }
  }
  return seq;
}

export function computeCurrentStimulusIndex(
  startedAt: number,
  initialIntervalMs: number,
  speedChanges: SpeedChange[],
  stimuliCount: number,
  now: number,
): number {
  if (now < startedAt) return -1;

  const sorted = [...speedChanges].sort(
    (a, b) => a.afterStimulusIndex - b.afterStimulusIndex,
  );

  let timeAccum = 0;
  let stimAccum = 0;
  let interval = initialIntervalMs;

  for (const change of sorted) {
    const stimuliInBlock = change.afterStimulusIndex - stimAccum + 1;
    const timeInBlock = stimuliInBlock * interval;

    if (timeAccum + timeInBlock > now - startedAt) {
      const timeIntoBlock = now - startedAt - timeAccum;
      return Math.min(stimAccum + Math.floor(timeIntoBlock / interval), stimuliCount - 1);
    }

    timeAccum += timeInBlock;
    stimAccum = change.afterStimulusIndex + 1;
    interval = change.newIntervalMs;
  }

  const remaining = now - startedAt - timeAccum;
  return Math.min(stimAccum + Math.floor(remaining / interval), stimuliCount - 1);
}

export function isGameOver(
  startedAt: number,
  initialIntervalMs: number,
  speedChanges: SpeedChange[],
  stimuliCount: number,
  now: number,
): boolean {
  const sorted = [...speedChanges].sort(
    (a, b) => a.afterStimulusIndex - b.afterStimulusIndex,
  );

  let totalTime = 0;
  let stimAccum = 0;
  let interval = initialIntervalMs;

  for (const change of sorted) {
    totalTime += (change.afterStimulusIndex - stimAccum + 1) * interval;
    stimAccum = change.afterStimulusIndex + 1;
    interval = change.newIntervalMs;
  }

  totalTime += (stimuliCount - stimAccum) * interval;
  return now - startedAt >= totalTime;
}
