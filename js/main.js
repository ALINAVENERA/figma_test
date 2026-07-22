/* ============================================================
   ROUTINE — interactions
   Doctrine: motion informs. Terminal, not circus.
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Hero load reveal ---------- */
  const hero = document.querySelector(".hero");
  requestAnimationFrame(() => hero && hero.classList.add("loaded"));

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
})();
