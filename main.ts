// 19 November 2026 - The Day in One Page (v2)
// A photographic front page: the Gulf war widens, the Kerch Bridge is hit
// a third time, Anthropic's record IPO debuts, GTA VI launches, Gaza's
// ground operation, and Voyager 1 reaches one light-day.
// Node 22, stdlib only, no network. Deterministic: same bytes every run.
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";
import * as crypto from "node:crypto";

const W = 1024;
const H = 1024;
const PAPER: [number, number, number] = [245, 240, 225];
const INK: [number, number, number] = [22, 33, 58];
const RED: [number, number, number] = [200, 16, 46];
const NAVY: [number, number, number] = [27, 58, 107];
const TEAL: [number, number, number] = [14, 124, 107];
const ORANGE: [number, number, number] = [211, 84, 0];
const DARKRED: [number, number, number] = [139, 26, 26];
const PURPLE: [number, number, number] = [91, 74, 138];
const WHITE: [number, number, number] = [255, 255, 255];

// ---------------------------------------------------------------- font
// Bold 8x10 bitmap font, one glyph = 10 rows of 8 bits ("1" = ink).
// Designed for this entry: thick strokes, readable at small sizes.
const FONT: Record<string, string[]> = {
  A: ["01111100", "11000011", "11000011", "11000011", "11111111", "11000011", "11000011", "11000011", "11000011", "00000000"],
  B: ["11111100", "11000011", "11000011", "11111100", "11000011", "11000011", "11000011", "11111100", "00000000", "00000000"],
  C: ["01111110", "11000011", "11000000", "11000000", "11000000", "11000000", "11000011", "01111110", "00000000", "00000000"],
  D: ["11111000", "11000110", "11000011", "11000011", "11000011", "11000011", "11000110", "11111000", "00000000", "00000000"],
  E: ["11111111", "11000000", "11000000", "11111100", "11000000", "11000000", "11000000", "11111111", "00000000", "00000000"],
  F: ["11111111", "11000000", "11000000", "11111100", "11000000", "11000000", "11000000", "11000000", "00000000", "00000000"],
  G: ["01111110", "11000011", "11000000", "11000000", "11001111", "11000011", "11000011", "01111111", "00000000", "00000000"],
  H: ["11000011", "11000011", "11000011", "11111111", "11000011", "11000011", "11000011", "11000011", "00000000", "00000000"],
  I: ["01111110", "00011000", "00011000", "00011000", "00011000", "00011000", "00011000", "01111110", "00000000", "00000000"],
  J: ["00011111", "00000011", "00000011", "00000011", "00000011", "11000011", "11000011", "01111100", "00000000", "00000000"],
  K: ["11000011", "11000110", "11001100", "11111000", "11001100", "11000110", "11000011", "11000011", "00000000", "00000000"],
  L: ["11000000", "11000000", "11000000", "11000000", "11000000", "11000000", "11000000", "11111111", "00000000", "00000000"],
  M: ["11000011", "11100111", "11011011", "11011011", "11000011", "11000011", "11000011", "11000011", "00000000", "00000000"],
  N: ["11000011", "11100011", "11110011", "11011011", "11001111", "11000111", "11000011", "11000011", "00000000", "00000000"],
  O: ["01111100", "11000011", "11000011", "11000011", "11000011", "11000011", "11000011", "01111100", "00000000", "00000000"],
  P: ["11111100", "11000011", "11000011", "11111100", "11000000", "11000000", "11000000", "11000000", "00000000", "00000000"],
  Q: ["01111100", "11000011", "11000011", "11000011", "11000011", "11011011", "11001101", "01111100", "00000011", "00000000"],
  R: ["11111100", "11000011", "11000011", "11111100", "11001100", "11000110", "11000011", "11000011", "00000000", "00000000"],
  S: ["01111110", "11000011", "11000000", "01111100", "00000011", "00000011", "11000011", "01111110", "00000000", "00000000"],
  T: ["11111111", "00011000", "00011000", "00011000", "00011000", "00011000", "00011000", "00011000", "00000000", "00000000"],
  U: ["11000011", "11000011", "11000011", "11000011", "11000011", "11000011", "11000011", "01111100", "00000000", "00000000"],
  V: ["11000011", "11000011", "11000011", "11000011", "11000011", "01100110", "00111100", "00011000", "00000000", "00000000"],
  W: ["11000011", "11000011", "11000011", "11000011", "11011011", "11011011", "11100111", "11000011", "00000000", "00000000"],
  X: ["11000011", "11000011", "01100110", "00111100", "00111100", "01100110", "11000011", "11000011", "00000000", "00000000"],
  Y: ["11000011", "11000011", "01100110", "00111100", "00011000", "00011000", "00011000", "00011000", "00000000", "00000000"],
  Z: ["11111111", "00000011", "00000110", "00001100", "00011000", "00110000", "01100000", "11111111", "00000000", "00000000"],
  "0": ["01111100", "11000011", "11000011", "11001111", "11011111", "11110011", "11000011", "01111100", "00000000", "00000000"],
  "1": ["00011000", "00111000", "00011000", "00011000", "00011000", "00011000", "00011000", "00111100", "00000000", "00000000"],
  "2": ["01111100", "11000011", "00000011", "00000110", "00001100", "00110000", "01100000", "11111111", "00000000", "00000000"],
  "3": ["11111100", "00000011", "00000011", "01111100", "00000011", "00000011", "00000011", "11111100", "00000000", "00000000"],
  "4": ["00000110", "00001110", "00011110", "00110110", "01100110", "11111111", "00000110", "00000110", "00000000", "00000000"],
  "5": ["11111111", "11000000", "11111100", "00000011", "00000011", "00000011", "11000011", "01111100", "00000000", "00000000"],
  "6": ["01111100", "11000000", "11000000", "11111100", "11000011", "11000011", "11000011", "01111100", "00000000", "00000000"],
  "7": ["11111111", "00000011", "00000110", "00001100", "00011000", "00011000", "00011000", "00011000", "00000000", "00000000"],
  "8": ["01111100", "11000011", "11000011", "01111100", "11000011", "11000011", "11000011", "01111100", "00000000", "00000000"],
  "9": ["01111100", "11000011", "11000011", "11000011", "01111111", "00000011", "00000011", "01111100", "00000000", "00000000"],
  " ": ["00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000"],
  ".": ["00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00110000", "00110000"],
  ",": ["00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00110000", "00100000"],
  ":": ["00000000", "00110000", "00110000", "00000000", "00000000", "00110000", "00110000", "00000000", "00000000", "00000000"],
  ";": ["00000000", "00110000", "00110000", "00000000", "00110000", "00110000", "00100000", "00010000", "00000000", "00000000"],
  "-": ["00000000", "00000000", "00000000", "00000000", "01111110", "00000000", "00000000", "00000000", "00000000", "00000000"],
  "'": ["00011000", "00011000", "00110000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000"],
  "/": ["00000011", "00000110", "00001100", "00011000", "00110000", "01100000", "11000000", "11000000", "00000000", "00000000"],
  "%": ["11000011", "11000110", "00001100", "00011000", "00110000", "01100011", "11000011", "00000000", "00000000", "00000000"],
  "$": ["00011000", "01111110", "11011000", "01111100", "00011011", "01111110", "00011000", "00000000", "00000000", "00000000"],
  "!": ["00011000", "00011000", "00011000", "00011000", "00011000", "00011000", "00000000", "00110000", "00000000", "00000000"],
  "?": ["01111100", "11000011", "00000011", "00001110", "00011000", "00011000", "00000000", "00011000", "00000000", "00000000"],
  "(": ["00001100", "00011000", "00110000", "00110000", "00110000", "00110000", "00011000", "00001100", "00000000", "00000000"],
  ")": ["00110000", "00011000", "00001100", "00001100", "00001100", "00001100", "00011000", "00110000", "00000000", "00000000"],
  "&": ["01111000", "11000110", "11000110", "01111000", "11001100", "11000110", "11000110", "01111101", "00000000", "00000000"],
  "+": ["00000000", "00011000", "00011000", "01111110", "00011000", "00011000", "00000000", "00000000", "00000000", "00000000"],
  "=": ["00000000", "00000000", "11111111", "00000000", "11111111", "00000000", "00000000", "00000000", "00000000", "00000000"],
  "|": ["00011000", "00011000", "00011000", "00011000", "00011000", "00011000", "00011000", "00011000", "00000000", "00000000"],
};

