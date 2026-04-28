import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/features/auth/server/auth";
import { db } from "@/lib/db/drizzle";
import { game, gamePlayers } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";

export default async function HistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const userId = session.user.id;

  const myParticipations = await db.query.gamePlayers.findMany({
    where: eq(gamePlayers.userId, userId),
  });
  const gameIds = myParticipations.map((p) => p.gameId);

  const games = gameIds.length
    ? await db.query.game.findMany({
        where: inArray(game.id, gameIds),
        with: { players: { with: { user: true } } },
        orderBy: [desc(game.createdAt)],
      })
    : [];

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard">← Back</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Game History</h1>
        <p className="text-sm text-muted-foreground">
          Multiplayer games you&apos;ve played. Solo runs aren&apos;t recorded.
        </p>
      </div>

      {games.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 flex flex-col items-center gap-3 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-2xl">
            ◌
          </div>
          <p className="font-medium">No games yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Finish a multiplayer match and it&apos;ll show up here.
          </p>
          <Button asChild className="mt-2">
            <Link href="/game">Find a game</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {games.map((g) => {
            const sorted = [...g.players].sort((a, b) => b.score - a.score);
            const me = sorted.find((p) => p.userId === userId);
            const winner = sorted[0];
            const myRank = sorted.findIndex((p) => p.userId === userId) + 1;
            const isWinner = winner?.userId === userId;
            const finishedDate = g.finishedAt
              ? new Date(g.finishedAt).toLocaleString()
              : null;

            return (
              <div
                key={g.id}
                className="rounded-xl border bg-card p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={[
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          g.status === "finished"
                            ? "bg-muted text-muted-foreground"
                            : g.status === "playing"
                              ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                              : "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
                        ].join(" ")}
                      >
                        {g.status}
                      </span>
                      {g.status === "finished" && (
                        <span
                          className={[
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            isWinner
                              ? "bg-green-500/15 text-green-700 dark:text-green-300"
                              : "bg-muted text-muted-foreground",
                          ].join(" ")}
                        >
                          {isWinner ? "🏆 win" : `#${myRank}`}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        n={g.nValue} · {g.stimuliCount} stimuli
                      </span>
                    </div>
                    {finishedDate && (
                      <span className="text-xs text-muted-foreground">
                        {finishedDate}
                      </span>
                    )}
                  </div>
                  {me && (
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-2xl font-bold tabular-nums">
                        {me.score}
                        <span className="text-sm text-muted-foreground font-normal">
                          /{g.stimuliCount}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {me.errorCount} error{me.errorCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 pt-2 border-t">
                  {sorted.map((p, i) => (
                    <div
                      key={p.userId}
                      className={[
                        "flex items-center justify-between text-sm",
                        p.userId === userId
                          ? "font-semibold"
                          : "text-muted-foreground",
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-4 shrink-0">
                          {i + 1}.
                        </span>
                        <span className="truncate">
                          {p.user.name}
                          {p.userId === userId && " (you)"}
                        </span>
                      </span>
                      <span className="tabular-nums shrink-0">
                        {p.score}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({p.errorCount}✗)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
