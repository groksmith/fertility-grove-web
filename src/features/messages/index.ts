// Barrel: named re-exports of what other layers consume.

export { messageKeys, useConversation, useConversations } from "./hooks";
export { type MessageInput, messageSchema } from "./schema";
export { unreadMessages } from "./selectors";
export { messageService } from "./service";
export type { Conversation, ConversationKind, Message, MessagePolicy } from "./types";
