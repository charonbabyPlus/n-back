import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { game } from "@/db/schema";
import { Button } from "@/components/ui/button";

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
    <div className="max-w-lg mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">N-back Multiplayer</h1>
        <form action="/game/create" method="post">
          <Button type="submit">New Game</Button>
        </form>
      </div>

      {games.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No open games. Create one!
        </p>
      )}

      <div className="flex flex-col gap-3">
        {games.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{g.host.name}&apos;s game</span>
              <span className="text-xs text-muted-foreground">
                {g.players.length}/4 players · n={g.nValue} · {g.stimuliCount} stimuli
              </span>
            </div>
            {g.hostId === session.user.id ? (
              <form action="/game/dissolve" method="post">
                <input type="hidden" name="gameId" value={g.id} />
                <Button size="sm" variant="outline" type="submit">
                  Dissolve
                </Button>
              </form>
            ) : (
              <form action="/game/join" method="post">
                <input type="hidden" name="gameId" value={g.id} />
                <Button size="sm" variant="outline" type="submit">
                  Join
                </Button>
              </form>
            )}
          </div>
        ))}
      </div>

      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/game">Refresh</Link>
        </Button>
      </div>
    </div>
  );
}
