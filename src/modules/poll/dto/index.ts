// schema

import { CreatePollSchema } from "./dto.createpoll.js";
import { AnswerPollSchema } from "./dto.pollresponse.js";
import { GetPollDataSchema } from "./dto.getpolldata.js";

export { CreatePollSchema, AnswerPollSchema, GetPollDataSchema };


// types 
import type { CreatePollType } from "./dto.createpoll.js";
import type { AnswerPollType } from "./dto.pollresponse.js";
import type { GetPollType } from "./dto.getpoll.js";
import type { GetPollDataType } from "./dto.getpolldata.js";

export type { CreatePollType, AnswerPollType, GetPollType, GetPollDataType };
