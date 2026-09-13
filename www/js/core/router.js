
/**
 * Router - Page and Project Tab navigation (V8 - Robust)
 */
const Router = {
    /**
     * Main Page Navigation
     */
    navigate(pageId) {
        console.log("Navigating to page:", pageId);
        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        const targetPage = document.getElementById(pageId);
        if (targetPage) targetPage.classList.add("active");

        // Sync Nav Items
        document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.page === pageId));

        // Update Titles
        const titles = {
            homePage: "Accueil",
            transactionsPage: "Transactions",
            projectsPage: "Projets",
            monthlyPage: "Ce mois",
            settingsPage: "Réglages",
            projectDetailPage: "Projet"
        };
        const title = titles[pageId] || "Budget & Projets";
        if (document.getElementById("pageTitle")) document.getElementById("pageTitle").textContent = title;
        if (document.getElementById("sidePageTitle")) document.getElementById("sidePageTitle").textContent = title;

        // Scroll to top
        const scrollArea = document.getElementById("mainScroll");
        if (scrollArea) scrollArea.scrollTo({ top: 0, behavior: "smooth" });
    },

    /**
     * Internal Project Tab Navigation
     */
    switchProjectTab(projectId, tabId) {
        console.log("Switching project tab:", projectId, tabId);
        // 1. Update State
        uiState.activeProjectTab[projectId] = tabId;

        // 2. Full re-render to ensure data consistency and UI sync
        // This is much safer than manual class toggling
        if (typeof renderProjectDetail === 'function') {
            renderProjectDetail();
        }
    }
};

// Global legacy aliases
function navigate(pageId) { Router.navigate(pageId); }
function switchDetailTab(btn, tabDivId) {
    const tabId = tabDivId.replace("tab_", "");
    Router.switchProjectTab(activeProjectId, tabId);
}
