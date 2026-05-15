import { z } from "zod";

export const GetPollDataSchema = z.object({
    userId: z.string().uuid({ message: "Invalid User ID format" }).describe("User ID"),
});

export type GetPollDataType = z.infer<typeof GetPollDataSchema>;
