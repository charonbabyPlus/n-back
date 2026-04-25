import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitAnswerForPlayer } from "@/server/game-service";
import { getRedirectUrl } from "@/lib/request-origin";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.redirect(getRedirectUrl(request, "/login"), 303);
  }

  const formData = await request.formData();
  const gameId = String(formData.get("gameId") ?? "");
  const stimulusIndex = Number(formData.get("stimulusIndex"));

  if (!gameId || !Number.isInteger(stimulusIndex) || stimulusIndex < 0) {
    return NextResponse.redirect(getRedirectUrl(request, "/game"), 303);
  }

  await submitAnswerForPlayer({
    gameId,
    userId: session.user.id,
    stimulusIndex,
    pressed: true,
  });

  return NextResponse.redirect(getRedirectUrl(request, `/game/${gameId}`), 303);
}
