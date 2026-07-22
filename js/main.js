/* ============================================================
   STUDIO NOX — interactions
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
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Meta bar scrolled state ---------- */
  const meta = document.getElementById("meta");
  const onScroll = () => meta.classList.toggle("scrolled", window.scrollY > 30);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Live Berlin clock ---------- */
  const clockEls = document.querySelectorAll("[data-clock]");
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const tick = () => {
    const t = fmt.format(new Date());
    clockEls.forEach((el) => (el.textContent = t));
  };
  tick();
  setInterval(tick, 15000);

  /* ---------- Back to top ---------- */
  const toTop = document.getElementById("toTop");
  if (toTop) {
    toTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
    );
  }

  /* ---------- Custom cursor (fine pointer only) ---------- */
  if (finePointer && !reduceMotion) {
    const cursor = document.querySelector("[data-cursor]");
    const label = document.querySelector("[data-cursor-label]");
    document.body.classList.add("has-cursor");

    let mx = window.innerWidth / 2,
      my = window.innerHeight / 2;
    let cx = mx,
      cy = my;

    window.addEventListener(
      "mousemove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
      },
      { passive: true }
    );

    const render = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(render);
    };
    render();

    // Hover growth + optional label
    document.querySelectorAll("[data-hover]").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursor.classList.add("is-hover");
        const text = el.getAttribute("data-cursor-text");
        if (label) label.textContent = text || "";
      });
      el.addEventListener("mouseleave", () => {
        cursor.classList.remove("is-hover");
        if (label) label.textContent = "";
      });
    });

    // Hide when leaving the window
    document.addEventListener("mouseleave", () => (cursor.style.opacity = "0"));
    document.addEventListener("mouseenter", () => (cursor.style.opacity = "1"));
  }

  /* ---------- Magnetic elements ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 0.35;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }
})();
