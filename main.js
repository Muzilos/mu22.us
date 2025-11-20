// --------- Artwork data will be loaded from artworks.json ---------
let artworks = [];
let currentFilter = "all";

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

  renderArtworkGrid();
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
          ${artwork.size || ""}${
      artwork.medium ? ` · ${artwork.medium}` : ""
    }
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

  // No dedicated description in JSON; you can add one later if needed.
  descEl.textContent = artwork.description || "";

  // Clear tags (no tags field in JSON by default)
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
      const prefix = `I’m writing about “${artwork.title}” (${artwork.year || ""}${
        artwork.size ? `, ${artwork.size}` : ""
      }). `;
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

function setupModal() {
  const modal = document.getElementById("artworkModal");
  if (!modal) return;

  const closeEls = modal.querySelectorAll("[data-modal-close]");
  closeEls.forEach((el) => {
    el.addEventListener("click", () => closeArtworkModal());
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeArtworkModal();
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
