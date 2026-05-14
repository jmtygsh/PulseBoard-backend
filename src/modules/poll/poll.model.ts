import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { usersTable } from "../auth/auth.model.js";

//  poll table
const pollsTable = pgTable("polls", {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
        .references(() => usersTable.id)
        .notNull(),  // -- references user table - id

    title: varchar("title", { length: 255 }).notNull(), // -- poll title
    description: text("description").notNull(), // -- poll description

    status: varchar("status", { length: 30 }).notNull(), // draft/published/expired/results_published

    requireAuth: boolean("require_auth").default(false).notNull(), // false = anonymous allowed, true = login required

    expiresAt: timestamp("expires_at"), // -- poll expires time
    publishedAt: timestamp("published_at"), // -- poll published time

    shareSlug: varchar("share_slug", { length: 255 }).notNull().unique(), // -- poll share slug

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});



//  question table
const questionsTable = pgTable("questions", {
    id: uuid("id").defaultRandom().primaryKey(),
    pollId: uuid("poll_id")
        .references(() => pollsTable.id)
        .notNull(),

    questionText: text("question_text").notNull(),

    isRequired: boolean("is_required").default(false),

    displayOrder: integer("display_order").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

//  question choice options table
const questionOptionsTable = pgTable("question_options", {
    id: uuid("id").defaultRandom().primaryKey(),
    questionId: uuid("question_id")
        .references(() => questionsTable.id)
        .notNull(),
    optionText: text("option_text").notNull(),
    displayOrder: integer("display_order").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

//  who response table
const responsesTable = pgTable("responses", {
    id: uuid("id").defaultRandom().primaryKey(),
    pollId: uuid("poll_id").references(() => pollsTable.id).notNull(),

    // Nullable because anonymous users won't have an ID
    userId: uuid("user_id").references(() => usersTable.id),

    // For tracking anonymous users to enforce 1-response-per-poll
    anonymousId: varchar("anonymous_id", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

// his response answer store tabole 
const responseAnswersTable = pgTable("response_answers", {
    id: uuid("id").defaultRandom().primaryKey(),

    responseId: uuid("response_id")
        .references(() => responsesTable.id)
        .notNull(),
    questionId: uuid("question_id")
        .references(() => questionsTable.id)
        .notNull(),

    selectedOptionId: uuid("selected_option_id")
        .references(() => questionOptionsTable.id)
        .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});


// relations of poll with questions & question choice options
const pollsRelations = relations(pollsTable, ({ many }) => ({
    questions: many(questionsTable),
}));

const questionsRelations = relations(questionsTable, ({ one, many }) => ({
    poll: one(pollsTable, {
        fields: [questionsTable.pollId],
        references: [pollsTable.id],
    }),
    options: many(questionOptionsTable),
}));

const questionOptionsRelations = relations(questionOptionsTable, ({ one }) => ({
    question: one(questionsTable, {
        fields: [questionOptionsTable.questionId],
        references: [questionsTable.id],
    }),
}));


export {
    pollsTable,
    questionsTable,
    questionOptionsTable,
    responsesTable,
    responseAnswersTable,
    pollsRelations,
    questionsRelations,
    questionOptionsRelations
};