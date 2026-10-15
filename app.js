(() => {
  const { industries, items } = window.PORTFOLIO;
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const bySlug = Object.fromEntries(items.map((it) => [it.slug, it]));
  const aiSamples = window.AI_SAMPLES || [];
  const aiById = Object.fromEntries(aiSamples.map((s) => [s.id, s]));

  const img = {
    site: (it) => `assets/web/${it.slug}.jpg`,
    doc: (it, n) => `assets/docs/${it.slug}/${pad(n)}.jpg`,
    docCover: (it) => `assets/docs/${it.slug}/cover_s.jpg`,
    card: (it, key) => `assets/cards/${it.slug}/${key}.jpg`,
  };
  const VIEW_LABEL = { brand: "ブランド一式", site: "Webサイト", doc: "資料", card: "名刺", ai: "AIバックオフィス" };

  let view = "brand";
  let industry = "all";

  /* ---------- ブランド一式の見本（濃い帯） ---------- */
  const SET_PICKS = ["inkdot", "lumiere", "sumitei", "picot", "noirline", "ayaori"];
  let setSlug = SET_PICKS[0];
  function renderSet() {
    const it = bySlug[setSlug];
    $("#setDemo").innerHTML = `
      <figure class="sd-site">
        <div class="sd-media"><img src="${img.site(it)}" alt="${esc(it.name)}のWebサイト"></div>
        <figcaption><b>Webサイト</b><span>${esc(it.name)}</span></figcaption>
      </figure>
      <figure class="sd-doc">
        <div class="sd-media"><img src="${img.docCover(it)}" alt="${esc(it.name)}の${esc(it.docTitle)}の表紙"></div>
        <figcaption><b>${esc(it.docTitle)}</b><span>${it.docPages}ページ</span></figcaption>
      </figure>
      <figure class="sd-card">
        <div class="sd-media"><img src="${img.card(it, "yoko_front")}" alt="${esc(it.name)}の名刺（表）"></div>
        <figcaption><b>名刺</b><span>横型・縦型</span></figcaption>
      </figure>`;
    $(".set-switch")?.remove();
    const sw = document.createElement("div");
    sw.className = "set-switch";
    sw.innerHTML = `<span>ほかの例：</span>` +
      SET_PICKS.map((s) => `<button type="button" data-set="${s}" aria-pressed="${s === setSlug}">${esc(bySlug[s].name)}</button>`).join("") +
      `<a class="btn set-open" href="#w/${setSlug}">このブランドを詳しく見る</a>`;
    $("#setDemo").after(sw);
    sw.addEventListener("click", (e) => {
      const b = e.target.closest("[data-set]");
      if (!b) return;
      setSlug = b.dataset.set;
      renderSet();
    });
  }

  /* ---------- 絞り込み ---------- */
  function renderChips() {
    const counts = Object.fromEntries(industries.map((i) => [i.key, items.filter((it) => it.industry === i.key).length]));
    $("#chips").innerHTML = [`<button type="button" data-ind="all" aria-pressed="${industry === "all"}">すべての業種</button>`]
      .concat(industries.map((i) => `<button type="button" data-ind="${i.key}" aria-pressed="${industry === i.key}">${esc(i.name)}<span class="n"> ${counts[i.key]}</span></button>`))
      .join("");
  }

  function thumbHTML(it) {
    if (view === "site") return `<div class="thumb"><img loading="lazy" src="${img.site(it)}" alt=""></div>`;
    if (view === "doc") return `<div class="thumb doc"><span class="badge">${it.docPages}ページ</span><img loading="lazy" src="${img.docCover(it)}" alt=""></div>`;
    if (view === "card") return `<div class="thumb card"><div class="pair"><img loading="lazy" src="${img.card(it, "yoko_back")}" alt=""><img loading="lazy" src="${img.card(it, "yoko_front")}" alt=""></div></div>`;
    return `<div class="thumb brand">
      <img loading="lazy" src="${img.site(it)}" alt="">
      <div class="t-doc"><img loading="lazy" src="${img.docCover(it)}" alt=""></div>
      <div class="t-card"><img loading="lazy" src="${img.card(it, "yoko_front")}" alt=""></div>
    </div>`;
  }

  function descFor(it) {
    if (view === "doc") return `${it.docTitle}（${it.docPages}ページ）。PowerPoint・PDF・アニメーション付きの版で納品。`;
    if (view === "card") return it.cardDesc.split("（")[0].replace(/[、。]$/, "") + "。";
    return it.siteDesc;
  }

  function renderAiGrid() {
    $("#chips").hidden = true;
    $("#grid").innerHTML = aiSamples.map((s) => `
      <a class="card-item" href="#ai/${s.id}" aria-label="${esc(s.title)}の見本を見る">
        <div class="thumb ai"><span class="badge">AI × 人の確認</span><img loading="lazy" src="assets/ai/${s.id}.jpg" alt=""></div>
        <div class="meta">
          <div class="meta-top">${s.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.sub)}</p>
        </div>
      </a>`).join("");
    $("#count").textContent = `AIバックオフィス：${aiSamples.length}点（依頼主は架空の不動産会社「中野すまい相談室」を想定）`;
  }

  function renderGrid() {
    if (view === "ai") return renderAiGrid();
    $("#chips").hidden = false;
    const list = items.filter((it) => industry === "all" || it.industry === industry);
    const tab = { brand: "", site: "site", doc: "doc", card: "card" }[view];
    $("#grid").innerHTML = list.map((it) => `
      <a class="card-item" href="#w/${it.slug}${tab ? "/" + tab : ""}" aria-label="${esc(it.name)}の${VIEW_LABEL[view]}を見る">
        ${thumbHTML(it)}
        <div class="meta">
          <div class="meta-top"><span>${esc(it.industryName)}</span><span>${esc(it.taste)}</span></div>
          <h3>${esc(it.name)}</h3>
          <p>${esc(descFor(it))}</p>
        </div>
      </a>`).join("");
    const unit = view === "brand" ? "ブランド（各3点）" : "点";
    $("#count").textContent = `${VIEW_LABEL[view]}：${list.length}${unit}`;
  }

  document.querySelector(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-view]");
    if (!b) return;
    view = b.dataset.view;
    document.querySelectorAll(".tabs [data-view]").forEach((t) => t.setAttribute("aria-selected", t === b));
    renderGrid();
  });
  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ind]");
    if (!b) return;
    industry = b.dataset.ind;
    renderChips();
    renderGrid();
  });

  /* ---------- 詳細（モーダル） ---------- */
  const modal = $("#modal");
  let lastFocus = null;
  let docPage = 1;

  function openModal(slug, tab) {
    const it = bySlug[slug];
    if (!it) return closeModal(true);
    if (modal.hidden) lastFocus = document.activeElement;
    docPage = 1;
    const tabs = ["site", "doc", "card"];
    tab = tabs.includes(tab) ? tab : "site";
    $("#modalBody").innerHTML = `
      <div class="m-head">
        <div class="meta-top"><span>${esc(it.industryName)}</span><span>${esc(it.taste)}</span></div>
        <h2 id="mTitle">${esc(it.name)}</h2>
      </div>
      <div class="tabs m-tabs" role="tablist" aria-label="制作物">
        ${tabs.map((t) => `<button role="tab" data-mtab="${t}" aria-selected="${t === tab}">${VIEW_LABEL[t]}</button>`).join("")}
      </div>

      <section class="m-sec" data-sec="site" ${tab === "site" ? "" : "hidden"}>
        <h3>Webサイト（WordPress オリジナルテーマ）</h3>
        <p class="m-desc">${esc(it.siteDesc)}</p>
        <a class="m-shot" href="${it.siteUrl}" target="_blank" rel="noopener"><img src="${img.site(it)}" alt="${esc(it.name)}のWebサイトのトップページ"></a>
        <div class="m-actions">
          <a class="btn" href="${it.siteUrl}" target="_blank" rel="noopener">実際のサイトを見る</a>
          <small>PC・スマートフォンの両方に対応しています。新しいタブで開きます。</small>
        </div>
      </section>

      <section class="m-sec" data-sec="doc" ${tab === "doc" ? "" : "hidden"}>
        <h3>${esc(it.docTitle)}（${it.docPages}ページ・16:9）</h3>
        <p class="m-desc">サイトと同じ色・書体で組んだ資料です。PowerPointで編集できる形と、PDF版、アニメーション付きの版を用意しています。</p>
        <div class="viewer">
          <img id="docImg" src="${img.doc(it, 1)}" alt="${esc(it.docTitle)} 1ページ目">
          <button class="nav-btn prev" type="button" aria-label="前のページ">‹</button>
          <button class="nav-btn next" type="button" aria-label="次のページ">›</button>
          <span class="page" id="docPage">1 / ${it.docPages}</span>
        </div>
        <div class="strip" id="strip">
          ${Array.from({ length: it.docPages }, (_, i) => `<button type="button" data-p="${i + 1}" aria-label="${i + 1}ページ目" aria-current="${i === 0}"><img loading="lazy" src="${img.doc(it, i + 1)}" alt=""></button>`).join("")}
        </div>
      </section>

      <section class="m-sec" data-sec="card" ${tab === "card" ? "" : "hidden"}>
        <h3>名刺（91×55mm・両面）</h3>
        <p class="m-desc">${esc(it.cardDesc)}</p>
        <div class="seg" role="group" aria-label="名刺の向き">
          <button type="button" data-orient="yoko" aria-pressed="true">横型</button>
          <button type="button" data-orient="tate" aria-pressed="false">縦型</button>
        </div>
        <div id="cardView"></div>
        <dl class="spec">
          <dt>仕様</dt><dd>一般サイズ 91×55mm・横型と縦型・両面／CMYK・塗り足し3mm・トンボ付き</dd>
          ${it.cardPaper ? `<dt>用紙の提案</dt><dd>${esc(it.cardPaper)}</dd>` : ""}
          <dt>納品形式</dt><dd>Illustrator（ai）・PDF・PNG・JPG、印刷会社への入稿データ</dd>
        </dl>
      </section>`;

    const setOrient = (o) => {
      modal.querySelectorAll("[data-orient]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.orient === o));
      $("#cardView").innerHTML = `
        <div class="card-sides ${o}">
          <figure><img src="${img.card(it, o + "_front")}" alt="${esc(it.name)}の名刺（${o === "yoko" ? "横型" : "縦型"}・表）"><figcaption>表</figcaption></figure>
          <figure><img src="${img.card(it, o + "_back")}" alt="${esc(it.name)}の名刺（${o === "yoko" ? "横型" : "縦型"}・裏）"><figcaption>裏</figcaption></figure>
        </div>
        <div class="m-check"><img loading="lazy" src="${img.card(it, "check_" + o)}" alt="${esc(it.name)}の名刺の印刷イメージ"></div>`;
    };
    setOrient("yoko");

    const goPage = (n) => {
      docPage = (n - 1 + it.docPages) % it.docPages + 1;
      $("#docImg").src = img.doc(it, docPage);
      $("#docImg").alt = `${it.docTitle} ${docPage}ページ目`;
      $("#docPage").textContent = `${docPage} / ${it.docPages}`;
      $("#strip").querySelectorAll("button").forEach((b) => {
        const on = Number(b.dataset.p) === docPage;
        b.setAttribute("aria-current", on);
        if (on) b.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    };

    $("#modalBody").onclick = (e) => {
      const t = e.target;
      const mt = t.closest("[data-mtab]");
      if (mt) {
        history.replaceState(null, "", `#w/${slug}/${mt.dataset.mtab}`);
        modal.querySelectorAll("[data-mtab]").forEach((b) => b.setAttribute("aria-selected", b === mt));
        modal.querySelectorAll(".m-sec").forEach((s) => (s.hidden = s.dataset.sec !== mt.dataset.mtab));
        return;
      }
      if (t.closest(".prev")) return goPage(docPage - 1);
      if (t.closest(".next")) return goPage(docPage + 1);
      const p = t.closest("[data-p]");
      if (p) return goPage(Number(p.dataset.p));
      const o = t.closest("[data-orient]");
      if (o) return setOrient(o.dataset.orient);
    };
    modal._goPage = goPage;

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $(".modal-panel").scrollTop = 0;
    $(".modal-close").focus();
  }

  function openAi(id) {
    const s = aiById[id];
    if (!s) return closeModal(true);
    if (modal.hidden) lastFocus = document.activeElement;
    $("#modalBody").onclick = null;
    $("#modalBody").innerHTML = `
      <div class="m-head">
        <div class="meta-top"><span>AIバックオフィス</span>${s.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
        <h2 id="mTitle">${esc(s.title)}</h2>
      </div>
      <section class="m-sec ai-sec">
        <h3>${esc(s.sub)}</h3>
        <p class="m-desc">${esc(s.desc)}</p>
        <ul class="ai-points">${s.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <a class="m-shot" href="samples/${s.id}.html" target="_blank" rel="noopener"><img src="assets/ai/${s.id}.jpg" alt="${esc(s.title)}の見本の画面"></a>
        <div class="m-actions">
          <a class="btn" href="samples/${s.id}.html" target="_blank" rel="noopener">見本を開く</a>
          ${s.id === "gas" ? `<a class="btn btn-ghost" href="samples/inquiry-automation.gs" download>コードをダウンロード</a>` : ""}
          <small>依頼主は架空の会社です。AIで下書きし、人が確認して仕上げる流れを想定しています。</small>
        </div>
      </section>`;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $(".modal-panel").scrollTop = 0;
    $(".modal-close").focus();
  }

  function closeModal(fromRoute) {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    if (!fromRoute) history.pushState(null, "", "#works");
    lastFocus?.focus?.();
  }

  modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") closeModal();
    const docSec = modal.querySelector('[data-sec="doc"]');
    const docOpen = docSec && !docSec.hidden;
    if (docOpen && e.key === "ArrowRight") modal._goPage(docPage + 1);
    if (docOpen && e.key === "ArrowLeft") modal._goPage(docPage - 1);
  });

  // #w/<slug>/<tab> で詳細を開く（クラウドワークスから作品ごとにリンクできるように）
  function route() {
    const m = location.hash.match(/^#w\/([\w-]+)(?:\/(\w+))?/);
    const a = location.hash.match(/^#ai\/([\w-]+)/);
    if (m) openModal(m[1], m[2]);
    else if (a) openAi(a[1]);
    else closeModal(true);
  }
  window.addEventListener("hashchange", route);

  renderSet();
  renderChips();
  renderGrid();
  route();
})();
