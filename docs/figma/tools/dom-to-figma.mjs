// Step 5e: app screens straight from the running app. Opens each route in
// headless Chrome as the demo member at Desktop 1440, Tablet 768 and Phone 390,
// reads the rendered page with dom-extract.js and builds it in Figma as frames,
// text, images and icons at their exact positions.
// Usage: FG_CHANNEL=fertility-grove node dom-to-figma.mjs <pageId> <screens.json> [name...]
//   screens.json: [["App", "Feed", "/feed"], ["Auth", "Sign in", "/login", "out"], ...].
//   A fourth item "out" captures signed out; otherwise as the demo member. A fifth,
//   {"window": "keep"}, reads the page in a normal-height window (for pages whose
//   hero is sized to the screen).
//   Rows stack on a fixed pitch (FG_PITCH, in list order) so one screen can be
//   rebuilt in place. FG_STACK=1 stacks rows by their real height instead
//   (FG_Y0 start, FG_GAP between rows). FG_REPLACE=1 deletes a frame of the same
//   name on the page before building its replacement. FG_X0 shifts the row right.
//   Pages render at rest: reduced motion, every reveal shown, every image loaded.
import { spawn } from "node:child_process";
import { readFileSync, mkdtempSync, existsSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Img, PUB, build, send as fig } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const EXTRACT = readFileSync(join(HERE, "dom-extract.js"), "utf8");
const WASH = join(HERE, "..", "assets", "wash-faded.png");
const BASE = process.env.FG_APP || "http://localhost:3003";
const [page, listFile, ...only] = process.argv.slice(2);
const SCREENS = JSON.parse(readFileSync(listFile, "utf8"));
const SIZES = [
  { key: "Desktop 1440", w: 1440, h: 900 },
  { key: "Tablet 768", w: 768, h: 1024 },
  { key: "Phone 390", w: 390, h: 844 },
];
const PITCH = Number(process.env.FG_PITCH || 4000);

