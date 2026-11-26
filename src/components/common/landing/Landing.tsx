"use client";

/* The public landing page, in the voice of fertilitygrove.com: white ground,
   the orange logo, the brand's watercolour orange trees and the near-black
   pill. One motif runs it: the orange's circle masks every picture and marks
   every list, and the tree grows from Seed to Orange Tree down the page.
   The hero is one painted Riviera grove (a travel poster); the bands below
   are flat tints with straight edges (sky, sage, blush) or the plain grey,
   and orange branches and blossom hang in at a few section edges. */

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AtSign,
  Download,
  EyeOff,
  type Lock,
  Menu as MenuIcon,
  ShieldCheck,
  Sprout,
  UsersRound,
  X,
} from "lucide-react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Backdrop } from "@/components/art/Cozy";
import { STAGE_SRC, TreeArt } from "@/components/art/Tree";
import { Logo, LogoOrange } from "@/components/icons/Logo";
import { FormField } from "@/components/shared";
import { authService, joinWaitlistSchema } from "@/features/auth";
import { GROUPS } from "@/features/groups";
import { ARTICLES, articleCover } from "@/features/learn";
import { hueInk } from "@/lib/hue";
import { useStore } from "@/lib/mock-server";
import { canMentor, LEVELS } from "@/lib/rules/sunlight";
import { GuideScene } from "./GuideScene";
import { GROW_PLATES, useHeroGrow } from "./heroGrow";

/* ------------------------------------------------------------- Motion */

/** Section parts rise into place once as they enter. Content is visible
 *  without script: the hidden starting state only applies after mount. */
function useReveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.in = "";
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    for (const el of document.querySelectorAll("[data-reveal]")) io.observe(el);
    return () => {
      io.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);
}

/* -------------------------------------------------------------- Pieces */

function OrangeDot() {
  return (
    <span aria-hidden className="mt-2 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
  );
}

/** The near-black pill: the page's one primary action. */
const PILL =
  "press button-md inline-flex h-11 min-w-[250px] items-center justify-center rounded-full bg-accent px-3 text-white transition-colors duration-300 ease-base hover:bg-black";

/** The waitlist section's anchor; other pages link to `/#waitlist`. */
const WAITLIST_ID = "waitlist";

/** Glide to the waitlist section and put the cursor in its email field, so
    the next thing a visitor does is type. Focus waits for no scroll: the
    field is focused without jumping, and the glide carries on. */
function goToWaitlist() {
  goTo(WAITLIST_ID);
  document
    .querySelector<HTMLInputElement>(`#${WAITLIST_ID} input[type="email"]`)
    ?.focus({ preventScroll: true });
}

/** "Join Waitlist": every call to action on the page, in place of
    "Create account" and "Sign in". It scrolls to the waitlist form; without
    script it is a plain in-page link. */
function WaitlistButton({ className = "", onGo }: { className?: string; onGo?: () => void }) {
  return (
    <a
      href={`#${WAITLIST_ID}`}
      onClick={(e) => {
        e.preventDefault();
        onGo?.();
        goToWaitlist();
      }}
      className={`${PILL} ${className}`}
    >
      Join Waitlist
    </a>
  );
}

/** Leaving the hero is walking down the path: as you scroll, the painting moves
 *  slower than the page and eases further forward inside its frame, and the
 *  words rise and fade a little faster, so the text clears first. One scroll
 *  listener, one frame at a time, transform and opacity only; off under
 *  reduced motion. */
function useLeaveHero() {
  const hero = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const h = hero.current?.offsetHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / h));
      if (scene.current)
        scene.current.style.transform = `translate3d(0, ${(p * h * 0.32).toFixed(1)}px, 0) scale(${(1 + p * 0.07).toFixed(4)})`;
      if (copy.current) {
        copy.current.style.transform = `translate3d(0, ${(-p * 90).toFixed(1)}px, 0)`;
        copy.current.style.opacity = String(Math.max(0, 1 - p * 2.2));
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return [hero, scene, copy] as const;
}

/* ------------------------------------------------------------- Navbar */

const NAV = [
  { id: "groups", label: "How it works" },
  { id: "learn", label: "Library" },
  { id: "grow", label: "Your tree" },
  { id: "partners", label: "Partners" },
];

/** Glide to a section (instantly under reduced motion) and keep the URL. */
function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

/** The site bar. It sits clear on the hero's painted wash, then once you
    scroll it pins as soft white with a hairline, marking the section you're
    in. Phones get a menu panel. */