function textWidth(text: string, scale: number): number {
  return text.length * 8 * scale;
}

// ---------------------------------------------------------------- PNG
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function pngEncode(rgba: Buffer, w: number, h: number): Buffer {
  const bpp = 4;
  // Per-row filter selection: try all five filters, keep the one whose
  // filtered bytes have the smallest sum of absolute (signed) values.
  const raw = Buffer.alloc(h * (1 + w * bpp));
  for (let y = 0; y < h; y++) {
    const row = rgba.subarray(y * w * bpp, (y + 1) * w * bpp);
    const prev = y > 0 ? rgba.subarray((y - 1) * w * bpp, y * w * bpp) : null;
    let bestType = 0;
    let bestScore = Infinity;
    let best: Buffer | null = null;
    for (let ft = 0; ft <= 4; ft++) {
      const f = Buffer.alloc(w * bpp);
      for (let x = 0; x < w * bpp; x++) {
        const a = x >= bpp ? row[x - bpp] : 0;
        const b = prev ? prev[x] : 0;
        const c = prev && x >= bpp ? prev[x - bpp] : 0;
        let pred = 0;
        if (ft === 1) pred = a;
        else if (ft === 2) pred = b;
        else if (ft === 3) pred = (a + b) >> 1;
        else if (ft === 4) {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        }
        f[x] = (row[x] - pred) & 0xff;
      }
      let score = 0;
      for (const v of f) score += v < 128 ? v : 256 - v;
      if (score < bestScore) {
        bestScore = score;
        bestType = ft;
        best = f;
      }
    }
    raw[y * (1 + w * bpp)] = bestType;
    (best as Buffer).copy(raw, y * (1 + w * bpp) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ---------------------------------------------------------------- image
class Img {
  buf: Buffer;
  w: number;
  h: number;
  constructor(w: number, h: number, bg: [number, number, number]) {
    this.w = w;
    this.h = h;
    this.buf = Buffer.alloc(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      this.buf[i * 4] = bg[0];
      this.buf[i * 4 + 1] = bg[1];
      this.buf[i * 4 + 2] = bg[2];
      this.buf[i * 4 + 3] = 255;
    }
  }
  set(x: number, y: number, c: [number, number, number]): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
    this.buf[i + 3] = 255;
  }
  fill(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
  }
  border(x: number, y: number, w: number, h: number, t: number, c: [number, number, number]): void {
    this.fill(x, y, w, t, c);
    this.fill(x, y + h - t, w, t, c);
    this.fill(x, y, t, h, c);
    this.fill(x + w - t, y, t, h, c);
  }
  blit(src: Buffer, sw: number, sh: number, dx: number, dy: number): void {
    for (let y = 0; y < sh; y++)
      for (let x = 0; x < sw; x++) {
        const si = (y * sw + x) * 4;
        this.set(dx + x, dy + y, [src[si], src[si + 1], src[si + 2]]);
      }
  }
  text(x: number, y: number, s: string, scale: number, c: [number, number, number]): void {
    let cx = x;
    for (const ch of s) {
      const g = FONT[ch] ?? FONT[" "];
      for (let r = 0; r < 10; r++)
        for (let col = 0; col < 8; col++)
          if (g[r][col] === "1")
            for (let dy = 0; dy < scale; dy++)
              for (let dx = 0; dx < scale; dx++)
                this.set(cx + col * scale + dx, y + r * scale + dy, c);
      cx += 8 * scale;
    }
  }
  textCentered(cx: number, y: number, s: string, scale: number, c: [number, number, number]): void {
    this.text(cx - Math.floor(textWidth(s, scale) / 2), y, s, scale, c);
  }
}

function wrap(s: string, maxChars: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? cur + " " + w : w;
    if (next.length <= maxChars) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------- assets
const ROOT = path.dirname(path.resolve(process.argv[1]));

function loadAsset(name: string): { buf: Buffer; w: number; h: number } {
  const idx = fs.readFileSync(path.join(ROOT, "assets", name + ".idx"));
  const pal = fs.readFileSync(path.join(ROOT, "assets", name + ".pal"));
  const total = idx.length;
  // Dimensions are known from the build; derive from the file sizes.
  const dims: Record<string, [number, number]> = {
    hero: [488, 282],
    kerch: [480, 116],
    anthropic: [480, 116],
    gta: [304, 88],
    gaza: [304, 88],
    voyager: [304, 88],
  };
  const [w, h] = dims[name];
  if (idx.length !== w * h) throw new Error(`asset ${name}: ${idx.length} != ${w}x${h}`);
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < total; i++) {
    const p = idx[i] * 3;
    buf[i * 4] = pal[p];
    buf[i * 4 + 1] = pal[p + 1];
    buf[i * 4 + 2] = pal[p + 2];
    buf[i * 4 + 3] = 255;
  }
  return { buf, w, h };
}

// ---------------------------------------------------------------- page
function build(): Buffer {
  const img = new Img(W, H, PAPER);
  const hero = loadAsset("hero");
  const kerch = loadAsset("kerch");
  const anthropic = loadAsset("anthropic");
  const gta = loadAsset("gta");
  const gaza = loadAsset("gaza");
  const voyager = loadAsset("voyager");

  // Masthead
  img.text(24, 12, "WORLD NEWS", 6, INK);
  img.fill(688, 12, 312, 56, RED);
  img.textCentered(844, 25, "19 NOV 2026", 3, WHITE);
  img.fill(24, 80, 976, 3, INK);
  img.text(24, 88, "THURSDAY 19 NOVEMBER 2026", 2, INK);
  const src = "SOURCES: REUTERS, AP, BBC, CNN";
  img.text(1000 - textWidth(src, 2), 88, src, 2, INK);
  img.fill(24, 110, 976, 3, INK);

  // Hero kicker
  img.fill(24, 118, 976, 26, RED);
  img.text(36, 121, "GULF WAR WIDENS", 2, WHITE);

  // Hero: text left, photo right
  img.text(24, 150, "IRAN HITS", 4, INK);
  img.text(24, 194, "US BASE IN", 4, INK);
  img.text(24, 238, "KUWAIT", 4, INK);
  img.fill(24, 284, 200, 5, RED);
  img.text(24, 292, "IRAN DRONES HIT ALI AL SALEM", 2, INK);
  img.text(24, 316, "AIR BASE. FIRST ATTACK ON", 2, INK);
  img.text(24, 340, "KUWAIT SINCE SEPT. BAHRAIN:", 2, INK);
  img.text(24, 364, "3RD INTERCEPT IN A WEEK.", 2, INK);
  img.text(24, 396, "HORMUZ: 11 HURT, 1 MISSING", 2, RED);
  img.blit(hero.buf, hero.w, hero.h, 512, 146);

  // Row 2: two cells
  const row2 = (x: number, kicker: string, kc: [number, number, number], head: string[], body: string[], photo: { buf: Buffer; w: number; h: number }) => {
    img.border(x, 436, 488, 256, 2, INK);
    img.fill(x + 2, 438, 484, 24, kc);
    img.text(x + 14, 441, kicker, 2, WHITE);
    head.forEach((line, i) => img.text(x + 14, 468 + i * 32, line, 3, INK));
    body.forEach((line, i) => img.text(x + 14, 532 + i * 24, line, 2, INK));
    img.blit(photo.buf, photo.w, photo.h, x + 4, 576);
  };
  row2(24, "UKRAINE - RUSSIA", NAVY, ["KERCH BRIDGE", "HIT AGAIN"],
    ["3RD STRIKE IN 3 DAYS.", "RAIL SPAN HIT. TRAFFIC HALTED"], kerch);
  row2(512, "BUSINESS", TEAL, ["ANTHROPIC'S $81BN", "IPO DEBUTS TODAY"],
    ["$83 A SHARE. $1.5T VALUE.", "BIGGEST IPO EVER."], anthropic);

  // Row 3: three cells
  const row3 = (x: number, kicker: string, kc: [number, number, number], head: string[], body: string[], photo: { buf: Buffer; w: number; h: number }) => {
    img.border(x, 700, 320, 216, 2, INK);
    img.blit(photo.buf, photo.w, photo.h, x + 8, 702);
    img.fill(x + 2, 792, 316, 22, kc);
    img.text(x + 10, 795, kicker, 2, WHITE);
    head.forEach((line, i) => img.text(x + 10, 820 + i * 22, line, 2, INK));
    body.forEach((line, i) => img.text(x + 10, 866 + i * 22, line, 2, INK));
  };
  row3(24, "CULTURE", ORANGE, ["GTA VI", "LAUNCHES TODAY"],
    ["99 METASCORE. 17M", "COPIES. $1.65BN."], gta);
  row3(352, "MIDDLE EAST", DARKRED, ["GAZA: TANKS", "CROSS CEASEFIRE"],
    ["FIRST GROUND OP", "SINCE OCT 2025."], gaza);
  row3(680, "SCIENCE", PURPLE, ["VOYAGER 1: ONE", "LIGHT-DAY"],
    ["26BN KM FROM EARTH", "NASA CONFIRMS TODAY"], voyager);

  // Footer ticker
  img.fill(24, 924, 976, 92, INK);
  img.text(36, 932, "SHENZHEN: TRUMP, XI, PUTIN MEET TODAY - ICJ ON MYANMAR", 2, WHITE);
  img.text(36, 960, "EBOLA: 11,376 CASES - MEASLES: 5,400+ - AKVAN NEARS INDIA", 2, WHITE);
  img.text(36, 988, "GAZA FLOODS: 4 NATIONS DEMAND AID - NVIDIA BEATS FORECASTS", 2, WHITE);

  return pngEncode(img.buf, W, H);
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  fs.mkdirSync(outDir, { recursive: true });
  const png = build();
  if (png.length > 1048576) throw new Error(`entry too large: ${png.length} bytes`);
  const out = path.join(outDir, "entry.png");
  fs.writeFileSync(out, png);
  const sha = crypto.createHash("sha256").update(png).digest("hex");
  console.log(`WROTE ${out} ${png.length} bytes sha256=${sha}`);
}

main();
