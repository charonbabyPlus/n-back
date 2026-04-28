import { describe, it, expect } from "vitest";
import {
  evaluateAnswer,
  shouldTriggerSpeedChange,
  computeNextIntervalMs,
} from "@/features/game/shared/scoring";

// sequence: [3, 1, 3, 5, 3], n=2
// matches at index 2 (3===3) and index 4 (3===3)
const seq = [3, 1, 3, 5, 3];
const n = 2;

describe("evaluateAnswer", () => {
  it("pressing on a match is correct", () => {
    expect(evaluateAnswer(seq, n, 2, true)).toBe(true);
    expect(evaluateAnswer(seq, n, 4, true)).toBe(true);
  });

  it("not pressing on a non-match is correct", () => {
    expect(evaluateAnswer(seq, n, 3, false)).toBe(true); // seq[3]=5 !== seq[1]=1
  });

  it("pressing on a non-match is wrong", () => {
    expect(evaluateAnswer(seq, n, 3, true)).toBe(false);
  });

  it("not pressing on a match is wrong", () => {
    expect(evaluateAnswer(seq, n, 2, false)).toBe(false);
    expect(evaluateAnswer(seq, n, 4, false)).toBe(false);
  });

  it("indices before n: not pressing is always correct", () => {
    expect(evaluateAnswer(seq, n, 0, false)).toBe(true);
    expect(evaluateAnswer(seq, n, 1, false)).toBe(true);
  });

  it("indices before n: pressing is always wrong", () => {
    expect(evaluateAnswer(seq, n, 0, true)).toBe(false);
    expect(evaluateAnswer(seq, n, 1, true)).toBe(false);
  });
});

describe("shouldTriggerSpeedChange", () => {
  it("triggers at exactly 3 new errors", () => {
    expect(shouldTriggerSpeedChange(3, 0)).toBe(true);
    expect(shouldTriggerSpeedChange(6, 3)).toBe(true);
    expect(shouldTriggerSpeedChange(9, 6)).toBe(true);
  });

  it("does not trigger below 3 new errors", () => {
    expect(shouldTriggerSpeedChange(0, 0)).toBe(false);
    expect(shouldTriggerSpeedChange(1, 0)).toBe(false);
    expect(shouldTriggerSpeedChange(2, 0)).toBe(false);
    expect(shouldTriggerSpeedChange(4, 3)).toBe(false);
  });

  it("triggers above 3 new errors", () => {
    expect(shouldTriggerSpeedChange(4, 0)).toBe(true);
    expect(shouldTriggerSpeedChange(10, 0)).toBe(true);
  });
});

describe("computeNextIntervalMs", () => {
  it("decreases interval by 300ms", () => {
    expect(computeNextIntervalMs(2500)).toBe(2200);
    expect(computeNextIntervalMs(1000)).toBe(700);
  });

  it("floors at 700ms", () => {
    expect(computeNextIntervalMs(900)).toBe(700);
    expect(computeNextIntervalMs(700)).toBe(700);
    expect(computeNextIntervalMs(500)).toBe(700);
    expect(computeNextIntervalMs(100)).toBe(700);
  });
});
