
/**
 * Main Application Orchestrator (V6)
 */

/**
 * Rendering function - Orchestrates all modules
 */
function renderAll() {
    applyTheme();
    applySettings();

    // 1. Core Modules Rendering
    if (typeof renderHome === 'function') renderHome();
    if (typeof renderTransactions === 'function') renderTransactions();
    if (typeof renderProjects === 'function') renderProjects();
    if (typeof renderMonthly === 'function') renderMonthly();

    // 2. Contextual Detail Rendering
    const isProjDetailActive = $("projectDetailPage") && $("projectDetailPage").classList.contains("active");
    const isProjectsListActive = $("projectsPage") && $("projectsPage").classList.contains("active");

    if (activeProjectId && (isProjDetailActive || (isProjectsListActive && isLargeScreen()))) {
        if (typeof renderProjectDetail === 'function') renderProjectDetail();
    }
}

/**
 * Global Helpers for UI compatibility (Aliases to Services)
 */
const $ = (id) => document.getElementById(id);
const isLargeScreen = () => window.innerWidth >= 840;

// Legacy aliases for calculation (now handled by FinanceService)
function totalAssets() {
    const cash = FinanceService.getAvailableBalance(state.mainCurrency);
    const projects = state.projects.reduce((s, p) => s + FinanceService.getProjectSummary(p.id, state.mainCurrency).treasury, 0);
    return cash + projects;
}

function availableBalance(curr) { return FinanceService.getAvailableBalance(curr || state.mainCurrency); }

function monthIncome() {
    return state.transactions
        .filter(t => t.month === monthKey() && [TransactionService.TYPES.INCOME, TransactionService.TYPES.REVENUE].includes(t.type))
        .reduce((s, t) => s + Currency.convert(t.amount, t.currency, state.mainCurrency, state.rates), 0);
}

function monthExpenses() {
    const types = [TransactionService.TYPES.EXPENSE, TransactionService.TYPES.PAYMENT, TransactionService.TYPES.PURCHASE];
    return state.transactions
        .filter(t => t.month === monthKey() && types.includes(t.type))
        .reduce((s, t) => s + Currency.convert(t.amount, t.currency, state.mainCurrency, state.rates), 0);
}

/**
 * Initialization
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Ensure state is loaded (already done in core/state.js)

    // 2. Initialize Events
    if (typeof Events !== 'undefined') {
        Events.init();
    }

    // 3. Initial Render
    renderAll();

    // 4. Service Worker Registration
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./service-worker.js")
                .then(reg => console.log("SW Registered", reg))
                .catch(err => console.error("SW Registration failed", err));
        });
    }
});
