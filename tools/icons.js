// 홈 화면 아이콘(PNG)을 그린다: node tools/icons.js
// 밤하늘 위의 용자리. 외부 라이브러리 없이 픽셀을 직접 칠하고 PNG로 묶는다.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// 용자리 별 (0~1 좌표). 머리의 사각형에서 시작해 꼬리까지 구불구불 이어진다. 표지 SVG와 같은 좌표
const STARS = [
  [0.7, 0.2, 1.25], [0.8, 0.25, 1], [0.77, 0.35, 0.9], [0.67, 0.31, 1],
  [0.57, 0.43, 0.85], [0.62, 0.55, 0.8], [0.5, 0.62, 0.9], [0.38, 0.57, 0.8],
  [0.29, 0.66, 0.85], [0.35, 0.77, 0.75], [0.22, 0.84, 0.9],
];
const LINES = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10]];

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function draw(size) {
  const px = Buffer.alloc(size * size * 4);
  const s = size;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const u = x / s, v = y / s;
      // 바탕: 위는 깊은 남색, 아래로 갈수록 보랏빛
      let r = 10 + 22 * v, g = 14 + 12 * v, b = 38 + 30 * v;
      // 별자리 선
      let line = 0;
      for (const [i, j] of LINES) {
        const d = segDist(u, v, STARS[i][0], STARS[i][1], STARS[j][0], STARS[j][1]) * s;
        line = Math.max(line, Math.max(0, 1 - Math.abs(d) / (s * 0.006 + 0.6)));
      }
      r += (240 - r) * line * 0.35; g += (200 - g) * line * 0.35; b += (121 - b) * line * 0.35;
      // 별: 또렷한 중심 + 은은한 빛무리
      for (const [sx, sy, k] of STARS) {
        const d = Math.hypot(u - sx, v - sy) * s;
        const core = Math.max(0, Math.min(1, (s * 0.022 * k - d) / 1.2));
        const glow = Math.exp(-((d / (s * 0.06 * k)) ** 2)) * 0.45;
        const a = Math.min(1, core + glow);
        r += (255 - r) * a; g += (226 - g) * a; b += (160 - b) * a;
      }
      const o = (y * s + x) * 4;
      px[o] = Math.round(r); px[o + 1] = Math.round(g); px[o + 2] = Math.round(b); px[o + 3] = 255;
    }
  }
  return png(size, px);
}

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

const dir = path.join(__dirname, "..", "icons");
fs.mkdirSync(dir, { recursive: true });
for (const [name, size] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]]) {
  fs.writeFileSync(path.join(dir, name), draw(size));
  console.log(`icons/${name} ${size}px`);
}
