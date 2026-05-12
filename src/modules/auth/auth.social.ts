
// import third party libraries
import { eq } from "drizzle-orm";


// import project files 
import { db } from "../../common/config/db.js";
import { authProvidersTable, usersTable } from "../../common/config/schema.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generateResetToken,
} from "../../common/utils/jwt.utils.js";

// import {
//   sendVerificationEmail,
//   sendResetPasswordEmail,
// } from "../../common/config/email.js";

// import constants 
import ApiError from "../../common/utils/api-error.js";
import type { socialAuth } from "./auth.types.js";



const socialAuthLogic = async (socialProfileData: socialAuth) => {
    const { email, name, providerUserId, avatarUrl } = socialProfileData;

    // 1. Check if the user already exists by email
    const [existingUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

    let user;

    if (existingUser) {
        // User exists, they are logging in
        user = existingUser;
    } else {
        // 2. User doesn't exist, create user and link provider inside a transaction
        user = await db.transaction(async (tx) => {
            // Create the user
            const [newUser] = await tx
                .insert(usersTable)
                .values({
                    name: name,
                    email: email,
                    avatarUrl: avatarUrl,
                    isVerified: true,
                })
                .returning({
                    id: usersTable.id,
                    name: usersTable.name,
                    email: usersTable.email,
                    createdAt: usersTable.createdAt,
                });

            if (!newUser) {
                throw ApiError.badRequest("Failed to create user account.");
            }

            // Link them to the Google Provider table
            await tx.insert(authProvidersTable).values({
                userId: newUser.id,
                provider: "google",
                providerUserId: providerUserId,
            });

            return newUser;
        });
    }

    // 3. Generate tokens for both login and register flows
    const accessToken = generateAccessToken({ id: user.id });
    const refreshToken = generateRefreshToken({ id: user.id });

    return {
        user: { id: user.id, name: user.name, email: user.email },
        accessToken,
        refreshToken
    };
};

export {
    socialAuthLogic,
}