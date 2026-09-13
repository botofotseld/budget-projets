
/**
 * Global Event Handlers Initialization
 */
const Events = {
    init() {
        // Tab Navigation
        document.querySelectorAll(".nav-item").forEach(b => b.addEventListener("click", () => navigate(b.dataset.page)));
        document.querySelectorAll("[data-nav]").forEach(b => b.addEventListener("click", () => navigate(b.dataset.nav)));

        // Global Actions
        if ($("addTxBtn")) $("addTxBtn").addEventListener("click", addTransaction);
        if ($("createProjectBtn")) $("createProjectBtn").addEventListener("click", createProject);
        if ($("txFilter")) $("txFilter").addEventListener("change", renderTransactions);
        if ($("backProjectsBtn")) $("backProjectsBtn").addEventListener("click", () => navigate("projectsPage"));
        if ($("quickAddBtn")) $("quickAddBtn").addEventListener("click", () => navigate("transactionsPage"));

        // Settings
        if ($("themeSelect")) $("themeSelect").addEventListener("change", (e) => { state.theme = e.target.value; persist(); });
        if ($("mainCurrencySelect")) $("mainCurrencySelect").addEventListener("change", (e) => { state.mainCurrency = e.target.value; persist(); });
        if ($("showArFmgToggle")) $("showArFmgToggle").addEventListener("change", (e) => { state.showArFmg = e.target.checked; persist(); });
        if ($("rateEur")) $("rateEur").addEventListener("change", (e) => { state.rates.EUR = parseFloat(e.target.value) || 5000; persist(); });
        if ($("rateUsd")) $("rateUsd").addEventListener("change", (e) => { state.rates.USD = parseFloat(e.target.value) || 4500; persist(); });

        // Backup & Restore
        if ($("exportBtn")) $("exportBtn").addEventListener("click", () => StorageService.export(state));
        if ($("importInput")) $("importInput").addEventListener("change", (e) => {
            const f = e.target.files[0]; if (!f) return;
            StorageService.import(f, (err, ns) => { if (err) return alert("Invalide."); state = ns; renderAll(); alert("Importé."); });
        });
        if ($("resetBtn")) $("resetBtn").addEventListener("click", () => StorageService.reset());

        // Multi-currency Hints
        if ($("txAmount")) $("txAmount").addEventListener("input", () => updateFmgHint("txAmount", "txCurrency", "txFmgHint"));
        if ($("txCurrency")) $("txCurrency").addEventListener("change", () => updateFmgHint("txAmount", "txCurrency", "txFmgHint"));
        document.addEventListener("input", (e) => { if (e.target.id === "detailExpenseAmount") updateFmgHint("detailExpenseAmount", "detailExpenseCurrency", "detailExpenseFmgHint"); });
        document.addEventListener("change", (e) => { if (e.target.id === "detailExpenseCurrency") updateFmgHint("detailExpenseAmount", "detailExpenseCurrency", "detailExpenseFmgHint"); });

        // Resize
        window.addEventListener("resize", () => {
            if ($("projectDetailPage") && $("projectDetailPage").classList.contains("active") && isLargeScreen()) navigate("projectsPage");
            renderAll();
        });

        // PWA Install
        this.initPWA();
    },

    initPWA() {
        let deferredInstallPrompt = null;
        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            if ($("installBtn")) $("installBtn").hidden = false;
        });
        if ($("installBtn")) $("installBtn").addEventListener("click", async () => {
            if (!deferredInstallPrompt) return;
            deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;
            $("installBtn").hidden = true;
        });
        window.addEventListener("appinstalled", () => {
            deferredInstallPrompt = null;
            if ($("installBtn")) $("installBtn").hidden = true;
        });
    }
};

function updateFmgHint(aId, cId, hId) {
    const a = parseFloat($(aId).value), c = $(cId).value;
    if (!state.showArFmg || !a || (c !== 'MGA' && c !== 'FMG')) { if ($(hId)) $(hId).style.display = 'none'; return; }
    if ($(hId)) {
        $(hId).textContent = `= ${c === 'MGA' ? Currency.format(Currency.arToFmg(a), 'FMG') : Currency.format(Currency.fmgToAr(a), 'MGA')}`;
        $(hId).style.display = 'block';
    }
}
