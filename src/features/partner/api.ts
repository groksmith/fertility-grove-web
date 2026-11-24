/* The partner endpoints (PRD §7). */

import { httpClient } from "@/lib/http";

export interface PartnerInviteView {
  id: string;
  email: string | null;
  status: string;
  lastSentAt: string;
  expiresAt: string;
  resendsLeft: number;
}

export interface PublicPartnerInvite {
  inviterFirstName: string | null;
  note: string | null;
  expiresAt: string;
}

export const partnerApi = {
  invite: (email: string, note: string) =>
    httpClient.send<PartnerInviteView>("POST", "/profile/me/partner/invites", {
      email,
      note: note || null,
    }),
  resend: (id: string) =>
    httpClient.post<PartnerInviteView>(`/profile/me/partner/invites/${id}/resend`),
  cancel: (id: string) => httpClient.delete(`/profile/me/partner/invites/${id}`),
  unlink: () => httpClient.delete("/profile/me/partner"),
  publicInvite: (token: string) =>
    httpClient.get<PublicPartnerInvite>(`/partner-invites/${encodeURIComponent(token)}`, {
      anonymous: true,
    }),
  accept: (token: string) =>
    httpClient.post<{ partnerFirstName: string | null; linkedAt: string }>(
      `/partner-invites/${encodeURIComponent(token)}/accept`,
    ),
};
