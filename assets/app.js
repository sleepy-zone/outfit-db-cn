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
  var LIB = "outfit";
  var track = function (name, params) {
    try {
      if (window.track) window.track(name, Object.assign({ lib: LIB }, params || {}));
    } catch (e) { /* 埋点不能影响主流程 */ }
  };

  /* ---------------- state ---------------- */
  var state = { family: "all", author: "all", q: "" };
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

    var authors = DB.authors || [];
    if (authors.length > 1) {
      var arow = el("div", "author-row");
      arow.appendChild(el("span", "author-label", "作者"));
      var mkBtn = function (key, label, n, on) {
        var b = el("button", "author-chip" + (on ? " on" : ""));
        b.type = "button";
        b.dataset.author = key;
        b.innerHTML = esc(label) + "<i>" + n + "</i>";
        b.addEventListener("click", function () {
          state.author = key;
          track("filter", { type: "author", value: key === "all" ? "all" : label });
          renderToolbar();
          renderGrid();
        });
        return b;
      };
      arow.appendChild(mkBtn("all", "全部", ITEMS.length, state.author === "all"));
      authors.forEach(function (a) {
        arow.appendChild(mkBtn(a.key, a.name, a.n, state.author === a.key));
      });
      bar.appendChild(arow);
    }

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
        if (state.q.length > 1) track("search", { q: state.q.slice(0, 40) });
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
      it.num, it.name, it.nameZh, it.formula, it.formulaZh, it.family, it.author,
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
      if (state.author !== "all" && it.author !== state.author) return false;
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
      var ph = el("div", it.author === "sqz" ? "ph ph-wide" : "ph");
      var img = document.createElement("img");
      img.loading = "lazy";
      img.alt = it.nameZh + " · " + it.name;
      img.src = it.board;
      ph.appendChild(img);
      // ChiHAL 的规格板上本来就印着 No.xxx，卡片上不再重复打标；SQZ 的 CODE 保留便于检索
      if (it.author === "sqz") ph.appendChild(el("span", "badge", "SQZ·" + it.num));
      ph.appendChild(el("span", "famtag", esc(it.family)));

      card.appendChild(ph);

      var meta = el("div", "meta");
      meta.appendChild(el("h3", null, esc(it.nameZh)));
      meta.appendChild(el("p", "en", esc(it.name) + " · " + (it.author === "sqz" ? "SQZ" : "ChiHAL")));
      var tg = el("div", "tg");
      (it.tags || []).forEach(function (t) {
        tg.appendChild(el("span", "tagchip", esc(t)));
      });
      (it.styles || [])
        .filter(function (s) { return (it.tags || []).indexOf(s) < 0; })
        .slice(0, 2)
        .forEach(function (s) {
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
    $("#msub").textContent = (it.author === "sqz" ? "SQZ·" : "No.") + it.num + " · " + it.name + " · " + it.date;
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
    var authorMeta = (DB.authors || []).find(function (a) { return a.key === it.author; });
    if (authorMeta) {
      addRow("作者", '<a href="' + authorMeta.url + '" target="_blank" rel="noopener">' + esc(authorMeta.name) + " " + esc(authorMeta.handle) + " ↗</a>");
    }
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
        track("copy", { type: "section", label: s.k, id: it.num });
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
    track("item_open", { id: it.num, label: it.nameZh, value: it.family });
    track("image_view", { id: it.num, type: "board", value: "规格板" });
    if (history.replaceState) history.replaceState(null, "", "#" + it.num);
  }

  function setImg(i) {
    if (!cur) return;
    cur.idx = (i + cur.imgs.length) % cur.imgs.length;
    var kind = cur.idx === 0 ? "board" : "look";
    track("image_view", { id: cur.item.num, type: kind, value: kind === "board" ? "规格板" : "试穿" });
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
          track("download_click", { label: link.getAttribute("data-provider"), type: "image-pack" });
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
      track("copy", { type: "structured", id: cur.item.num });
    });
    $("#mcopyall").addEventListener("click", function () {
      if (!cur) return;
      copy(promptText(cur.item, false), this, "复制全部");
      track("copy", { type: "plain", id: cur.item.num });
    });
    $("#mformula").addEventListener("click", function () {
      if (!cur) return;
      copy(cur.item.formula + " / " + cur.item.formulaZh, this, "复制风格公式");
      track("copy", { type: "formula", id: cur.item.num });
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
    var authorTxt = (DB.authors || []).map(function (a) { return a.name + " " + a.n; }).join(" + ");
    $("#headStat").textContent =
      ITEMS.length + " 套（" + authorTxt + "）· " + (DB.families || []).length + " 类风格 · " + secs + " 段提示词";
    renderNav();
    renderToolbar();
    renderGrid();
    bind();
    track("lib_view", { label: "outfit-db-cn" });
    var h = location.hash.replace("#", "");
    if (h) {
      var hit = ITEMS.find(function (x) { return x.num === h || x.num.toUpperCase() === h.toUpperCase(); });
      if (hit) open(hit, 0);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
