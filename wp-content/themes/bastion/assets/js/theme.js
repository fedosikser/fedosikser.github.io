document.addEventListener("DOMContentLoaded", () => {
  const adaptImageSrcset = (srcset) => window.bastionImagePolicy?.adaptSrcset(srcset) || srcset;
  const servicesInstallation = document.querySelector(".services-page > .services-installation");
  const servicesAftercare = document.querySelector(".services-page > .services-aftercare");

  if (
    servicesInstallation instanceof HTMLElement &&
    servicesAftercare instanceof HTMLElement &&
    (servicesInstallation.compareDocumentPosition(servicesAftercare) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
  ) {
    servicesAftercare.after(servicesInstallation);
  }

  const pageLoader = document.querySelector("[data-page-loader]");
  const pageLoaderProgress = pageLoader?.querySelector("[data-page-loader-progress]");
  let pageLoaderValue = 0.08;
  let pageLoaderTimer = 0;
  let pageLoaderFinishTimer = 0;
  let pageLoaderFallbackTimer = 0;

  const renderPageLoader = (value) => {
    pageLoaderValue = Math.min(1, Math.max(pageLoaderValue, value));
    if (pageLoaderProgress instanceof HTMLElement) {
      pageLoaderProgress.style.transform = `scaleX(${pageLoaderValue})`;
    }
  };

  const beginPageLoader = (restart = false) => {
    if (!(pageLoader instanceof HTMLElement)) return;
    window.clearInterval(pageLoaderTimer);
    window.clearTimeout(pageLoaderFinishTimer);
    window.clearTimeout(pageLoaderFallbackTimer);
    pageLoaderValue = restart ? 0.06 : pageLoaderValue;
    pageLoader.hidden = false;
    pageLoader.classList.remove("is-complete");
    renderPageLoader(pageLoaderValue);

    pageLoaderTimer = window.setInterval(() => {
      const eagerImages = [...document.images].filter((image) => image.loading !== "lazy");
      const loadedImages = eagerImages.filter((image) => image.complete).length;
      const imageProgress = eagerImages.length ? loadedImages / eagerImages.length : 1;
      const target = Math.min(0.92, 0.24 + imageProgress * 0.62);
      renderPageLoader(pageLoaderValue + Math.max(0.012, (target - pageLoaderValue) * 0.18));
    }, 140);
  };

  const finishPageLoader = () => {
    if (!(pageLoader instanceof HTMLElement) || pageLoader.classList.contains("is-complete")) return;
    window.clearInterval(pageLoaderTimer);
    window.clearTimeout(pageLoaderFallbackTimer);
    renderPageLoader(1);
    pageLoader.classList.add("is-complete");
    pageLoaderFinishTimer = window.setTimeout(() => {
      pageLoader.hidden = true;
    }, 420);
  };

  beginPageLoader();
  if (document.readyState === "complete") {
    window.requestAnimationFrame(finishPageLoader);
  } else {
    window.addEventListener("load", finishPageLoader, { once: true });
    pageLoaderFallbackTimer = window.setTimeout(finishPageLoader, 10000);
  }

  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector(".site-header .nav");
  const header = document.querySelector(".site-header");
  const menuBackdrop = document.querySelector("[data-menu-close]");
  const favoritesKey = "bastion-favorites";
  const catalogReturnKey = "bastion-catalog-return";
  const isProductPage = document.body.classList.contains("single-product");
  const isStaticHeaderPage = document.body.classList.contains("bastion-static-header");
  const isMobilePinnedHeaderPage = document.body.classList.contains("bastion-mobile-pinned-header");
  const isScrollRevealHeaderPage = document.body.classList.contains("bastion-scroll-reveal-header");
  const catalogIntroBoundary = document.querySelector(".catalog-intro-scene");
  const catalogPage = document.querySelector("[data-catalog]");
  const catalogProductGrid = catalogPage?.querySelector("[data-catalog-grid]");
  const catalogInlineTools = catalogPage?.querySelector("[data-catalog-inline-tools]");
  const catalogScrollTools = document.querySelector("[data-catalog-scroll-tools]");
  const catalogScrollAdvancedToggle = catalogScrollTools?.querySelector("[data-catalog-quick-advanced]");
  const pageStackingIntros = [...document.querySelectorAll(".page-stacking-intro")]
    .filter((element) => element instanceof HTMLElement);
  const introHeaderBoundary = catalogIntroBoundary || (document.body.classList.contains("bastion-intro-header")
    ? document.querySelector(".contacts-layout, .privacy-hero, .works-intro, .services-hero, .favorites-intro")
    : null);
  const siteFooter = document.querySelector("footer");
  const floatingToTop = document.querySelector(".to-top");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let previousScrollY = Math.max(window.scrollY, 0);
  let downwardTravel = 0;
  let floatingToTopIdleTimer = 0;
  let catalogToolsHoverTimer = 0;
  let catalogToolsCollapseFrame = 0;
  let catalogToolsHaveActivated = false;
  let catalogToolsActivationHeight = 0;
  let catalogToolsActivationWidth = 0;
  let catalogHeaderDirection = "down";
  let catalogHeaderDirectionCandidate = "down";
  let catalogHeaderDirectionTravel = 0;
  let pageNavigationPending = false;
  let scrollLockFrame = 0;
  const servicesTrigger = header?.querySelector(".nav-services-trigger");
  const servicesHeaderMenu = header?.querySelector(".services-header-menu");
  let servicesMenuCloseTimer = 0;

  if (
    header instanceof HTMLElement
    && servicesTrigger instanceof HTMLAnchorElement
    && servicesHeaderMenu instanceof HTMLElement
  ) {
    const setServicesMenuOpen = (open) => {
      window.clearTimeout(servicesMenuCloseTimer);
      header.classList.toggle("services-menu-open", open);
      servicesTrigger.setAttribute("aria-expanded", String(open));
    };

    const scheduleServicesMenuClose = () => {
      window.clearTimeout(servicesMenuCloseTimer);
      servicesMenuCloseTimer = window.setTimeout(() => {
        const focusedElement = document.activeElement;
        const focusRemainsInside = focusedElement === servicesTrigger
          || servicesHeaderMenu.contains(focusedElement);
        if (servicesTrigger.matches(":hover") || servicesHeaderMenu.matches(":hover") || focusRemainsInside) return;
        setServicesMenuOpen(false);
      }, 420);
    };

    [servicesTrigger, servicesHeaderMenu].forEach((element) => {
      element.addEventListener("pointerenter", () => setServicesMenuOpen(true));
      element.addEventListener("pointerleave", scheduleServicesMenuClose);
    });
    servicesTrigger.addEventListener("focus", () => setServicesMenuOpen(true));
    servicesHeaderMenu.addEventListener("focusin", () => setServicesMenuOpen(true));
    header.addEventListener("focusout", scheduleServicesMenuClose);
  }

  if (pageStackingIntros.length) {
    let pageStackingResizeFrame = 0;
    const syncPageStackingOffsets = () => {
      window.cancelAnimationFrame(pageStackingResizeFrame);
      pageStackingResizeFrame = window.requestAnimationFrame(() => {
        pageStackingIntros.forEach((intro) => {
          const introHeight = intro.getBoundingClientRect().height;
          const stickyTop = Math.min(0, window.innerHeight - introHeight);
          intro.style.setProperty("--page-stacking-intro-top", `${Math.floor(stickyTop)}px`);
        });
      });
    };

    syncPageStackingOffsets();
    window.addEventListener("resize", syncPageStackingOffsets, { passive: true });
    window.addEventListener("orientationchange", syncPageStackingOffsets, { passive: true });
    pageStackingIntros.forEach((intro) => intro.querySelectorAll("img").forEach((image) => {
      if (!image.complete) image.addEventListener("load", syncPageStackingOffsets, { once: true });
    }));
    if ("ResizeObserver" in window) {
      const pageStackingResizeObserver = new ResizeObserver(syncPageStackingOffsets);
      pageStackingIntros.forEach((intro) => pageStackingResizeObserver.observe(intro));
    }
  }

  const reconcilePageScrollLocks = () => {
    if (!nav?.classList.contains("is-open")) {
      document.body.classList.remove("menu-open", "menu-closing");
    }
    if (!document.querySelector(".gallery-lightbox:not([hidden])")) {
      document.body.classList.remove("gallery-lightbox-open");
    }
    if (!document.querySelector("[data-map-lock].is-fullscreen")) {
      document.body.classList.remove("map-fullscreen-open");
    }
    const catalogOverlay = document.querySelector("[data-catalog-tools-overlay]");
    if (!(catalogOverlay instanceof HTMLElement) || catalogOverlay.getAttribute("aria-hidden") !== "false") {
      document.body.classList.remove("catalog-search-active");
      document.documentElement.classList.remove("catalog-search-active");
    }
  };
  const syncOverscrollSurface = () => {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
    const isAtPageEnd = maxScroll > 0 && window.scrollY >= maxScroll - 2;
    document.documentElement.classList.toggle("is-at-page-top", window.scrollY <= 2);
    document.documentElement.classList.toggle("is-at-page-end", isAtPageEnd);
  };

  if (!reducedMotion.matches) {
    document.body.classList.add("is-page-entering");
    window.setTimeout(() => document.body.classList.remove("is-page-entering"), 380);
  }

  document.addEventListener("click", (event) => {
    if (reducedMotion.matches || pageNavigationPending || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a[href]");
    if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download")) return;
    if (link.target && link.target !== "_self") return;

    const destination = new URL(link.href, window.location.href);
    if (!['http:', 'https:'].includes(destination.protocol) || destination.origin !== window.location.origin) return;
    const sameDocument = destination.pathname === window.location.pathname && destination.search === window.location.search;
    if (sameDocument && (destination.hash || destination.href === window.location.href)) return;

    event.preventDefault();
    pageNavigationPending = true;
    beginPageLoader(true);
    document.body.classList.add("is-page-leaving");
    window.setTimeout(() => window.location.assign(destination.href), 230);
  });

  document.querySelectorAll("[data-history-back]").forEach((backLink) => {
    backLink.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      let previousPage = null;
      try {
        previousPage = document.referrer ? new URL(document.referrer) : null;
      } catch {
        previousPage = null;
      }
      const canReturn = window.history.length > 1
        && previousPage?.origin === window.location.origin
        && previousPage.href !== window.location.href;
      if (!canReturn) return;

      event.preventDefault();
      window.history.back();
    });
  });

  window.addEventListener("pageshow", () => {
    pageNavigationPending = false;
    finishPageLoader();
    document.body.classList.remove("is-page-leaving");
    window.requestAnimationFrame(reconcilePageScrollLocks);
  });
  window.addEventListener("pagehide", () => document.body.classList.remove("menu-closing"));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") window.requestAnimationFrame(reconcilePageScrollLocks);
  });
  const requestScrollLockReconciliation = () => {
    const body = document.body;
    const mayBeLocked = body.classList.contains("menu-open")
      || body.classList.contains("menu-closing")
      || body.classList.contains("gallery-lightbox-open")
      || body.classList.contains("map-fullscreen-open")
      || body.classList.contains("catalog-search-active");
    if (!mayBeLocked || scrollLockFrame) return;
    scrollLockFrame = window.requestAnimationFrame(() => {
      scrollLockFrame = 0;
      reconcilePageScrollLocks();
    });
  };
  window.addEventListener("wheel", requestScrollLockReconciliation, { passive: true, capture: true });
  window.addEventListener("touchstart", requestScrollLockReconciliation, { passive: true, capture: true });
  document.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
      reconcilePageScrollLocks();
    }
  }, { capture: true });

  const syncHeaderSurface = () => {
    syncOverscrollSurface();
    const currentScrollY = Math.max(window.scrollY, 0);
    const movement = currentScrollY - previousScrollY;
    if (floatingToTop instanceof HTMLAnchorElement) {
      floatingToTop.classList.add("is-floating");
      const setToTopVisibility = (visible) => {
        floatingToTop.classList.toggle("is-visible", visible);
        floatingToTop.setAttribute("aria-hidden", visible ? "false" : "true");
        floatingToTop.tabIndex = visible ? 0 : -1;
      };

      const footerRect = siteFooter?.getBoundingClientRect();
      const footerInView = Boolean(footerRect && footerRect.top < window.innerHeight * 0.86 && footerRect.bottom > 80);
      floatingToTop.classList.toggle("is-over-footer", footerInView);

      const mobileToTop = window.matchMedia("(max-width: 900px)").matches;
      const toTopThreshold = Math.min(240, window.innerHeight * 0.3);
      if (movement < -0.5 && currentScrollY > toTopThreshold) {
        window.clearTimeout(floatingToTopIdleTimer);
        setToTopVisibility(true);
        floatingToTopIdleTimer = window.setTimeout(() => setToTopVisibility(false), 2000);
      } else if (!mobileToTop || currentScrollY <= toTopThreshold) {
        window.clearTimeout(floatingToTopIdleTimer);
        setToTopVisibility(false);
      }
    }
    if (!header) return;
    if (catalogPage && catalogIntroBoundary) {
      const mobileCatalog = window.matchMedia("(max-width: 620px)").matches;
      const introBottom = catalogIntroBoundary.getBoundingClientRect().bottom + currentScrollY;
      if (mobileCatalog) {
        catalogToolsHaveActivated = false;
        window.cancelAnimationFrame(catalogToolsCollapseFrame);
        catalogToolsCollapseFrame = 0;
        document.body.classList.add("catalog-header-compact");
        document.body.classList.remove(
          "catalog-tools-ready",
          "catalog-tools-collapsed",
          "catalog-tools-hovered",
          "catalog-scroll-advanced-open",
          "catalog-header-scroll-expanded"
        );
        catalogScrollAdvancedToggle?.setAttribute("aria-expanded", "false");
        if (catalogScrollTools instanceof HTMLElement) {
          catalogScrollTools.setAttribute("aria-hidden", "true");
          catalogScrollTools.inert = true;
        }
        if (catalogInlineTools instanceof HTMLElement) {
          catalogInlineTools.setAttribute("aria-hidden", "false");
          catalogInlineTools.inert = false;
        }
        header.classList.remove("is-hidden");
        header.classList.add("is-scrolled");
        downwardTravel = 0;
        previousScrollY = currentScrollY;
        return;
      }
      const productGridTop = catalogProductGrid instanceof HTMLElement
        ? catalogProductGrid.getBoundingClientRect().top + currentScrollY
        : introBottom;
      const activationTools = catalogInlineTools;
      const inlineAdvancedPanel = activationTools?.querySelector("[data-catalog-inline-advanced]");
      const canMeasureClosedTools = !(inlineAdvancedPanel instanceof HTMLElement) || inlineAdvancedPanel.hidden;
      const activationToolsWidth = activationTools instanceof HTMLElement ? activationTools.clientWidth : 0;
      if (
        activationTools instanceof HTMLElement
        && canMeasureClosedTools
        && (catalogToolsActivationHeight === 0 || catalogToolsActivationWidth !== activationToolsWidth)
      ) {
        catalogToolsActivationHeight = activationTools.offsetHeight;
        catalogToolsActivationWidth = activationToolsWidth;
      }
      const expandedToolsHeight = catalogToolsActivationHeight
        || (activationTools instanceof HTMLElement ? activationTools.offsetHeight : 0);
      let catalogActivationBoundary = productGridTop;
      if (catalogProductGrid instanceof HTMLElement) {
        const visibleCards = Array.from(catalogProductGrid.children).filter((card) => card instanceof HTMLElement && !card.hidden);
        const firstCard = visibleCards[0];
        if (firstCard instanceof HTMLElement) {
          const firstRect = firstCard.getBoundingClientRect();
          let firstRowBottom = firstRect.bottom;
          for (const card of visibleCards.slice(1, 6)) {
            const cardRect = card.getBoundingClientRect();
            if (Math.abs(cardRect.top - firstRect.top) > 2) break;
            firstRowBottom = Math.max(firstRowBottom, cardRect.bottom);
          }
          const firstRowHeight = Math.max(1, firstRowBottom - firstRect.top);
          const firstRowBottomAbsolute = firstRowBottom + currentScrollY;
          catalogActivationBoundary = firstRowBottomAbsolute - Math.min(firstRowHeight, expandedToolsHeight);
        }
      }
      const introHeaderBottom = document.body.classList.contains("admin-bar")
        ? 116
        : 84;
      const compactHeaderBottom = document.body.classList.contains("admin-bar")
        ? 86
        : 54;
      const compactHeaderThreshold = Math.max(0, introBottom - introHeaderBottom);
      const toolsActivationThreshold = Math.max(0, catalogActivationBoundary - compactHeaderBottom);
      const meaningfulCatalogMovement = Math.abs(movement) > 0.25;
      if (meaningfulCatalogMovement) {
        const nextDirection = movement < 0 ? "up" : "down";
        if (nextDirection !== catalogHeaderDirectionCandidate) {
          catalogHeaderDirectionCandidate = nextDirection;
          catalogHeaderDirectionTravel = Math.abs(movement);
        } else {
          catalogHeaderDirectionTravel += Math.abs(movement);
        }
        if (catalogHeaderDirectionTravel >= 8) {
          catalogHeaderDirection = catalogHeaderDirectionCandidate;
          catalogHeaderDirectionTravel = 0;
        }
      }
      const isPastCatalogHeaderThreshold = currentScrollY > compactHeaderThreshold;
      const compactHeader = isPastCatalogHeaderThreshold;
      if (!isPastCatalogHeaderThreshold) {
        catalogToolsHaveActivated = false;
      } else if (currentScrollY >= toolsActivationThreshold) {
        catalogToolsHaveActivated = true;
      }
      const toolsReady = catalogToolsHaveActivated;
      const showToolsOnReturn = toolsReady
        && isPastCatalogHeaderThreshold
        && catalogHeaderDirection === "up";

      document.body.classList.toggle("catalog-header-compact", compactHeader);
      document.body.classList.remove("catalog-header-scroll-expanded");
      document.body.classList.toggle("catalog-tools-ready", toolsReady);
      window.cancelAnimationFrame(catalogToolsCollapseFrame);
      catalogToolsCollapseFrame = 0;
      if (!toolsReady) {
        document.body.classList.remove(
          "catalog-tools-collapsed",
          "catalog-tools-hovered",
          "catalog-scroll-advanced-open"
        );
        catalogScrollAdvancedToggle?.setAttribute("aria-expanded", "false");
      } else if (!showToolsOnReturn) {
        document.body.classList.remove("catalog-tools-hovered");
        document.body.classList.add("catalog-tools-collapsed");
        document.body.classList.remove("catalog-scroll-advanced-open");
        catalogScrollAdvancedToggle?.setAttribute("aria-expanded", "false");
      } else {
        document.body.classList.remove("catalog-tools-collapsed");
      }

      const toolsVisible = toolsReady && !document.body.classList.contains("catalog-tools-collapsed");
      if (catalogScrollTools instanceof HTMLElement) {
        catalogScrollTools.setAttribute("aria-hidden", String(!toolsVisible));
        catalogScrollTools.inert = !toolsVisible;
      }
      header.classList.remove("is-hidden");
      header.classList.toggle("is-scrolled", compactHeader);
      downwardTravel = 0;
      previousScrollY = currentScrollY;
      return;
    }
    document.body.classList.remove("catalog-tools-ready", "catalog-tools-collapsed");
    if (isMobilePinnedHeaderPage && window.matchMedia("(max-width: 900px)").matches) {
      header.classList.remove("is-hidden");
      header.classList.toggle("is-scrolled", currentScrollY > 24);
      downwardTravel = 0;
      previousScrollY = currentScrollY;
      return;
    }
    if (isStaticHeaderPage) {
      header.classList.remove("is-hidden", "is-scrolled");
      previousScrollY = currentScrollY;
      return;
    }
    const introBoundaryBottom = introHeaderBoundary instanceof HTMLElement
      ? introHeaderBoundary.getBoundingClientRect().bottom + currentScrollY - header.offsetHeight
      : 0;
    const hideThreshold = isProductPage
      ? header.offsetHeight + 16
      : isScrollRevealHeaderPage
        ? header.offsetHeight + 16
      : introHeaderBoundary
        ? catalogIntroBoundary
          ? introBoundaryBottom
          : Math.max(window.innerHeight - header.offsetHeight, introBoundaryBottom)
        : Math.max(240, window.innerHeight - header.offsetHeight);

    header.classList.toggle("is-scrolled", currentScrollY > 96);

    if (introHeaderBoundary) {
      if (currentScrollY <= hideThreshold || document.body.classList.contains("menu-open")) {
        header.classList.remove("is-hidden");
        downwardTravel = 0;
      } else if (movement < -2) {
        header.classList.remove("is-hidden");
        downwardTravel = 0;
      } else if (movement > 0) {
        downwardTravel += movement;
        if (downwardTravel >= 28) header.classList.add("is-hidden");
      }
      previousScrollY = currentScrollY;
      return;
    }

    if (currentScrollY <= hideThreshold || document.body.classList.contains("menu-open")) {
      header.classList.remove("is-hidden");
      downwardTravel = 0;
    } else if (movement < -2) {
      header.classList.remove("is-hidden");
      downwardTravel = 0;
    } else if (movement > 0) {
      downwardTravel += movement;
      if (downwardTravel >= 28) header.classList.add("is-hidden");
    }

    previousScrollY = currentScrollY;
  };

  const revealCatalogToolsOnHover = () => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (!document.body.classList.contains("catalog-tools-ready") || !(catalogScrollTools instanceof HTMLElement)) return;
    window.clearTimeout(catalogToolsHoverTimer);
    document.body.classList.add("catalog-tools-hovered");
    document.body.classList.remove("catalog-tools-collapsed");
    catalogScrollTools.setAttribute("aria-hidden", "false");
    catalogScrollTools.inert = false;
  };

  const releaseCatalogToolsHover = () => {
    window.clearTimeout(catalogToolsHoverTimer);
    catalogToolsHoverTimer = window.setTimeout(() => {
      if (header?.matches(":hover") || catalogScrollTools?.matches(":hover")) return;
      document.body.classList.remove("catalog-tools-hovered");
    }, 90);
  };

  if (catalogPage && header && catalogScrollTools) {
    header.addEventListener("pointerenter", revealCatalogToolsOnHover);
    header.addEventListener("pointerleave", releaseCatalogToolsHover);
    catalogScrollTools.addEventListener("pointerenter", revealCatalogToolsOnHover);
    catalogScrollTools.addEventListener("pointerleave", releaseCatalogToolsHover);
  }

  let headerSurfaceFrame = 0;
  const requestHeaderSurfaceSync = () => {
    if (headerSurfaceFrame) return;
    headerSurfaceFrame = window.requestAnimationFrame(() => {
      headerSurfaceFrame = 0;
      syncHeaderSurface();
    });
  };

  window.addEventListener("scroll", requestHeaderSurfaceSync, { passive: true });
  window.addEventListener("resize", requestHeaderSurfaceSync, { passive: true });
  if ("ResizeObserver" in window) {
    const pageResizeObserver = new ResizeObserver(requestHeaderSurfaceSync);
    pageResizeObserver.observe(document.body);
  }
  syncHeaderSurface();

  document.querySelectorAll("input[data-placeholder-cycle]").forEach((input, inputIndex) => {
    if (!(input instanceof HTMLInputElement)) return;
    const phrases = (input.dataset.placeholderCycle || "").split("|").map((phrase) => phrase.trim()).filter(Boolean);
    if (phrases.length < 2) return;
    const restingPlaceholder = input.placeholder || phrases[0];
    const isCatalogOverlaySearch = Boolean(input.closest("[data-catalog-tools-overlay]"));
    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let placeholderTimer = 0;

    const stopPlaceholderCycle = () => {
      window.clearTimeout(placeholderTimer);
      placeholderTimer = 0;
    };

    const showRestingPlaceholder = () => {
      stopPlaceholderCycle();
      input.placeholder = restingPlaceholder;
    };

    const pausesForFocus = () => document.activeElement === input
      && !(isCatalogOverlaySearch && document.body.classList.contains("catalog-search-active") && input.value.length === 0);

    const typePlaceholder = () => {
      if (document.hidden || pausesForFocus() || input.value.length > 0) {
        showRestingPlaceholder();
        return;
      }
      const phrase = phrases[phraseIndex];
      characterIndex += deleting ? -1 : 1;
      input.placeholder = phrase.slice(0, Math.max(0, characterIndex));

      let delay = deleting ? 32 : 68;
      if (!deleting && characterIndex >= phrase.length) {
        deleting = true;
        delay = 1550;
      } else if (deleting && characterIndex <= 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        delay = 360;
      }
      placeholderTimer = window.setTimeout(typePlaceholder, delay);
    };

    const startPlaceholderCycle = (delay = 650) => {
      stopPlaceholderCycle();
      if (reducedMotion.matches || document.hidden || pausesForFocus() || input.value.length > 0) {
        input.placeholder = restingPlaceholder;
        return;
      }
      input.placeholder = "";
      characterIndex = 0;
      deleting = false;
      placeholderTimer = window.setTimeout(typePlaceholder, delay);
    };

    input.addEventListener("focus", () => {
      if (isCatalogOverlaySearch && document.body.classList.contains("catalog-search-active") && input.value.length === 0) {
        phraseIndex = 0;
        startPlaceholderCycle(120);
      } else {
        showRestingPlaceholder();
      }
    });
    input.addEventListener("input", () => {
      if (document.activeElement === input || input.value.length > 0) showRestingPlaceholder();
      else startPlaceholderCycle(500);
    });
    input.addEventListener("blur", () => startPlaceholderCycle(600));
    input.form?.addEventListener("reset", () => window.setTimeout(() => startPlaceholderCycle(600), 0));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) showRestingPlaceholder();
      else startPlaceholderCycle(700);
    });
    reducedMotion.addEventListener("change", () => startPlaceholderCycle(0));
    startPlaceholderCycle(650 + inputIndex * 90);
  });

  const contactFormTarget = document.querySelector("#contact-form");
  if (contactFormTarget instanceof HTMLElement && window.location.hash === "#contact-form") {
    const revealContactForm = () => window.setTimeout(() => {
      contactFormTarget.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });
    }, 120);

    if (document.readyState === "complete") revealContactForm();
    else window.addEventListener("load", revealContactForm, { once: true });
  }

  document.querySelectorAll("[data-map-lock]").forEach((map) => {
    const activationButton = map.querySelector("[data-map-activate]");
    const fullscreenHeader = map.querySelector("[data-map-fullscreen-header]");
    const fullscreenClose = map.querySelector("[data-map-fullscreen-close]");
    const mapFrame = map.querySelector("iframe");
    if (!activationButton) return;
    const mobileMap = window.matchMedia("(max-width: 620px)");
    let mapReturnFocus = activationButton;
    const hydrateMapFrame = () => {
      if (!(mapFrame instanceof HTMLIFrameElement) || !mapFrame.dataset.src) return;
      map.classList.add("is-map-loading");
      mapFrame.addEventListener("load", () => {
        map.classList.remove("is-map-loading");
        map.classList.add("is-map-loaded");
      }, { once: true });
      mapFrame.src = mapFrame.dataset.src;
      delete mapFrame.dataset.src;
    };
    hydrateMapFrame();
    const closeFullscreenMap = () => {
      if (!map.classList.contains("is-fullscreen")) return;
      map.classList.remove("is-fullscreen", "is-interactive");
      document.body.classList.remove("map-fullscreen-open");
      if (fullscreenHeader instanceof HTMLElement) fullscreenHeader.hidden = true;
      activationButton.hidden = false;
      mapFrame?.setAttribute("tabindex", "-1");
      mapReturnFocus?.focus({ preventScroll: true });
    };

    const openInteractiveMap = (returnFocus = activationButton) => {
      mapReturnFocus = returnFocus;
      hydrateMapFrame();
      map.classList.add("is-interactive");
      activationButton.hidden = true;
      mapFrame?.setAttribute("tabindex", "0");
      if (mobileMap.matches) {
        map.classList.add("is-fullscreen");
        document.body.classList.add("map-fullscreen-open");
        if (fullscreenHeader instanceof HTMLElement) fullscreenHeader.hidden = false;
        if (fullscreenClose instanceof HTMLButtonElement) {
          fullscreenClose.focus({ preventScroll: true });
        }
        return;
      }
      mapFrame?.focus({ preventScroll: true });
    };

    activationButton.addEventListener("click", () => openInteractiveMap(activationButton));
    document.querySelectorAll("[data-map-fullscreen-trigger]").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        const destination = new URL(trigger.href, window.location.href);
        if (destination.pathname !== window.location.pathname || destination.hash !== `#${map.id}`) return;
        event.preventDefault();
        openInteractiveMap(trigger);
      });
    });

    fullscreenClose?.addEventListener("click", closeFullscreenMap);
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !map.classList.contains("is-fullscreen")) return;
      event.preventDefault();
      closeFullscreenMap();
    });
    mobileMap.addEventListener("change", (event) => {
      if (!event.matches) closeFullscreenMap();
    });
    if (window.location.hash === `#${map.id}`) {
      window.requestAnimationFrame(() => openInteractiveMap(activationButton));
    }
  });

  const footerDisclosures = Array.from(document.querySelectorAll("[data-footer-disclosure]"));
  footerDisclosures.forEach((disclosure) => {
    const toggle = disclosure.querySelector("[data-footer-disclosure-toggle]");
    if (!(toggle instanceof HTMLButtonElement)) return;

    const setExpanded = (expanded) => {
      toggle.setAttribute("aria-expanded", String(expanded));
      if (!expanded) return;
      footerDisclosures.forEach((candidate) => {
        if (candidate === disclosure) return;
        candidate.querySelector("[data-footer-disclosure-toggle]")?.setAttribute("aria-expanded", "false");
      });
      window.requestAnimationFrame(() => {
        disclosure.scrollIntoView({ block: "nearest", behavior: reducedMotion.matches ? "auto" : "smooth" });
      });
    };

    toggle.addEventListener("click", () => {
      setExpanded(toggle.getAttribute("aria-expanded") !== "true");
    });
    disclosure.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return;
      event.preventDefault();
      setExpanded(false);
      toggle.focus();
    });
    setExpanded(false);
  });

  document.querySelectorAll("[data-site-author]").forEach((author) => {
    const toggle = author.querySelector("[data-site-author-toggle]");
    const links = author.querySelector("[data-site-author-links]");
    const close = author.querySelector("[data-site-author-close]");
    if (!(toggle instanceof HTMLButtonElement) || !(links instanceof HTMLElement)) return;

    const setAuthorLinksOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      author.classList.toggle("is-open", open);
      links.hidden = !open;
      if (open) window.requestAnimationFrame(() => links.querySelector("a")?.focus({ preventScroll: true }));
      else toggle.focus({ preventScroll: true });
    };

    toggle.addEventListener("click", () => setAuthorLinksOpen(true));
    close?.addEventListener("click", () => setAuthorLinksOpen(false));
    author.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !author.classList.contains("is-open")) return;
      event.preventDefault();
      setAuthorLinksOpen(false);
    });
  });

  const deliveryCityForm = document.querySelector("[data-delivery-city-form]");

  if (deliveryCityForm instanceof HTMLFormElement) {
    const input = deliveryCityForm.querySelector("input");
    const submit = deliveryCityForm.querySelector("button[type='submit']");
    const submitLabel = deliveryCityForm.querySelector("[data-delivery-submit-label]");
    const reset = deliveryCityForm.querySelector("[data-delivery-search-reset]");
    const status = deliveryCityForm.querySelector("[data-delivery-city-status]");
    const geocoderEndpoint = deliveryCityForm.dataset.geocoderEndpoint || "https://nominatim.openstreetmap.org/search";
    const normalizeCity = (value) => value.trim().toLocaleLowerCase("ru-RU").replaceAll("ё", "е");
    const cityRecords = [
      ["Минск", ["мінск"]],
      ["Брест", []],
      ["Витебск", ["віцебск"]],
      ["Гомель", []],
      ["Гродно", ["гродна"]],
      ["Могилёв", ["магілёў"]],
      ["Барановичи", ["баранавічы"]],
      ["Бобруйск", ["бабруйск"]],
      ["Борисов", ["барысаў"]],
      ["Пинск", []],
      ["Орша", []],
      ["Мозырь", ["мазыр"]],
      ["Солигорск", ["салігорск"]],
      ["Новополоцк", ["наваполацк"]],
      ["Лида", ["ліда"]],
      ["Полоцк", ["полацк"]],
      ["Жлобин", ["жлобін"]],
      ["Светлогорск", ["светлагорск"]],
      ["Речица", ["рэчыца"]],
      ["Слоним", ["слонім"]],
      ["Молодечно", ["маладзечна"]],
      ["Кобрин", ["кобрын"]],
      ["Калинковичи", ["калінкавічы"]],
      ["Рогачёв", ["рагачоў"]],
      ["Горки", ["горкі"]],
      ["Несвиж", ["нясвіж"]],
      ["Новогрудок", ["навагрудак"]],
    ];
    const localCities = new Map();
    cityRecords.forEach(([name, aliases]) => {
      [name, ...aliases].forEach((alias) => localCities.set(normalizeCity(alias), name));
    });
    let requestController = null;
    let searchRequestId = 0;

    const setSearchState = (state, message) => {
      deliveryCityForm.classList.toggle("is-searching", state === "searching");
      deliveryCityForm.classList.toggle("has-error", state === "error");
      deliveryCityForm.classList.toggle("has-success", state === "success");
      if (submit instanceof HTMLButtonElement) submit.disabled = state === "searching";
      if (submitLabel) submitLabel.textContent = state === "searching" ? "Проверяем…" : "Проверить";
      if (status) status.textContent = message;
    };

    const geocodeCity = async (query, key) => {
      requestController?.abort();
      requestController = new AbortController();
      const timeout = window.setTimeout(() => requestController?.abort(), 7000);
      try {
        const params = new URLSearchParams({
          q: `${query}, Беларусь`,
          format: "jsonv2",
          countrycodes: "by",
          limit: "5",
          addressdetails: "1",
          "accept-language": "ru",
        });
        const response = await fetch(`${geocoderEndpoint}?${params}`, {
          signal: requestController.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Geocoder unavailable");
        const results = await response.json();
        const place = results.find((result) => {
          const resultName = result.name || result.display_name?.split(",")[0] || "";
          return ["city", "town", "village", "municipality"].includes(result.addresstype || result.type)
            && normalizeCity(resultName) === key
            && result.address?.country_code === "by";
        });
        return place ? (place.display_name?.split(",")[0] || query) : null;
      } finally {
        window.clearTimeout(timeout);
      }
    };

    deliveryCityForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!(input instanceof HTMLInputElement)) return;
      const query = input.value.trim();
      const key = normalizeCity(query);
      const requestId = ++searchRequestId;
      if (!key) {
        setSearchState("error", "Введите белорусский город");
        input.focus();
        return;
      }

      const localCity = localCities.get(key);
      if (localCity) {
        setSearchState("success", `Доставляем в ${localCity}. Маршрут и стоимость подтвердит менеджер`);
        return;
      }

      setSearchState("searching", "Проверяем город…");
      try {
        const cityName = await geocodeCity(query, key);
        if (requestId !== searchRequestId) return;
        if (!cityName) {
          setSearchState("error", "Введите белорусский город");
          return;
        }
        setSearchState("success", `Доставляем в ${cityName}. Маршрут и стоимость подтвердит менеджер`);
      } catch (error) {
        if (requestId !== searchRequestId) return;
        if (error?.name === "AbortError") setSearchState("error", "Поиск занял слишком много времени. Попробуйте ещё раз");
        else setSearchState("error", "Сервис поиска временно недоступен");
      }
    });

    input?.addEventListener("input", () => {
      if (reset instanceof HTMLButtonElement) reset.disabled = !input.value.trim();
    });
    input?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      deliveryCityForm.requestSubmit(submit instanceof HTMLButtonElement ? submit : undefined);
    });

    deliveryCityForm.addEventListener("reset", (event) => {
      event.preventDefault();
      searchRequestId += 1;
      requestController?.abort();
      requestController = null;
      input.value = "";
      setSearchState("idle", "");
      if (reset instanceof HTMLButtonElement) reset.disabled = true;
      input.focus();
    });
  }

  const photographicSurfaceSelectors = [
    ".collection-card",
    ".story-image",
    ".home-work-media",
    ".request-visual",
    ".catalog-empty figure",
    ".catalog-intro-scene",
    ".services-hero-media",
    ".services-prep figure",
    ".works-intro-media",
    ".works-card-media",
    ".error-visual",
  ];
  const cursorDriftSurfaceSelectors = [
    ".hero-background",
    ...photographicSurfaceSelectors,
    ".home-catalog-feature-media",
  ];

  const revealMotionMedia = window.matchMedia("(prefers-reduced-motion: no-preference)");
  if (revealMotionMedia.matches && "IntersectionObserver" in window) {
    const revealMediaSelectors = [...photographicSurfaceSelectors, ".product-gallery"];
    const revealBlockSelectors = [
      ".section-heading",
      ".story-copy",
      ".details-head",
      ".service-list article",
      ".home-catalog-feature > div:not(.home-catalog-feature-media)",
      ".home-works-head",
      ".home-work-card",
      ".request-copy",
      ".shop-title",
      ".filter-row",
      ".catalog-results-summary",
      ".product-grid > .product-card",
      ".catalog-cta > *",
      ".favorites-intro > *",
      ".favorites-empty",
      ".services-hero-copy",
      ".services-process-head",
      ".services-process-list > article",
      ".services-values > *",
      ".services-delivery-copy > *",
      ".services-delivery-map",
      ".services-prep-copy",
      ".services-directory > a",
      ".services-information-head",
      ".services-measurement-intro",
      ".services-measurement-points > li",
      ".services-delivery-terms > div",
      ".services-installation-head > *",
      ".services-installation-table-wrap",
      ".services-installation-note",
      ".services-aftercare > article",
      ".works-intro-copy",
      ".works-list-head",
      ".works-list > article",
      ".simple-cta > *",
      ".contacts-heading",
      ".contact-directory-row",
      ".contact-disclosure-groups > section",
      ".contact-form-section > *",
      ".product-info",
      ".specs > *",
      ".related-head",
      ".related-grid > .product-card",
      ".error-copy > *",
      ".footer-lead > *",
      ".footer-main > *",
      ".footer-company > *",
    ];
    const revealItems = new Set();
    const mediaSiblingIndexes = new Map();
    const siblingIndexes = new Map();

    document.querySelectorAll(revealMediaSelectors.join(",")).forEach((element) => {
      element.classList.add("reveal-media");
      const parent = element.parentElement;
      const siblingIndex = mediaSiblingIndexes.get(parent) || 0;
      mediaSiblingIndexes.set(parent, siblingIndex + 1);
      element.style.setProperty("--reveal-delay", `${Math.min(siblingIndex * 70, 210)}ms`);
      revealItems.add(element);
    });
    document.querySelectorAll(revealBlockSelectors.join(",")).forEach((element) => {
      element.classList.add("reveal-block");
      const parent = element.parentElement;
      const siblingIndex = siblingIndexes.get(parent) || 0;
      siblingIndexes.set(parent, siblingIndex + 1);
      element.style.setProperty("--reveal-delay", `${Math.min(siblingIndex * 60, 240)}ms`);
      revealItems.add(element);
    });

    document.documentElement.classList.add("reveal-motion");
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px 18% 0px", threshold: 0.01 });

    revealItems.forEach((element) => revealObserver.observe(element));
  }

  const homeReviewStream = document.querySelector("[data-home-review-stream]");
  if (homeReviewStream) {
    const originalCards = Array.from(homeReviewStream.children);
    const clearGenericReveal = (card) => {
      card.classList.remove("reveal-block", "reveal-media", "is-revealed");
      card.querySelectorAll(".reveal-block, .reveal-media, .is-revealed").forEach((element) => {
        element.classList.remove("reveal-block", "reveal-media", "is-revealed");
      });
    };
    originalCards.forEach(clearGenericReveal);

    if (!revealMotionMedia.matches || originalCards.length < 2) {
      homeReviewStream.classList.add("is-static");
    } else {
      originalCards.forEach((card) => {
        const clone = card.cloneNode(true);
        const cardStyles = window.getComputedStyle(card);
        clone.style.setProperty("--review-card-bg", cardStyles.getPropertyValue("--review-card-bg"));
        clone.style.setProperty("--review-card-ink", cardStyles.getPropertyValue("--review-card-ink"));
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("button, a, input, select, textarea, [tabindex]").forEach((control) => {
          control.setAttribute("tabindex", "-1");
        });
        clearGenericReveal(clone);
        homeReviewStream.append(clone);
      });

      let cycleWidth = 0;
      let streamIsVisible = false;
      let streamIsInteracting = false;
      let lastPageScrollY = window.scrollY;
      let lastFrameTime = performance.now();
      let streamAnimationFrame = 0;

      const measureCycle = () => {
        const firstClone = homeReviewStream.children[originalCards.length];
        cycleWidth = firstClone ? firstClone.offsetLeft - originalCards[0].offsetLeft : 0;
      };
      const advanceStream = (distance) => {
        if (!cycleWidth || !distance) return;
        let nextPosition = homeReviewStream.scrollLeft + distance;
        while (nextPosition >= cycleWidth) nextPosition -= cycleWidth;
        while (nextPosition < 0) nextPosition += cycleWidth;
        homeReviewStream.scrollLeft = nextPosition;
      };

      measureCycle();
      if ("ResizeObserver" in window) new ResizeObserver(measureCycle).observe(homeReviewStream);
      else window.addEventListener("resize", measureCycle, { passive: true });

      window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastPageScrollY;
        lastPageScrollY = currentScrollY;
        if (streamIsVisible && !streamIsInteracting && !homeReviewStream.querySelector("[data-review-flip].is-flipped")) {
          advanceStream(scrollDelta * 0.34);
        }
      }, { passive: true });

      homeReviewStream.addEventListener("pointerdown", () => {
        streamIsInteracting = true;
        homeReviewStream.classList.add("is-interacting");
      });
      const endStreamInteraction = () => {
        streamIsInteracting = false;
        homeReviewStream.classList.remove("is-interacting");
      };
      window.addEventListener("pointerup", endStreamInteraction, { passive: true });
      window.addEventListener("pointercancel", endStreamInteraction, { passive: true });

      const animateStream = (frameTime) => {
        const elapsed = Math.min(frameTime - lastFrameTime, 50);
        lastFrameTime = frameTime;
        if (streamIsVisible && !streamIsInteracting && !document.hidden && !homeReviewStream.querySelector("[data-review-flip].is-flipped")) {
          advanceStream(elapsed * 0.016);
        }
        streamAnimationFrame = streamIsVisible ? window.requestAnimationFrame(animateStream) : 0;
      };
      new IntersectionObserver(([entry]) => {
        streamIsVisible = entry.isIntersecting;
        if (!streamIsVisible || streamAnimationFrame) return;
        lastFrameTime = performance.now();
        streamAnimationFrame = window.requestAnimationFrame(animateStream);
      }, { rootMargin: "25% 0px", threshold: 0.01 }).observe(homeReviewStream);
    }
  }

  const reviewFlipCards = Array.from(document.querySelectorAll("[data-review-flip]"));
  if (reviewFlipCards.length) {
    const setReviewFlipState = (card, flipped) => {
      card.classList.toggle("is-flipped", flipped);
      const front = card.querySelector(".review-flip-front");
      const back = card.querySelector(".review-flip-back");
      const toggle = card.querySelector(".review-flip-toggle");
      front?.setAttribute("aria-hidden", String(flipped));
      back?.setAttribute("aria-hidden", String(!flipped));
      if (toggle instanceof HTMLButtonElement) {
        toggle.setAttribute("aria-pressed", String(flipped));
        toggle.setAttribute("aria-label", flipped ? "Вернуться к отзыву" : "Показать фотографию проекта");
      }
    };

    const prepareReviewPhoto = (card) => {
      const image = card.querySelector(".review-flip-back img");
      if (!(image instanceof HTMLImageElement)) return;
      image.loading = "eager";
      if (image.complete && image.naturalWidth > 0) return;
      image.decode?.().catch(() => {});
    };

    reviewFlipCards.forEach((card) => {
      const toggle = card.querySelector(".review-flip-toggle");
      if (!(toggle instanceof HTMLButtonElement)) return;
      let cardPressX = 0;
      let cardPressY = 0;
      let cardPressMoved = false;
      card.addEventListener("pointerenter", () => prepareReviewPhoto(card), { once: true });
      toggle.addEventListener("focus", () => prepareReviewPhoto(card), { once: true });
      toggle.addEventListener("click", () => {
        const nextState = !card.classList.contains("is-flipped");
        if (nextState) {
          reviewFlipCards.forEach((otherCard) => {
            if (otherCard !== card) setReviewFlipState(otherCard, false);
          });
          prepareReviewPhoto(card);
        }
        setReviewFlipState(card, nextState);
      });
      card.addEventListener("pointerdown", (event) => {
        cardPressX = event.clientX;
        cardPressY = event.clientY;
        cardPressMoved = false;
      });
      card.addEventListener("pointermove", (event) => {
        if (Math.hypot(event.clientX - cardPressX, event.clientY - cardPressY) > 8) {
          cardPressMoved = true;
        }
      });
      card.addEventListener("click", (event) => {
        const eventTarget = event.target;
        if (!(eventTarget instanceof Element) || eventTarget.closest(".review-flip-toggle")) return;
        if (cardPressMoved || window.getSelection()?.toString().trim()) return;
        toggle.click();
      });
      card.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !card.classList.contains("is-flipped")) return;
        setReviewFlipState(card, false);
        toggle.focus({ preventScroll: true });
      });
      setReviewFlipState(card, false);
    });
  }

  const homeCollectionStream = document.querySelector("body.home .collection-grid");
  if (homeCollectionStream instanceof HTMLElement) {
    const mobileCollectionLoop = window.matchMedia("(max-width: 620px)");
    const autoplayCollectionLoop = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const originalCollectionCards = Array.from(homeCollectionStream.children).filter((card) => card instanceof HTMLElement);
    let disposeCollectionLoop = null;

    const clearCollectionReveal = (card) => {
      card.classList.remove("reveal-block", "reveal-media", "is-revealed");
      card.style.removeProperty("--reveal-delay");
      card.querySelectorAll(".reveal-block, .reveal-media, .is-revealed").forEach((element) => {
        element.classList.remove("reveal-block", "reveal-media", "is-revealed");
        element.style.removeProperty("--reveal-delay");
      });
    };

    const setupCollectionLoop = () => {
      if (!mobileCollectionLoop.matches || originalCollectionCards.length < 2) return null;

      const controller = new AbortController();
      const beforeFragment = document.createDocumentFragment();
      const afterFragment = document.createDocumentFragment();
      const loopClones = [];
      originalCollectionCards.forEach((card) => {
        const beforeClone = card.cloneNode(true);
        const afterClone = card.cloneNode(true);
        [beforeClone, afterClone].forEach((clone) => {
          clone.dataset.collectionLoopClone = "true";
          clone.setAttribute("aria-hidden", "true");
          clone.tabIndex = -1;
          clearCollectionReveal(clone);
          loopClones.push(clone);
        });
        beforeFragment.append(beforeClone);
        afterFragment.append(afterClone);
      });
      homeCollectionStream.insertBefore(beforeFragment, originalCollectionCards[0]);
      homeCollectionStream.append(afterFragment);
      homeCollectionStream.classList.add("is-looping");

      let cycleStart = 0;
      let cycleWidth = 0;
      let streamIsVisible = false;
      let streamIsInteracting = false;
      let pauseUntil = 0;
      let lastPageScrollY = window.scrollY;
      let lastFrameTime = performance.now();
      let animationFrame = 0;
      let initialized = false;
      let collectionPosition = 0;
      let needsPositionSync = false;
      let collectionScrollFrame = 0;
      let dragPointerId = null;
      let dragStartX = 0;
      let dragStartScrollLeft = 0;
      let dragHasMoved = false;
      let suppressCollectionClick = false;

      const normalizePosition = (position) => {
        if (!cycleWidth) return position;
        while (position >= cycleStart + cycleWidth) position -= cycleWidth;
        while (position < cycleStart) position += cycleWidth;
        return position;
      };
      const measureCycle = () => {
        const afterFirst = homeCollectionStream.children[originalCollectionCards.length * 2];
        const previousOffset = cycleWidth ? normalizePosition(collectionPosition) - cycleStart : 0;
        cycleStart = originalCollectionCards[0].offsetLeft;
        cycleWidth = afterFirst instanceof HTMLElement ? afterFirst.offsetLeft - cycleStart : 0;
        if (!cycleWidth) return;
        collectionPosition = initialized ? cycleStart + Math.max(0, Math.min(previousOffset, cycleWidth - 1)) : cycleStart;
        homeCollectionStream.scrollLeft = collectionPosition;
        initialized = true;
      };
      const advanceCollection = (distance) => {
        if (!cycleWidth || !distance) return;
        collectionPosition = normalizePosition(collectionPosition + distance);
        homeCollectionStream.scrollLeft = collectionPosition;
      };
      measureCycle();
      const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(measureCycle) : null;
      resizeObserver?.observe(homeCollectionStream);
      if (!resizeObserver) window.addEventListener("resize", measureCycle, { passive: true, signal: controller.signal });

      window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastPageScrollY;
        lastPageScrollY = currentScrollY;
        if (streamIsVisible && !streamIsInteracting && scrollDelta > 0) advanceCollection(scrollDelta * 0.42);
      }, { passive: true, signal: controller.signal });

      homeCollectionStream.addEventListener("pointerdown", (event) => {
        streamIsInteracting = true;
        needsPositionSync = true;
        homeCollectionStream.classList.add("is-interacting");
        if (event.pointerType === "touch" || event.button !== 0) return;
        dragPointerId = event.pointerId;
        dragStartX = event.clientX;
        dragStartScrollLeft = homeCollectionStream.scrollLeft;
        dragHasMoved = false;
        homeCollectionStream.setPointerCapture?.(event.pointerId);
      }, { passive: true, signal: controller.signal });
      homeCollectionStream.addEventListener("pointermove", (event) => {
        if (event.pointerId !== dragPointerId) return;
        const distance = event.clientX - dragStartX;
        if (Math.abs(distance) > 3) dragHasMoved = true;
        if (!dragHasMoved) return;
        event.preventDefault();
        collectionPosition = normalizePosition(dragStartScrollLeft - distance);
        homeCollectionStream.scrollLeft = collectionPosition;
      }, { passive: false, signal: controller.signal });
      homeCollectionStream.addEventListener("scroll", () => {
        if (collectionScrollFrame) return;
        collectionScrollFrame = window.requestAnimationFrame(() => {
          collectionScrollFrame = 0;
          if (cycleWidth) collectionPosition = normalizePosition(homeCollectionStream.scrollLeft);
        });
      }, { passive: true, signal: controller.signal });
      homeCollectionStream.addEventListener("click", (event) => {
        if (!suppressCollectionClick) return;
        event.preventDefault();
        event.stopImmediatePropagation();
      }, { capture: true, signal: controller.signal });
      const endCollectionInteraction = (event) => {
        if (!streamIsInteracting) return;
        if (dragPointerId !== null && (!event || event.pointerId === dragPointerId)) {
          if (dragHasMoved) {
            suppressCollectionClick = true;
            window.setTimeout(() => { suppressCollectionClick = false; }, 250);
          }
          if (homeCollectionStream.hasPointerCapture?.(dragPointerId)) homeCollectionStream.releasePointerCapture(dragPointerId);
          dragPointerId = null;
          dragHasMoved = false;
        }
        streamIsInteracting = false;
        pauseUntil = performance.now() + 2400;
        needsPositionSync = true;
        homeCollectionStream.classList.remove("is-interacting");
      };
      window.addEventListener("pointerup", endCollectionInteraction, { passive: true, signal: controller.signal });
      window.addEventListener("pointercancel", endCollectionInteraction, { passive: true, signal: controller.signal });

      const animateCollection = (frameTime) => {
        const elapsed = Math.min(frameTime - lastFrameTime, 50);
        lastFrameTime = frameTime;
        if (streamIsVisible && !streamIsInteracting && !document.hidden && autoplayCollectionLoop.matches && frameTime >= pauseUntil) {
          if (needsPositionSync) {
            collectionPosition = normalizePosition(homeCollectionStream.scrollLeft);
            homeCollectionStream.scrollLeft = collectionPosition;
            needsPositionSync = false;
          }
          advanceCollection(elapsed * 0.014);
        }
        animationFrame = streamIsVisible ? window.requestAnimationFrame(animateCollection) : 0;
      };
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        streamIsVisible = entry.isIntersecting;
        if (!streamIsVisible || animationFrame) return;
        lastFrameTime = performance.now();
        animationFrame = window.requestAnimationFrame(animateCollection);
      }, { rootMargin: "25% 0px", threshold: 0.01 });
      visibilityObserver.observe(homeCollectionStream);

      return () => {
        controller.abort();
        visibilityObserver.disconnect();
        resizeObserver?.disconnect();
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        if (collectionScrollFrame) window.cancelAnimationFrame(collectionScrollFrame);
        loopClones.forEach((clone) => clone.remove());
        homeCollectionStream.classList.remove("is-looping", "is-interacting");
        homeCollectionStream.scrollLeft = 0;
      };
    };

    const syncCollectionLoop = () => {
      disposeCollectionLoop?.();
      disposeCollectionLoop = setupCollectionLoop();
    };
    mobileCollectionLoop.addEventListener("change", syncCollectionLoop);
    syncCollectionLoop();
  }

  const reviewLetterCards = document.querySelectorAll("[data-review-initial]");
  if (reviewLetterCards.length && revealMotionMedia.matches && "IntersectionObserver" in window) {
    document.documentElement.classList.add("review-letter-motion");
    const reviewLetterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-review-letter-visible");
        reviewLetterObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px 10% 0px", threshold: 0.12 });
    reviewLetterCards.forEach((card) => reviewLetterObserver.observe(card));
  }

  const filmFrameSelectors = [
    ".hero-background",
    ".collection-card",
    ".story-image",
    ".home-catalog-feature-media",
    ".home-work-media",
    ".request-visual",
    ".product-image",
    ".gallery-slide",
    ".gallery-lightbox-figure",
    ".catalog-empty figure",
    ".services-hero-media",
    ".services-prep figure",
    ".works-intro-media",
    ".works-card-media",
    ".error-visual",
  ];
  const filmFrameSelector = filmFrameSelectors.join(",");

  document.querySelectorAll("main img").forEach((image, imageIndex) => {
    const deferredSource = image.dataset.src || "";
    const source = image.getAttribute("src") || deferredSource;
    const isCatalogProductImage = Boolean(image.closest("[data-catalog-grid] .product-image"));
    if (
      /\.svg(?:$|\?)/i.test(source)
      || image.matches("[data-gallery-lightbox-image]")
      || image.classList.contains("metro-logo")
      || image.closest("[data-door-configurator]")
    ) return;

    if (!isCatalogProductImage) image.classList.add("film-toned-image");
    if (image.classList.contains("product-image-alt")) return;
    const frame = image.closest(filmFrameSelector);
    if (!frame) return;

    image.classList.add("progressive-image");
    frame.classList.add("image-placeholder-frame");
    frame.setAttribute("aria-busy", "true");
    if (!frame.querySelector(":scope > .image-placeholder")) {
      const placeholder = document.createElement("span");
      placeholder.className = "image-placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      image.insertAdjacentElement("beforebegin", placeholder);
    }

    const applyImageReveal = () => {
      frame.classList.remove("has-image-error");
      frame.classList.add("is-image-loaded");
      frame.setAttribute("aria-busy", "false");
    };
    const revealImage = applyImageReveal;
    const keepPlaceholder = () => {
      frame.classList.add("has-image-error");
      frame.setAttribute("aria-busy", "false");
    };
    image.addEventListener("animationend", (event) => {
      if (event.animationName === "progressive-image-in") image.classList.remove("progressive-image");
    }, { once: true });
    if (deferredSource) {
      image.addEventListener("load", revealImage, { once: true });
      image.addEventListener("error", keepPlaceholder, { once: true });
    } else if (image.complete) {
      if (image.naturalWidth > 0) revealImage();
      else keepPlaceholder();
    } else {
      image.addEventListener("load", revealImage, { once: true });
      image.addEventListener("error", keepPlaceholder, { once: true });
    }

    if (isCatalogProductImage || frame.querySelector(":scope > .film-grain")) return;

    const grain = document.createElement("span");
    grain.className = "film-grain";
    grain.setAttribute("aria-hidden", "true");
    grain.style.setProperty("--grain-x", `${(imageIndex * 37) % 113}px`);
    grain.style.setProperty("--grain-y", `${(imageIndex * 53) % 127}px`);
    grain.style.setProperty("--grain-fine-x", `${-((imageIndex * 29) % 71)}px`);
    grain.style.setProperty("--grain-fine-y", `${-((imageIndex * 43) % 83)}px`);
    image.insertAdjacentElement("afterend", grain);
  });

  const heroCarousel = document.querySelector("[data-hero-carousel]");
  const heroSlides = heroCarousel ? Array.from(heroCarousel.querySelectorAll("[data-hero-slide]")) : [];
  const heroDots = Array.from(document.querySelectorAll("[data-hero-dot]"));
  if (heroCarousel && heroSlides.length > 1) {
    const hero = heroCarousel.closest(".hero");
    let activeHeroSlide = 0;
    let heroAutoplayTimer = 0;
    let touchStart = null;
    let wheelDelta = 0;
    let wheelLocked = false;
    let wheelReleaseTimer = 0;
    let heroPrefetchTimer = 0;
    let heroTransitionRequest = 0;
    let heroInitialSlideReady = false;
    const heroSlideLoads = new WeakMap();

    const hydrateHeroSlide = (slide) => {
      if (!(slide instanceof HTMLImageElement)) {
        return Promise.resolve();
      }
      const pendingLoad = heroSlideLoads.get(slide);
      if (pendingLoad) return pendingLoad;
      if (!slide.dataset.src && !slide.dataset.srcset) {
        return slide.complete ? Promise.resolve() : new Promise((resolve) => {
          slide.addEventListener("load", resolve, { once: true });
          slide.addEventListener("error", resolve, { once: true });
        });
      }

      slide.fetchPriority = "low";
      const loaded = new Promise((resolve) => {
        slide.addEventListener("load", resolve, { once: true });
        slide.addEventListener("error", resolve, { once: true });
      });
      heroSlideLoads.set(slide, loaded);
      if (slide.dataset.srcset) {
        slide.srcset = adaptImageSrcset(slide.dataset.srcset);
        delete slide.dataset.srcset;
      }
      if (slide.dataset.src) {
        slide.src = slide.dataset.src;
        delete slide.dataset.src;
      }
      return slide.complete ? Promise.resolve() : loaded;
    };

    const scheduleHeroSlidePreload = (index, delay = 2400) => {
      window.clearTimeout(heroPrefetchTimer);
      const slide = heroSlides[(index + heroSlides.length) % heroSlides.length];
      if (!(slide instanceof HTMLImageElement) || (!slide.dataset.src && !slide.dataset.srcset)) return;
      heroPrefetchTimer = window.setTimeout(() => {
        heroPrefetchTimer = 0;
        if (document.hidden) {
          scheduleHeroSlidePreload(index, 1600);
          return;
        }
        const preload = () => hydrateHeroSlide(slide);
        if ("requestIdleCallback" in window) window.requestIdleCallback(preload, { timeout: 1400 });
        else preload();
      }, delay);
    };

    const stopHeroAutoplay = () => {
      window.clearTimeout(heroAutoplayTimer);
      heroAutoplayTimer = 0;
      heroDots[0]?.parentElement?.classList.remove("is-autoplay-running");
    };
    const scheduleHeroAutoplay = () => {
      stopHeroAutoplay();
      if (!heroInitialSlideReady || reducedMotion.matches || document.hidden) return;
      const dotNavigation = heroDots[0]?.parentElement;
      if (dotNavigation instanceof HTMLElement) {
        // Restart the active SVG ring from zero whenever a new slide begins.
        void dotNavigation.offsetWidth;
        dotNavigation.classList.add("is-autoplay-running");
      }
      heroAutoplayTimer = window.setTimeout(() => { void showHeroSlide(activeHeroSlide + 1, 1); }, 4000);
    };
    const showHeroSlide = async (requestedIndex, direction = 1) => {
      const nextIndex = (requestedIndex + heroSlides.length) % heroSlides.length;
      if (nextIndex === activeHeroSlide) {
        scheduleHeroAutoplay();
        return;
      }
      stopHeroAutoplay();
      const transitionRequest = ++heroTransitionRequest;
      const outgoingSlide = heroSlides[activeHeroSlide];
      const incomingSlide = heroSlides[nextIndex];
      await hydrateHeroSlide(incomingSlide);
      if (transitionRequest !== heroTransitionRequest) return;
      heroSlides.forEach((slide) => slide.classList.remove("is-previous", "is-entering-next", "is-entering-previous"));
      outgoingSlide.classList.remove("is-active");
      outgoingSlide.classList.add("is-previous");
      incomingSlide.classList.add("is-active");
      if (!reducedMotion.matches) {
        incomingSlide.classList.add(direction > 0 ? "is-entering-next" : "is-entering-previous");
        incomingSlide.addEventListener("animationend", () => {
          incomingSlide.classList.remove("is-entering-next", "is-entering-previous");
        }, { once: true });
      }
      activeHeroSlide = nextIndex;
      heroDots.forEach((dot, index) => dot.setAttribute("aria-current", String(index === activeHeroSlide)));
      scheduleHeroSlidePreload(activeHeroSlide + 1);
      scheduleHeroAutoplay();
    };

    heroDots.forEach((dot) => dot.addEventListener("click", () => {
      const requestedIndex = Number(dot.dataset.heroDot);
      void showHeroSlide(requestedIndex, requestedIndex >= activeHeroSlide ? 1 : -1);
    }));
    hero?.addEventListener("touchstart", (event) => {
      const touch = event.changedTouches[0];
      touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
    }, { passive: true });
    hero?.addEventListener("touchend", (event) => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const distanceX = (touch?.clientX ?? touchStart.x) - touchStart.x;
      const distanceY = (touch?.clientY ?? touchStart.y) - touchStart.y;
      touchStart = null;
      if (Math.abs(distanceX) < 45 || Math.abs(distanceX) < Math.abs(distanceY) * 1.15) return;
      void showHeroSlide(activeHeroSlide + (distanceX < 0 ? 1 : -1), distanceX < 0 ? 1 : -1);
    }, { passive: true });
    hero?.addEventListener("wheel", (event) => {
      // Trackpads report both axes, so capture only a deliberate horizontal
      // gesture and leave ordinary vertical page scrolling untouched.
      const horizontalIntentRatio = window.matchMedia("(max-width: 900px)").matches ? 1.55 : 1.35;
      const clearlyHorizontal = event.shiftKey
        || Math.abs(event.deltaX) > Math.abs(event.deltaY) * horizontalIntentRatio;
      if (!clearlyHorizontal) return;
      const horizontalDelta = event.shiftKey ? event.deltaY : event.deltaX;
      if (Math.abs(horizontalDelta) < 6) return;
      event.preventDefault();
      window.clearTimeout(wheelReleaseTimer);
      wheelReleaseTimer = window.setTimeout(() => {
        wheelDelta = 0;
        wheelLocked = false;
      }, 260);
      if (wheelLocked) return;
      wheelDelta += horizontalDelta;
      if (Math.abs(wheelDelta) < 34) return;
      wheelLocked = true;
      void showHeroSlide(activeHeroSlide + (wheelDelta > 0 ? 1 : -1), wheelDelta > 0 ? 1 : -1);
    }, { passive: false });
    document.addEventListener("visibilitychange", scheduleHeroAutoplay);
    const firstHeroSlide = heroSlides[0];
    const startDeferredHeroSlides = () => {
      heroInitialSlideReady = true;
      scheduleHeroSlidePreload(1, 2600);
      scheduleHeroAutoplay();
    };
    if (firstHeroSlide instanceof HTMLImageElement && !firstHeroSlide.complete) {
      firstHeroSlide.addEventListener("load", startDeferredHeroSlides, { once: true });
      firstHeroSlide.addEventListener("error", startDeferredHeroSlides, { once: true });
    } else {
      startDeferredHeroSlides();
    }
  }

  if (!reducedMotion.matches) {
    const mobileScrollZoom = window.matchMedia("(max-width: 620px)");
    const scrollZoomSurfaces = Array.from(document.querySelectorAll(cursorDriftSurfaceSelectors.join(",")))
      .map((surface) => {
        const images = Array.from(surface.querySelectorAll("img"));
        if (images.length === 0) return null;

        const isReviewMedia = surface.matches(".home-work-media, .works-card-media");
        const isCatalogIntro = surface.matches(".catalog-intro-scene");
        const zoomAmount = isReviewMedia
          ? 0.14
          : (isCatalogIntro ? 0.135 : (surface.matches(".hero-background, .home-catalog-feature-media, .works-intro-media") ? 0.095 : 0.085));
        const mobileZoomMultiplier = isReviewMedia ? 1.5 : (isCatalogIntro ? 1.75 : 2);
        surface.classList.add("scroll-zoom-surface");
        images.forEach((image) => image.classList.add("image-drift-image", "scroll-zoom-image"));
        return { surface, images, zoomAmount, mobileZoomMultiplier };
      })
      .filter(Boolean);
    const activeScrollZoomSurfaces = new Set(scrollZoomSurfaces);

    if ("IntersectionObserver" in window) {
      activeScrollZoomSurfaces.clear();
      const scrollZoomObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const item = scrollZoomSurfaces.find(({ surface }) => surface === entry.target);
          if (!item) return;
          if (entry.isIntersecting) activeScrollZoomSurfaces.add(item);
          else activeScrollZoomSurfaces.delete(item);
        });
        requestScrollZoom();
      }, { rootMargin: "35% 0px", threshold: 0 });
      scrollZoomSurfaces.forEach(({ surface }) => scrollZoomObserver.observe(surface));
    }

    let scrollZoomFrame = 0;
    const renderScrollZoom = () => {
      scrollZoomFrame = 0;
      const viewportHeight = Math.max(window.innerHeight, 1);
      activeScrollZoomSurfaces.forEach(({ surface, images, zoomAmount, mobileZoomMultiplier }) => {
        const bounds = surface.getBoundingClientRect();
        const travel = viewportHeight + Math.max(bounds.height, 1);
        const progress = Math.min(1, Math.max(0, (viewportHeight - bounds.top) / travel));
        const responsiveZoomAmount = zoomAmount * (mobileScrollZoom.matches ? mobileZoomMultiplier : 1);
        const scale = 1 + progress * responsiveZoomAmount;
        images.forEach((image) => image.style.setProperty("--scroll-zoom-scale", scale.toFixed(4)));
      });
    };
    const requestScrollZoom = () => {
      if (!scrollZoomFrame) scrollZoomFrame = window.requestAnimationFrame(renderScrollZoom);
    };

    window.addEventListener("scroll", requestScrollZoom, { passive: true });
    window.addEventListener("resize", requestScrollZoom, { passive: true });
    renderScrollZoom();
  }

  const hoverShieldMedia = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  if (hoverShieldMedia.matches) {
    const hoverShieldTargets = document.querySelectorAll("a.collection-card, a.product-card-link");
    if (hoverShieldTargets.length) {
      const tracker = document.createElement("span");
      tracker.className = "cursor-shield-tracker";
      tracker.setAttribute("aria-hidden", "true");
      tracker.innerHTML = '<span class="cursor-shield-tag"><span class="cursor-shield-art"></span></span>';
      document.body.append(tracker);

      const hueOptions = [0, 42, 92, 168, 228, 304];
      let activeTarget = null;
      let currentX = 0;
      let currentY = 0;
      let targetX = 0;
      let targetY = 0;
      let animationFrame = 0;
      let dismissTimer = 0;
      let lastShownAt = 0;

      const renderShieldPosition = () => {
        currentX += (targetX - currentX) * 0.16;
        currentY += (targetY - currentY) * 0.16;
        tracker.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;

        if (Math.abs(targetX - currentX) > 0.08 || Math.abs(targetY - currentY) > 0.08) {
          animationFrame = window.requestAnimationFrame(renderShieldPosition);
        } else {
          animationFrame = 0;
        }
      };

      const requestShieldFrame = () => {
        if (!animationFrame) animationFrame = window.requestAnimationFrame(renderShieldPosition);
      };

      const hideShield = (target) => {
        if (activeTarget !== target) return;
        activeTarget = null;
        window.clearTimeout(dismissTimer);

        if (Math.random() < 0.34) {
          tracker.classList.remove("is-visible");
          tracker.classList.add("is-falling");
          dismissTimer = window.setTimeout(() => tracker.classList.remove("is-falling"), 820);
        } else {
          tracker.classList.remove("is-visible", "is-falling");
        }
      };

      hoverShieldTargets.forEach((target) => {
        target.addEventListener("pointerenter", (event) => {
          if (event.pointerType === "touch") return;
          const now = performance.now();
          if (now - lastShownAt < 7000 || Math.random() > 0.14) return;
          lastShownAt = now;
          window.clearTimeout(dismissTimer);

          activeTarget = target;
          targetX = event.clientX;
          targetY = event.clientY;
          currentX = targetX;
          currentY = targetY;
          tracker.style.setProperty("--shield-hue", `${hueOptions[Math.floor(Math.random() * hueOptions.length)]}deg`);
          tracker.style.setProperty("--shield-angle", `${(Math.random() * 28 - 14).toFixed(1)}deg`);
          tracker.style.setProperty("--shield-size", `${Math.round(66 + Math.random() * 24)}px`);
          tracker.style.setProperty("--shield-fall-spin", `${Math.round((Math.random() < 0.5 ? -1 : 1) * (70 + Math.random() * 100))}deg`);
          tracker.classList.remove("is-falling");
          tracker.classList.add("is-visible");
          requestShieldFrame();
        });

        target.addEventListener("pointermove", (event) => {
          if (activeTarget !== target || event.pointerType === "touch") return;
          targetX = event.clientX;
          targetY = event.clientY;
          requestShieldFrame();
        });

        target.addEventListener("pointerleave", () => hideShield(target));
      });
    }
  }

  document.querySelectorAll("[data-product-accordions]").forEach((group) => {
    const items = Array.from(group.querySelectorAll(".product-accordion"));
    const mobileAccordion = window.matchMedia("(max-width: 620px)");
    const setAccordionOpen = (item, open) => {
      const button = item.querySelector("[data-product-accordion-toggle]");
      const panel = item.querySelector("[data-product-accordion-panel]");
      if (!(button instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) return;
      const wasOpen = button.getAttribute("aria-expanded") === "true" && !panel.hidden;
      if (wasOpen === open) return;

      const currentHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height;
      panel.getAnimations().forEach((animation) => animation.cancel());
      button.setAttribute("aria-expanded", String(open));
      item.classList.toggle("is-open", open);

      if (reducedMotion.matches) {
        panel.style.height = "";
        panel.style.opacity = "";
        panel.style.willChange = "";
        panel.hidden = !open;
        return;
      }

      if (open) {
        panel.hidden = false;
        panel.style.height = "auto";
        const height = panel.scrollHeight;
        panel.style.willChange = "height";
        const animation = panel.animate([
          { height: `${Math.min(currentHeight, height)}px` },
          { height: `${height}px` },
        ], {
          duration: mobileAccordion.matches ? 260 : 360,
          easing: "cubic-bezier(0.22, 0.8, 0.2, 1)",
          fill: "both",
        });
        animation.finished.then(() => {
          if (button.getAttribute("aria-expanded") !== "true") return;
          animation.cancel();
          panel.style.height = "";
          panel.style.opacity = "";
          panel.style.willChange = "";
        }).catch(() => {});
        return;
      }

      panel.style.willChange = "height";
      const animation = panel.animate([
        { height: `${currentHeight}px` },
        { height: "0px" },
      ], {
        duration: mobileAccordion.matches ? 210 : 300,
        easing: "cubic-bezier(0.22, 0.8, 0.2, 1)",
        fill: "both",
      });
      animation.finished.then(() => {
        if (button.getAttribute("aria-expanded") !== "false") return;
        animation.cancel();
        panel.hidden = true;
        panel.style.height = "";
        panel.style.opacity = "";
        panel.style.willChange = "";
      }).catch(() => {});
    };

    items.forEach((item) => {
      item.querySelector("[data-product-accordion-toggle]")?.addEventListener("click", () => {
        const open = item.classList.contains("is-open");
        items.forEach((candidate) => setAccordionOpen(candidate, candidate === item && !open));
      });
    });
  });

  document.querySelectorAll("[data-product-title]").forEach((shell) => {
    const title = shell.querySelector("[data-product-title-scroll]");
    const copyStatus = shell.querySelector("[data-product-title-copy-status]");
    if (!(shell instanceof HTMLElement) || !(title instanceof HTMLElement)) return;

    let titleMeasureFrame = 0;
    let copyStatusTimer = 0;
    const productTitle = shell.dataset.productTitleFull?.trim() || title.textContent.trim();
    const measureTitleTruncation = () => {
      const computedLimit = Number.parseInt(window.getComputedStyle(title).webkitLineClamp, 10);
      const lineLimit = Number.isFinite(computedLimit) ? computedLimit : (window.matchMedia("(max-width: 620px)").matches ? 2 : 3);
      const titleRange = document.createRange();
      titleRange.selectNodeContents(title);
      const lineTops = Array.from(titleRange.getClientRects()).reduce((tops, rect) => {
        if (!tops.some((top) => Math.abs(top - rect.top) < 2)) tops.push(rect.top);
        return tops;
      }, []);
      return lineTops.length > lineLimit || title.scrollHeight > title.clientHeight + 1;
    };
    const syncTitleAccessibility = () => {
      const truncated = shell.classList.contains("is-truncated");
      const expanded = shell.classList.contains("is-expanded");
      if (truncated) title.setAttribute("aria-expanded", expanded ? "true" : "false");
      else title.removeAttribute("aria-expanded");
      title.setAttribute("aria-label", `${productTitle}. Нажмите, чтобы скопировать${truncated && !expanded ? " и раскрыть" : ""} полное название.`);
    };
    if (copyStatus instanceof HTMLElement) document.body.append(copyStatus);
    const copyProductTitle = async (activationEvent = null) => {
      const titleRect = title.getBoundingClientRect();
      const hasPointerPosition = activationEvent
        && Number.isFinite(activationEvent.clientX)
        && Number.isFinite(activationEvent.clientY)
        && (activationEvent.clientX !== 0 || activationEvent.clientY !== 0);
      const activationX = hasPointerPosition ? activationEvent.clientX : titleRect.left + titleRect.width / 2;
      const activationY = hasPointerPosition ? activationEvent.clientY : titleRect.top + titleRect.height / 2;
      if (!shell.classList.contains("is-expanded") && (shell.classList.contains("is-truncated") || measureTitleTruncation())) {
        shell.classList.add("is-truncated", "is-expanded");
        syncTitleAccessibility();
      }
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(productTitle);
        } catch (error) {
          const fallback = document.createElement("textarea");
          fallback.value = productTitle;
          fallback.setAttribute("readonly", "");
          fallback.style.position = "fixed";
          fallback.style.opacity = "0";
          document.body.append(fallback);
          fallback.select();
          document.execCommand("copy");
          fallback.remove();
        }
      } else {
        const fallback = document.createElement("textarea");
        fallback.value = productTitle;
        fallback.setAttribute("readonly", "");
        fallback.style.position = "fixed";
        fallback.style.opacity = "0";
        document.body.append(fallback);
        fallback.select();
        document.execCommand("copy");
        fallback.remove();
      }
      if (copyStatus instanceof HTMLElement) {
        window.clearTimeout(copyStatusTimer);
        copyStatus.textContent = "Название скопировано";
        copyStatus.style.left = `${activationX}px`;
        copyStatus.style.top = `${activationY}px`;
        copyStatus.classList.remove("is-visible");
        window.requestAnimationFrame(() => {
          const statusRect = copyStatus.getBoundingClientRect();
          const safeX = Math.min(window.innerWidth - statusRect.width / 2 - 8, Math.max(statusRect.width / 2 + 8, activationX));
          const safeY = Math.min(window.innerHeight - statusRect.height / 2 - 8, Math.max(statusRect.height / 2 + 8, activationY));
          copyStatus.style.left = `${safeX}px`;
          copyStatus.style.top = `${safeY}px`;
          copyStatus.classList.add("is-visible");
        });
        copyStatusTimer = window.setTimeout(() => copyStatus.classList.remove("is-visible"), 2200);
      }
    };

    const syncTitleTruncation = () => {
      window.cancelAnimationFrame(titleMeasureFrame);
      titleMeasureFrame = window.requestAnimationFrame(() => {
        if (shell.classList.contains("is-expanded")) return;
        shell.classList.toggle("is-truncated", measureTitleTruncation());
        syncTitleAccessibility();
      });
    };

    title.setAttribute("tabindex", "0");
    title.setAttribute("role", "button");
    syncTitleAccessibility();
    title.addEventListener("click", (event) => copyProductTitle(event));
    title.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      copyProductTitle(event);
    });
    if ("ResizeObserver" in window) {
      const titleObserver = new ResizeObserver(syncTitleTruncation);
      titleObserver.observe(title);
    }
    window.addEventListener("load", syncTitleTruncation, { once: true });
    window.addEventListener("resize", syncTitleTruncation, { passive: true });
    syncTitleTruncation();
  });

  document.querySelectorAll("[data-product-variants]").forEach((variants) => {
    const scroller = variants.querySelector("[data-product-variant-scroll]");
    const currentVariant = variants.querySelector(".product-variant.is-current");
    if (!(scroller instanceof HTMLElement) || !(currentVariant instanceof HTMLElement)) return;

    const syncOverflow = () => scroller.classList.toggle("is-overflowing", scroller.scrollWidth > scroller.clientWidth + 2);
    window.requestAnimationFrame(() => {
      syncOverflow();
      const centeredScrollLeft = currentVariant.offsetLeft - ((scroller.clientWidth - currentVariant.offsetWidth) / 2);
      scroller.scrollLeft = Math.max(0, centeredScrollLeft);
    });
    if ("ResizeObserver" in window) new ResizeObserver(syncOverflow).observe(scroller);
    else window.addEventListener("resize", syncOverflow, { passive: true });
  });

  document.querySelectorAll("[data-product-gallery]").forEach((gallery) => {
    const viewport = gallery.querySelector("[data-gallery-viewport]");
    const gallerySlides = Array.from(gallery.querySelectorAll("[data-gallery-slide]"));
    const galleryDots = Array.from(gallery.querySelectorAll("[data-gallery-dot]"));
    const gallerySwipeHint = gallery.querySelector("[data-product-gallery-swipe-hint]");
    const galleryImages = Array.from(gallery.querySelectorAll("[data-gallery-image-index]"));
    const lightbox = gallery.querySelector("[data-gallery-lightbox]");
    const lightboxFigure = gallery.querySelector(".gallery-lightbox-figure");
    const lightboxImage = gallery.querySelector("[data-gallery-lightbox-image]");
    const lightboxPrevious = gallery.querySelector("[data-gallery-lightbox-prev]");
    const lightboxNext = gallery.querySelector("[data-gallery-lightbox-next]");
    const lightboxCloseButtons = Array.from(gallery.querySelectorAll("[data-gallery-lightbox-close]"));
    const lightboxThumbnails = Array.from(gallery.querySelectorAll("[data-gallery-lightbox-thumb]"));
    const lightboxThumbnailTrack = lightbox.querySelector(".gallery-lightbox-thumbnails");
    const lightboxCurrent = gallery.querySelector("[data-gallery-lightbox-current]");
    const mobileGalleryLayout = window.matchMedia("(max-width: 620px)");
    const canAutoplay = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let selectedLightboxImage = null;
    let lightboxImageIndex = 0;
    let lightboxScale = 1;
    let lightboxPanX = 0;
    let lightboxPanY = 0;
    let touchMode = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartPanX = 0;
    let touchStartPanY = 0;
    let pinchStartDistance = 0;
    let pinchStartScale = 1;
    let suppressLightboxClick = false;
    let thumbnailOverflowFrame = 0;
    let galleryScrollFrame = 0;
    let galleryZoomFrame = 0;
    let galleryAutoplayTimer = 0;
    let activeGallerySlideIndex = 0;
    let zoomedGallerySlideIndex = -1;
    let galleryIsVisible = true;
    let galleryIsInteracting = false;
    let galleryGestureStartX = 0;
    let galleryGestureStartY = 0;
    let galleryGesturePointerType = "";
    let galleryTouchStartX = 0;
    let galleryTouchStartY = 0;
    let galleryGestureStartScrollLeft = 0;
    let galleryManualGestureUntil = 0;
    const gallerySwipeLearnedKey = "bastion-product-gallery-swipe-learned-v3";
    const gallerySwipeLearnedCookie = "bastion_gallery_swipe_learned_v3";

    if (!viewport || galleryImages.length === 0 || !lightbox || !lightboxImage || lightboxCloseButtons.length === 0) return;
    if (gallerySwipeHint instanceof HTMLElement) document.body.append(gallerySwipeHint);
    if (lightbox) document.body.append(lightbox);

    const hasLearnedGallerySwipe = () => {
      try {
        if (window.localStorage.getItem(gallerySwipeLearnedKey) === "1") return true;
      } catch (error) {
        // Fall through to the long-lived cookie when local storage is unavailable.
      }
      return document.cookie.split(";").some((part) => part.trim() === `${gallerySwipeLearnedCookie}=1`);
    };

    const dismissGallerySwipeHint = () => {
      if (!(gallerySwipeHint instanceof HTMLElement) || gallerySwipeHint.hidden) return;
      gallerySwipeHint.classList.add("is-dismissed");
      document.body.classList.remove("product-gallery-hint-visible");
      try {
        window.localStorage.setItem(gallerySwipeLearnedKey, "1");
      } catch (error) {
        // The cookie below keeps the preference when local storage is unavailable.
      }
      document.cookie = `${gallerySwipeLearnedCookie}=1; max-age=315360000; path=/; SameSite=Lax`;
      window.setTimeout(() => {
        gallerySwipeHint.hidden = true;
      }, reducedMotion.matches ? 0 : 320);
    };

    const syncGallerySwipeHintVisibility = () => {
      if (!(gallerySwipeHint instanceof HTMLElement)) return;
      const showGallerySwipeHint = mobileGalleryLayout.matches
        && gallerySlides.length > 1
        && galleryIsVisible
        && !hasLearnedGallerySwipe();
      gallerySwipeHint.hidden = !showGallerySwipeHint;
      if (showGallerySwipeHint) gallerySwipeHint.classList.remove("is-dismissed");
      document.body.classList.toggle("product-gallery-hint-visible", showGallerySwipeHint);
    };

    if (gallerySwipeHint instanceof HTMLElement) {
      gallerySwipeHint.classList.remove("is-dismissed");
      gallerySwipeHint.addEventListener("click", dismissGallerySwipeHint);
      syncGallerySwipeHintVisibility();
    }

    const stopGalleryAutoplay = () => {
      window.clearTimeout(galleryAutoplayTimer);
      galleryAutoplayTimer = 0;
    };

    const syncGalleryZoom = (slideIndex) => {
      if (!mobileGalleryLayout.matches || !canAutoplay.matches) {
        gallerySlides.forEach((slide) => slide.classList.remove("is-gallery-zooming"));
        zoomedGallerySlideIndex = -1;
        return;
      }
      if (slideIndex === zoomedGallerySlideIndex) return;
      zoomedGallerySlideIndex = slideIndex;
      window.cancelAnimationFrame(galleryZoomFrame);
      gallerySlides.forEach((slide) => slide.classList.remove("is-gallery-zooming"));
      galleryZoomFrame = window.requestAnimationFrame(() => {
        galleryZoomFrame = window.requestAnimationFrame(() => {
          gallerySlides[slideIndex]?.classList.add("is-gallery-zooming");
        });
      });
    };

    const syncGalleryPagination = () => {
      window.cancelAnimationFrame(galleryScrollFrame);
      galleryScrollFrame = window.requestAnimationFrame(() => {
        if (!mobileGalleryLayout.matches || gallerySlides.length < 2) return;
        activeGallerySlideIndex = gallerySlides.reduce((closestIndex, slide, slideIndex) => (
          Math.abs(slide.offsetLeft - viewport.scrollLeft) < Math.abs(gallerySlides[closestIndex].offsetLeft - viewport.scrollLeft)
            ? slideIndex
            : closestIndex
        ), 0);
        galleryDots.forEach((dot, dotIndex) => {
          dot.setAttribute("aria-current", dotIndex === activeGallerySlideIndex ? "true" : "false");
        });
        syncGalleryZoom(activeGallerySlideIndex);
      });
    };

    const scheduleGalleryAutoplay = () => {
      stopGalleryAutoplay();
      if (
        !mobileGalleryLayout.matches
        || !canAutoplay.matches
        || gallerySlides.length < 2
        || document.hidden
        || !galleryIsVisible
        || galleryIsInteracting
        || !lightbox.hidden
      ) return;
      galleryAutoplayTimer = window.setTimeout(() => {
        const nextSlideIndex = (activeGallerySlideIndex + 1) % gallerySlides.length;
        viewport.scrollTo({ left: gallerySlides[nextSlideIndex].offsetLeft, behavior: "smooth" });
        activeGallerySlideIndex = nextSlideIndex;
        galleryDots.forEach((dot, dotIndex) => {
          dot.setAttribute("aria-current", dotIndex === activeGallerySlideIndex ? "true" : "false");
        });
        scheduleGalleryAutoplay();
      }, 4800);
    };

    viewport.addEventListener("scroll", () => {
      if (Date.now() <= galleryManualGestureUntil && Math.abs(viewport.scrollLeft - galleryGestureStartScrollLeft) >= 4) {
        dismissGallerySwipeHint();
      }
      syncGalleryPagination();
    }, { passive: true });
    galleryDots.forEach((dot, dotIndex) => {
      dot.addEventListener("click", () => {
        dismissGallerySwipeHint();
        viewport.scrollTo({ left: gallerySlides[dotIndex].offsetLeft, behavior: "smooth" });
        activeGallerySlideIndex = dotIndex;
        syncGalleryPagination();
        scheduleGalleryAutoplay();
      });
    });
    const registerGallerySwipe = (clientX, clientY) => {
      const horizontalTravel = Math.abs(clientX - galleryGestureStartX);
      const verticalTravel = Math.abs(clientY - galleryGestureStartY);
      if (horizontalTravel >= 12 && horizontalTravel > verticalTravel) dismissGallerySwipeHint();
    };
    viewport.addEventListener("pointerdown", (event) => {
      galleryIsInteracting = true;
      galleryGestureStartX = event.clientX;
      galleryGestureStartY = event.clientY;
      galleryGesturePointerType = event.pointerType;
      galleryGestureStartScrollLeft = viewport.scrollLeft;
      galleryManualGestureUntil = Date.now() + 1600;
      stopGalleryAutoplay();
    }, { passive: true });
    viewport.addEventListener("pointermove", (event) => {
      if (galleryIsInteracting) registerGallerySwipe(event.clientX, event.clientY);
    }, { passive: true });
    ["pointerup", "pointercancel"].forEach((eventName) => {
      viewport.addEventListener(eventName, (event) => {
        if (eventName === "pointerup" && galleryIsInteracting) registerGallerySwipe(event.clientX, event.clientY);
        galleryIsInteracting = false;
        galleryGesturePointerType = "";
        syncGalleryPagination();
        scheduleGalleryAutoplay();
      }, { passive: true });
    });
    viewport.addEventListener("touchstart", (event) => {
      if (event.touches.length !== 1) return;
      galleryTouchStartX = event.touches[0].clientX;
      galleryTouchStartY = event.touches[0].clientY;
      galleryGestureStartScrollLeft = viewport.scrollLeft;
      galleryManualGestureUntil = Date.now() + 1600;
      stopGalleryAutoplay();
    }, { passive: true });
    viewport.addEventListener("touchmove", (event) => {
      if (event.touches.length !== 1) return;
      galleryGestureStartX = galleryTouchStartX;
      galleryGestureStartY = galleryTouchStartY;
      registerGallerySwipe(event.touches[0].clientX, event.touches[0].clientY);
    }, { passive: true });
    viewport.addEventListener("touchend", (event) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      galleryGestureStartX = galleryTouchStartX;
      galleryGestureStartY = galleryTouchStartY;
      registerGallerySwipe(touch.clientX, touch.clientY);
      syncGalleryPagination();
      scheduleGalleryAutoplay();
    }, { passive: true });
    viewport.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaX) >= 3 || (event.shiftKey && Math.abs(event.deltaY) >= 3)) dismissGallerySwipeHint();
      scheduleGalleryAutoplay();
    }, { passive: true });
    viewport.addEventListener("keydown", (event) => {
      scheduleGalleryAutoplay();
    });
    document.addEventListener("visibilitychange", scheduleGalleryAutoplay);
    mobileGalleryLayout.addEventListener("change", () => {
      syncGallerySwipeHintVisibility();
      syncGalleryPagination();
      syncGalleryZoom(activeGallerySlideIndex);
      scheduleGalleryAutoplay();
    });
    if ("IntersectionObserver" in window) {
      const galleryVisibilityObserver = new IntersectionObserver(([entry]) => {
        galleryIsVisible = Boolean(entry?.isIntersecting);
        syncGallerySwipeHintVisibility();
        scheduleGalleryAutoplay();
      }, { threshold: 0.2 });
      galleryVisibilityObserver.observe(viewport);
    }
    syncGalleryPagination();
    scheduleGalleryAutoplay();

    const syncLightboxThumbnailOverflow = () => {
      if (!(lightboxThumbnailTrack instanceof HTMLElement)) return;
      window.cancelAnimationFrame(thumbnailOverflowFrame);
      thumbnailOverflowFrame = window.requestAnimationFrame(() => {
        const overflowing = lightboxThumbnailTrack.scrollWidth > lightboxThumbnailTrack.clientWidth + 1;
        const atEnd = !overflowing
          || lightboxThumbnailTrack.scrollLeft + lightboxThumbnailTrack.clientWidth >= lightboxThumbnailTrack.scrollWidth - 2;
        lightboxThumbnailTrack.classList.toggle("is-overflowing", overflowing);
        lightboxThumbnailTrack.classList.toggle("is-at-end", atEnd);
      });
    };

    lightboxThumbnailTrack?.addEventListener("scroll", syncLightboxThumbnailOverflow, { passive: true });
    if ("ResizeObserver" in window && lightboxThumbnailTrack instanceof HTMLElement) {
      const thumbnailTrackObserver = new ResizeObserver(syncLightboxThumbnailOverflow);
      thumbnailTrackObserver.observe(lightboxThumbnailTrack);
    }

    const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
    const touchDistance = (touches) => Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    );
    const applyLightboxTransform = () => {
      lightboxImage.style.setProperty("--lightbox-scale", lightboxScale.toFixed(3));
      lightboxImage.style.setProperty("--lightbox-pan-x", `${lightboxPanX.toFixed(1)}px`);
      lightboxImage.style.setProperty("--lightbox-pan-y", `${lightboxPanY.toFixed(1)}px`);
      lightboxFigure?.classList.toggle("is-zoomed", lightboxScale > 1.01);
    };
    const resetLightboxTransform = () => {
      lightboxScale = 1;
      lightboxPanX = 0;
      lightboxPanY = 0;
      lightboxImage.style.transformOrigin = "50% 50%";
      applyLightboxTransform();
    };
    const suppressNextLightboxClick = () => {
      suppressLightboxClick = true;
      window.setTimeout(() => { suppressLightboxClick = false; }, 350);
    };

    const syncLightboxImage = () => {
      const sourceImage = selectedLightboxImage || galleryImages[lightboxImageIndex];
      if (!sourceImage) return;
      lightboxImageIndex = Math.max(0, galleryImages.indexOf(sourceImage));
      resetLightboxTransform();
      lightboxImage.src = sourceImage.currentSrc || sourceImage.src;
      lightboxImage.alt = sourceImage.alt;
      if (lightboxCurrent) lightboxCurrent.textContent = String(lightboxImageIndex + 1).padStart(2, "0");
      lightboxThumbnails.forEach((thumbnail, thumbnailIndex) => {
        thumbnail.setAttribute("aria-current", thumbnailIndex === lightboxImageIndex ? "true" : "false");
      });
      const activeThumbnail = lightboxThumbnails[lightboxImageIndex];
      if (activeThumbnail && lightboxThumbnailTrack) {
        lightboxThumbnailTrack.scrollTo({
          left: Math.max(0, activeThumbnail.offsetLeft - (lightboxThumbnailTrack.clientWidth - activeThumbnail.offsetWidth) / 2),
          behavior: "smooth",
        });
      }
      syncLightboxThumbnailOverflow();
      if (canAutoplay.matches && !lightbox.hidden) {
        lightboxImage.animate([
          { opacity: 0.45, transform: "scale(1.012)" },
          { opacity: 1, transform: "scale(1)" },
        ], {
          duration: 480,
          easing: "cubic-bezier(0.22, 0.8, 0.2, 1)",
        });
      }
    };

    const openLightbox = (sourceImage = null) => {
      stopGalleryAutoplay();
      selectedLightboxImage = sourceImage instanceof HTMLImageElement ? sourceImage : galleryImages[0];
      lightboxImageIndex = Math.max(0, galleryImages.indexOf(selectedLightboxImage));
      lightbox.hidden = false;
      syncLightboxImage();
      document.body.classList.add("gallery-lightbox-open");
      syncLightboxThumbnailOverflow();
      window.requestAnimationFrame(() => {
        const visibleCloseButton = lightboxCloseButtons.find((button) => button.getClientRects().length > 0);
        visibleCloseButton?.focus({ preventScroll: true });
      });
    };

    const showLightboxImage = (requestedIndex) => {
      if (!galleryImages.length) return;
      lightboxImageIndex = (requestedIndex + galleryImages.length) % galleryImages.length;
      selectedLightboxImage = galleryImages[lightboxImageIndex];
      syncLightboxImage();
    };

    const closeLightbox = () => {
      if (!lightbox || lightbox.hidden) return;
      lightbox.hidden = true;
      resetLightboxTransform();
      document.body.classList.remove("gallery-lightbox-open");
      selectedLightboxImage?.focus({ preventScroll: true });
      scheduleGalleryAutoplay();
    };

    viewport.addEventListener("click", (event) => {
      if (event.target instanceof HTMLImageElement && event.target.matches("[data-gallery-image-index]")) openLightbox(event.target);
    });
    galleryImages.forEach((image) => image.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      openLightbox(image);
    }));
    lightboxPrevious?.addEventListener("click", () => showLightboxImage(lightboxImageIndex - 1));
    lightboxNext?.addEventListener("click", () => showLightboxImage(lightboxImageIndex + 1));
    lightboxThumbnails.forEach((thumbnail, thumbnailIndex) => {
      thumbnail.addEventListener("click", () => showLightboxImage(thumbnailIndex));
    });
    lightboxCloseButtons.forEach((button) => button.addEventListener("click", closeLightbox));
    lightbox?.addEventListener("click", (event) => {
      if (suppressLightboxClick) return;
      if (event.target === lightbox || event.target === lightboxFigure) closeLightbox();
    });
    lightboxImage?.addEventListener("click", (event) => {
      if (!lightboxFigure) return;
      if (suppressLightboxClick) return;
      if (lightboxScale <= 1.01) {
        const bounds = lightboxImage.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width) * 100;
        const y = ((event.clientY - bounds.top) / bounds.height) * 100;
        lightboxImage.style.transformOrigin = `${x.toFixed(1)}% ${y.toFixed(1)}%`;
        lightboxScale = 2;
      } else {
        lightboxScale = 1;
        lightboxPanX = 0;
        lightboxPanY = 0;
      }
      applyLightboxTransform();
    });

    lightbox.addEventListener("touchstart", (event) => {
      if (event.touches.length === 2) {
        touchMode = "pinch";
        pinchStartDistance = touchDistance(event.touches);
        pinchStartScale = lightboxScale;
        lightboxFigure?.classList.add("is-gesturing");
        return;
      }
      const touch = event.touches[0];
      if (!touch) return;
      touchMode = lightboxScale > 1.01 ? "pan" : "swipe";
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartPanX = lightboxPanX;
      touchStartPanY = lightboxPanY;
      lightboxFigure?.classList.add("is-gesturing");
    }, { passive: true });

    lightbox.addEventListener("touchmove", (event) => {
      if (event.touches.length === 2 && touchMode === "pinch") {
        event.preventDefault();
        lightboxScale = clamp(pinchStartScale * (touchDistance(event.touches) / Math.max(1, pinchStartDistance)), 1, 4);
        if (lightboxScale <= 1.01) {
          lightboxPanX = 0;
          lightboxPanY = 0;
        }
        applyLightboxTransform();
        return;
      }
      const touch = event.touches[0];
      if (!touch || touchMode !== "pan") return;
      event.preventDefault();
      const maxPanX = lightboxFigure.clientWidth * (lightboxScale - 1) / 2;
      const maxPanY = lightboxFigure.clientHeight * (lightboxScale - 1) / 2;
      lightboxPanX = clamp(touchStartPanX + touch.clientX - touchStartX, -maxPanX, maxPanX);
      lightboxPanY = clamp(touchStartPanY + touch.clientY - touchStartY, -maxPanY, maxPanY);
      applyLightboxTransform();
    }, { passive: false });

    lightbox.addEventListener("touchend", (event) => {
      if (event.touches.length > 0) return;
      const endedTouch = event.changedTouches[0];
      const distanceX = endedTouch ? endedTouch.clientX - touchStartX : 0;
      const distanceY = endedTouch ? endedTouch.clientY - touchStartY : 0;
      if (touchMode === "swipe" && Math.abs(distanceX) >= 45 && Math.abs(distanceX) > Math.abs(distanceY)) {
        suppressNextLightboxClick();
        showLightboxImage(lightboxImageIndex + (distanceX < 0 ? 1 : -1));
      } else if (touchMode === "pinch" || touchMode === "pan") {
        suppressNextLightboxClick();
      }
      touchMode = null;
      lightboxFigure?.classList.remove("is-gesturing");
    }, { passive: true });

    document.addEventListener("keydown", (event) => {
      if (lightbox.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showLightboxImage(lightboxImageIndex - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showLightboxImage(lightboxImageIndex + 1);
      }
    });
  });

  document.querySelectorAll("[data-related-carousel]").forEach((carousel) => {
    const track = carousel.querySelector("[data-related-track]");
    const previous = carousel.querySelector("[data-related-prev]");
    const next = carousel.querySelector("[data-related-next]");
    if (!track || !previous || !next) return;
    let controlsFrame = 0;
    let autoplayTimer = 0;
    let carouselIsVisible = false;
    let carouselIsInteracting = false;
    const autoplayMotion = window.matchMedia("(prefers-reduced-motion: no-preference)");

    const updateControls = () => {
      const scrollEnd = Math.max(0, track.scrollWidth - track.clientWidth);
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= scrollEnd - 2;
    };
    const requestControlsUpdate = () => {
      if (controlsFrame) return;
      controlsFrame = window.requestAnimationFrame(() => {
        controlsFrame = 0;
        updateControls();
      });
    };
    const move = (direction) => {
      const firstCard = track.querySelector(".product-card");
      if (!firstCard) return;
      const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
      const step = firstCard.getBoundingClientRect().width + gap;
      const currentStep = Math.round(track.scrollLeft / step);
      track.scrollTo({ left: (currentStep + direction) * step, behavior: "smooth" });
    };

    const stopAutoplay = () => {
      window.clearTimeout(autoplayTimer);
      autoplayTimer = 0;
    };

    const scheduleAutoplay = () => {
      stopAutoplay();
      const scrollEnd = Math.max(0, track.scrollWidth - track.clientWidth);
      if (!autoplayMotion.matches || document.hidden || !carouselIsVisible || carouselIsInteracting || scrollEnd <= 2) return;
      autoplayTimer = window.setTimeout(() => {
        const firstCard = track.querySelector(".product-card");
        if (!firstCard) return;
        const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
        const step = firstCard.getBoundingClientRect().width + gap;
        const atEnd = track.scrollLeft >= scrollEnd - 2;
        const target = atEnd ? 0 : Math.min(scrollEnd, (Math.round(track.scrollLeft / step) + 1) * step);
        track.scrollTo({ left: target, behavior: "smooth" });
        scheduleAutoplay();
      }, 3000);
    };

    previous.addEventListener("click", () => {
      move(-1);
      scheduleAutoplay();
    });
    next.addEventListener("click", () => {
      move(1);
      scheduleAutoplay();
    });
    track.addEventListener("scroll", requestControlsUpdate, { passive: true });
    track.addEventListener("pointerdown", () => {
      carouselIsInteracting = true;
      stopAutoplay();
    }, { passive: true });
    ["pointerup", "pointercancel"].forEach((eventName) => {
      track.addEventListener(eventName, () => {
        carouselIsInteracting = false;
        scheduleAutoplay();
      }, { passive: true });
    });
    track.addEventListener("mouseenter", () => {
      carouselIsInteracting = true;
      stopAutoplay();
    });
    track.addEventListener("mouseleave", () => {
      carouselIsInteracting = false;
      scheduleAutoplay();
    });
    track.addEventListener("focusin", () => {
      carouselIsInteracting = true;
      stopAutoplay();
    });
    track.addEventListener("focusout", (event) => {
      if (event.relatedTarget instanceof Node && track.contains(event.relatedTarget)) return;
      carouselIsInteracting = false;
      scheduleAutoplay();
    });
    track.addEventListener("wheel", scheduleAutoplay, { passive: true });
    track.addEventListener("keydown", scheduleAutoplay);
    window.addEventListener("resize", requestControlsUpdate, { passive: true });
    document.addEventListener("visibilitychange", scheduleAutoplay);
    autoplayMotion.addEventListener("change", scheduleAutoplay);
    if ("IntersectionObserver" in window) {
      const carouselObserver = new IntersectionObserver((entries) => {
        carouselIsVisible = entries.some((entry) => entry.isIntersecting);
        scheduleAutoplay();
      }, { threshold: 0.15 });
      carouselObserver.observe(track);
    } else {
      carouselIsVisible = true;
      scheduleAutoplay();
    }
    updateControls();
  });

  document.querySelectorAll("[data-catalog]").forEach((catalog) => {
    const grid = catalog.querySelector("[data-catalog-grid]");
    const categoryButtons = Array.from(catalog.querySelectorAll("[data-catalog-category]"));
    const sortButton = catalog.querySelector("[data-catalog-sort]");
    const orderButton = catalog.querySelector("[data-catalog-order]");
    const searchInput = catalog.querySelector("[data-catalog-search]");
    const searchCloseButtons = Array.from(catalog.querySelectorAll("[data-catalog-search-close]"));
    const searchSubmit = catalog.querySelector("[data-catalog-search-submit]");
    const searchClear = catalog.querySelector("[data-catalog-search-clear]");
    const searchOverlay = catalog.querySelector("[data-catalog-tools-overlay]");
    const searchDialog = searchOverlay?.querySelector(".catalog-tools-dialog");
    const advancedToggle = catalog.querySelector("[data-catalog-advanced-toggle]");
    const advancedPanel = catalog.querySelector("[data-catalog-advanced-panel]");
    const advancedReset = catalog.querySelector("[data-catalog-advanced-reset]");
    const mobileHeaderReset = catalog.querySelector("[data-catalog-mobile-reset]");
    const advancedCount = catalog.querySelector("[data-catalog-advanced-count]");
    const gridCycleButtons = Array.from(catalog.querySelectorAll("[data-catalog-grid-cycle]"));
    const advancedOptions = Array.from(catalog.querySelectorAll("[data-catalog-advanced-option]"));
    const inlineSearchInput = catalog.querySelector("[data-catalog-inline-search]");
    const inlineTools = catalog.querySelector("[data-catalog-inline-tools]");
    const inlineSearchSubmit = catalog.querySelector("[data-catalog-inline-search-submit]");
    const inlineSearchClear = catalog.querySelector("[data-catalog-inline-search-clear]");
    const inlineReset = catalog.querySelector("[data-catalog-inline-reset]");
    const inlineCategoryButtons = Array.from(catalog.querySelectorAll("[data-catalog-inline-category]"));
    const inlineFilterButtons = Array.from(catalog.querySelectorAll("[data-catalog-inline-filter]"));
    const inlineOrderButton = catalog.querySelector("[data-catalog-inline-order]");
    const inlineSortButton = catalog.querySelector("[data-catalog-inline-sort]");
    const inlineAdvancedToggle = catalog.querySelector("[data-catalog-inline-advanced-toggle]");
    const inlineAdvancedPanel = catalog.querySelector("[data-catalog-inline-advanced]");
    const quickReset = catalog.querySelector("[data-catalog-quick-reset]");
    const quickCategoryButtons = Array.from(catalog.querySelectorAll("[data-catalog-quick-category]"));
    const quickFilterButtons = Array.from(catalog.querySelectorAll("[data-catalog-quick-filter]"));
    const quickSortButton = catalog.querySelector("[data-catalog-quick-sort]");
    const quickAdvancedToggle = catalog.querySelector("[data-catalog-quick-advanced]");
    const quickAdvancedCount = catalog.querySelector("[data-catalog-quick-advanced-count]");
    const priceRange = catalog.querySelector("[data-catalog-price-range]");
    const priceMinRange = catalog.querySelector("[data-catalog-price-min-range]");
    const priceMaxRange = catalog.querySelector("[data-catalog-price-max-range]");
    const priceMinInput = catalog.querySelector("[data-catalog-price-min-input]");
    const priceMaxInput = catalog.querySelector("[data-catalog-price-max-input]");
    const quickPriceRange = catalog.querySelector("[data-catalog-quick-price-range]");
    const quickPriceMinRange = catalog.querySelector("[data-catalog-quick-price-min-range]");
    const quickPriceMaxRange = catalog.querySelector("[data-catalog-quick-price-max-range]");
    const quickPriceMinInput = catalog.querySelector("[data-catalog-quick-price-min-input]");
    const quickPriceMaxInput = catalog.querySelector("[data-catalog-quick-price-max-input]");
    const inlinePriceRange = catalog.querySelector("[data-catalog-inline-price-range]");
    const inlinePriceMinRange = catalog.querySelector("[data-catalog-inline-price-min-range]");
    const inlinePriceMaxRange = catalog.querySelector("[data-catalog-inline-price-max-range]");
    const inlinePriceMinInput = catalog.querySelector("[data-catalog-inline-price-min-input]");
    const inlinePriceMaxInput = catalog.querySelector("[data-catalog-inline-price-max-input]");
    const countShown = catalog.querySelector("[data-catalog-shown]");
    const countTotal = catalog.querySelector("[data-catalog-total]");
    const empty = catalog.querySelector("[data-catalog-empty]");
    const showAllButton = catalog.querySelector("[data-catalog-show-all]");
    const loadMoreButton = catalog.querySelector("[data-catalog-load-more]");
    const loadMoreStatus = catalog.querySelector("[data-catalog-load-status]");
    const loadMoreWrap = loadMoreButton?.closest(".catalog-load-more");
    if (!grid || categoryButtons.length === 0) return;

    let catalogOverlayScrollFrame = 0;
    const syncCatalogOverlayScrolling = () => {
      if (!(searchDialog instanceof HTMLElement)) return;
      window.cancelAnimationFrame(catalogOverlayScrollFrame);
      catalogOverlayScrollFrame = window.requestAnimationFrame(() => {
        const canScroll = window.matchMedia("(max-width: 620px)").matches
          && document.body.classList.contains("catalog-search-active")
          && searchDialog.scrollHeight > searchDialog.clientHeight + 1;
        searchDialog.classList.toggle("is-scrollable", canScroll);
        if (!canScroll) searchDialog.scrollTop = 0;
      });
    };
    window.addEventListener("resize", syncCatalogOverlayScrolling, { passive: true });
    window.visualViewport?.addEventListener("resize", syncCatalogOverlayScrolling, { passive: true });

    const catalogSortStatus = document.createElement("span");
    catalogSortStatus.className = "product-title-copy-status catalog-sort-status";
    catalogSortStatus.setAttribute("role", "status");
    catalogSortStatus.setAttribute("aria-live", "polite");
    catalogSortStatus.setAttribute("aria-atomic", "true");
    let catalogSortStatusTimer = 0;

    const hideCatalogSortStatus = () => {
      window.clearTimeout(catalogSortStatusTimer);
      catalogSortStatus.classList.remove("is-visible");
    };

    const showCatalogSortStatus = (sortState, sourceButton) => {
      if (!(sourceButton instanceof HTMLElement)) return;
      const statusLabels = {
        asc: "Цена: по возрастанию",
        desc: "Цена: по убыванию",
        "": "Сортировка по цене выключена",
        newest: "Сначала новые модели",
        popular: "Сначала популярные модели",
        alpha: "Модели по алфавиту",
        defaultOrder: "Порядок по умолчанию",
      };

      window.clearTimeout(catalogSortStatusTimer);
      catalogSortStatus.textContent = statusLabels[sortState] || statusLabels[""];
      catalogSortStatus.style.removeProperty("--catalog-status-shift-x");
      catalogSortStatus.classList.remove("is-visible");
      sourceButton.append(catalogSortStatus);
      window.requestAnimationFrame(() => {
        const statusRect = catalogSortStatus.getBoundingClientRect();
        let shiftX = 0;
        if (statusRect.left < 8) shiftX = 8 - statusRect.left;
        else if (statusRect.right > window.innerWidth - 8) shiftX = window.innerWidth - 8 - statusRect.right;
        catalogSortStatus.style.setProperty("--catalog-status-shift-x", `${shiftX}px`);
        catalogSortStatus.classList.add("is-visible");
      });
      catalogSortStatusTimer = window.setTimeout(hideCatalogSortStatus, 1200);
    };

    document.addEventListener("pointerdown", hideCatalogSortStatus, { passive: true });
    document.addEventListener("keydown", hideCatalogSortStatus);

    const cards = Array.from(grid.querySelectorAll(".product-card"));
    const catalogPrices = cards.map((card) => Number(card.dataset.price)).filter(Number.isFinite);
    const priceStep = 10;
    const priceFloor = catalogPrices.length ? Math.floor(Math.min(...catalogPrices) / priceStep) * priceStep : 0;
    const detectedPriceCeiling = catalogPrices.length ? Math.ceil(Math.max(...catalogPrices) / priceStep) * priceStep : 10000;
    const priceCeiling = Math.max(priceFloor + priceStep, detectedPriceCeiling);
    const requestedPriceParams = new URLSearchParams(window.location.search);
    const catalogFiltersKey = "bastion-catalog-filters";
    const catalogFilterParams = ["product_cat", "catalog_search", "price_sort", "catalog_order", "catalog_price_min", "catalog_price_max", "catalog_filters"];
    try {
      window.localStorage.removeItem(catalogFiltersKey);
    } catch {
      // Filters still reset for this page when local storage is unavailable.
    }
    const hadCatalogFilterParams = catalogFilterParams.some((key) => requestedPriceParams.has(key));
    catalogFilterParams.forEach((key) => requestedPriceParams.delete(key));
    if (hadCatalogFilterParams) {
      const cleanQuery = requestedPriceParams.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}${window.location.hash}`);
    }
    const requestedFilterValue = (urlKey, savedKey, fallback = "") => fallback;
    const clampPrice = (value, fallback) => Math.min(priceCeiling, Math.max(priceFloor, Number.isFinite(value) ? value : fallback));
    const requestedPrice = (key, savedKey, fallback) => Number(requestedFilterValue(key, savedKey, fallback));
    let activeMinPrice = clampPrice(requestedPrice("catalog_price_min", "minPrice", priceFloor), priceFloor);
    let activeMaxPrice = clampPrice(requestedPrice("catalog_price_max", "maxPrice", priceCeiling), priceCeiling);
    if (activeMinPrice > activeMaxPrice) [activeMinPrice, activeMaxPrice] = [activeMaxPrice, activeMinPrice];

    const syncPriceControls = () => {
      const span = priceCeiling - priceFloor;
      const start = ((activeMinPrice - priceFloor) / span) * 100;
      const end = ((activeMaxPrice - priceFloor) / span) * 100;
      [priceRange, quickPriceRange, inlinePriceRange].forEach((control) => {
        if (!(control instanceof HTMLElement)) return;
        control.style.setProperty("--price-start", `${start}%`);
        control.style.setProperty("--price-end", `${end}%`);
      });
      [priceMinRange, priceMaxRange, priceMinInput, priceMaxInput, quickPriceMinRange, quickPriceMaxRange, quickPriceMinInput, quickPriceMaxInput, inlinePriceMinRange, inlinePriceMaxRange, inlinePriceMinInput, inlinePriceMaxInput].forEach((control) => {
        if (!(control instanceof HTMLInputElement)) return;
        control.min = String(priceFloor);
        control.max = String(priceCeiling);
        control.step = String(priceStep);
      });
      if (priceMinRange instanceof HTMLInputElement) priceMinRange.value = String(activeMinPrice);
      if (priceMaxRange instanceof HTMLInputElement) priceMaxRange.value = String(activeMaxPrice);
      if (priceMinInput instanceof HTMLInputElement) priceMinInput.value = String(activeMinPrice);
      if (priceMaxInput instanceof HTMLInputElement) priceMaxInput.value = String(activeMaxPrice);
      if (quickPriceMinRange instanceof HTMLInputElement) quickPriceMinRange.value = String(activeMinPrice);
      if (quickPriceMaxRange instanceof HTMLInputElement) quickPriceMaxRange.value = String(activeMaxPrice);
      if (quickPriceMinInput instanceof HTMLInputElement) quickPriceMinInput.value = String(activeMinPrice);
      if (quickPriceMaxInput instanceof HTMLInputElement) quickPriceMaxInput.value = String(activeMaxPrice);
      if (inlinePriceMinRange instanceof HTMLInputElement) inlinePriceMinRange.value = String(activeMinPrice);
      if (inlinePriceMaxRange instanceof HTMLInputElement) inlinePriceMaxRange.value = String(activeMaxPrice);
      if (inlinePriceMinInput instanceof HTMLInputElement) inlinePriceMinInput.value = String(activeMinPrice);
      if (inlinePriceMaxInput instanceof HTMLInputElement) inlinePriceMaxInput.value = String(activeMaxPrice);
    };
    syncPriceControls();
    const priceRangeGroups = [priceRange, quickPriceRange, inlinePriceRange].filter((control) => control instanceof HTMLElement);
    let priceRangeHintUsed = false;
    let priceRangeHintTimer = 0;
    const stopPriceRangeHints = () => {
      priceRangeHintUsed = true;
      window.clearTimeout(priceRangeHintTimer);
      priceRangeGroups.forEach((control) => control.classList.remove("is-price-hinting"));
    };
    const startPriceRangeHint = (control) => {
      if (priceRangeHintUsed || reducedMotion.matches || !(control instanceof HTMLElement)) return;
      control.classList.remove("is-price-hinting");
      window.requestAnimationFrame(() => control.classList.add("is-price-hinting"));
      window.clearTimeout(priceRangeHintTimer);
      priceRangeHintTimer = window.setTimeout(() => {
        priceRangeGroups.forEach((group) => group.classList.remove("is-price-hinting"));
      }, 5200);
    };
    const visiblePriceRangeObserver = "IntersectionObserver" in window
      ? new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          startPriceRangeHint(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.55 })
      : null;
    priceRangeGroups.forEach((control) => {
      visiblePriceRangeObserver?.observe(control);
      control.querySelectorAll('input[type="range"]').forEach((input) => {
        ["pointerdown", "keydown", "input"].forEach((eventName) => input.addEventListener(eventName, stopPriceRangeHints, { once: true }));
      });
    });
    const catalogGridKey = "bastion-catalog-grid-v3";
    const catalogGridModes = ["large", "medium", "compact"];
    const syncCatalogImageSizes = (mode) => {
      const sizes = mode === "large"
        ? "(max-width: 620px) 50vw, (max-width: 900px) 33vw, 25vw"
        : mode === "compact"
          ? "(max-width: 620px) 50vw, (max-width: 900px) 20vw, 14vw"
          : "(max-width: 620px) 50vw, (max-width: 900px) 25vw, 20vw";
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
    const setCatalogGrid = (requestedMode, persist = true) => {
      const mode = catalogGridModes.includes(requestedMode) ? requestedMode : "medium";
      grid.classList.remove("is-single-column");
      grid.dataset.gridMode = mode;
      syncCatalogImageSizes(mode);
      const nextMode = catalogGridModes[(catalogGridModes.indexOf(mode) + 1) % catalogGridModes.length];
      const modeCount = { large: 4, medium: 5, compact: 7 };
      const modeNoun = mode === "large" ? "карточки" : "карточек";
      gridCycleButtons.forEach((button) => {
        button.dataset.gridMode = mode;
        button.setAttribute("aria-label", `Сетка: ${modeCount[mode]} ${modeNoun} в ряд${mode === "compact" ? ", без подписей" : ""}. Переключить на ${modeCount[nextMode]}`);
      });
      if (!persist) return;
      try {
        window.localStorage.setItem(catalogGridKey, mode);
      } catch {
        // The selected layout remains active for the current page when storage is unavailable.
      }
    };
    let savedCatalogGrid = "medium";
    try {
      savedCatalogGrid = window.localStorage.getItem(catalogGridKey) || "medium";
    } catch {
      savedCatalogGrid = "medium";
    }
    setCatalogGrid(savedCatalogGrid, false);
    gridCycleButtons.forEach((button) => button.addEventListener("click", () => {
      const currentIndex = catalogGridModes.indexOf(grid.dataset.gridMode || "medium");
      setCatalogGrid(catalogGridModes[(currentIndex + 1) % catalogGridModes.length]);
    }));
    cards.forEach((card, index) => { card.dataset.catalogOrder = String(index); });
    const catalogImageLoads = new WeakMap();
    const hydrateDeferredImage = (image) => {
      if (!(image instanceof HTMLImageElement) || !image.dataset.src) return Promise.resolve();
      const pendingLoad = catalogImageLoads.get(image);
      if (pendingLoad) return pendingLoad;
      image.classList.remove("is-deferred-image-error");
      image.classList.add("is-deferred-image-loading");
      const loaded = new Promise((resolve) => {
        const frame = image.closest(".product-image");
        let settled = false;
        const revealLoadedImage = async () => {
          if (settled) return;
          settled = true;
          try {
            if (typeof image.decode === "function") await image.decode();
          } catch {
            // A completed image can still be painted when decode() is unavailable
            // or rejects because the browser released an intermediate frame.
          }
          await new Promise((paintReady) => window.requestAnimationFrame(paintReady));
          image.classList.remove("is-deferred-image-loading");
          image.classList.add("is-deferred-image-loaded");
          if (!image.classList.contains("product-image-alt")) {
            frame?.classList.remove("has-image-error");
            frame?.classList.add("is-image-loaded");
            frame?.setAttribute("aria-busy", "false");
          }
          resolve();
        };
        const markImageError = () => {
          if (settled) return;
          settled = true;
          image.classList.remove("is-deferred-image-loading");
          image.classList.add("is-deferred-image-error");
          if (!image.classList.contains("product-image-alt")) {
            frame?.classList.add("has-image-error");
            frame?.setAttribute("aria-busy", "false");
          }
          resolve();
        };
        image.addEventListener("load", revealLoadedImage, { once: true });
        image.addEventListener("error", markImageError, { once: true });
      });
      catalogImageLoads.set(image, loaded);
      image.decoding = "async";
      image.loading = "eager";
      image.fetchPriority = slowCatalogConnection ? "low" : "auto";
      if (image.dataset.srcset) {
        image.srcset = adaptImageSrcset(image.dataset.srcset);
        delete image.dataset.srcset;
      }
      image.src = image.dataset.src;
      delete image.dataset.src;
      return loaded;
    };
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const slowCatalogConnection = Boolean(connection && (connection.saveData || /(^|-)2g$|3g/.test(connection.effectiveType || "")));
    document.body.classList.toggle("is-slow-catalog-connection", slowCatalogConnection);
    const reportedDeviceMemory = Number(navigator.deviceMemory) || 0;
    const reportedProcessorCount = Number(navigator.hardwareConcurrency) || 0;
    const constrainedCatalogDevice = slowCatalogConnection
      || (reportedDeviceMemory > 0 && reportedDeviceMemory <= 4)
      || (reportedProcessorCount > 0 && reportedProcessorCount <= 4);
    const mobileCatalogViewport = window.matchMedia("(max-width: 620px)").matches;
    const catalogImageConcurrency = slowCatalogConnection
      ? 1
      : (constrainedCatalogDevice ? 2 : (mobileCatalogViewport ? 3 : 5));
    const catalogImageQueue = [];
    const queuedCatalogImages = new WeakMap();
    let activeCatalogImageLoads = 0;
    const drainCatalogImageQueue = () => {
      while (activeCatalogImageLoads < catalogImageConcurrency && catalogImageQueue.length) {
        const queueEntry = catalogImageQueue.shift();
        const { image, allowHidden } = queueEntry;
        queuedCatalogImages.delete(image);
        if (!(image instanceof HTMLImageElement) || !image.dataset.src) continue;
        const card = image.closest(".product-card");
        if (!(card instanceof HTMLElement) || (card.hidden && !allowHidden)) continue;
        activeCatalogImageLoads += 1;
        card.classList.add("is-catalog-image-loading");
        hydrateDeferredImage(image).finally(() => {
          activeCatalogImageLoads -= 1;
          card.classList.remove("is-catalog-image-loading");
          if (!card.querySelector("img[data-src]:not(.product-image-alt)")) card.classList.add("is-catalog-image-loaded");
          window.requestAnimationFrame(drainCatalogImageQueue);
        });
      }
    };
    const enqueueCatalogCard = (card, allowHidden = false) => {
      if (!(card instanceof HTMLElement)) return;
      card.querySelectorAll("img[data-src]:not(.product-image-alt)").forEach((image) => {
        if (!(image instanceof HTMLImageElement)) return;
        const queuedEntry = queuedCatalogImages.get(image);
        if (queuedEntry) {
          if (allowHidden) queuedEntry.allowHidden = true;
          return;
        }
        const queueEntry = { image, allowHidden };
        queuedCatalogImages.set(image, queueEntry);
        catalogImageQueue.push(queueEntry);
      });
      drainCatalogImageQueue();
    };
    const prewarmCatalogCardImages = (card) => enqueueCatalogCard(card, true);
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      cards.forEach((card) => {
        const hydrateAlternate = () => card.querySelectorAll("img.product-image-alt[data-src]").forEach(hydrateDeferredImage);
        card.addEventListener("pointerenter", hydrateAlternate, { once: true });
        card.addEventListener("focusin", hydrateAlternate, { once: true });
      });
    }
    const getCatalogColumnCount = () => {
      if (window.matchMedia("(max-width: 520px)").matches) return 2;
      if (window.matchMedia("(max-width: 900px)").matches) return 3;
      return 4;
    };
    const getBatchSize = () => {
      const columns = getCatalogColumnCount();
      // Give phones six complete rows up front so the catalogue does not feel
      // artificially interrupted after only eight products.
      return columns * (window.matchMedia("(max-width: 520px)").matches ? 6 : 3);
    };
    let catalogReturnState = null;
    try {
      const savedState = JSON.parse(window.sessionStorage.getItem(catalogReturnKey) || "null");
      if (savedState?.restore && savedState.url === window.location.href) catalogReturnState = savedState;
    } catch {
      catalogReturnState = null;
    }
    let visibleLimit = Math.max(getBatchSize(), Number(catalogReturnState?.visibleLimit) || 0);
    let currentMatchingCards = [];
    let catalogPrewarmRevision = 0;
    const scheduleCatalogPrewarm = (nextCards) => {
      const revision = ++catalogPrewarmRevision;
      window.setTimeout(() => {
        if (revision !== catalogPrewarmRevision) return;
        nextCards.forEach((card) => {
          if (card.hidden) prewarmCatalogCardImages(card);
        });
      }, slowCatalogConnection ? 220 : 40);
    };
    const initialCategory = categoryButtons.find((button) => button.getAttribute("aria-pressed") === "true")?.dataset.catalogCategory || "";
    // Category cards on the home page arrive with a server-selected button.
    // Use that state for the first render even though the URL is cleaned below.
    let activeCategory = initialCategory;
    const requestedSort = "";
    let activeSort = ["asc", "desc"].includes(requestedSort) ? requestedSort : "";
    let activeOrder = "";
    let appliedSearchValue = "";
    let catalogSearchDraft = null;
    if (searchInput instanceof HTMLInputElement) searchInput.value = appliedSearchValue;
    if (inlineSearchInput instanceof HTMLInputElement) inlineSearchInput.value = appliedSearchValue;
    const normalizeSearch = (value) => value.trim().toLocaleLowerCase("ru");
    const requestedAdvancedValue = requestedFilterValue("catalog_filters", "filters", []);
    const requestedAdvancedFilters = new Set((Array.isArray(requestedAdvancedValue) ? requestedAdvancedValue : String(requestedAdvancedValue).split(",")).filter(Boolean));
    advancedOptions.forEach((button) => {
      const isActive = requestedAdvancedFilters.has(button.dataset.filterValue || "");
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    const activeAdvancedOptions = () => advancedOptions.filter((button) => button.getAttribute("aria-pressed") === "true");
    let syncCatalogSearchActions = () => {};
    const matchesAdvancedFilters = (card, searchText) => {
      const cardColors = (card.dataset.colors || "").split(" ").filter(Boolean);
      const groupedOptions = new Map();
      activeAdvancedOptions().forEach((button) => {
        const group = button.dataset.filterGroup || "other";
        if (!groupedOptions.has(group)) groupedOptions.set(group, []);
        groupedOptions.get(group).push(button);
      });
      return Array.from(groupedOptions.values()).every((buttons) => buttons.some((button) => {
        const colors = (button.dataset.filterColors || "").split(",").filter(Boolean);
        if (colors.length) return colors.some((color) => cardColors.includes(color));
        const keywords = (button.dataset.filterKeywords || "").split("|").map(normalizeSearch).filter(Boolean);
        return keywords.some((keyword) => searchText.includes(keyword));
      }));
    };
    const syncAdvancedControls = () => {
      const activeCount = activeAdvancedOptions().length;
      const hasAppliedFilters = activeCount > 0
        || activeCategory !== ""
        || appliedSearchValue !== ""
        || activeSort !== ""
        || activeOrder !== ""
        || activeMinPrice !== priceFloor
        || activeMaxPrice !== priceCeiling;
      if (advancedCount) {
        advancedCount.textContent = String(activeCount);
        advancedCount.hidden = activeCount === 0;
      }
      if (advancedReset) advancedReset.hidden = !hasAppliedFilters;
      if (inlineReset) inlineReset.hidden = !hasAppliedFilters;
      if (quickReset) quickReset.hidden = !hasAppliedFilters;
      if (mobileHeaderReset) mobileHeaderReset.hidden = !hasAppliedFilters;
      advancedToggle?.classList.toggle("has-filters", activeCount > 0);
      quickAdvancedToggle?.classList.toggle("has-filters", activeCount > 0);
      inlineAdvancedToggle?.classList.toggle("has-filters", activeCount > 0);
      if (quickAdvancedCount) {
        quickAdvancedCount.textContent = String(activeCount);
        quickAdvancedCount.hidden = activeCount === 0;
      }
      quickFilterButtons.forEach((button) => {
        const isActive = activeAdvancedOptions().some((option) => option.dataset.filterValue === button.dataset.catalogQuickFilter);
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
      inlineFilterButtons.forEach((button) => {
        const isActive = activeAdvancedOptions().some((option) => option.dataset.filterValue === button.dataset.filterValue);
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
      syncCatalogSearchActions();
    };
    const syncOverlayAdvancedControls = () => {
      const activeCount = activeAdvancedOptions().length;
      const hasDraftFilters = activeCount > 0 || Boolean(catalogSearchDraft && (
        catalogSearchDraft.category !== ""
        || (searchInput instanceof HTMLInputElement && searchInput.value.trim() !== "")
        || catalogSearchDraft.sort !== ""
        || catalogSearchDraft.order !== ""
        || catalogSearchDraft.minPrice !== priceFloor
        || catalogSearchDraft.maxPrice !== priceCeiling
      ));
      if (advancedCount) {
        advancedCount.textContent = String(activeCount);
        advancedCount.hidden = activeCount === 0;
      }
      if (advancedReset) advancedReset.hidden = !hasDraftFilters;
      if (mobileHeaderReset) mobileHeaderReset.hidden = !hasDraftFilters;
      advancedToggle?.classList.toggle("has-filters", activeCount > 0);
      syncCatalogSearchActions();
    };
    const sortLabels = {
      "": "Сортировка по цене выключена. Показать сначала дешёвые",
      asc: "Сначала дешёвые. Переключить на дорогие",
      desc: "Сначала дорогие. Сбросить сортировку",
    };
    const orderLabels = {
      "": "Порядок: по умолчанию. Показать новинки",
      newest: "Порядок: новинки. Показать популярные",
      popular: "Порядок: популярные. Показать по алфавиту",
      alpha: "Порядок: по алфавиту. Вернуть порядок по умолчанию",
    };
    const syncInlineOrder = () => {
      if (!(inlineOrderButton instanceof HTMLButtonElement)) return;
      inlineOrderButton.dataset.orderState = activeOrder;
      inlineOrderButton.classList.toggle("is-active", activeOrder !== "");
      inlineOrderButton.setAttribute("aria-pressed", String(activeOrder !== ""));
      inlineOrderButton.setAttribute("aria-label", orderLabels[activeOrder]);
      inlineOrderButton.title = orderLabels[activeOrder].split(".")[0];
    };
    const syncOverlayOrder = (order) => {
      if (!(orderButton instanceof HTMLButtonElement)) return;
      orderButton.dataset.orderState = order;
      orderButton.classList.toggle("is-active", order !== "");
      orderButton.setAttribute("aria-pressed", String(order !== ""));
      orderButton.setAttribute("aria-label", orderLabels[order]);
      orderButton.title = orderLabels[order].split(".")[0];
    };
    const syncOverlayCategory = (category) => {
      categoryButtons.forEach((button) => {
        const isActive = button.dataset.catalogCategory === category;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
    };
    const syncOverlaySort = (sort) => {
      if (!sortButton) return;
      sortButton.dataset.sortState = sort;
      sortButton.classList.toggle("is-active", sort !== "");
      sortButton.setAttribute("aria-pressed", String(sort !== ""));
      sortButton.setAttribute("aria-label", sortLabels[sort]);
      sortButton.title = sortLabels[sort];
    };
    const syncOverlayPrice = (minimum, maximum) => {
      const span = priceCeiling - priceFloor;
      const start = ((minimum - priceFloor) / span) * 100;
      const end = ((maximum - priceFloor) / span) * 100;
      if (priceRange instanceof HTMLElement) {
        priceRange.style.setProperty("--price-start", `${start}%`);
        priceRange.style.setProperty("--price-end", `${end}%`);
      }
      if (priceMinRange instanceof HTMLInputElement) priceMinRange.value = String(minimum);
      if (priceMaxRange instanceof HTMLInputElement) priceMaxRange.value = String(maximum);
      if (priceMinInput instanceof HTMLInputElement) priceMinInput.value = String(minimum);
      if (priceMaxInput instanceof HTMLInputElement) priceMaxInput.value = String(maximum);
    };
    const beginCatalogSearchDraft = () => {
      catalogSearchDraft = {
        category: activeCategory,
        sort: activeSort,
        order: activeOrder,
        minPrice: activeMinPrice,
        maxPrice: activeMaxPrice,
        search: appliedSearchValue,
        filters: new Set(activeAdvancedOptions().map((button) => button.dataset.filterValue).filter(Boolean)),
      };
      if (searchInput instanceof HTMLInputElement) searchInput.value = appliedSearchValue;
      syncOverlayCategory(catalogSearchDraft.category);
      syncOverlaySort(catalogSearchDraft.sort);
      syncOverlayOrder(catalogSearchDraft.order);
      syncOverlayPrice(catalogSearchDraft.minPrice, catalogSearchDraft.maxPrice);
      syncOverlayAdvancedControls();
    };
    const restoreCatalogSearchDraft = () => {
      if (!catalogSearchDraft) return;
      advancedOptions.forEach((button) => {
        const isActive = catalogSearchDraft.filters.has(button.dataset.filterValue || "");
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
      if (searchInput instanceof HTMLInputElement) searchInput.value = appliedSearchValue;
      syncOverlayCategory(activeCategory);
      syncOverlaySort(activeSort);
      syncOverlayOrder(activeOrder);
      syncPriceControls();
      syncAdvancedControls();
    };
    const resetAdvancedPanelStyles = () => {
      if (!(advancedPanel instanceof HTMLElement)) return;
      ["height", "marginTop", "marginBottom", "paddingBottom", "opacity", "transform"].forEach((property) => {
        advancedPanel.style[property] = "";
      });
    };
    const setAdvancedPanelOpen = (isOpen) => {
      if (!(advancedPanel instanceof HTMLElement)) return;
      document.body.classList.toggle("catalog-filters-open", isOpen);
      advancedPanel.getAnimations().forEach((animation) => animation.cancel());
      advancedToggle?.classList.toggle("is-open", isOpen);
      advancedToggle?.setAttribute("aria-expanded", String(isOpen));
      advancedToggle?.setAttribute("aria-label", isOpen ? "Закрыть расширенные фильтры" : "Открыть расширенные фильтры");

      if (reducedMotion.matches) {
        resetAdvancedPanelStyles();
        advancedPanel.hidden = !isOpen;
        return;
      }

      if (isOpen) {
        advancedPanel.hidden = false;
        resetAdvancedPanelStyles();
        const expandedStyles = window.getComputedStyle(advancedPanel);
        const openHeight = advancedPanel.getBoundingClientRect().height;
        const animation = advancedPanel.animate([
          { height: "0px", marginTop: "0px", marginBottom: "0px", paddingBottom: "0px", opacity: 0, transform: "translateY(-6px)" },
          { height: `${openHeight}px`, marginTop: expandedStyles.marginTop, marginBottom: expandedStyles.marginBottom, paddingBottom: expandedStyles.paddingBottom, opacity: 1, transform: "translateY(0)" },
        ], {
          duration: 460,
          easing: "cubic-bezier(0.22, 0.8, 0.2, 1)",
          fill: "both",
        });
        animation.finished.then(() => {
          if (advancedToggle?.getAttribute("aria-expanded") !== "true") return;
          animation.cancel();
          resetAdvancedPanelStyles();
        }).catch(() => {});
        return;
      }

      const closeHeight = advancedPanel.getBoundingClientRect().height;
      const expandedStyles = window.getComputedStyle(advancedPanel);
      const animation = advancedPanel.animate([
        { height: `${closeHeight}px`, marginTop: expandedStyles.marginTop, marginBottom: expandedStyles.marginBottom, paddingBottom: expandedStyles.paddingBottom, opacity: 1, transform: "translateY(0)" },
        { height: "0px", marginTop: "0px", marginBottom: "0px", paddingBottom: "0px", opacity: 0, transform: "translateY(-5px)" },
      ], {
        duration: 380,
        easing: "cubic-bezier(0.22, 0.8, 0.2, 1)",
        fill: "both",
      });
      animation.finished.then(() => {
        if (advancedToggle?.getAttribute("aria-expanded") === "false") {
          animation.cancel();
          advancedPanel.hidden = true;
          resetAdvancedPanelStyles();
        }
      }).catch(() => {});
    };

    const persistCatalogFilters = () => {
      try {
        window.localStorage.removeItem(catalogFiltersKey);
      } catch {
        // The current in-memory state remains available until the page is refreshed.
      }
    };

    let catalogFilterScrollFrame = 0;
    const getElementDocumentTop = (element) => {
      let top = 0;
      let current = element;
      while (current instanceof HTMLElement) {
        top += current.offsetTop;
        current = current.offsetParent;
      }
      return top;
    };
    const scrollCatalogResultsToTop = () => {
      if (document.body.classList.contains("catalog-search-active") || !(grid instanceof HTMLElement)) return;
      window.cancelAnimationFrame(catalogFilterScrollFrame);
      catalogFilterScrollFrame = window.requestAnimationFrame(() => {
        catalogFilterScrollFrame = window.requestAnimationFrame(() => {
          catalogFilterScrollFrame = 0;
          const mobileCatalog = window.matchMedia("(max-width: 620px)").matches;
          const hasAdminBar = document.body.classList.contains("admin-bar");
          const headerOffset = hasAdminBar
            ? (mobileCatalog ? 104 : 86)
            : (mobileCatalog ? 58 : 54);
          const target = inlineTools instanceof HTMLElement ? inlineTools : catalog;
          const targetTop = Math.max(0, getElementDocumentTop(target) - headerOffset);
          // Filtering must never pull a visible toolbar down to the product cards.
          // Only bring the search row back when the user is already below it.
          if (window.scrollY <= targetTop + 6) return;
          window.scrollTo({
            left: 0,
            top: targetTop,
            behavior: reducedMotion.matches ? "auto" : "smooth",
          });
        });
      });
    };

    const applyCatalogCategory = (category, syncUrl = true, resetLimit = true, focusFilters = false) => {
      activeCategory = category;
      if (resetLimit) visibleLimit = getBatchSize();
      const search = normalizeSearch(searchInput?.value || "");
      const compareCatalogOrder = (first, second) => {
        if (activeOrder === "newest") {
          const difference = Number(second.dataset.created || 0) - Number(first.dataset.created || 0);
          if (difference !== 0) return difference;
        } else if (activeOrder === "popular") {
          const difference = Number(second.dataset.popularity || 0) - Number(first.dataset.popularity || 0);
          if (difference !== 0) return difference;
        } else if (activeOrder === "alpha") {
          const difference = String(first.dataset.orderTitle || "").localeCompare(String(second.dataset.orderTitle || ""), "ru", { sensitivity: "base", numeric: true });
          if (difference !== 0) return difference;
        }
        return Number(first.dataset.catalogOrder) - Number(second.dataset.catalogOrder);
      };
      const sortedCards = [...cards].sort((first, second) => {
        if (!activeSort) return compareCatalogOrder(first, second);
        const priceDifference = Number(first.dataset.price) - Number(second.dataset.price);
        if (priceDifference !== 0) return activeSort === "asc" ? priceDifference : -priceDifference;
        return compareCatalogOrder(first, second);
      });
      sortedCards.forEach((card) => grid.append(card));
      const matchingCards = sortedCards.filter((card) => {
        const categories = card.dataset.categories.split(" ").filter(Boolean);
        const searchText = normalizeSearch(card.dataset.search || "");
        const price = Number(card.dataset.price);
        const matchesPrice = !Number.isFinite(price) || (price >= activeMinPrice && price <= activeMaxPrice);
        return (!category || categories.includes(category)) && (!search || searchText.includes(search)) && matchesAdvancedFilters(card, searchText) && matchesPrice;
      });
      currentMatchingCards = matchingCards;
      cards.forEach((card) => { card.hidden = true; });
      matchingCards.slice(0, visibleLimit).forEach((card) => {
        card.hidden = false;
        // The current batch always has priority over the hidden prewarmed batch.
        enqueueCatalogCard(card);
      });
      const shownCount = Math.min(visibleLimit, matchingCards.length);
      // Prepare exactly one upcoming batch while it is still outside the layout.
      // This keeps scrolling seamless without downloading the entire catalogue.
      scheduleCatalogPrewarm(matchingCards.slice(shownCount, shownCount + getBatchSize()));

      categoryButtons.forEach((button) => {
        const isActive = button.dataset.catalogCategory === activeCategory;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
      quickCategoryButtons.forEach((button) => {
        const isActive = button.dataset.catalogQuickCategory === activeCategory;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
      inlineCategoryButtons.forEach((button) => {
        const isActive = button.dataset.catalogInlineCategory === activeCategory;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
      if (sortButton) {
        sortButton.dataset.sortState = activeSort;
        sortButton.classList.toggle("is-active", activeSort !== "");
        sortButton.setAttribute("aria-pressed", String(activeSort !== ""));
        sortButton.setAttribute("aria-label", sortLabels[activeSort]);
        sortButton.title = sortLabels[activeSort];
      }
      if (quickSortButton) {
        quickSortButton.dataset.sortState = activeSort;
        quickSortButton.classList.toggle("is-active", activeSort !== "");
        quickSortButton.setAttribute("aria-pressed", String(activeSort !== ""));
        quickSortButton.setAttribute("aria-label", sortLabels[activeSort]);
        quickSortButton.title = sortLabels[activeSort];
      }
      if (inlineSortButton) {
        inlineSortButton.dataset.sortState = activeSort;
        inlineSortButton.classList.toggle("is-active", activeSort !== "");
        inlineSortButton.setAttribute("aria-pressed", String(activeSort !== ""));
        inlineSortButton.setAttribute("aria-label", sortLabels[activeSort]);
        inlineSortButton.title = sortLabels[activeSort];
      }
      syncInlineOrder();
      if (!catalogSearchDraft) syncOverlayOrder(activeOrder);
      if (inlineSearchInput instanceof HTMLInputElement && document.activeElement !== inlineSearchInput) {
        inlineSearchInput.value = searchInput instanceof HTMLInputElement ? searchInput.value : "";
      }
      syncAdvancedControls();

      if (countShown) countShown.textContent = String(shownCount);
      if (countTotal) countTotal.textContent = String(matchingCards.length);
      if (empty) empty.hidden = matchingCards.length > 0;
      if (loadMoreStatus) loadMoreStatus.textContent = `${shownCount} из ${matchingCards.length}`;
      if (loadMoreWrap) loadMoreWrap.hidden = shownCount >= matchingCards.length;
      grid.classList.add("is-ready");

      if (syncUrl) {
        const scrollLeft = window.scrollX;
        const scrollTop = window.scrollY;
        const params = new URLSearchParams(window.location.search);
        category ? params.set("product_cat", category) : params.delete("product_cat");
        search ? params.set("catalog_search", searchInput.value.trim()) : params.delete("catalog_search");
        activeSort ? params.set("price_sort", activeSort) : params.delete("price_sort");
        activeOrder ? params.set("catalog_order", activeOrder) : params.delete("catalog_order");
        activeMinPrice > priceFloor ? params.set("catalog_price_min", String(activeMinPrice)) : params.delete("catalog_price_min");
        activeMaxPrice < priceCeiling ? params.set("catalog_price_max", String(activeMaxPrice)) : params.delete("catalog_price_max");
        const selectedAdvanced = activeAdvancedOptions().map((button) => button.dataset.filterValue).filter(Boolean);
        selectedAdvanced.length ? params.set("catalog_filters", selectedAdvanced.join(",")) : params.delete("catalog_filters");
        params.delete("product_tag");
        params.delete("orderby");
        const query = params.toString();
        window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
        persistCatalogFilters();
        requestAnimationFrame(() => window.scrollTo(scrollLeft, scrollTop));
      }
      if (focusFilters) scrollCatalogResultsToTop();
    };

    categoryButtons.forEach((button) => button.addEventListener("click", () => {
      const category = button.dataset.catalogCategory || "";
      if (catalogSearchDraft) {
        catalogSearchDraft.category = category;
        syncOverlayCategory(category);
        syncOverlayAdvancedControls();
        return;
      }
      applyCatalogCategory(category, true, true, true);
    }));
    quickCategoryButtons.forEach((button) => button.addEventListener("click", () => applyCatalogCategory(button.dataset.catalogQuickCategory || "", true, true, true)));
    inlineCategoryButtons.forEach((button) => button.addEventListener("click", () => applyCatalogCategory(button.dataset.catalogInlineCategory || "", true, true, true)));
    const cycleCatalogOrder = (sourceButton) => {
      const orderStates = ["", "newest", "popular", "alpha"];
      if (catalogSearchDraft) {
        const currentDraftIndex = orderStates.indexOf(catalogSearchDraft.order);
        catalogSearchDraft.order = orderStates[(currentDraftIndex + 1) % orderStates.length];
        syncOverlayOrder(catalogSearchDraft.order);
        syncOverlayAdvancedControls();
        showCatalogSortStatus(catalogSearchDraft.order || "defaultOrder", sourceButton);
        return;
      }
      const currentIndex = orderStates.indexOf(activeOrder);
      activeOrder = orderStates[(currentIndex + 1) % orderStates.length];
      applyCatalogCategory(activeCategory, true, true, true);
      showCatalogSortStatus(activeOrder || "defaultOrder", sourceButton);
    };
    const cycleCatalogSort = (sourceButton, activationEvent) => {
      if (catalogSearchDraft) {
        catalogSearchDraft.sort = catalogSearchDraft.sort === "" ? "asc" : (catalogSearchDraft.sort === "asc" ? "desc" : "");
        syncOverlaySort(catalogSearchDraft.sort);
        syncOverlayAdvancedControls();
        showCatalogSortStatus(catalogSearchDraft.sort, sourceButton, activationEvent);
        return;
      }
      activeSort = activeSort === "" ? "asc" : (activeSort === "asc" ? "desc" : "");
      applyCatalogCategory(activeCategory, true, true, true);
      showCatalogSortStatus(activeSort, sourceButton, activationEvent);
    };
    sortButton?.addEventListener("click", (event) => cycleCatalogSort(sortButton, event));
    orderButton?.addEventListener("click", () => cycleCatalogOrder(orderButton));
    const applyPriceRange = (minimum, maximum, changedControl, syncUrl, focusFilters = false) => {
      activeMinPrice = clampPrice(minimum, activeMinPrice);
      activeMaxPrice = clampPrice(maximum, activeMaxPrice);
      if (activeMinPrice > activeMaxPrice) {
        if (changedControl === "min") activeMinPrice = activeMaxPrice;
        else activeMaxPrice = activeMinPrice;
      }
      syncPriceControls();
      applyCatalogCategory(activeCategory, syncUrl, true, focusFilters);
    };
    const updateDraftPrice = (minimum, maximum, changedControl) => {
      if (!catalogSearchDraft) return;
      catalogSearchDraft.minPrice = clampPrice(minimum, catalogSearchDraft.minPrice);
      catalogSearchDraft.maxPrice = clampPrice(maximum, catalogSearchDraft.maxPrice);
      if (catalogSearchDraft.minPrice > catalogSearchDraft.maxPrice) {
        if (changedControl === "min") catalogSearchDraft.minPrice = catalogSearchDraft.maxPrice;
        else catalogSearchDraft.maxPrice = catalogSearchDraft.minPrice;
      }
      syncOverlayPrice(catalogSearchDraft.minPrice, catalogSearchDraft.maxPrice);
      syncOverlayAdvancedControls();
    };
    priceMinRange?.addEventListener("input", () => updateDraftPrice(Number(priceMinRange.value), catalogSearchDraft?.maxPrice ?? activeMaxPrice, "min"));
    priceMaxRange?.addEventListener("input", () => updateDraftPrice(catalogSearchDraft?.minPrice ?? activeMinPrice, Number(priceMaxRange.value), "max"));
    priceMinInput?.addEventListener("change", () => updateDraftPrice(Number(priceMinInput.value), catalogSearchDraft?.maxPrice ?? activeMaxPrice, "min"));
    priceMaxInput?.addEventListener("change", () => updateDraftPrice(catalogSearchDraft?.minPrice ?? activeMinPrice, Number(priceMaxInput.value), "max"));
    quickPriceMinRange?.addEventListener("input", () => applyPriceRange(Number(quickPriceMinRange.value), activeMaxPrice, "min", false));
    quickPriceMaxRange?.addEventListener("input", () => applyPriceRange(activeMinPrice, Number(quickPriceMaxRange.value), "max", false));
    quickPriceMinRange?.addEventListener("change", () => applyCatalogCategory(activeCategory, true, true, true));
    quickPriceMaxRange?.addEventListener("change", () => applyCatalogCategory(activeCategory, true, true, true));
    inlinePriceMinRange?.addEventListener("input", () => applyPriceRange(Number(inlinePriceMinRange.value), activeMaxPrice, "min", false));
    inlinePriceMaxRange?.addEventListener("input", () => applyPriceRange(activeMinPrice, Number(inlinePriceMaxRange.value), "max", false));
    inlinePriceMinRange?.addEventListener("change", () => applyCatalogCategory(activeCategory, true, true, true));
    inlinePriceMaxRange?.addEventListener("change", () => applyCatalogCategory(activeCategory, true, true, true));
    const applyTypedPriceOnEnter = (event, minimumInput, maximumInput, changedControl) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      if (!(minimumInput instanceof HTMLInputElement) || !(maximumInput instanceof HTMLInputElement)) return;
      if (minimumInput.value.trim() === "" || maximumInput.value.trim() === "") return;
      applyPriceRange(Number(minimumInput.value), Number(maximumInput.value), changedControl, true, true);
      event.currentTarget.blur();
    };
    quickPriceMinInput?.addEventListener("keydown", (event) => applyTypedPriceOnEnter(event, quickPriceMinInput, quickPriceMaxInput, "min"));
    quickPriceMaxInput?.addEventListener("keydown", (event) => applyTypedPriceOnEnter(event, quickPriceMinInput, quickPriceMaxInput, "max"));
    inlinePriceMinInput?.addEventListener("keydown", (event) => applyTypedPriceOnEnter(event, inlinePriceMinInput, inlinePriceMaxInput, "min"));
    inlinePriceMaxInput?.addEventListener("keydown", (event) => applyTypedPriceOnEnter(event, inlinePriceMinInput, inlinePriceMaxInput, "max"));
    quickSortButton?.addEventListener("click", (event) => cycleCatalogSort(quickSortButton, event));
    inlineOrderButton?.addEventListener("click", () => cycleCatalogOrder(inlineOrderButton));
    inlineSortButton?.addEventListener("click", (event) => cycleCatalogSort(inlineSortButton, event));
    quickAdvancedToggle?.addEventListener("click", () => {
      const isOpen = !document.body.classList.contains("catalog-scroll-advanced-open");
      document.body.classList.toggle("catalog-scroll-advanced-open", isOpen);
      quickAdvancedToggle.setAttribute("aria-expanded", String(isOpen));
      quickAdvancedToggle.setAttribute("aria-label", isOpen ? "Закрыть расширенные фильтры" : "Открыть расширенные фильтры");
    });
    const resetInlineAdvancedStyles = () => {
      if (!(inlineAdvancedPanel instanceof HTMLElement)) return;
      ["height", "marginTop", "paddingTop", "opacity", "transform", "overflow"].forEach((property) => {
        inlineAdvancedPanel.style[property] = "";
      });
    };
    const resetInlineAdvancedClosed = () => {
      if (!(inlineAdvancedToggle instanceof HTMLButtonElement) || !(inlineAdvancedPanel instanceof HTMLElement)) return;
      inlineAdvancedPanel.getAnimations().forEach((animation) => animation.cancel());
      resetInlineAdvancedStyles();
      inlineAdvancedPanel.hidden = true;
      inlineAdvancedToggle.classList.remove("is-open");
      inlineAdvancedToggle.setAttribute("aria-expanded", "false");
      inlineAdvancedToggle.setAttribute("aria-label", "Открыть расширенные фильтры");
    };
    const setInlineAdvancedOpen = (isOpen) => {
      if (!(inlineAdvancedToggle instanceof HTMLButtonElement) || !(inlineAdvancedPanel instanceof HTMLElement)) return;
      inlineAdvancedPanel.getAnimations().forEach((animation) => animation.cancel());
      inlineAdvancedToggle.classList.toggle("is-open", isOpen);
      inlineAdvancedToggle.setAttribute("aria-expanded", String(isOpen));
      inlineAdvancedToggle.setAttribute("aria-label", isOpen ? "Закрыть расширенные фильтры" : "Открыть расширенные фильтры");

      if (reducedMotion.matches) {
        resetInlineAdvancedStyles();
        inlineAdvancedPanel.hidden = !isOpen;
        return;
      }

      if (isOpen) {
        inlineAdvancedPanel.hidden = false;
        resetInlineAdvancedStyles();
        const expandedStyles = window.getComputedStyle(inlineAdvancedPanel);
        const openHeight = inlineAdvancedPanel.getBoundingClientRect().height;
        const animation = inlineAdvancedPanel.animate([
          { height: "0px", marginTop: "0px", paddingTop: "0px", opacity: 0, transform: "translateY(-6px)", overflow: "hidden" },
          { height: `${openHeight}px`, marginTop: expandedStyles.marginTop, paddingTop: expandedStyles.paddingTop, opacity: 1, transform: "translateY(0)", overflow: "hidden" },
        ], { duration: 420, easing: "cubic-bezier(0.22, 0.8, 0.2, 1)", fill: "both" });
        animation.finished.then(() => {
          if (inlineAdvancedToggle.getAttribute("aria-expanded") !== "true") return;
          animation.cancel();
          resetInlineAdvancedStyles();
        }).catch(() => {});
        return;
      }

      const expandedStyles = window.getComputedStyle(inlineAdvancedPanel);
      const closeHeight = inlineAdvancedPanel.getBoundingClientRect().height;
      const animation = inlineAdvancedPanel.animate([
        { height: `${closeHeight}px`, marginTop: expandedStyles.marginTop, paddingTop: expandedStyles.paddingTop, opacity: 1, transform: "translateY(0)", overflow: "hidden" },
        { height: "0px", marginTop: "0px", paddingTop: "0px", opacity: 0, transform: "translateY(-6px)", overflow: "hidden" },
      ], { duration: 340, easing: "cubic-bezier(0.22, 0.8, 0.2, 1)", fill: "both" });
      animation.finished.then(() => {
        if (inlineAdvancedToggle.getAttribute("aria-expanded") !== "false") return;
        animation.cancel();
        inlineAdvancedPanel.hidden = true;
        resetInlineAdvancedStyles();
      }).catch(() => {});
    };
    inlineAdvancedToggle?.addEventListener("click", () => {
      setInlineAdvancedOpen(inlineAdvancedToggle.getAttribute("aria-expanded") !== "true");
    });
    resetInlineAdvancedClosed();
    window.addEventListener("pageshow", resetInlineAdvancedClosed);
    advancedToggle?.addEventListener("click", () => setAdvancedPanelOpen(advancedToggle.getAttribute("aria-expanded") !== "true"));
    const toggleAdvancedOption = (button) => {
      const isActive = button.getAttribute("aria-pressed") === "true";
      button.setAttribute("aria-pressed", String(!isActive));
      button.classList.toggle("is-active", !isActive);
      if (catalogSearchDraft) {
        syncOverlayAdvancedControls();
        return;
      }
      syncAdvancedControls();
      applyCatalogCategory(activeCategory, true, true, true);
    };
    advancedOptions.forEach((button) => button.addEventListener("click", () => toggleAdvancedOption(button)));
    quickFilterButtons.forEach((button) => button.addEventListener("click", () => {
      const option = advancedOptions.find((item) => item.dataset.filterValue === button.dataset.catalogQuickFilter);
      if (option) toggleAdvancedOption(option);
    }));
    inlineFilterButtons.forEach((button) => button.addEventListener("click", () => {
      const option = advancedOptions.find((item) => item.dataset.filterValue === button.dataset.filterValue);
      if (option) toggleAdvancedOption(option);
    }));
    advancedReset?.addEventListener("click", () => {
      advancedOptions.forEach((button) => {
        button.classList.remove("is-active");
        button.setAttribute("aria-pressed", "false");
      });
      if (catalogSearchDraft) {
        catalogSearchDraft.category = "";
        catalogSearchDraft.sort = "";
        catalogSearchDraft.order = "";
        catalogSearchDraft.minPrice = priceFloor;
        catalogSearchDraft.maxPrice = priceCeiling;
        catalogSearchDraft.search = "";
        if (searchInput instanceof HTMLInputElement) searchInput.value = "";
        syncOverlayCategory("");
        syncOverlaySort("");
        syncOverlayOrder("");
        syncOverlayPrice(priceFloor, priceCeiling);
        syncOverlayAdvancedControls();
        return;
      }
      resetCatalogFilters();
    });
    mobileHeaderReset?.addEventListener("click", () => {
      if (advancedReset instanceof HTMLButtonElement) advancedReset.click();
    });
    if (advancedToggle) {
      document.addEventListener("click", (event) => {
        if (advancedPanel?.hidden || advancedPanel?.contains(event.target) || advancedToggle.contains(event.target)) return;
        setAdvancedPanelOpen(false);
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && advancedPanel && !advancedPanel.hidden) {
          event.preventDefault();
          setAdvancedPanelOpen(false);
          advancedToggle.focus();
        }
      });
    }
    const closeCatalogSearch = (resetFilters = false) => {
      catalogSearchDraft = null;
      document.body.classList.remove("catalog-search-active");
      document.documentElement.classList.remove("catalog-search-active");
      searchDialog?.classList.remove("is-scrollable");
      searchOverlay?.setAttribute("aria-hidden", "true");
      if (searchOverlay instanceof HTMLElement) searchOverlay.inert = true;
      searchInput?.blur();
      if (resetFilters) {
        resetCatalogFilters(false);
        if (inlineAdvancedToggle?.getAttribute("aria-expanded") === "true") setInlineAdvancedOpen(false);
      }
      if (window.location.hash === "#catalog-search") {
        window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}`);
      }
      document.querySelector(".header-search")?.focus({ preventScroll: true });
    };
    const openCatalogSearch = () => {
      beginCatalogSearchDraft();
      if (advancedPanel instanceof HTMLElement && !advancedToggle) {
        advancedPanel.hidden = false;
        resetAdvancedPanelStyles();
      }
      document.body.classList.add("catalog-search-active");
      document.documentElement.classList.add("catalog-search-active");
      searchOverlay?.setAttribute("aria-hidden", "false");
      if (searchOverlay instanceof HTMLElement) searchOverlay.inert = false;
      window.requestAnimationFrame(() => window.requestAnimationFrame(syncCatalogOverlayScrolling));
      startPriceRangeHint(priceRange);
      window.setTimeout(() => searchInput?.focus({ preventScroll: true }), reducedMotion.matches ? 0 : 360);
    };
    const scrollToCatalogSearchResults = () => {
      window.requestAnimationFrame(scrollCatalogResultsToTop);
    };
    const submitCatalogSearch = () => {
      if (!(searchInput instanceof HTMLInputElement)) return;
      if (!catalogSearchDraft) beginCatalogSearchDraft();
      activeCategory = catalogSearchDraft.category;
      activeSort = catalogSearchDraft.sort;
      activeOrder = catalogSearchDraft.order;
      activeMinPrice = catalogSearchDraft.minPrice;
      activeMaxPrice = catalogSearchDraft.maxPrice;
      appliedSearchValue = searchInput.value;
      syncPriceControls();
      applyCatalogCategory(activeCategory);
      closeCatalogSearch(false);
      scrollToCatalogSearchResults();
    };
    const submitInlineCatalogSearch = () => {
      if (!(inlineSearchInput instanceof HTMLInputElement) || !(searchInput instanceof HTMLInputElement)) return;
      searchInput.value = inlineSearchInput.value;
      appliedSearchValue = inlineSearchInput.value;
      applyCatalogCategory(activeCategory);
      scrollToCatalogSearchResults();
    };
    syncCatalogSearchActions = () => {
      const mobileCatalog = window.matchMedia("(max-width: 620px)").matches;
      const appliedFiltersActive = activeCategory !== ""
        || normalizeSearch(appliedSearchValue) !== ""
        || activeSort !== ""
        || activeOrder !== ""
        || activeMinPrice !== priceFloor
        || activeMaxPrice !== priceCeiling
        || activeAdvancedOptions().length > 0;
      const draftFiltersActive = Boolean(catalogSearchDraft && (
        catalogSearchDraft.category !== ""
        || (searchInput instanceof HTMLInputElement && normalizeSearch(searchInput.value) !== "")
        || catalogSearchDraft.sort !== ""
        || catalogSearchDraft.minPrice !== priceFloor
        || catalogSearchDraft.maxPrice !== priceCeiling
        || activeAdvancedOptions().length > 0
      ));
      if (searchClear instanceof HTMLButtonElement && searchInput instanceof HTMLInputElement) {
        searchClear.disabled = mobileCatalog
          ? !(catalogSearchDraft ? draftFiltersActive : appliedFiltersActive)
          : normalizeSearch(searchInput.value) === "";
        searchClear.setAttribute("aria-label", mobileCatalog ? "Сбросить поиск и фильтры" : "Очистить поиск");
        searchClear.title = mobileCatalog ? "Сбросить всё" : "Очистить поиск";
      }
      if (inlineSearchClear instanceof HTMLButtonElement && inlineSearchInput instanceof HTMLInputElement) {
        inlineSearchClear.disabled = mobileCatalog
          ? !appliedFiltersActive
          : normalizeSearch(inlineSearchInput.value) === "";
        inlineSearchClear.setAttribute("aria-label", mobileCatalog ? "Сбросить поиск и фильтры" : "Очистить поиск");
        inlineSearchClear.title = mobileCatalog ? "Сбросить всё" : "Очистить поиск";
      }
    };
    const applyClearedCatalogSearch = (input) => {
      if (!(input instanceof HTMLInputElement) || input.value.trim() !== "" || normalizeSearch(appliedSearchValue) === "") return;
      if (searchInput instanceof HTMLInputElement) searchInput.value = "";
      if (inlineSearchInput instanceof HTMLInputElement) inlineSearchInput.value = "";
      appliedSearchValue = "";
      if (catalogSearchDraft) catalogSearchDraft.search = "";
      applyCatalogCategory(activeCategory, true, true, !catalogSearchDraft);
    };
    searchCloseButtons.forEach((button) => button.addEventListener("click", () => closeCatalogSearch(true)));
    searchSubmit?.addEventListener("click", submitCatalogSearch);
    inlineSearchSubmit?.addEventListener("click", submitInlineCatalogSearch);
    searchClear?.addEventListener("click", () => {
      if (!(searchInput instanceof HTMLInputElement)) return;
      if (window.matchMedia("(max-width: 620px)").matches) {
        if (catalogSearchDraft && advancedReset instanceof HTMLButtonElement) advancedReset.click();
        else resetCatalogFilters();
        searchInput.value = "";
        if (inlineSearchInput instanceof HTMLInputElement) inlineSearchInput.value = "";
        syncCatalogSearchActions();
        searchInput.focus();
        return;
      }
      searchInput.value = "";
      applyClearedCatalogSearch(searchInput);
      syncOverlayAdvancedControls();
      syncCatalogSearchActions();
      searchInput.focus();
    });
    inlineSearchClear?.addEventListener("click", () => {
      if (!(inlineSearchInput instanceof HTMLInputElement)) return;
      if (window.matchMedia("(max-width: 620px)").matches) {
        resetCatalogFilters();
        inlineSearchInput.focus();
        return;
      }
      inlineSearchInput.value = "";
      applyClearedCatalogSearch(inlineSearchInput);
      syncCatalogSearchActions();
      inlineSearchInput.focus();
    });
    searchInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitCatalogSearch();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeCatalogSearch(true);
      }
    });
    searchInput?.addEventListener("input", () => {
      applyClearedCatalogSearch(searchInput);
      syncOverlayAdvancedControls();
      syncCatalogSearchActions();
    });
    inlineSearchInput?.addEventListener("input", () => {
      applyClearedCatalogSearch(inlineSearchInput);
      syncCatalogSearchActions();
    });
    inlineSearchInput?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      submitInlineCatalogSearch();
    });
    const resetCatalogFilters = (focusResults = true) => {
      if (searchInput) searchInput.value = "";
      if (inlineSearchInput) inlineSearchInput.value = "";
      appliedSearchValue = "";
      activeSort = "";
      activeOrder = "";
      activeMinPrice = priceFloor;
      activeMaxPrice = priceCeiling;
      syncPriceControls();
      advancedOptions.forEach((button) => {
        button.classList.remove("is-active");
        button.setAttribute("aria-pressed", "false");
      });
      syncAdvancedControls();
      applyCatalogCategory("", true, true, focusResults);
      syncCatalogSearchActions();
    };
    inlineReset?.addEventListener("click", () => resetCatalogFilters());
    quickReset?.addEventListener("click", () => resetCatalogFilters());
    showAllButton?.addEventListener("click", () => resetCatalogFilters());
    syncCatalogSearchActions();
    const loadNextCatalogBatch = (preserveScroll = true) => {
      if (!(loadMoreButton instanceof HTMLButtonElement) || loadMoreWrap?.hidden) return false;
      const batchStart = Math.min(visibleLimit, currentMatchingCards.length);
      const nextVisibleLimit = Math.min(batchStart + getBatchSize(), currentMatchingCards.length);
      if (nextVisibleLimit <= batchStart) return false;
      loadMoreButton.blur();
      visibleLimit = nextVisibleLimit;
      currentMatchingCards.slice(batchStart, nextVisibleLimit).forEach((card) => {
        card.hidden = false;
        enqueueCatalogCard(card);
      });
      if (countShown) countShown.textContent = String(nextVisibleLimit);
      if (countTotal) countTotal.textContent = String(currentMatchingCards.length);
      if (loadMoreStatus) loadMoreStatus.textContent = `${nextVisibleLimit} из ${currentMatchingCards.length}`;
      if (loadMoreWrap) loadMoreWrap.hidden = nextVisibleLimit >= currentMatchingCards.length;
      scheduleCatalogPrewarm(currentMatchingCards.slice(nextVisibleLimit, nextVisibleLimit + getBatchSize()));
      return true;
    };
    loadMoreButton?.addEventListener("click", () => {
      loadNextCatalogBatch();
    });

    // Keep the catalogue continuous: the button doubles as a count indicator
    // and a manual fallback, while approaching it loads the next batch.
    if (loadMoreButton instanceof HTMLButtonElement && loadMoreWrap instanceof HTMLElement && "IntersectionObserver" in window) {
      let automaticLoadTimer = 0;
      let automaticLoadPending = false;
      const automaticLoadDistance = () => Math.round(Math.max(
        slowCatalogConnection ? 640 : (constrainedCatalogDevice ? 960 : 1280),
        window.innerHeight * (slowCatalogConnection ? 0.85 : (constrainedCatalogDevice ? 1.15 : 1.5)),
      ));
      const loadMoreIsNearViewport = () => {
        if (loadMoreWrap.hidden) return false;
        const bounds = loadMoreWrap.getBoundingClientRect();
        return bounds.top <= window.innerHeight + automaticLoadDistance() && bounds.bottom >= -automaticLoadDistance();
      };
      const scheduleAutomaticLoad = () => {
        if (automaticLoadPending || !loadMoreIsNearViewport()) return;
        automaticLoadPending = true;
        window.clearTimeout(automaticLoadTimer);
        automaticLoadTimer = window.setTimeout(() => {
          automaticLoadPending = false;
          if (!loadMoreIsNearViewport() || !loadNextCatalogBatch(false)) return;
          window.requestAnimationFrame(() => window.requestAnimationFrame(scheduleAutomaticLoad));
        }, reducedMotion.matches ? 0 : (slowCatalogConnection ? 140 : 50));
      };
      const loadMoreObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) scheduleAutomaticLoad();
      }, { rootMargin: `0px 0px ${automaticLoadDistance()}px 0px`, threshold: 0 });
      loadMoreObserver.observe(loadMoreWrap);
      window.addEventListener("resize", scheduleAutomaticLoad, { passive: true });
      window.requestAnimationFrame(scheduleAutomaticLoad);
    }
    syncAdvancedControls();
    applyCatalogCategory(activeCategory, false, !catalogReturnState);
    if (catalogReturnState) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.scrollTo({ left: 0, top: Number(catalogReturnState.scrollY) || 0, behavior: "instant" });
        window.sessionStorage.removeItem(catalogReturnKey);
      }));
    }

    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#catalog-search") {
        openCatalogSearch();
      } else if (document.body.classList.contains("catalog-search-active")) {
        closeCatalogSearch(true);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || event.defaultPrevented || !document.body.classList.contains("catalog-search-active")) return;
      event.preventDefault();
      closeCatalogSearch(true);
    });
    document.querySelector(".header-search")?.addEventListener("click", (event) => {
      const destination = new URL(event.currentTarget.href, window.location.href);
      if (destination.pathname !== window.location.pathname) return;
      event.preventDefault();
      openCatalogSearch();
      if (window.location.hash !== "#catalog-search") {
        window.history.pushState({}, "", `${window.location.pathname}${window.location.search}#catalog-search`);
      }
    });
    if (window.location.hash === "#catalog-search") openCatalogSearch();
  });

  document.querySelectorAll("[data-map-route]").forEach((link) => {
    const { latitude, longitude, label } = link.dataset;
    const encodedLabel = encodeURIComponent(label);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isAndroid) {
      link.href = `geo:0,0?q=${latitude},${longitude}(${encodedLabel})`;
      link.removeAttribute("target");
    } else if (isIOS) {
      link.href = `maps://?daddr=${encodedLabel}&dirflg=w`;
      link.removeAttribute("target");
    }
  });

  const readFavorites = () => {
    try {
      const value = JSON.parse(window.localStorage.getItem(favoritesKey) || "[]");
      return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  };

  const favoritesPage = document.querySelector("[data-favorites-page]");
  const favoritesGrid = favoritesPage?.querySelector("[data-favorites-grid]");
  let loadedFavoritesSignature = "";
  let favoritesRequestId = 0;
  const revealFavoriteImage = (image) => {
    if (!(image instanceof HTMLImageElement) || !image.dataset.src) return;
    const frame = image.closest(".product-image");
    const reveal = () => {
      frame?.classList.remove("has-image-error");
      frame?.classList.add("is-image-loaded");
      frame?.setAttribute("aria-busy", "false");
    };
    const keepPlaceholder = () => {
      frame?.classList.add("has-image-error");
      frame?.setAttribute("aria-busy", "false");
    };
    image.addEventListener("load", reveal, { once: true });
    image.addEventListener("error", keepPlaceholder, { once: true });
    image.decoding = "async";
    image.loading = "eager";
    if (image.dataset.srcset) {
      image.srcset = adaptImageSrcset(image.dataset.srcset);
      delete image.dataset.srcset;
    }
    image.src = image.dataset.src;
    delete image.dataset.src;
  };
  const hydrateFavoriteCards = () => {
    if (!(favoritesGrid instanceof HTMLElement)) return;
    favoritesGrid.querySelectorAll("img[data-src]:not(.product-image-alt)").forEach(revealFavoriteImage);
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    favoritesGrid.querySelectorAll(".product-card").forEach((card) => {
      card.addEventListener("pointerenter", () => {
        card.querySelectorAll("img.product-image-alt[data-src]").forEach(revealFavoriteImage);
      }, { once: true });
    });
  };
  const loadFavoriteCards = async (favorites) => {
    if (!(favoritesPage instanceof HTMLElement) || !(favoritesGrid instanceof HTMLElement)) return;
    const signature = favorites.join("|");
    if (!signature) {
      favoritesRequestId += 1;
      loadedFavoritesSignature = "";
      favoritesGrid.replaceChildren();
      favoritesGrid.removeAttribute("aria-busy");
      return;
    }
    if (signature === loadedFavoritesSignature) return;

    const endpoint = favoritesPage.dataset.favoritesEndpoint;
    const nonce = favoritesPage.dataset.favoritesNonce;
    if (!endpoint || !nonce) return;
    const requestId = ++favoritesRequestId;
    favoritesGrid.setAttribute("aria-busy", "true");
    try {
      const body = new URLSearchParams({
        action: "bastion_load_favorites",
        nonce,
        slugs: JSON.stringify(favorites),
      });
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: body.toString(),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error("Unable to load favorites");
      if (requestId !== favoritesRequestId || readFavorites().join("|") !== signature) return;
      favoritesGrid.innerHTML = payload.data?.html || "";
      loadedFavoritesSignature = signature;
      hydrateFavoriteCards();
    } catch {
      if (requestId === favoritesRequestId) favoritesGrid.replaceChildren();
    } finally {
      if (requestId === favoritesRequestId) favoritesGrid.removeAttribute("aria-busy");
    }
  };

  const syncFavorites = () => {
    const favorites = readFavorites();
    const count = document.querySelector(".favorites-count");
    const clearButton = document.querySelector("[data-favorites-clear]");

    if (count) {
      count.textContent = String(favorites.length);
      count.hidden = favorites.length === 0;
    }
    if (clearButton) clearButton.hidden = favorites.length === 0;

    document.querySelectorAll("[data-favorite-slug]").forEach((button) => {
      const slug = button.dataset.favoriteSlug;
      const isSaved = Boolean(slug && favorites.includes(slug));
      button.classList.toggle("is-saved", isSaved);
      button.setAttribute("aria-pressed", String(isSaved));

      if (button.classList.contains("favorite-button")) {
        button.setAttribute("aria-label", `${isSaved ? "Убрать" : "Добавить"} товар ${isSaved ? "из" : "в"} избранного`);
      }

      if (button.classList.contains("product-save")) {
        const label = button.querySelector(".product-save-label");
        if (label) label.textContent = isSaved ? "В избранном" : "В избранное";
      }
    });

    document.querySelectorAll("[data-product-slug]").forEach((card) => {
      if (!card.closest(".favorites-page")) return;
      card.hidden = !favorites.includes(card.dataset.productSlug);
    });

    const empty = document.querySelector(".favorites-empty");
    const grid = document.querySelector(".favorites-content .product-grid");
    if (empty) empty.hidden = favorites.length > 0;
    if (grid) grid.hidden = favorites.length === 0;
    void loadFavoriteCards(favorites);
  };

  const animateFavoriteFlight = (origin) => {
    const target = document.querySelector(".header-favorites");
    if (!(origin instanceof Element) || !(target instanceof Element)) return;

    const headerWasHidden = header?.classList.contains("is-hidden") || false;
    const launchScrollY = window.scrollY;
    header?.classList.remove("is-hidden");
    header?.classList.add("is-favorite-guiding");
    origin.classList.add("is-launching");

    const finishTarget = () => {
      target.classList.remove("is-receiving");
      void target.getBoundingClientRect();
      target.classList.add("is-receiving");
      window.setTimeout(() => target.classList.remove("is-receiving"), 980);
      window.setTimeout(() => origin.classList.remove("is-launching"), 620);
      window.setTimeout(() => {
        header?.classList.remove("is-favorite-guiding");
        if (headerWasHidden && window.scrollY >= launchScrollY - 20) header?.classList.add("is-hidden");
      }, 1900);
    };

    if (reducedMotion.matches) {
      finishTarget();
      return;
    }

    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const originRect = origin.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const startX = originRect.left + originRect.width / 2;
      const startY = originRect.top + originRect.height / 2;
      const distanceX = targetRect.left + targetRect.width / 2 - startX;
      const distanceY = targetRect.top + targetRect.height / 2 - startY;
      const hearts = 3;

      Array.from({ length: hearts }).forEach((_, index) => {
        const heart = document.createElement("span");
        const direction = index % 2 === 0 ? 1 : -1;
        const spread = direction * (12 + index * 5);
        const lift = 28 + index * 7;
        heart.className = "favorite-flight-heart";
        heart.setAttribute("aria-hidden", "true");
        heart.style.left = `${startX}px`;
        heart.style.top = `${startY}px`;
        heart.style.setProperty("--flight-size", `${10 + index * 2}px`);
        heart.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z"></path></svg>';
        document.body.append(heart);

        const animation = heart.animate([
          { opacity: 0, transform: "translate(-50%, -50%) scale(0.45) rotate(0deg)" },
          { opacity: 0.88, transform: `translate(calc(-50% + ${spread * 0.25}px), calc(-50% - ${lift * 0.4}px)) scale(0.9) rotate(${direction * 5}deg)`, offset: 0.2 },
          { opacity: 0.86, transform: `translate(calc(-50% + ${distanceX * 0.58 + spread}px), calc(-50% + ${distanceY * 0.58 - lift}px)) scale(0.74) rotate(${direction * 12}deg)`, offset: 0.64 },
          { opacity: 0.04, transform: `translate(calc(-50% + ${distanceX}px), calc(-50% + ${distanceY}px)) scale(0.36) rotate(${direction * 20}deg)` },
        ], {
          duration: 1500 + index * 90,
          delay: index * 120,
          easing: "cubic-bezier(0.34, 0.08, 0.24, 1)",
          fill: "forwards",
        });
        animation.finished.finally(() => heart.remove());
      });

      window.setTimeout(finishTarget, 1900);
    }));
  };

  let menuCloseTimer = 0;
  const setMenuState = (isOpen) => {
    const wasOpen = nav?.classList.contains("is-open")
      || document.body.classList.contains("menu-open")
      || menuButton?.getAttribute("aria-expanded") === "true";
    if (!isOpen && !wasOpen) {
      document.body.classList.remove("menu-open", "menu-closing");
      return;
    }
    window.clearTimeout(menuCloseTimer);
    nav?.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("menu-open", isOpen);
    document.body.classList.toggle("menu-closing", !isOpen);
    if (isOpen) {
      document.body.classList.remove("menu-closing");
      header?.classList.remove("is-hidden");
    } else {
      menuCloseTimer = window.setTimeout(() => {
        document.body.classList.remove("menu-closing");
        reconcilePageScrollLocks();
      }, 500);
    }
    menuButton?.setAttribute("aria-expanded", String(isOpen));
    menuButton?.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
    menuBackdrop?.setAttribute("aria-hidden", String(!isOpen));
  };

  menuButton?.addEventListener("click", () => setMenuState(menuButton.getAttribute("aria-expanded") !== "true"));
  menuBackdrop?.addEventListener("click", () => setMenuState(false));
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenuState(false)));
  document.addEventListener("pointerdown", (event) => {
    if (menuButton?.getAttribute("aria-expanded") !== "true") return;
    if (window.matchMedia("(max-width: 900px)").matches) return;
    if (event.target instanceof Node && !nav?.contains(event.target) && !menuButton.contains(event.target)) {
      setMenuState(false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuState(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      setMenuState(false);
      window.clearTimeout(menuCloseTimer);
      document.body.classList.remove("menu-closing");
    }
  });

  document.querySelectorAll("[data-favorite-slug]").forEach((button) => {
    button.addEventListener("click", () => {
      const slug = button.dataset.favoriteSlug;
      if (!slug) return;
      const favorites = readFavorites();
      const isAdding = !favorites.includes(slug);
      const next = favorites.includes(slug)
        ? favorites.filter((item) => item !== slug)
        : [...favorites, slug];
      window.localStorage.setItem(favoritesKey, JSON.stringify(next));
      syncFavorites();
      if (isAdding) animateFavoriteFlight(button);
    });
  });

  document.querySelectorAll("[data-product-share]").forEach((button) => {
    const label = button.querySelector(".product-share-label");
    const initialLabel = label?.textContent || "Поделиться";
    const shareUrl = button.dataset.shareUrl || window.location.href;
    let resetTimer = 0;
    const showCopiedState = () => {
      window.clearTimeout(resetTimer);
      button.classList.add("is-copied");
      if (label) label.textContent = "Ссылка готова";
      resetTimer = window.setTimeout(() => {
        button.classList.remove("is-copied");
        if (label) label.textContent = initialLabel;
      }, 2400);
    };
    const copyShareUrl = async () => {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          return;
        } catch {
          // Fall through to the selection-based copy for restricted browsers.
        }
      }
      const input = document.createElement("textarea");
      input.value = shareUrl;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    };

    button.addEventListener("click", async () => {
      const productTitle = button.dataset.shareTitle || document.title;
      const shareData = {
        title: `${productTitle} — Alexandrov.by`,
        text: button.dataset.shareTitle ? `Посмотрите дверь «${button.dataset.shareTitle}» на Alexandrov.by` : `Посмотрите на Alexandrov.by`,
        url: shareUrl,
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
          return;
        }
        await copyShareUrl();
        showCopiedState();
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        try {
          await copyShareUrl();
          showCopiedState();
        } catch {
          if (label) label.textContent = "Не удалось скопировать";
        }
      }
    });
  });

  document.querySelector("[data-favorites-empty-heart]")?.addEventListener("click", (event) => {
    animateFavoriteFlight(event.currentTarget);
  });

  document.querySelector("[data-favorites-clear]")?.addEventListener("click", () => {
    window.localStorage.removeItem(favoritesKey);
    syncFavorites();
  });

  window.addEventListener("storage", syncFavorites);
  syncFavorites();

  document.querySelectorAll("a.product-card-link, a.product-card-details").forEach((link) => {
    link.addEventListener("click", () => {
      const catalog = link.closest("[data-catalog]");
      if (!catalog) return;
      const visibleLimit = catalog.querySelectorAll("[data-catalog-grid] > .product-card:not([hidden])").length;
      try {
        window.sessionStorage.setItem(catalogReturnKey, JSON.stringify({
          url: window.location.href,
          scrollY: window.scrollY,
          visibleLimit,
          restore: false,
        }));
      } catch {
        // The regular catalog URL remains available when storage is disabled.
      }
    });
  });

  document.querySelectorAll("[data-clearable-field]").forEach((field) => {
    const input = field.querySelector("input, textarea");
    const clearButton = field.querySelector("[data-field-clear]");
    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) || !(clearButton instanceof HTMLButtonElement)) return;

    const syncClearButton = () => {
      clearButton.hidden = input.value.length === 0;
    };

    input.addEventListener("input", syncClearButton);
    input.addEventListener("change", syncClearButton);
    clearButton.addEventListener("click", () => {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus({ preventScroll: true });
    });
    window.requestAnimationFrame(syncClearButton);
  });

  const telegramPhoneConfirmation = document.querySelector("[data-telegram-phone-confirm]");
  const telegramPhoneConfirmationDialog = telegramPhoneConfirmation?.querySelector(".telegram-phone-confirm-dialog");
  const telegramPhoneConfirmationSubmit = telegramPhoneConfirmation?.querySelector("[data-telegram-phone-confirm-submit]");
  const telegramPhoneUseUsername = telegramPhoneConfirmation?.querySelector("[data-telegram-phone-use-username]");
  let pendingTelegramForm = null;
  let pendingTelegramInput = null;
  let telegramConfirmationReturnFocus = null;
  const confirmedTelegramForms = new WeakSet();

  const closeTelegramPhoneConfirmation = (focusIdentity = false) => {
    if (!(telegramPhoneConfirmation instanceof HTMLElement)) return;
    telegramPhoneConfirmation.classList.remove("is-open");
    telegramPhoneConfirmation.setAttribute("aria-hidden", "true");
    document.body.classList.remove("telegram-phone-confirm-active");
    window.setTimeout(() => {
      telegramPhoneConfirmation.hidden = true;
      const focusTarget = focusIdentity ? pendingTelegramInput : telegramConfirmationReturnFocus;
      if (focusTarget instanceof HTMLElement) focusTarget.focus({ preventScroll: true });
      pendingTelegramForm = null;
      pendingTelegramInput = null;
      telegramConfirmationReturnFocus = null;
    }, reducedMotion.matches ? 0 : 260);
  };

  const openTelegramPhoneConfirmation = (form, input) => {
    if (!(telegramPhoneConfirmation instanceof HTMLElement)) return false;
    pendingTelegramForm = form;
    pendingTelegramInput = input;
    telegramConfirmationReturnFocus = form.querySelector('button[type="submit"]');
    telegramPhoneConfirmation.hidden = false;
    telegramPhoneConfirmation.setAttribute("aria-hidden", "false");
    document.body.classList.add("telegram-phone-confirm-active");
    window.requestAnimationFrame(() => {
      telegramPhoneConfirmation.classList.add("is-open");
      if (telegramPhoneConfirmationDialog instanceof HTMLElement) telegramPhoneConfirmationDialog.focus({ preventScroll: true });
    });
    return true;
  };

  telegramPhoneConfirmation?.querySelectorAll("[data-telegram-phone-confirm-close]").forEach((button) => {
    button.addEventListener("click", () => closeTelegramPhoneConfirmation());
  });

  telegramPhoneUseUsername?.addEventListener("click", () => {
    const input = pendingTelegramInput;
    closeTelegramPhoneConfirmation(true);
    window.setTimeout(() => {
      if (input instanceof HTMLInputElement) input.select();
    }, reducedMotion.matches ? 0 : 270);
  });

  telegramPhoneConfirmationSubmit?.addEventListener("click", () => {
    const form = pendingTelegramForm;
    if (!(form instanceof HTMLFormElement)) return;
    confirmedTelegramForms.add(form);
    closeTelegramPhoneConfirmation();
    window.setTimeout(() => form.requestSubmit(), reducedMotion.matches ? 0 : 270);
  });

  document.addEventListener("keydown", (event) => {
    if (!telegramPhoneConfirmation?.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeTelegramPhoneConfirmation();
      return;
    }
    if (event.key === "Tab") {
      const focusable = Array.from(telegramPhoneConfirmation.querySelectorAll("button:not([disabled])"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === telegramPhoneConfirmationDialog)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });

  document.querySelectorAll(".bastion-demo-form").forEach((form) => {
    const field = form.querySelector("[data-contact-identity-field]");
    const input = field?.querySelector("[data-contact-identity-input]");
    const label = field?.querySelector("[data-contact-identity-label]");
    const clearButton = field?.querySelector("[data-field-clear]");
    const methodControl = form.querySelector('[name="contact-method"]');
    if (!(input instanceof HTMLInputElement) || !(label instanceof HTMLElement)) return;

    const phoneLabel = "Телефон";
    const telegramLabelSuffix = " или имя пользователя";
    const phonePlaceholder = "+375 29 000-00-00";
    const telegramPlaceholderSuffix = " или @username";
    let identityTypingFrame = 0;

    const stopIdentityTyping = () => {
      window.cancelAnimationFrame(identityTypingFrame);
      identityTypingFrame = 0;
    };

    const animateTelegramIdentity = () => {
      stopIdentityTyping();
      label.textContent = phoneLabel;
      input.placeholder = phonePlaceholder;
      if (reducedMotion.matches) {
        label.textContent = phoneLabel + telegramLabelSuffix;
        input.placeholder = phonePlaceholder + telegramPlaceholderSuffix;
        return;
      }
      const startedAt = performance.now();
      const characterDuration = 42;
      const placeholderDelay = 120;
      const draw = (now) => {
        const elapsed = now - startedAt;
        const labelCharacters = Math.min(telegramLabelSuffix.length, Math.floor(elapsed / characterDuration));
        const placeholderCharacters = Math.min(telegramPlaceholderSuffix.length, Math.floor(Math.max(0, elapsed - placeholderDelay) / characterDuration));
        label.textContent = phoneLabel + telegramLabelSuffix.slice(0, labelCharacters);
        input.placeholder = phonePlaceholder + telegramPlaceholderSuffix.slice(0, placeholderCharacters);
        if (labelCharacters < telegramLabelSuffix.length || placeholderCharacters < telegramPlaceholderSuffix.length) {
          identityTypingFrame = window.requestAnimationFrame(draw);
        } else {
          identityTypingFrame = 0;
        }
      };
      identityTypingFrame = window.requestAnimationFrame(draw);
    };

    const normalizeBelarusPhone = (value) => {
      const trimmed = value.trim();
      if (!/^[+\d\s().-]+$/.test(trimmed)) return "";
      let digits = trimmed.replace(/\D/g, "");
      if (/^80\d{9}$/.test(digits)) digits = `375${digits.slice(2)}`;
      if (/^0\d{9}$/.test(digits)) digits = `375${digits.slice(1)}`;
      if (/^(25|29|33|44)\d{7}$/.test(digits)) digits = `375${digits}`;
      return /^375(25|29|33|44)\d{7}$/.test(digits) ? `+${digits}` : "";
    };
    const isTelegramUsername = (value) => /^@?[a-z][a-z0-9_]{4,31}$/i.test(value.trim());
    const selectedMethod = () => methodControl?.value || "call";
    const isTelegramSelected = () => selectedMethod() === "telegram";

    const validateIdentity = () => {
      const value = input.value.trim();
      input.setCustomValidity("");
      if (!value) return true;
      const isValid = isTelegramSelected()
        ? Boolean(normalizeBelarusPhone(value)) || isTelegramUsername(value)
        : Boolean(normalizeBelarusPhone(value));
      if (!isValid) {
        input.setCustomValidity(isTelegramSelected()
          ? "Укажите белорусский номер телефона или username Telegram в формате @username."
          : "Укажите белорусский номер телефона, например +375 29 000-00-00.");
      }
      return isValid;
    };

    const syncIdentityField = (animate = false) => {
      const telegram = isTelegramSelected();
      const textMode = telegram;
      const currentLabel = telegram ? phoneLabel + telegramLabelSuffix : phoneLabel;
      const currentPlaceholder = telegram ? phonePlaceholder + telegramPlaceholderSuffix : phonePlaceholder;
      input.type = textMode ? "text" : "tel";
      input.inputMode = textMode ? "text" : "tel";
      input.autocomplete = textMode ? "off" : "tel";
      input.setAttribute("aria-label", currentLabel);
      if (telegram && animate) {
        animateTelegramIdentity();
      } else {
        stopIdentityTyping();
        label.textContent = currentLabel;
        input.placeholder = currentPlaceholder;
      }
      if (clearButton instanceof HTMLButtonElement) {
        clearButton.setAttribute("aria-label", telegram ? "Очистить телефон или имя пользователя" : "Очистить номер телефона");
      }
      input.setCustomValidity("");
    };

    methodControl?.addEventListener("change", () => syncIdentityField(true));
    input.addEventListener("input", () => input.setCustomValidity(""));
    input.addEventListener("blur", validateIdentity);
    form.addEventListener("submit", (event) => {
      validateIdentity();
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        form.reportValidity();
        return;
      }
      if (confirmedTelegramForms.has(form)) {
        confirmedTelegramForms.delete(form);
        return;
      }
      if (isTelegramSelected() && normalizeBelarusPhone(input.value)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openTelegramPhoneConfirmation(form, input);
      }
    }, true);
    syncIdentityField();
  });

  document.querySelectorAll(".bastion-demo-form").forEach((form) => {
    const button = form.querySelector('button[type="submit"]');
    const label = button?.querySelector(".bastion-submit-label");
    const initialLabel = label?.textContent || "Отправить заявку";
    let completionTimer = 0;

    const resetDemoSubmission = () => {
      if (!form.classList.contains("is-success")) return;
      window.clearTimeout(completionTimer);
      form.classList.remove("is-success");
      button?.classList.remove("is-success");
      if (button) button.disabled = false;
      if (label) label.textContent = initialLabel;
    };

    form.addEventListener("input", resetDemoSubmission);
    form.addEventListener("change", resetDemoSubmission);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!button || !label || form.classList.contains("is-submitting")) return;

      form.classList.remove("is-success");
      form.classList.add("is-submitting");
      button.classList.remove("is-success");
      button.classList.add("is-submitting");
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      label.textContent = "Отправляем";

      completionTimer = window.setTimeout(() => {
        form.classList.remove("is-submitting");
        form.classList.add("is-success");
        button.classList.remove("is-submitting");
        button.classList.add("is-success");
        button.removeAttribute("aria-busy");
        label.textContent = "Заявка отправлена";
      }, 1900);
    });
  });

  document.querySelectorAll("[data-contact-disclosure]").forEach((disclosure) => {
    const toggle = disclosure.querySelector("[data-contact-disclosure-toggle]");
    const panel = disclosure.querySelector("[data-contact-disclosure-panel]");
    const label = disclosure.querySelector("[data-contact-disclosure-label]");
    if (!(toggle instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) return;

    const resetPanelStyles = () => {
      ["height", "paddingTop", "paddingBottom", "opacity", "transform"].forEach((property) => {
        panel.style[property] = "";
      });
    };
    const setOpen = (isOpen) => {
      const openLabel = toggle.dataset.contactDisclosureOpenLabel || "Показать контакты";
      const closeLabel = toggle.dataset.contactDisclosureCloseLabel || "Скрыть контакты";
      panel.getAnimations().forEach((animation) => animation.cancel());
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? closeLabel : openLabel);
      if (label) label.textContent = isOpen ? closeLabel : openLabel;

      if (reducedMotion.matches) {
        resetPanelStyles();
        panel.hidden = !isOpen;
        return;
      }

      if (isOpen) {
        panel.hidden = false;
        resetPanelStyles();
        const expandedStyles = window.getComputedStyle(panel);
        const openHeight = panel.getBoundingClientRect().height;
        const animation = panel.animate([
          { height: "0px", paddingTop: "0px", paddingBottom: "0px", opacity: 0, transform: "translateY(-6px)" },
          { height: `${openHeight}px`, paddingTop: expandedStyles.paddingTop, paddingBottom: expandedStyles.paddingBottom, opacity: 1, transform: "translateY(0)" },
        ], {
          duration: 460,
          easing: "cubic-bezier(0.22, 0.8, 0.2, 1)",
          fill: "both",
        });
        animation.finished.then(() => {
          if (toggle.getAttribute("aria-expanded") !== "true") return;
          animation.cancel();
          resetPanelStyles();
        }).catch(() => {});
        return;
      }

      const closeHeight = panel.getBoundingClientRect().height;
      const expandedStyles = window.getComputedStyle(panel);
      const animation = panel.animate([
        { height: `${closeHeight}px`, paddingTop: expandedStyles.paddingTop, paddingBottom: expandedStyles.paddingBottom, opacity: 1, transform: "translateY(0)" },
        { height: "0px", paddingTop: "0px", paddingBottom: "0px", opacity: 0, transform: "translateY(-5px)" },
      ], {
        duration: 380,
        easing: "cubic-bezier(0.22, 0.8, 0.2, 1)",
        fill: "both",
      });
      animation.finished.then(() => {
        if (toggle.getAttribute("aria-expanded") !== "false") return;
        animation.cancel();
        panel.hidden = true;
        resetPanelStyles();
      }).catch(() => {});
    };

    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    disclosure.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || panel.hidden) return;
      event.preventDefault();
      setOpen(false);
      toggle.focus();
    });
  });

});
