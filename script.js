document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("js-ready");

  const header = document.querySelector(".header");

  const getHeaderOffset = () => {
    const height = header?.offsetHeight || 0;
    return height + 12;
  };

  const smoothScrollToElement = (el) => {
    const rect = el.getBoundingClientRect();
    const targetY = window.scrollY + rect.top - getHeaderOffset();
    window.scrollTo({ top: Math.max(targetY, 0), behavior: "smooth" });
  };

  document.querySelectorAll(".nav-item").forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      smoothScrollToElement(target);
      history.replaceState(null, "", href);
    });
  });

  document.querySelectorAll('a.btn[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href) return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      smoothScrollToElement(target);
      history.replaceState(null, "", href);
    });
  });

  const sectionIds = ["home", "about", "gallery", "vote"];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  const navItems = Array.from(document.querySelectorAll(".nav-item"));

  const setActiveNav = (activeId) => {
    const hash = `#${activeId}`;
    navItems.forEach((item) => {
      item.classList.toggle("active", item.getAttribute("href") === hash);
    });
  };

  const updateActiveOnScroll = () => {
    if (!sections.length) return;

    const anchorY = window.scrollY + getHeaderOffset() + 1;
    let bestSection = sections[0];
    let bestDistance = Infinity;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;

      if (anchorY >= top && anchorY < bottom) {
        bestSection = section;
        bestDistance = 0;
        return;
      }

      const distance = Math.abs(anchorY - top);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSection = section;
      }
    });

    setActiveNav(bestSection.id);
  };

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    window.requestAnimationFrame(() => {
      updateActiveOnScroll();
      ticking = false;
    });
    ticking = true;
  });

  window.addEventListener("resize", updateActiveOnScroll);
  updateActiveOnScroll();

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setupAmbientFx = () => {
    const canvas = document.getElementById("fxCanvas");
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles = [];
    const DPR_CAP = 2;
    let width = 0;
    let height = 0;
    let rafId = 0;

    const rand = (min, max) => Math.random() * (max - min) + min;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = Math.max(24, Math.min(52, Math.floor((width * height) / 34000)));
      particles.length = 0;
      for (let i = 0; i < targetCount; i += 1) {
        particles.push({
          x: rand(0, width),
          y: rand(0, height),
          vx: rand(-0.2, 0.2),
          vy: rand(-0.14, 0.14),
          r: rand(1.3, 2.8),
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const maxDist = 145;
      const maxDistSq = maxDist * maxDist;

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        for (let j = i + 1; j < particles.length; j += 1) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > maxDistSq) continue;

          const alpha = 0.26 * (1 - d2 / maxDistSq);
          ctx.strokeStyle = `rgba(58, 104, 140, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        ctx.fillStyle = "rgba(49, 102, 142, 0.62)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (!document.hidden && !rafId) {
        draw();
      }
    });
  };

  setupAmbientFx();

  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));
  const revealCards = Array.from(document.querySelectorAll(".grid .card"));
  const markVisible = (el) => el.classList.add("is-visible");

  if (!prefersReducedMotion && (revealEls.length || revealCards.length)) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          markVisible(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { root: null, threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));
    revealCards.forEach((el) => observer.observe(el));
  } else {
    [...revealEls, ...revealCards].forEach(markVisible);
  }

  // Poster & Video section: keep links native to avoid JS display side effects.

});