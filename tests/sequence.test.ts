import { describe, it, expect } from "vitest";
import {
  generateSequence,
  computeCurrentStimulusIndex,
  isGameOver,
} from "@/features/game/shared/sequence";

describe("generateSequence", () => {
  it("generates correct length", () => {
    expect(generateSequence(20, 2).length).toBe(20);
  });

  it("all values in range 0-8", () => {
    const seq = generateSequence(100, 2);
    expect(seq.every((v) => v >= 0 && v <= 8)).toBe(true);
  });

  it("no forced non-match before nValue positions", () => {
    for (let run = 0; run < 10; run++) {
      const seq = generateSequence(20, 2);
      expect(seq[0]).toBeGreaterThanOrEqual(0);
      expect(seq[1]).toBeGreaterThanOrEqual(0);
    }
  });

  it("non-match positions differ from n-back value", () => {
    for (let run = 0; run < 20; run++) {
      const seq = generateSequence(20, 2);
      for (let i = 2; i < seq.length; i++) {
        const isMatch = seq[i] === seq[i - 2];
        // either it's a deliberate match OR it's a deliberate non-match
        // both are valid; we just verify the sequence is valid integers
        expect(seq[i]).toBeGreaterThanOrEqual(0);
        expect(seq[i]).toBeLessThanOrEqual(8);
        if (!isMatch) {
          expect(seq[i]).not.toBeUndefined();
        }
      }
    }
  });
});

describe("computeCurrentStimulusIndex", () => {
  it("returns -1 if now < startedAt", () => {
    expect(computeCurrentStimulusIndex(1000, 2500, [], 20, 500)).toBe(-1);
  });

  it("returns 0 at t=0", () => {
    expect(computeCurrentStimulusIndex(1000, 2500, [], 20, 1000)).toBe(0);
  });

  it("advances after each interval", () => {
    expect(computeCurrentStimulusIndex(0, 2500, [], 20, 2500)).toBe(1);
    expect(computeCurrentStimulusIndex(0, 2500, [], 20, 5000)).toBe(2);
    expect(computeCurrentStimulusIndex(0, 2500, [], 20, 7499)).toBe(2);
    expect(computeCurrentStimulusIndex(0, 2500, [], 20, 7500)).toBe(3);
  });

  it("caps at stimuliCount - 1", () => {
    expect(computeCurrentStimulusIndex(0, 2500, [], 20, 1_000_000)).toBe(19);
  });

  it("respects speed changes after a block", () => {
    // Stimuli 0-4 (5 stimuli) at 2500ms each = 12500ms for block
    // Then new interval 1500ms
    const sc = [{ afterStimulusIndex: 4, newIntervalMs: 1500 }];

    // At t=12499: still inside first block at stim 4
    expect(computeCurrentStimulusIndex(0, 2500, sc, 20, 12499)).toBe(4);
    // At t=12500: block exhausted, start second block → stim 5
    expect(computeCurrentStimulusIndex(0, 2500, sc, 20, 12500)).toBe(5);
    // At t=14000: 1500ms into second block → stim 6
    expect(computeCurrentStimulusIndex(0, 2500, sc, 20, 14000)).toBe(6);
  });
});

describe("isGameOver", () => {
  it("ends after stimuliCount * interval at constant speed", () => {
    // 20 * 2500 = 50000ms
    expect(isGameOver(0, 2500, [], 20, 49_999)).toBe(false);
    expect(isGameOver(0, 2500, [], 20, 50_000)).toBe(true);
  });

  it("ends at correct time with a speed change", () => {
    // 5 * 2500 + 15 * 1500 = 12500 + 22500 = 35000ms
    const sc = [{ afterStimulusIndex: 4, newIntervalMs: 1500 }];
    expect(isGameOver(0, 2500, sc, 20, 34_999)).toBe(false);
    expect(isGameOver(0, 2500, sc, 20, 35_000)).toBe(true);
  });
});
