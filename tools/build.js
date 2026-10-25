// 원고(.md)를 사이트 데이터로 바꾼다: node tools/build.js
// 상위 폴더의 "01_프롤로그_1화.md" 같은 화별 원고만 읽는다. 00_설정집.md(스포일러)는 절대 넣지 않는다.
//
// 원고 형식
//   # 소설 제목
//   ## 프롤로그 1화 — 용자리의 딸
//   ---
//   본문 (빈 줄로 문단 구분, *기울임*)
//   ---            ← 장면 전환
//   ✦ ✦ ✦          ← 큰 전환 (시점·시간이 바뀔 때)
//   *(프롤로그 1화 끝)*   ← 지운다. 사이트가 끝 표시를 따로 그린다
const fs = require("fs");
const path = require("path");

const site = path.join(__dirname, "..");
const novelDir = path.join(site, "..");
const out = path.join(site, "data", "chapters.js");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");

function parse(file) {
  const raw = fs.readFileSync(path.join(novelDir, file), "utf8").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const head = raw.match(/^##\s+(.+?)\s+—\s+(.+)$/m);
  if (!head) throw new Error(`${file}: "## 프롤로그 1화 — 제목" 줄이 없어요`);
  const label = head[1].trim();
  const title = head[2].trim();
  const part = label.replace(/\s*\d+화$/, "").trim() || label;

  const body = raw.slice(raw.indexOf(head[0]) + head[0].length);
  const blocks = [];
  let chars = 0;
  for (let chunk of body.split(/\n\s*\n/)) {
    chunk = chunk.trim();
    if (!chunk) continue;
    if (/^\*\(.*끝\)\*$/.test(chunk)) continue;
    if (/^-{3,}$/.test(chunk)) {
      blocks.push(["br"]);
      continue;
    }
    if (/^✦[\s✦]*$/.test(chunk)) {
      blocks.push(["orn"]);
      continue;
    }
    const text = chunk.split("\n").map((l) => l.trim()).join(" ");
    chars += text.replace(/\*/g, "").length;
    blocks.push(["p", inline(text)]);
  }

  // 붙어 있는 전환 표시는 하나로: 큰 전환(✦)이 섞여 있으면 그것만 남긴다. 처음·끝의 전환은 지운다
  const merged = [];
  for (const b of blocks) {
    const prev = merged[merged.length - 1];
    if (b[0] !== "p" && prev && prev[0] !== "p") {
      if (b[0] === "orn") prev[0] = "orn";
      continue;
    }
    merged.push(b);
  }
  while (merged.length && merged[0][0] !== "p") merged.shift();
  while (merged.length && merged[merged.length - 1][0] !== "p") merged.pop();

  const no = file.match(/^(\d+)_/)[1];
  return { id: no, label, part, title, chars, blocks: merged };
}

const files = fs
  .readdirSync(novelDir)
  .filter((f) => /^\d+_.+\.md$/.test(f) && !f.startsWith("00_"))
  .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

const chapters = files.map(parse);
const data = { title: "말포이 양은 솔직하지 않다", builtAt: new Date().toISOString().slice(0, 10), chapters };
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, "// tools/build.js 가 원고에서 만든 파일이에요. 직접 고치지 말고 원고를 고친 뒤 다시 빌드하세요.\nwindow.NOVEL = " + JSON.stringify(data, null, 1) + ";\n");
console.log(`${chapters.length}화 → data/chapters.js`);
for (const c of chapters) console.log(`  ${c.id} ${c.label} · ${c.title} · ${c.chars.toLocaleString()}자 · 문단 ${c.blocks.filter((b) => b[0] === "p").length}`);
