(function initConfigForm(global) {
  const configApi = global.BRAZE_DEMO_CONFIG;
  const form = global.document.getElementById("braze-config-form");

  if (!configApi || !form) {
    return;
  }

  const externalIdInput = global.document.getElementById("external-id");
  const sdkEndpointInput = global.document.getElementById("sdk-endpoint");
  const sdkKeyInput = global.document.getElementById("sdk-key");
  const resetButton = global.document.getElementById("reset-config");
  const existingConfig = configApi.loadConfig();

  if (existingConfig) {
    externalIdInput.value = existingConfig.externalId;
    sdkEndpointInput.value = existingConfig.sdkEndpoint;
    sdkKeyInput.value = existingConfig.sdkKey;
  }

  form.addEventListener("submit", function handleSubmit(event) {
    event.preventDefault();

    const submittedConfig = {
      externalId: externalIdInput.value,
      sdkEndpoint: sdkEndpointInput.value,
      sdkKey: sdkKeyInput.value,
    };

    try {
      const savedConfig = configApi.saveConfig(submittedConfig);
      configApi.markResetRequested();
      console.log("[Braze Demo] Saved Braze configuration.", {
        externalId: savedConfig.externalId,
        sdkEndpoint: savedConfig.sdkEndpoint,
      });
      global.location.href = "/viewer.html";
    } catch (error) {
      console.error("[Braze Demo] Invalid Braze configuration.", error);
      form.reportValidity();
    }
  });

  if (resetButton) {
    resetButton.addEventListener("click", function handleReset() {
      configApi.clearConfig();
      configApi.markResetRequested();
      form.reset();
      console.log("[Braze Demo] Stored Braze configuration cleared.");
    });
  }
})(window);
