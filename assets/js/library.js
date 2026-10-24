/* Library card: a clearance ID with every stamped file, drawer progress, quiz record, ranks and seals. */
(function () {
  "use strict";
  const { $, SITE, escapeHtml, inline, caseNo, storyUrl, category, loadStories, loadAchievements, evaluateAchievements,
    showLoadError, Progress, points, clearance, sealSvg, miniStamp, observeReveals, checkAchievements } = window.App;
  const root = $("[data-library]");
  const shortDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "2-digit" });

  async function render() {
    const [stories, achievements] = await Promise.all([loadStories(), loadAchievements()]);
    await checkAchievements();
    const progress = Progress.read();
    const explored = stories.filter((s) => progress.explored[s.id]).sort((a, b) => progress.explored[b.id].localeCompare(progress.explored[a.id]));
    const results = evaluateAchievements(stories, achievements, progress);
    const rank = clearance(points(progress, results));
    const quizzes = Object.values(progress.quiz);
    const segs = SITE.categories.map((c) => {
      const n = explored.filter((s) => s.category === c.id).length;
      return n ? `<span class="cat-${c.id}" style="width:${(n / stories.length) * 100}%"></span>` : "";
    }).join("");

    root.innerHTML = `
      <div class="library">
        <div>
          <article class="idcard reveal">
            <div class="idcard-top">
              <div><small>${escapeHtml(SITE.name)} · Borrower's card</small><h2>Clearance: <em>${escapeHtml(rank.title)}</em></h2></div>
              <span class="rank">${escapeHtml(rank.name)}</span>
            </div>
            <label class="reader">Borrower <input type="text" maxlength="32" placeholder="Sign your card" value="${escapeHtml(progress.reader)}" data-reader aria-label="Your name for the library card"></label>
            <div class="idcard-big"><b>${explored.length}</b><span>of ${stories.length} case files explored</span></div>
            <div class="bar-track stack" role="progressbar" aria-valuemin="0" aria-valuemax="${stories.length}" aria-valuenow="${explored.length}" aria-label="Case files explored">${segs}</div>
            <div class="points"><span>${rank.points} points</span><span>${rank.next ? `${rank.toNext} to ${escapeHtml(rank.next.name)}` : "Highest clearance"}</span></div>
            <div class="stamps-log">${explored.length ? explored.map((s) => `<a href="${storyUrl(s.id)}">
                <span class="date-ink">${escapeHtml(shortDate(progress.explored[s.id]))}</span>
                <span><strong>${inline(s.title)}</strong><small>Case ${caseNo(s.caseNo)} · ${escapeHtml(category(s.category).short)}</small></span>
                ${miniStamp(s.verdict)}</a>`).join("")
              : `<p style="padding:14px 0;color:rgba(245,245,247,.6)">No stamps yet. Finish a case file, or its quiz, and it gets stamped here. <a href="#" data-random style="color:#f3c969;text-decoration:underline">Pull a random file?</a></p>`}</div>
          </article>
        </div>
        <div>
          <div class="panel reveal" style="--d:.08s">
            <h2>Progress by drawer</h2>
            <div class="drawer-progress">${SITE.categories.map((c) => {
              const total = stories.filter((s) => s.category === c.id).length, n = explored.filter((s) => s.category === c.id).length;
              return `<div class="row cat-${c.id}"><span>${escapeHtml(c.name)}</span><span class="mute tabular">${total ? `${n}/${total}` : "None yet"}</span>
                <div class="bar-track"><span style="width:${total ? (n / total) * 100 : 0}%"></span></div></div>`;
            }).join("")}</div>
          </div>
          <div class="panel reveal" style="--d:.14s">
            <h2>Record</h2>
            <div class="stats">
              <div class="stat"><b>${quizzes.length}</b><span>quizzes</span></div>
              <div class="stat"><b>${quizzes.filter((q) => q.perfect).length}</b><span>perfect</span></div>
              <div class="stat"><b>${progress.randomJumps}</b><span>random jumps</span></div>
            </div>
          </div>
          <div class="panel reveal" style="--d:.2s">
            <h2>Clearance ranks</h2>
            <ul class="ranks">${SITE.clearance.map((r, i) => `<li class="${i < rank.index ? "reached" : i === rank.index ? "current" : ""}"><span>${escapeHtml(r.name)} · ${escapeHtml(r.title)}</span><span>${r.at}</span></li>`).join("")}</ul>
          </div>
        </div>
      </div>
      <section class="section" style="padding-top:40px">
        <div class="head reveal"><span class="eyebrow">Wax seals</span><h2>Achievements <em>earned.</em></h2><p>${results.filter((a) => a.unlocked).length} of ${results.length} seals. Each one also adds 50 points to your clearance.</p></div>
        <div class="seals">${results.map((a, i) => `<div class="seal-card reveal ${a.unlocked ? "unlocked" : "locked"}" style="--seal:${escapeHtml(a.color)};--d:${(i % 5) * 0.05}s">
          ${sealSvg(a.glyph)}<h3>${escapeHtml(a.name)}</h3><p>${escapeHtml(a.description)}</p>
          <span class="prog">${a.unavailable ? "Needs more case files" : a.unlocked ? `Earned${a.unlockedAt ? " " + escapeHtml(shortDate(a.unlockedAt)) : ""}` : `${a.current}/${a.target}`}</span>
        </div>`).join("")}</div>
        <p style="margin-top:48px"><button class="pill small ghost" type="button" data-reset>Reset my progress</button></p>
      </section>`;

    $("[data-reader]").addEventListener("change", (e) => Progress.update((d) => { d.reader = e.target.value.trim(); }));
    $("[data-reset]").addEventListener("click", () => {
      if (confirm("Erase every stamp, quiz score and seal from this browser? This can't be undone.")) { Progress.reset(); render(); }
    });
    observeReveals(root);
  }

  render().catch((err) => showLoadError(root, err));
})();
