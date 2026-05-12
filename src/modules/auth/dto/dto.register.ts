import { z } from "zod";

/**
 * Normal email/password registration
 */
export const RegisterUserSchema = z.object({
    name: z.string().trim().min(2).max(50),
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
    avatarUrl: z.string().url().optional(),
    verificationToken: z.string().optional(),
    isVerified: z.boolean().default(false),
});

export type RegisterUserType = z.infer<typeof RegisterUserSchema>;


/**
 * Social auth registration/login
 */
export const SocialAuthSchema = z.object({
    name: z.string().trim().min(2).max(50),
    email: z
        .string()
        .email()
        .transform((value) => value.toLowerCase()),
    providerUserId: z.string().min(1),
    avatarUrl: z.string().url().optional(),
});

export type SocialAuthType = z.infer<typeof SocialAuthSchema>;