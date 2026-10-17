import { z } from "zod";
import { sendMessageInputSchema } from "../schemas/conversation.schema.js";

export type SendMessageInputType = z.infer<typeof sendMessageInputSchema>;
