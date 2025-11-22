// --------- Artwork data will be loaded from artworks.json ---------
let artworks = [];
let currentFilter = "all";
// For modal navigation (next/prev)
let currentSequence = [];     // array of slugs in the current view
let currentModalIndex = -1;   // index into currentSequence
// Featured carousel state
let featuredArtworks = [];
let featuredIndex = 0;
let featuredIntervalId = null;


// --------- Helpers ---------

function statusLabel(status) {
  if (status === "available") return "Available";
  if (status === "reserved") return "Reserved";
  if (status === "sold") return "Sold";
  return "";
}

function statusClass(status) {
  if (status === "available") return "available";
  if (status === "reserved") return "reserved";
  if (status === "sold") return "sold";
  return "";
}

function priceDisplay(artwork) {
  // artwork.price_display: "number" | "request" | etc.
  if (artwork.status === "sold" && !artwork.price_display) return "";
  if (artwork.price_display === "request") return "Request price";

  if (artwork.price_display === "number" && typeof artwork.price === "number") {
    return `$${artwork.price.toLocaleString()}`;
  }

  return "";
}

// --------- Load artworks from JSON ---------

async function loadArtworks() {
  try {
    const res = await fetch("artworks.json", { cache: "no-store" });
    const data = await res.json();
    if (Array.isArray(data.artworks)) {
      artworks = data.artworks;
    } else {
      artworks = [];
    }
  } catch (err) {
    console.error("Error loading artworks.json", err);
    artworks = [];
  }
  // Render the main grid
  renderArtworkGrid();

  // Build / start the featured carousel once artworks are loaded
  setupFeaturedCarousel();
}

// --------- Rendering the grid ---------

