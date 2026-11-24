import type { Metadata } from "next";

/* Invite links are personal: search engines are told not to list them (PRD §7). */
export const metadata: Metadata = {
  title: "You're invited · Fertility Grove",
  robots: { index: false, follow: false },
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
