/* Explore: search + filters, synced to the URL so filtered views can be shared. */
(function () {
  "use strict";
  const { $, $$, SITE, escapeHtml, plain, normalize, icon, loadStories, showLoadError, Progress, storyCard, observeReveals } = window.App;

  const params = new URLSearchParams(location.search);
  const list = (key) => (params.get(key) || "").split(",").filter(Boolean);
  const state = {
    q: params.get("q") || "",
    cat: new Set(list("cat")),
    verdict: new Set(list("verdict")),
    level: new Set(list("level").map(Number)),
    unread: params.get("unread") === "1",
    sort: params.get("sort") || "case",
  };

  const SORTS = {
    case: ["Case number", (a, b) => a.caseNo - b.caseNo],
    deep: ["Deepest first", (a, b) => b.rabbitHoleLevel - a.rabbitHoleLevel || a.caseNo - b.caseNo],
    shallow: ["Shallowest first", (a, b) => a.rabbitHoleLevel - b.rabbitHoleLevel || a.caseNo - b.caseNo],
    oldest: ["Oldest events first", (a, b) => parseInt(a.year) - parseInt(b.year)],
    newest: ["Newest events first", (a, b) => parseInt(b.year) - parseInt(a.year)],
    az: ["A to Z", (a, b) => plain(a.title).replace(/^The /, "").localeCompare(plain(b.title).replace(/^The /, ""))],
  };

  // Everything searchable about a story, lower-cased once.
  const haystack = (s) => [
    plain(s.title), s.hook, s.year, s.location?.name, ...(s.tags || []),
    ...s.story.map((p) => normalize(p).text), ...s.timeline.map((t) => normalize(t).label),
  ].join(" ").toLowerCase();

  function renderFilters(stories) {
    const count = (fn) => stories.filter(fn).length;
    const chip = (group, value, label, cls, n) =>
      `<button type="button" class="chip ${cls}" data-group="${group}" data-value="${value}" aria-pressed="${state[group].has(value)}">
        ${cls ? '<span class="dot"></span>' : ""}${escapeHtml(label)} <span class="n">${n}</span></button>`;
    $("[data-filters]").innerHTML = `
      <fieldset><legend>Drawer</legend><div class="chip-row">
        ${SITE.categories.map((c) => chip("cat", c.id, c.short, `cat-${c.id}`, count((s) => s.category === c.id))).join("")}
      </div></fieldset>
      <fieldset><legend>Verdict</legend><div class="chip-row">
        ${SITE.verdicts.map((v) => chip("verdict", v.id, v.label, `v-${v.id}`, count((s) => s.verdict === v.id))).join("")}
      </div></fieldset>
      <fieldset><legend>Rabbit hole level</legend><div class="chip-row">
        ${[1, 2, 3, 4, 5].map((n) => chip("level", n, `−${n}`, "", count((s) => s.rabbitHoleLevel === n))).join("")}
      </div></fieldset>
      <fieldset><legend>Sort by</legend>
        <label class="visually-hidden" for="sort">Sort by</label>
        <select id="sort">${Object.entries(SORTS).map(([k, [label]]) => `<option value="${k}"${k === state.sort ? " selected" : ""}>${label}</option>`).join("")}</select>
      </fieldset>
      <label class="toggle"><input type="checkbox" id="unread"${state.unread ? " checked" : ""}> Hide files I've explored</label>`;
  }

  function apply(stories) {
    const explored = Progress.read().explored;
    const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    const results = stories
      .filter((s) => !state.cat.size || state.cat.has(s.category))
      .filter((s) => !state.verdict.size || state.verdict.has(s.verdict))
      .filter((s) => !state.level.size || state.level.has(s.rabbitHoleLevel))
      .filter((s) => !state.unread || !explored[s.id])
      .filter((s) => !words.length || words.every((w) => s._hay.includes(w)))
      .sort(SORTS[state.sort]?.[1] || SORTS.case[1]);

    const active = state.cat.size + state.verdict.size + state.level.size + (state.unread ? 1 : 0) + (state.q ? 1 : 0);
    $("[data-count]").textContent = `Showing ${results.length} of ${stories.length} case file${stories.length === 1 ? "" : "s"}`;
    $("[data-clear]").hidden = !active;
    $("[data-filters-toggle]").innerHTML = `${icon("filter")} Filters${active ? ` (${active})` : ""}`;

    $("[data-results]").innerHTML = results.length
      ? results.map((s, i) => storyCard(s, { delay: Math.min(i, 6) * 0.05 })).join("")
      : `<div class="empty" style="grid-column:1/-1"><b>Nothing down this hole.</b>No case files match those filters. Try loosening them a little.</div>`;
    observeReveals($("[data-results]"));

    // Keep the URL shareable.
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.cat.size) p.set("cat", [...state.cat].join(","));
    if (state.verdict.size) p.set("verdict", [...state.verdict].join(","));
    if (state.level.size) p.set("level", [...state.level].join(","));
    if (state.unread) p.set("unread", "1");
    if (state.sort !== "case") p.set("sort", state.sort);
    history.replaceState(null, "", p.toString() ? `?${p}` : location.pathname);
  }

  loadStories().then((stories) => {
    stories.forEach((s) => { s._hay = haystack(s); });
    renderFilters(stories);
    const input = $("#q");
    input.value = state.q;

    let t;
    input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { state.q = input.value.trim(); apply(stories); }, 120); });
    $("[data-filters]").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      const group = chip.dataset.group;
      const value = group === "level" ? Number(chip.dataset.value) : chip.dataset.value;
      state[group].has(value) ? state[group].delete(value) : state[group].add(value);
      chip.setAttribute("aria-pressed", String(state[group].has(value)));
      apply(stories);
    });
    $("[data-filters]").addEventListener("change", (e) => {
      if (e.target.id === "sort") state.sort = e.target.value;
      if (e.target.id === "unread") state.unread = e.target.checked;
      apply(stories);
    });
    $("[data-clear]").addEventListener("click", () => {
      state.q = ""; input.value = ""; state.cat.clear(); state.verdict.clear(); state.level.clear(); state.unread = false;
      renderFilters(stories);
      apply(stories);
    });
    const toggle = $("[data-filters-toggle]");
    toggle.addEventListener("click", () => {
      const open = $("[data-filters]").classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    apply(stories);
  }).catch((err) => showLoadError($("[data-results]"), err));

  observeReveals();
})();
