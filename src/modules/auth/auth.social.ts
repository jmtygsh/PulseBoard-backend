
import { User } from "./auth.model.js";
import {
    generateAccessToken,
    generateRefreshToken,
} from "../../common/utils/jwt.utils.js";

// import {
//   sendVerificationEmail,
//   sendResetPasswordEmail,
// } from "../../common/config/email.js";

// import constants 
import ApiError from "../../common/utils/api-error.js";
import type { SocialAuthType } from "./dto/dto.register.js";
import { hashToken } from "../../common/utils/hashToken.js";

const socialAuthLogic = async (socialProfileData: SocialAuthType) => {
    const { email, name, providerUserId, avatarUrl } = socialProfileData;

    // 1. Check if the user already exists by email
    let user = await User.findOne({ email });

    if (!user) {
        // 2. User doesn't exist, create user
        user = await User.create({
            name: name,
            email: email,
            ...(avatarUrl && { avatarUrl }), // spread operator to store everything
            isVerified: true,
            provider: "google",
            providerUserId: providerUserId,
        });

        if (!user) {
            throw ApiError.badRequest("Failed to create user account.");
        }
    }

    // 3. Generate tokens for both login and register flows
    const userIdStr = user._id.toString();
    const accessToken = generateAccessToken({ id: userIdStr });
    const refreshToken = generateRefreshToken({ id: userIdStr });

    user.refreshToken = hashToken(refreshToken);
    await user.save();

    return {
        user: { id: userIdStr, name: user.name, email: user.email },
        accessToken,
        refreshToken
    };
};

export {
    socialAuthLogic,
}