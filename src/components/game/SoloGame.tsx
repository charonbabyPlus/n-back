"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { evaluateAnswer, shouldTriggerSpeedChange, computeNextIntervalMs } from "@/game/scoring";
import { Grid } from "./Grid";
import { Button } from "@/components/ui/button";

const N_VALUE = 2;
const STIMULI_COUNT = 20;
const INITIAL_INTERVAL_MS = 2500;

interface SoloGameProps {
  initialSequence: number[];
}

export function SoloGame({ initialSequence }: SoloGameProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "playing" | "finished">("idle");
  const [stimIdx, setStimIdx] = useState(-1);
  const [pressedVisual, setPressedVisual] = useState(false);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [intervalMs, setIntervalMs] = useState(INITIAL_INTERVAL_MS);

  const seqRef = useRef<number[]>(initialSequence);
  const pressedRef = useRef(false);
  const scoreRef = useRef(0);
  const errorsRef = useRef(0);
  const errorAtLastChangeRef = useRef(0);
  const intervalMsRef = useRef(INITIAL_INTERVAL_MS);
  const stimulusStartRef = useRef(0);
  const stimIdxRef = useRef(0);
  const activeRef = useRef(false);

  // keep ref in sync if a new sequence comes from the server (router.refresh)
  useEffect(() => { seqRef.current = initialSequence; }, [initialSequence]);

  function startGame() {
    seqRef.current = initialSequence;
    pressedRef.current = false;
    scoreRef.current = 0;
    errorsRef.current = 0;
    errorAtLastChangeRef.current = 0;
    intervalMsRef.current = INITIAL_INTERVAL_MS;
    stimIdxRef.current = 0;
    stimulusStartRef.current = Date.now();
    activeRef.current = true;

    setScore(0);
    setErrors(0);
    setIntervalMs(INITIAL_INTERVAL_MS);
    setStimIdx(0);
    setPressedVisual(false);
    setPhase("playing");
  }

  useEffect(() => {
    if (phase !== "playing") return;

    const tick = () => {
      if (!activeRef.current) return;

      const elapsed = Date.now() - stimulusStartRef.current;
      if (elapsed < intervalMsRef.current) return;

      const idx = stimIdxRef.current;
      const correct = evaluateAnswer(seqRef.current, N_VALUE, idx, pressedRef.current);
      const newErrors = errorsRef.current + (correct ? 0 : 1);
      const newScore = scoreRef.current + (correct ? 1 : 0);
      errorsRef.current = newErrors;
      scoreRef.current = newScore;
      setScore(newScore);
      setErrors(newErrors);

      if (!correct && shouldTriggerSpeedChange(newErrors, errorAtLastChangeRef.current)) {
        errorAtLastChangeRef.current = newErrors;
        const newInterval = computeNextIntervalMs(intervalMsRef.current);
        intervalMsRef.current = newInterval;
        setIntervalMs(newInterval);
      }

      pressedRef.current = false;
      setPressedVisual(false);

      const nextIdx = idx + 1;
      if (nextIdx >= STIMULI_COUNT) {
        activeRef.current = false;
        setPhase("finished");
        return;
      }

      stimIdxRef.current = nextIdx;
      stimulusStartRef.current = Date.now();
      setStimIdx(nextIdx);
    };

    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [phase]);

  const activeCell =
    phase === "playing" && stimIdx >= 0 ? seqRef.current[stimIdx] ?? null : null;

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-center flex flex-col gap-1">
          <h2 className="text-2xl font-bold">2-back</h2>
          <p className="text-sm text-muted-foreground">
            {STIMULI_COUNT} stimuli · {INITIAL_INTERVAL_MS / 1000}s per stimulus
          </p>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs text-center leading-relaxed">
          Watch the grid. Press <strong>Match!</strong> when the highlighted
          position is the same as {N_VALUE} steps ago.
        </p>
        <Button size="lg" onClick={startGame} className="w-36">
          Start
        </Button>
      </div>
    );
  }

  if (phase === "finished") {
    const pct = Math.round((score / STIMULI_COUNT) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <h2 className="text-2xl font-bold">Done!</h2>
        <div className="flex flex-col items-center gap-1">
          <p className="text-5xl font-bold tabular-nums">
            {score}
            <span className="text-2xl text-muted-foreground font-normal">
              /{STIMULI_COUNT}
            </span>
          </p>
          <p className="text-muted-foreground text-sm">
            {pct}% correct · {errors} error{errors !== 1 ? "s" : ""}
          </p>
          <p className="text-muted-foreground text-xs">
            final speed: {intervalMs}ms
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setPhase("idle");
              router.refresh();
            }}
          >
            Play again
          </Button>
          <Button variant="outline" onClick={() => setPhase("idle")}>
            Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-sm text-muted-foreground">
        Stimulus {stimIdx + 1} / {STIMULI_COUNT} · {intervalMs}ms · {N_VALUE}-back
      </div>
      <Grid activeIndex={activeCell} />
      <Button
        size="lg"
        variant={pressedVisual ? "default" : "outline"}
        className="w-48 h-16 text-lg"
        onClick={() => {
          pressedRef.current = true;
          setPressedVisual(true);
        }}
        disabled={stimIdx < N_VALUE}
      >
        {pressedVisual ? "Matched!" : "Match!"}
      </Button>
      <div className="flex gap-6 text-sm tabular-nums text-muted-foreground">
        <span>{score} correct</span>
        <span>{errors} errors</span>
      </div>
    </div>
  );
}
