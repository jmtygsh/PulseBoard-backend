import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    integer,
    json,
    jsonb,
} from "drizzle-orm/pg-core";

/* =========================
   USERS
========================= */
const usersTable = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password"),
    avatarUrl: text("avatar_url"),

    isVerified: boolean("is_verified").default(false),

    verificationToken: text("verification_token"),
    refreshToken: text("refresh_token"),
    resetPasswordToken: text("reset_password_token"),
    resetPasswordExpiresAt: timestamp("reset_password_expires_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

/* =========================
   SOCIAL LOGIN PROVIDERS
========================= */
const authProvidersTable = pgTable("auth_providers", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .references(() => usersTable.id)
        .notNull(),
    provider: varchar("provider", { length: 50 }).notNull(), // google/github
    providerUserId: text("provider_user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

/* =========================
   PASSWORD RESET
========================= */
const passwordResetTokensTable = pgTable("password_reset_tokens", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .references(() => usersTable.id)
        .notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});



export { usersTable, authProvidersTable, passwordResetTokensTable };