/* ==========================================================================
   The Rabbit Hole Archive — shared app code
   Data, top bar + Case Index, theme (Archive / Manuscript), motion switch,
   progress, clearance ranks, achievements, random, reveals, helpers.
   Everything is exposed on window.App.
   ========================================================================== */
(function () {
  "use strict";

  const SITE = window.SITE;
  const root = document.documentElement;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const calm = () => prefersReduced || root.classList.contains("calm");

  /* ------------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------------ */
  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Story text supports **bold** and *italic*, nothing else.
  const inline = (value) =>
    escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
  const plain = (value) => String(value ?? "").replace(/\*+/g, "");
  // List items may be a plain string or { text, factCheck }.
  const normalize = (item) => (typeof item === "string" ? { text: item } : item || { text: "" });

  const caseNo = (n) => String(n).padStart(3, "0");
  const storyUrl = (id) => "story.html?id=" + encodeURIComponent(id);
  const category = (id) => SITE.categories.find((c) => c.id === id) || { id, name: id, short: id };
  const verdict = (id) => SITE.verdicts.find((v) => v.id === id) || { id, label: id, blurb: "" };
  const level = (n) => SITE.levels[Math.min(Math.max(n, 1), 5) - 1];

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function formatDate(iso) {
    if (!iso) return "";
    const [y, m, d] = String(iso).split("-");
    if (d) return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
    if (m) return `${MONTHS[Number(m) - 1]} ${y}`;
    return y;
  }

  /* Wikimedia thumbnails: ask for the smallest standard width that's big enough. */
  const STEPS = [330, 500, 960, 1280, 1920];
  function imgSrc(image, want = 960) {
    if (!image?.src) return "";
    const src = image.src;
    if (!src.includes("upload.wikimedia.org/wikipedia/commons/") || src.includes("/thumb/")) return src;
    const step = STEPS.find((s) => s >= want) || 1920;
    if (image.w && image.w <= step) return src;
    const name = src.split("/").pop();
    const thumb = src.replace("/wikipedia/commons/", "/wikipedia/commons/thumb/") + "/" + step + "px-" + name;
    return /\.svg$/i.test(name) ? thumb + ".png" : thumb;
  }
  // Every photo a story carries: hero first, then its gallery.
  const storyImages = (s) => [s.hero, ...(s.gallery || [])].filter((i) => i && i.src && i.type !== "svg");
  const creditLine = (i) =>
    `${escapeHtml(i.credit || "Unknown")} · ${i.licenseUrl ? `<a href="${escapeHtml(i.licenseUrl)}" target="_blank" rel="noopener">${escapeHtml(i.license)}</a>` : escapeHtml(i.license || "")}${i.sourceUrl ? ` · <a href="${escapeHtml(i.sourceUrl)}" target="_blank" rel="noopener">Wikimedia Commons</a>` : ""}`;

  /* ------------------------------------------------------------------------
     Icons
     ------------------------------------------------------------------------ */
  const ICONS = {
    dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.1" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/></svg>',
    lens: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><g class="lens"><circle cx="10" cy="10" r="6"/><path d="M7.4 8.2a3.2 3.2 0 0 1 2.4-1.6" opacity=".6"/></g><path d="m14.6 14.6 5.4 5.4"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    question: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 9a3 3 0 1 1 4.2 2.8c-.8.3-1.2 1-1.2 1.8v.4"/><circle cx="12" cy="18" r=".6" fill="currentColor"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/></svg>',
  };
  const icon = (name) => ICONS[name] || "";

  function sealSvg(glyph) {
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2, r = i % 2 ? 44 : 48;
      pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
    }
    return `<svg class="seal" viewBox="0 0 100 100" aria-hidden="true">
      <polygon points="${pts.join(" ")}" fill="currentColor"/>
      <circle cx="50" cy="50" r="35" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="2"/>
      <circle cx="50" cy="50" r="31" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1" stroke-dasharray="2 3"/>
      <text class="glyph" x="50" y="51" text-anchor="middle" dominant-baseline="central" font-family="New York, Iowan Old Style, Georgia, serif" font-style="italic" font-size="${glyph.length > 2 ? 22 : 30}" fill="#000" fill-opacity=".72">${escapeHtml(glyph)}</text>
    </svg>`;
  }

  /* ------------------------------------------------------------------------
     Data
     ------------------------------------------------------------------------ */
  let storiesPromise, achievementsPromise;
  const fetchJson = (url) => fetch(url, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(`${url} returned ${r.status}`); return r.json(); });
  function loadStories() {
    storiesPromise ||= fetchJson(SITE.dataUrl).then((d) => (Array.isArray(d) ? d : d.stories).filter((s) => !s.draft).sort((a, b) => a.caseNo - b.caseNo));
    return storiesPromise;
  }
  function loadAchievements() {
    achievementsPromise ||= fetchJson(SITE.achievementsUrl).then((d) => d.achievements || d);
    return achievementsPromise;
  }
  function showLoadError(target, err) {
    console.error(err);
    const local = location.protocol === "file:";
    target.innerHTML = `<div class="error-box"><h2>The archive doors are stuck.</h2>
      <p>The case files couldn't be loaded.${local ? " Browsers block data files when a page is opened straight from disk." : ""}</p>
      ${local ? "<p>Start a tiny server in this folder: <code>python3 -m http.server 8000</code>, then open <code>http://localhost:8000</code>.</p>" : `<p>${escapeHtml(err.message)}</p>`}</div>`;
  }

  /* ------------------------------------------------------------------------
     Progress (localStorage, always wrapped)
     ------------------------------------------------------------------------ */
  const Progress = {
    read() {
      let d = {};
      try { d = JSON.parse(localStorage.getItem(SITE.storageKey)) || {}; } catch (e) { /* blocked */ }
      d.explored ||= {}; d.quiz ||= {}; d.randomJumps ||= 0; d.unlocked ||= {}; d.reader ||= ""; d.rank ||= 0;
      return d;
    },
    write(d) { try { localStorage.setItem(SITE.storageKey, JSON.stringify(d)); } catch (e) { /* ignore */ } },
    update(fn) { const d = this.read(); fn(d); this.write(d); document.dispatchEvent(new CustomEvent("progress:change", { detail: d })); return d; },
    isExplored(id) { return Boolean(this.read().explored[id]); },
    markExplored(id) {
      if (this.isExplored(id)) return false;
      this.update((d) => { d.explored[id] = new Date().toISOString(); });
      checkAchievements();
      return true;
    },
    unmarkExplored(id) { this.update((d) => { delete d.explored[id]; }); },
    recordQuiz(id, score, total) {
      this.update((d) => {
        const prev = d.quiz[id] || { best: 0, total, perfect: false };
        d.quiz[id] = { best: Math.max(prev.best, score), total, perfect: prev.perfect || score === total };
      });
      checkAchievements();
    },
    reset() { try { localStorage.removeItem(SITE.storageKey); } catch (e) { /* ignore */ } document.dispatchEvent(new CustomEvent("progress:change", { detail: this.read() })); },
  };

  /* ------------------------------------------------------------------------
     Clearance: points from reading, quizzes and curiosity
     ------------------------------------------------------------------------ */
  function points(progress, achievements = []) {
    const quizzes = Object.values(progress.quiz);
    return Object.keys(progress.explored).length * 100
      + quizzes.length * 20 + quizzes.filter((q) => q.perfect).length * 40
      + Math.min(progress.randomJumps, 20) * 5
      + achievements.filter((a) => a.unlocked).length * 50;
  }
  function clearance(pts) {
    const ranks = SITE.clearance;
    let i = 0;
    while (i + 1 < ranks.length && pts >= ranks[i + 1].at) i++;
    const next = ranks[i + 1];
    return { index: i, ...ranks[i], points: pts, next, toNext: next ? next.at - pts : 0, pct: next ? (pts - ranks[i].at) / (next.at - ranks[i].at) : 1 };
  }

  /* ------------------------------------------------------------------------
     Achievements (rule types documented in README)
     ------------------------------------------------------------------------ */
  function evaluateAchievements(stories, achievements, progress) {
    const explored = stories.filter((s) => progress.explored[s.id]);
    return achievements.map((a) => {
      const r = a.rule;
      let pool = stories, done = explored, target = r.count || 1;
      if (r.type === "verdict") { pool = stories.filter((s) => s.verdict === r.verdict); done = explored.filter((s) => s.verdict === r.verdict); }
      if (r.type === "category") { pool = stories.filter((s) => s.category === r.category); done = explored.filter((s) => s.category === r.category); }
      if (r.type === "level") { pool = stories.filter((s) => s.rabbitHoleLevel >= r.min); done = explored.filter((s) => s.rabbitHoleLevel >= r.min); }
      let current = done.length, available = pool.length;
      if (r.type === "quizPerfect") { current = Object.values(progress.quiz).filter((q) => q.perfect).length; available = stories.filter((s) => s.quiz?.length).length; }
      if (r.type === "random") { current = progress.randomJumps; available = Infinity; }
      if (r.type === "all") { target = stories.length; }
      if (r.type === "everyCategory") {
        const stocked = SITE.categories.filter((c) => stories.some((s) => s.category === c.id));
        target = stocked.length; available = target;
        current = stocked.filter((c) => explored.some((s) => s.category === c.id)).length;
      }
      // A badge waits until the archive holds enough matching stories.
      const unavailable = available < target;
      const unlocked = !unavailable && current >= target;
      return { ...a, current: Math.min(current, target), target, unlocked, unavailable, unlockedAt: progress.unlocked[a.id] };
    });
  }

  async function checkAchievements() {
    try {
      const [stories, achievements] = await Promise.all([loadStories(), loadAchievements()]);
      const progress = Progress.read();
      const results = evaluateAchievements(stories, achievements, progress);
      const fresh = results.filter((a) => a.unlocked && !progress.unlocked[a.id]);
      const rank = clearance(points(progress, results));
      const rankUp = rank.index > progress.rank;
      if (fresh.length || rankUp) {
        Progress.update((d) => { fresh.forEach((a) => { d.unlocked[a.id] = new Date().toISOString(); }); d.rank = Math.max(d.rank, rank.index); });
      }
      fresh.forEach((a, i) => setTimeout(() => toast({ kicker: "Seal earned", title: a.name, seal: a }), i * 900));
      if (rankUp) setTimeout(() => toast({ kicker: "Clearance raised", title: `${rank.name} · ${rank.title}`, icon: "key" }), fresh.length * 900);
      return results;
    } catch (e) { return []; }
  }

  /* ------------------------------------------------------------------------
     Toasts + confetti
     ------------------------------------------------------------------------ */
  function toast({ kicker = "", title = "", seal = null, icon: ic = null, duration = 4400 }) {
    let wrap = $(".toasts");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toasts"; wrap.setAttribute("role", "status"); wrap.setAttribute("aria-live", "polite");
      document.body.appendChild(wrap);
    }
    const el = document.createElement("div");
    el.className = "toast";
    const lead = seal ? `<span style="color:${escapeHtml(seal.color)}">${sealSvg(seal.glyph)}</span>` : ic ? `<span class="t-ico">${icon(ic)}</span>` : "";
    el.innerHTML = `${lead}<div><small>${escapeHtml(kicker)}</small><strong>${escapeHtml(title)}</strong></div>`;
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 450); }, duration);
  }

  function confetti() {
    if (calm()) return;
    const colors = ["#f3c969", "#ff6a3d", "#6e9bff", "#3fd5b5", "#bf5af2", "#f5f5f7"];
    const box = document.createElement("div");
    box.className = "confetti";
    for (let i = 0; i < 80; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.setProperty("--x", (Math.random() * 220 - 110).toFixed(0) + "px");
      p.style.setProperty("--r", (Math.random() * 900 - 450).toFixed(0) + "deg");
      p.style.animationDelay = (Math.random() * 0.5).toFixed(2) + "s";
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3400);
  }

  /* ------------------------------------------------------------------------
     Random + story of the day
     ------------------------------------------------------------------------ */
  async function goRandom(excludeId) {
    const stories = await loadStories();
    const progress = Progress.read();
    let pool = stories.filter((s) => s.id !== excludeId && !progress.explored[s.id]);
    if (!pool.length) pool = stories.filter((s) => s.id !== excludeId);
    if (!pool.length) pool = stories;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    Progress.update((d) => { d.randomJumps += 1; });
    location.href = storyUrl(pick.id);
  }
  function storyOfTheDay(stories, date = new Date()) {
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    let h = 2166136261;
    for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return stories[Math.abs(h) % stories.length];
  }

  /* ------------------------------------------------------------------------
     Shared renderers
     ------------------------------------------------------------------------ */
  const depthMeter = (n) =>
    `<span class="depth" role="img" aria-label="Rabbit Hole Level ${n} of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
  const miniStamp = (v) => `<span class="mini-stamp v-${escapeHtml(v)}">${escapeHtml(verdict(v).label)}</span>`;
  function picture(image, want, { alt, eager = false, cls = "" } = {}) {
    if (!image?.src) return "";
    const pos = image.focus ? ` style="object-position:${escapeHtml(image.focus)}"` : "";
    return `<img${cls ? ` class="${cls}"` : ""} src="${escapeHtml(imgSrc(image, want))}" alt="${escapeHtml(alt ?? image.alt ?? "")}"${pos} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" referrerpolicy="no-referrer">`;
  }
  const noImg = (story) => `<div class="no-img"><span>${escapeHtml(plain(story.title).replace(/^The /, "").charAt(0))}</span></div>`;

  function storyCard(story, { delay = 0, progress = Progress.read() } = {}) {
    const cat = category(story.category);
    return `<a class="case reveal cat-${escapeHtml(cat.id)}" href="${storyUrl(story.id)}" style="--d:${delay}s">
      <div class="case-img">${story.hero?.src ? picture(story.hero, 500, { alt: "" }) : noImg(story)}
        <span class="case-no">${caseNo(story.caseNo)}</span>
        ${progress.explored[story.id] ? `<span class="case-tick">${icon("check")}Explored</span>` : ""}
      </div>
      <div class="case-body"><small>${escapeHtml(cat.short)}</small><h3>${inline(story.title)}</h3><p>${escapeHtml(story.hook)}</p></div>
      <div class="case-foot">${miniStamp(story.verdict)}${depthMeter(story.rabbitHoleLevel)}</div>
    </a>`;
  }

  /* ------------------------------------------------------------------------
     Theme + motion
     ------------------------------------------------------------------------ */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  const theme = () => (root.dataset.theme === "light" ? "light" : "dark");
  function setTheme(t) {
    if (t === "light") root.dataset.theme = "light"; else delete root.dataset.theme;
    store.set("rha-theme", t);
    paintThemeBtn();
  }
  function paintThemeBtn() {
    const b = $("[data-theme-toggle]");
    if (!b) return;
    const light = theme() === "light";
    b.innerHTML = `${icon(light ? "moon" : "sun")}<span class="lbl">${light ? "Archive" : "Manuscript"}</span>`;
    b.setAttribute("aria-label", light ? "Switch to the dark Archive theme" : "Switch to the light Manuscript theme");
  }
  function setMotion(on) {
    root.classList.toggle("calm", !on);
    store.set("rha-motion", on ? "on" : "off");
    document.dispatchEvent(new CustomEvent("motion:change", { detail: on }));
  }
  if (store.get("rha-motion") === "off") root.classList.add("calm");

  /* ------------------------------------------------------------------------
     Top bar, Case Index, footer
     ------------------------------------------------------------------------ */
  const BRAND_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Wooden_Card_Catalog_Furniture.jpg/330px-Wooden_Card_Catalog_Furniture.jpg";

  function renderChrome() {
    const page = document.body.dataset.page;
    const links = [
      { href: "explore.html", label: "Explore", page: "explore" },
      { href: "people.html", label: "Who's Who", page: "people" },
      { href: "library-card.html", label: "Library Card", page: "library", count: true },
      { href: "about.html", label: "About", page: "about" },
    ];
    const header = $("#site-header");
    if (header) {
      header.outerHTML = `<a class="skip" href="#main">Skip to content</a>
      <header class="bar${document.body.dataset.photoHero ? " on-photo" : ""}" id="bar">
        <a class="brand" href="index.html" aria-label="${escapeHtml(SITE.name)}, home">
          <span class="brand-mark"><b>${escapeHtml(SITE.name.replace(/^The /, "").charAt(0))}</b><img src="${BRAND_IMG}" alt="" referrerpolicy="no-referrer" onerror="this.remove()"></span>
          <span>${escapeHtml(SITE.name)}</span>
        </a>
        <nav class="bar-nav" aria-label="Main">${links.map((l) => `<a href="${l.href}"${l.page === page ? ' aria-current="page"' : ""}>${l.label}${l.count ? ' <span class="bar-count" data-progress-count></span>' : ""}</a>`).join("")}</nav>
        <div class="bar-tools">
          <button class="bar-btn" type="button" data-index-open aria-haspopup="dialog">${icon("lens")}<span class="lbl">Case Index</span></button>
          <button class="bar-btn" type="button" data-random>${icon("dice")}<span class="lbl">Random</span><span class="visually-hidden"> story</span></button>
          <button class="bar-btn" type="button" data-theme-toggle></button>
        </div>
      </header>
      <dialog class="index-dlg" id="case-index" aria-label="Case Index"></dialog>`;
    }

    const footer = $("#site-footer");
    if (footer) {
      footer.outerHTML = `<footer class="foot"><div class="wrap">
        <div class="foot-grid">
          <div>
            <a class="brand" href="index.html"><span class="brand-mark"><b>${escapeHtml(SITE.name.replace(/^The /, "").charAt(0))}</b><img src="${BRAND_IMG}" alt="" referrerpolicy="no-referrer" onerror="this.remove()"></span><span style="color:var(--fg)">${escapeHtml(SITE.name)}</span></a>
            <p class="foot-promise">${escapeHtml(SITE.tagline)} <em>Every file separates what we know from what's speculation.</em></p>
          </div>
          <div><h4>The drawers</h4><ul>${SITE.categories.map((c) => `<li><a href="explore.html?cat=${c.id}">${escapeHtml(c.name)}</a></li>`).join("")}</ul></div>
          <div><h4>The archive</h4><ul>
            <li><a href="explore.html">Every case file</a></li>
            <li><a href="people.html">Who's Who</a></li>
            <li><a href="library-card.html">Your library card</a></li>
            <li><a href="about.html">How verdicts work</a></li>
            <li><a href="#" data-index-open>Case Index</a></li>
            <li><a href="#" data-random>Pull a random file</a></li>
          </ul></div>
        </div>
        <div class="foot-base"><span>&copy; ${new Date().getFullYear()} ${escapeHtml(SITE.name)}. Made for the curious.</span><span>Photographs: Wikimedia Commons, public domain or free licences, credited on every image.</span></div>
      </div></footer>`;
    }

    paintThemeBtn();
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-theme-toggle]")) setTheme(theme() === "light" ? "dark" : "light");
      if (e.target.closest("[data-random]")) { e.preventDefault(); goRandom(document.body.dataset.storyId); }
      if (e.target.closest("[data-index-open]")) { e.preventDefault(); openIndex(); }
      if (e.target.closest("[data-index-close]")) $("#case-index")?.close();
      const mt = e.target.closest("[data-motion]");
      if (mt) { setMotion(root.classList.contains("calm")); mt.innerHTML = motionLabel(); }
    });

    const bar = $("#bar");
    const onScroll = () => bar?.classList.toggle("solid", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  const motionLabel = () => `Motion: <b>${root.classList.contains("calm") ? "Off" : "On"}</b>`;

  async function openIndex() {
    const dlg = $("#case-index");
    if (!dlg) return;
    const stories = await loadStories();
    const progress = Progress.read();
    const here = document.body.dataset.storyId;
    let k = 0;
    const groups = SITE.categories.map((c) => {
      const list = stories.filter((s) => s.category === c.id);
      if (!list.length) return "";
      return `<section class="ix-drawer cat-${c.id}"><h3>${escapeHtml(c.name)}</h3><ul class="ix-list">${list.map((s) => `<li style="--k:${k++}">
        <a class="ix-item${s.id === here ? " now" : ""}" href="${storyUrl(s.id)}">
          <span class="ix-img">${s.hero?.src ? picture(s.hero, 500, { alt: "" }) : noImg(s)}</span>
          ${s.id === here ? '<span class="ix-here">You are here</span>' : ""}
          ${progress.explored[s.id] ? `<span class="ix-tick" title="Explored">${icon("check")}</span>` : ""}
          <span class="ix-txt"><small><b>${caseNo(s.caseNo)}</b>${escapeHtml(verdict(s.verdict).label)}</small><strong>${inline(s.title)}</strong></span>
        </a></li>`).join("")}</ul></section>`;
    }).join("");
    dlg.innerHTML = `<div class="ix-wrap">
      <div class="ix-head"><div><span class="eyebrow">Case Index · ${stories.length} files</span><h2>Where to, <em>detective?</em></h2></div>
        <button class="ix-close" type="button" data-index-close>Close ✕</button></div>
      ${groups}
      <div class="ix-foot">
        <a class="pill small" href="explore.html">Search the archive</a>
        <a class="pill small ghost" href="people.html">Who's Who</a>
        <button class="pill small ghost" type="button" data-random>${icon("dice")} Surprise me</button>
        <button class="pill small ghost" type="button" data-motion>${motionLabel()}</button>
      </div></div>`;
    dlg.showModal();
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }, { once: true });
  }

  async function paintProgressCount() {
    try {
      const stories = await loadStories();
      const explored = Progress.read().explored;
      const n = stories.filter((s) => explored[s.id]).length;
      $$("[data-progress-count]").forEach((el) => { el.textContent = `${n}/${stories.length}`; });
    } catch (e) { /* optional */ }
  }

  function setTitle(title) { document.title = title ? `${plain(title)} · ${SITE.name}` : SITE.name; }

  /* ------------------------------------------------------------------------
     Reveals
     ------------------------------------------------------------------------ */
  let io;
  function observeReveals(scope = document) {
    const items = $$(".reveal:not(.is-in), .will-stamp", scope);
    if (calm() || !("IntersectionObserver" in window)) {
      items.forEach((el) => { el.classList.add("is-in"); if (el.classList.contains("will-stamp")) el.classList.replace("will-stamp", "is-stamped"); el.dispatchEvent(new CustomEvent("reveal")); });
      return;
    }
    io ||= new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        if (el.classList.contains("will-stamp")) el.classList.replace("will-stamp", "is-stamped"); else el.classList.add("is-in");
        el.dispatchEvent(new CustomEvent("reveal"));
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  root.classList.add("js");
  renderChrome();
  setTitle(document.body.dataset.title || "");
  paintProgressCount();
  observeReveals();
  document.addEventListener("progress:change", paintProgressCount);
  window.addEventListener("load", () => setTimeout(checkAchievements, 700));

  window.App = {
    SITE, $, $$, escapeHtml, inline, plain, normalize, caseNo, storyUrl, category, verdict, level, formatDate,
    imgSrc, storyImages, creditLine, picture, noImg, icon, sealSvg, loadStories, loadAchievements, showLoadError,
    Progress, points, clearance, evaluateAchievements, checkAchievements, toast, confetti, goRandom, storyOfTheDay,
    depthMeter, miniStamp, storyCard, setTitle, observeReveals, calm, openIndex,
  };
})();
