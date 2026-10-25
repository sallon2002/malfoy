/*
  말포이 양은 솔직하지 않다 / マルフォイ嬢は素直じゃない — 책 리더
  - 화면은 둘: 서재(#/)와 읽기(#/read/01)
  - 읽던 자리는 "몇 번째 문단의 어디쯤"으로 저장한다. 글자 크기를 바꿔도 같은 문장으로 돌아온다
  - 앱을 껐다 켜면(주소에 화 번호가 없으면) 마지막으로 읽던 화의 그 자리로 바로 연다
  - KR ⇄ JP: 일본어판은 한국어판과 문단이 1:1이라, 언어를 바꿔도 같은 문단에서 이어진다
  - 저장은 이 기기의 localStorage. 아이폰은 「홈 화면에 추가」한 앱이 가장 오래 기억한다
*/
(function () {
  "use strict";

  var NOVEL = window.NOVEL || { langs: {} };
  var KEY = "malfoy-reader-v1";
  var SIZES = [15, 16, 17, 18, 19, 20, 22, 24];
  var LEADS = [1.7, 1.85, 2.0];
  var CPM = { ko: 700, ja: 550 }; // 1분에 읽는 글자 수 (보통 속도)
  var ANCHOR_LINE = 72; // 화면 위에서 이만큼 아래를 "지금 읽는 줄"로 본다
  var THEME_COLOR = { paper: "#f6f1e7", sepia: "#ecdfc4", night: "#111216" };

  // ───────── 화면 글자 (한국어 / 일본어) ─────────
  var T = {
    ko: {
      docTitle: "말포이 양은 솔직하지 않다",
      appTitle: "말포이 양",
      kicker: "해리 포터 팬픽 · 젠더스왑 AU",
      coverTitle: "말포이 양은<br />솔직하지 않다",
      serial: function (n) { return "연재 중 · " + n + "화"; },
      soon: "곧 연재를 시작해요",
      toc: "목차",
      empty: "아직 올라온 화가 없어요.",
      foot1: "비상업 팬픽입니다. 해리 포터의 인물과 세계는 원작자에게 있어요.",
      foot2: "아이폰 Safari에서 <b>공유 → 홈 화면에 추가</b>를 하면 앱처럼 열리고, 읽던 곳이 더 안전하게 기억돼요.",
      contContinue: "이어 읽기",
      contFirst: "첫 화부터 읽기",
      contNext: "다음 화",
      contDone: "최신 화까지 다 읽었어요",
      readPct: function (p) { return p + "% 읽음"; },
      leftMin: function (m) { return "남은 시간 약 " + m + "분"; },
      waitNext: "다음 화를 기다려 주세요",
      about: function (m) { return "약 " + m + "분"; },
      btnReread: "다시 읽기",
      btnContinue: "이어서 읽기",
      btnRead: "읽기",
      stNew: "새 글",
      stDone: "다 읽음",
      back: "목차",
      settings: "보기 설정",
      meta: function (c, m) { return c.toLocaleString() + "자 · 약 " + m + "분"; },
      end: function (l) { return l + " 끝"; },
      next: "다음 화",
      soonNext: "다음 화는 준비 중이에요. 올라오면 목차에 「새 글」로 표시돼요.",
      prev: "‹ 이전 화",
      toToc: "목차로",
      leftReading: function (m) { return "이 화 남은 시간 약 " + m + "분"; },
      ending: "곧 끝나요",
      finished: "다 읽었어요",
      resumed: function (l, p) { return "이어서 읽는 중 · " + l + " · " + p + "%"; },
      missing: "이 화는 아직 한국어판이 없어요",
      lang: "언어",
      size: "글자 크기",
      lead: "줄 간격",
      lead0: "좁게",
      lead1: "보통",
      lead2: "넓게",
      font: "글꼴",
      serif: "명조",
      sans: "고딕",
      theme: "배경",
      paper: "종이",
      sepia: "세피아",
      night: "밤",
      glyph: "가",
      smaller: "글자 작게",
      bigger: "글자 크게",
    },
    ja: {
      docTitle: "マルフォイ嬢は素直じゃない",
      appTitle: "マルフォイ嬢",
      kicker: "ハリー・ポッター二次創作 · 性別反転パロ",
      coverTitle: "マルフォイ嬢は<br />素直じゃない",
      serial: function (n) { return "連載中 · 全" + n + "話"; },
      soon: "まもなく連載開始",
      toc: "目次",
      empty: "まだ公開された話はありません。",
      foot1: "非営利の二次創作です。ハリー・ポッターの登場人物と世界観の権利は原作者に帰属します。",
      foot2: "iPhoneのSafariで<b>共有 → ホーム画面に追加</b>すると、アプリのように開けて、読んでいた場所もより確実に保存されます。",
      contContinue: "続きから読む",
      contFirst: "第1話から読む",
      contNext: "次の話",
      contDone: "最新話まで読みました",
      readPct: function (p) { return p + "%読了"; },
      leftMin: function (m) { return "残り約" + m + "分"; },
      waitNext: "次の更新をお待ちください",
      about: function (m) { return "約" + m + "分"; },
      btnReread: "もう一度読む",
      btnContinue: "続きを読む",
      btnRead: "読む",
      stNew: "NEW",
      stDone: "読了",
      back: "目次",
      settings: "表示設定",
      meta: function (c, m) { return c.toLocaleString() + "字 · 約" + m + "分"; },
      end: function (l) { return l + " おわり"; },
      next: "次の話",
      soonNext: "次の話は準備中です。公開されると目次に「NEW」と表示されます。",
      prev: "‹ 前の話",
      toToc: "目次へ",
      leftReading: function (m) { return "この話の残り約" + m + "分"; },
      ending: "もうすぐ読み終わります",
      finished: "読み終わりました",
      resumed: function (l, p) { return "続きから · " + l + " · " + p + "%"; },
      missing: "この話はまだ翻訳中です",
      lang: "言語",
      size: "文字サイズ",
      lead: "行間",
      lead0: "狭め",
      lead1: "標準",
      lead2: "広め",
      font: "書体",
      serif: "明朝",
      sans: "ゴシック",
      theme: "背景",
      paper: "紙",
      sepia: "セピア",
      night: "夜",
      glyph: "あ",
      smaller: "文字を小さく",
      bigger: "文字を大きく",
    },
  };

  var $ = function (id) {
    return document.getElementById(id);
  };
  var root = document.documentElement;
  var library = $("library");
  var reader = $("reader");
  var page = $("page");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var appTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (navigator.standalone || matchMedia("(display-mode: standalone)").matches) root.classList.add("standalone");

  // ───────── 저장 ─────────
  var state = load();
  function load() {
    var s = null;
    try {
      s = JSON.parse(localStorage.getItem(KEY));
    } catch (e) {}
    if (!s || typeof s !== "object") s = {};
    var dark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
    // 처음 여는 기기는 휴대폰 언어를 따른다: 일본어 아이폰이면 JP로 시작
    var jp = /^ja\b/i.test(navigator.language || "");
    s.settings = Object.assign({ size: 3, lead: 1, font: "serif", theme: dark ? "night" : "paper", lang: jp ? "ja" : "ko" }, s.settings || {});
    s.progress = s.progress || {};
    return s;
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function lang() {
    return state.settings.lang === "ja" ? "ja" : "ko";
  }
  function t() {
    return T[lang()];
  }
  function chapters() {
    var d = NOVEL.langs && NOVEL.langs[lang()];
    return (d && d.chapters) || [];
  }
  function find(id) {
    var CH = chapters();
    for (var i = 0; i < CH.length; i++) if (CH[i].id === id) return i;
    return -1;
  }
  function shortLabel(c) {
    return c.label.replace(c.part, "").trim() || c.label;
  }
  function pctOf(id) {
    return Math.round((state.progress[id] || 0) * 100);
  }
  function minutes(chars) {
    return Math.max(1, Math.round(chars / CPM[lang()]));
  }

  // ───────── 언어 · 보기 설정 ─────────
  function applyLang() {
    var L = t();
    root.lang = lang();
    document.querySelectorAll("[data-t]").forEach(function (el) {
      el.innerHTML = L[el.dataset.t];
    });
    document.querySelectorAll(".glyph").forEach(function (b) {
      b.textContent = L.glyph;
      b.setAttribute("aria-label", b.classList.contains("big") ? L.bigger : L.smaller);
    });
    $("aa-glyph").textContent = L.glyph;
    $("aa-glyph-s").textContent = L.glyph;
    $("open-settings").setAttribute("aria-label", L.settings);
    $("sheet").setAttribute("aria-label", L.settings);
    $("back").setAttribute("aria-label", L.toToc);
    document.querySelectorAll(".lang-toggle [data-lang]").forEach(function (b) {
      b.classList.toggle("on", b.dataset.lang === lang());
    });
    appTitleMeta.content = L.appTitle;
  }

  function applySettings() {
    var st = state.settings;
    root.dataset.theme = st.theme;
    root.dataset.font = st.font;
    root.style.setProperty("--fs", SIZES[st.size] + "px");
    root.style.setProperty("--lh", LEADS[st.lead]);
    $("size-out").textContent = SIZES[st.size];
    document.querySelectorAll("#sheet [data-act]").forEach(function (b) {
      var act = b.dataset.act;
      if (act === "size") return;
      b.classList.toggle("on", String(st[act]) === b.dataset.v);
    });
    if (!reader.hidden) themeMeta.content = THEME_COLOR[st.theme];
  }

  // 언어 바꾸기: 읽는 중이면 같은 화 · 같은 문단으로, 서재면 서재를 다시 그린다
  function setLang(next) {
    if (next === lang()) return;
    var keep = currentAnchor();
    var id = current && current.id;
    state.settings.lang = next;
    applyLang();
    applySettings();
    if (!reader.hidden && id) {
      if (find(id) >= 0) {
        if (keep) state.last = { id: id, i: keep.i, f: keep.f, at: Date.now() };
        save();
        openChapter(id, true, true);
      } else {
        save();
        toast(t().missing);
        location.hash = "#/";
      }
    } else {
      save();
      renderLibrary();
    }
  }

  $("sheet").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var st = state.settings;
    if (b.dataset.act === "lang") return setLang(b.dataset.v);
    var keep = currentAnchor();
    if (b.dataset.act === "size") st.size = Math.max(0, Math.min(SIZES.length - 1, st.size + Number(b.dataset.v)));
    else if (b.dataset.act === "lead") st.lead = Number(b.dataset.v);
    else st[b.dataset.act] = b.dataset.v;
    applySettings();
    if (keep) restoreAnchor(keep);
    save();
  });
  document.querySelector(".lang-toggle").addEventListener("click", function (e) {
    var b = e.target.closest("[data-lang]");
    if (b) setLang(b.dataset.lang);
  });

  function openSheet() {
    $("sheet-bg").hidden = false;
    $("sheet").classList.add("open");
    $("sheet").setAttribute("aria-hidden", "false");
  }
  function closeSheet() {
    $("sheet-bg").hidden = true;
    $("sheet").classList.remove("open");
    $("sheet").setAttribute("aria-hidden", "true");
  }
  $("open-settings").addEventListener("click", function (e) {
    e.stopPropagation();
    openSheet();
  });
  $("sheet-bg").addEventListener("click", closeSheet);

  // ───────── 서재 ─────────
  function renderLibrary() {
    var L = t();
    var CH = chapters();
    $("cover-sub").textContent = CH.length ? L.serial(CH.length) : L.soon;

    // 이어 읽기 카드: 읽던 화가 있으면 그 화, 다 읽었으면 다음 화, 처음이면 첫 화
    var box = $("continue");
    if (!CH.length) {
      box.innerHTML = "";
    } else {
      var idx = state.last ? find(state.last.id) : -1;
      var kicker = L.contContinue;
      if (idx < 0) {
        idx = 0;
        kicker = L.contFirst;
      } else if ((state.progress[CH[idx].id] || 0) >= 0.98 && idx + 1 < CH.length) {
        idx += 1;
        kicker = L.contNext;
      }
      var c = CH[idx];
      var p = pctOf(c.id);
      var done = p >= 98;
      if (done) kicker = L.contDone;
      box.innerHTML =
        '<a class="cont-card" href="#/read/' + c.id + '">' +
        '<p class="cont-kicker">' + kicker + "</p>" +
        '<p class="cont-title">' + esc(c.label) + " · " + esc(c.title) + "</p>" +
        (p > 0
          ? '<div class="cont-meta"><span>' + L.readPct(p) + "</span><span>" + (done ? L.waitNext : L.leftMin(minutes(c.chars * (1 - p / 100)))) + "</span></div>" +
            '<div class="meter"><i style="width:' + p + '%"></i></div>'
          : '<div class="cont-meta"><span>' + L.about(minutes(c.chars)) + "</span><span></span></div>") +
        '<div class="cont-go">' + (done ? L.btnReread : p > 0 ? L.btnContinue : L.btnRead) + "</div></a>";
    }

    // 목차: 부(프롤로그, 1부…)별로 묶는다
    var html = "";
    var part = null;
    var lastId = state.last && state.last.id;
    CH.forEach(function (c) {
      if (c.part !== part) {
        part = c.part;
        html += '<h3 class="toc-part">' + esc(part) + "</h3>";
      }
      var pr = state.progress[c.id];
      var label, cls;
      if (pr == null) {
        label = L.stNew;
        cls = "new";
      } else if (pr >= 0.98) {
        label = L.stDone;
        cls = "done";
      } else {
        label = Math.round(pr * 100) + "%";
        cls = "now";
      }
      html +=
        '<a class="toc-row' + (c.id === lastId ? " current" : "") + '" href="#/read/' + c.id + '">' +
        '<span class="toc-no">' + esc(shortLabel(c)) + "</span>" +
        '<span class="toc-title">' + esc(c.title) + "</span>" +
        '<span class="toc-state ' + cls + '">' + label + "</span></a>";
    });
    $("toc").innerHTML = html || '<p class="toc-empty">' + L.empty + "</p>";
  }

  function showLibrary() {
    closeSheet();
    current = null;
    reader.hidden = true;
    library.hidden = false;
    document.title = t().docTitle;
    themeMeta.content = "#0b0e22";
    renderLibrary();
    window.scrollTo(0, 0);
  }

  // 표지의 밤하늘: 잔별은 매번 같은 자리에 (씨앗 고정), 용자리 별은 icons.js 와 같은 좌표
  (function drawSky() {
    var seed = 7;
    var rnd = function () {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    var dust = "";
    for (var i = 0; i < 70; i++) {
      var r = (rnd() * 0.22 + 0.06).toFixed(2);
      dust += '<circle cx="' + (rnd() * 100).toFixed(1) + '" cy="' + (rnd() * 100).toFixed(1) + '" r="' + r + '" opacity="' + (rnd() * 0.5 + 0.2).toFixed(2) + '" style="animation-delay:' + (rnd() * 6).toFixed(1) + 's"/>';
    }
    $("dust").innerHTML = dust;
    var stars = [[70, 20, 1.25], [80, 25, 1], [77, 35, 0.9], [67, 31, 1], [57, 43, 0.85], [62, 55, 0.8], [50, 62, 0.9], [38, 57, 0.8], [29, 66, 0.85], [35, 77, 0.75], [22, 84, 0.9]];
    $("draco-stars").innerHTML = stars
      .map(function (s, i) {
        return '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + (s[2] * 0.75).toFixed(2) + '" style="animation-delay:' + (i * 0.37).toFixed(2) + 's"/>';
      })
      .join("");
  })();

  // ───────── 읽기 ─────────
  var current = null;
  var bodyEls = [];

  // 문단 한 칸: 통째로 *기울임*인 문단은 그림책 손글씨, 일본어 지문은 첫머리를 한 칸 들여 쓴다
  function para(html) {
    if (/^<em>[^]*<\/em>$/.test(html)) return '<p class="hand">' + html + "</p>";
    if (lang() === "ja" && !/^[「『（(〈《“"]/.test(html)) return '<p class="ind">' + html + "</p>";
    return "<p>" + html + "</p>";
  }

  // resume: 읽던 자리로 (다 읽은 화는 처음부터) / exact: 언어를 바꿀 때처럼 무조건 그 문단으로
  function openChapter(id, resume, exact) {
    var CH = chapters();
    var i = find(id);
    if (i < 0) return showLibrary();
    var L = t();
    var c = CH[i];
    current = c;
    closeSheet();

    var body = c.blocks
      .map(function (b) {
        if (b[0] === "p") return para(b[1]);
        if (b[0] === "orn") return '<div class="orn" aria-hidden="true">✦ ✦ ✦</div>';
        return '<div class="scene" aria-hidden="true"></div>';
      })
      .join("");

    var next = CH[i + 1];
    var prev = CH[i - 1];
    page.innerHTML =
      '<header class="ch-head"><p class="ch-part">' + esc(c.label) + '</p><h1 class="ch-title">' + esc(c.title) + "</h1>" +
      '<p class="ch-meta">' + L.meta(c.chars, minutes(c.chars)) + "</p></header>" +
      '<div class="body">' + body + "</div>" +
      '<footer class="ch-end"><span class="star">✦</span><p>' + esc(L.end(c.label)) + "</p>" +
      (next
        ? '<button class="nav-next" type="button" data-go="' + next.id + '"><small>' + L.next + "</small><span>" + esc(next.label) + " · " + esc(next.title) + "</span></button>"
        : '<p class="soon">' + L.soonNext + "</p>") +
      '<div class="nav-row">' +
      (prev ? '<button type="button" data-go="' + prev.id + '">' + L.prev + "</button>" : "<span></span>") +
      '<button type="button" data-go="toc">' + L.toToc + "</button></div></footer>";

    bodyEls = Array.prototype.slice.call(page.querySelectorAll(".body > *"));
    library.hidden = true;
    reader.hidden = false;
    document.title = c.label + " · " + c.title;
    $("bar-title").textContent = c.label;
    themeMeta.content = THEME_COLOR[state.settings.theme];

    if (state.progress[c.id] == null) state.progress[c.id] = 0;
    var spot = resume && state.last && state.last.id === c.id && (exact || (state.progress[c.id] || 0) < 0.98) ? state.last : null;
    var go = function () {
      if (spot) restoreAnchor(spot);
      else window.scrollTo(0, 0);
      lastY = window.scrollY; // 자리를 맞추느라 생긴 스크롤 때문에 막대가 숨지 않게
      showChrome(true);
      updateProgress();
    };
    go();
    // 웹폰트가 늦게 도착하면 줄바꿈이 바뀌므로 한 번 더 맞춘다
    if (spot && document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    remember();
  }

  page.addEventListener("click", function (e) {
    var go = e.target.closest("[data-go]");
    if (go) {
      e.stopPropagation();
      if (go.dataset.go === "toc") location.hash = "#/";
      else {
        state.last = { id: go.dataset.go, i: 0, f: 0, at: Date.now() };
        save();
        location.hash = "#/read/" + go.dataset.go;
      }
      return;
    }
    // 본문을 톡 치면 위아래 막대가 나왔다 들어갔다 한다 (글자를 고르는 중이면 그대로)
    var sel = window.getSelection && String(window.getSelection());
    if (!sel) showChrome(reader.classList.contains("chrome-hidden"));
  });

  $("back").addEventListener("click", function () {
    remember();
    location.hash = "#/";
  });

  // 지금 읽는 문단과 그 문단 안에서의 위치
  function currentAnchor() {
    if (reader.hidden || !bodyEls.length) return null;
    for (var i = 0; i < bodyEls.length; i++) {
      var r = bodyEls[i].getBoundingClientRect();
      if (r.bottom > ANCHOR_LINE) {
        return { i: i, f: r.height ? Math.max(0, Math.min(1, (ANCHOR_LINE - r.top) / r.height)) : 0 };
      }
    }
    return { i: bodyEls.length - 1, f: 1 };
  }
  function restoreAnchor(a) {
    var el = bodyEls[Math.min(a.i || 0, bodyEls.length - 1)];
    if (!el || (!a.i && !a.f)) return window.scrollTo(0, 0); // 첫 문단 맨 위면 화 제목부터 보이게
    var y = el.getBoundingClientRect().top + window.scrollY + (a.f || 0) * el.offsetHeight - ANCHOR_LINE;
    window.scrollTo(0, Math.max(0, y));
  }

  function ratio() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 1;
  }
  function updateProgress() {
    if (!current) return;
    var L = t();
    var r = ratio();
    $("progress").style.width = (r * 100).toFixed(1) + "%";
    $("pct").textContent = Math.round(r * 100) + "%";
    var left = Math.round((current.chars * (1 - r)) / CPM[lang()]);
    $("left").textContent = r >= 0.99 ? L.finished : left < 1 ? L.ending : L.leftReading(left);
  }

  function remember() {
    if (!current || reader.hidden) return;
    var a = currentAnchor();
    if (!a) return;
    state.last = { id: current.id, i: a.i, f: Number(a.f.toFixed(3)), at: Date.now() };
    var r = ratio();
    if (r > (state.progress[current.id] || 0)) state.progress[current.id] = Number(r.toFixed(3));
    save();
  }

  // 스크롤: 진행 막대는 매 프레임, 저장은 멈춘 뒤에. 내려가면 막대를 숨기고 올라오면 보인다
  var lastY = 0;
  var ticking = false;
  var saveTimer = null;
  window.addEventListener(
    "scroll",
    function () {
      if (reader.hidden) return;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          var y = window.scrollY;
          var nearEnd = y + window.innerHeight >= document.documentElement.scrollHeight - 40;
          if (nearEnd || y < 60) showChrome(true);
          else if (y > lastY + 6) showChrome(false);
          else if (y < lastY - 10) showChrome(true);
          lastY = y;
          updateProgress();
        });
      }
      clearTimeout(saveTimer);
      saveTimer = setTimeout(remember, 250);
    },
    { passive: true }
  );

  function showChrome(on) {
    reader.classList.toggle("chrome-hidden", !on);
  }

  // 앱을 내리거나 끌 때 마지막 자리를 확실히 저장
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") remember();
  });
  window.addEventListener("pagehide", remember);

  // ───────── 길 찾기 ─────────
  var toastTimer = null;
  function toast(msg) {
    var el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 2600);
  }

  function route(resume) {
    var m = location.hash.match(/^#\/read\/(\w+)/);
    if (m && find(m[1]) >= 0) openChapter(m[1], resume !== false);
    else showLibrary();
  }
  window.addEventListener("hashchange", function () {
    route(true);
  });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch];
    });
  }

  applyLang();
  applySettings();

  // 처음 켤 때: 주소에 화 번호가 없고 읽던 기록이 있으면 그 자리로 바로 연다
  var bootHash = location.hash;
  if ((!bootHash || bootHash === "#" || bootHash === "#/") && state.last && find(state.last.id) >= 0) {
    history.replaceState(null, "", "#/read/" + state.last.id);
    route(true);
    var c = chapters()[find(state.last.id)];
    toast(t().resumed(c.label, pctOf(c.id)));
  } else {
    route(true);
  }
})();
