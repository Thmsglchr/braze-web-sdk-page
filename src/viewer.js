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
  const viewerStartedAt = Date.now();

  if (!config) {
    console.error("[Braze Demo] Missing stored Braze configuration. Redirecting to form.");
    global.location.replace("/");
    return;
  }

  const bannerContainer = global.document.getElementById(configApi.BANNER_PLACEMENT_ID);
  const closeSessionButton = global.document.getElementById("close-session");
  let latestContentCardCount = 0;
  let contentCardsRetryTimeoutId = null;

  function elapsedMs() {
    return Date.now() - viewerStartedAt;
  }

  function logWithTimestamp(message, payload) {
    console.log(message, Object.assign({ elapsedMs: elapsedMs() }, payload || {}));
  }

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

    const resetMethods = ["wipeData"];
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
    if (contentCardsRetryTimeoutId) {
      global.clearTimeout(contentCardsRetryTimeoutId);
      contentCardsRetryTimeoutId = null;
    }
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
    logWithTimestamp("[Braze Demo] Reset requested before SDK initialization.");
    clearBrazeUi();
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

  logWithTimestamp("[Braze Demo] Initializing Braze Web SDK.", {
    externalId: config.externalId,
    sdkEndpoint: config.sdkEndpoint,
    bannerPlacementId: configApi.BANNER_PLACEMENT_ID,
  });

  braze.initialize(config.sdkKey, {
    allowUserSuppliedJavascript: true,
    baseUrl: config.sdkEndpoint,
    enableLogging: true,
    minimumIntervalBetweenTriggerActionsInSeconds: 0,
    serviceWorkerLocation: "/service-worker.js",
    sessionTimeoutInSeconds: 1,
  });

  braze.automaticallyShowInAppMessages();

  braze.subscribeToInAppMessage(function handleInAppMessage(message) {
    logWithTimestamp("[Braze Demo] In-app message received.", { message });
  });

  braze.subscribeToContentCardsUpdates(function handleContentCardsUpdate(contentCards) {
    const cards = contentCards && Array.isArray(contentCards.cards) ? contentCards.cards : [];
    latestContentCardCount = cards.length;
    logWithTimestamp("[Braze Demo] Content Cards update received.", {
      cardCount: cards.length,
      contentCards,
      lastUpdated: contentCards ? contentCards.lastUpdated : null,
    });
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

  if (typeof braze.getCachedContentCards === "function") {
    const cachedContentCards = braze.getCachedContentCards();
    const cachedCards = cachedContentCards && Array.isArray(cachedContentCards.cards) ? cachedContentCards.cards : [];
    latestContentCardCount = cachedCards.length;
    logWithTimestamp("[Braze Demo] Cached Content Cards snapshot.", {
      cardCount: cachedCards.length,
      cachedContentCards,
      lastUpdated: cachedContentCards ? cachedContentCards.lastUpdated : null,
    });
  }

  braze.requestContentCardsRefresh(
    function handleContentCardsRefreshSuccess() {
      logWithTimestamp("[Braze Demo] Content Cards refresh succeeded.", {
        cardCount: latestContentCardCount,
      });
    },
    function handleContentCardsRefreshError(error) {
      logWithTimestamp("[Braze Demo] Content Cards refresh failed.", { error });
    }
  );
  braze.showContentCards();
  braze.requestBannersRefresh([configApi.BANNER_PLACEMENT_ID]);

  contentCardsRetryTimeoutId = global.setTimeout(function retryContentCardsRefresh() {
    if (latestContentCardCount > 0) {
      logWithTimestamp("[Braze Demo] Skipping delayed Content Cards retry because cards are already available.", {
        cardCount: latestContentCardCount,
      });
      return;
    }

    logWithTimestamp("[Braze Demo] Retrying Content Cards refresh after initial empty result.");
    braze.requestContentCardsRefresh(
      function handleRetrySuccess() {
        logWithTimestamp("[Braze Demo] Delayed Content Cards refresh succeeded.", {
          cardCount: latestContentCardCount,
        });
      },
      function handleRetryError(error) {
        logWithTimestamp("[Braze Demo] Delayed Content Cards refresh failed.", { error });
      }
    );
  }, 3000);

  logWithTimestamp("[Braze Demo] Braze session opened.");
})(window);
