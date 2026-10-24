/* Who's Who: every person across every case file, A–Z, filterable, each opening a role-styled dossier. */
(function () {
  "use strict";
  const { $, $$, SITE, escapeHtml, inline, plain, caseNo, loadStories, showLoadError, observeReveals } = window.App;
  const D = window.App.Dossier;
  const main = $(".who");
  const params = new URLSearchParams(location.search);
  const state = { q: "", role: params.get("role") || "" };

  loadStories().then((stories) => {
    const people = D.allPeople(stories).sort((a, b) => D.surname(a.name, a.sort).localeCompare(D.surname(b.name, b.sort)) || plain(a.name).localeCompare(plain(b.name)));
    const withPeople = new Set(people.map((p) => p.story.id));
    $("[data-stats]").innerHTML = `
      <div><b>${people.length}</b><span>names</span></div>
      <div><b>${withPeople.size}</b><span>case files</span></div>
      <div><b>${new Set(people.map((p) => p.role)).size}</b><span>kinds of file</span></div>`;

    const legend = $("[data-legend]");
    const roles = SITE.roles.filter((r) => people.some((p) => p.role === r.id));
    legend.innerHTML = `<button type="button" class="chip" data-role="" aria-pressed="${!state.role}">Everyone <span class="n">${people.length}</span></button>` +
      roles.map((r) => `<button type="button" class="chip" data-role="${r.id}" aria-pressed="${state.role === r.id}" style="--rc:${r.color}"><span class="dot"></span>${escapeHtml(r.label)} <span class="n">${people.filter((p) => p.role === r.id).length}</span></button>`).join("");

    function render() {
      const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      const list = people.filter((p) => (!state.role || p.role === state.role) &&
        (!words.length || words.every((w) => `${plain(p.name)} ${p.tag || ""} ${D.role(p.role).label} ${plain(p.story.title)} ${p.summary || ""}`.toLowerCase().includes(w))));
      const groups = {};
      list.forEach((p) => { const L = D.surname(p.name, p.sort).charAt(0).toUpperCase().normalize("NFD")[0]; (groups[L] ||= []).push(p); });
      const letters = Object.keys(groups).sort();
      $("[data-people]").innerHTML = letters.length ? letters.map((L) => `<section class="who-letter" id="letter-${L}">
          <h2>${L}<small>${groups[L].length}</small></h2>
          <div class="who-grid">${groups[L].map((p) => { const r = D.role(p.role); return `<button type="button" class="who-card reveal" data-person="${p.id}" style="--rc:${r.color}">
            ${D.avatar(p, "md")}
            <span><b>${inline(p.name)}</b><small>${escapeHtml(p.tag || r.label)}</small><span class="case">Case <i>${caseNo(p.story.caseNo)}</i> · ${escapeHtml(plain(p.story.title))}</span></span>
            <span class="ci-role" style="--pc:${r.color}">${escapeHtml(r.short)}</span></button>`; }).join("")}</div>
        </section>`).join("")
        : `<div class="empty"><b>No one by that name.</b>Try another spelling, or clear the filters.</div>`;
      $("[data-az]").innerHTML = letters.map((L) => `<a href="#letter-${L}">${L}</a>`).join("");
      observeReveals($("[data-people]"));
    }

    function open(id, push = true) {
      const p = people.find((x) => x.id === id);
      if (!p) return;
      main.style.setProperty("--pc", D.role(p.role).color);
      D.openSheet(p, { showCase: true });
      if (push) history.replaceState(null, "", `?p=${encodeURIComponent(id)}${state.role ? `&role=${state.role}` : ""}`);
    }
    document.addEventListener("dossier:close", () => { main.style.removeProperty("--pc"); history.replaceState(null, "", state.role ? `?role=${state.role}` : location.pathname); });

    legend.addEventListener("click", (e) => {
      const c = e.target.closest(".chip");
      if (!c) return;
      state.role = c.dataset.role;
      $$(".chip", legend).forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
      main.style.setProperty("--pc", state.role ? D.role(state.role).color : "#f3c969");
      history.replaceState(null, "", state.role ? `?role=${state.role}` : location.pathname);
      render();
    });
    let t;
    $("#q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value.trim(); render(); }, 120); });
    $("[data-people]").addEventListener("click", (e) => { const b = e.target.closest("[data-person]"); if (b) open(b.dataset.person); });

    if (state.role) main.style.setProperty("--pc", D.role(state.role).color);
    render();
    if (params.get("p")) open(params.get("p"), false);
  }).catch((err) => showLoadError($("[data-people]"), err));
})();
