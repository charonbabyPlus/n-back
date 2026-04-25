import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { game } from "@/db/schema";
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
  });

  if (
    !existingGame ||
    existingGame.status !== "lobby" ||
    existingGame.hostId !== session.user.id
  ) {
    return NextResponse.redirect(getRedirectUrl(request, "/game"), 303);
  }

  await db.delete(game).where(eq(game.id, gameId));
  return NextResponse.redirect(getRedirectUrl(request, "/game"), 303);
}
