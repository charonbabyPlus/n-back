import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/features/auth/server/auth";
import { db } from "@/lib/db/drizzle";
import { game } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";

const MIN_GAMES = 1;

export default async function LeaderboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const meId = session.user.id;

  const finishedGames = await db.query.game.findMany({
    where: eq(game.status, "finished"),
    with: { players: { with: { user: true } } },
  });

  type Stat = {
    userId: string;
    name: string;
    wins: number;
    games: number;
    totalScore: number;
  };
  const stats = new Map<string, Stat>();

  for (const g of finishedGames) {
    if (g.players.length === 0) continue;
    const maxScore = Math.max(...g.players.map((p) => p.score));
    for (const p of g.players) {
      const s = stats.get(p.userId) ?? {
        userId: p.userId,
        name: p.user.name,
        wins: 0,
        games: 0,
        totalScore: 0,
      };
      s.games += 1;
      s.totalScore += p.score;
      if (p.score === maxScore) s.wins += 1;
      stats.set(p.userId, s);
    }
  }

  const ranked = Array.from(stats.values())
    .filter((s) => s.games >= MIN_GAMES)
    .map((s) => ({ ...s, winRate: s.wins / s.games }))
    .sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.totalScore - a.totalScore;
    });

  const myEntry = ranked.find((r) => r.userId === meId);
  const myRank = myEntry ? ranked.indexOf(myEntry) + 1 : null;

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard">← Back</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Players ranked by win rate across all finished multiplayer games.
          Ties (shared high score) count as wins for everyone tied.
        </p>
      </div>

      {myEntry && myRank !== null && (
        <div className="rounded-xl border bg-linear-to-br from-amber-500/10 to-transparent p-4 flex items-center gap-4">
          <div className="size-10 rounded-full bg-amber-500/20 flex items-center justify-center text-sm font-bold">
            #{myRank}
          </div>
          <div className="flex flex-col gap-0.5 flex-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Your standing
            </span>
            <span className="font-medium">
              {Math.round(myEntry.winRate * 100)}% win rate ·{" "}
              {myEntry.wins}/{myEntry.games} games
            </span>
          </div>
        </div>
      )}

      {ranked.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 flex flex-col items-center gap-3 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-2xl">
            ◌
          </div>
          <p className="font-medium">No ranked players yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Finish some multiplayer games to populate the leaderboard.
          </p>
          <Button asChild className="mt-2">
            <Link href="/game">Find a game</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {ranked.map((r, i) => {
            const isMe = r.userId === meId;
            const medal =
              i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <div
                key={r.userId}
                className={[
                  "rounded-xl border p-4 flex items-center gap-4",
                  isMe ? "bg-amber-500/5 border-amber-500/40" : "bg-card",
                ].join(" ")}
              >
                <div className="size-9 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-bold tabular-nums">
                  {medal ?? `#${i + 1}`}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="font-medium truncate">
                    {r.name}
                    {isMe && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {r.wins} win{r.wins === 1 ? "" : "s"} · {r.games} game
                    {r.games === 1 ? "" : "s"} · {r.totalScore} total points
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-2xl font-bold tabular-nums">
                    {Math.round(r.winRate * 100)}
                    <span className="text-sm text-muted-foreground font-normal">
                      %
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    win rate
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
