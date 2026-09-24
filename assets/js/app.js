/* ═══════════════════════════════════════════════════════════
   فیگورا — تعامل‌های سایت
   ═══════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ── هدر چسبان ─────────────────────────────────────────── */
  const header = $("#siteHeader");
  const toTop  = $("#toTop");

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 24);
    toTop.classList.toggle("show", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );

  /* ── منوی موبایل ───────────────────────────────────────── */
  const menuToggle = $("#menuToggle");
  const mainNav    = $("#mainNav");

  const closeMenu = () => {
    mainNav.classList.remove("open");
    menuToggle.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  };
  menuToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    menuToggle.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  mainNav.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeMenu();
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".main-nav") && !e.target.closest(".menu-toggle")) closeMenu();
  });

  /* ── ظاهرشدن هنگام اسکرول ──────────────────────────────── */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en, i) => {
        if (en.isIntersecting) {
          en.target.style.transitionDelay = `${Math.min(i * 60, 240)}ms`;
          en.target.classList.add("in");
          revealIO.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => revealIO.observe(el));

  /* ── شمارنده‌های آمار (اعداد فارسی) ────────────────────── */
  const faNum = (n, dec = 0) =>
    Number(n).toLocaleString("fa-IR", {
      maximumFractionDigits: dec,
      minimumFractionDigits: dec,
    });

  const statIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el      = en.target;
        const target  = parseFloat(el.dataset.count);
        const dec     = parseInt(el.dataset.decimals || "0", 10);
        const suffix  = el.dataset.suffix || "";
        const t0      = performance.now();
        const dur     = 1600;

        const tick = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
          el.textContent = faNum(target * eased, dec) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        statIO.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  $$(".stat-num").forEach((el) => statIO.observe(el));

  /* ── توست ──────────────────────────────────────────────── */
  const toast = $("#toast");
  let toastTimer;
  const showToast = (msg, kind = "good") => {
    toast.textContent = msg;
    toast.className = `toast glass show ${kind}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3800);
  };

  /* ── فیلتر و جستجوی محصولات ────────────────────────────── */
  const chips    = $$(".chip[data-filter]");
  const cards    = $$(".product-card");
  const searchIn = $("#shopSearch");
  const emptyNote = $("#emptyNote");
  let activeFilter = "all";

  const applyFilters = () => {
    const q = (searchIn.value || "").trim().toLowerCase();
    let visible = 0;

    cards.forEach((card) => {
      const okCat = activeFilter === "all" || card.dataset.cat === activeFilter;
      const okQ   = !q || card.dataset.name.toLowerCase().includes(q);
      const show  = okCat && okQ;
      card.classList.toggle("is-hidden", !show);
      if (show) {
        visible++;
        card.style.animation = "none";
        card.offsetHeight; /* ری‌فلو برای ری‌استارت انیمیشن */
        card.style.animation = "popIn .5s cubic-bezier(.22,1,.36,1)";
      }
    });

    emptyNote.hidden = visible > 0;
  };

  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      activeFilter = chip.dataset.filter;
      applyFilters();
    })
  );
  searchIn.addEventListener("input", applyFilters);

  /* ── لایت‌باکس محصول ───────────────────────────────────── */
  const lightbox = $("#lightbox");
  const lbImg    = $("#lbImg");
  const lbTitle  = $("#lbTitle");
  const lbDesc   = $("#lbDesc");
  const lbCat    = $("#lbCat");
  const lbPrice  = $("#lbPrice");
  const lbOrder  = $("#lbOrder");
  let lastFocus  = null;

  const openLightbox = (card) => {
    const media = $(".pc-media img", card);
    lbImg.src        = media.src.replace("/cards/", "/").replace(".jpg", ".jpg");
    lbImg.alt        = media.alt;
    lbTitle.textContent = $(".pc-title", card).textContent;
    lbDesc.textContent  = $(".pc-desc", card).textContent;
    lbCat.textContent   = $(".pc-cat", card).textContent;
    lbPrice.innerHTML   = $(".pc-price", card).innerHTML;
    lbOrder.dataset.item = $(".pc-title", card).textContent;

    lastFocus = document.activeElement;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    $(".lightbox-close", lightbox).focus();
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  };

  cards.forEach((card) => {
    $(".pc-zoom", card).addEventListener("click", () => openLightbox(card));
    $(".pc-media img", card).addEventListener("click", () => openLightbox(card));
  });
  lightbox.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
  });

  /* ── سفارش: پرکردن فرم + اسکرول ────────────────────────── */
  const orderForm = $("#orderForm");
  const descField = orderForm.querySelector('textarea[name="desc"]');

  const orderItem = (itemName) => {
    orderForm.querySelector('select[name="type"]').value = "existing";
    descField.value = `سلام! می‌خواهم فیگور «${itemName}» را سفارش دهم. لطفاً برای هماهنگی ارسال و پرداخت تماس بگیرید. 🙏`;
    closeLightbox();
    $("#order").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => orderForm.querySelector('input[name="name"]').focus({ preventScroll: true }), 700);
    showToast(`فیگور «${itemName}» به فرم سفارش اضافه شد ✨`);
  };

  $$(".btn-order").forEach((btn) =>
    btn.addEventListener("click", () => orderItem(btn.dataset.item))
  );
  lbOrder.addEventListener("click", () => orderItem(lbOrder.dataset.item));

  /* ── ارسال فرم (نمایشی) ────────────────────────────────── */
  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name    = orderForm.elements.name;
    const contact = orderForm.elements.contact;
    let ok = true;

    [name, contact].forEach((input) => {
      const empty = !input.value.trim();
      input.closest(".field").classList.toggle("has-error", empty);
      if (empty) ok = false;
    });

    if (!ok) {
      showToast("لطفاً نام و راه ارتباطی‌ات را پر کن 🙏", "bad");
      return;
    }

    const firstName = name.value.trim().split(/\s+/)[0];
    showToast(`${firstName} جان، درخواستت ثبت شد! تا ۲۴ ساعت آینده باهات تماس می‌گیریم ✨`);
    orderForm.reset();
  });
  orderForm.addEventListener("input", (e) => {
    if (e.target.matches("input, textarea")) e.target.closest(".field").classList.remove("has-error");
  });

  /* ── افکت تیلت سه‌بعدی شیشه ────────────────────────────── */
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (canHover) {
    $$("[data-tilt]").forEach((el) => {
      const strength = 7;
      el.addEventListener("mousemove", (e) => {
        const r  = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width  - 0.5;
        const py = (e.clientY - r.top)  / r.height - 0.5;
        el.style.transform =
          `perspective(900px) rotateY(${px * strength}deg) rotateX(${-py * strength}deg)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "perspective(900px) rotateY(0) rotateX(0)";
      });
    });
  }

  /* ── پارالاکس ملایم حباب‌های نور ───────────────────────── */
  if (canHover) {
    const blobs = $$(".blob");
    let raf = null;
    window.addEventListener("mousemove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const dx = e.clientX / window.innerWidth  - 0.5;
        const dy = e.clientY / window.innerHeight - 0.5;
        blobs.forEach((b, i) => {
          const f = (i + 1) * 12;
          b.style.marginLeft = `${dx * f}px`;
          b.style.marginTop  = `${dy * f}px`;
        });
        raf = null;
      });
    }, { passive: true });
  }
})();
