/* ==========================================================================
   Homepage
   00 The archive, opened: a 3D wall of every case-file photograph
   01 Where to, detective?: a reel of destinations that turns as you scroll
   02 Today's pulls · 03 Four verdicts · 04 Every case file · 05 Clearance
   ========================================================================== */
(function () {
  "use strict";
  const { $, $$, SITE, escapeHtml, inline, plain, caseNo, storyUrl, category, verdict, icon, imgSrc, storyImages, picture, noImg,
    loadStories, loadAchievements, evaluateAchievements, showLoadError, Progress, points, clearance, storyOfTheDay,
    depthMeter, miniStamp, storyCard, observeReveals, calm, goRandom } = window.App;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  // Small seeded random so the wall is the same on every visit.
  function rng(seed) { return () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822519) + 0x6d2b79f5 | 0) >>> 0) / 4294967296; }

  /* ------------------------------------------------------------------------
     00 · The wall
     ------------------------------------------------------------------------ */
  function buildWall(stories) {
    const hero = $("#wall"), plane = $("[data-plane]"), holder = $("[data-tiles]");
    const rand = rng(17);
    const pool = stories.flatMap((s) => storyImages(s).map((img) => ({ img, s })));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    if (!pool.length) return;

    const W = 2520, H = 1640, colW = 230, gap = 26, cols = Math.floor(W / (colW + gap));
    const x0 = (W - cols * (colW + gap)) / 2;
    const tiles = [];
    let k = 0;
    for (let c = 0; c < cols; c++) {
      let y = c % 2 ? -110 : 10;
      while (y < H) {
        const { img, s } = pool[k++ % pool.length];
        const ratio = img.w && img.h ? img.w / img.h : 0.8;
        const h = Math.round(clamp(colW / ratio, 150, 320));
        const x = x0 + c * (colW + gap);
        const dist = Math.hypot(x + colW / 2 - W / 2, y + h / 2 - H / 2);
        tiles.push(`<a class="tile" href="${storyUrl(s.id)}" tabindex="-1" style="--x:${x}px;--y:${y}px;--z:${Math.round(rand() * 160 - 70)}px;--w:${colW}px;--h:${h}px;--delay:${(dist * 0.0007 + rand() * 0.25).toFixed(2)}s">
          ${picture(img, 330, { alt: "" })}
          <span class="tile-cap"><small>Case ${caseNo(s.caseNo)}</small>${escapeHtml(plain(s.title))}</span></a>`);
        y += h + gap;
      }
    }
    holder.innerHTML = tiles.join("");
    $("[data-wall-meta]").innerHTML = `<b>${pool.length}</b>photographs from ${stories.length} case file${stories.length === 1 ? "" : "s"}`;
    $("[data-wall-eyebrow]").textContent = `The archive, opened · ${stories.length} case file${stories.length === 1 ? "" : "s"}`;

    // Fold back as you scroll away (scroll-linked, transform only).
    let fold = -1;
    const onScroll = () => {
      const f = calm() ? 0 : clamp(window.scrollY / (window.innerHeight * 0.95));
      if (Math.abs(f - fold) > 0.001) { fold = f; hero.style.setProperty("--fold", f.toFixed(3)); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Lean towards the pointer.
    let tx = 0, ty = 0, rx = 0, ry = 0, raf = 0;
    const tick = () => {
      rx += (tx - rx) * 0.06; ry += (ty - ry) * 0.06;
      plane.style.setProperty("--rx", rx.toFixed(2) + "deg");
      plane.style.setProperty("--ry", ry.toFixed(2) + "deg");
      raf = Math.abs(tx - rx) + Math.abs(ty - ry) > 0.01 ? requestAnimationFrame(tick) : 0;
    };
    hero.addEventListener("pointermove", (e) => {
      if (calm() || e.pointerType !== "mouse") return;
      tx = (e.clientY / innerHeight - 0.5) * -6;
      ty = (e.clientX / innerWidth - 0.5) * 8;
      raf ||= requestAnimationFrame(tick);
    });

    // One picture at a time lifts out of the wall with its name.
    let lifted = null;
    const lift = () => {
      if (calm() || document.hidden || window.scrollY > innerHeight * 0.6) return;
      const vw = innerWidth, vh = innerHeight;
      const near = $$(".tile", holder).filter((t) => {
        const r = t.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        return t !== lifted && cx > vw * 0.38 && cx < vw * 0.9 && cy > vh * 0.14 && cy < vh * 0.56;
      });
      lifted?.classList.remove("lift");
      lifted = near[Math.floor(Math.random() * near.length)] || null;
      lifted?.classList.add("lift");
    };
    setTimeout(lift, 2200);
    setInterval(lift, 4600);
  }

  /* ------------------------------------------------------------------------
     01 · The reel
     ------------------------------------------------------------------------ */
  const emLast = (text) => { const w = text.split(" "); return w.length > 1 ? `${escapeHtml(w.slice(0, -1).join(" "))} <em>${escapeHtml(w.at(-1))}</em>` : `<em>${escapeHtml(text)}</em>`; };

  function reelOptions(stories, daily, rank) {
    const catColor = { "conspiracy-theories": "--c-conspiracy", "unsolved-mysteries": "--c-mystery", "hidden-history": "--c-history", "strange-places": "--c-places" };
    const drawers = SITE.categories.map((c, i) => {
      const list = stories.filter((s) => s.category === c.id);
      const withPhoto = list.find((s) => s.hero?.src);
      return {
        eyebrow: `Drawer ${String.fromCharCode(65 + i)} · ${list.length ? `${list.length} file${list.length === 1 ? "" : "s"}` : "being catalogued"}`,
        label: c.name, title: emLast(c.name), desc: c.blurb, href: `explore.html?cat=${c.id}`,
        img: withPhoto?.hero || SITE.fallbackImage, tint: cssVar(catColor[c.id]) || cssVar("--gold"), cta: "Open the drawer",
      };
    });
    const any = stories.flatMap(storyImages);
    return [
      ...drawers,
      { eyebrow: "Story of the day", label: plain(daily.title), title: inline(daily.title), desc: daily.hook, href: storyUrl(daily.id), img: daily.hero, tint: cssVar("--gold"), cta: "Read today's file" },
      { eyebrow: "Every case file", label: "Search the stacks", title: `Search the <em>stacks</em>`, desc: "Filter by drawer, verdict and how deep the rabbit hole goes.", href: "explore.html", img: any[any.length - 1] || SITE.fallbackImage, tint: cssVar("--c-mystery"), cta: "Explore" },
      { eyebrow: "Persons of interest", label: "Who's Who", title: `Who's <em>who</em>`, desc: "Every suspect, witness, investigator and lost soul in the archive, each with a dossier of their own.", href: "people.html", img: any[2] || SITE.fallbackImage, tint: "#ffd60a", cta: "Open the files" },
      { eyebrow: `Clearance · ${rank.name}`, label: "Your library card", title: `Your library <em>card</em>`, desc: `${rank.title}. Every file you finish gets stamped, and your clearance rises.`, href: "library-card.html", img: SITE.fallbackImage, tint: cssVar("--gold"), cta: "See your card" },
      { eyebrow: "Feeling lucky?", label: "Surprise me", title: `Surprise <em>me</em>`, desc: "Spin the reel and land on a random case file you haven't read yet.", href: "#", random: true, img: any[Math.floor(any.length / 2)] || SITE.fallbackImage, tint: cssVar("--accent"), cta: "Spin the reel" },
    ];
  }

  function slab(o, i) {
    return `<div class="slab" style="--i:${i};--tint-c:${escapeHtml(o.tint)}">
      ${o.img?.src ? picture(o.img, 960, { alt: "" }) : ""}
      <div class="slab-body"><small>${escapeHtml(o.eyebrow)}</small><strong>${o.title}</strong></div>
      <span class="slab-n">${String(i + 1).padStart(2, "0")}</span>
      <a class="slab-link" href="${o.href}"${o.random ? " data-spin" : ""} aria-label="${escapeHtml(o.label)}"></a>
    </div>`;
  }

  function buildReel(options) {
    const reel = $("[data-reel]");
    const head = `<div class="reel-title"><span class="eyebrow">The helm</span><h2>Where to, <em>detective?</em></h2></div>`;

    if (calm()) {
      reel.classList.add("static");
      reel.innerHTML = `<div class="reel-pin">${head}<div class="reel-grid">${options.map(slab).join("")}</div></div>`;
      return;
    }

    reel.style.setProperty("--n", options.length);
    reel.innerHTML = `<div class="reel-pin">
      ${head}
      <div class="drum-wrap"><div class="drum" data-drum>${options.map(slab).join("")}</div></div>
      <div class="reel-detail" data-detail aria-live="polite"></div>
      <ol class="reel-ticks">${options.map((o, i) => `<li><button type="button" data-tick="${i}">${escapeHtml(o.label)}</button></li>`).join("")}</ol>
    </div>`;

    const drum = $("[data-drum]"), slabs = $$(".slab", drum), ticks = $$("[data-tick]", reel), detail = $("[data-detail]"), pin = $(".reel-pin", reel);
    const n = options.length;
    let cur = 0, front = -1, lean = 0, leanT = 0, running = false;

    const range = () => { const r = reel.getBoundingClientRect(); return { top: r.top + window.scrollY, len: reel.offsetHeight - innerHeight }; };
    function setFront(i) {
      if (i === front) return;
      front = i;
      const o = options[i];
      slabs.forEach((s, j) => s.classList.toggle("front", j === i));
      ticks.forEach((t, j) => t.classList.toggle("on", j === i));
      pin.style.setProperty("--tint", o.tint);
      detail.innerHTML = `<div class="swap" style="display:grid;gap:14px"><p>${escapeHtml(o.desc)}</p>
        <div><a class="pill small" href="${o.href}"${o.random ? " data-spin" : ""}>${escapeHtml(o.cta)} ${icon("arrow")}</a></div></div>`;
    }
    function frame() {
      const { top, len } = range();
      const target = clamp((window.scrollY - top) / len) * (n - 1);
      cur += (target - cur) * 0.12;
      // Detent: each option clicks into place before the next one turns up.
      const base = Math.floor(cur), frac = cur - base;
      const shown = Math.min(n - 1, base + smooth(clamp((frac - 0.18) / 0.64)));
      lean += (leanT - lean) * 0.08;
      drum.style.setProperty("--rot", (shown * 36).toFixed(2) + "deg");
      drum.style.setProperty("--lean", lean.toFixed(2) + "deg");
      slabs.forEach((s, j) => {
        const d = Math.abs(j - shown);
        s.style.setProperty("--o", clamp(1 - d * 0.6).toFixed(2));
        s.style.pointerEvents = d < 0.3 ? "auto" : "none";
      });
      setFront(Math.round(shown));
      running = Math.abs(target - cur) > 0.001 || Math.abs(leanT - lean) > 0.01;
      if (running) requestAnimationFrame(frame);
    }
    const kick = () => { if (!running) { running = true; requestAnimationFrame(frame); } };
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    pin.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { leanT = (e.clientX / innerWidth - 0.5) * 7; kick(); } });
    ticks.forEach((t) => t.addEventListener("click", () => {
      const { top, len } = range();
      window.scrollTo({ top: top + (Number(t.dataset.tick) / (n - 1)) * len + 2, behavior: "smooth" });
    }));
    frame();
  }

  // "Surprise me": the reel spins like a slot machine, then sails somewhere random.
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-spin]");
    if (!el) return;
    e.preventDefault();
    const drum = $("[data-drum]");
    if (drum && !calm()) { drum.classList.add("spin"); setTimeout(() => goRandom(), 1100); } else goRandom();
  });

  /* ------------------------------------------------------------------------
     02–05
     ------------------------------------------------------------------------ */
  function spotlight(featured, daily) {
    const fc = category(featured.category), dc = category(daily.category);
    const now = new Date();
    return `<a class="feature reveal cat-${fc.id}" href="${storyUrl(featured.id)}">
        ${featured.hero?.src ? picture(featured.hero, 1280, { alt: "" }) : ""}
        <div class="feature-body">
          <span class="eyebrow">Featured file · Case ${caseNo(featured.caseNo)}</span>
          <h3>${inline(featured.title)}</h3>
          <p>${escapeHtml(featured.hook)}</p>
          <div class="feature-row">${miniStamp(featured.verdict)}<span class="depth-label">${depthMeter(featured.rabbitHoleLevel)} Level ${featured.rabbitHoleLevel}</span><span class="go">Open the file ${icon("arrow")}</span></div>
        </div>
      </a>
      <a class="daily reveal cat-${dc.id}" href="${storyUrl(daily.id)}" style="--d:.1s">
        <div class="daily-top"><span class="eyebrow">Story of the day</span>
          <span class="cal" aria-label="Today"><small>${escapeHtml(now.toLocaleDateString(undefined, { month: "short" }))}</small><b>${now.getDate()}</b></span></div>
        <div class="daily-img">${daily.hero?.src ? picture(daily.hero, 960, { alt: "" }) : noImg(daily)}</div>
        <h3>${inline(daily.title)}</h3>
        <p>${escapeHtml(daily.hook)}</p>
        <span class="go">Read today's file ${icon("arrow")}</span>
      </a>`;
  }

  const verdictTiles = (stories) => SITE.verdicts.map((v) => {
    const n = stories.filter((s) => s.verdict === v.id).length;
    return `<div class="verdict"><span class="stamp big will-stamp v-${v.id}">${escapeHtml(v.label)}</span><p>${escapeHtml(v.blurb)}</p>
      <span class="num">${n}<small>case file${n === 1 ? "" : "s"}</small></span></div>`;
  }).join("");

  function clearanceBand(stories, results, progress) {
    const rank = clearance(points(progress, results));
    const explored = stories.filter((s) => progress.explored[s.id]);
    const segs = SITE.categories.map((c) => {
      const n = explored.filter((s) => s.category === c.id).length;
      return n ? `<span class="cat-${c.id}" style="width:${(n / stories.length) * 100}%"></span>` : "";
    }).join("");
    const next = results.filter((a) => !a.unlocked && !a.unavailable).sort((a, b) => b.current / b.target - a.current / a.target)[0];
    return `<div>
        <span class="rank">${escapeHtml(rank.name)}</span>
        <h2>You've explored <em>${explored.length} of ${stories.length}</em> case files.</h2>
        <div class="bar-track stack" role="progressbar" aria-valuemin="0" aria-valuemax="${stories.length}" aria-valuenow="${explored.length}" aria-label="Case files explored">${segs}</div>
        <div class="meta"><span>${rank.title} · ${rank.points} points</span><span>${rank.next ? `${rank.toNext} to ${escapeHtml(rank.next.name)}` : "Highest clearance"}</span></div>
        ${next ? `<p class="mute" style="margin-top:18px">Next seal: <b style="color:var(--fg)">${escapeHtml(next.name)}</b>. ${escapeHtml(next.description)} (${next.current}/${next.target})</p>` : ""}
      </div>
      <div class="clearance-actions"><a class="pill" href="library-card.html">Your library card</a><button class="pill ghost" type="button" data-random>${icon("dice")} Random file</button></div>`;
  }

  /* Two rows of names drifting in opposite directions; each opens its dossier. */
  function namesMarquee(stories) {
    const D = window.App.Dossier;
    const people = D ? D.allPeople(stories) : [];
    if (people.length < 6) return;
    const pill = (p) => { const r = D.role(p.role); return `<a class="name-pill" href="people.html?p=${encodeURIComponent(p.id)}" style="--pc:${r.color}">${D.avatar(p, "sm")}<span>${escapeHtml(plain(p.name))}</span><small>${escapeHtml(r.short)}</small></a>`; };
    const half = Math.ceil(people.length / 2);
    const rows = [people.slice(0, half), people.slice(half)];
    $("[data-names]").innerHTML = rows.map((row, i) => `<div class="names-row${i ? " rev" : ""}" style="--t:${Math.max(40, row.length * 4)}s">${row.map(pill).join("")}${row.map(pill).join("")}</div>`).join("");
    $("[data-names-section]").hidden = false;
  }

  loadStories().then(async (stories) => {
    const progress = Progress.read();
    let results = [];
    try { results = evaluateAchievements(stories, await loadAchievements(), progress); } catch (e) { /* optional */ }
    const featured = stories.find((s) => s.featured) || stories[0];
    let daily = storyOfTheDay(stories);
    if (daily.id === featured.id && stories.length > 1) daily = stories[(stories.indexOf(daily) + 1) % stories.length];

    buildWall(stories);
    buildReel(reelOptions(stories, daily, clearance(points(progress, results))));
    $("[data-spotlight]").innerHTML = spotlight(featured, daily);
    $("[data-verdicts]").innerHTML = verdictTiles(stories);
    $("[data-latest]").innerHTML = stories.map((s, i) => storyCard(s, { delay: (i % 3) * 0.08, progress })).join("");
    $("[data-clearance]").innerHTML = clearanceBand(stories, results, progress);
    namesMarquee(stories);
    observeReveals();
  }).catch((err) => showLoadError($("[data-spotlight]"), err));

  document.addEventListener("motion:change", () => location.reload());
})();
