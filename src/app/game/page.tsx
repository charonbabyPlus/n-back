import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/features/auth/server/auth";
import { db } from "@/lib/db/drizzle";
import { game } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { AutoRefresh } from "@/components/auto-refresh";
import {
  createGameAction,
  joinGameAction,
  dissolveGameAction,
} from "@/features/game/server/actions";

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  return session;
}

export default async function GameListPage() {
  const session = await requireSession();

  const games = await db.query.game.findMany({
    where: eq(game.status, "lobby"),
    with: { players: { with: { user: true } }, host: true },
    orderBy: (g, { desc }) => [desc(g.createdAt)],
  });

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-8">
      <AutoRefresh intervalMs={5000} />

      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard">← Back</Link>
        </Button>
        <div className="ml-auto" />
        <form action={createGameAction}>
          <Button type="submit">+ New Game</Button>
        </form>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Multiplayer Lobby</h1>
        <p className="text-sm text-muted-foreground">
          Join an open game or create your own. Games start when the host has
          at least 2 players.
        </p>
      </div>

      {games.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 flex flex-col items-center gap-3 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-2xl">
            ◯
          </div>
          <p className="font-medium">No open games right now</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Be the first to create a game. Others will see it here and can
            join.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider px-1">
            <span>{games.length} open {games.length === 1 ? "game" : "games"}</span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
              live
            </span>
          </div>
          {games.map((g) => {
            const isHost = g.hostId === session.user.id;
            const isJoined = g.players.some((p) => p.userId === session.user.id);
            const isFull = g.players.length >= 4;
            return (
              <div
                key={g.id}
                className="rounded-xl border bg-card p-4 flex flex-col gap-4 transition-colors hover:border-foreground/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 shrink-0 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-sm font-semibold">
                      {g.host.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {g.host.name}&apos;s game
                        {isHost && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            (you host)
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        n={g.nValue} · {g.stimuliCount} stimuli ·{" "}
                        {g.initialIntervalMs / 1000}s/stim
                      </span>
                    </div>
                  </div>

                  {isHost ? (
                    <form action={dissolveGameAction}>
                      <input type="hidden" name="gameId" value={g.id} />
                      <Button size="sm" variant="outline" type="submit">
                        Dissolve
                      </Button>
                    </form>
                  ) : isJoined ? (
                    <Button asChild size="sm">
                      <Link href={`/game/${g.id}`}>Open</Link>
                    </Button>
                  ) : (
                    <form action={joinGameAction}>
                      <input type="hidden" name="gameId" value={g.id} />
                      <Button size="sm" type="submit" disabled={isFull}>
                        {isFull ? "Full" : "Join"}
                      </Button>
                    </form>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {g.players.map((p) => (
                      <div
                        key={p.userId}
                        title={p.user.name}
                        className={[
                          "size-7 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium",
                          p.userId === g.hostId
                            ? "bg-yellow-400/30 text-yellow-700 dark:text-yellow-300"
                            : "bg-green-400/30 text-green-700 dark:text-green-300",
                        ].join(" ")}
                      >
                        {p.user.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {Array.from({ length: 4 - g.players.length }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="size-7 rounded-full border-2 border-dashed border-muted-foreground/30 bg-background"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                    {g.players.length}/4 players
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Auto-refreshing every 5 seconds
      </p>
    </div>
  );
}
