import { z } from "zod";

export const CreatePollSchema = z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId").optional().describe("User ID"),
    title: z.string().trim().min(1, "Title is required").max(255),
    description: z.string().trim().min(1, "Description is required"),
    requireAuth: z.boolean().default(false),
    status: z.enum(["draft", "published"]).default("published"),
    expiresAt: z.string().datetime().optional(),
    questions: z.array(
        z.object({
            questionText: z.string().trim().min(1, "Question text is required"),
            isRequired: z.boolean().default(true),
            options: z.array(
                z.string().trim().min(1, "Option cannot be empty")
            ).min(2, "Each question must have at least 2 options")
        })
    ).min(1, "Poll must have at least one question"),
});

export type CreatePollType = z.infer<typeof CreatePollSchema>;
