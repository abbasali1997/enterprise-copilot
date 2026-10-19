import { type DbClient, type Prisma, prisma } from "@enterprise/db";

export const findAll = (
  args: Prisma.ConversationFindManyArgs,
  db: DbClient = prisma,
) => db.conversation.findMany(args);

export const findConversationById = (id: string, db: DbClient = prisma) =>
  db.conversation.findUnique({ where: { id } });

export const createConversation = (
  input: {
    userId: string;
    organizationId: string;
    title: string;
    assistantId?: string;
  },
  db: DbClient = prisma,
) =>
  db.conversation.create({
    data: {
      title: input.title,
      assistantId: input.assistantId ?? "000", // TODO: Dummy ID complete this when introducing assistants
      organizationId: input.organizationId,
      userId: input.userId,
    },
  });

export const createMessage = (
  data: Prisma.MessageUncheckedCreateInput,
  db: DbClient = prisma,
) => db.message.create({ data });

export const findUserConversation = (
  conversationId: string,
  userId: string,
  organizationId: string,
  db: DbClient = prisma,
) =>
  db.conversation.findFirst({
    where: { id: conversationId, userId, organizationId, status: "ACTIVE" },
    include: { messages: true },
  });

export const renameUserConversation = (
  conversationId: string,
  title: string,
  userId: string,
  organizationId: string,
  db: DbClient = prisma,
) =>
  db.conversation.update({
    where: { id: conversationId, userId, organizationId, status: "ACTIVE" },
    data: { title },
  });
