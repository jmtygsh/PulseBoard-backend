import * as z from "zod";

class RegisterDto {
    static schema = z.object({
        name: z.string().trim().min(2).max(50),
        email: z.string().email().lowercase(),
        password: z
            .string()
            .min(8)
            .regex(/(?=.*[A-Z])(?=.*\d)/, {
                message: "Password must contain at least one uppercase letter and one digit",
            }),
    });
}

export default RegisterDto;