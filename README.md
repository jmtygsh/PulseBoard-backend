# PulseBoard Backend

This is the backend service for PulseBoard, built with the PERN stack (PostgreSQL, Express, Node.js) and Drizzle ORM.

## Folder Structure

```
src/
├── common/             # Shared utilities and configurations
│   ├── config/         # App configs (CORS, Database, Socket.io)
│   ├── middleware/     # Express middlewares (Validation, Auth, Error Handling)
│   ├── types/          # Global TypeScript definitions
│   └── utils/          # Helper functions (API Response/Error, JWT, Hashing)
├── modules/            # Feature-based modules
│   ├── auth/           # Authentication and User management
│   │   ├── dto/        # Zod validation schemas
│   │   ├── auth.controller.ts  # Route handlers
│   │   ├── auth.model.ts       # Database queries/operations
│   │   ├── auth.routes.ts      # Express route definitions
│   │   ├── auth.service.ts     # Business logic
│   │   └── auth.social.ts      # Social auth logic (if applicable)
│   └── poll/           # Poll creation and management
│       ├── dto/        # Zod validation schemas
│       ├── poll.controller.ts  # Route handlers
│       ├── poll.model.ts       # Database queries/operations
│       ├── poll.routes.ts      # Express route definitions
│       └── poll.service.ts     # Business logic
├── app.ts              # Express app setup and middleware registration
└── server.ts           # Server entry point and initialization
```

## API Routes & Handlers

Base URL: `/api`

### Auth Routes (`/api/auth`)

Handled by: `src/modules/auth/auth.controller.ts`

| Method | Endpoint | Access | Handler Method | Description |
|---|---|---|---|---|
| POST | `/register` | Public | `register` | Register a new user |
| POST | `/login` | Public | `login` | Authenticate user and issue tokens |
| POST | `/refresh-token` | Public | `refreshToken` | Issue new access token using refresh token |
| GET | `/verify-email/:token` | Public | `verifyEmail` | Verify a user's email address |
| POST | `/forgot-password` | Public | `forgotPassword` | Initiate password reset flow |
| PUT | `/reset-password/:token` | Public | `resetPassword` | Complete password reset with token |
| POST | `/logout` | Protected | `logout` | Invalidate user session/tokens |
| GET | `/me` | Protected | `getMe` | Fetch current authenticated user profile |

### Poll Routes (`/api/polls`)

Handled by: `src/modules/poll/poll.controller.ts`

| Method | Endpoint | Access | Handler Method | Description |
|---|---|---|---|---|
| POST | `/create` | Protected | `createPoll` | Create a new poll with questions/options |
| GET | `/questions/:slug` | Public/Soft-Auth | `getPollBySlug` | Fetch poll details for voting |
| POST | `/answers/:slug` | Public/Soft-Auth | `answerPoll` | Submit a vote/response to a poll |
| GET | `/analytics/:slug` | Public/Soft-Auth | `getPollAnalytics` | Fetch results and statistics for a poll |
| GET | `/data/list` | Protected | `getPollData` | Fetch all polls created by the authenticated user |

> **Note on Soft-Auth**: Endpoints marked as `Public/Soft-Auth` use the `checkAuthenticate` middleware to parse the user token if it exists (for authenticated tracking) but do not block anonymous users if the poll settings allow it.
