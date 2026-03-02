(function initBrazeConfig(global) {
  const STORAGE_KEY = "braze-web-sdk-page-config";
  const RESET_FLAG_KEY = "braze-web-sdk-page-reset";
  const BANNER_PLACEMENT_ID = "demo-banner";

  function normalizeEndpoint(value) {
    return value.trim().replace(/^https?:\/\//i, "").replace(/\/+$/g, "");
  }

  function sanitizeConfig(config) {
    return {
      externalId: (config.externalId || "").trim(),
      sdkEndpoint: normalizeEndpoint(config.sdkEndpoint || ""),
      sdkKey: (config.sdkKey || "").trim(),
    };
  }

  function hasRequiredConfig(config) {
    return Boolean(config.externalId && config.sdkEndpoint && config.sdkKey);
  }

  function loadConfig() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      const sanitized = sanitizeConfig(parsed);
      return hasRequiredConfig(sanitized) ? sanitized : null;
    } catch (error) {
      console.error("[Braze Demo] Failed to load stored config.", error);
      return null;
    }
  }

  function saveConfig(config) {
    const sanitized = sanitizeConfig(config);

    if (!hasRequiredConfig(sanitized)) {
      throw new Error("Missing required Braze configuration.");
    }

    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    return sanitized;
  }

  function clearConfig() {
    global.localStorage.removeItem(STORAGE_KEY);
  }

  function markResetRequested() {
    global.sessionStorage.setItem(RESET_FLAG_KEY, "1");
  }

  function consumeResetRequested() {
    const isRequested = global.sessionStorage.getItem(RESET_FLAG_KEY) === "1";
    global.sessionStorage.removeItem(RESET_FLAG_KEY);
    return isRequested;
  }

  global.BRAZE_DEMO_CONFIG = {
    STORAGE_KEY,
    RESET_FLAG_KEY,
    BANNER_PLACEMENT_ID,
    clearConfig,
    consumeResetRequested,
    hasRequiredConfig,
    loadConfig,
    markResetRequested,
    normalizeEndpoint,
    saveConfig,
  };
})(window);
