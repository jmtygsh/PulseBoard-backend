import { z } from "zod";

export const GetPollSchema = z.object({
    slug: z.string().nonempty("Poll slug is required"),
    userId: z.string().optional(),
});

export type GetPollType = z.infer<typeof GetPollSchema>

