import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
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

  const currentGame = await db.query.game.findFirst({
    where: eq(game.id, gameId),
    with: { players: true },
  });

  if (!currentGame || currentGame.status !== "lobby") {
    return NextResponse.redirect(getRedirectUrl(request, "/game"), 303);
  }

  if (currentGame.hostId === session.user.id) {
    await db.delete(game).where(eq(game.id, gameId));
    return NextResponse.redirect(getRedirectUrl(request, "/game"), 303);
  }

  await db
    .delete(gamePlayers)
    .where(and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.userId, session.user.id)));

  return NextResponse.redirect(getRedirectUrl(request, "/game"), 303);
}
