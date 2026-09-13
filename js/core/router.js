
/**
 * Router - Simple page navigation management
 */
const Router = {
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
    }
};

// Global legacy alias
function navigate(pageId) { Router.navigate(pageId); }
