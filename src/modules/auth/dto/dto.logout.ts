import { z } from "zod";

export const LogoutUserSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
});

export type LogoutUserType = z.infer<typeof LogoutUserSchema>;
