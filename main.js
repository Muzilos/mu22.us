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
  if (status === "sold") return "Sold";
  return "";
}

function statusClass(status) {
  if (status === "available") return "available";
  if (status === "sold") return "sold";
  return "";
}

function priceDisplay(artwork) {
  if (artwork.status === "sold") {
    return "";
  } else if (isNaN(artwork.price)) {
    return artwork.price;
  }
  return artwork.price ? `$${artwork.price.toLocaleString()}` : "";
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
          <span class="price ${artwork.status === "sold" ? "price-muted" : ""
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
  // const descEl = document.getElementById("modalDescription");
  // const tagsEl = document.getElementById("modalTags");
  const statusEl = document.getElementById("modalStatus");
  const inquireBtn = document.getElementById("modalInquireButton");
  const printBtn = document.getElementById("modalPrintButton");

  img.src = artwork.image;
  img.alt = artwork.title;
  titleEl.textContent = artwork.title;
  metaEl.textContent = `${artwork.year || ""}${artwork.size ? ` · ${artwork.size}` : ""
    }${artwork.medium ? ` · ${artwork.medium}` : ""}`;

  // Description (if present in JSON)
  // descEl.textContent = artwork.description || "";

  // Clear tags (you can extend this later if you add tags in JSON)
  // tagsEl.innerHTML = "";

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
      const prefix = `I’m writing about “${artwork.title}” (${artwork.year || ""
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

  // --------- PRINT BUTTON IN MODAL ---------
  if (printBtn) {
    if (artwork.printsAvailable && typeof openPrintModal === "function") {
      printBtn.style.display = "block";
      printBtn.onclick = () => {
        // this "artwork" is from the openArtworkModal scope
        openPrintModal(artwork);
      };
    } else {
      // hide / disable if no prints
      printBtn.style.display = "none";
      printBtn.onclick = null;
    }
  }

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

// ============================
// PRINT PURCHASE LOGIC
// ============================

let printModal = document.getElementById("print-modal");
let printTitleElem = document.getElementById("print-title");
let printOptionsElem = document.getElementById("print-options");
let printPurchaseBtn = document.getElementById("print-purchase-btn");

let selectedPrint = null;

function openPrintModal(artwork) {
  printTitleElem.textContent = `Buy Print — ${artwork.title}`;
  selectedPrint = artwork;

  // render size options
  printOptionsElem.innerHTML = "";
  for (let size in artwork.printPrices) {
    let price = artwork.printPrices[size];
    let option = document.createElement("div");
    option.className = "print-option";
    option.innerHTML = `
            <label>
                <input type="radio" name="print-size" value="${size}">
                ${size} — $${price}
            </label>
        `;
    printOptionsElem.appendChild(option);
  }

  printModal.classList.remove("hidden");
}

document.getElementById("print-close").onclick = () => {
  printModal.classList.add("hidden");
};

// Purchase button
printPurchaseBtn.onclick = () => {
  const sizeInput = document.querySelector('input[name="print-size"]:checked');
  if (!sizeInput) {
    alert("Please select a print size.");
    return;
  }

  const chosenSize = sizeInput.value;
  const price =
    selectedPrint && selectedPrint.printPrices
      ? selectedPrint.printPrices[chosenSize]
      : null;

  // Grab the existing Netlify form + fields
  const form = document.getElementById("contactForm");
  const nameField = document.getElementById("name");
  const emailField = document.getElementById("email");
  const interestField = document.getElementById("interest");
  const messageField = document.getElementById("message");
  const contactSection = document.getElementById("contact");

  if (!form || !interestField || !messageField) {
    console.warn("Contact form or fields not found.");
    return;
  }

  // Set interest to "Prints / editions"
  interestField.value = "print";

  // Pre-fill message with a clear print request
  const prefix = `I’d like to purchase a ${chosenSize} print of “${selectedPrint.title}”` +
    (price ? ` for $${price}.` : ".");

  // Don’t duplicate the line if user re-opens the modal
  if (!messageField.value.includes(selectedPrint.title)) {
    messageField.value = prefix + "\n\n" + (messageField.value || "");
  }

  // Close the print modal (if you're using .hidden or similar)
  const printModalEl = document.getElementById("print-modal");
  if (printModalEl) {
    printModalEl.classList.add("hidden");
  }
  // Close the artwork modal as well
  closeArtworkModal();

  // If the user already filled name + email, submit directly.
  // Otherwise, scroll them to the form so they can complete it.
  const hasName = nameField && nameField.value.trim().length > 0;
  const hasEmail = emailField && emailField.value.trim().length > 0;

  if (hasName && hasEmail) {
    form.submit(); // Netlify will handle the POST and thanks page
  } else {
    if (contactSection) {
      const y =
        contactSection.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    if (nameField) {
      nameField.focus();
    }
  }
};


// Attach listeners to print buttons dynamically:
fetch("artworks.json")
  .then(res => res.json())
  .then(artworks => {
    artworks.forEach(art => {
      const btn = document.querySelector(
        `.print-btn[data-title="${art.title}"]`
      );

      if (!btn) return;

      if (art.printsAvailable) {
        btn.addEventListener("click", () => openPrintModal(art));
      } else {
        btn.style.display = "none";
      }
    });
  });

// --------- Footer year ---------

function setCurrentYear() {
  const yearEl = document.getElementById("year");
  if (!yearEl) return;
  yearEl.textContent = new Date().getFullYear();
}

// ---- Generic swipe helper ----
function setupSwipe(element, onSwipeLeft, onSwipeRight) {
  const SWIPE_THRESHOLD = 50; // pixels
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let isDragging = false;
  let isTouch = false;

  function startDrag(x, y, touch) {
    isDragging = true;
    isTouch = touch;
    startX = lastX = x;
    startY = lastY = y;
  }

  function moveDrag(x, y) {
    if (!isDragging) return;
    lastX = x;
    lastY = y;
  }

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;

    const dx = lastX - startX;
    const dy = lastY - startY;

    // Only treat mostly-horizontal gestures as swipes
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) {
      return; // ignore small or vertical drags
    }

    if (dx < 0) {
      // dragged left → next item
      onSwipeLeft && onSwipeLeft();
    } else {
      // dragged right → previous item
      onSwipeRight && onSwipeRight();
    }
  }

  // Touch events
  element.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      if (!t) return;
      startDrag(t.clientX, t.clientY, true);
    },
    { passive: true }
  );

  element.addEventListener(
    "touchmove",
    (e) => {
      if (!isDragging || !isTouch) return;
      const t = e.touches[0];
      if (!t) return;
      moveDrag(t.clientX, t.clientY);
    },
    { passive: true }
  );

  element.addEventListener("touchend", () => {
    if (isTouch) endDrag();
  });

  // Mouse events (for desktop "swipe" via click-and-drag)
  element.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return; // left click only
    startDrag(e.clientX, e.clientY, false);
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging || isTouch) return;
    moveDrag(e.clientX, e.clientY);
  });

  window.addEventListener("mouseup", () => {
    if (!isTouch) endDrag();
  });
}

// ---- Wire swipe to your existing arrows ----
document.addEventListener("DOMContentLoaded", () => {
  const featuredMedia = document.getElementById("featuredMedia");
  const featuredPrev = document.getElementById("featuredPrev");
  const featuredNext = document.getElementById("featuredNext");

  const modalImage = document.getElementById("modalImage");
  const modalPrev = document.getElementById("modalPrev");
  const modalNext = document.getElementById("modalNext");

  if (featuredMedia && featuredPrev && featuredNext) {
    // Swipe left/right on the featured image area
    setupSwipe(
      featuredMedia,
      () => featuredNext.click(), // swipe left → next featured work
      () => featuredPrev.click()  // swipe right → previous featured work
    );
  }

  if (modalImage && modalPrev && modalNext) {
    // Swipe left/right on the big modal image
    setupSwipe(
      modalImage,
      () => modalNext.click(), // swipe left → next work in modal
      () => modalPrev.click()  // swipe right → previous work in modal
    );
  }
});

// --------- Init ---------

document.addEventListener("DOMContentLoaded", () => {
  loadArtworks();
  setupFilters();
  setupSmoothScroll();
  setupModal();
  setCurrentYear();
});
