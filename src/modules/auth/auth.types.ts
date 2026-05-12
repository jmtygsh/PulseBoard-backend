export type RegisterUser = {
    name: string;
    email: string;
    password: string;
    avatarUrl?: string;
    verificationToken?: string;
    isVerified?: boolean;
}

export type socialAuth = {
    name: string,
    email: string,
    providerUserId: string,
    avatarUrl?: string
}