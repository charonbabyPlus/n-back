"use client";
import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { computeCurrentStimulusIndex, isGameOver } from "@/game/sequence";
import type { SpeedChange } from "@/db/schema";
import { Grid } from "./Grid";
import { Scoreboard } from "./Scoreboard";
import { Button } from "@/components/ui/button";

interface GameData {
  id: string;
  sequence: number[] | null;
  startedAt: number | null;
  initialIntervalMs: number;
  speedChanges: SpeedChange[];
  stimuliCount: number;
  nValue: number;
  players: Array<{
    userId: string;
    score: number;
    errorCount: number;
    user: { name: string };
  }>;
}

interface PlayingProps {
  game: GameData;
  currentUserId: string;
}

export function Playing({ game, currentUserId }: PlayingProps) {
  const router = useRouter();
  const [stimIdx, setStimIdx] = useState(-1);
  // ref mirrors stimIdx so the interval can read current index without closures
  const stimIdxRef = useRef(-1);
  const gameRef = useRef(game);
  useEffect(() => { gameRef.current = game; }, [game]);

  const pressedRef = useRef(false);
  const lastSubmittedRef = useRef(-1);
  const [pressedVisual, setPressedVisual] = useState(false);

  const submitMutation = trpc.game.submitAnswer.useMutation({
    onSettled: () => {
      startTransition(() => {
        router.refresh();
      });
    },
  });
  const submitMutationRef = useRef(submitMutation);
  useEffect(() => { submitMutationRef.current = submitMutation; }, [submitMutation]);

  useEffect(() => {
    const tick = () => {
      const g = gameRef.current;
      if (!g.startedAt || !g.sequence) return;

      const startedAt = Number(g.startedAt);
      const now = Date.now();
      const idx = computeCurrentStimulusIndex(
        startedAt,
        g.initialIntervalMs,
        g.speedChanges,
        g.stimuliCount,
        now,
      );

      const prev = stimIdxRef.current;
      if (idx !== prev) {
        if (prev >= 0 && lastSubmittedRef.current < prev) {
          lastSubmittedRef.current = prev;
          submitMutationRef.current.mutate({
            gameId: g.id,
            stimulusIndex: prev,
            pressed: pressedRef.current,
          });
          pressedRef.current = false;
          setPressedVisual(false);
        }
        stimIdxRef.current = idx;
        setStimIdx(idx);
      }

      if (
        idx === g.stimuliCount - 1 &&
        lastSubmittedRef.current < idx &&
        isGameOver(startedAt, g.initialIntervalMs, g.speedChanges, g.stimuliCount, now)
      ) {
        lastSubmittedRef.current = idx;
        submitMutationRef.current.mutate({
          gameId: g.id,
          stimulusIndex: idx,
          pressed: pressedRef.current,
        });
        pressedRef.current = false;
        setPressedVisual(false);
      }
    };

    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, []); // intentionally empty — reads via refs

  const handleMatch = () => {
    pressedRef.current = true;
    setPressedVisual(true);
  };

  const activeCell =
    game.sequence && stimIdx >= 0 ? game.sequence[stimIdx] ?? null : null;

  const currentInterval =
    game.speedChanges.length > 0
      ? game.speedChanges[game.speedChanges.length - 1].newIntervalMs
      : game.initialIntervalMs;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-sm text-muted-foreground">
        Stimulus {Math.max(0, stimIdx) + 1} / {game.stimuliCount} ·{" "}
        {currentInterval}ms interval · n={game.nValue}
      </div>
      <Grid activeIndex={activeCell} />
      <Button
        size="lg"
        variant={pressedVisual ? "default" : "outline"}
        className="w-48 h-16 text-lg"
        onClick={handleMatch}
        disabled={stimIdx < game.nValue}
      >
        {pressedVisual ? "Matched!" : "Match!"}
      </Button>
      <Scoreboard players={game.players} currentUserId={currentUserId} />
    </div>
  );
}
