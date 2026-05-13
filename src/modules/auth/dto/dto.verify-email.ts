import { z } from "zod";

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export type VerifyEmailType = z.infer<typeof VerifyEmailSchema>;
