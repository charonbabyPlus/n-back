import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@/db/drizzle";
import { game, gamePlayers, stimulusAnswers } from "@/db/schema";
import { computeCurrentStimulusIndex, isGameOver } from "@/game/sequence";
import {
  computeNextIntervalMs,
  evaluateAnswer,
  shouldTriggerSpeedChange,
} from "@/game/scoring";

const newId = () => crypto.randomUUID();

export async function submitAnswerForPlayer({
  database,
  gameId,
  userId,
  stimulusIndex,
  pressed,
}: {
  database?: typeof db;
  gameId: string;
  userId: string;
  stimulusIndex: number;
  pressed: boolean;
}) {
  const databaseClient = database ?? db;

  const currentGame = await databaseClient.query.game.findFirst({
    where: eq(game.id, gameId),
    with: { players: true },
  });

  if (!currentGame) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  if (currentGame.status !== "playing") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Game not in progress" });
  }

  if (!currentGame.sequence || currentGame.startedAt == null) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  }

  const player = currentGame.players.find((item) => item.userId === userId);
  if (!player) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not in this game" });
  }

  if (stimulusIndex >= currentGame.stimuliCount) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid stimulus index" });
  }

  const correct = evaluateAnswer(
    currentGame.sequence,
    currentGame.nValue,
    stimulusIndex,
    pressed,
  );

  try {
    await databaseClient.insert(stimulusAnswers).values({
      id: newId(),
      gameId,
      userId,
      stimulusIndex,
      pressed,
      correct,
    });
  } catch {
    return { correct, speedChanged: false };
  }

  const newErrorCount = player.errorCount + (correct ? 0 : 1);
  const triggerChange =
    !correct &&
    shouldTriggerSpeedChange(newErrorCount, player.errorCountAtLastSpeedChange);

  let latestSpeedChanges = currentGame.speedChanges;

  if (triggerChange) {
    const lastInterval =
      currentGame.speedChanges.length > 0
        ? currentGame.speedChanges[currentGame.speedChanges.length - 1].newIntervalMs
        : currentGame.initialIntervalMs;
    latestSpeedChanges = [
      ...currentGame.speedChanges,
      {
        afterStimulusIndex: stimulusIndex,
        newIntervalMs: computeNextIntervalMs(lastInterval),
      },
    ];

    await databaseClient
      .update(game)
      .set({ speedChanges: latestSpeedChanges })
      .where(eq(game.id, gameId));
    await databaseClient
      .update(gamePlayers)
      .set({
        score: player.score + (correct ? 1 : 0),
        errorCount: newErrorCount,
        errorCountAtLastSpeedChange: newErrorCount,
      })
      .where(eq(gamePlayers.id, player.id));
  } else {
    await databaseClient
      .update(gamePlayers)
      .set({
        score: player.score + (correct ? 1 : 0),
        errorCount: newErrorCount,
      })
      .where(eq(gamePlayers.id, player.id));
  }

  if (
    isGameOver(
      currentGame.startedAt,
      currentGame.initialIntervalMs,
      latestSpeedChanges,
      currentGame.stimuliCount,
      Date.now(),
    )
  ) {
    await databaseClient
      .update(game)
      .set({ status: "finished", finishedAt: new Date() })
      .where(eq(game.id, gameId));
  }

  return { correct, speedChanged: triggerChange };
}

export async function catchUpMissedAnswers({
  database,
  gameId,
  userId,
  now = Date.now(),
}: {
  database?: typeof db;
  gameId: string;
  userId: string;
  now?: number;
}) {
  const databaseClient = database ?? db;

  const currentGame = await databaseClient.query.game.findFirst({
    where: eq(game.id, gameId),
    with: { players: true },
  });

  if (
    !currentGame ||
    currentGame.status !== "playing" ||
    !currentGame.sequence ||
    currentGame.startedAt == null
  ) {
    return;
  }

  const player = currentGame.players.find((item) => item.userId === userId);
  if (!player) {
    return;
  }

  const currentIndex = computeCurrentStimulusIndex(
    currentGame.startedAt,
    currentGame.initialIntervalMs,
    currentGame.speedChanges,
    currentGame.stimuliCount,
    now,
  );

  const finished = isGameOver(
    currentGame.startedAt,
    currentGame.initialIntervalMs,
    currentGame.speedChanges,
    currentGame.stimuliCount,
    now,
  );

  const targetIndex = finished ? currentIndex : currentIndex - 1;
  if (targetIndex < 0) {
    return;
  }

  const existingAnswers = await databaseClient.query.stimulusAnswers.findMany({
    where: and(
      eq(stimulusAnswers.gameId, gameId),
      eq(stimulusAnswers.userId, userId),
    ),
  });

  const answered = new Set(existingAnswers.map((item) => item.stimulusIndex));
  for (let index = 0; index <= targetIndex; index += 1) {
    if (answered.has(index)) {
      continue;
    }

    await submitAnswerForPlayer({
      database: databaseClient,
      gameId,
      userId,
      stimulusIndex: index,
      pressed: false,
    });
  }
}
