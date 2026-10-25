/*
  말포이 양은 솔직하지 않다 — 책 리더
  - 화면은 둘: 서재(#/)와 읽기(#/read/01)
  - 읽던 자리는 "몇 번째 문단의 어디쯤"으로 저장한다. 글자 크기를 바꿔도 같은 문장으로 돌아온다
  - 앱을 껐다 켜면(주소에 화 번호가 없으면) 마지막으로 읽던 화의 그 자리로 바로 연다
  - 저장은 이 기기의 localStorage. 아이폰은 「홈 화면에 추가」한 앱이 가장 오래 기억한다
*/
(function () {
  "use strict";

  var NOVEL = window.NOVEL || { chapters: [] };
  var CH = NOVEL.chapters;
  var KEY = "malfoy-reader-v1";
  var SIZES = [15, 16, 17, 18, 19, 20, 22, 24];
  var LEADS = [1.7, 1.85, 2.0];
  var READ_CPM = 700; // 1분에 읽는 글자 수 (보통 속도)
  var ANCHOR_LINE = 72; // 화면 위에서 이만큼 아래를 "지금 읽는 줄"로 본다
  var THEME_COLOR = { paper: "#f6f1e7", sepia: "#ecdfc4", night: "#111216" };

  var $ = function (id) {
    return document.getElementById(id);
  };
  var root = document.documentElement;
  var library = $("library");
  var reader = $("reader");
  var page = $("page");
  var themeMeta = document.querySelector('meta[name="theme-color"]');

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
    s.settings = Object.assign({ size: 3, lead: 1, font: "serif", theme: dark ? "night" : "paper" }, s.settings || {});
    s.progress = s.progress || {};
    return s;
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function find(id) {
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
    return Math.max(1, Math.round(chars / READ_CPM));
  }

  // ───────── 보기 설정 ─────────
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

  document.getElementById("sheet").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var st = state.settings;
    var keep = currentAnchor();
    if (b.dataset.act === "size") st.size = Math.max(0, Math.min(SIZES.length - 1, st.size + Number(b.dataset.v)));
    else if (b.dataset.act === "lead") st.lead = Number(b.dataset.v);
    else st[b.dataset.act] = b.dataset.v;
    applySettings();
    if (keep) restoreAnchor(keep);
    save();
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
    $("cover-sub").textContent = CH.length ? "연재 중 · " + CH.length + "화" : "곧 연재를 시작해요";

    // 이어 읽기 카드: 읽던 화가 있으면 그 화, 다 읽었으면 다음 화, 처음이면 첫 화
    var box = $("continue");
    if (!CH.length) {
      box.innerHTML = "";
    } else {
      var idx = state.last ? find(state.last.id) : -1;
      var kicker = "이어 읽기";
      if (idx < 0) {
        idx = 0;
        kicker = "첫 화부터 읽기";
      } else if ((state.progress[CH[idx].id] || 0) >= 0.98 && idx + 1 < CH.length) {
        idx += 1;
        kicker = "다음 화";
      }
      var c = CH[idx];
      var p = pctOf(c.id);
      var done = p >= 98;
      if (done) kicker = "최신 화까지 다 읽었어요";
      box.innerHTML =
        '<a class="cont-card" href="#/read/' + c.id + '">' +
        '<p class="cont-kicker">' + kicker + "</p>" +
        '<p class="cont-title">' + esc(c.label) + " · " + esc(c.title) + "</p>" +
        (p > 0
          ? '<div class="cont-meta"><span>' + p + "% 읽음</span><span>" + (done ? "다음 화를 기다려 주세요" : "남은 시간 약 " + minutes(c.chars * (1 - p / 100)) + "분") + "</span></div>" +
            '<div class="meter"><i style="width:' + p + '%"></i></div>'
          : '<div class="cont-meta"><span>약 ' + minutes(c.chars) + "분</span><span></span></div>") +
        '<div class="cont-go">' + (done ? "다시 읽기" : p > 0 ? "이어서 읽기" : "읽기") + "</div></a>";
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
        label = "새 글";
        cls = "new";
      } else if (pr >= 0.98) {
        label = "다 읽음";
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
    $("toc").innerHTML = html || '<p class="toc-empty">아직 올라온 화가 없어요.</p>';
  }

  function showLibrary() {
    closeSheet();
    reader.hidden = true;
    library.hidden = false;
    document.title = NOVEL.title || "말포이 양은 솔직하지 않다";
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

  function openChapter(id, resume) {
    var i = find(id);
    if (i < 0) return showLibrary();
    var c = CH[i];
    current = c;
    closeSheet();

    var body = c.blocks
      .map(function (b) {
        if (b[0] === "p") return "<p>" + b[1] + "</p>";
        if (b[0] === "orn") return '<div class="orn" aria-hidden="true">✦ ✦ ✦</div>';
        return '<div class="scene" aria-hidden="true"></div>';
      })
      .join("");

    var next = CH[i + 1];
    var prev = CH[i - 1];
    page.innerHTML =
      '<header class="ch-head"><p class="ch-part">' + esc(c.label) + '</p><h1 class="ch-title">' + esc(c.title) + "</h1>" +
      '<p class="ch-meta">' + c.chars.toLocaleString() + "자 · 약 " + minutes(c.chars) + "분</p></header>" +
      '<div class="body">' + body + "</div>" +
      '<footer class="ch-end"><span class="star">✦</span><p>' + esc(c.label) + " 끝</p>" +
      (next
        ? '<button class="nav-next" type="button" data-go="' + next.id + '"><small>다음 화</small><span>' + esc(next.label) + " · " + esc(next.title) + "</span></button>"
        : '<p class="soon">다음 화는 준비 중이에요. 올라오면 목차에 「새 글」로 표시돼요.</p>') +
      '<div class="nav-row">' +
      (prev ? '<button type="button" data-go="' + prev.id + '">‹ 이전 화</button>' : "<span></span>") +
      '<button type="button" data-go="toc">목차로</button></div></footer>';

    bodyEls = Array.prototype.slice.call(page.querySelectorAll(".body > *"));
    library.hidden = true;
    reader.hidden = false;
    document.title = c.label + " · " + c.title;
    $("bar-title").textContent = c.label;
    themeMeta.content = THEME_COLOR[state.settings.theme];
    showChrome(true);

    if (state.progress[c.id] == null) state.progress[c.id] = 0;
    var spot = resume && state.last && state.last.id === c.id && (state.progress[c.id] || 0) < 0.98 ? state.last : null;
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
    var r = ratio();
    $("progress").style.width = (r * 100).toFixed(1) + "%";
    $("pct").textContent = Math.round(r * 100) + "%";
    var left = Math.round((current.chars * (1 - r)) / READ_CPM);
    $("left").textContent = r >= 0.99 ? "다 읽었어요" : left < 1 ? "곧 끝나요" : "이 화 남은 시간 약 " + left + "분";
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
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove("show");
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

  applySettings();

  // 처음 켤 때: 주소에 화 번호가 없고 읽던 기록이 있으면 그 자리로 바로 연다
  var bootHash = location.hash;
  if ((!bootHash || bootHash === "#" || bootHash === "#/") && state.last && find(state.last.id) >= 0) {
    history.replaceState(null, "", "#/read/" + state.last.id);
    route(true);
    var c = CH[find(state.last.id)];
    toast("이어서 읽는 중 · " + c.label + " · " + pctOf(c.id) + "%");
  } else {
    route(true);
  }
})();
