// schemas

import { RegisterUserSchema, SocialAuthSchema } from "./dto.register.js";
import { LoginUserSchema } from "./dto.login.js";
import { VerifyEmailSchema } from "./dto.verify-email.js";
import { ForgotPasswordSchema } from "./dto.forgetpassword.js";
import { ResetPasswordSchema } from "./dto.resetpassword.js";
import { RefreshTokenSchema } from "./dto.refresh.js";
import { LogoutUserSchema } from "./dto.logout.js";

export {
    RegisterUserSchema,
    SocialAuthSchema,
    RefreshTokenSchema,
    LogoutUserSchema,
    LoginUserSchema,
    VerifyEmailSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema
};



// types 
import type { RegisterUserType } from "./dto.register.js";
import type { LoginUserType } from "./dto.login.js";
import type { RefreshTokenType } from "./dto.refresh.js";
import type { LogoutUserType } from "./dto.logout.js";
import type { VerifyEmailType } from "./dto.verify-email.js";
import type { ForgotPasswordType } from "./dto.forgetpassword.js";
import type { ResetPasswordType } from "./dto.resetpassword.js";

export type { RegisterUserType, LoginUserType, RefreshTokenType, LogoutUserType, VerifyEmailType, ForgotPasswordType, ResetPasswordType };
