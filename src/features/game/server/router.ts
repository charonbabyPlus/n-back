import { z } from "zod";
import { router, protectedProcedure } from "@/lib/trpc/server";
import { submitAnswerForPlayer } from "@/features/game/server/service";

export const gameRouter = router({
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
      }),
    ),
});
