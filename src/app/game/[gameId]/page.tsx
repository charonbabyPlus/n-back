import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { game } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { catchUpMissedAnswers } from "@/server/game-service";
import { Playing } from "@/components/game/Playing";
import { AutoRefresh } from "@/components/auto-refresh";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  return session;
}

export default async function GameRoomPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const session = await requireSession();
  const { gameId } = await params;

  const currentGame = await db.query.game.findFirst({
    where: eq(game.id, gameId),
    with: { players: { with: { user: true } } },
  });

  if (!currentGame) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Game not found.</p>
      </div>
    );
  }

  const currentUserId = session.user.id;
  const now = Date.now();

  if (currentGame.status === "playing") {
    await catchUpMissedAnswers({
      gameId,
      userId: currentUserId,
      now,
    });
  }

  const freshGame = await db.query.game.findFirst({
    where: eq(game.id, gameId),
    with: { players: { with: { user: true } } },
  });

  if (!freshGame) {
    redirect("/game");
  }

  const sortedPlayers = [...freshGame.players].sort((a, b) => b.score - a.score);
  const finalWinner = sortedPlayers[0];
  const isFreshHost = freshGame.hostId === currentUserId;

  return (
    <div className="flex flex-col items-center min-h-screen py-8 px-4">
      {freshGame.status === "lobby" && <AutoRefresh intervalMs={2000} />}
      <h1 className="text-xl font-bold mb-6">Game Room</h1>

      {freshGame.status === "lobby" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="text-2xl font-bold">Waiting for players</h2>
          <p className="text-sm text-muted-foreground">
            Share this page URL with friends to join ({freshGame.players.length}/4 joined)
          </p>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {freshGame.players.map((player) => (
              <div
                key={player.userId}
                className="flex items-center gap-2 rounded bg-muted px-3 py-2 text-sm"
              >
                <span
                  className={[
                    "w-2 h-2 rounded-full",
                    player.userId === freshGame.hostId ? "bg-yellow-400" : "bg-green-400",
                  ].join(" ")}
                />
                <span>{player.user.name}</span>
                {player.userId === freshGame.hostId && (
                  <span className="ml-auto text-xs text-muted-foreground">host</span>
                )}
              </div>
            ))}
          </div>

          {isFreshHost ? (
            <div className="flex flex-col items-center gap-3">
              <form action="/game/start" method="post">
                <input type="hidden" name="gameId" value={gameId} />
                <Button
                  type="submit"
                  disabled={freshGame.players.length < 2}
                >
                  {freshGame.players.length < 2
                    ? "Need at least 2 players"
                  : "Start Game"}
                </Button>
              </form>
              <form action="/game/dissolve" method="post">
                <input type="hidden" name="gameId" value={gameId} />
                <Button type="submit" variant="outline">
                  Dissolve Lobby
                </Button>
              </form>
              <form action="/game/leave" method="post">
                <input type="hidden" name="gameId" value={gameId} />
                <Button type="submit" variant="ghost">
                  Leave Lobby
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground animate-pulse">
                Waiting for host to start…
              </p>
              <form action="/game/leave" method="post">
                <input type="hidden" name="gameId" value={gameId} />
                <Button type="submit" variant="outline">
                  Leave Lobby
                </Button>
              </form>
            </div>
          )}

          <Button asChild variant="ghost" size="sm">
            <Link href={`/game/${gameId}`}>Refresh</Link>
          </Button>
        </div>
      )}

      {freshGame.status === "playing" && (
        <Playing game={freshGame} currentUserId={currentUserId} />
      )}

      {freshGame.status === "finished" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <h2 className="text-2xl font-bold">Game Over</h2>
          {finalWinner && (
            <p className="text-muted-foreground">
              Winner: <span className="font-semibold text-foreground">{finalWinner.user.name}</span>
            </p>
          )}
          <div className="w-full max-w-xs">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Scores</h3>
            <div className="flex flex-col gap-1">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.userId}
                  className={[
                    "flex items-center justify-between rounded px-3 py-1.5 text-sm",
                    player.userId === currentUserId
                      ? "bg-blue-500/20 font-semibold"
                      : "bg-muted",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground w-4">{index + 1}.</span>
                    <span>{player.user.name}</span>
                  </span>
                  <span className="tabular-nums">
                    {player.score}
                    <span className="text-muted-foreground text-xs ml-1">
                      ({player.errorCount}✗)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Button asChild>
            <Link href="/game">Back to lobby</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
