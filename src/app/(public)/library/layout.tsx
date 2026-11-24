import type { Metadata } from "next";

/* Learn for visitors (PRD §16): the library's titles and summaries, open to everyone. */
export const metadata: Metadata = {
  title: "Learn · Fertility Grove",
  description: "Clinician-reviewed articles on infertility diagnoses and treatment paths.",
  robots: { index: true, follow: true },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