function SiteNav() {
  const signedIn = useStore((s) => s.signedIn && s.step >= 9);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>();
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The section whose top has passed the bar is the one you're reading.
  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter((x): x is HTMLElement => !!x);
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (seen[0]) setActive(seen[0].target.id);
      },
      { rootMargin: "-80px 0px -55% 0px" },
    );
    for (const x of els) io.observe(x);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);

  const solid = scrolled || open;
  return (
    <>
      <div ref={sentinel} aria-hidden className="absolute top-0 h-px w-px" />
      <nav
        aria-label="Site"
        className={`site-nav sticky top-0 z-50 -mb-20 ${solid ? "bg-white/90 shadow-[0_1px_0_var(--line)] backdrop-blur-md" : "bg-transparent"}`}
      >
        <div className="mx-auto flex h-20 max-w-[1440px] items-center gap-3 px-4 sm:gap-6 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <Link
            href="/"
            aria-label="Fertility Grove home"
            className="shrink-0 justify-self-start"
            onClick={() => setOpen(false)}
          >
            <Logo height={42} priority />
          </Link>
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  aria-current={active === n.id ? "location" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(n.id);
                  }}
                  className={`press inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold transition-colors duration-150 ${
                    active === n.id ? "bg-ink/5 text-ink" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/help"
                className="press inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold text-ink-soft transition-colors duration-150 hover:text-ink"
              >
                Help
              </Link>
            </li>
          </ul>
          <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:justify-self-end">
            {/* The public site is waitlist-first, so "Join Waitlist" is the bar's one
                action for everyone. A signed-in member gets a quiet way back to their
                grove beside it (in the menu on phones). */}
            {signedIn && (
              <Link
                href="/feed"
                className="press hidden h-10 items-center rounded-full px-4 text-[15px] font-semibold text-ink hover:bg-ink/5 sm:inline-flex"
              >
                Your grove
              </Link>
            )}
            <a
              href={`#${WAITLIST_ID}`}
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                goToWaitlist();
              }}
              className="press inline-flex h-10 items-center rounded-full bg-accent px-4 text-[15px] font-semibold whitespace-nowrap text-white hover:bg-black min-[360px]:px-5"
            >
              Join Waitlist
            </a>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((o) => !o)}
              className="press grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-ink/5 lg:hidden"
            >
              {open ? <X size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <div
            id="site-menu"
            className="rise border-t border-line bg-white px-4 pt-3 pb-6 sm:px-8 lg:hidden"
          >
            <ul className="flex flex-col">
              {NAV.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      goTo(n.id);
                    }}
                    className="flex h-12 items-center text-[17px] font-semibold text-ink"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href="/help"
                  className="flex h-12 items-center text-[17px] font-semibold text-ink"
                >
                  Help
                </Link>
              </li>
              {signedIn && (
                <li className="sm:hidden">
                  <Link
                    href="/feed"
                    className="flex h-12 items-center text-[17px] font-semibold text-ink"
                  >
                    Your grove
                  </Link>
                </li>
              )}
            </ul>
            <WaitlistButton className="mt-3 h-12 w-full" onGo={() => setOpen(false)} />
          </div>
        )}
      </nav>
    </>
  );
}

/* ------------------------------------------------------------- Hero */

/* The hero art. Pick one entry for HERO; the others stay for comparison.
   `immersive` stands you on the path deep inside a dense grove, canopies
   meeting overhead and fruit close enough to touch, the rows opening onto a
   pale morning haze where the words sit (prompt in
   scripts/art/prompts-gouache/hero-immersive-path.txt). Phones get a portrait
   painting of the same scene. `poster` is the earlier wide Riviera view
   (hero-poster-brand.txt), kept so it can come back by changing one word. */
const HERO_ART = {
  /* The immersive grove repainted in the hand of the brand's orange branches
     (cozy/e-branch-side.webp): lime and teal leaves, glossy warm oranges.
     Prompts: scripts/art/prompts-gouache/hero-branch-style-*.txt with
     ART_STYLE=style-branch.txt. */
  branchStyle: {
    wide: { src: "/assets/brand/gouache/grove-branch-style.webp", width: 2752, height: 1536 },
    tall: { src: "/assets/brand/gouache/grove-branch-style-tall.webp", width: 1536, height: 2752 },
    position: { wide: "50% 40%", tall: "50% 65%" },
    glow: true,
  },
  immersive: {
    wide: { src: "/assets/brand/gouache/grove-immersive-v2.webp", width: 2752, height: 1536 },
    tall: { src: "/assets/brand/gouache/grove-immersive-tall-v2.webp", width: 1536, height: 2752 },
    position: { wide: "50% 40%", tall: "50% 65%" },
    glow: true,
  },
  immersiveAlt: {
    wide: { src: "/assets/brand/gouache/grove-immersive-alt.webp", width: 2752, height: 1536 },
    tall: { src: "/assets/brand/gouache/grove-immersive-tall-v2.webp", width: 1536, height: 2752 },
    position: { wide: "50% 40%", tall: "50% 65%" },
    glow: true,
  },
  poster: {
    wide: { src: "/assets/brand/gouache/grove-poster.webp", width: 3168, height: 1344 },
    tall: { src: "/assets/brand/gouache/grove-poster.webp", width: 3168, height: 1344 },
    position: { wide: "50% 88%", tall: "50% 88%" },
    glow: false,
  },
} as const;
const HERO = HERO_ART.branchStyle;

/** The painting, art-directed by the screen's shape: the wide view on
    landscape screens, the portrait view on portrait ones (phones, tablets
    held upright), so the haze where the words sit is always in view. */
function HeroPicture() {
  const common = { alt: "", sizes: "100vw", quality: 90, priority: true } as const;
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, ...HERO.wide });
  const {
    props: { srcSet: _tall, ...img },
  } = getImageProps({ ...common, ...HERO.tall });
  return (
    <picture>
      <source media="(min-aspect-ratio: 1/1)" srcSet={wide} />
      {/* biome-ignore lint/a11y/useAltText: alt="" comes from getImageProps; the painting is decorative */}
      <img {...img} className="hero-art absolute inset-0 h-full w-full object-cover" />
    </picture>
  );
}

/** The painting's stage: it drifts (breathe) as one, carrying the bare-land
    plate, the painting and, while the grove grows, the canvas that grows it
    (heroGrow.ts). The framing variables are set here so all three crop alike. */
