"use client";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";

interface Player {
  userId: string;
  user: { name: string };
}

interface LobbyProps {
  gameId: string;
  hostId: string;
  currentUserId: string;
  players: Player[];
}

export function Lobby({ gameId, hostId, currentUserId, players }: LobbyProps) {
  const utils = trpc.useUtils();
  const startMutation = trpc.game.start.useMutation({
    onSuccess: () => utils.game.get.invalidate({ gameId }),
  });

  const isHost = currentUserId === hostId;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <h2 className="text-2xl font-bold">Waiting for players</h2>
      <p className="text-sm text-muted-foreground">
        Share this page URL with friends to join ({players.length}/4 joined)
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {players.map((p) => (
          <div
            key={p.userId}
            className="flex items-center gap-2 rounded bg-muted px-3 py-2 text-sm"
          >
            <span
              className={[
                "w-2 h-2 rounded-full",
                p.userId === hostId ? "bg-yellow-400" : "bg-green-400",
              ].join(" ")}
            />
            <span>{p.user.name}</span>
            {p.userId === hostId && (
              <span className="ml-auto text-xs text-muted-foreground">host</span>
            )}
          </div>
        ))}
      </div>
      {isHost ? (
        <Button
          onClick={() => startMutation.mutate({ gameId })}
          disabled={players.length < 2 || startMutation.isPending}
        >
          {startMutation.isPending
            ? "Starting…"
            : players.length < 2
              ? "Need at least 2 players"
              : "Start Game"}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground animate-pulse">
          Waiting for host to start…
        </p>
      )}
    </div>
  );
}
