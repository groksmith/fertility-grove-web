/** Marks prototype sample content shown while the backend has none (see lib/api/samples.ts). */
export function SampleTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center rounded-full bg-raised px-2.5 text-[12px] font-semibold text-ink-soft ring-1 ring-inset ring-line-strong ${className}`}
      title="Sample content, shown until the real content is published"
    >
      Sample
    </span>
  );
}
