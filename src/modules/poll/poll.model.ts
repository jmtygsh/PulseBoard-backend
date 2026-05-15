import mongoose from "mongoose";

// Question Option Sub-schema 
const questionOptionSchema = new mongoose.Schema({
    optionText: { type: String, required: true },
    displayOrder: { type: Number, required: true },
});

// Question Sub-schema
const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    isRequired: { type: Boolean, default: false },
    displayOrder: { type: Number, required: true },
    options: [questionOptionSchema],
});

// Poll Schema
const pollSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: { type: String, required: true, maxlength: 255 },
        description: { type: String, required: true },
        status: { type: String, required: true, maxlength: 30 }, // draft/published/expired/results_published
        requireAuth: { type: Boolean, default: false },
        expiresAt: { type: Date },
        publishedAt: { type: Date },
        shareSlug: { type: String, required: true, unique: true, maxlength: 255 },
        isDeleted: { type: Boolean, default: false },
        questions: [questionSchema], // Nested as JSON array
    },
    { timestamps: true }
);

// Response Answer Sub-schema
const responseAnswerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    selectedOptionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
});

// Response Schema
const responseSchema = new mongoose.Schema(
    {
        pollId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Poll",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        anonymousId: {
            type: String,
            maxlength: 255,
        },
        answers: [responseAnswerSchema], // Nested as JSON array
    },
    { timestamps: true }
);

// Public Result Schema (Stores polls that have made their results public)
const publicResultSchema = new mongoose.Schema(
    {
        pollId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Poll",
            required: true,
            unique: true, // A poll should only have one public result entry
        },
        isDeleted: { type: Boolean, default: false }, // Compatible with soft-delete feature
    },
    { timestamps: true }
);

const Poll = mongoose.model("Poll", pollSchema);
const Response = mongoose.model("Response", responseSchema);
const PublicResult = mongoose.model("PublicResult", publicResultSchema);

export { Poll, Response, PublicResult };
