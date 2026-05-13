import { z } from "zod";

export const ResetPasswordSchema = z.object({
    token: z.string().min(1, "Reset token is required"),
    password: z
        .string()
        .min(8)
        .regex(/(?=.*[A-Z])(?=.*\d)/, {
            message:
                "Password must contain at least one uppercase letter and one digit",
        }),
});

export type ResetPasswordType = z.infer<typeof ResetPasswordSchema>;
