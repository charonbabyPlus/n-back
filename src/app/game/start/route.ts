import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { game } from "@/db/schema";
import { generateSequence } from "@/game/sequence";
import { getRedirectUrl } from "@/lib/request-origin";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.redirect(getRedirectUrl(request, "/login"), 303);
  }

  const formData = await request.formData();
  const gameId = String(formData.get("gameId") ?? "");
  if (!gameId) {
    return NextResponse.redirect(getRedirectUrl(request, "/game"), 303);
  }

  const currentGame = await db.query.game.findFirst({
    where: eq(game.id, gameId),
    with: { players: true },
  });

  if (!currentGame) {
    return NextResponse.redirect(getRedirectUrl(request, "/game"), 303);
  }

  if (
    currentGame.hostId !== session.user.id ||
    currentGame.status !== "lobby" ||
    currentGame.players.length < 2
  ) {
    return NextResponse.redirect(getRedirectUrl(request, `/game/${gameId}`), 303);
  }

  await db
    .update(game)
    .set({
      status: "playing",
      sequence: generateSequence(currentGame.stimuliCount, currentGame.nValue),
      startedAt: Date.now(),
    })
    .where(eq(game.id, gameId));

  return NextResponse.redirect(getRedirectUrl(request, `/game/${gameId}`), 303);
}
