"use client";

interface Player {
  userId: string;
  score: number;
  errorCount: number;
  user: { name: string };
}

interface ScoreboardProps {
  players: Player[];
  currentUserId: string;
}

export function Scoreboard({ players, currentUserId }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="w-full max-w-xs">
      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Scores</h3>
      <div className="flex flex-col gap-1">
        {sorted.map((p, i) => (
          <div
            key={p.userId}
            className={[
              "flex items-center justify-between rounded px-3 py-1.5 text-sm",
              p.userId === currentUserId ? "bg-blue-500/20 font-semibold" : "bg-muted",
            ].join(" ")}
          >
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground w-4">{i + 1}.</span>
              <span>{p.user.name}</span>
            </span>
            <span className="tabular-nums">
              {p.score}
              <span className="text-muted-foreground text-xs ml-1">
                ({p.errorCount}✗)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
