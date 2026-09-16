
/**
 * Main Application Orchestrator (V7)
 */

/**
 * Global Helpers for UI compatibility
 */
const $ = (id) => document.getElementById(id);
const isLargeScreen = () => window.innerWidth >= 840;

/**
 * Rendering function - Orchestrates all modules
 */
function renderAll() {
    applyTheme();
    applySettings();

    // Keep one faulty section from blocking the rest of the application.
    [
        ["accueil", typeof renderHome === "function" ? renderHome : null],
        ["transactions", typeof renderTransactions === "function" ? renderTransactions : null],
        ["projets", typeof renderProjects === "function" ? renderProjects : null],
        ["mensuel", typeof renderMonthly === "function" ? renderMonthly : null]
    ].forEach(([section, renderer]) => {
        if (!renderer) return;
        try {
            renderer();
        } catch (error) {
            console.error(`Erreur de rendu (${section})`, error);
        }
    });

    // 2. Contextual Detail Rendering
    const isProjDetailActive = $("projectDetailPage") && $("projectDetailPage").classList.contains("active");
    const isProjectsPageActive = $("projectsPage") && $("projectsPage").classList.contains("active");

    if (activeProjectId && (isProjDetailActive || (isProjectsPageActive && isLargeScreen()))) {
        if (typeof renderProjectDetail === 'function') renderProjectDetail();
    }
}

/**
 * Initialization
 */
document.addEventListener("DOMContentLoaded", () => {
    // Events.init handles all delegations (Navigation, Tabs, Actions)
    if (typeof Events !== 'undefined') {
        Events.init();
    }

    // Initial Render
    renderAll();

    // PWA Service Worker
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./service-worker.js")
                .then(reg => console.log("SW Registered"))
                .catch(err => console.error("SW failed", err));
        });
    }
});
