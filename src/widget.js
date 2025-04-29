// Use standard import ONLY for the SDK entry point.
// Specific TFS/VSS modules will be loaded dynamically using VSS.require().
import * as SDK from "vss-web-extension-sdk";

console.log("widget.js (HTML Viewer) starting execution.");




// Initialize the SDK before using any VSS/SDK functions
SDK.init({
    explicitNotifyLoaded: true,
    usePlatformScripts: true
});


if (typeof SDK === 'undefined') {
    console.error('SDK is not loaded properly');
  } else {
    console.log('SDK is loaded');
  }

// Wait until the environment is ready
VSS.ready(function () {
    console.log("VSS.ready() callback executing. Initializing widget logic.");

    // Dynamically load required TFS/VSS modules
    VSS.require(
        ["TFS/VersionControl/GitRestClient", "TFS/VersionControl/Contracts"],
        function (GitRestClient, GitContracts) {
            console.log("TFS/VersionControl modules loaded via VSS.require().");
            if (GitRestClient && GitContracts) {
                console.log("GitRestClient and GitContracts are available.");
            } else {
                console.error("Failed to load required modules.");
            }
            const getClient = GitRestClient.getClient;
            const GitVersionType = GitContracts.GitVersionType;

            /**
             * Helper function to display messages (loading, errors, info)
             * @param {string} message - The text message to display.
             * @param {boolean} isError - Optional flag to style as an error.
             */
            const showMessage = (message, isError = false) => {
                const messageArea = document.getElementById("message-area");
                const iframe = document.getElementById("content-frame");
                if (messageArea) {
                    messageArea.textContent = message;
                    messageArea.className = isError ? 'error-message' : '';
                    messageArea.style.display = 'block';
                } else {
                    console.warn("Message area element not found.");
                }
                if (iframe) {
                    iframe.style.display = 'none';
                    iframe.srcdoc = '';
                } else {
                    console.warn("Content frame element not found.");
                }
                console.log(`Widget Message: ${message} ${isError ? '(Error)' : ''}`);
            };

            /**
             * Helper function to display fetched HTML content in the iframe
             * @param {string} htmlContent - The HTML content string.
             */
            const showHtmlContent = (htmlContent) => {
                const messageArea = document.getElementById("message-area");
                const iframe = document.getElementById("content-frame");
                if (iframe) {
                    iframe.srcdoc = htmlContent;
                    iframe.style.display = 'block';
                } else {
                    console.error("Content frame element not found. Cannot display HTML.");
                }
                if (messageArea) {
                    messageArea.style.display = 'none';
                } else {
                    console.warn("Message area element not found.");
                }
                console.log("Attempting to display fetched HTML content in iframe.");
            };

            // Main widget load function
            const loadWidget = async (widgetSettings) => {
                console.log("Widget load/reload called.", widgetSettings);
                showMessage("Loading configuration...");

                // Get and parse settings
                let repoName, filePath;
                if (widgetSettings.customSettings && widgetSettings.customSettings.data) {
                    try {
                        const settingsData = JSON.parse(widgetSettings.customSettings.data);
                        repoName = settingsData.repoName;
                        filePath = settingsData.filePath;
                        console.log(`Config loaded: Repo='${repoName}', Path='${filePath}'`);
                    } catch (e) {
                        showMessage("Error parsing widget settings. Please reconfigure.", true);
                        console.error("Error parsing settings:", e);
                        return SDK.WidgetStatusHelper.Failure("Invalid settings format.");
                    }
                }

                if (!repoName || !filePath) {
                    showMessage("Widget not configured. Please configure the repository name and file path.");
                    return SDK.WidgetStatusHelper.Success();
                }

                // Get current context
                const context = VSS.getWebContext();
                const projectId = context.project.id;
                const gitClient = getClient();

                // Fetch and display HTML file content
                try {
                    console.log(`Calling getItemText for Project: ${projectId}, Repo: ${repoName}, Path: ${filePath}`);
                    const fileContent = await gitClient.getItemText(
                        repoName, filePath, projectId, null, null, null
                    );
                    console.log(`Successfully fetched content for ${filePath}. Length: ${fileContent.length}`);
                    showHtmlContent(fileContent);
                    return SDK.WidgetStatusHelper.Success();
                } catch (error) {
                    console.error("Error fetching file content:", error);
                    let errorMessage = `Error fetching file: ${error.message || 'Unknown error'}`;
                    if (error.status === 404) {
                        errorMessage = `File not found at path '${filePath}' in repository '${repoName}'. Check configuration.`;
                    } else if (error.status === 403) {
                        errorMessage = `Permission denied. Ensure the Project Build Service has read access to the repository '${repoName}'.`;
                    } else if (error.serverError && error.serverError.typeKey === 'GitRepositoryNotFoundException') {
                        errorMessage = `Repository '${repoName}' not found in project '${context.project.name}'. Check configuration.`;
                    }
                    showMessage(errorMessage, true);
                    return SDK.WidgetStatusHelper.Failure(errorMessage);
                }
            };

            // Register the widget with the platform
            console.log("Registering widget contribution:", SDK.getContributionId());
            SDK.register(SDK.getContributionId(), {
                load: loadWidget,
                reload: loadWidget
            });

            console.log("Widget registration complete.");
        }
    );
});

console.log("widget.js initial script execution finished. Waiting for VSS.ready().");
