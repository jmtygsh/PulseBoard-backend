import { z } from "zod";

export const AnswerPollSchema = z.object({
    userId: z.string().optional(),
    anonymousId: z.string().optional(),
    answers: z.record(z.string().uuid(), z.string().uuid(), {
        message: "Answers are required",
    }),
});

export type AnswerPollType = z.infer<typeof AnswerPollSchema>;
