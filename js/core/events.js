
/**
 * Global Event Handlers Initialization (V8 - Robust & Debugged)
 */
const Events = {
    init() {
        console.log("Initializing Global Events...");

        // --- 1. Global CLICK Delegation (Airtight) ---
        document.addEventListener("click", e => {
            const el = e.target.closest("[data-page], [data-nav], [data-tab-id], [data-action]");
            if (!el) return;

            // Prevent default for buttons and links
            if (el.tagName === 'BUTTON' || el.tagName === 'A') {
                // e.preventDefault(); // Careful with this, might break some inputs
            }

            const ds = el.dataset;
            console.log("Global click caught:", { ds, id: el.id, class: el.className });

            // Page Navigation
            if (ds.page) return Router.navigate(ds.page);
            if (ds.nav) return Router.navigate(ds.nav);

            // Project Tab Switch
            if (ds.tabId) {
                const pid = ds.projectId || activeProjectId;
                console.log("Tab switch requested:", ds.tabId, "for project:", pid);
                if (pid) {
                    Router.switchProjectTab(pid, ds.tabId);
                    return;
                }
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

        // --- 3. Fixed Buttons (Non-dynamic, mostly at launch) ---
        const bind = (id, evt, fn) => { const x=document.getElementById(id); if(x) x.addEventListener(evt, fn); };

        bind("addTxBtn", "click", addTransaction);
        bind("createProjectBtn", "click", createProject);
        bind("txFilter", "change", renderTransactions);
        bind("backProjectsBtn", "click", () => Router.navigate("projectsPage"));
        bind("quickAddBtn", "click", () => Router.navigate("transactionsPage"));
        bind("exportBtn", "click", () => StorageService.export(state));
        bind("resetBtn", "click", () => StorageService.reset());

        const importIn = document.getElementById("importInput");
        if (importIn) importIn.addEventListener("change", (e) => {
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
            if (document.getElementById("projectDetailPage") && document.getElementById("projectDetailPage").classList.contains("active") && isLargeScreen()) {
                Router.navigate("projectsPage");
            }
            renderAll();
        });

        this.initPWA();
    },

    initPWA() {
        let deferredInstallPrompt = null;
        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            const btn = document.getElementById("installBtn");
            if (btn) btn.hidden = false;
        });
        const installBtn = document.getElementById("installBtn");
        if (installBtn) installBtn.addEventListener("click", async () => {
            if (!deferredInstallPrompt) return;
            deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;
            installBtn.hidden = true;
        });
        window.addEventListener("appinstalled", () => {
            deferredInstallPrompt = null;
            const btn = document.getElementById("installBtn");
            if (btn) btn.hidden = true;
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
