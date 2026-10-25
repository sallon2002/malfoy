// 원고(.md)를 사이트 데이터로 바꾼다: node tools/build.js
// 한국어 원고는 상위 폴더의 "01_프롤로그_1화.md", 일본어 원고는 "일본어판/01_プロローグ_第1話.md".
// 00_설정집.md(스포일러)는 절대 넣지 않는다.
//
// 원고 형식 (두 언어 같음)
//   # 소설 제목
//   ## 프롤로그 1화 — 용자리의 딸        /  ## プロローグ 第1話 — りゅう座の娘
//   ---
//   본문 (빈 줄로 문단 구분, *기울임*은 손글씨로 보인다)
//   ---            ← 장면 전환
//   ✦ ✦ ✦          ← 큰 전환 (시점·시간이 바뀔 때)
//   ![설명](images/first-look.jpg)  ← 삽화 (홈페이지/images 안의 파일). 일본어판도 같은 자리에 같은 줄
//   > 문단         ← 액자 (프롤로그의 어른 해리처럼 다른 시간의 장면). 한 톤 흐리게 보인다
//   *(프롤로그 1화 끝)*  /  *(プロローグ 第1話 おわり)*   ← 지운다. 사이트가 끝 표시를 따로 그린다
//
// 일본어판은 한국어판과 문단이 1:1로 맞아야 한다. 그래야 KR⇄JP를 바꿔도 같은 문단에서 이어 읽는다.
// 문단 수가 다르면 빌드할 때 경고를 띄운다.
const fs = require("fs");
const path = require("path");

const site = path.join(__dirname, "..");
const novelDir = path.join(site, "..");
const SOURCES = {
  ko: { dir: novelDir, title: "말포이 양은 솔직하지 않다" },
  ja: { dir: path.join(novelDir, "일본어판"), title: "マルフォイ嬢は素直じゃない" },
};
const out = path.join(site, "data", "chapters.js");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");

function parse(dir, file) {
  const raw = fs.readFileSync(path.join(dir, file), "utf8").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const head = raw.match(/^##\s+(.+?)\s+—\s+(.+)$/m);
  if (!head) throw new Error(`${file}: "## 프롤로그 1화 — 제목" 줄이 없어요`);
  const label = head[1].trim();
  const title = head[2].trim();
  const part = label.replace(/\s*第?\s*\d+\s*[화話]$/, "").trim() || label;

  const body = raw.slice(raw.indexOf(head[0]) + head[0].length);
  const blocks = [];
  let chars = 0;
  for (let chunk of body.split(/\n\s*\n/)) {
    chunk = chunk.trim();
    if (!chunk) continue;
    if (/^\*\(.*(끝|おわり|終わり)\)\*$/.test(chunk)) continue;
    if (/^-{3,}$/.test(chunk)) {
      blocks.push(["br"]);
      continue;
    }
    if (/^✦[\s✦]*$/.test(chunk)) {
      blocks.push(["orn"]);
      continue;
    }
    // ![설명](images/파일.jpg) 한 줄은 삽화. 책 한 쪽을 통째로 차지한다
    const img = chunk.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) {
      const file = path.join(site, img[2]);
      if (!fs.existsSync(file)) throw new Error(`${file}: 삽화 파일이 없어요 (${img[2]})`);
      blocks.push(["img", img[2], esc(img[1])]);
      continue;
    }
    // "> " 로 시작하는 문단은 액자(다른 시간 · 다른 시점의 장면). 사이트에서 한 톤 흐리게 보인다
    const lines = chunk.split("\n").map((l) => l.trim());
    const frame = lines.every((l) => l.startsWith(">"));
    const text = lines.map((l) => (frame ? l.replace(/^>\s?/, "") : l)).join(" ");
    chars += text.replace(/\*/g, "").length;
    blocks.push(frame ? ["p", inline(text), "f"] : ["p", inline(text)]);
  }

  // 붙어 있는 전환 표시는 하나로: 큰 전환(✦)이 섞여 있으면 그것만 남긴다. 처음·끝의 전환은 지운다
  const isBreak = (b) => b && (b[0] === "br" || b[0] === "orn");
  const merged = [];
  for (const b of blocks) {
    const prev = merged[merged.length - 1];
    if (isBreak(b) && isBreak(prev)) {
      if (b[0] === "orn") prev[0] = "orn";
      continue;
    }
    merged.push(b);
  }
  while (merged.length && isBreak(merged[0])) merged.shift();
  while (merged.length && isBreak(merged[merged.length - 1])) merged.pop();

  const no = file.match(/^(\d+)_/)[1];
  return { id: no, label, part, title, chars, blocks: merged };
}

function readLang(src) {
  if (!fs.existsSync(src.dir)) return [];
  return fs
    .readdirSync(src.dir)
    .filter((f) => /^\d+_.+\.md$/.test(f) && !f.startsWith("00_"))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .map((f) => parse(src.dir, f));
}

const langs = {};
for (const [lang, src] of Object.entries(SOURCES)) langs[lang] = { title: src.title, chapters: readLang(src) };

// 문단 정렬 검사: 같은 번호의 화는 블록 종류의 순서가 같아야 한다
let warn = 0;
for (const ja of langs.ja.chapters) {
  const ko = langs.ko.chapters.find((c) => c.id === ja.id);
  if (!ko) {
    console.warn(`⚠ 일본어판 ${ja.id}화에 대응하는 한국어 원고가 없어요`);
    warn++;
    continue;
  }
  const a = ko.blocks.map((b) => b[0]).join("");
  const b = ja.blocks.map((b) => b[0]).join("");
  if (a !== b) {
    const at = [...a].findIndex((ch, i) => ch !== b[i]);
    console.warn(`⚠ ${ja.id}화: 한국어 ${ko.blocks.length}블록 / 일본어 ${ja.blocks.length}블록 — ${at + 1}번째 블록부터 어긋나요`);
    warn++;
  }
}

const data = { builtAt: new Date().toISOString().slice(0, 10), langs };
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, "// tools/build.js 가 원고에서 만든 파일이에요. 직접 고치지 말고 원고를 고친 뒤 다시 빌드하세요.\nwindow.NOVEL = " + JSON.stringify(data, null, 1) + ";\n");
for (const [lang, d] of Object.entries(langs)) {
  console.log(`[${lang}] ${d.chapters.length}화`);
  for (const c of d.chapters) console.log(`  ${c.id} ${c.label} · ${c.title} · ${c.chars.toLocaleString()}자 · 문단 ${c.blocks.filter((b) => b[0] === "p").length}`);
}
console.log(warn ? `경고 ${warn}건` : "문단 정렬 OK → data/chapters.js");
