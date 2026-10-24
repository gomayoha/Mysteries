/* ==========================================================================
   Story page — renders any story from stories.json using ?id=<story-id>.
   Add &review=1 to highlight every detail flagged with "factCheck".
   ========================================================================== */
(function () {
  "use strict";
  const { $, $$, SITE, escapeHtml, inline, plain, normalize, caseNo, storyUrl, category, verdict, level, formatDate,
    icon, picture, imgSrc, creditLine, noImg, loadStories, showLoadError, Progress, toast, confetti, depthMeter,
    setTitle, observeReveals, calm } = window.App;

  const params = new URLSearchParams(location.search);
  const reviewMode = params.get("review") === "1";
  const root = $("#story-root");
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* Fact-check markers: only visible in review mode. */
  const flags = [];
  const flagBtn = (note) => note ? `<button type="button" class="fc-flag" title="${escapeHtml(note)}" aria-label="Needs fact-check: ${escapeHtml(note)}">${icon("flag")}check</button>` : "";
  const fc = (note, where) => { if (note) flags.push({ note, where }); return flagBtn(note); };
  const fcCls = (item) => (item.factCheck ? "fc" : "");

  const SECTIONS = [
    ["the-story", "The story"], ["timeline", "Timeline"], ["evidence", "The evidence"], ["people", "Who's who"], ["why", "Why people wonder"],
    ["fun-fact", "Fun fact"], ["depth", "How deep"], ["quiz", "Quiz"], ["sources", "Sources"], ["related", "Related cases"],
  ];
  const head = (n, label, title) =>
    `<div class="sec-head reveal"><span class="eyebrow">${String(n).padStart(2, "0")} <i>—</i> ${escapeHtml(label)}</span><h2>${title}</h2></div>`;

  /* ------------------------------------------------------------------------
     Hero + facts
     ------------------------------------------------------------------------ */
  function hero(story, cat, v) {
    const h = story.hero || {};
    const framed = h.layout === "framed" || (h.layout !== "full" && h.w && (h.w < 1100 || h.h > h.w * 1.05));
    if (h.factCheck) flags.push({ note: h.factCheck, where: "Hero image" });
    return `<header class="sh${framed ? " framed" : ""}">
      <div class="sh-media">${h.src ? picture(h, framed ? 960 : 1920, { eager: true }) : ""}</div>
      <div class="sh-shade"></div>
      <div class="wrap sh-body">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Archive</a><span class="sep">/</span><a href="explore.html?cat=${cat.id}">${escapeHtml(cat.name)}</a></nav>
        <span class="eyebrow">Case ${caseNo(story.caseNo)} · ${escapeHtml(cat.short)}${story.year ? ` · ${escapeHtml(story.year)}` : ""}</span>
        <h1>${inline(story.title)}</h1>
        <p class="hook">${inline(story.hook)}</p>
        <div class="verdict-row">
          <span class="stamp big will-stamp v-${v.id}" role="img" aria-label="Verdict: ${escapeHtml(v.label)}">${escapeHtml(v.label)}</span>
          ${story.verdictNote ? `<p class="verdict-note">${inline(story.verdictNote)}</p>` : ""}
        </div>
        ${h.src ? `<p class="sh-credit ${fcCls(h)}">${escapeHtml(h.caption || "")}${h.caption ? "<br>" : ""}Photo: ${creditLine(h)}${flagBtn(h.factCheck)}</p>` : ""}
      </div>
    </header>`;
  }

  function facts(story, v) {
    const lv = level(story.rabbitHoleLevel);
    return `<dl class="facts wrap">
      <div><dt>Case file</dt><dd class="tabular">No. ${caseNo(story.caseNo)}</dd></div>
      <div><dt>Verdict</dt><dd><span class="mini-stamp v-${v.id}">${escapeHtml(v.label)}</span></dd></div>
      <div><dt>Rabbit hole</dt><dd class="depth-label" style="color:var(--fg)">${depthMeter(story.rabbitHoleLevel)} ${escapeHtml(lv.name)}</dd></div>
      ${story.location?.name ? `<div><dt>Where</dt><dd>${escapeHtml(story.location.name)}</dd></div>` : ""}
      ${story.readMinutes ? `<div><dt>Reading</dt><dd>${story.readMinutes} min</dd></div>` : ""}
      <div><dt>Your card</dt><dd><button class="pill small explore-btn" type="button" data-explore-toggle aria-pressed="false"></button></dd></div>
    </dl>`;
  }

  /* ------------------------------------------------------------------------
     Sections
     ------------------------------------------------------------------------ */
  function storySection(story) {
    const paras = story.story.map(normalize).map((p) => `<p class="${fcCls(p)}">${inline(p.text)}${fc(p.factCheck, "The story")}</p>`).join("");
    const gallery = (story.gallery || []).filter((g) => g.src);
    const film = gallery.length ? `<div class="film-wrap reveal">
        <div class="wrap film-label"><span class="eyebrow">From the file</span><small>${gallery.length} photograph${gallery.length === 1 ? "" : "s"} · tap to enlarge</small></div>
        <div class="film">${gallery.map((g, i) => {
          if (g.factCheck) flags.push({ note: g.factCheck, where: `Gallery: ${g.caption || g.alt}` });
          return `<button type="button" class="frame${g.fit === "contain" ? " contain" : ""}" data-photo="${i}">
            <div class="frame-img">${picture(g, 960)}</div>
            <figcaption class="${fcCls(g)}">${escapeHtml(g.caption || g.alt || "")}${flagBtn(g.factCheck)}<small>${escapeHtml(g.credit || "")} · ${escapeHtml(g.license || "")}</small></figcaption>
          </button>`;
        }).join("")}</div>
      </div>` : "";
    return `<section id="the-story" class="sec">
      <div class="narrow">${head(1, "The story", "Here's what <em>happened.</em>")}<div class="prose-story reveal">${paras}</div><div data-illustrations="story"></div></div>
      ${film}
    </section>`;
  }

  function timelineSection(story) {
    const events = story.timeline.map(normalize);
    events.forEach((e) => e.factCheck && flags.push({ note: e.factCheck, where: `Timeline: ${e.label}` }));
    let lastYear = null;
    const items = events.map((e, i) => {
      const year = e.year || String(e.date || "").slice(0, 4);
      const showYear = year && year !== lastYear;
      lastYear = year;
      return `<button class="tl-item" type="button" role="tab" id="tl-tab-${i}" aria-controls="tl-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}" style="--d:${(0.3 + i * 0.07).toFixed(2)}s">
        ${showYear ? `<span class="tl-year">${escapeHtml(year)}</span>` : ""}
        <span class="tl-dot" aria-hidden="true"></span>
        <span class="tl-when">${escapeHtml(e.dateLabel || formatDate(e.date))}</span>
        <span class="tl-short">${escapeHtml(e.label)}</span>
      </button>`;
    }).join("");
    return `<section id="timeline" class="sec"><div class="wrap">
      ${head(2, "Timeline", "How it <em>unfolded.</em>")}
      <div class="tl" data-timeline>
        <div class="tl-track"><div class="tl-rail" role="tablist" aria-label="Key events"><span class="tl-line" aria-hidden="true"></span>${items}</div></div>
        <div class="tl-panel" id="tl-panel" role="tabpanel" aria-live="polite"></div>
        <p class="tl-hint">Tap any date, or use the arrow keys.</p>
      </div>
    </div></section>`;
  }

  function ledgerSection(story) {
    const list = (items, where) => items.map(normalize).map((i) => `<li class="${fcCls(i)}">${inline(i.text)}${fc(i.factCheck, where)}</li>`).join("");
    return `<section id="evidence" class="sec"><div class="wrap">
      ${head(3, "The evidence", "What we know, and what's <em>speculation.</em>")}
      <div class="ledger">
        <div class="ledger-col known reveal"><h3><span class="ic">${icon("check")}</span>What we know</h3><p class="col-note">Documented, sourced and widely accepted.</p><ul>${list(story.known, "What we know")}</ul></div>
        <div class="ledger-col spec reveal" style="--d:.12s"><h3><span class="ic">${icon("question")}</span>What's speculation</h3><p class="col-note">Theories and claims, and how well each one holds up.</p><ul>${list(story.speculation, "Speculation")}</ul></div>
      </div>
    </div></section>`;
  }

  function peopleSection(story) {
    if (!story.people?.length) return "";
    const n = story.people.length;
    story.people.forEach((p) => p.factCheck && flags.push({ note: p.factCheck, where: `Who's who: ${plain(p.name)}` }));
    return `<section id="people" class="sec"><div class="wrap">
      ${head(4, "Persons of interest", "Who's <em>who.</em>")}
      <p class="mute reveal" style="max-width:60ch;margin:-14px 0 28px;font-size:17px">${n} ${n === 1 ? "name" : "names"} in this file. Tap one to open their dossier; each role has its own file, from suspects to the people we remember. <a href="people.html" style="color:var(--gold)">See everyone in the archive →</a></p>
      <div class="reveal" data-cast></div>
    </div></section>`;
  }

  function whySection(story) {
    const paras = (Array.isArray(story.whyPeopleWonder) ? story.whyPeopleWonder : [story.whyPeopleWonder]).map(normalize);
    return `<section id="why" class="sec"><div class="narrow">
      ${head(5, "The psychology", story.verdict === "debunked" ? "Why people still <em>believe.</em>" : "Why people still <em>wonder.</em>")}
      <div class="why reveal">${paras.map((p) => `<p class="${fcCls(p)}">${inline(p.text)}${fc(p.factCheck, "Why people wonder")}</p>`).join("")}</div>
    </div></section>`;
  }

  function funFactSection(story) {
    const f = normalize(story.funFact);
    return `<section id="fun-fact" class="sec"><div class="wrap">
      ${head(6, "Fun fact", "Wait, <em>really?</em>")}
      <div class="foil-stage reveal">
        <article class="foil${calm() ? "" : " idle"}" data-foil>
          <div class="foil-top"><small>Fun fact · Case ${caseNo(story.caseNo)}</small><span class="gem">✦ SR</span></div>
          <p class="${fcCls(f)}">${inline(f.text)}${fc(f.factCheck, "Fun fact")}</p>
          <div class="foil-foot"><span>${escapeHtml(plain(story.title))}</span><span>${escapeHtml(SITE.name)}</span></div>
        </article>
      </div>
    </div></section>`;
  }

  function depthSection(story) {
    const n = story.rabbitHoleLevel, lv = level(n);
    const TOP = 40, BOTTOM = 34, H = 420;
    const yFor = (i) => TOP + (i * (H - TOP - BOTTOM)) / 5;
    const rows = SITE.levels.map((l, i) => {
      const k = i + 1;
      return `<div class="gauge-row${k >= 4 ? " deep" : ""}${k === n ? " here" : k < n ? " past" : ""}" style="top:${yFor(k)}px"><b>−${k}</b>${escapeHtml(l.name)}</div>`;
    }).join("");
    return `<section id="depth" class="sec"><div class="wrap">
      ${head(7, "Rabbit hole level", "How deep does this <em>go?</em>")}
      <div class="depth-wrap">
        <div class="gauge reveal" data-gauge data-y="${yFor(n)}" role="img" aria-label="Rabbit Hole Level ${n} of 5: ${escapeHtml(lv.name)}">
          <div class="gauge-surface"><span>Surface</span></div><div class="gauge-ruler"></div>${rows}<span class="gauge-marker" data-marker></span>
        </div>
        <div class="depth-copy reveal" style="--d:.1s">
          <div class="big">−${n}<small>of 5</small></div>
          <h3>${escapeHtml(lv.name)}</h3>
          <p>${escapeHtml(lv.blurb)}</p>
          ${story.depthNote ? `<p>${inline(story.depthNote)}</p>` : ""}
        </div>
      </div>
    </div></section>`;
  }

  function quizSection(story) {
    if (!story.quiz?.length) return "";
    return `<section id="quiz" class="sec"><div class="narrow">
      ${head(8, "Quick quiz", "Were you paying <em>attention?</em>")}
      <div class="quiz" data-quiz>${story.quiz.map((q, qi) => `<div class="q-card reveal" data-q="${qi}">
        <h3><span class="qn">${qi + 1}</span><span>${escapeHtml(q.q)}</span></h3>
        <div class="q-options">${q.options.map((o, oi) => `<button class="q-opt" type="button" data-o="${oi}"><span>${escapeHtml(o)}</span><span class="mark" aria-hidden="true"></span></button>`).join("")}</div>
      </div>`).join("")}<div data-quiz-result></div></div>
    </div></section>`;
  }

  function sourcesSection(story) {
    const ic = (s) => (/wikipedia\.org/.test(s.url) ? "W" : s.type === "paper" ? icon("book") : icon("link"));
    return `<section id="sources" class="sec"><div class="narrow">
      ${head(9, "Sources", "Further <em>reading.</em>")}
      <ul class="sources reveal">${story.sources.map((s) => `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">
        <span class="src-ic" aria-hidden="true">${ic(s)}</span>
        <span><b>${escapeHtml(s.title)}</b><small>${escapeHtml(s.publisher || "")}${s.year ? ` · ${escapeHtml(s.year)}` : ""}</small></span>
        <span class="ext" aria-hidden="true">${icon("ext")}</span></a></li>`).join("")}</ul>
      <div class="done-band reveal" data-done-band></div>
    </div></section>`;
  }

  function relatedSection(story, all) {
    const tilt = ["-2.5deg", "1.8deg", "-1.2deg", "2.4deg", "-1.8deg"];
    const cards = (story.related || []).map((id, i) => {
      const r = all.find((s) => s.id === id);
      if (!r) {
        const name = id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bMh(\d+)/, "MH$1").replace(/\bDb\b/, "D.B.");
        return `<div class="polaroid redacted" style="--r:${tilt[i % 5]}"><span class="pin"></span><div class="ph"><span>CLASSIFIED</span></div><small>File not yet released</small><strong>${escapeHtml(name)}</strong></div>`;
      }
      return `<a class="polaroid" href="${storyUrl(r.id)}" style="--r:${tilt[i % 5]}"><span class="pin"></span>
        <div class="ph">${r.hero?.src ? picture(r.hero, 500, { alt: "" }) : noImg(r)}</div>
        <small>Case ${caseNo(r.caseNo)} · ${escapeHtml(verdict(r.verdict).label)}</small><strong>${inline(r.title)}</strong></a>`;
    });
    cards.splice(Math.floor(cards.length / 2), 0, `<div class="polaroid this" style="--r:1deg"><span class="pin"></span>
      <div class="ph">${story.hero?.src ? picture(story.hero, 500, { alt: "" }) : noImg(story)}</div><small>You are here</small><strong>${inline(story.title)}</strong></div>`);
    return `<section id="related" class="sec"><div class="wrap">
      ${head(10, "Related cases", "Follow the red <em>string.</em>")}
      <div class="wallboard reveal" data-board><svg class="strings" aria-hidden="true"></svg><div class="pins">${cards.join("")}</div></div>
    </div></section>`;
  }

  function caseNav(story, all) {
    const i = all.findIndex((s) => s.id === story.id);
    const prev = all[i - 1], next = all[i + 1] || (all[0].id !== story.id ? all[0] : null);
    const tile = (s, cls, label) => `<a class="nav-tile ${cls}" href="${storyUrl(s.id)}">${s.hero?.src ? picture(s.hero, 960, { alt: "" }) : ""}<div><small>${label}</small><strong>${inline(s.title)}</strong></div></a>`;
    return `<nav class="wrap case-nav" aria-label="More case files">${prev ? tile(prev, "prev", "← Previous file") : "<span></span>"}${next ? tile(next, "next", "Next file →") : ""}</nav>`;
  }

  /* ------------------------------------------------------------------------
     Behaviour
     ------------------------------------------------------------------------ */
  function initTimeline(story) {
    const tl = $("[data-timeline]");
    if (!tl) return;
    const events = story.timeline.map(normalize);
    const tabs = $$(".tl-item", tl), panel = $("#tl-panel"), track = $(".tl-track", tl);
    let current = 0;
    const aim = () => {
      const r = tabs[current].getBoundingClientRect(), p = panel.getBoundingClientRect();
      panel.style.setProperty("--arrow", `${clamp(r.left - p.left + r.width / 2, 24, p.width - 24)}px`);
    };
    function select(i, focus = false) {
      current = clamp(i, 0, events.length - 1);
      tabs.forEach((t, j) => { t.setAttribute("aria-selected", String(j === current)); t.tabIndex = j === current ? 0 : -1; });
      const e = events[current];
      panel.setAttribute("aria-labelledby", `tl-tab-${current}`);
      panel.innerHTML = `<div class="tl-body"><span class="when">${escapeHtml(e.dateLabel || formatDate(e.date))}</span>
          <h3 class="${fcCls(e)}">${escapeHtml(e.label)}${flagBtn(e.factCheck)}</h3><p>${inline(e.detail || "")}</p></div>
        <div class="tl-nav">
          <button class="icon-btn" type="button" data-step="-1" aria-label="Previous event" ${current === 0 ? "disabled" : ""}>${icon("arrowLeft")}</button>
          <span class="count">${current + 1} of ${events.length}</span>
          <button class="icon-btn" type="button" data-step="1" aria-label="Next event" ${current === events.length - 1 ? "disabled" : ""}>${icon("arrow")}</button>
        </div>`;
      const tab = tabs[current];
      track.scrollTo({ left: tab.offsetLeft - track.clientWidth / 2 + tab.offsetWidth / 2, behavior: calm() ? "auto" : "smooth" });
      requestAnimationFrame(aim);
      if (focus) tab.focus({ preventScroll: true });
    }
    tabs.forEach((t) => t.addEventListener("click", () => select(Number(t.dataset.i))));
    tl.addEventListener("keydown", (e) => {
      if (!e.target.closest(".tl-item")) return;
      const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (e.key in map) { e.preventDefault(); select(current + map[e.key], true); }
      if (e.key === "Home") { e.preventDefault(); select(0, true); }
      if (e.key === "End") { e.preventDefault(); select(events.length - 1, true); }
    });
    panel.addEventListener("click", (e) => { const b = e.target.closest("[data-step]"); if (b) select(current + Number(b.dataset.step)); });
    track.addEventListener("scroll", aim, { passive: true });
    window.addEventListener("resize", aim);
    if (calm() || !("IntersectionObserver" in window)) tl.classList.add("is-in", "ready");
    else new IntersectionObserver((en, obs) => {
      if (en[0].isIntersecting) { tl.classList.add("is-in"); obs.disconnect(); setTimeout(() => tl.classList.add("ready"), 2400); }
    }, { threshold: 0.3 }).observe(tl);
    select(0);
  }

  function initQuiz(story) {
    const quiz = $("[data-quiz]");
    if (!quiz) return;
    const answers = new Array(story.quiz.length).fill(null);
    quiz.addEventListener("click", (e) => {
      const opt = e.target.closest(".q-opt");
      if (opt) return answer(opt);
      if (e.target.closest("[data-retake]")) retake();
    });
    function answer(opt) {
      const card = opt.closest(".q-card"), qi = Number(card.dataset.q), oi = Number(opt.dataset.o), q = story.quiz[qi];
      if (answers[qi] !== null) return;
      answers[qi] = oi;
      $$(".q-opt", card).forEach((b, j) => {
        b.disabled = true;
        if (j === q.answer) { b.classList.add("correct"); $(".mark", b).innerHTML = icon("check"); }
        else if (j === oi) b.classList.add("wrong"); else b.classList.add("dim");
      });
      card.insertAdjacentHTML("beforeend", `<p class="q-explain"><b>${oi === q.answer ? "Correct." : "Not quite."}</b> ${inline(q.explain || "")}</p>`);
      if (answers.every((a) => a !== null)) finish();
    }
    function finish() {
      const total = story.quiz.length, score = answers.filter((a, i) => a === story.quiz[i].answer).length;
      const msg = score === total ? "Perfect. The archive is impressed." : score >= total / 2 ? "Solid detective work." : "The rabbit hole is tricky. Try again?";
      $("[data-quiz-result]").innerHTML = `<div class="q-result" role="status"><div><div class="score">${score} / ${total}</div><p>${msg}</p></div>
        <button class="pill small ghost" type="button" data-retake>Retake</button></div>`;
      Progress.recordQuiz(story.id, score, total);
      if (score === total) confetti();
      markExplored(story, "Quiz finished");
    }
    function retake() {
      answers.fill(null);
      $$(".q-card", quiz).forEach((card) => {
        $$(".q-opt", card).forEach((b) => { b.disabled = false; b.classList.remove("correct", "wrong", "dim"); $(".mark", b).innerHTML = ""; });
        $(".q-explain", card)?.remove();
      });
      $("[data-quiz-result]").innerHTML = "";
      $(".q-card", quiz).scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "center" });
    }
  }

  /* Red string between the pins on the wall. */
  function drawStrings() {
    const board = $("[data-board]");
    if (!board) return;
    const svg = $(".strings", board), b = board.getBoundingClientRect();
    const pins = $$(".polaroid .pin", board).map((p) => { const r = p.getBoundingClientRect(); return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 }; });
    const hubIndex = $$(".polaroid", board).findIndex((c) => c.classList.contains("this"));
    const hub = pins[hubIndex];
    if (!hub) return;
    svg.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`);
    svg.innerHTML = pins.filter((_, i) => i !== hubIndex).map((p) => `<path d="M${hub.x} ${hub.y} Q${(hub.x + p.x) / 2} ${Math.max(hub.y, p.y) + 46} ${p.x} ${p.y}"/>`).join("");
  }
  function initBoard() {
    const board = $("[data-board]");
    if (!board) return;
    let t;
    drawStrings();
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(drawStrings, 120); });
    board.addEventListener("reveal", () => setTimeout(drawStrings, 60));
    window.addEventListener("load", drawStrings);
  }

  /* The foil card catches the light under your finger. */
  function initFoil() {
    const card = $("[data-foil]");
    if (!card || calm()) return;
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.classList.remove("idle");
      card.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      card.style.setProperty("--tx", `${((0.5 - y) * 10).toFixed(2)}deg`);
      card.style.setProperty("--ty", `${((x - 0.5) * 14).toFixed(2)}deg`);
    });
    card.addEventListener("pointerleave", () => { card.style.setProperty("--tx", "0deg"); card.style.setProperty("--ty", "0deg"); card.classList.add("idle"); });
  }

  function initGauge() {
    const g = $("[data-gauge]"), m = $("[data-marker]");
    if (!g || !m) return;
    const go = () => { m.style.top = `${g.dataset.y}px`; };
    if (calm()) return go();
    g.addEventListener("reveal", () => setTimeout(go, 350));
  }

  /* Gallery lightbox. */
  function initGallery(story) {
    const gallery = (story.gallery || []).filter((g) => g.src);
    if (!gallery.length) return;
    const dlg = document.createElement("dialog");
    dlg.className = "sheet";
    document.body.appendChild(dlg);
    document.addEventListener("click", (e) => {
      const f = e.target.closest("[data-photo]");
      if (f) {
        const g = gallery[Number(f.dataset.photo)];
        dlg.innerHTML = `<button class="sheet-close" type="button" data-close>Close ✕</button><div class="lightbox">${picture(g, 1920, { alt: g.alt })}
          <p>${escapeHtml(g.caption || g.alt || "")}</p><small>${creditLine(g)}</small></div>`;
        dlg.showModal();
      }
      if (e.target.closest("[data-close]") || e.target === dlg) dlg.close();
    });
  }

  /* Floating chapter pill: where you are, and a quick jump list. */
  function initChapter() {
    const wrap = document.createElement("div");
    wrap.className = "chapter";
    const C = 2 * Math.PI * 12;
    wrap.innerHTML = `<button class="chapter-btn" type="button" aria-expanded="false">
        <svg class="chapter-ring" viewBox="0 0 30 30"><circle class="bg" cx="15" cy="15" r="12"/><circle class="fg" cx="15" cy="15" r="12" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
        <span data-ch-n>01/09</span><b data-ch-name>The story</b></button>`;
    document.body.appendChild(wrap);
    const btn = $(".chapter-btn", wrap), ring = $(".fg", wrap), nEl = $("[data-ch-n]", wrap), nameEl = $("[data-ch-name]", wrap);
    const secs = SECTIONS.map(([id, name]) => ({ id, name, el: document.getElementById(id) })).filter((s) => s.el);
    let active = 0, ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY + innerHeight * 0.4;
      let i = 0;
      secs.forEach((s, j) => { if (s.el.offsetTop <= y) i = j; });
      const first = secs[0].el.offsetTop, last = document.documentElement.scrollHeight - innerHeight;
      wrap.classList.toggle("show", window.scrollY > first - innerHeight * 0.5 && window.scrollY < last - 80);
      ring.style.strokeDashoffset = String(C * (1 - clamp((window.scrollY - first) / (last - first))));
      if (i !== active || !nameEl.textContent) { active = i; nEl.textContent = `${String(i + 1).padStart(2, "0")}/${String(secs.length).padStart(2, "0")}`; nameEl.textContent = secs[i].name; }
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    btn.addEventListener("click", () => {
      const open = $(".chapter-menu", wrap);
      if (open) { open.remove(); btn.setAttribute("aria-expanded", "false"); return; }
      wrap.insertAdjacentHTML("beforeend", `<nav class="chapter-menu">${secs.map((s, j) => `<a href="#${s.id}" class="${j === active ? "on" : ""}"><i>${String(j + 1).padStart(2, "0")}</i>${escapeHtml(s.name)}</a>`).join("")}</nav>`);
      btn.setAttribute("aria-expanded", "true");
    });
    wrap.addEventListener("click", (e) => { if (e.target.closest(".chapter-menu a")) { $(".chapter-menu", wrap)?.remove(); btn.setAttribute("aria-expanded", "false"); } });
    update();
  }

  /* Explored state */
  function markExplored(story, reason) {
    const added = Progress.markExplored(story.id);
    paintExplored(story);
    if (added) loadStories().then((all) => {
      const n = all.filter((s) => Progress.isExplored(s.id)).length;
      toast({ kicker: reason || "Case file explored", title: `Stamped on your library card · ${n}/${all.length}`, icon: "check" });
    });
  }
  function paintExplored(story) {
    const done = Progress.isExplored(story.id);
    $$("[data-explore-toggle]").forEach((b) => { b.setAttribute("aria-pressed", String(done)); b.innerHTML = done ? `${icon("check")} Explored` : "Mark explored"; });
    const band = $("[data-done-band]");
    if (band) band.innerHTML = done
      ? `<p>Stamped on your <a href="library-card.html">library card</a>.</p><button class="pill small ghost" type="button" data-random>${icon("dice")} Another file</button>`
      : `<p>Finished reading? Stamp it on your library card.</p><button class="pill small" type="button" data-explore-toggle aria-pressed="false">Mark explored</button>`;
  }
  function initExplored(story) {
    paintExplored(story);
    document.addEventListener("click", (e) => {
      if (!e.target.closest("[data-explore-toggle]")) return;
      if (Progress.isExplored(story.id)) { Progress.unmarkExplored(story.id); paintExplored(story); } else markExplored(story);
    });
    const src = $("#sources");
    if (src && "IntersectionObserver" in window) new IntersectionObserver((en, obs) => {
      if (en[0].isIntersecting) { obs.disconnect(); markExplored(story, "You reached the end"); }
    }, { threshold: 0.4 }).observe(src);
  }

  /* Inline SVG illustrations so they follow the theme and can animate. */
  async function initIllustrations(story) {
    for (const ill of story.illustrations || []) {
      const slot = $(`[data-illustrations="${ill.after || "story"}"]`);
      if (!slot) continue;
      try {
        const svg = await fetch(ill.src).then((r) => (r.ok ? r.text() : Promise.reject(r.status)));
        const fig = document.createElement("figure");
        fig.className = "illus reveal";
        const legend = ill.legend?.length ? `<ol class="illus-legend">${ill.legend.map((l) => `<li>${inline(l)}</li>`).join("")}</ol>` : "";
        fig.innerHTML = `${svg}${legend}<figcaption><b>${escapeHtml(ill.title || "")}</b>${ill.caption ? ` · ${escapeHtml(ill.caption)}` : ""}</figcaption>`;
        const el = fig.querySelector("svg");
        el?.setAttribute("role", "img");
        el?.setAttribute("aria-label", ill.alt || ill.title || "");
        slot.appendChild(fig);
        observeReveals(slot);
      } catch (e) { console.warn("Illustration failed", ill.src, e); }
    }
  }

  function reviewBanner(story) {
    (story.factCheck || []).forEach((note) => flags.push({ note, where: "Story" }));
    if (!reviewMode) return "";
    return `<div class="review-banner" role="note"><details open><summary>Review mode · ${flags.length} detail${flags.length === 1 ? "" : "s"} flagged for fact-checking</summary>
      <ol>${flags.map((f) => `<li><b>${escapeHtml(f.where)}:</b> ${escapeHtml(f.note)}</li>`).join("")}</ol></details></div>`;
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  loadStories().then((all) => {
    const id = params.get("id");
    const story = all.find((s) => s.id === id) || (id ? null : all[0]);
    if (!story) {
      setTitle("Case file not found");
      root.innerHTML = `<div class="wrap"><div class="error-box"><h2>This case file has gone <em>missing.</em></h2>
        <p>There's no story called <code>${escapeHtml(id)}</code>. Spooky, but probably a typo.</p><p><a class="pill small" href="explore.html">Browse every file</a></p></div></div>`;
      return;
    }
    const cat = category(story.category), v = verdict(story.verdict);
    setTitle(story.title);
    document.body.dataset.storyId = story.id;
    $('meta[name="description"]')?.setAttribute("content", story.hook);
    if (reviewMode) document.body.classList.add("review-mode");

    const top = hero(story, cat, v);
    const body = [storySection(story), timelineSection(story), ledgerSection(story), peopleSection(story), whySection(story), funFactSection(story),
      depthSection(story), quizSection(story), sourcesSection(story), relatedSection(story, all)].join("");
    root.className = `cat-${cat.id} v-${v.id}`;
    root.innerHTML = `${reviewBanner(story)}${top}${facts(story, v)}${body}${caseNav(story, all)}`;

    if (story.people?.length) window.App.Dossier.mount($("[data-cast]"), window.App.Dossier.allPeople([story]));
    initTimeline(story); initQuiz(story); initBoard(); initFoil(); initGauge(); initGallery(story);
    initChapter(); initExplored(story); initIllustrations(story);
    observeReveals(root);
  }).catch((err) => showLoadError(root, err));
})();
