/* ============================================================
   ROUTINE — interactions
   Doctrine: motion informs. Terminal, not circus.
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Kinetic type: split hero title into letters ---------- */
  const hero = document.querySelector(".hero");
  if (!reduceMotion) {
    let chIndex = 0;
    document.querySelectorAll(".hero__title .line > span").forEach((lineSpan) => {
      const nodes = Array.from(lineSpan.childNodes);
      lineSpan.textContent = "";
      for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          for (const char of node.textContent) {
            if (char === " ") { lineSpan.appendChild(document.createTextNode(" ")); continue; }
            const s = document.createElement("span");
            s.className = "ch";
            s.textContent = char;
            s.style.transitionDelay = chIndex * 16 + "ms";
            lineSpan.appendChild(s);
            chIndex++;
          }
        } else {
          const s = document.createElement("span");
          s.className = "ch";
          s.style.transitionDelay = chIndex * 16 + "ms";
          s.appendChild(node);
          lineSpan.appendChild(s);
          chIndex++;
        }
      }
    });
  }
  requestAnimationFrame(() => hero && hero.classList.add("loaded"));

  /* ---------- Kinetic type: section titles reveal per word ---------- */
  const plainTitles = Array.from(document.querySelectorAll(".section__title"))
    .filter((t) => t.children.length === 0);
  if (!reduceMotion && "IntersectionObserver" in window) {
    plainTitles.forEach((t) => {
      const words = t.textContent.split(" ");
      t.textContent = "";
      words.forEach((w, i) => {
        const mask = document.createElement("span");
        mask.className = "wmask";
        const inner = document.createElement("span");
        inner.textContent = w;
        inner.style.transitionDelay = i * 70 + "ms";
        mask.appendChild(inner);
        t.appendChild(mask);
        if (i < words.length - 1) t.appendChild(document.createTextNode(" "));
      });
    });
    const wordsIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("words-in");
          wordsIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.6 });
    plainTitles.forEach((t) => wordsIO.observe(t));
  }

  /* ---------- Footer wordmark: letters react to hover ---------- */
  const wordmark = document.querySelector(".footer__wordmark");
  if (wordmark && finePointerEarly()) {
    const nodes = Array.from(wordmark.childNodes);
    wordmark.textContent = "";
    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        for (const char of node.textContent) {
          const s = document.createElement("span");
          s.className = "ch";
          s.textContent = char;
          wordmark.appendChild(s);
        }
      } else {
        wordmark.appendChild(node);
      }
    }
  }
  function finePointerEarly() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
           !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Meta bar + reading progress ---------- */
  const meta = document.getElementById("meta");
  const progress = document.querySelector("[data-progress]");
  const onScroll = () => {
    meta.classList.toggle("scrolled", window.scrollY > 24);
    if (progress) {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Theme: light default, persisted ---------- */
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");
  const applyTheme = (theme) => {
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    toggle.textContent = theme === "dark" ? "[ light ]" : "[ dark ]";
  };
  applyTheme(localStorage.getItem("rt-theme") || "light");
  toggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("rt-theme", next);
  });

  /* ---------- Scramble / decode ---------- */
  const GLYPHS = "!<>-_\\/[]{}=+*^?#·→";
  function scramble(el, duration = 600) {
    if (reduceMotion) return;
    const original = el.dataset.original || el.textContent;
    el.dataset.original = original;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const settled = Math.floor(original.length * p);
      let out = original.slice(0, settled);
      for (let i = settled; i < original.length; i++) {
        out += original[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = original;
    };
    requestAnimationFrame(step);
  }
  const scrambleIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          scramble(e.target, 700);
          scrambleIO.unobserve(e.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll("[data-scramble-in]").forEach((el) => scrambleIO.observe(el));
  document.querySelectorAll("[data-scramble]").forEach((el) => {
    let busy = false;
    el.addEventListener("mouseenter", () => {
      if (busy) return;
      busy = true;
      scramble(el, 400);
      setTimeout(() => (busy = false), 450);
    });
  });
  // card indexes decode on card hover
  document.querySelectorAll(".card").forEach((card) => {
    const idx = card.querySelector(".card__idx");
    if (!idx) return;
    let busy = false;
    card.addEventListener("mouseenter", () => {
      if (busy) return;
      busy = true;
      scramble(idx, 350);
      setTimeout(() => (busy = false), 400);
    });
  });

  /* ---------- Stat counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10) || 0;
        if (reduceMotion) {
          el.textContent = target;
        } else {
          const duration = 900;
          const start = performance.now();
          const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
        countIO.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((el) => countIO.observe(el));

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq__q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq__item");
      const open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      btn.querySelector(".faq__icon").innerHTML = open ? "&#8722;" : "+";
    });
  });

  /* ---------- Moscow clock ---------- */
  const clockEls = document.querySelectorAll("[data-clock]");
  const fmt = new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", hour: "2-digit", minute: "2-digit" });
  const tickClock = () => clockEls.forEach((el) => (el.textContent = fmt.format(new Date())));
  tickClock();
  setInterval(tickClock, 15000);

  /* ---------- Back to top ---------- */
  const toTop = document.getElementById("toTop");
  if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  /* ---------- Custom cursor ---------- */
  if (finePointer && !reduceMotion) {
    const cursor = document.querySelector("[data-cursor]");
    document.body.classList.add("has-cursor");
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function render() {
      cx += (mx - cx) * 0.3;
      cy += (my - cy) * 0.3;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(render);
    })();
    document.querySelectorAll("[data-hover]").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
    document.addEventListener("mouseleave", () => (cursor.style.opacity = "0"));
    document.addEventListener("mouseenter", () => (cursor.style.opacity = "1"));
  }

  /* ============================================================
     Chat demo — the hero: agent answers live, loops forever
     ============================================================ */
  const chatBody = document.querySelector("[data-chat-body]");
  const chatMeta = document.querySelector("[data-chat-meta]");
  if (chatBody) {
    const SCRIPT = [
      { who: "user", text: "Здравствуйте! Оплатила курс, а доступ не пришёл. Заказ №4821" },
      { who: "agent", text: "Проверила заказ №4821: оплата прошла в 14:02, письмо ушло на p***@gmail.com. Продублировала ссылку сюда — проверьте «Промоакции»." },
      { who: "user", text: "Нашла, спасибо!" },
      { who: "agent", text: "Отлично. Доступ активен 365 дней. Я тут 24/7 — хорошего обучения!" },
    ];
    const FINAL_META = "[закрыто без оператора — 47 сек — CSAT 5/5]";
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    function addMsg(who) {
      const div = document.createElement("div");
      div.className = "msg msg--" + who;
      if (who === "agent") {
        const tag = document.createElement("span");
        tag.className = "msg__tag";
        tag.textContent = "routine-agent";
        div.appendChild(tag);
      }
      const span = document.createElement("span");
      span.className = "msg__text";
      div.appendChild(span);
      chatBody.appendChild(div);
      requestAnimationFrame(() => div.classList.add("in"));
      chatBody.scrollTop = chatBody.scrollHeight;
      return { div, span };
    }

    async function typeInto(span, text) {
      if (reduceMotion) { span.textContent = text; return; }
      const caret = document.createElement("i");
      caret.className = "chat__caret";
      span.after(caret);
      for (let i = 0; i <= text.length; i++) {
        span.textContent = text.slice(0, i);
        chatBody.scrollTop = chatBody.scrollHeight;
        await wait(14 + Math.random() * 22);
      }
      caret.remove();
    }

    async function playLoop() {
      for (;;) {
        chatBody.innerHTML = "";
        chatMeta.textContent = "";
        await wait(600);
        for (const m of SCRIPT) {
          if (m.who === "user") {
            const { span } = addMsg("user");
            span.textContent = m.text;
            await wait(reduceMotion ? 300 : 1100);
          } else {
            const t = addMsg("agent");
            const typing = document.createElement("span");
            typing.className = "msg--typing";
            typing.textContent = "· · ·";
            t.span.appendChild(typing);
            await wait(reduceMotion ? 200 : 900);
            t.span.textContent = "";
            await typeInto(t.span, m.text);
            await wait(reduceMotion ? 300 : 700);
          }
        }
        chatMeta.textContent = FINAL_META;
        await wait(4200);
      }
    }

    const chatIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          chatIO.unobserve(chatBody);
          playLoop();
        }
      });
    }, { threshold: 0.3 });
    chatIO.observe(chatBody);
  }

  /* ============================================================
     Hero dot field — square grid, ambient wave + cursor ripple
     ============================================================ */
  const field = document.getElementById("field");
  if (field && !reduceMotion) {
    const ctx = field.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const GAP = 30;          // grid spacing at the centre (css px)
    const DOT = 2.7;         // base dot size
    // concave cylindrical screen wrapping the viewer
    const PHI = 1.16;        // horizontal half-FOV — sides foreshorten
    const SIN_P = Math.sin(PHI);
    const BOW = 0.5;        // vertical spread at the sides → the arced silhouette
    const PANEL = 0.58;      // panel height as a share of the field, before bowing
    let W = 0, H = 0, cols = 0, rows = 0;
    let colors = { dot: "#5F5E5A", accent: "#FF4A1C" };
    let mx = -9999, my = -9999, active = false;
    let running = true;
    const R = 150;           // cursor influence radius
    let safeRects = [];      // areas where text lives — no dots drawn there

    function readColors() {
      const cs = getComputedStyle(document.documentElement);
      colors.dot = cs.getPropertyValue("--fg-muted").trim() || "#5F5E5A";
      colors.accent = cs.getPropertyValue("--accent").trim() || "#FF4A1C";
    }
    // text zones are punched out of the grid so copy stays crisp
    function measureSafeRects() {
      const fr = field.getBoundingClientRect();
      const pad = 14;
      const sel = ".hero__meta, .hero__title, .hero__lede, .hero__ctas, .chat, .proof";
      safeRects = Array.from(document.querySelectorAll(sel)).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          x1: r.left - fr.left - pad,
          y1: r.top - fr.top - pad,
          x2: r.right - fr.left + pad,
          y2: r.bottom - fr.top + pad,
        };
      });
    }
    function inSafeRect(x, y) {
      for (let i = 0; i < safeRects.length; i++) {
        const s = safeRects[i];
        if (x > s.x1 && x < s.x2 && y > s.y1 && y < s.y2) return true;
      }
      return false;
    }

    function resize() {
      const r = field.getBoundingClientRect();
      W = r.width; H = r.height;
      field.width = W * dpr; field.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // overscan the grid so bent edge dots still cover the rim
      // column count chosen so centre spacing lands on GAP after foreshortening
      cols = Math.max(24, Math.round((W * PHI) / (GAP * SIN_P)));
      rows = Math.max(8, Math.round((PANEL * H) / GAP));
      measureSafeRects();
    }
    readColors();
    resize();
    window.addEventListener("resize", resize, { passive: true });
    // re-measure as fonts settle and the chat demo grows
    setTimeout(measureSafeRects, 400);
    setTimeout(measureSafeRects, 1600);
    setInterval(measureSafeRects, 2000);

    window.addEventListener("mousemove", (e) => {
      const r = field.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      active = my > -R && my < H + R;
    }, { passive: true });
    document.addEventListener("mouseleave", () => { active = false; mx = my = -9999; });

    // theme toggle should refresh colors
    const themeBtn = document.getElementById("themeToggle");
    if (themeBtn) themeBtn.addEventListener("click", () => setTimeout(readColors, 10));

    let t = 0;
    function draw() {
      if (!running) return;
      t += 0.02;
      ctx.clearRect(0, 0, W, H);

      const cxc = W / 2, cyc = H / 2;
      const halfPanel = (PANEL * H) / 2;

      for (let gy = 0; gy <= rows; gy++) {
        // v: -1 top … +1 bottom of the panel
        const v = (gy / rows) * 2 - 1;

        for (let gx = 0; gx <= cols; gx++) {
          // u: -1 left … +1 right of the screen
          const u = (gx / cols) * 2 - 1;

          // --- concave cylinder: horizontal foreshortening toward the sides ---
          const x = cxc + (W / 2) * (Math.sin(u * PHI) / SIN_P);
          // --- the sides swing toward the viewer, so they magnify:
          //     rows spread apart there and the panel grows taller ---
          const spread = 1 + BOW * u * u;
          const y = cyc + halfPanel * v * spread;

          if (x < -GAP || x > W + GAP || y < -GAP || y > H + GAP) continue;

          const rn = Math.abs(u);           // 0 centre → 1 side
          // nearer surface = bigger, brighter dots at the edges
          const bend = 0.78 + 0.62 * rn * rn;

          // copy areas keep a whisper of texture and never get the ripple
          const behindText = inSafeRect(x, y);

          // ambient diagonal wave
          const wave = Math.sin(x * 0.015 + y * 0.02 + t);
          let size = DOT + wave * 0.9;
          let alpha = 0.56 + wave * 0.14;
          let accent = false;

          if (behindText) {
            alpha *= 0.22;
            size *= 0.8;
          } else if (active) {
            const dx = x - mx, dy = y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < R) {
              const f = 1 - dist / R;
              size += f * 4.5;
              alpha += f * 0.5;
              if (f > 0.6) accent = true;
            }
          }
          // sparse static accent nodes
          if (!accent && !behindText && (gx * 31 + gy * 17) % 41 === 0) accent = true;

          // the centre is the far wall, the edges are right in front of us
          alpha *= 0.72 + 0.5 * rn * rn;
          // soften the very top and bottom rows so the arcs read as edges, not cuts
          alpha *= 1 - Math.pow(Math.abs(v), 14) * 0.9;
          if (alpha <= 0.02) continue;

          ctx.globalAlpha = Math.min(alpha, 0.95);
          ctx.fillStyle = accent ? colors.accent : colors.dot;
          const s = Math.max(size * bend, 0.45);
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }

    const heroEl = document.querySelector(".hero");
    const fieldIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const was = running;
        running = e.isIntersecting;
        if (running && !was) requestAnimationFrame(draw);
      });
    }, { threshold: 0.02 });
    fieldIO.observe(heroEl);
    requestAnimationFrame(draw);
  }
})();
