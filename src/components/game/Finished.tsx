"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Scoreboard } from "./Scoreboard";

interface Player {
  userId: string;
  score: number;
  errorCount: number;
  user: { name: string };
}

interface FinishedProps {
  players: Player[];
  currentUserId: string;
}

export function Finished({ players, currentUserId }: FinishedProps) {
  const router = useRouter();
  const winner = [...players].sort((a, b) => b.score - a.score)[0];

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <h2 className="text-2xl font-bold">Game Over</h2>
      {winner && (
        <p className="text-muted-foreground">
          Winner: <span className="font-semibold text-foreground">{winner.user.name}</span>
        </p>
      )}
      <Scoreboard players={players} currentUserId={currentUserId} />
      <Button onClick={() => router.push("/game")}>Back to lobby</Button>
    </div>
  );
}
