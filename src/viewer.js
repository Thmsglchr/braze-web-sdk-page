(function initBrazeViewer(global) {
  const braze = global.braze;
  const configApi = global.BRAZE_DEMO_CONFIG;

  if (!configApi) {
    console.error("[Braze Demo] Missing shared configuration helpers.");
    return;
  }

  if (!braze) {
    console.error("[Braze Demo] Braze Web SDK failed to load.");
    return;
  }

  const config = configApi.loadConfig();

  if (!config) {
    console.error("[Braze Demo] Missing stored Braze configuration. Redirecting to form.");
    global.location.replace("/");
    return;
  }

  const bannerContainer = global.document.getElementById(configApi.BANNER_PLACEMENT_ID);
  const closeSessionButton = global.document.getElementById("close-session");

  function clearBrazeUi() {
    if (bannerContainer) {
      bannerContainer.innerHTML = "";
      toggleBannerContainer(false);
    }
  }

  function tryCall(methodName) {
    const method = braze && braze[methodName];
    if (typeof method !== "function") {
      return false;
    }

    try {
      method.call(braze);
      console.log("[Braze Demo] Called Braze reset method.", { methodName });
      return true;
    } catch (error) {
      console.warn("[Braze Demo] Braze reset method failed.", { methodName, error });
      return false;
    }
  }

  function resetExistingBrazeState() {
    clearBrazeUi();
    tryCall("removeAllSubscriptions");

    const resetMethods = ["wipeData", "destroy"];
    let resetApplied = false;

    resetMethods.forEach(function applyResetMethod(methodName) {
      resetApplied = tryCall(methodName) || resetApplied;
    });

    if (!resetApplied) {
      console.warn("[Braze Demo] No full Braze reset method detected on this SDK build.");
    }
  }

  function leaveViewerAndReset() {
    console.log("[Braze Demo] Leaving viewer and clearing stored session.");
    resetExistingBrazeState();
    configApi.clearConfig();
    configApi.markResetRequested();
    global.location.replace("/");
  }

  function logBannerCards(cards) {
    const cardCount = Array.isArray(cards) ? cards.length : 0;
    console.log("[Braze Demo] Banner refresh received.", { placementId: configApi.BANNER_PLACEMENT_ID, cardCount });
  }

  function toggleBannerContainer(hasBanner) {
    if (!bannerContainer) {
      return;
    }

    bannerContainer.style.display = hasBanner ? "block" : "none";
    bannerContainer.setAttribute("aria-hidden", hasBanner ? "false" : "true");
  }

  if (configApi.consumeResetRequested()) {
    console.log("[Braze Demo] Reset requested before SDK initialization.");
    resetExistingBrazeState();
  }

  global.resetBrazeDemoSession = leaveViewerAndReset;
  if (closeSessionButton) {
    closeSessionButton.addEventListener("click", leaveViewerAndReset);
  }
  global.addEventListener("keydown", function handleViewerKeydown(event) {
    if (event.key === "Escape") {
      leaveViewerAndReset();
    }
  });

  console.log("[Braze Demo] Initializing Braze Web SDK.", {
    externalId: config.externalId,
    sdkEndpoint: config.sdkEndpoint,
    bannerPlacementId: configApi.BANNER_PLACEMENT_ID,
  });

  braze.initialize(config.sdkKey, {
    baseUrl: config.sdkEndpoint,
    enableLogging: true,
    serviceWorkerLocation: "/service-worker.js",
  });

  braze.subscribeToInAppMessage(function handleInAppMessage(message) {
    console.log("[Braze Demo] In-app message received.", message);
    braze.showInAppMessage(message);
  });

  braze.subscribeToContentCardsUpdates(function handleContentCardsUpdate(update) {
    const cards = update && Array.isArray(update.cards) ? update.cards : [];
    console.log("[Braze Demo] Content Cards update received.", { cardCount: cards.length, update });
  });

  braze.subscribeToBannersUpdates(function handleBannerUpdate(banners) {
    logBannerCards(banners);
    const hasBanner = Array.isArray(banners) && banners.length > 0;
    toggleBannerContainer(hasBanner);

    if (hasBanner) {
      bannerContainer.innerHTML = "";
      braze.insertBanner(banners[0], bannerContainer);
    }
  });

  braze.changeUser(config.externalId);
  braze.openSession();
  braze.requestContentCardsRefresh();
  braze.showContentCards();
  braze.requestBannersRefresh([configApi.BANNER_PLACEMENT_ID]);

  console.log("[Braze Demo] Braze session opened.");
})(window);
