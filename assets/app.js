/* outfit-db-cn · app
   纯前端，无依赖。数据来自 data.js 的 window.OUTFIT_DB。 */
(function () {
  var DB = window.OUTFIT_DB || { items: [], families: [] };
  var ITEMS = DB.items || [];
  var $ = function (s) { return document.querySelector(s); };
  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };
  var track = function (name, params) { if (window.track) window.track(name, params); };

  /* ---------------- state ---------------- */
  var state = { family: "all", q: "" };
  var activeList = [];
  var cur = null; // { item, imgs:[{src,type}], idx }

  /* ---------------- nav ---------------- */
  function renderNav() {
    var nav = $("#nav");
    nav.innerHTML = "";
    var btn = el("button", "on");
    btn.innerHTML = "全部<i>" + ITEMS.length + "</i>";
    btn.dataset.family = "all";
    nav.appendChild(btn);
    (DB.families || []).forEach(function (f) {
      var b = el("button");
      b.innerHTML = esc(f.k) + "<i>" + f.n + "</i>";
      b.dataset.family = f.k;
      nav.appendChild(b);
    });
    nav.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-family]");
      if (!b) return;
      state.family = b.dataset.family;
      [].forEach.call(nav.querySelectorAll("button"), function (x) {
        x.classList.toggle("on", x === b);
      });
      track("filter", { type: "family", value: state.family });
      renderGrid();
    });
  }

  /* ---------------- toolbar ---------------- */
  function renderToolbar() {
    var bar = $("#toolbar");
    bar.innerHTML = "";
    var row = el("div", "row");
    var input = document.createElement("input");
    input.id = "q";
    input.type = "search";
    input.placeholder = "搜风格 / 单品 / 颜色，例如：芭蕾核、马甲、撞色、lace、Y2K";
    input.value = state.q;
    var rnd = el("button", "rndbtn", "随机一套");
    rnd.id = "rnd";
    var count = el("span");
    count.id = "count";
    row.appendChild(input);
    row.appendChild(rnd);
    row.appendChild(count);
    bar.appendChild(row);

    var t = null;
    input.addEventListener("input", function () {
      state.q = input.value.trim();
      clearTimeout(t);
      t = setTimeout(function () {
        renderGrid();
        if (state.q.length > 1) track("search", { value: state.q });
      }, 120);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && activeList.length) open(activeList[0], 0);
    });
    rnd.addEventListener("click", function () {
      if (!activeList.length) return;
      open(activeList[Math.floor(Math.random() * activeList.length)], 0);
      track("random", {});
    });
  }

  /* ---------------- grid ---------------- */
  function matches(it, q) {
    if (!q) return true;
    var hay = [
      it.num, it.name, it.nameZh, it.formula, it.formulaZh, it.family,
      (it.styles || []).join(" "), (it.pieces || []).join(" "), it.items, it.note, it.use,
      (it.colors || []).map(function (c) { return c.n; }).join(" "),
      (it.sections || []).map(function (s) { return s.k + " " + s.t; }).join(" "),
    ].join(" ").toLowerCase();
    return q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
  }

  function renderGrid() {
    var grid = $("#grid");
    grid.innerHTML = "";
    activeList = ITEMS.filter(function (it) {
      if (state.family !== "all" && it.family !== state.family) return false;
      return matches(it, state.q);
    });
    $("#count").textContent = activeList.length + " / " + ITEMS.length + " 套";

    if (!activeList.length) {
      grid.appendChild(el("div", "empty", "没有匹配的条目，换个词试试（可以搜中文、英文或风格名）"));
      return;
    }

    activeList.forEach(function (it) {
      var card = el("article", "card");
      card.tabIndex = 0;
      var ph = el("div", "ph");
      var img = document.createElement("img");
      img.loading = "lazy";
      img.alt = it.nameZh + " · " + it.name;
      img.src = it.board;
      ph.appendChild(img);
      ph.appendChild(el("span", "badge", "No." + it.num));
      ph.appendChild(el("span", "famtag", esc(it.family)));
      card.appendChild(ph);

      var meta = el("div", "meta");
      meta.appendChild(el("h3", null, esc(it.nameZh)));
      meta.appendChild(el("p", "en", esc(it.name)));
      var tg = el("div", "tg");
      (it.styles || []).slice(0, 2).forEach(function (s) {
        tg.appendChild(el("span", null, esc(s)));
      });
      meta.insertBefore(tg, null);
      var dots = el("div", "dots");
      (it.colors || []).slice(0, 4).forEach(function (c) {
        var i = document.createElement("i");
        i.style.background = c.hex;
        i.title = c.n;
        dots.appendChild(i);
      });
      dots.appendChild(el("em", null, esc((it.colors || [])[0] ? it.colors[0].n : "")));
      meta.appendChild(dots);
      card.appendChild(meta);

      card.addEventListener("click", function () { open(it, 0); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(it, 0); }
      });
      grid.appendChild(card);
    });
  }

  /* ---------------- modal ---------------- */
  function promptText(it, withHeaders) {
    return (it.sections || []).map(function (s) {
      return withHeaders ? "【" + s.k + "】\n" + s.t : s.t;
    }).join("\n\n");
  }

  function open(it, imgIdx) {
    cur = { item: it, idx: imgIdx || 0 };
    var imgs = [{ src: it.preview, type: "规格板" }].concat(
      (it.looksPreview || []).map(function (p, i) { return { src: p, type: "试穿 " + (i + 1) }; })
    );
    cur.imgs = imgs;

    $("#mtitle").textContent = it.nameZh;
    $("#msub").textContent = "No." + it.num + " · " + it.name + " · " + it.date;
    $("#mimg").src = imgs[cur.idx].src;
    $("#mimg").alt = it.nameZh;

    var f = $("#mfields");
    f.innerHTML = "";
    var addRow = function (k, v) {
      var dt = document.createElement("dt");
      dt.textContent = k;
      var dd = document.createElement("dd");
      dd.innerHTML = v;
      f.appendChild(dt); f.appendChild(dd);
    };
    addRow("风格", esc(it.formulaZh) + '<br><span style="color:#807d72;font-size:11.5px;font-family:var(--mono)">' + esc(it.formula) + "</span>");
    addRow("品类", (it.pieces || []).map(function (p) { return '<span class="chip">' + esc(p) + "</span>"; }).join(" "));
    addRow("配色", (it.colors || []).map(function (c) {
      return '<span class="chip" style="display:inline-flex;align-items:center;gap:5px"><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + c.hex + ';border:1px solid rgba(0,0,0,.12)"></i>' + esc(c.n) + "</span>";
    }).join(" "));
    addRow("单品", esc(it.items));

    $("#mnote").textContent = it.note;
    $("#muse").textContent = it.use;
    $("#mpost").href = it.post;

    var p = $("#mprompt");
    p.innerHTML = "";
    (it.sections || []).forEach(function (s, i) {
      var box = el("div", "psec");
      var head = el("div", "psec-h");
      head.appendChild(el("b", null, esc(s.k)));
      head.appendChild(el("span", "n", s.t.length + " 字"));
      var btn = el("button", "mini-copy", "复制");
      btn.type = "button";
      btn.addEventListener("click", function () {
        copy(s.t, btn, "复制");
        track("copy", { type: "section", value: it.num + ":" + s.k });
      });
      head.appendChild(btn);
      box.appendChild(head);
      box.appendChild(el("div", "psec-b", esc(s.t)));
      p.appendChild(box);
    });

    // thumbnails
    var th = $("#mthumbs");
    th.innerHTML = "";
    imgs.forEach(function (im, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.title = im.type;
      b.className = i === cur.idx ? "on" : "";
      var t = document.createElement("img");
      t.src = im.src;
      t.alt = im.type;
      t.loading = "lazy";
      b.appendChild(t);
      b.addEventListener("click", function () { setImg(i); });
      th.appendChild(b);
    });

    $("#modal").classList.add("on");
    document.body.style.overflow = "hidden";
    $("#mclose").focus();
    track("item_open", { id: it.num, value: it.name, label: it.family });
    if (history.replaceState) history.replaceState(null, "", "#" + it.num);
  }

  function setImg(i) {
    if (!cur) return;
    cur.idx = (i + cur.imgs.length) % cur.imgs.length;
    $("#mimg").src = cur.imgs[cur.idx].src;
    [].forEach.call(document.querySelectorAll("#mthumbs button"), function (b, k) {
      b.classList.toggle("on", k === cur.idx);
    });
  }

  function close() {
    $("#modal").classList.remove("on");
    document.body.style.overflow = "";
    cur = null;
    if (history.replaceState) history.replaceState(null, "", location.pathname);
  }

  function copy(text, btn, label) {
    var done = function () {
      if (!btn) return;
      var old = btn.textContent;
      btn.textContent = "已复制";
      btn.classList.add("copied");
      setTimeout(function () { btn.textContent = label || old; btn.classList.remove("copied"); }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
    } else {
      fallback(text, done);
    }
  }
  function fallback(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { alert("复制失败，请手动选择文本"); }
    document.body.removeChild(ta);
  }

  /* ---------------- events ---------------- */
  function setDownloadOpen(open) {
    var btn = $("#dlBtn"), panel = $("#dlPanel");
    if (!btn || !panel) return;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    panel.hidden = !open;
    if (open) track("download_open", { label: "image-pack" });
  }

  function bind() {
    var dlBtn = $("#dlBtn"), dlPanel = $("#dlPanel");
    if (dlBtn && dlPanel) {
      dlBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        setDownloadOpen(dlPanel.hidden);
      });
      document.addEventListener("click", function (e) {
        if (!dlPanel.hidden && !$("#dl").contains(e.target)) setDownloadOpen(false);
      });
      [].forEach.call(dlPanel.querySelectorAll("[data-provider]"), function (link) {
        link.addEventListener("click", function () {
          track("download_click", { provider: link.getAttribute("data-provider"), label: "image-pack" });
          setDownloadOpen(false);
        });
      });
    }
    $("#mclose").addEventListener("click", close);
    $("#modal").addEventListener("click", function (e) {
      if (e.target.id === "modal") close();
    });
    $("#mprev").addEventListener("click", function () { setImg(cur.idx - 1); });
    $("#mnext").addEventListener("click", function () { setImg(cur.idx + 1); });
    $("#mcopy").addEventListener("click", function () {
      if (!cur) return;
      copy(promptText(cur.item, true), this, "复制整套结构（带分栏标题）");
      track("copy", { type: "all", value: cur.item.num });
    });
    $("#mcopyall").addEventListener("click", function () {
      if (!cur) return;
      copy(promptText(cur.item, false), this, "复制全部");
      track("copy", { type: "plain", value: cur.item.num });
    });
    $("#mformula").addEventListener("click", function () {
      if (!cur) return;
      copy(cur.item.formula + " / " + cur.item.formulaZh, this, "复制风格公式");
      track("copy", { type: "formula", value: cur.item.num });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        var panel = $("#dlPanel");
        if (panel && !panel.hidden) { setDownloadOpen(false); return; }
      }
      if (!$("#modal").classList.contains("on")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") setImg(cur.idx - 1);
      if (e.key === "ArrowRight") setImg(cur.idx + 1);
    });
    var tips = $("#tipsTrigger");
    tips.addEventListener("click", function () {
      var p = $("#tipsPanel");
      var openNow = p.style.display === "block";
      p.style.display = openNow ? "" : "block";
      tips.setAttribute("aria-expanded", String(!openNow));
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest("#tipsHover")) {
        $("#tipsPanel").style.display = "";
        $("#tipsTrigger").setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    if (!ITEMS.length) {
      $("#grid").innerHTML = '<div class="empty">数据没加载出来：请确认 data.js 与 index.html 在同一目录。</div>';
      return;
    }
    var secs = ITEMS.reduce(function (n, x) { return n + (x.sections || []).length; }, 0);
    var imgs = ITEMS.reduce(function (n, x) { return n + 1 + (x.looks || []).length; }, 0);
    var dlStat = document.getElementById("dlStat");
    if (dlStat) dlStat.textContent = ITEMS.length + " 套 / " + imgs + " 张原图";
    var dlSub = document.getElementById("dlSub");
    if (dlSub) dlSub.textContent = ITEMS.length + " 套原图 + 提示词";
    var dlHead = document.getElementById("dlHead");
    if (dlHead) dlHead.textContent = ITEMS.length + " 套 / " + imgs + " 张原图 + 分栏提示词";
    $("#headStat").textContent =
      "ChiHAL 精选 " + ITEMS.length + " 套 · " + (DB.families || []).length + " 类风格 · " + secs + " 段提示词";
    renderNav();
    renderToolbar();
    renderGrid();
    bind();
    var h = location.hash.replace("#", "");
    if (h) {
      var hit = ITEMS.find(function (x) { return x.num === h; });
      if (hit) open(hit, 0);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
