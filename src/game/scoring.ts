export function evaluateAnswer(
  sequence: number[],
  nValue: number,
  stimulusIndex: number,
  pressed: boolean,
): boolean {
  if (stimulusIndex < nValue) {
    return !pressed;
  }
  const isMatch = sequence[stimulusIndex] === sequence[stimulusIndex - nValue];
  return pressed === isMatch;
}

export function shouldTriggerSpeedChange(
  errorCount: number,
  errorCountAtLastSpeedChange: number,
): boolean {
  return errorCount - errorCountAtLastSpeedChange >= 3;
}

export function computeNextIntervalMs(currentIntervalMs: number): number {
  return Math.max(700, currentIntervalMs - 300);
}
