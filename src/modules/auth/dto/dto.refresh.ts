import { z } from "zod";

// Only used for types, not for validation (seem unnecessary to me)
// just following consistency code structure

export const RefreshTokenSchema = z.object({
  token: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>;
