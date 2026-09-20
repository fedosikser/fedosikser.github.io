document.addEventListener("DOMContentLoaded", () => {
  const adaptImageSrcset = (srcset) => window.bastionImagePolicy?.adaptSrcset(srcset) || srcset;
  const favoritesKey = "bastion-favorites";
  const catalogGridKey = "bastion-catalog-grid";
  const page = document.querySelector("[data-favorites-page]");
  const grid = page?.querySelector("[data-favorites-grid]");
  const empty = page?.querySelector(".favorites-empty");
  const clearButton = page?.querySelector("[data-favorites-clear]");
  const count = document.querySelector(".favorites-count");
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector(".site-header .nav");
  const backdrop = document.querySelector("[data-menu-close]");
  const loader = document.querySelector("[data-page-loader]");
  const loaderProgress = loader?.querySelector("[data-page-loader-progress]");
  let requestId = 0;
  let menuTimer = 0;

  const syncFavoritesGrid = () => {
    if (!(grid instanceof HTMLElement)) return;
    let singleColumn = false;
    try {
      singleColumn = window.localStorage.getItem(catalogGridKey) === "one";
    } catch {
      singleColumn = false;
    }
    grid.classList.toggle("is-single-column", singleColumn);
    const sizes = singleColumn
      ? "(max-width: 520px) 100vw, (max-width: 900px) 50vw, 50vw"
      : "(max-width: 520px) 50vw, (max-width: 900px) 33vw, 25vw";
    grid.querySelectorAll(".product-image img").forEach((image) => {
      if (!(image instanceof HTMLImageElement)) return;
      image.sizes = sizes;
      const sourceSrcset = image.dataset.qualitySrcset || image.dataset.srcset || image.srcset;
      if (!sourceSrcset) return;
      const responsiveSrcset = adaptImageSrcset(sourceSrcset);
      if (image.dataset.src) image.dataset.srcset = responsiveSrcset;
      else image.srcset = responsiveSrcset;
    });
  };

  if (grid instanceof HTMLElement) {
    new MutationObserver(syncFavoritesGrid).observe(grid, { childList: true });
    syncFavoritesGrid();
  }

  const finishLoader = () => {
    if (!(loader instanceof HTMLElement)) return;
    if (loaderProgress instanceof HTMLElement) loaderProgress.style.transform = "scaleX(1)";
    loader.classList.add("is-complete");
    window.setTimeout(() => { loader.hidden = true; }, 420);
  };

  if (loader instanceof HTMLElement) {
    loader.hidden = false;
    if (loaderProgress instanceof HTMLElement) loaderProgress.style.transform = "scaleX(.72)";
    if (document.readyState === "complete") finishLoader();
    else window.addEventListener("load", finishLoader, { once: true });
    window.setTimeout(finishLoader, 4000);
  }

  const readFavorites = () => {
    try {
      const value = JSON.parse(window.localStorage.getItem(favoritesKey) || "[]");
      return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  };

  const setMenuState = (open) => {
    window.clearTimeout(menuTimer);
    nav?.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    document.body.classList.toggle("menu-closing", !open);
    menuButton?.setAttribute("aria-expanded", String(open));
    menuButton?.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    backdrop?.setAttribute("aria-hidden", String(!open));
    if (!open) {
      menuTimer = window.setTimeout(() => document.body.classList.remove("menu-closing"), 500);
    }
  };

  menuButton?.addEventListener("click", () => setMenuState(menuButton.getAttribute("aria-expanded") !== "true"));
  backdrop?.addEventListener("click", () => setMenuState(false));
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenuState(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuState(false);
  });

  document.querySelectorAll("[data-history-back]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      let referrer;
      try {
        referrer = document.referrer ? new URL(document.referrer) : null;
      } catch {
        referrer = null;
      }
      if (window.history.length <= 1 || referrer?.origin !== window.location.origin) return;
      event.preventDefault();
      window.history.back();
    });
  });

  const revealImage = (image) => {
    if (!(image instanceof HTMLImageElement) || !image.dataset.src) return;
    const frame = image.closest(".product-image");
    const settle = (loaded) => {
      frame?.classList.toggle("is-image-loaded", loaded);
      frame?.classList.toggle("has-image-error", !loaded);
      frame?.setAttribute("aria-busy", "false");
    };
    image.addEventListener("load", () => settle(true), { once: true });
    image.addEventListener("error", () => settle(false), { once: true });
    image.decoding = "async";
    if (image.dataset.srcset) {
      image.srcset = adaptImageSrcset(image.dataset.srcset);
      delete image.dataset.srcset;
    }
    image.src = image.dataset.src;
    delete image.dataset.src;
  };

  const hydrateCards = () => {
    if (!(grid instanceof HTMLElement)) return;
    grid.querySelectorAll("img[data-src]:not(.product-image-alt)").forEach(revealImage);
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    grid.querySelectorAll(".product-card").forEach((card) => {
      card.addEventListener("pointerenter", () => {
        card.querySelectorAll("img.product-image-alt[data-src]").forEach(revealImage);
      }, { once: true });
    });
  };

  const loadCards = async (favorites) => {
    if (!(page instanceof HTMLElement) || !(grid instanceof HTMLElement) || !favorites.length) return;
    const currentRequest = ++requestId;
    grid.setAttribute("aria-busy", "true");
    try {
      const body = new URLSearchParams({
        action: "bastion_load_favorites",
        nonce: page.dataset.favoritesNonce || "",
        slugs: JSON.stringify(favorites),
      });
      const response = await fetch(page.dataset.favoritesEndpoint || "", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: body.toString(),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error("Favorites request failed");
      if (currentRequest !== requestId) return;
      grid.innerHTML = payload.data?.html || "";
      hydrateCards();
    } catch {
      if (currentRequest === requestId) grid.replaceChildren();
    } finally {
      if (currentRequest === requestId) grid.removeAttribute("aria-busy");
    }
  };

  const syncFavorites = () => {
    const favorites = readFavorites();
    page?.classList.toggle("has-favorites", favorites.length > 0);
    if (count) {
      count.textContent = String(favorites.length);
      count.hidden = favorites.length === 0;
    }
    if (clearButton) clearButton.hidden = favorites.length === 0;
    if (empty) empty.hidden = favorites.length > 0;
    if (grid instanceof HTMLElement) {
      grid.hidden = favorites.length === 0;
      if (!favorites.length) {
        requestId += 1;
        grid.replaceChildren();
        grid.removeAttribute("aria-busy");
      }
    }
    void loadCards(favorites);
  };

  clearButton?.addEventListener("click", () => {
    window.localStorage.removeItem(favoritesKey);
    syncFavorites();
  });
  document.querySelector("[data-favorites-empty-heart]")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLElement)) return;
    button.classList.add("is-launching");
    window.setTimeout(() => button.classList.remove("is-launching"), 900);
  });
  window.addEventListener("storage", () => {
    syncFavoritesGrid();
    syncFavorites();
  });
  syncFavorites();
});
