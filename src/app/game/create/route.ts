import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { game, gamePlayers } from "@/db/schema";
import { getRedirectUrl } from "@/lib/request-origin";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.redirect(getRedirectUrl(request, "/login"), 303);
  }

  const gameId = crypto.randomUUID();

  await db.insert(game).values({ id: gameId, hostId: session.user.id });
  await db
    .insert(gamePlayers)
    .values({ id: crypto.randomUUID(), gameId, userId: session.user.id });

  return NextResponse.redirect(getRedirectUrl(request, `/game/${gameId}`), 303);
}
