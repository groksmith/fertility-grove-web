import { refresh } from "@/lib/api/query-client";
import { crisisOf, fail, failure, ok, type Result } from "@/lib/api/result";
import { get, set, uid } from "@/lib/mock-server";
import { notice } from "@/lib/notice";
import { detectCrisis } from "@/lib/rules/crisis";
import { MSG } from "@/lib/rules/validation";
import type { Conversation } from "@/types/domain";
import { messagesApi } from "./api";
import { messageKeys } from "./hooks";

/* -------------------------------------------------------------- Messages */

const isSupport = (id: string) => get().conversations.find((c) => c.id === id)?.kind === "support";
const handleOf = (memberId: string) =>
  get().members.find((m) => m.id === memberId)?.handle || memberId;

async function quietly(run: () => Promise<unknown>, undo?: () => void): Promise<Result> {
  try {
    await run();
    void refresh(messageKeys.all);
    return ok();
  } catch (error) {
    undo?.();
    const f = failure(error);
    if (!f.ok) notice(f.error);
    return f;
  }
}

function patchConv(id: string, patch: (c: Conversation) => Conversation | null) {
  set((s) => ({
    ...s,
    conversations: s.conversations.flatMap((c) => {
      if (c.id !== id) return [c];
      const next = patch(c);
      return next ? [next] : [];
    }),
  }));
}

export const messageService = {
  /** Who can message whom (PRD §14). The profile's `canMessage` decides; the first message to
   *  someone who doesn't follow you arrives as a request (the API says so when it's sent). */
  canStart(memberId: string): "open" | "request" | "none" | "unavailable" {
    const s = get();
    const m = s.members.find((x) => x.id === memberId);
    if (!m) return "none";
    if (m.unavailable) return "unavailable";
    if (m.canMessage === false) return "none";
    if (m.canMessage === true) return "open";
    if (m.messagePolicy === "no-one") return "none";
    if (m.messagePolicy === "anyone" || m.follows.includes("me")) return "open";
    return "request";
  },

  /** POST /members/{handle}/messages: opens (or continues) the conversation. */
  async start(memberId: string, body: string, attachedPostId?: string): Promise<Result> {
    const s = get();
    if (s.me.status === "unconfirmed") return fail(MSG.unconfirmed(s.me.email), "unconfirmed");
    const existing = s.conversations.find((c) => c.memberId === memberId && c.kind !== "support");
    if (existing) {
      const r = await messageService.send(existing.id, body, attachedPostId);
      return r.ok ? ok({ id: existing.id, crisis: r.crisis }) : r;
    }
    if (!body.trim() && !attachedPostId) return fail("Write a message first.");
    try {
      const sent = await messagesApi.start(handleOf(memberId), body.trim(), attachedPostId);
      void refresh(messageKeys.all);
      return ok({ id: sent.data.conversationId, crisis: crisisOf(sent, sent.data) });
    } catch (error) {
      return failure(error);
    }
  },

  /** POST /conversations/{id}/messages. Messages are never held. */
  async send(id: string, body: string, attachedPostId?: string): Promise<Result> {
    const s = get();
    if (s.me.status === "unconfirmed") return fail(MSG.unconfirmed(s.me.email), "unconfirmed");
    const c = s.conversations.find((x) => x.id === id);
    if (!c) return fail("This conversation isn't available.");
    if (!body.trim() && !attachedPostId) return fail("Write a message first.");
    if (body.length > 5000) return fail("Messages can be up to 5,000 characters.");
    if (c.kind === "support") return sendLocal(id, body, attachedPostId);
    try {
      const sent = await messagesApi.send(id, body.trim(), attachedPostId);
      patchConv(id, (k) => ({
        ...k,
        request: k.request === "incoming" ? undefined : k.request,
        messages: [
          ...k.messages.filter((m) => !m.id.startsWith("preview-")),
          { id: sent.data.id, from: "me", body: body.trim(), minutesAgo: 0, attachedPostId },
        ],
      }));
      void refresh(messageKeys.all);
      return ok({ id, crisis: crisisOf(sent, sent.data) });
    } catch (error) {
      return failure(error);
    }
  },

  /** POST /conversations/{id}/accept. */
  acceptRequest(id: string) {
    patchConv(id, (c) => ({ ...c, request: undefined }));
    return quietly(() => messagesApi.accept(id));
  },
  /** DELETE /conversations/{id}: deleting a request is silent, the sender is never told. */
  deleteRequest(id: string) {
    patchConv(id, () => null);
    return quietly(() => messagesApi.remove(id));
  },
  /** PUT /conversations/{id}/muted. */
  toggleMute(id: string) {
    const muted = !!get().conversations.find((c) => c.id === id)?.muted;
    patchConv(id, (c) => ({ ...c, muted: !muted }));
    if (isSupport(id)) return Promise.resolve(ok());
    return quietly(
      () => messagesApi.mute(id, !muted),
      () => patchConv(id, (c) => ({ ...c, muted })),
    );
  },
  /** DELETE /conversations/{id}: gone for me; the other member keeps theirs. */
  deleteForMe(id: string) {
    const support = isSupport(id);
    patchConv(id, () => null);
    if (support) return Promise.resolve(ok());
    return quietly(() => messagesApi.remove(id));
  },
  /** POST /conversations/{id}/read. */
  markRead(id: string) {
    patchConv(id, (c) => ({ ...c, unread: false }));
    if (isSupport(id)) return Promise.resolve(ok());
    return quietly(() => messagesApi.read(id));
  },
  /** PUT /messages/{id}: within 15 minutes of sending. */
  async editMessage(convId: string, msgId: string, body: string): Promise<Result> {
    patchConv(convId, (c) => ({
      ...c,
      messages: c.messages.map((m) => (m.id === msgId ? { ...m, body, edited: true } : m)),
    }));
    if (isSupport(convId)) return ok();
    try {
      const sent = await messagesApi.edit(msgId, body);
      return ok({ crisis: crisisOf(sent, sent.data) });
    } catch (error) {
      void refresh(messageKeys.thread(convId));
      const f = failure(error);
      if (!f.ok) notice(f.error);
      return f;
    }
  },
  /** DELETE /messages/{id}: within 15 minutes of sending. */
  deleteMessage(convId: string, msgId: string) {
    patchConv(convId, (c) => ({
      ...c,
      messages: c.messages.map((m) => (m.id === msgId ? { ...m, deleted: true, body: "" } : m)),
    }));
    if (isSupport(convId)) return Promise.resolve(ok());
    return quietly(
      () => messagesApi.removeMessage(msgId),
      () => void refresh(messageKeys.thread(convId)),
    );
  },
};

/** The support conversation is local (TODO(api): no support inbox endpoint yet). */
function sendLocal(id: string, body: string, attachedPostId?: string): Result {
  const crisis = detectCrisis(body);
  patchConv(id, (c) => ({
    ...c,
    crisisFlagged: c.crisisFlagged || crisis !== "none",
    messages: [
      ...c.messages,
      { id: uid("m"), from: "me", body: body.trim(), minutesAgo: 0, attachedPostId },
    ],
  }));
  return ok({ id, crisis });
}