function HeroStage() {
  const stage = useRef<HTMLDivElement>(null);
  useHeroGrow(stage);
  return (
    <div
      ref={stage}
      className="hero-stage breathe absolute inset-0"
      style={
        {
          "--pos-wide": HERO.position.wide,
          "--pos-tall": HERO.position.tall,
          ...GROW_PLATES,
        } as React.CSSProperties
      }
    >
      <div className="hero-plate absolute inset-0" />
      <HeroPicture />
    </div>
  );
}

/** The hero: you stand inside the grove, the words in the light where the rows
    open. A soft morning haze along the top keeps the site bar and logo on a
    light ground, and a sunlit glow behind the words keeps them readable over
    the leaves at every width; both belong to the painting, not the UI. Privacy
    has its own section further down, before Join. */
function Hero() {
  const [heroBox, scene, copy] = useLeaveHero();
  return (
    <header className="relative overflow-hidden bg-white">
      <div
        ref={heroBox}
        className="relative h-[var(--hero-h)]"
        style={{ "--hero-h": "max(700px, 100svh)" } as React.CSSProperties}
      >
        {/* The frame stays put and clips; only the painting inside it eases down
            as you scroll, so it never slides over the band below. */}
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          <div ref={scene} className="absolute inset-0">
            <HeroStage />
          </div>
          {HERO.glow && <div className="hero-haze absolute inset-x-0 top-0 h-40" />}
        </div>

        <div
          ref={copy}
          className={`absolute inset-x-0 z-10 flex items-center justify-center px-4 sm:px-8 ${HERO.glow ? "hero-copy" : "top-20 bottom-[46%]"}`}
        >
          <div className="relative text-center">
            {/* The sunlit glow travels with the words, so they keep their light
                ground while they rise and fade on scroll. */}
            {HERO.glow && (
              <div
                aria-hidden
                className="hero-glow pointer-events-none absolute top-[56%] left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2"
              />
            )}
            {/* One line at every width: measured in Instrument Serif it runs
                258px at 30px, 310px at 36px, 413px at 48px and 517px at 60px,
                so each step fits the column it gets. */}
            <h1 className="heading-4 mx-auto w-fit bg-linear-to-r from-ink to-muted bg-clip-text text-transparent min-[380px]:heading-3 sm:heading-2 md:heading-1">
              Find the people who get it.
            </h1>
            <p className="body-7 mx-auto mt-6 max-w-[680px] text-ink-soft sm:body-8 md:portrait:max-w-[40ch]">
              A private community for people going through infertility, and the partners going
              through it with them. Ask the questions you can&apos;t ask anyone else, and meet
              people a few steps ahead of you on the same road.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <WaitlistButton />
            </div>
            <p className="caption-2 mx-auto mt-4 max-w-[46ch] text-ink">
              We&apos;re invite-only while we&apos;re in beta. Ask a member for a link.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

/* The privacy section: the promises in full, each a pill with a
   small outline icon, beside one round painting of a padlocked garden gate
   (public/assets/brand/gouache/privacy-gate-round-v2.webp, prompt in
   scripts/art/prompts-gouache/privacy-lock-round-brand.txt). Every promise is
   one the product already makes (PRODUCT.md, the privacy page). */
const PROMISES: { text: string; Icon: typeof Lock }[] = [
  { text: "You post under a handle", Icon: AtSign },
  { text: "No ad trackers, ever", Icon: EyeOff },
  { text: "Health data never sold", Icon: ShieldCheck },
  { text: "Success stories kept apart", Icon: Sprout },
  { text: "Partners see only what you share", Icon: UsersRound },
  { text: "Download or delete everything", Icon: Download },
];

function PrivacySection() {
  return (
    <section id="privacy" aria-labelledby="privacy-h" className="scroll-mt-20 bg-raised">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:py-24">
        <div className="lg:col-span-6">
          <h2 id="privacy-h" className="heading-3 lg:heading-2" data-reveal>
            Your story stays yours
          </h2>
          <p className="body-7 mt-6 max-w-[54ch] text-ink-soft" data-reveal>
            Fertility Grove is private by default. You post under a handle unless you choose to show
            your first name and last initial, and your health data is never sold.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Our privacy promises">
            {PROMISES.map(({ text, Icon }, i) => (
              <li
                key={text}
                data-reveal
                style={{ transitionDelay: `${i * 60}ms` }}
                className="body-4 inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-ink"
              >
                <Icon aria-hidden size={16} strokeWidth={1.75} className="shrink-0 text-ink-soft" />
                {text}
              </li>
            ))}
          </ul>
          <p className="body-3 mt-8 max-w-[54ch] text-ink-soft" data-reveal>
            Partners have accounts of their own, and nothing passes between you until you share it.
            Download or delete everything whenever you like.
          </p>
          <p className="body-3 mt-6 text-ink-soft" data-reveal>
            Questions about privacy?
            <br />
            Read our{" "}
            <Link href="/privacy" className="body-1 text-ink underline underline-offset-2">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy#health-data"
              className="body-1 text-ink underline underline-offset-2 sm:whitespace-nowrap"
            >
              Consumer Health Data Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div
          className="relative mx-auto aspect-square w-full max-w-[360px] lg:col-span-5 lg:col-start-8 lg:max-w-[480px]"
          data-reveal
        >
          <div className="absolute inset-0 rounded-full bg-[var(--tint-yellow)]" />
          <div className="absolute inset-[9%] overflow-hidden rounded-full">
            <Image
              src="/assets/brand/gouache/privacy-gate-round-v2.webp"
              alt="A brass padlock closed on a garden gate, under a branch of ripe oranges and blossom"
              fill
              sizes="(min-width: 1024px) 400px, 300px"
              quality={90}
              className="drift object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* The intro line, directly under the hero, set large. Each word starts faint
   and comes up to full ink as it crosses a line a little above the middle of
   the screen, in reading order, so the sentence is read into being. One
   observer for all the words; words that cross together step 45ms apart.
   Without script, and under reduced motion, the words are simply there. */
/* Three lines from tablet up, broken where the thought breaks. The longest
   runs 646px at 36px, 861px at 48px and 1077px at 60px, so it steps up to
   Heading 2 at 1024px and Heading 1 at 1280px and still holds three lines;
   phones wrap it naturally. Set large on purpose: the client wants it as big as
   the screen allows, so the 680px measure doesn't apply here. */
const INTRO = [
  "Tell us about your journey.",
  "We'll point you to the groups, members and mentors",
  "who are in the same place, or who just went through it.",
];

function IntroLine() {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const words = ref.current?.querySelectorAll<HTMLElement>("[data-word]");
    if (!words?.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        let step = 0;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.style.transitionDelay = `${step++ * 45}ms`;
          el.dataset.lit = "";
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -38% 0px" },
    );
    for (const w of words) io.observe(w);
    return () => io.disconnect();
  }, []);
  return (
    <section
      aria-label="Introduction"
      className="relative flex min-h-[80svh] items-center justify-center px-4 py-24 sm:px-8"
    >
      <Backdrop kind="statement" />
      <p
        ref={ref}
        className="heading-3 intro-leading relative mx-auto text-center text-ink lg:heading-2 xl:heading-1"
      >
        {INTRO.map((line, l) => (
          <span key={l} className="md:block md:whitespace-nowrap">
            {line.split(" ").map((w, i) => (
              <span key={i}>
                <span data-word className="word-lit">
                  {w}
                </span>{" "}
              </span>
            ))}
          </span>
        ))}
      </p>
    </section>
  );
}

/* Each way in has its own painted subject (public/assets/brand/landing/way-*.webp,
   prompts in scripts/art/prompts-ways/): a bench under an orange tree, two
   mugs and an open notebook left on it (mentors: someone sits with you and
   talks it through), saplings gathered close (groups), a lantern hung from
   a branch, lighting a winding path (the Guide, showing you the way), a ripe orange under
   a glass cloche (success stories, kept in their own space), two trees
   entwined in one pot (family), and the brand's own tree (your tree). */
const SPECIMENS: {
  name: string;
  fact: string;
  art: string;
  bg: string;
  wide?: boolean;
  bleed?: boolean;
}[] = [
  {
    name: "Talk to someone a few steps ahead of you",
    fact: "Experienced members mentor for free, with no application. Time in the grove is all it takes.",
    art: "/assets/brand/landing/way-mentors-bench-v2.webp",
    bg: "var(--tint-purple)",
    wide: true,
    bleed: true,
  },
  {
    name: "Groups that fit",
    fact: "We match you with groups for your diagnosis and stage, and tell you why each one fits. You walk in and people already get it.",
    art: "/assets/brand/landing/way-groups-v2.webp",
    bg: "var(--tint-pink)",
  },
  {
    name: "The Grove Guide",
    fact: "Ask anything, any hour. The Guide answers from our clinician-reviewed library and shows you its sources.",
    art: "guide",
    bg: "var(--tint-blue)",
  },
  {
    name: "Success stories, big and small",
    fact: "A good result, a procedure that went well, a milestone you worked hard for, a pregnancy. These stories live in their own space, so you can go find encouragement when you want it.",
    art: "/assets/brand/landing/way-stories-v2.webp",
    bg: "var(--tag-pink-bg)",
    wide: true,
  },
  {
    name: "A space for the two of you",
    fact: "Bring your partner in. Share a list of questions for your next appointment, a saved article or a note, whenever you're ready.",
    art: "/assets/brand/landing/way-family-v2.webp",
    bg: "var(--tint-neutral)",
  },
  {
    name: "A tree that grows as you give",
    fact: "Share what you've learned and support other members, and your tree grows into a picture of how deep your roots run in the community.",
    art: "tree",
    bg: "var(--tint-green)",
  },
];

function Specimens() {
  return (
    <section
      id="groups"
      aria-labelledby="spec-h"
      className="scroll-mt-24 mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-4 pb-20 sm:px-8 lg:grid-cols-12 lg:pb-24"
    >
      <div className="lg:col-span-3" data-reveal>
        <h2 id="spec-h" className="heading-3 lg:heading-2">
          Here&apos;s what&apos;s waiting for you
        </h2>
        <p className="body-3 mt-4 max-w-[30ch] text-ink-soft">
          Mentors, groups, answers and room for your partner, all shaped around your journey.
        </p>
      </div>
      {/* biome-ignore lint/a11y/noRedundantRoles: role="list" restores list semantics that Safari/VoiceOver drop under list-style: none; do not remove */}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 lg:col-span-9 lg:grid-cols-4" role="list">
        {SPECIMENS.map((s, i) => (
          <li
            key={s.name}
            data-reveal
            style={{ transitionDelay: `${i * 70}ms` }}
            className={s.wide ? "col-span-2" : ""}
          >
            <div
              className={`relative grid place-items-center overflow-hidden rounded-3xl px-4 pt-6 ${s.wide ? "aspect-[8/5]" : "aspect-[4/5]"}`}
              style={{ background: s.bg }}
            >
              {s.art === "tree" ? (
                <TreeArt level="Orange Tree" size={170} />
              ) : s.art === "guide" ? (
                <GuideScene delay={i * 70} />
              ) : s.bleed ? (
                // A close-up: the canopy runs off the card's top and sides.
                <span className="absolute inset-x-0 bottom-[5%] block aspect-[1400/906]">
                  <Image
                    src={s.art}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 520px, 100vw"
                    quality={90}
                    className="object-contain"
                  />
                </span>
              ) : (
                <span
                  className={`relative block ${s.wide ? "h-[74%] w-[60%]" : "h-[66%] w-[84%]"}`}
                >
                  <Image
                    src={s.art}
                    alt=""
                    fill
                    sizes={
                      s.wide ? "(min-width: 1024px) 320px, 60vw" : "(min-width: 1024px) 200px, 40vw"
                    }
                    quality={90}
                    className="object-contain"
                  />
                </span>
              )}
            </div>
            <h3 className="title-2 mt-3 sm:title-1">{s.name}</h3>
            <p className="body-6 mt-1 text-ink-soft sm:body-3">{s.fact}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* The personal part: tell us which part of your story you're in, and the
   "Suggested for you" panel fills in for it. */
type Stage = {
  label: string;
  description: string;
  /** The line under the panel's subline, for this stage. */
  line: string;
  photo: string;
  alt: string;
  groups: string[];
  mentor: { name: string; note: string };
  article: string;
  question: string;
};

/* TODO(content): placeholder suggestions. The mapping from each stage to its
   groups, mentor, first article and Guide question is still to come from the
   client (Lauren); until then these come from the seed data. The labels,
   descriptions and lines are final copy. */
// A non-empty tuple, so STAGES[0] is always a Stage.
const STAGES: [Stage, ...Stage[]] = [
  {
    label: "I'm trying to conceive",
    description: "Months in, and wondering what comes next.",
    line: "Plenty of people are right where you are.",
    photo: "/assets/brand/landing/stage-trying-v2.webp",
    alt: "A sunlit path winding up through an orange grove",
    groups: ["g-waiting", "g-unexplained", "g-work"],
    mentor: { name: "Priya S.", note: "Letrozole cycles, IUI and asking for more tests" },
    article: "unexplained-infertility",
    question: "What tests are usually done in a fertility workup?",
  },
  {
    label: "I'm waiting on results",
    description: "Appointments booked, answers on the way.",
    line: "The waiting room has company.",
    photo: "/assets/brand/landing/stage-waiting-v2.webp",
    alt: "A garden bench under an orange tree, beside a path to a closed gate",
    groups: ["g-waiting", "g-pcos", "g-mf"],
    mentor: { name: "@dana_two_lines", note: "Making sense of low AMH results" },
    article: "pcos",
    question: "What does a low AMH result mean?",
  },
  {
    label: "I'm in treatment",
    description: "IUI, IVF, surgery and everything in between.",
    line: "Cycle days go faster with people who know the drill.",
    photo: "/assets/brand/landing/stage-treatment-v2.webp",
    alt: "An orange branch in white blossom, a small green fruit just forming",
    groups: ["g-ivf", "g-iui", "g-endo"],
    mentor: { name: "Maya R.", note: "Endometriosis surgery and three IVF transfers" },
    article: "endometriosis",
    question: "What's the difference between IUI and IVF?",
  },
  {
    label: "I'm taking a break",
    description: "Stepping back for a while, without stepping away.",
    line: "Rest counts. Your spot in the grove will be here when you're ready.",
    photo: "/assets/brand/landing/stage-break-v2.webp",
    alt: "A hammock in dappled shade at the edge of a still lake",
    groups: ["g-break", "g-rpl", "g-unexplained"],
    mentor: { name: "@dana_two_lines", note: "Four retrievals, then a new path" },
    article: "recurrent-pregnancy-loss",
    question: "What does it mean if no cause is found?",
  },
  {
    label: "I'm a partner",
    description: "Supporting someone I love, and needing support too.",
    line: "You're part of this story too.",
    photo: "/assets/brand/landing/stage-partner-v2.webp",
    alt: "Two chairs side by side facing a lake under an orange tree",
    groups: ["g-partners", "g-mf", "g-donor"],
    mentor: { name: "Noah F.", note: "Five years as the partner who held the folder" },
    article: "male-factor",
    question: "What does a semen analysis measure?",
  },
];

/** One row of the "Suggested for you" panel: a small label, then its content. */
function SuggestRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-4">
      <dt className="caption-3 text-muted">{label}</dt>
      <dd className="body-3 mt-1 text-ink">{children}</dd>
    </div>
  );
}

/** On the flat sky band: the stage picker on the left, the suggestions on
    the right and, on wide screens, each stage's painting on a white disc
    between them. Picking a stage changes the panel; hovering doesn't. */
function Journey() {
  const [i, setI] = useState(0);
  const cur = STAGES[i] ?? STAGES[0];
  const groups = cur.groups.flatMap((id) => GROUPS.find((g) => g.id === id) ?? []);
  const article = ARTICLES.find((a) => a.slug === cur.article);
  return (
    <section aria-labelledby="journey-h" className="bg-[var(--tint-blue)]">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.95fr)] lg:gap-12 lg:py-24">
        <div>
          <h2 id="journey-h" className="heading-3 text-ink lg:heading-2">
            Tell us about your journey
          </h2>
          <fieldset className="mt-3">
            <legend className="body-7 text-ink-soft">
              Which part of your story are you in right now?
            </legend>
            {/* One choice of five, so native radios: arrow keys move between
                stages and each is announced "n of 5". The input is visually
                hidden, so the focus ring goes on the row that wraps it. */}
            <div className="mt-6 flex flex-col gap-2">
              {STAGES.map((s, k) => (
                <label
                  key={s.label}
                  className={`press flex w-full cursor-pointer flex-col items-start rounded-2xl px-4 py-3 text-left transition-colors duration-300 ease-base has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] ${
                    k === i ? "bg-accent text-white" : "text-ink hover:bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="journey-stage"
                    className="sr-only"
                    checked={k === i}
                    onChange={() => setI(k)}
                  />
                  <span className="title-2 lg:title-1">{s.label}</span>
                  <span className={`caption-2 mt-0.5 ${k === i ? "text-white/80" : "text-muted"}`}>
                    {s.description}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div
          aria-hidden
          className="relative mx-auto hidden aspect-square w-full max-w-[460px] lg:block"
        >
          <div className="absolute inset-0 rounded-full bg-white" />
          {STAGES.map((s, k) => (
            <div
              key={s.label}
              className={`absolute inset-[9%] overflow-hidden rounded-full transition-[opacity,transform] duration-500 ease-base ${k === i ? "opacity-100" : "scale-[1.04] opacity-0"}`}
            >
              {/* The chosen painting settles in from a slight zoom while the last one fades; each drifts slowly, like a view through a window. */}
              <Image
                src={s.photo}
                alt={s.alt}
                fill
                sizes="(min-width: 1024px) 34vw, 100vw"
                quality={90}
                className="drift object-cover"
              />
            </div>
          ))}
          <span className="absolute right-[4%] bottom-[6%]">
            <LogoOrange size={60} />
          </span>
        </div>

        <div className="rounded-3xl bg-white p-6 sm:p-8">
          <h3 className="heading-4 text-ink">Suggested for you</h3>
          <p className="caption-2 mt-2 text-muted">
            Based on what you just told us. Change it anytime.
          </p>
          <div aria-live="polite">
            <p className="title-2 mt-4 mb-6 text-ink">{cur.line}</p>
            <dl className="space-y-4">
              <SuggestRow label="Groups for you">
                <ul className="space-y-1">
                  {groups.map((g) => (
                    <li key={g.id} className="flex gap-2">
                      <OrangeDot />
                      {g.name}
                    </li>
                  ))}
                </ul>
              </SuggestRow>
              <SuggestRow label="Meet a mentor">
                <span className="body-1">{cur.mentor.name}</span>
                <span className="body-6 block text-ink-soft">{cur.mentor.note}</span>
              </SuggestRow>
              {article && (
                <SuggestRow label="Read this first">
                  {article.title}
                  <span className="body-6 block text-ink-soft">{article.readMinutes} min read</span>
                </SuggestRow>
              )}
              <SuggestRow label="Ask the Guide">
                <q className="text-ink-soft">{cur.question}</q>
              </SuggestRow>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

/* The library as a shelf: each article's painted cover (its topic as one
   painted subject) on its diagnosis's tint. Covers settle into place as
   the section enters. */
function LearnList() {
  return (
    <section
      id="learn"
      aria-labelledby="learn-h"
      className="scroll-mt-20 mx-auto max-w-[1440px] px-4 py-20 sm:px-8 lg:py-24"
    >
      <div className="flex items-baseline justify-between gap-4" data-reveal>
        <h2 id="learn-h" className="heading-3 lg:heading-2">
          Clinician-reviewed library
        </h2>
        <span className="body-3 shrink-0 whitespace-nowrap text-muted">6 articles</span>
      </div>
      <p className="body-3 mt-3 max-w-[60ch] text-ink-soft" data-reveal>
        One for each of six diagnoses, each reviewed by a clinician before it&apos;s published. Read
        the summaries now; the full articles open when you join.
      </p>
      <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {ARTICLES.map((a, i) => (
          <li key={a.slug} data-reveal style={{ transitionDelay: `${(i % 3) * 90}ms` }}>
            <span aria-hidden className="relative block aspect-[16/9] overflow-hidden rounded-3xl">
              <Image
                src={articleCover(a.slug)}
                alt=""
                fill
                sizes="(min-width: 1024px) 440px, (min-width: 640px) 50vw, 100vw"
                quality={90}
                className="cover-settle object-cover"
                style={{ transitionDelay: `${(i % 3) * 90 + 120}ms` }}
              />
            </span>
            <p className="body-4 mt-6" style={{ color: hueInk(a.hue) }}>
              {a.diagnosis === "Unexplained" ? "Unexplained infertility" : a.diagnosis}
            </p>
            <h3 className="title-1 mt-1 text-ink">{a.title}</h3>
            <p className="body-3 mt-2 text-ink-soft">{a.summary}</p>
            <p className="caption-2 tabular mt-3 text-muted">
              {a.readMinutes} min read · Reviewed {a.lastReviewed}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The roots under one level's tree, drawn deeper and wider at each level so
    "how deep your roots go" is literal: a taproot plus one more pair of side
    roots per level. Drawn in a 100×96 box stretched to the column; strokes
    keep their width. */
function Roots({ level }: { level: number }) {
  const d = 14 + level * 20; // taproot depth, 14 to 94
  const paths = [`M50 0 C51 ${d * 0.35} 49 ${d * 0.7} 50 ${d}`];
  for (let k = 1; k <= level; k++) {
    const y0 = d * (0.12 + 0.2 * (k - 1));
    const y1 = Math.min(94, y0 + d * 0.32);
    const s = 8 + level * 6 - k * 3;
    for (const dir of [-1, 1]) {
      paths.push(`M50 ${y0} Q${50 + dir * s * 0.45} ${y0 + d * 0.06} ${50 + dir * s} ${y1}`);
    }
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 96"
      preserveAspectRatio="none"
      className="block h-24 w-full text-bark"
    >
      {paths.map((p) => (
        <path
          key={p}
          d={p}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.55}
          strokeWidth={1.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

/* Your tree: the heading and its paragraph as one column, then the five levels
   in one white panel. Each tree stands on a shared ground line with its roots
   drawn beneath, deepening level by level, and the levels where mentoring is
   open sit on a tinted zone marked "Mentoring opens here". Phones read the same
   panel as a list, the zone behind its last rows. The closing line ends the
   section, centred under the panel. */
function Grow() {
  const firstMentor = LEVELS.findIndex((l) => canMentor(l.level, false));
  const zoneRows = LEVELS.length - firstMentor;
  return (
    <section id="grow" aria-labelledby="grow-h" className="scroll-mt-20 bg-[var(--tint-green)]">
      <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-8 lg:py-24">
        <div className="max-w-[720px]" data-reveal>
          <h2 id="grow-h" className="heading-3 lg:heading-2">
            Your tree tells your story
          </h2>
          <p className="body-3 mt-6 text-ink-soft lg:body-7">
            Your tree starts as a Seed and grows with every contribution you make. When you share a
            resource, pass along something you&apos;ve learned, or encourage another member, and
            they find it helpful, your tree earns Sunlight and your roots reach deeper into the
            grove. Knowledge and community are powerful, and here you&apos;re recognized for
            bringing both. At Blossom Tree, mentoring opens up, and you can guide someone who&apos;s
            where you once were.
          </p>
        </div>

        <div className="mt-12 rounded-3xl bg-white p-4 md:mt-16 md:p-8 lg:p-12" data-reveal>
          <h3 id="roots-label" className="title-1 px-2 text-ink md:px-0">
            How deep your roots go
          </h3>
          <ol
            aria-labelledby="roots-label"
            className="relative mt-4 flex flex-col md:mt-8 md:grid md:grid-cols-5"
            style={
              {
                "--zone-x": `${(firstMentor / LEVELS.length) * 100}%`,
                "--zone-rows": zoneRows,
              } as React.CSSProperties
            }
          >
            {/* The mentoring zone: the last rows on a phone, the last columns from tablet up. */}
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[calc(var(--zone-rows)*5rem)] rounded-lg bg-[var(--tint-green)] md:top-0 md:left-[var(--zone-x)] md:h-auto md:rounded-2xl"
            />
            {LEVELS.map((l, i) => {
              const opens = i === firstMentor;
              return (
                <li
                  key={l.level}
                  data-reveal
                  style={{ transitionDelay: `${i * 90}ms` }}
                  className="relative flex h-20 items-center gap-4 px-2 md:h-auto md:flex-col md:items-stretch md:gap-0 md:px-0"
                >
                  {/* Tablet up: a slot above every tree, so the trees share one ground line. */}
                  <span className="hidden h-12 items-start justify-start pt-3 pl-3 md:flex">
                    {opens && (
                      <span className="caption-3 whitespace-nowrap rounded-full bg-white px-3 py-1 text-ink">
                        Mentoring opens here
                      </span>
                    )}
                  </span>
                  <span className="relative block h-16 w-16 shrink-0 md:h-40 md:w-full lg:h-52">
                    <Image
                      src={STAGE_SRC[l.level]}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 240px, (min-width: 768px) 20vw, 64px"
                      className="object-contain object-bottom"
                    />
                  </span>
                  <span aria-hidden className="hidden h-0.5 bg-bark/30 md:block" />
                  <span className="hidden md:block">
                    <Roots level={i} />
                  </span>
                  <span className="flex flex-col md:items-center md:pt-2 md:pb-4">
                    <span className="title-3 text-ink">{l.level}</span>
                    <span className="caption-2 tabular text-muted">
                      {l.at.toLocaleString()} Sunlight
                    </span>
                    {opens && (
                      <span className="caption-3 mt-1 w-fit rounded-full bg-white px-2 py-0.5 text-ink md:hidden">
                        Mentoring opens here
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <p
          className="heading-5 mx-auto mt-16 max-w-[680px] text-center text-ink lg:mt-20 lg:heading-4"
          data-reveal
        >
          Every member who shares a resource or a lesson helps the next person find their footing.
          The more people join in, the more the grove flourishes.
        </p>
      </div>
    </section>
  );
}

function Partners() {
  return (
    <section
      id="partners"
      aria-labelledby="partners-h"
      className="scroll-mt-20 relative px-4 py-20 sm:px-8 lg:py-24"
    >
      <Backdrop kind="partners" />
      <div className="relative mx-auto grid max-w-[1376px] grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
        <div
          className="relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden rounded-full"
          data-reveal
        >
          <Image
            src="/assets/brand/landing/partners-v2.webp"
            alt="Two young orange trees on a hill above a lake, their branches reaching toward each other"
            fill
            sizes="(min-width: 1024px) 40vw, 90vw"
            quality={90}
            className="drift object-cover"
          />
        </div>
        <div>
          <h2 id="partners-h" className="heading-3 lg:heading-2" data-reveal>
            Room for partners too
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2" data-reveal>
            <div>
              <h3 className="title-1">Their own private account</h3>
              <p className="body-3 mt-2 text-ink-soft">
                Partners join with your invite and get an account of their own, in a community where
                somebody finally asks about them.
              </p>
            </div>
            <div>
              <h3 className="title-1">A family space you both choose</h3>
              <p className="body-3 mt-2 text-ink-soft">
                Share an appointment question list, a saved article or a family note. Nothing is
                shared until you share it.
              </p>
            </div>
          </div>
          <div className="mt-8" data-reveal>
            <WaitlistButton />
          </div>
        </div>
      </div>
    </section>
  );
}

/* The waitlist, closing the page on the blush band with the orange branch
   hanging in from the top edge: the question, one line, then the email form
   in a white card. Every "Join Waitlist" on the page scrolls here, and other
   pages link to /#waitlist. People who already hold an invite link are told
   to use it, under the card. */
function Waitlist() {
  // Checked on submit only; the message stays until the next submit, and focus stays put.
  const form = useForm({
    resolver: zodResolver(joinWaitlistSchema),
    defaultValues: { email: "" },
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  const [joined, setJoined] = useState<string>();
  // Arriving from another page's "Join Waitlist" (/#waitlist): the browser has
  // scrolled here, so put the cursor in the field too.
  useEffect(() => {
    if (window.location.hash !== `#${WAITLIST_ID}`) return;
    document
      .querySelector<HTMLInputElement>(`#${WAITLIST_ID} input[type="email"]`)
      ?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      id={WAITLIST_ID}
      aria-labelledby="waitlist-h"
      className="relative scroll-mt-20 overflow-hidden bg-[var(--tint-pink)] text-ink"
    >
      <Backdrop kind="join" />
      <div
        className="relative mx-auto flex max-w-[1440px] flex-col items-center px-4 pt-24 pb-20 text-center sm:px-8 lg:min-h-[80svh] lg:justify-center lg:py-24"
        data-reveal
      >
        <h2 id="waitlist-h" className="heading-3 max-w-[680px] sm:heading-2 lg:heading-1">
          Ready to find your people?
        </h2>
        <p className="body-7 mt-6 max-w-[40ch] text-ink-soft sm:body-8">
          We&apos;re invite-only during the beta. Leave your email and we&apos;ll let you know as
          soon as sign-up opens.
        </p>

        <div className="mt-10 w-full max-w-[480px] rounded-3xl bg-white p-4 text-left min-[360px]:p-6 sm:p-8">
          {joined ? (
            <div role="status">
              <p className="title-1 text-ink">You&apos;re on the waitlist</p>
              <p className="body-3 mt-2 text-ink-soft">
                Thank you. We&apos;ll email {joined} as soon as sign-up opens.
              </p>
            </div>
          ) : (
            <form
              noValidate
              aria-label="Join the waitlist"
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(({ email }) => {
                // TODO(api): POST /api/v1/auth/sign-up-waitlist.
                const r = authService.joinWaitlist(email);
                if (r.ok) setJoined(email.trim());
                else form.setError("email", { message: r.error });
              })}
            >
              <FormField
                form={form}
                name="email"
                label="Your email"
                kind="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
              />
              <button type="submit" className={`${PILL} w-full`}>
                Join Waitlist
              </button>
            </form>
          )}
        </div>

        <p className="caption-2 mt-6 max-w-[46ch] text-ink-soft">
          Have an invite? Bring the link a member sent you and come on in.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-raised text-ink">
      <div className="mx-auto max-w-[1440px] px-4 pt-16 sm:px-8">
        <div className="grid grid-cols-1 gap-10 pb-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Logo height={44} />
          </div>
          <nav aria-label="Product" className="lg:col-span-2">
            <ul className="space-y-2 text-[16px]">
              <li>
                <Link href="#learn" className="hover:underline">
                  Learn
                </Link>
              </li>
              <li>
                <Link href="#partners" className="hover:underline">
                  Partners
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:underline">
                  Help
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Legal" className="lg:col-span-3">
            <ul className="space-y-2 text-[16px]">
              <li>
                <Link href="/terms" className="hover:underline">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy#health-data" className="hover:underline">
                  Consumer Health Data Privacy Policy
                </Link>
              </li>
            </ul>
          </nav>
          <div className="lg:col-span-4">
            <p className="text-[16px] font-semibold">
              If you&apos;re struggling right now, call or text 988.
            </p>
            <p className="mt-1 text-[16px] leading-relaxed text-ink-soft">
              The Suicide & Crisis Lifeline is free, confidential and open all day and night. In an
              emergency, call 911.
            </p>
            <a
              href="tel:988"
              className="press mt-3 inline-flex h-11 items-center rounded-full bg-accent px-5 text-[16px] font-semibold text-white hover:bg-black"
            >
              Call 988
            </a>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 pb-8 text-[14px] text-muted">
          <p className="max-w-[90ch]">
            Fertility Grove © 2026. US only. Botanical plate: <em>Citrus limonum</em> by Rungiah,
            text by Robert Wight (1851), public domain via Wikimedia Commons.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Landing() {
  useReveal();
  return (
    <>
      <SiteNav />
      <Hero />
      <main className="bg-white">
        <IntroLine />
        <Specimens />
        <Journey />
        <LearnList />
        <Grow />
        <Partners />
        <PrivacySection />
        <Waitlist />
      </main>
      <Footer />
    </>
  );
}
