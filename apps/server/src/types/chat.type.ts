import { z } from "zod";
import { sendMessageInputSchema } from "../schemas/chat.schema.js";

export type SendMessageInputType = z.infer<typeof sendMessageInputSchema>;
