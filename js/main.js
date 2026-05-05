/* ============================================================
   WCC LANGKAH BARU — Main JavaScript
   ============================================================ */

"use strict";

/* ── CUSTOM CURSOR ──────────────────────────────────────────── */
(function initCursor() {
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  if (!dot || !ring) return;

  let mouseX = 0,
    mouseY = 0;
  let ringX = 0,
    ringY = 0;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + "px";
    dot.style.top = mouseY + "px";
  });

  (function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + "px";
    ring.style.top = ringY + "px";
    requestAnimationFrame(animateRing);
  })();

  document
    .querySelectorAll("a, button, .service-card, .gallery-item, .testi-card")
    .forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("hovered"));
      el.addEventListener("mouseleave", () => ring.classList.remove("hovered"));
    });
})();

/* ── NAVBAR SCROLL ──────────────────────────────────────────── */
(function initNavbar() {
  const navbar = document.querySelector(".navbar");
  window.addEventListener(
    "scroll",
    () => {
      navbar.classList.toggle("scrolled", window.scrollY > 40);
    },
    { passive: true },
  );
})();

/* ── HAMBURGER MENU ─────────────────────────────────────────── */
(function initMobileMenu() {
  const btn = document.getElementById("hamburger");
  const menu = document.getElementById("mobileMenu");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => {
    btn.classList.toggle("open");
    menu.classList.toggle("open");
    document.body.style.overflow = menu.classList.contains("open")
      ? "hidden"
      : "";
  });

  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      btn.classList.remove("open");
      menu.classList.remove("open");
      document.body.style.overflow = "";
    });
  });
})();

/* ── SCROLL REVEAL ──────────────────────────────────────────── */
(function initReveal() {
  const els = document.querySelectorAll(
    ".reveal, .reveal-left, .reveal-right, .process-step",
  );
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add("visible");
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  els.forEach((el, i) => {
    if (el.classList.contains("process-step")) {
      el.dataset.delay = i * 150;
    }
    observer.observe(el);
  });
})();

/* ── COUNTER ANIMATION ──────────────────────────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll(".stat-number[data-target]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || "";
        const duration = 1800;
        const start = performance.now();

        function tick(now) {
          const elapsed = Math.min(now - start, duration);
          const progress = easeOut(elapsed / duration);
          const val =
            target < 10
              ? (progress * target).toFixed(1)
              : Math.round(progress * target);
          el.textContent = val + suffix;
          if (elapsed < duration) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    },
    { threshold: 0.5 },
  );

  counters.forEach((c) => observer.observe(c));

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }
})();

/* ── PACKAGE SELECTION ──────────────────────────────────────── */
const selectedPackage = { value: "" };

(function initPackageCards() {
  document.querySelectorAll(".card-cta[data-package]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const pkg = btn.dataset.package;
      selectedPackage.value = pkg;

      // Scroll to form and fill
      const form = document.getElementById("bookingForm");
      if (form) {
        const paketSelect = form.querySelector('[name="paket"]');
        if (paketSelect) {
          paketSelect.value = pkg;
          paketSelect.dispatchEvent(new Event("change"));
          // Flash effect
          paketSelect.style.borderColor = "var(--teal)";
          paketSelect.style.boxShadow = "0 0 0 3px var(--teal-dim)";
          setTimeout(() => {
            paketSelect.style.borderColor = "";
            paketSelect.style.boxShadow = "";
          }, 1500);
        }
        document
          .getElementById("booking")
          .scrollIntoView({ behavior: "smooth", block: "start" });
      }

      // Ripple effect
      createRipple(btn, e);
    });
  });
})();

/* ── RIPPLE EFFECT ──────────────────────────────────────────── */
function createRipple(el, e) {
  const rect = el.getBoundingClientRect();
  const ripple = document.createElement("span");
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  Object.assign(ripple.style, {
    position: "absolute",
    borderRadius: "50%",
    width: size + "px",
    height: size + "px",
    left: x + "px",
    top: y + "px",
    background: "rgba(255,255,255,0.2)",
    transform: "scale(0)",
    animation: "ripple-anim 0.6s ease-out forwards",
    pointerEvents: "none",
  });

  el.style.position = "relative";
  el.style.overflow = "hidden";
  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
}

