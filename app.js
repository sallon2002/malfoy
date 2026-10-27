/*
  말포이 양은 솔직하지 않다 / マルフォイ嬢は素直じゃない — 책 리더
  - 화면은 둘: 서재(#/)와 읽기(#/read/01)
  - 읽기는 종이책처럼 한 장씩 넘긴다: 본문을 화면 너비의 단(column)으로 흘리고, 한 장 = 한 단
    옆으로 쓸어 넘기거나, 화면 오른쪽/왼쪽을 톡 치면 다음/이전 장, 가운데를 치면 위 막대가 나온다
  - 읽던 자리는 "몇 번째 문단의 몇 번째 조각"으로 저장한다. 글자 크기를 바꿔도 같은 문장이 있는 장으로 돌아온다
  - 앱을 껐다 켜면(주소에 화 번호가 없으면) 마지막으로 읽던 화의 그 장으로 바로 연다
  - KR ⇄ JP: 일본어판은 한국어판과 문단이 1:1이라, 언어를 바꿔도 같은 문단에서 이어진다
  - 몰입을 깨지 않도록 글자 수 · 남은 시간은 보여 주지 않는다. 아래에 쪽수만 조용히
  - 저장은 이 기기의 localStorage. 아이폰은 「홈 화면에 추가」한 앱이 가장 오래 기억한다
*/
(function () {
  "use strict";

  var NOVEL = window.NOVEL || { langs: {} };
  var KEY = "malfoy-reader-v1";
  var SIZES = [15, 16, 17, 18, 19, 20, 22, 24];
  var LEADS = [1.7, 1.85, 2.0];
  var MAX_TEXT = 600; // 넓은 화면에서도 한 줄이 너무 길어지지 않게 (px)
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
      waitNext: "다음 화를 기다려 주세요",
      btnReread: "다시 읽기",
      btnContinue: "이어서 읽기",
      btnRead: "읽기",
      stNew: "새 글",
      stDone: "다 읽음",
      back: "목차",
      settings: "보기 설정",
      end: function (l) { return l + " 끝"; },
      next: "다음 화",
      soonNext: "다음 화는 준비 중이에요. 올라오면 목차에 「새 글」로 표시돼요.",
      prev: "‹ 이전 화",
      toToc: "목차로",
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
      waitNext: "次の更新をお待ちください",
      btnReread: "もう一度読む",
      btnContinue: "続きを読む",
      btnRead: "読む",
      stNew: "NEW",
      stDone: "読了",
      back: "目次",
      settings: "表示設定",
      end: function (l) { return l + " おわり"; },
      next: "次の話",
      soonNext: "次の話は準備中です。公開されると目次に「NEW」と表示されます。",
      prev: "‹ 前の話",
      toToc: "目次へ",
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
  var stage = $("stage");
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
  // 화 번호는 처음부터 이어지게(1화, 2화, 3화…). 부(프롤로그 · 1부…)는 목차의 묶음과 화 제목 위에만 보인다
  function numLabel(c) {
    var n = parseInt(c.id, 10);
    return lang() === "ja" ? "第" + n + "話" : n + "화";
  }
  function fullLabel(c) {
    return c.part + " · " + numLabel(c);
  }
  // 일본어판은 넘기지 않고 세로로 스크롤해서 읽는다
  function scrollMode() {
    return lang() === "ja";
  }
  function pctOf(id) {
    return Math.round((state.progress[id] || 0) * 100);
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
    var keep = anchorForRelayout();
    var id = current && current.id;
    state.settings.lang = next;
    applyLang();
    applySettings();
    if (!reader.hidden && id) {
      if (find(id) >= 0) {
        if (keep) state.last = { id: id, i: keep.i, f: keep.f, at: Date.now() };
        save();
        openChapter(id, { resume: true, exact: true });
        sticky = keep;
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
    var keep = anchorForRelayout();
    if (b.dataset.act === "size") st.size = Math.max(0, Math.min(SIZES.length - 1, st.size + Number(b.dataset.v)));
    else if (b.dataset.act === "lead") st.lead = Number(b.dataset.v);
    else st[b.dataset.act] = b.dataset.v;
    applySettings();
    if (!reader.hidden) relayout(keep);
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
  function sheetOpen() {
    return $("sheet").classList.contains("open");
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
        '<p class="cont-title">' + esc(numLabel(c)) + " · " + esc(c.title) + "</p>" +
        (p > 0
          ? '<div class="cont-meta"><span>' + L.readPct(p) + "</span><span>" + (done ? L.waitNext : "") + "</span></div>" +
            '<div class="meter"><i style="width:' + p + '%"></i></div>'
          : "") +
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
        '<span class="toc-no">' + esc(numLabel(c)) + "</span>" +
        '<span class="toc-title">' + esc(c.title) + "</span>" +
        '<span class="toc-state ' + cls + '">' + label + "</span></a>";
    });
    $("toc").innerHTML = html || '<p class="toc-empty">' + L.empty + "</p>";
  }

  function showLibrary() {
    closeSheet();
    current = null;
    root.classList.remove("reading");
    root.classList.remove("scroll");
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

  // ───────── 읽기: 책장 ─────────
  var current = null;
  var bodyEls = [];
  var pageW = 0; // 한 장의 너비 = 화면 너비
  var pages = 1;
  var pageNo = 0;

  // 문단 한 칸: 통째로 *기울임*인 문단은 그림책 손글씨, 일본어 지문은 첫머리를 한 칸 들여 쓴다.
  // 액자 문단(원고의 "> ")은 한 톤 흐리게 — 지금 이야기와 다른 시간이라는 표시
  function para(html, frame) {
    var cls = [];
    if (frame) cls.push("frame");
    if (/^<em>[^]*<\/em>$/.test(html)) cls.push("hand");
    else if (lang() === "ja" && !/^[「『（(〈《“"]/.test(html)) cls.push("ind");
    return (cls.length ? '<p class="' + cls.join(" ") + '">' : "<p>") + html + "</p>";
  }

  // 아이폰 노치·홈 바 여백 (CSS env 값을 읽어 온다)
  function insets() {
    var cs = getComputedStyle($("safe-probe"));
    return { l: parseFloat(cs.paddingLeft) || 0, r: parseFloat(cs.paddingRight) || 0 };
  }

  // 단 너비를 화면에 맞추고 전체 장 수를 센다. 단 간격 = 좌우 여백 × 2 → 한 장 = 정확히 화면 너비
  function layout() {
    var W = stage.clientWidth;
    var s = insets();
    var pad = Math.max(24 + Math.max(s.l, s.r), Math.round((W - MAX_TEXT) / 2));
    pageW = W;
    page.style.paddingLeft = pad + "px";
    page.style.paddingRight = pad + "px";
    if (scrollMode()) {
      page.style.columnWidth = "";
      page.style.columnGap = "";
      page.style.transform = "";
      page.style.setProperty("--page-h", Math.round(stage.clientHeight * 0.78) + "px");
      pages = 1;
      pageNo = 0;
      return;
    }
    if (stage.scrollTop) stage.scrollTop = 0;
    page.style.columnWidth = W - pad * 2 + "px";
    page.style.columnGap = pad * 2 + "px";
    page.style.setProperty("--page-h", page.clientHeight + "px");
    var end = page.querySelector(".end-mark");
    pages = end ? pageOfRect(end.getBoundingClientRect()) + 1 : 1;
  }
  function pageOfRect(r) {
    var x = r.left - page.getBoundingClientRect().left;
    return Math.max(0, Math.floor((x + 1) / pageW));
  }

  // ── 스크롤 모드 (일본어판) ──
  var quietScroll = false; // 코드가 직접 스크롤을 옮길 때는 "손으로 읽었다"로 치지 않는다
  var quietTimer = null;
  function viewTop() {
    return stage.getBoundingClientRect().top + insetTop() + 60;
  }
  function insetTop() {
    return parseFloat(getComputedStyle($("safe-probe")).paddingTop) || 0;
  }
  function setScroll(y) {
    quietScroll = true;
    stage.scrollTop = Math.max(0, y);
    clearTimeout(quietTimer);
    quietTimer = setTimeout(function () {
      quietScroll = false;
    }, 120);
    scrollProgress();
  }
  function scrollRatio() {
    var max = stage.scrollHeight - stage.clientHeight;
    return max > 0 ? Math.min(1, stage.scrollTop / max) : 1;
  }
  function scrollProgress() {
    var r = scrollRatio();
    $("folio").textContent = Math.round(r * 100) + "%";
    $("progress").style.width = (r * 100).toFixed(1) + "%";
  }
  function scrollToAnchor(a) {
    if (!a || (!a.i && !a.f)) return setScroll(0);
    var el = bodyEls[Math.min(a.i || 0, bodyEls.length - 1)];
    if (!el) return setScroll(0);
    var r = el.getBoundingClientRect();
    setScroll(stage.scrollTop + (r.top - viewTop()) + (a.f || 0) * r.height);
  }
  function scrollToEnd() {
    setScroll(stage.scrollHeight);
  }
  // 글자 크기 · 언어 · 화면 크기가 바뀐 뒤 같은 문단으로 돌아간다
  function placeAt(a) {
    if (scrollMode()) scrollToAnchor(a);
    else goTo(pageForAnchor(a), false);
  }

  function goTo(n, animate) {
    pageNo = Math.max(0, Math.min(pages - 1, n));
    page.classList.toggle("turning", !!animate);
    page.style.transform = "translate3d(" + -pageNo * pageW + "px,0,0)";
    $("folio").textContent = pageNo + 1 + " / " + pages;
    $("progress").style.width = (pages > 1 ? (pageNo / (pages - 1)) * 100 : 100).toFixed(1) + "%";
    remember();
  }

  // 지금 장의 맨 위에 있는 문단과, 그 문단이 몇 번째 조각으로 이 장에 걸쳐 있는지
  function currentAnchor() {
    if (reader.hidden || !bodyEls.length) return null;
    if (scrollMode()) {
      if (stage.scrollTop < 4) return { i: 0, f: 0 };
      var top = viewTop();
      for (var j = 0; j < bodyEls.length; j++) {
        var r = bodyEls[j].getBoundingClientRect();
        if (r.bottom > top + 1) return { i: j, f: r.height > 0 ? Math.max(0, Math.min(0.999, (top - r.top) / r.height)) : 0 };
      }
      return { i: bodyEls.length - 1, f: 0.999 };
    }
    for (var i = 0; i < bodyEls.length; i++) {
      var rects = bodyEls[i].getClientRects();
      for (var k = 0; k < rects.length; k++) {
        var p = pageOfRect(rects[k]);
        if (p === pageNo) return { i: i, f: rects.length > 1 ? k / rects.length : 0 };
        if (p > pageNo) return { i: Math.max(0, i - 1), f: 0.999 };
      }
    }
    return { i: bodyEls.length - 1, f: 0.999 };
  }
  function pageForAnchor(a) {
    if (!a || (!a.i && !a.f)) return 0; // 첫 문단 맨 위면 화 제목이 있는 첫 장
    var el = bodyEls[Math.min(a.i || 0, bodyEls.length - 1)];
    if (!el) return 0;
    var rects = el.getClientRects();
    if (!rects.length) return 0;
    var k = Math.min(rects.length - 1, Math.round((a.f || 0) * rects.length));
    return pageOfRect(rects[k]);
  }
  // 글자 크기 · 언어를 연달아 바꿔도 자리가 조금씩 앞으로 밀리지 않도록, 장을 넘기기 전까지는 처음 기준 문단을 붙잡아 둔다
  var sticky = null;
  function anchorForRelayout() {
    return sticky || currentAnchor();
  }
  function relayout(keep) {
    sticky = keep;
    layout();
    placeAt(keep);
  }

  // opts: resume(읽던 자리로, 다 읽은 화는 처음부터) · exact(언어를 바꿀 때처럼 무조건 그 문단으로) · atEnd(마지막 장으로)
  var turned = false; // 화를 연 뒤 손으로 장을 넘겼는지
  function openChapter(id, opts) {
    turned = false;
    sticky = null;
    opts = opts || {};
    var CH = chapters();
    var i = find(id);
    if (i < 0) return showLibrary();
    var L = t();
    var c = CH[i];
    current = c;
    closeSheet();

    // 삽화는 책 한 쪽을 통째로 쓴다. 화의 맨 앞 삽화는 제목보다 먼저 나온다 (펼치자마자 그림 → 넘기면 제목과 본문)
    var head = '<header class="ch-head"><p class="ch-part">' + esc(fullLabel(c)) + '</p><h1 class="ch-title">' + esc(c.title) + "</h1></header>";
    var body = c.blocks
      .map(function (b, k) {
        if (b[0] === "img") return '<figure class="illust"><img src="' + esc(b[1]) + '" alt="' + b[2] + '" decoding="async" /></figure>' + (k === 0 ? head : "");
        if (b[0] === "p") return para(b[1], b[2] === "f");
        if (b[0] === "orn") return '<div class="orn" aria-hidden="true">✦ ✦ ✦</div>';
        return '<div class="scene" aria-hidden="true"></div>';
      })
      .join("");

    var next = CH[i + 1];
    var prev = CH[i - 1];
    page.innerHTML =
      (c.blocks[0] && c.blocks[0][0] === "img" ? "" : head) +
      '<div class="body">' + body + "</div>" +
      '<footer class="ch-end"><span class="star">✦</span><p>' + esc(L.end(numLabel(c))) + "</p>" +
      (next
        ? '<button class="nav-next" type="button" data-go="' + next.id + '"><small>' + L.next + "</small><span>" + esc(numLabel(next)) + " · " + esc(next.title) + "</span></button>"
        : '<p class="soon">' + L.soonNext + "</p>") +
      '<div class="nav-row">' +
      (prev ? '<button type="button" data-go="' + prev.id + '">' + L.prev + "</button>" : "<span></span>") +
      '<button type="button" data-go="toc">' + L.toToc + "</button></div></footer>" +
      '<span class="end-mark"></span>';

    bodyEls = Array.prototype.slice.call(page.querySelectorAll(".body > :not(.ch-head)"));
    root.classList.add("reading");
    root.classList.toggle("scroll", scrollMode());
    page.classList.remove("turning");
    library.hidden = true;
    reader.hidden = false;
    document.title = numLabel(c) + " · " + c.title;
    $("bar-title").textContent = fullLabel(c);
    themeMeta.content = THEME_COLOR[state.settings.theme];

    if (state.progress[c.id] == null) state.progress[c.id] = 0;
    var spot = opts.resume && state.last && state.last.id === c.id && (opts.exact || (state.progress[c.id] || 0) < 0.98) ? state.last : null;
    var place = function () {
      layout();
      if (scrollMode()) {
        if (opts.atEnd) scrollToEnd();
        else scrollToAnchor(spot);
        remember();
      } else goTo(opts.atEnd ? pages - 1 : pageForAnchor(spot), false);
    };
    place();
    showChrome(true);
    // 웹폰트가 늦게 도착하면 줄바꿈이 바뀌므로, 그때의 자리를 지키며 한 번 더 맞춘다
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (current !== c || turned) return; // 그사이 장을 넘겼으면 그대로 둔다
        if (opts.atEnd && !sticky) {
          layout();
          if (scrollMode()) scrollToEnd();
          else goTo(pages - 1, false);
        } else relayout(sticky || spot || { i: 0, f: 0 }); // 처음 열 때 기준으로 삼은 문단
      });
    }
  }

  function nextPage() {
    turned = true;
    sticky = null;
    if (pageNo < pages - 1) {
      goTo(pageNo + 1, true);
      showChrome(false);
      return;
    }
    var CH = chapters();
    var n = CH[find(current.id) + 1];
    if (n) {
      state.last = { id: n.id, i: 0, f: 0, at: Date.now() };
      save();
      location.hash = "#/read/" + n.id;
    } else goTo(pageNo, true); // 마지막 장: 제자리로 튕긴다
  }
  function prevPage() {
    turned = true;
    sticky = null;
    if (pageNo > 0) {
      goTo(pageNo - 1, true);
      showChrome(false);
      return;
    }
    var CH = chapters();
    var p = CH[find(current.id) - 1];
    if (p) {
      pendingAtEnd = p.id;
      location.hash = "#/read/" + p.id;
    } else goTo(0, true);
  }
  var pendingAtEnd = null;

  // 손가락으로 쓸어 넘기기 + 톡 치기 (왼쪽 30% 이전 장 · 오른쪽 30% 다음 장 · 가운데 막대 보이기)
  var drag = null;
  stage.addEventListener("pointerdown", function (e) {
    if (e.button > 0 || e.target.closest("button, a")) return;
    drag = { x: e.clientX, y: e.clientY, t: Date.now(), dx: 0, moved: false, id: e.pointerId, scroll: scrollMode() };
    if (drag.scroll) return;
    page.classList.remove("turning");
  });
  stage.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x;
    if (drag.scroll) {
      if (Math.abs(dx) > 8 || Math.abs(e.clientY - drag.y) > 8) drag.moved = true;
      return;
    }
    if (!drag.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - drag.y)) {
      drag.moved = true;
      try {
        stage.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
    if (!drag.moved) return;
    var atEdge = (dx > 0 && pageNo === 0) || (dx < 0 && pageNo === pages - 1);
    drag.dx = atEdge ? dx * 0.35 : dx;
    page.style.transform = "translate3d(" + (-pageNo * pageW + drag.dx) + "px,0,0)";
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    if (d.scroll) {
      // 스크롤 모드: 손가락으로 끌면 그냥 스크롤, 톡 치면 막대 보이기/숨기기 (삽화는 크게 보기)
      if (e.type === "pointercancel" || d.moved || sheetOpen()) return;
      var img = e.target.closest(".illust img");
      if (img) openLightbox(img.getAttribute("src"), img.alt);
      else showChrome(reader.classList.contains("chrome-hidden"));
      return;
    }
    if (e.type === "pointercancel") return goTo(pageNo, true);
    if (d.moved) {
      var v = d.dx / Math.max(1, Date.now() - d.t);
      if (d.dx < -50 || v < -0.45) nextPage();
      else if (d.dx > 50 || v > 0.45) prevPage();
      else goTo(pageNo, true);
      return;
    }
    if (sheetOpen()) return;
    var x = e.clientX / pageW;
    var pic = e.target.closest(".illust img");
    if (x < 0.3) prevPage();
    else if (x > 0.7) nextPage();
    else if (pic) openLightbox(pic.getAttribute("src"), pic.alt); // 삽화 가운데를 치면 크게 보기
    else showChrome(reader.classList.contains("chrome-hidden"));
  }
  // 삽화 크게 보기: 화면 가득, 아무 데나 치면 닫힌다
  function openLightbox(src, alt) {
    var box = $("lightbox");
    box.innerHTML = '<img src="' + esc(src) + '" alt="' + esc(alt || "") + '" />';
    box.hidden = false;
  }
  $("lightbox").addEventListener("click", function () {
    this.hidden = true;
    this.innerHTML = "";
  });
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  document.addEventListener("keydown", function (e) {
    if (reader.hidden || sheetOpen()) return;
    if (scrollMode()) {
      var step = 0;
      if (e.key === " " || e.key === "PageDown" || e.key === "ArrowRight") step = stage.clientHeight * 0.85;
      else if (e.key === "PageUp" || e.key === "ArrowLeft") step = -stage.clientHeight * 0.85;
      else if (e.key === "ArrowDown") step = 60;
      else if (e.key === "ArrowUp") step = -60;
      if (step) {
        e.preventDefault();
        stage.scrollBy({ top: step, behavior: "smooth" });
      }
      return;
    }
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      nextPage();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      prevPage();
    }
  });

  // 마지막 장의 버튼들 (다음 화 · 이전 화 · 목차로)
  page.addEventListener("click", function (e) {
    var go = e.target.closest("[data-go]");
    if (!go) return;
    if (go.dataset.go === "toc") location.hash = "#/";
    else {
      state.last = { id: go.dataset.go, i: 0, f: 0, at: Date.now() };
      save();
      location.hash = "#/read/" + go.dataset.go;
    }
  });

  $("back").addEventListener("click", function () {
    remember();
    location.hash = "#/";
  });

  function remember() {
    if (!current || reader.hidden) return;
    var a = sticky || currentAnchor();
    if (!a) return;
    state.last = { id: current.id, i: a.i, f: Number(a.f.toFixed(3)), at: Date.now() };
    var r = scrollMode() ? scrollRatio() : pages > 1 ? pageNo / (pages - 1) : 1;
    if (r > (state.progress[current.id] || 0)) state.progress[current.id] = Number(r.toFixed(3));
    save();
  }

  function showChrome(on) {
    reader.classList.toggle("chrome-hidden", !on);
  }

  // 스크롤 모드: 읽는 만큼 진행 막대를 채우고, 내려 읽을 땐 막대를 숨기고 올리면 다시 보인다
  var lastY = 0;
  var saveTimer = null;
  stage.addEventListener(
    "scroll",
    function () {
      if (!scrollMode() || reader.hidden) return;
      scrollProgress();
      var y = stage.scrollTop;
      if (!quietScroll) {
        turned = true;
        sticky = null;
        if (y > lastY + 6 && y > 80) showChrome(false);
        else if (y < lastY - 6) showChrome(true);
        clearTimeout(saveTimer);
        saveTimer = setTimeout(remember, 400);
      }
      lastY = y;
    },
    { passive: true }
  );

  // 화면을 돌리거나 크기가 바뀌면 같은 문단을 지키며 다시 나눈다
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    if (reader.hidden) return;
    var keep = anchorForRelayout();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      relayout(keep);
    }, 150);
  });

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

  function route() {
    var m = location.hash.match(/^#\/read\/(\w+)/);
    if (m && find(m[1]) >= 0) {
      var atEnd = pendingAtEnd === m[1];
      pendingAtEnd = null;
      openChapter(m[1], { resume: true, atEnd: atEnd });
    } else showLibrary();
  }
  window.addEventListener("hashchange", route);

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
    route();
    var c = chapters()[find(state.last.id)];
    toast(t().resumed(numLabel(c), pctOf(c.id)));
  } else {
    route();
  }
})();
