/* ==========================================================================
   Dossiers — "Persons of interest" on story pages and the Who's Who page.
   Every person has a role (see SITE.roles); each role gets its own dossier
   design and colour, and the surrounding UI takes on that colour.
   Exposes window.App.Dossier.
   ========================================================================== */
(function () {
  "use strict";
  const { SITE, $, $$, escapeHtml, inline, plain, caseNo, storyUrl, picture, calm } = window.App;

  const role = (id) => SITE.roles.find((r) => r.id === id) || SITE.roles[0];
  const slug = (s) => plain(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const personId = (story, p) => `${slug(p.name)}--${story.id}`;
  const initials = (name) => plain(name).replace(/["“”]/g, "").replace(/\(.*?\)/g, "").split(/\s+/).filter((w) => /^[A-Za-zÀ-ž]/.test(w)).map((w) => w[0]).filter((c, i, a) => i === 0 || i === a.length - 1).join("").toUpperCase();
  // A–Z key: an explicit "sort" wins; otherwise the last real word (skipping Jr., II…).
  const surname = (name, sort) => {
    if (sort) return sort;
    const w = plain(name).replace(/["“”]/g, "").replace(/\(.*?\)/g, "").trim().split(/\s+/).filter((x) => !/^(Jr\.?|Sr\.?|I{1,3}|IV|V|VI)$/.test(x));
    return w[w.length - 1] || name;
  };

  function allPeople(stories) {
    return stories.flatMap((s) => (s.people || []).map((p, i) => ({ ...p, id: personId(s, p), n: i + 1, story: s })));
  }

  function avatar(p, size = "md") {
    const r = role(p.role);
    return `<span class="av av-${size}" style="--pc:${r.color}" aria-hidden="true">${p.photo?.src ? picture(p.photo, size === "lg" ? 500 : 330, { alt: "" }) : `<b>${escapeHtml(initials(p.name))}</b>`}</span>`;
  }

  /* Role decorations: small, editorial, one idea each. */
  function deco(roleId) {
    switch (roleId) {
      case "suspect": {
        let rings = "";
        for (let i = 0; i < 11; i++) rings += `<ellipse cx="60" cy="66" rx="${8 + i * 4.6}" ry="${11 + i * 5.4}" stroke-dasharray="${18 + (i % 3) * 9} ${4 + (i % 2) * 5}" transform="rotate(${(i % 2 ? 4 : -3)} 60 66)"/>`;
        return `<svg class="ds-print" viewBox="0 0 120 130" fill="none" stroke="currentColor" stroke-width="1.6">${rings}</svg>`;
      }
      case "survivor":
        return `<svg class="ds-pulse" viewBox="0 0 300 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M0 22 H90 l8 -14 l10 28 l10 -34 l9 26 l6 -6 H300"/></svg>`;
      case "investigator":
        return `<svg class="ds-badge" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="36" stroke-dasharray="2 4"/><path d="M50 26 l6.5 14.5 15.5 1.5 -11.8 10.3 3.6 15.4L50 59.6 36.2 67.7l3.6-15.4L28 42l15.5-1.5Z"/></svg>`;
      case "source":
        return `<svg class="ds-rings" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="60" cy="60" r="10"/><circle class="ring" cx="60" cy="60" r="26"/><circle class="ring r2" cx="60" cy="60" r="42"/><circle class="ring r3" cx="60" cy="60" r="58"/></svg>`;
      case "official":
        return `<svg class="ds-seal" viewBox="0 0 100 120" fill="currentColor"><path d="M34 70 L24 118 L40 106 L50 118 L56 72Z" opacity=".55"/><path d="M66 70 L76 118 L60 106 L50 118 L44 72Z" opacity=".75"/><circle cx="50" cy="46" r="38"/><circle cx="50" cy="46" r="29" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="2"/></svg>`;
      case "keeper":
        return `<svg class="ds-chain" viewBox="0 0 40 200" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 0 V200" stroke-dasharray="3 6"/><circle cx="20" cy="30" r="6"/><circle cx="20" cy="90" r="6"/><circle cx="20" cy="150" r="6" fill="currentColor"/></svg>`;
      case "expert":
        return `<svg class="ds-graph" viewBox="0 0 160 60" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 54 C30 50 40 20 64 30 S100 8 120 14 158 4 158 4"/><circle cx="158" cy="4" r="3" fill="currentColor"/></svg>`;
      default:
        return "";
    }
  }

  /* One dossier, styled by role. */
  function card(p, { showCase = true, compact = false } = {}) {
    const r = role(p.role), s = p.story;
    const fileNo = `${caseNo(s.caseNo)}-${String(p.n).padStart(2, "0")}`;
    const facts = (p.facts || []).map((f) => `<li>${inline(f)}</li>`).join("");
    const fc = p.factCheck ? ` fc` : "";
    return `<article class="dossier r-${r.id}${compact ? " compact" : ""}${fc}" style="--pc:${r.color}" ${p.factCheck ? `title="Needs fact-check: ${escapeHtml(p.factCheck)}"` : ""}>
      <div class="ds-deco" aria-hidden="true">${deco(r.id)}</div>
      <header class="ds-head"><span class="ds-kicker">${escapeHtml(r.kicker)}</span><span class="ds-file">File ${fileNo}</span></header>
      <div class="ds-id">
        ${avatar(p, "lg")}
        <div><h3 class="ds-name">${inline(p.name)}</h3>
          ${p.life ? `<p class="ds-life">${escapeHtml(p.life)}</p>` : ""}
          ${p.tag ? `<p class="ds-tag">${escapeHtml(p.tag)}</p>` : ""}</div>
      </div>
      ${p.status ? `<span class="ds-status">${escapeHtml(p.status)}</span>` : ""}
      <p class="ds-summary">${inline(p.summary || "")}</p>
      ${p.quote ? `<blockquote class="ds-quote"><p>${inline(p.quote.text)}</p>${p.quote.by ? `<cite>${escapeHtml(p.quote.by)}</cite>` : ""}</blockquote>` : ""}
      ${facts ? `<ul class="ds-facts">${facts}</ul>` : ""}
      ${p.photo?.src ? `<p class="ds-credit">Photo: ${escapeHtml(p.photo.credit || "")} · ${escapeHtml(p.photo.license || "")}</p>` : ""}
      ${showCase ? `<footer class="ds-foot"><a href="${storyUrl(s.id)}#people">Case ${caseNo(s.caseNo)} · ${inline(s.title)} <span aria-hidden="true">→</span></a></footer>` : ""}
    </article>`;
  }

  const rosterItem = (p, i, selected) => {
    const r = role(p.role);
    return `<button type="button" class="cast-item" role="option" aria-selected="${selected}" tabindex="${selected ? 0 : -1}" data-i="${i}" style="--pc:${r.color};--k:${i}">
      ${avatar(p, "sm")}
      <span class="ci-txt"><b>${inline(p.name)}</b><small>${escapeHtml(p.tag || r.label)}</small></span>
      <span class="ci-role">${escapeHtml(r.short)}</span>
    </button>`;
  };

  /* A sheet for phones (and for the Who's Who grid). */
  let sheet;
  function openSheet(p, opts) {
    if (!sheet) {
      sheet = document.createElement("dialog");
      sheet.className = "sheet person-sheet";
      document.body.appendChild(sheet);
      sheet.addEventListener("click", (e) => { if (e.target === sheet || e.target.closest("[data-close]")) sheet.close(); });
      sheet.addEventListener("close", () => document.dispatchEvent(new CustomEvent("dossier:close")));
    }
    sheet.style.setProperty("--pc", role(p.role).color);
    sheet.innerHTML = `<button class="sheet-close" type="button" data-close>Close ✕</button><div class="sheet-body">${card(p, opts)}</div>`;
    sheet.showModal();
    sheet.querySelector(".dossier")?.classList.add("enter");
  }

  /* Roster + live dossier panel, used on story pages. */
  function mount(el, people) {
    if (!el || !people.length) return;
    const roles = SITE.roles.filter((r) => people.some((p) => p.role === r.id));
    let filter = null, current = 0;
    const narrow = window.matchMedia("(max-width: 860px)");

    el.innerHTML = `<div class="cast" style="--pc:${role(people[0].role).color}">
      ${roles.length > 1 ? `<div class="cast-filters" role="group" aria-label="Filter by role">
        <button type="button" class="chip" data-role="" aria-pressed="true">Everyone <span class="n">${people.length}</span></button>
        ${roles.map((r) => `<button type="button" class="chip" data-role="${r.id}" aria-pressed="false" style="--cat:${r.color}"><span class="dot"></span>${escapeHtml(r.short)} <span class="n">${people.filter((p) => p.role === r.id).length}</span></button>`).join("")}
      </div>` : ""}
      <div class="cast-grid">
        <div class="cast-list" role="listbox" aria-label="People in this case">${people.map((p, i) => rosterItem(p, i, i === 0)).join("")}</div>
        <div class="cast-panel" aria-live="polite"></div>
      </div>
    </div>`;
    const cast = $(".cast", el), list = $(".cast-list", el), panel = $(".cast-panel", el);
    const items = () => $$(".cast-item", list).filter((b) => !b.hidden);

    function show(i, { focus = false, fromTap = false } = {}) {
      current = i;
      const p = people[i];
      $$(".cast-item", list).forEach((b) => { const on = Number(b.dataset.i) === i; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
      cast.style.setProperty("--pc", role(p.role).color);
      cast.dataset.role = p.role;
      if (narrow.matches) { if (fromTap) openSheet(p, { showCase: false }); }
      else {
        panel.innerHTML = card(p, { showCase: false });
        if (!calm()) panel.firstElementChild.classList.add("enter");
      }
      if (focus) $(`.cast-item[data-i="${i}"]`, list)?.focus();
    }

    list.addEventListener("click", (e) => { const b = e.target.closest(".cast-item"); if (b) show(Number(b.dataset.i), { fromTap: true }); });
    list.addEventListener("keydown", (e) => {
      const vis = items(), at = vis.findIndex((b) => Number(b.dataset.i) === current);
      const go = (k) => { e.preventDefault(); const b = vis[(k + vis.length) % vis.length]; if (b) show(Number(b.dataset.i), { focus: true }); };
      if (e.key === "ArrowDown" || e.key === "ArrowRight") go(at + 1);
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") go(at - 1);
      if (e.key === "Home") go(0);
      if (e.key === "End") go(vis.length - 1);
      if (e.key === "Enter" && narrow.matches) openSheet(people[current], { showCase: false });
    });
    $$(".cast-filters .chip", el).forEach((c) => c.addEventListener("click", () => {
      filter = c.dataset.role || null;
      $$(".cast-filters .chip", el).forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
      $$(".cast-item", list).forEach((b) => { b.hidden = filter ? people[Number(b.dataset.i)].role !== filter : false; });
      const first = items()[0];
      if (first && (filter && people[current].role !== filter)) show(Number(first.dataset.i));
    }));
    show(0);
  }

  window.App.Dossier = { role, slug, personId, allPeople, avatar, card, mount, openSheet, initials, surname };
})();
