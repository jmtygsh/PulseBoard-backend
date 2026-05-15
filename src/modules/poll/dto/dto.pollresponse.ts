import { z } from "zod";

export const AnswerPollSchema = z.object({
    userId: z.string().optional(),
    anonymousId: z.string().optional(),
    answers: z.record(
        z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
        z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
        {
            message: "Answers are required",
        }
    ),
});

export type AnswerPollType = z.infer<typeof AnswerPollSchema>;
