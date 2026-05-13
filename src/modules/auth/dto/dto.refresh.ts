import { z } from "zod";

export const RefreshTokenSchema = z.object({
  token: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>;