// Inject ripple keyframes
(function () {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes ripple-anim {
      to { transform: scale(4); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
})();

/* ── BOOKING FORM ───────────────────────────────────────────── */
(function initBookingForm() {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector(".form-submit");
    const origText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<span style="display:inline-block;animation:spin 1s linear infinite">⏳</span> Menyimpan...';
    submitBtn.disabled = true;

    // Collect form data
    const data = {
      nama: form.nama.value.trim(),
      whatsapp: form.whatsapp.value.trim(),
      tanggal: form.tanggal.value,
      lokasi: form.lokasi.value.trim(),
      paket: form.paket.value,
      catatan: form.catatan.value.trim(),
    };

    // Validate
    if (
      !data.nama ||
      !data.whatsapp ||
      !data.tanggal ||
      !data.lokasi ||
      !data.paket
    ) {
      showToast(
        "error",
        "⚠️ Form Belum Lengkap",
        "Mohon isi semua kolom yang wajib diisi.",
      );
      submitBtn.innerHTML = origText;
      submitBtn.disabled = false;
      return;
    }

    // Validate WhatsApp number
    if (!/^(\+62|62|0)[0-9]{8,13}$/.test(data.whatsapp.replace(/\s/g, ""))) {
      showToast(
        "error",
        "⚠️ Nomor Tidak Valid",
        "Masukkan nomor WhatsApp yang valid (contoh: 0812xxxxxxxx)",
      );
      submitBtn.innerHTML = origText;
      submitBtn.disabled = false;
      return;
    }

    try {
      // Try to save to database
      let orderId = null;
      try {
        const res = await fetch("../php/submit_order.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (result.success) orderId = result.order_id;
      } catch (dbErr) {
        // If PHP not running, just redirect to WhatsApp directly
        console.warn("Database tidak tersedia, langsung ke WhatsApp:", dbErr);
      }

      // Build WhatsApp message
      const paketLabels = {
        silver: "Silver Package (250K)",
        gold: "Gold Package (300K)",
        premium: "Premium Package (400K)",
      };
      const waNumber = "6281532477237";
      const msg = [
        "🎬 *PEMESANAN WCC LANGKAH BARU*",
        orderId ? `📋 Order ID: #${orderId}` : "",
        "",
        `👤 *Nama:* ${data.nama}`,
        `📱 *WhatsApp:* ${data.whatsapp}`,
        `📅 *Tanggal:* ${formatDate(data.tanggal)}`,
        `📍 *Lokasi:* ${data.lokasi}`,
        `📦 *Paket:* ${paketLabels[data.paket] || data.paket}`,
        data.catatan ? `📝 *Catatan:* ${data.catatan}` : "",
        "",
        "✨ Saya ingin memesan jasa Wedding Content Creator. Mohon konfirmasinya! 🙏",
      ]
        .filter(Boolean)
        .join("\n");

      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

      showModal(
        "🎉",
        "Pesanan Berhasil!",
        `Terima kasih ${data.nama}! Pesanan kamu telah dicatat${orderId ? ` (ID: #${orderId})` : ""}. Klik tombol di bawah untuk langsung chat ke WhatsApp kami.`,
        waUrl,
      );

      form.reset();
    } catch (err) {
      showToast(
        "error",
        "❌ Terjadi Kesalahan",
        "Silakan coba lagi atau hubungi kami langsung via WhatsApp.",
      );
    }

    submitBtn.innerHTML = origText;
    submitBtn.disabled = false;
  });

  // Add spin keyframe
  const style = document.createElement("style");
  style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(style);
})();

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/* ── TOAST NOTIFICATION ─────────────────────────────────────── */
function showToast(type, title, msg) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${type === "success" ? "✅" : "❌"}</div>
    <div class="toast-msg"><strong>${title}</strong>${msg}</div>
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 600);
  }, 4000);
}

/* ── MODAL ──────────────────────────────────────────────────── */
function showModal(icon, title, desc, waUrl) {
  const overlay = document.getElementById("orderModal");
  const modal = overlay.querySelector(".modal");

  overlay.querySelector(".modal-icon").textContent = icon;
  overlay.querySelector(".modal-title").textContent = title;
  overlay.querySelector(".modal-desc").textContent = desc;
  overlay.querySelector("#modalWaBtn").href = waUrl;

  overlay.classList.add("open");
}

(function initModal() {
  const overlay = document.getElementById("orderModal");
  const closeBtn = overlay?.querySelector(".modal-close");
  const cancelBtn = overlay?.querySelector("#modalCancel");

  function closeModal() {
    overlay.classList.remove("open");
  }

  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);
})();

/* ── DIRECT WHATSAPP BUTTONS ────────────────────────────────── */
(function initWaButtons() {
  const waNumber = "6281532477237";

  document.querySelectorAll("[data-wa]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const msg =
        btn.dataset.wa ||
        "Halo, saya ingin bertanya tentang layanan WCC Langkah Baru! 😊";
      window.open(
        `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`,
        "_blank",
      );
    });
  });
})();

/* ── SMOOTH ANCHOR LINKS ────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

/* ── PARALLAX HERO ORBS ─────────────────────────────────────── */
(function initParallax() {
  const orbs = document.querySelectorAll(".orb");
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      orbs.forEach((orb, i) => {
        const speed = i === 0 ? 0.2 : i === 1 ? 0.15 : 0.1;
        orb.style.transform = `translateY(${y * speed}px)`;
      });
    },
    { passive: true },
  );
})();

/* ── ACTIVE NAV LINK ────────────────────────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => (link.style.color = ""));
          const active = document.querySelector(
            `.nav-links a[href="#${entry.target.id}"]`,
          );
          if (active) active.style.color = "var(--teal)";
        }
      });
    },
    { threshold: 0.5 },
  );

  sections.forEach((s) => observer.observe(s));
})();

/* ── GALLERY ITEMS PLACEHOLDER ──────────────────────────────── */
(function initGallery() {
  const items = [
    { icon: "🎥", label: "Cinematic Reel" },
    { icon: "💍", label: "Akad Nikah" },
    { icon: "🌸", label: "Moment Resepsi" },
    { icon: "📱", label: "Instagram Story" },
    { icon: "✨", label: "Pre-Wedding" },
    { icon: "🎊", label: "Highlight Video" },
    { icon: "👗", label: "Fashion Shoot" },
    { icon: "🕊️", label: "Sacred Moments" },
  ];

  const tracks = document.querySelectorAll(".gallery-track");
  tracks.forEach((track) => {
    const doubled = [...items, ...items]; // seamless loop
    track.innerHTML = doubled
      .map(
        (item) => `
      <div class="gallery-item">
        <div class="gallery-item-inner">
          <div class="gi-icon">${item.icon}</div>
          <div class="gi-label">${item.label}</div>
        </div>
        <div class="gallery-overlay"></div>
      </div>
    `,
      )
      .join("");
  });
})();

console.log(
  "%c🎬 WCC Langkah Baru",
  "font-size:20px;font-weight:bold;color:#00d4b8;",
);
console.log("%cWebsite berhasil dimuat! 🎉", "color:#c9a84c;");
