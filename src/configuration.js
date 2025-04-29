import * as SDK from "vss-web-extension-sdk";

console.log("configuration.js starting execution.");

SDK.init({
    loaded: false,
    applyTheme: true
});

SDK.ready().then(() => {
    console.log("Configuration SDK Ready. Initializing configuration logic.");

    const contributionId = "repo-html-viewer-widget-configuration";
    console.log("Registering configuration contribution:", contributionId);

    SDK.register(contributionId, () => {
        const $repoNameInput = document.getElementById("repo-name");
        const $filePathInput = document.getElementById("file-path");
        const $repoValidation = document.getElementById("repo-validation");
        const $pathValidation = document.getElementById("path-validation");

        if (!$repoNameInput || !$filePathInput || !$repoValidation || !$pathValidation) {
            console.error("Configuration input elements not found in the DOM!");
            return {
                load: () => SDK.WidgetConfigurationSave.Invalid(),
                onSave: () => SDK.WidgetConfigurationSave.Invalid()
            };
        }

        const validateInputs = () => {
            let isValid = true;
            $repoValidation.textContent = "";
            $pathValidation.textContent = "";

            if (!$repoNameInput.value.trim()) {
                $repoValidation.textContent = "Repository Name or ID is required.";
                isValid = false;
            }

            const filePathValue = $filePathInput.value.trim();
            if (!filePathValue) {
                $pathValidation.textContent = "File path is required.";
                isValid = false;
            } else if (!filePathValue.startsWith('/')) {
                $pathValidation.textContent = "File path must start with a '/'.";
                isValid = false;
            } else if (!filePathValue.toLowerCase().endsWith('.html') &&
                       !filePathValue.toLowerCase().endsWith('.htm')) {
                $pathValidation.textContent = "File path must end with '.html' or '.htm'.";
                isValid = false;
            }

            console.log("Validation result:", isValid);
            return isValid;
        };

        return {
            load: (settings, configurationContext) => {
                console.log("Configuration load called", settings);

                if (settings?.customSettings?.data) {
                    try {
                        const data = JSON.parse(settings.customSettings.data);
                        $repoNameInput.value = data.repoName || "";
                        $filePathInput.value = data.filePath || "";
                        console.log("Loaded settings into inputs:", data);
                    } catch (e) {
                        console.error("Failed to parse existing settings:", e);
                        $repoNameInput.value = "";
                        $filePathInput.value = "";
                    }
                } else {
                    console.log("No existing settings found.");
                    $repoNameInput.value = "";
                    $filePathInput.value = "";
                }

                const notifyHost = () => {
                    if (validateInputs()) {
                        const customSettings = {
                            data: JSON.stringify({
                                repoName: $repoNameInput.value.trim(),
                                filePath: $filePathInput.value.trim()
                            })
                        };
                        configurationContext.notify(SDK.WidgetConfigurationSave.Valid(), { customSettings });
                        console.log("Notified host: Valid configuration");
                    } else {
                        configurationContext.notify(SDK.WidgetConfigurationSave.Invalid());
                        console.log("Notified host: Invalid configuration");
                    }
                };

                [$repoNameInput, $filePathInput].forEach(input => {
                    input.addEventListener("input", notifyHost);
                });

                notifyHost(); // Trigger validation and notify host initially
            },

            onSave: () => {
                console.log("Configuration onSave called");

                if (!validateInputs()) {
                    console.error("Attempted to save invalid configuration.");
                    return SDK.WidgetConfigurationSave.Invalid();
                }

                const customSettings = {
                    data: JSON.stringify({
                        repoName: $repoNameInput.value.trim(),
                        filePath: $filePathInput.value.trim()
                    })
                };

                console.log("Saving settings:", customSettings);

                return {
                    result: SDK.WidgetConfigurationSave.Valid(),
                    settings: {
                        customSettings
                    }
                };
            }
        };
    });

    console.log("Configuration script loaded and registered. Notifying host.");
    SDK.notifyLoadSucceeded();
});

console.log("configuration.js initial script execution finished. Waiting for SDK.ready().");
