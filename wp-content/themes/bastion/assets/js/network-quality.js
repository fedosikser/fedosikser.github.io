(() => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const scriptUrl = document.currentScript?.src || "";
  const originalSrcsets = new WeakMap();
  let quality = "balanced";

  const detectQuality = () => {
    if (["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) {
      return "high";
    }

    const effectiveType = String(connection?.effectiveType || "").toLowerCase();
    const downlink = Number(connection?.downlink || 0);
    if (connection?.saveData || ["slow-2g", "2g", "3g"].includes(effectiveType) || (downlink > 0 && downlink < 2)) {
      return "constrained";
    }
    if (effectiveType === "4g" && (!downlink || downlink >= 5)) return "high";
    return "balanced";
  };

  const filterSrcset = (srcset) => {
    if (!srcset || quality === "high") return srcset;
    const maximumWidth = quality === "constrained" ? 900 : 1440;
    const candidates = srcset.split(",").map((candidate) => {
      const value = candidate.trim();
      const match = value.match(/\s(\d+)w$/);
      return { value, width: match ? Number(match[1]) : 0 };
    }).filter(({ value }) => value);
    const limited = candidates.filter(({ width }) => !width || width <= maximumWidth);
    return (limited.length ? limited : candidates.slice(0, 1)).map(({ value }) => value).join(", ");
  };

  const rememberSrcset = (image) => {
    const original = image.dataset.qualitySrcset
      || originalSrcsets.get(image)
      || image.dataset.srcset
      || image.getAttribute("srcset")
      || "";
    if (original) originalSrcsets.set(image, original);
    return original;
  };

  const adaptImage = (image) => {
    if (!(image instanceof HTMLImageElement)) return;
    const originalSrcset = rememberSrcset(image);
    const nextSrcset = filterSrcset(originalSrcset);
    if (!nextSrcset) return;

    if (image.hasAttribute("data-srcset")) {
      image.dataset.srcset = nextSrcset;
    }
    if (image.hasAttribute("srcset")) {
      image.setAttribute("srcset", nextSrcset);
    }
  };

  const applyQuality = (nextQuality = detectQuality()) => {
    quality = nextQuality;
    document.documentElement.dataset.imageQuality = quality;
    document.querySelectorAll("img[srcset], img[data-srcset], img[data-quality-srcset]").forEach(adaptImage);
  };

  const measureQuality = async () => {
    if (connection || !scriptUrl || ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) return;

    try {
      const probeUrl = new URL("../images/responsive/480/door-entry-luxury.webp", scriptUrl);
      probeUrl.searchParams.set("speed-test", String(Date.now()));
      const startedAt = performance.now();
      const response = await fetch(probeUrl, { cache: "no-store", credentials: "same-origin" });
      const payload = await response.blob();
      const duration = Math.max(performance.now() - startedAt, 1);
      const megabitsPerSecond = (payload.size * 8) / (duration * 1000);
      applyQuality(megabitsPerSecond < 2 ? "constrained" : (megabitsPerSecond >= 5 ? "high" : "balanced"));
    } catch (error) {
      // Keep the balanced profile when a browser or intermediary blocks the probe.
    }
  };

  window.bastionImagePolicy = {
    get quality() { return quality; },
    adaptSrcset: filterSrcset,
  };
  document.cookie = "bastion_image_quality=; path=/; max-age=0; SameSite=Lax";
  applyQuality();
  measureQuality();
  new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) return;
      if (node.matches("img[srcset], img[data-srcset], img[data-quality-srcset]")) adaptImage(node);
      node.querySelectorAll("img[srcset], img[data-srcset], img[data-quality-srcset]").forEach(adaptImage);
    }));
  }).observe(document.documentElement, { childList: true, subtree: true });
  connection?.addEventListener?.("change", () => applyQuality());
  window.addEventListener("online", () => {
    applyQuality();
    measureQuality();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    applyQuality();
    measureQuality();
  });
})();
