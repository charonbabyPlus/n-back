import { router, protectedProcedure } from "@/lib/trpc/server";
import { gameRouter } from "@/features/game/server/router";

export const appRouter = router({
  game: gameRouter,
  me: protectedProcedure.query(({ ctx }) => ({
    id: ctx.user.id,
    name: ctx.user.name,
    email: ctx.user.email,
  })),
});

export type AppRouter = typeof appRouter;