function renderArtworkGrid() {
  const grid = document.getElementById("artworkGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const filtered = artworks.filter((artwork) => {
    if (currentFilter === "all") return true;
    return artwork.status === currentFilter;
  });

  // Keep a navigation sequence that matches what the user sees
  currentSequence = filtered.map((artwork) => artwork.slug);

  filtered.forEach((artwork) => {
    const card = document.createElement("article");
    card.className = "artwork-card";
    card.dataset.slug = artwork.slug;

    const priceText = priceDisplay(artwork);

    card.innerHTML = `
      <div class="artwork-image-wrap">
        <img src="${artwork.image}" alt="${artwork.title}" loading="lazy" />
      </div>
      <div class="artwork-body">
        <div class="artwork-title-row">
          <div class="artwork-title">${artwork.title}</div>
          <div class="artwork-year">${artwork.year || ""}</div>
        </div>
        <div class="artwork-meta">
          ${artwork.size || ""}${artwork.medium ? ` · ${artwork.medium}` : ""}
        </div>
        <div class="artwork-footer">
          <span class="badge ${statusClass(artwork.status)}">
            ${statusLabel(artwork.status)}
          </span>
          <span class="price ${
            artwork.status === "sold" ? "price-muted" : ""
          }">
            ${priceText}
          </span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      openArtworkModal(artwork.slug);
    });

    grid.appendChild(card);
  });
}

// --------- Featured carousel ---------

function setupFeaturedCarousel() {
  const wrap = document.getElementById("featuredWrap");
  const mediaEl = document.getElementById("featuredMedia");
  const dotsEl = document.getElementById("featuredDots");
  const prevBtn = document.getElementById("featuredPrev");
  const nextBtn = document.getElementById("featuredNext");

  if (!wrap || !mediaEl) return;

  // Pull out artworks marked as "featured" in artworks.json
  featuredArtworks = artworks.filter((a) => a.featured);

  // If no featured works, hide the block entirely
  if (!featuredArtworks.length) {
    wrap.style.display = "none";
    return;
  }

  mediaEl.innerHTML = "";
  if (dotsEl) dotsEl.innerHTML = "";

  // Build slides and dots from data
  featuredArtworks.forEach((art, idx) => {
    const slide = document.createElement("div");
    slide.className = "featured-slide";
    slide.dataset.slug = art.slug;
    slide.innerHTML = `<img src="${art.image}" alt="${art.title}" />`;

    // Clicking the big image opens the modal
    slide.addEventListener("click", () => {
      if (typeof openArtworkModal === "function") {
        openArtworkModal(art.slug);
      }
    });

    mediaEl.appendChild(slide);

    if (dotsEl) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "featured-dot";
      dot.setAttribute("aria-label", `Show featured work ${idx + 1}`);
      dot.addEventListener("click", () => {
        goToFeaturedSlide(idx);
        startFeaturedAutoRotate();
      });
      dotsEl.appendChild(dot);
    }
  });

  // Wire arrows
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prevFeaturedSlide();
      startFeaturedAutoRotate();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      nextFeaturedSlide();
      startFeaturedAutoRotate();
    });
  }

  // Start on first slide
  featuredIndex = 0;
  goToFeaturedSlide(0);
  startFeaturedAutoRotate();

  // Optional: pause on hover so people can read details
  wrap.addEventListener("mouseenter", stopFeaturedAutoRotate);
  wrap.addEventListener("mouseleave", startFeaturedAutoRotate);
}

function goToFeaturedSlide(index) {
  if (!featuredArtworks.length) return;

  const count = featuredArtworks.length;
  featuredIndex = (index + count) % count;

  const mediaEl = document.getElementById("featuredMedia");
  const slides = mediaEl ? mediaEl.querySelectorAll(".featured-slide") : [];

  const dotsEl = document.getElementById("featuredDots");
  const dots = dotsEl ? dotsEl.querySelectorAll(".featured-dot") : [];

  slides.forEach((slide, i) => {
    slide.classList.toggle("is-active", i === featuredIndex);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("is-active", i === featuredIndex);
  });

  const art = featuredArtworks[featuredIndex];

  const titleEl = document.getElementById("featuredTitle");
  const metaEl = document.getElementById("featuredMeta");
  const descEl = document.getElementById("featuredDescription");
  const badgeEl = document.getElementById("featuredBadge");
  const priceEl = document.getElementById("featuredPrice");
  const priceNoteEl = document.getElementById("featuredPriceNote");
  const indexEl = document.getElementById("featuredIndex");

  if (titleEl) {
    titleEl.textContent = art.title || "";
  }

  if (metaEl) {
    const bits = [];
    if (art.year) bits.push(art.year);
    if (art.size) bits.push(art.size);
    if (art.medium) bits.push(art.medium);
    metaEl.textContent = bits.join(" · ");
  }

  if (descEl) {
    descEl.textContent = art.description || "";
  }

  if (badgeEl) {
    badgeEl.className = `badge ${statusClass(art.status)}`;
    badgeEl.textContent = statusLabel(art.status);
  }

  if (priceEl) {
    priceEl.className = "price";
    priceEl.textContent = priceDisplay(art);
  }

  if (priceNoteEl) {
    priceNoteEl.textContent = art.priceNote || "";
  }

  if (indexEl) {
    indexEl.textContent = `${featuredIndex + 1} / ${count}`;
  }
}

function nextFeaturedSlide() {
  goToFeaturedSlide(featuredIndex + 1);
}

function prevFeaturedSlide() {
  goToFeaturedSlide(featuredIndex - 1);
}

function startFeaturedAutoRotate() {
  stopFeaturedAutoRotate();
  if (featuredArtworks.length <= 1) return;

  featuredIntervalId = window.setInterval(() => {
    nextFeaturedSlide();
  }, 8000); // 8 seconds per slide, tweak if you want
}

function stopFeaturedAutoRotate() {
  if (featuredIntervalId !== null) {
    clearInterval(featuredIntervalId);
    featuredIntervalId = null;
  }
}

// --------- Filters ---------

function setupFilters() {
  const chips = document.querySelectorAll(".filter-chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const filter = chip.dataset.filter;
      if (!filter) return;

      currentFilter = filter;

      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");

      renderArtworkGrid();
    });
  });
}

// --------- Smooth scroll for nav & buttons ---------

function setupSmoothScroll() {
  const triggers = document.querySelectorAll("[data-scroll-target]");
  triggers.forEach((el) => {
    el.addEventListener("click", (e) => {
      const targetId = el.dataset.scrollTarget;
      if (!targetId) return;

      const section = document.getElementById(targetId);
      if (!section) return;

      e.preventDefault();
      const y = section.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  });
}

// --------- Modal logic ---------

function findArtwork(slug) {
  return artworks.find((a) => a.slug === slug);
}

function openArtworkModal(slug) {
  const artwork = findArtwork(slug);
  if (!artwork) return;

  // Keep modal index in sync with the currentSequence
  const seqIndex = currentSequence.indexOf(slug);
  if (seqIndex !== -1) {
    currentModalIndex = seqIndex;
  } else {
    // Fallback: navigate over the full artworks list if slug not in currentSequence
    const allIndex = artworks.findIndex((a) => a.slug === slug);
    currentModalIndex = allIndex;
    currentSequence = artworks.map((a) => a.slug);
  }

  const modal = document.getElementById("artworkModal");
  if (!modal) return;

  const img = document.getElementById("modalImage");
  const titleEl = document.getElementById("modalTitle");
  const metaEl = document.getElementById("modalMeta");
  const descEl = document.getElementById("modalDescription");
  const tagsEl = document.getElementById("modalTags");
  const statusEl = document.getElementById("modalStatus");
  const inquireBtn = document.getElementById("modalInquireButton");

  img.src = artwork.image;
  img.alt = artwork.title;
  titleEl.textContent = artwork.title;
  metaEl.textContent = `${artwork.year || ""}${
    artwork.size ? ` · ${artwork.size}` : ""
  }${artwork.medium ? ` · ${artwork.medium}` : ""}`;

  // Description (if present in JSON)
  descEl.textContent = artwork.description || "";

  // Clear tags (you can extend this later if you add tags in JSON)
  tagsEl.innerHTML = "";

  // status + price + note
  const priceText = priceDisplay(artwork);
  let statusText = statusLabel(artwork.status);
  if (priceText) statusText += ` • ${priceText}`;
  if (artwork.note) {
    statusText += statusText ? ` — ${artwork.note}` : artwork.note;
  }
  statusEl.textContent = statusText;

  // Inquire button: scrolls to contact form + prefill message
  inquireBtn.onclick = () => {
    const messageField = document.getElementById("message");
    const interestField = document.getElementById("interest");
    const contactSection = document.getElementById("contact");
    if (interestField) {
      interestField.value = "acquisition";
    }
    if (messageField) {
      const prefix = `I’m writing about “${artwork.title}” (${
        artwork.year || ""
      }${artwork.size ? `, ${artwork.size}` : ""}). `;
      if (!messageField.value.startsWith(prefix)) {
        messageField.value = prefix + "\n\n";
      }
    }
    closeArtworkModal();
    if (contactSection) {
      const y =
        contactSection.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeArtworkModal() {
  const modal = document.getElementById("artworkModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function openArtworkAtIndex(index) {
  if (!currentSequence.length) return;

  const count = currentSequence.length;
  // wrap around
  if (index < 0) index = count - 1;
  if (index >= count) index = 0;

  currentModalIndex = index;
  const slug = currentSequence[currentModalIndex];
  openArtworkModal(slug);
}

function openNextArtwork() {
  if (!currentSequence.length) return;
  openArtworkAtIndex(currentModalIndex + 1);
}

function openPrevArtwork() {
  if (!currentSequence.length) return;
  openArtworkAtIndex(currentModalIndex - 1);
}

function setupModal() {
  const modal = document.getElementById("artworkModal");
  if (!modal) return;

  const closeEls = modal.querySelectorAll("[data-modal-close]");
  closeEls.forEach((el) => {
    el.addEventListener("click", () => closeArtworkModal());
  });

  const prevBtn = document.getElementById("modalPrev");
  const nextBtn = document.getElementById("modalNext");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      openPrevArtwork();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      openNextArtwork();
    });
  }

  document.addEventListener("keydown", (e) => {
    // Only respond to keys when the modal is actually open
    if (!modal.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeArtworkModal();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      openNextArtwork();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      openPrevArtwork();
    }
  });
}

// --------- Footer year ---------

function setCurrentYear() {
  const yearEl = document.getElementById("year");
  if (!yearEl) return;
  yearEl.textContent = new Date().getFullYear();
}

// --------- Init ---------

document.addEventListener("DOMContentLoaded", () => {
  loadArtworks();
  setupFilters();
  setupSmoothScroll();
  setupModal();
  setCurrentYear();
});
