
/**
 * Global Event Handlers Initialization (V7 - Robust Delegation)
 */
const Events = {
    init() {
        // --- 1. Global CLICK Delegation ---
        document.addEventListener("click", e => {
            const el = e.target.closest("[data-page], [data-nav], [data-tab-id], [data-action]");
            if (!el) return;

            const ds = el.dataset;

            // Page Navigation
            if (ds.page) return navigate(ds.page);
            if (ds.nav) return navigate(ds.nav);

            // Project Tab Switch
            if (ds.tabId && activeProjectId) {
                return Router.switchProjectTab(activeProjectId, ds.tabId);
            }

            // Project Actions
            if (ds.action === "archive-project") return archiveProject(ds.projectId);
            if (ds.action === "save-worker") return saveWorker(ds.projectId);
            if (ds.action === "pay-worker") return payWorker(ds.projectId, ds.workerId);
            if (ds.action === "save-material") return saveMaterial(ds.projectId);
            if (ds.action === "buy-material") return openAchatMaterial(ds.projectId, ds.materialId);
            if (ds.action === "save-inventory-item") return saveInventoryItem(ds.projectId);
            if (ds.action === "sell-product") return sellProduct(ds.projectId, ds.itemId);
            if (ds.action === "buy-stock") return buyStock(ds.projectId, ds.itemId);
            if (ds.action === "save-booking") return saveBooking(ds.projectId, ds.tabId);
            if (ds.action === "save-task") return addTask(ds.projectId);
            if (ds.action === "save-generic-data") return saveGenericData(ds.projectId, ds.tabId);
            if (ds.action === "delete-generic") return deleteGenericData(ds.itemId);
            if (ds.action === "add-library-tab") return addLibraryTab(ds.projectId);
            if (ds.action === "delete-custom-tab") return deleteCustomTab(ds.projectId, ds.tabId);
            if (ds.action === "save-project-expense") return addProjectExpense(ds.projectId);
        });

        // --- 2. Global CHANGE Delegation ---
        document.addEventListener("change", e => {
            const el = e.target;

            // Project Status
            if (el.classList.contains("status-select") && activeProjectId) {
                updateProjectStatus(activeProjectId, el.value);
            }

            // Task Toggle (Checkbox)
            if (el.dataset.action === "toggle-task") {
                toggleTask(el.dataset.taskId, el.dataset.projectId);
            }

            // Settings
            if (el.id === "themeSelect") { state.theme = el.value; persist(); }
            if (el.id === "mainCurrencySelect") { state.mainCurrency = el.value; persist(); }
            if (el.id === "showArFmgToggle") { state.showArFmg = el.checked; persist(); }
            if (el.id === "rateEur") { state.rates.EUR = parseFloat(el.value) || 5200; persist(); }
            if (el.id === "rateUsd") { state.rates.USD = parseFloat(el.value) || 4700; persist(); }

            // Filter
            if (el.id === "txFilter") renderTransactions();
        });

        // --- 3. Fixed Buttons (Non-dynamic) ---
        const bind = (id, evt, fn) => { const x=$(id); if(x) x.addEventListener(evt, fn); };
        bind("addTxBtn", "click", addTransaction);
        bind("createProjectBtn", "click", createProject);
        bind("backProjectsBtn", "click", () => navigate("projectsPage"));
        bind("quickAddBtn", "click", () => navigate("transactionsPage"));
        bind("exportBtn", "click", () => StorageService.export(state));
        bind("resetBtn", "click", () => StorageService.reset());

        if ($("importInput")) $("importInput").addEventListener("change", (e) => {
            const f = e.target.files[0]; if (!f) return;
            StorageService.import(f, (err, ns) => { if (err) return alert("Invalide."); state = ns; renderAll(); alert("Importé."); });
        });

        // --- 4. Form Helpers ---
        document.addEventListener("input", e => {
            const el = e.target;
            if (el.id === "txAmount" || el.id === "txCurrency") updateFmgHint("txAmount", "txCurrency", "txFmgHint");
            if (el.id === "detailExpenseAmount" || el.id === "detailExpenseCurrency") updateFmgHint("detailExpenseAmount", "detailExpenseCurrency", "detailExpenseFmgHint");
        });

        // --- 5. System ---
        window.addEventListener("resize", () => {
            if ($("projectDetailPage") && $("projectDetailPage").classList.contains("active") && isLargeScreen()) navigate("projectsPage");
            renderAll();
        });

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
    const amountInput = document.getElementById(aId);
    const currencyInput = document.getElementById(cId);
    const hintArea = document.getElementById(hId);
    if (!amountInput || !currencyInput || !hintArea) return;
    const a = parseFloat(amountInput.value);
    const c = currencyInput.value;
    if (!state.showArFmg || !a || (c !== 'MGA' && c !== 'FMG')) { hintArea.style.display = 'none'; return; }
    hintArea.textContent = `= ${c === 'MGA' ? Currency.format(Currency.arToFmg(a), 'FMG') : Currency.format(Currency.fmgToAr(a), 'MGA')}`;
    hintArea.style.display = 'block';
}
