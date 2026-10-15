import { type Prisma, prisma } from "@enterprise/db";

export const findConversationById = (id: string) =>
  prisma.conversation.findUnique({ where: { id } });

export const createConversation = (input: {
  userId: string;
  organizationId: string;
  title: string;
  assistantId?: string;
}) =>
  prisma.conversation.create({
    data: {
      title: input.title,
      assistantId: input.assistantId ?? "000", // TODO: Dummy ID complete this when introducing assistants
      organizationId: input.organizationId,
      userId: input.userId,
    },
  });

export const createMessage = (data: Prisma.MessageUncheckedCreateInput) =>
  prisma.message.create({ data });
