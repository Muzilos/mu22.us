function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 20,
        behavior: "smooth",
    });
}

function setFilter(filter) {
    const cards = document.querySelectorAll(".artwork-card");
    cards.forEach((card) => {
        const status = card.getAttribute("data-status");
        if (filter === "all") {
            card.style.display = "";
        } else {
            card.style.display = status === filter ? "" : "none";
        }
    });

    document.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.classList.toggle(
            "active",
            chip.getAttribute("data-filter") === filter
        );
    });
}

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Dynamic artworks from artworks.json ----------
async function loadArtworks() {
    try {
        const res = await fetch("artworks.json", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load artworks.json");
        const data = await res.json();
        renderArtworks(data.artworks || []);
    } catch (err) {
        console.error(err);
        const grid = document.getElementById("artworkGrid");
        if (grid) {
            grid.innerHTML =
                '<p class="muted">Unable to load artworks at the moment.</p>';
        }
    }
}

function renderArtworks(artworks) {
    const grid = document.getElementById("artworkGrid");
    if (!grid) return;
    grid.innerHTML = "";

    artworks.forEach((art) => {
        const card = document.createElement("article");
        card.className = "artwork-card";
        card.setAttribute("data-status", art.status || "available");

        const priceHtml = getPriceHtml(art);

        card.innerHTML = `
        <img
          src="${art.image || ""}"
          alt="Painting titled '${escapeHtml(art.title || "")}'"
          class="artwork-image"
          loading="lazy"
        />
        <div class="artwork-body">
          <div class="artwork-title-row">
            <div class="artwork-title">${escapeHtml(art.title || "")}</div>
            <div class="artwork-year">${art.year || ""}</div>
          </div>
          <div class="artwork-meta">
            ${escapeHtml(art.medium || "")}${art.size ? " · " + escapeHtml(art.size) : ""
            }
          </div>
          <div class="artwork-footer">
            <span class="badge ${art.status === "sold" ? "sold" : "available"
            }">
              ${art.status === "sold" ? "Sold" : "Available"}
            </span>
            ${priceHtml}
          </div>
        </div>
      `;

        // Optional: clicking a card scrolls to contact with prefilled message idea
        card.addEventListener("click", () => {
            const msg = document.getElementById("message");
            if (msg && art.title) {
                msg.value =
                    `I’m interested in “${art.title}” (${art.year}). ` +
                    `Please let me know availability and pricing.\n\n` +
                    msg.value;
            }
            scrollToSection("contact");
        });

        grid.appendChild(card);
    });
}

function getPriceHtml(art) {
    const display = art.price_display || "request";
    if (display === "number" && typeof art.price === "number") {
        const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(art.price);
        return `<span class="price">${formatted}</span>`;
    }
    if (display === "note-only" && art.note) {
        return `<span class="price price-muted">${escapeHtml(art.note)}</span>`;
    }
    // default: request price
    return `<span class="price price-muted">Request price</span>`;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Load artworks on page load
loadArtworks();