import { router, protectedProcedure } from "@/server/trpc";
import { gameRouter } from "./game";

export const appRouter = router({
  game: gameRouter,
  me: protectedProcedure.query(({ ctx }) => ({
    id: ctx.user.id,
    name: ctx.user.name,
    email: ctx.user.email,
  })),
});

export type AppRouter = typeof appRouter;

