import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { game, gamePlayers } from "@/db/schema";
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

  const existingGame = await db.query.game.findFirst({
    where: eq(game.id, gameId),
    with: { players: true },
  });

  if (!existingGame || existingGame.status !== "lobby") {
    return NextResponse.redirect(getRedirectUrl(request, "/game"), 303);
  }

  if (existingGame.players.some((player) => player.userId === session.user.id)) {
    return NextResponse.redirect(getRedirectUrl(request, `/game/${gameId}`), 303);
  }

  if (existingGame.players.length >= 4) {
    return NextResponse.redirect(getRedirectUrl(request, "/game"), 303);
  }

  await db.insert(gamePlayers).values({
    id: crypto.randomUUID(),
    gameId,
    userId: session.user.id,
  });

  return NextResponse.redirect(getRedirectUrl(request, `/game/${gameId}`), 303);
}
