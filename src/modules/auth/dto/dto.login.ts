import { z } from "zod"

export const LoginUserSchema = z.object({
    email: z
        .string()
        .email()
        .transform((value) => value.toLowerCase()),
    password: z
        .string()
        .min(8)
        .regex(/(?=.*[A-Z])(?=.*\d)/, {
            message:
                "Password must contain at least one uppercase letter and one digit",
        }),
});

export type LoginUserType = z.infer<typeof LoginUserSchema>;