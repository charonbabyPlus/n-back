"use client";

import { useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";

interface GameRoomSyncProps {
  status: "lobby" | "playing" | "finished";
}

export function GameRoomSync({ status }: GameRoomSyncProps) {
  const router = useRouter();

  useEffect(() => {
    if (status === "finished") {
      return;
    }

    const intervalMs = status === "playing" ? 1000 : 2000;
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [router, status]);

  return null;
}
