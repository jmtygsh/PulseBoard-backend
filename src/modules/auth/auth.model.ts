import mongoose from "mongoose";
import { hash, compare } from 'bcrypt';


const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: 255,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 255,
        },
        password: {
            type: String,
            select: false,
        },
        provider: { // social or credential
            type: String,
            required: true,
            maxlength: 50,
        },
        providerUserId: {
            type: String,
            required: true,
        },
        avatarUrl: {
            type: String,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: { type: String, select: false },
        refreshToken: { type: String, select: false },
        resetPasswordToken: { type: String, select: false },
        resetPasswordExpiresAt: { type: Date, select: false },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) return;
    this.password = await hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword: string) {
    return compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);

