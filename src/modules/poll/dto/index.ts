// schema

import { CreatePollSchema } from "./dto.createpoll.js";
import { AnswerPollSchema } from "./dto.pollresponse.js";

export { CreatePollSchema, AnswerPollSchema };


// types 
import type { CreatePollType } from "./dto.createpoll.js";
import type { AnswerPollType } from "./dto.pollresponse.js";
import type { GetPollType } from "./dto.getpoll.js";

export type { CreatePollType, AnswerPollType, GetPollType };
