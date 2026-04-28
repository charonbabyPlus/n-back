import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "@/lib/trpc/server";
import { game, gamePlayers } from "@/lib/db/schema";
import { generateSequence } from "@/features/game/shared/sequence";
import { submitAnswerForPlayer } from "@/features/game/server/service";

const newId = () => crypto.randomUUID();

export const gameRouter = router({
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const id = newId();
    await ctx.db.insert(game).values({ id, hostId: ctx.user.id });
    await ctx.db
      .insert(gamePlayers)
      .values({ id: newId(), gameId: id, userId: ctx.user.id });
    return { gameId: id };
  }),

  listOpen: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.game.findMany({
      where: eq(game.status, "lobby"),
      with: { players: { with: { user: true } }, host: true },
      orderBy: (g, { desc }) => [desc(g.createdAt)],
    });
  }),

  get: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ ctx, input }) => {
      const g = await ctx.db.query.game.findFirst({
        where: eq(game.id, input.gameId),
        with: { players: { with: { user: true } } },
      });
      if (!g) throw new TRPCError({ code: "NOT_FOUND" });
      return g;
    }),

  join: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const g = await ctx.db.query.game.findFirst({
        where: eq(game.id, input.gameId),
        with: { players: true },
      });
      if (!g) throw new TRPCError({ code: "NOT_FOUND" });
      if (g.status !== "lobby")
        throw new TRPCError({ code: "BAD_REQUEST", message: "Game already started" });
      if (g.players.length >= 4)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Game is full" });
      if (g.players.some((p) => p.userId === ctx.user.id))
        return { gameId: input.gameId };

      await ctx.db
        .insert(gamePlayers)
        .values({ id: newId(), gameId: input.gameId, userId: ctx.user.id });
      return { gameId: input.gameId };
    }),

  start: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const g = await ctx.db.query.game.findFirst({
        where: eq(game.id, input.gameId),
        with: { players: true },
      });
      if (!g) throw new TRPCError({ code: "NOT_FOUND" });
      if (g.hostId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (g.status !== "lobby")
        throw new TRPCError({ code: "BAD_REQUEST", message: "Game already started" });
      if (g.players.length < 2)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Need at least 2 players to start",
        });

      const sequence = generateSequence(g.stimuliCount, g.nValue);
      await ctx.db
        .update(game)
        .set({ status: "playing", sequence, startedAt: Date.now() })
        .where(eq(game.id, input.gameId));
      return { ok: true };
    }),

  submitAnswer: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        stimulusIndex: z.number().int().min(0),
        pressed: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      submitAnswerForPlayer({
        database: ctx.db,
        gameId: input.gameId,
        userId: ctx.user.id,
        stimulusIndex: input.stimulusIndex,
        pressed: input.pressed,
      })),
});
