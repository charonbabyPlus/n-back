import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const initial = session.user.name.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Welcome back
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {session.user.name}
          </h1>
        </div>
        <div className="size-12 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-lg font-semibold">
          {initial}
        </div>
      </div>

      <div className="rounded-2xl border bg-linear-to-br from-blue-500/5 via-transparent to-purple-500/5 p-6 flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          N-back · 2 steps
        </p>
        <h2 className="text-xl font-semibold">Train your working memory</h2>
        <p className="text-sm text-muted-foreground">
          Watch a sequence of grid cells and call out repeats from two steps
          back. The faster you go, the harder it gets.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          href="/solo"
          className="group relative rounded-xl border p-5 flex flex-col gap-3 hover:border-foreground/30 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-lg bg-blue-500/15 flex items-center justify-center text-xl">
              ◐
            </div>
            <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-medium">Solo Practice</p>
            <p className="text-sm text-muted-foreground">
              Train 2-back on your own pace
            </p>
          </div>
        </Link>

        <Link
          href="/game"
          className="group relative rounded-xl border p-5 flex flex-col gap-3 hover:border-foreground/30 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-lg bg-purple-500/15 flex items-center justify-center text-xl">
              ⚔
            </div>
            <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-medium">Multiplayer</p>
            <p className="text-sm text-muted-foreground">
              Race opponents in real time
            </p>
          </div>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          href="/history"
          className="group rounded-xl border p-4 flex items-center gap-4 hover:border-foreground/30 hover:bg-muted/40 transition-colors"
        >
          <div className="size-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-xl shrink-0">
            🏆
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <p className="font-medium">Game History</p>
            <p className="text-sm text-muted-foreground">
              Past matches & scores
            </p>
          </div>
          <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>

        <Link
          href="/leaderboard"
          className="group rounded-xl border p-4 flex items-center gap-4 hover:border-foreground/30 hover:bg-muted/40 transition-colors"
        >
          <div className="size-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-xl shrink-0">
            📊
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <p className="font-medium">Leaderboard</p>
            <p className="text-sm text-muted-foreground">
              Top players by win rate
            </p>
          </div>
          <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>

      <div className="rounded-2xl border p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">How to play</h3>
          <span className="text-xs text-muted-foreground">~30s read</span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="size-6 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              1
            </span>
            <p className="text-sm text-muted-foreground pt-0.5">
              On a 3×3 grid, one cell lights up at a time — 20 stimuli per
              game, 2.5 seconds each.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="size-6 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              2
            </span>
            <p className="text-sm text-muted-foreground pt-0.5">
              Press{" "}
              <span className="inline-flex px-1.5 py-0.5 rounded bg-blue-500/20 text-foreground font-medium text-xs">
                Match!
              </span>{" "}
              when the current cell sits in the same position as the one shown{" "}
              <strong className="text-foreground">2 steps ago</strong>.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="size-6 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              3
            </span>
            <p className="text-sm text-muted-foreground pt-0.5">
              If there&apos;s no match, stay silent — wait for the next
              stimulus. Doing nothing is the correct answer too.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="size-6 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              4
            </span>
            <p className="text-sm text-muted-foreground pt-0.5">
              The first two stimuli have nothing to compare to, so the button
              stays disabled.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="size-6 shrink-0 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-medium">
              ⚔
            </span>
            <p className="text-sm text-muted-foreground pt-0.5">
              <strong className="text-foreground">Multiplayer twist:</strong>{" "}
              every 3 mistakes by <em>any</em> player speeds the game up by
              300ms (floor 700ms) — for everyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
