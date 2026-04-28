"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/features/auth/server/auth";
import { db } from "@/lib/db/drizzle";
import { game, gamePlayers } from "@/lib/db/schema";
import { generateSequence } from "@/features/game/shared/sequence";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session.user.id;
}

export async function createGameAction(): Promise<void> {
  const userId = await requireUserId();
  const gameId = crypto.randomUUID();

  await db.insert(game).values({ id: gameId, hostId: userId });
  await db
    .insert(gamePlayers)
    .values({ id: crypto.randomUUID(), gameId, userId });

  redirect(`/game/${gameId}`);
}

export async function joinGameAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const gameId = String(formData.get("gameId") ?? "");
  if (!gameId) redirect("/game");

  const existing = await db.query.game.findFirst({
    where: eq(game.id, gameId),
    with: { players: true },
  });
  if (!existing || existing.status !== "lobby") redirect("/game");

  if (existing.players.some((p) => p.userId === userId)) {
    redirect(`/game/${gameId}`);
  }
  if (existing.players.length >= 4) redirect("/game");

  await db.insert(gamePlayers).values({
    id: crypto.randomUUID(),
    gameId,
    userId,
  });

  redirect(`/game/${gameId}`);
}

export async function leaveGameAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const gameId = String(formData.get("gameId") ?? "");
  if (!gameId) redirect("/game");

  const current = await db.query.game.findFirst({
    where: eq(game.id, gameId),
    with: { players: true },
  });
  if (!current || current.status !== "lobby") redirect("/game");

  if (current.hostId === userId) {
    await db.delete(game).where(eq(game.id, gameId));
    redirect("/game");
  }

  await db
    .delete(gamePlayers)
    .where(and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.userId, userId)));

  redirect("/game");
}

export async function dissolveGameAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const gameId = String(formData.get("gameId") ?? "");
  if (!gameId) redirect("/game");

  const existing = await db.query.game.findFirst({ where: eq(game.id, gameId) });
  if (
    !existing ||
    existing.status !== "lobby" ||
    existing.hostId !== userId
  ) {
    redirect("/game");
  }

  await db.delete(game).where(eq(game.id, gameId));
  redirect("/game");
}

export async function startGameAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const gameId = String(formData.get("gameId") ?? "");
  if (!gameId) redirect("/game");

  const current = await db.query.game.findFirst({
    where: eq(game.id, gameId),
    with: { players: true },
  });
  if (
    !current ||
    current.hostId !== userId ||
    current.status !== "lobby" ||
    current.players.length < 2
  ) {
    redirect(`/game/${gameId}`);
  }

  await db
    .update(game)
    .set({
      status: "playing",
      sequence: generateSequence(current.stimuliCount, current.nValue),
      startedAt: Date.now(),
    })
    .where(eq(game.id, gameId));

  redirect(`/game/${gameId}`);
}
