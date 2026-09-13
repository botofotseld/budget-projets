
/**
 * Router - Page and Project Tab navigation
 */
const Router = {
    /**
     * Main Page Navigation
     */
    navigate(pageId) {
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
        // 1. Save UI State
        uiState.activeProjectTab[projectId] = tabId;

        // 2. Immediate UI Feedback (CSS classes)
        const tabButtons = document.querySelectorAll(".detail-tabs button");
        tabButtons.forEach(btn => {
            const isTarget = btn.getAttribute("data-tab-id") === tabId;
            btn.classList.toggle("active", isTarget);
        });

        const panes = document.querySelectorAll(".op-pane");
        panes.forEach(pane => {
            const isTarget = pane.id === `tab_${tabId}`;
            pane.classList.toggle("active", isTarget);
        });

        console.log(`Switched to tab: ${tabId} for project: ${projectId}`);
    }
};

// Global legacy aliases
function navigate(pageId) { Router.navigate(pageId); }
function switchDetailTab(btn, tabDivId) {
    // Legacy support if needed, but we'll migrate to data-attributes
    const tabId = tabDivId.replace("tab_", "");
    Router.switchProjectTab(activeProjectId, tabId);
}
