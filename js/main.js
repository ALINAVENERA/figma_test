/* ============================================================
   ROUTINE — interactions
   Motion doctrine: informs, not delights. 200ms, ease-out.
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Hero load reveal ---------- */
  const hero = document.querySelector(".hero");
  requestAnimationFrame(() => hero && hero.classList.add("loaded"));

  /* ---------- Reveal on scroll: 12px fade-up ---------- */
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
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Meta bar: rule appears on scroll ---------- */
  const meta = document.getElementById("meta");
  const onScroll = () => meta.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Theme toggle: light is default, persisted ---------- */
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
            const eased = 1 - Math.pow(1 - p, 3); /* cubic ease-out */
            el.textContent = Math.round(target * eased);
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

  /* ---------- Moscow clock ---------- */
  const clockEls = document.querySelectorAll("[data-clock]");
  const fmt = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
  });
  const tickClock = () => {
    const t = fmt.format(new Date());
    clockEls.forEach((el) => (el.textContent = t));
  };
  tickClock();
  setInterval(tickClock, 15000);

  /* ---------- Back to top ---------- */
  const toTop = document.getElementById("toTop");
  if (toTop) {
    toTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
    );
  }

  /* ---------- Custom cursor: ink square with slight lerp ---------- */
  if (finePointer && !reduceMotion) {
    const cursor = document.querySelector("[data-cursor]");
    document.body.classList.add("has-cursor");

    let mx = innerWidth / 2, my = innerHeight / 2;
    let cx = mx, cy = my;

    addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

    const render = () => {
      cx += (mx - cx) * 0.3;
      cy += (my - cy) * 0.3;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(render);
    };
    render();

    document.querySelectorAll("[data-hover]").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });

    document.addEventListener("mouseleave", () => (cursor.style.opacity = "0"));
    document.addEventListener("mouseenter", () => (cursor.style.opacity = "1"));
  }
})();