// ------------------------------------------------------------ Chrome
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${mkdtempSync(join(tmpdir(), "d2f-"))}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50 && !ws; i++) {
  try {
    const j = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    const p = j.find((t) => t.type === "page");
    if (p) ws = new WebSocket(p.webSocketDebuggerUrl);
  } catch {}
  await sleep(200);
}
if (ws.readyState !== 1) await new Promise((r) => ws.addEventListener("open", r));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
const cdp = (method, params = {}) => new Promise((r) => { const i = ++seq; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => {
  const m = await cdp("Runtime.evaluate", { expression: x, returnByValue: true, awaitPromise: true });
  if (m.result?.exceptionDetails) throw new Error(m.result.exceptionDetails.exception?.description || "evaluate failed");
  return m.result?.result?.value;
};

// Motion off, every image loaded, reveal states settled.
const SETTLE = `(async () => {
  const st = document.createElement("style");
  st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}";
  document.head.appendChild(st);
  document.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager"));
  document.querySelectorAll("[data-reveal]").forEach((e) => (e.dataset.in = ""));
  await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 4000); }))));
  await document.fonts.ready;
  return true;
})()`;

const STORE = "fertility-grove-state-v3";
async function capture(path, size, session = "in", opts = {}) {
  const mobile = size.w < 700;
  await cdp("Emulation.setDeviceMetricsOverride", { width: size.w, height: size.h, deviceScaleFactor: 1, mobile });
  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  // The session: signed out for public and auth screens, otherwise the demo member.
  await cdp("Page.navigate", { url: BASE + "/terms" });
  await sleep(1500);
  await ev(session === "out" ? `localStorage.setItem("${STORE}", JSON.stringify({ signedIn: false }))` : `localStorage.removeItem("${STORE}")`);
  await cdp("Page.navigate", { url: BASE + path });
  await sleep(4000);
  await ev(SETTLE);
  const full = await ev("Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)");
  // Pages sized to the window (the landing hero is a full screen) keep a normal
  // window: everything below the fold is still read at its page position.
  if (opts.window === "keep") return renderGradients(await ev(EXTRACT));
  // The window as tall as the page: fixed bars sit at the page's ends.
  await cdp("Emulation.setDeviceMetricsOverride", { width: size.w, height: Math.max(size.h, Math.min(full, 20000)), deviceScaleFactor: 1, mobile });
  await sleep(700);
  await ev(SETTLE);
  return renderGradients(await ev(EXTRACT));
}

/** The plugin draws solid fills only, so each CSS gradient the extractor found
 *  is drawn by Chrome on a transparent page, at its size, and sent as a PNG. */
const GRADIENTS = join(tmpdir(), "fg-figma-gradients");
async function renderGradients(tree) {
  const found = [];
  const walk = (n) => {
    if (n.gradient) found.push(n);
    (n.children || []).forEach(walk);
  };
  walk(tree);
  if (!found.length) return tree;
  mkdirSync(GRADIENTS, { recursive: true });
  await cdp("Page.navigate", { url: "about:blank" });
  await sleep(300);
  await cdp("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
  for (const n of found) {
    const file = join(GRADIENTS, `${createHash("sha1").update(`${n.gradient}|${n.width}x${n.height}`).digest("hex")}.png`);
    if (!existsSync(file)) {
      await ev(`document.body.style.cssText = "margin:0;background:transparent";
        document.body.innerHTML = '<div id="g" style="width:${n.width}px;height:${n.height}px"></div>';
        document.getElementById("g").style.backgroundImage = ${JSON.stringify(n.gradient)}; true`);
      const shot = await cdp("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: n.width, height: n.height, scale: 1 }, captureBeyondViewport: true });
      writeFileSync(file, Buffer.from(shot.result.data, "base64"));
    }
    n.imageFile = file;
    delete n.gradient;
  }
  await cdp("Emulation.setDefaultBackgroundColorOverride", {});
  return tree;
}

// ------------------------------------------------------------ to Figma
/** Image paths to local files (scaled by Img), dropping layers we can't load. */
function resolve(n) {
  if (n.image) {
    let file = n.image.startsWith("/") ? join(PUB, decodeURI(n.image)) : null;
    if (n.image.endsWith("/wash.webp")) file = WASH;
    if (!file || !existsSync(file)) return null;
    const { flip, mask, image, ...rest } = n;
    const img = Img(file, n.width, n.height, rest);
    return img;
  }
  if (n.imageFile) {
    const { imageFile, ...rest } = n;
    return Img(imageFile, n.width, n.height, rest);
  }
  if (n.children) {
    // Fixed and sticky bars (the site nav) go last, so they draw on top.
    const kids = n.children.map(resolve).filter(Boolean);
    n.children = [...kids.filter((c) => !c.onTop), ...kids.filter((c) => c.onTop)];
    for (const c of n.children) delete c.onTop;
  }
  return n;
}

/** Bytes a node costs to send: its JSON plus its images as base64. */
const cost = (n) => (n.image ? statSync(n.image).size * 1.4 : 0) + JSON.stringify({ ...n, children: undefined }).length + (n.children || []).reduce((a, c) => a + cost(c), 0);

/** Build `nodes` under `parentId` in calls of at most `limit` bytes. A node too
 *  heavy for one call goes in as an empty frame, then its children follow. */
async function place(nodes, parentId, limit = 3e6) {
  let cur = [];
  let size = 0;
  const flush = async () => {
    if (cur.length) await build(cur, { parentId });
    cur = [];
    size = 0;
  };
  for (const c of nodes) {
    const s = cost(c);
    if (s > limit && c.children?.length) {
      await flush();
      const { children, ...shell } = c;
      const res = await build([{ ...shell, children: [] }], { parentId });
      await place(children, res.roots[0].id, limit);
      continue;
    }
    if (cur.length && size + s > limit) await flush();
    cur.push(c);
    size += s;
  }
  await flush();
}

await fig("set_current_page", { pageId: page });
const STACK = process.env.FG_STACK === "1";
const GAP = Number(process.env.FG_GAP || 400);
let stackY = Number(process.env.FG_Y0 || 0);
const existing = new Map();
if (process.env.FG_REPLACE === "1") {
  const doc = await fig("get_document_info", {});
  for (const c of doc.children || []) existing.set(c.name, c.id);
}
const log = [];
for (const [row, [area, name, path, session, opts]] of SCREENS.entries()) {
  if (only.length && !only.includes(name)) continue;
  let x = Number(process.env.FG_X0 || 0);
  const trees = [];
  for (const size of SIZES) trees.push(await capture(path, size, session, opts));
  const y = STACK ? stackY : row * PITCH;
  stackY += Math.max(...trees.map((t) => t.height)) + GAP;
  for (const [i, size] of SIZES.entries()) {
    const tree = trees[i];
    const frameName = `${area} / ${name} / ${size.key}`;
    if (existing.has(frameName)) await fig("delete_node", { nodeId: existing.get(frameName) });
    const board = { type: "frame", name: frameName, width: tree.width, height: tree.height, fill: tree.fill, clip: true, x, y, children: [] };
    const res = await build([board]);
    const id = res.roots[0].id;
    const kids = tree.children.map(resolve).filter(Boolean);
    await place(kids, id);
    log.push(`${name} / ${size.key}: ${id} ${tree.width}x${tree.height}`);
    console.log(log.at(-1));
    x += size.w + 120;
  }
}
ws.close();
chrome.kill();
