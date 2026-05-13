import { z } from "zod";

export const LogoutUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

export type LogoutUserType = z.infer<typeof LogoutUserSchema>;
