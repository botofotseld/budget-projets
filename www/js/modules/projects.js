
/**
 * Projects Module - Lifecycle and Detail rendering (V8 - Robust)
 */
function renderProjects() {
    const active = state.projects.filter(p => p.status !== "Archivé");
    const archived = state.projects.filter(p => p.status === "Archivé");
    if ($("projectsList")) {
        $("projectsList").innerHTML = `<div class="section-head"><h2>Projets actifs</h2></div>${active.length ? active.map(p => projectCard(p)).join("") : `<div class="card empty">Aucun projet actif</div>`}${archived.length ? `<div class="section-head"><h2>Archivés</h2></div>${archived.map(p => `<div class="card"><div class="project-card-header"><strong>${p.icon} ${esc(p.name)}</strong><div class="project-list-actions"><button class="secondary" data-action="open-project" data-project-id="${p.id}">Ouvrir</button><button class="secondary" data-action="reactivate-project" data-project-id="${p.id}">Réactiver</button><button class="danger" data-action="delete-project" data-project-id="${p.id}">Supprimer</button></div></div></div>`).join("")}` : ""}`;
    }
}

function createProject() {
    const name = $("projectName").value.trim();
    const target = parseFloat($("projectTarget").value);
    if (!name || !target || target <= 0) return alert("Nom et objectif ?");
    const subType = $("projectType").value;
    const config = PROJECT_TYPES[subType] || PROJECT_TYPES.house;
    state.projects.push({ id: uid(), name, target, subType, icon: $("projectIcon").value.trim() || config.icon, currency: $("projectCurrency").value, type: subType === "simple" ? "simple" : "detailed", status: "En cours", created: new Date().toISOString(), customTabs: [] });
    $("projectName").value = ""; $("projectIcon").value = ""; $("projectTarget").value = "";
    persist();
}

function editProject(id) {
    if (!state.projects.some(project => project.id === id)) return;
    uiState.editingProjectId = id;
    renderProjectDetail();
}

function cancelProjectEdit(id) {
    if (uiState.editingProjectId === id) uiState.editingProjectId = null;
    renderProjectDetail();
}

function saveProjectEdit(id) {
    const project = state.projects.find(item => item.id === id);
    if (!project) return;

    const name = $("editProjectName")?.value.trim();
    const target = parseFloat($("editProjectTarget")?.value);
    const subType = $("editProjectType")?.value;
    const config = PROJECT_TYPES[subType] || PROJECT_TYPES.house;
    if (!name || !target || target <= 0) return alert("Le nom et l'objectif financier sont obligatoires.");

    project.name = name;
    project.target = target;
    project.subType = subType;
    project.type = "detailed";
    project.icon = $("editProjectIcon")?.value.trim() || config.icon;
    project.currency = $("editProjectCurrency")?.value || project.currency;
    project.updatedAt = new Date().toISOString();
    uiState.editingProjectId = null;
    persist();
}

async function deleteProject(id) {
    const project = state.projects.find(item => item.id === id);
    if (!project) return;
    const confirmed = confirm(`Supprimer définitivement « ${project.name} » ?\n\nToutes ses transactions, données, tâches et photos seront également supprimées.`);
    if (!confirmed) return;

    try {
        if (typeof AttachmentService !== "undefined") await AttachmentService.deleteByProject(id);
    } catch (error) {
        console.error("Project photo cleanup failed", error);
        return alert("Les photos du projet n'ont pas pu être supprimées. Réessayez avant de supprimer le projet.");
    }

    state.projects = state.projects.filter(item => item.id !== id);
    state.transactions = state.transactions.filter(item => item.projectId !== id);
    state.projectData = state.projectData.filter(item => item.projectId !== id);
    state.projectTasks = state.projectTasks.filter(item => item.projectId !== id);
    state.projectEvents = (state.projectEvents || []).filter(item => item.projectId !== id);
    state.projectExpenses = (state.projectExpenses || []).filter(item => item.projectId !== id);
    state.projectMaterials = (state.projectMaterials || []).filter(item => item.projectId !== id);
    state.projectWorkers = (state.projectWorkers || []).filter(item => item.projectId !== id);
    state.monthlyAssignments = Object.fromEntries(
        Object.entries(state.monthlyAssignments || {}).filter(([key]) => !key.endsWith(`:${id}`))
    );

    delete uiState.activeProjectTab[id];
    if (uiState.editingProjectId === id) uiState.editingProjectId = null;
    if (activeProjectId === id) activeProjectId = null;
    Router.navigate("projectsPage");
    persist();
}

function openProject(id) {
    console.log("Opening project:", id);
    activeProjectId = id;
    if (isLargeScreen()) Router.navigate("projectsPage");
    else Router.navigate("projectDetailPage");
    renderProjectDetail();
}

function renderProjectDetail() {
    const p = state.projects.find(p => p.id === activeProjectId);
    const container = isLargeScreen() ? $("tabletDetailPane") : $("projectDetail");

    if (!p) {
        if (container) container.innerHTML = isLargeScreen() ? '<div class="empty-detail"><p>Sélectionnez un projet pour voir les détails</p></div>' : '';
        return;
    }

    console.log("Rendering project detail for:", p.name, "Active Tab:", uiState.activeProjectTab[p.id]);

    const baseTabs = p.type === 'detailed' ? [...(PROJECT_TYPES[p.subType]?.tabs || ["summary", "expenses", "tasks"])] : [];
    const customTabs = (p.customTabs || []).map(tab => tab.moduleId || tab.refId || tab.id).filter(Boolean);
    const tabs = [...new Set([...baseTabs, ...customTabs])];

    const requestedTab = uiState.activeProjectTab[p.id];
    const activeTab = tabs.includes(requestedTab) ? requestedTab : (tabs[0] || "summary");
    uiState.activeProjectTab[p.id] = activeTab;

    if (container) {
        try {
            if (typeof AttachmentService !== "undefined") AttachmentService.releaseGalleryUrls();
            container.innerHTML = `
                <div class="detail-pane-content">
                    ${UIModules.renderProjectHeader(p)}
                    ${p.type === 'detailed' ? `
                        <div class="detail-tabs">
                            ${tabs.map(t => {
                                const customTab = (p.customTabs || []).find(c => (c.moduleId || c.refId || c.id) === t);
                                const label = TAB_CONFIG[t]?.label || customTab?.name || t;
                                const isActive = t === activeTab;
                                return `<button type="button" class="project-tab ${isActive ? 'active' : ''}" data-tab-id="${t}" data-project-id="${p.id}">${label}</button>`;
                            }).join("")}
                        </div>
                        <div class="active-tab-content">
                            ${renderTabRouter(p, activeTab)}
                            ${activeTab !== "custom_tabs_manager" ? UIModules.renderAttachmentsModule(p, activeTab) : ""}
                        </div>
                    ` : `<div class="card"><h2>Historique des versements</h2>${projectTransfers(p.id)}</div>${UIModules.renderAttachmentsModule(p, "summary")}`}
                </div>`;
            if (activeTab !== "custom_tabs_manager" && typeof AttachmentService !== "undefined") {
                AttachmentService.renderGallery(p.id, p.type === "detailed" ? activeTab : "summary");
            }
        } catch (e) {
            console.error("Crash during project detail render:", e);
            container.innerHTML = `<div class="card danger">Une erreur est survenue lors de l'affichage du projet.</div>`;
        }
    }
}

function renderTabRouter(p, tabId) {
    console.log("Router calling module for tab:", tabId);
    try {
        const config = TAB_CONFIG[tabId];
        // Specialized and reusable modules
        if (config?.module === "summary") return UIModules.renderSummaryModule(p);
        if (config?.module === "expenses") return UIModules.renderExpensesModule(p);
        if (tabId === "materials") return UIModules.renderMaterialsModule(p);
        if (config?.module === "workers") return UIModules.renderWorkersModule(p, tabId);
        if (config?.module === "tasks") return UIModules.renderTasksModule(p);
        if (config?.module === "inventory") return UIModules.renderInventoryModule(p, tabId);
        if (config && config.module === "booking") return UIModules.renderBookingModule(p, tabId);
        if (tabId === "custom_tabs_manager") return UIModules.renderCustomTabsManager(p);

        // Generic Modules
        if (config && config.module === "generic") return UIModules.renderGenericModule(p, tabId);
        if (config && ["generic_financial", "generic_revenue", "sales"].includes(config.module)) {
            return UIModules.renderFinancialModule(p, tabId);
        }

        return `<div class="empty">Contenu bientôt disponible pour ${tabId}</div>`;
    } catch (e) {
        console.error(`Error rendering tab ${tabId}:`, e);
        return `<div class="card warning">Erreur d'affichage de l'onglet ${tabId}.</div>`;
    }
}

function updateProjectStatus(id, s) { const p = state.projects.find(x => x.id === id); if (p) { p.status = s; if (s === "Archivé" && activeProjectId === id) activeProjectId = null; persist(); } }
function archiveProject(id) { updateProjectStatus(id, "Archivé"); Router.navigate("projectsPage"); }
function reactivateProject(id) { updateProjectStatus(id, "En cours"); }

function addProjectExpense(projectId) {
    const amountInput = $("detailExpenseAmount");
    const labelInput = $("detailExpenseLabel");
    if (!amountInput || !labelInput) return;
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) return alert("Montant requis.");
    TransactionService.add({ projectId, type: TransactionService.TYPES.EXPENSE, description: labelInput.value.trim() || "Dépense projet", amount, currency: $("detailExpenseCurrency").value, category: $("detailExpenseCategory").value, sourceModule: 'expenses' });
    persist();
}

function addTask(projectId) {
    const nameInput = $("taskName");
    if (!nameInput) return;
    const name = nameInput.value.trim();
    if (!name) return alert("Désignation requise.");
    state.projectTasks.push({ id: uid(), projectId, name, done: false, createdAt: new Date().toISOString() });
    persist();
}
function toggleTask(id, pid) { const t = state.projectTasks.find(x => x.id === id); if (t) { t.done = !t.done; t.updatedAt = new Date().toISOString(); persist(); } }

function addLibraryTab(projectId) {
    const select = $("libTabSelect");
    if (!select) return;
    const tabId = select.value;
    const config = TAB_CONFIG[tabId];
    addCustomTab(projectId, config?.label || tabId, tabId);
}

function addCustomTab(projectId, name, refId = null) {
    const p = state.projects.find(x => x.id === projectId);
    if (!p) return;
    p.customTabs = p.customTabs || [];
    const moduleId = refId || uid();
    const baseTabs = PROJECT_TYPES[p.subType]?.tabs || [];
    const alreadyAdded = p.customTabs.some(t => (t.moduleId || t.refId || t.id) === moduleId);
    if (baseTabs.includes(moduleId) || alreadyAdded) return alert("Cet onglet existe déjà.");
    p.customTabs.push({ id: uid(), moduleId, name });
    persist();
}

function deleteCustomTab(projectId, tabId) {
    if(confirm("Retirer ce module ?")) {
        const p = state.projects.find(x => x.id === projectId);
        if (!p) return;
        p.customTabs = p.customTabs.filter(t => t.id !== tabId);
        const activeModule = uiState.activeProjectTab[projectId];
        const removed = p.customTabs.find(t => (t.moduleId || t.refId || t.id) === activeModule);
        if (!removed && !(PROJECT_TYPES[p.subType]?.tabs || []).includes(activeModule)) {
            uiState.activeProjectTab[projectId] = "summary";
        }
        persist();
    }
}

function projectTransfers(id){
  const rows=TransactionService.getByProject(id).filter(t=>t.type==='project_allocation');
  return rows.length?rows.map(t=>transactionRow(t)).join(""):`<div class="empty">Aucun versement</div>`;
}

function deleteGenericData(id) {
    if(confirm("Supprimer ?")) {
        const item = state.projectData.find(d => d.id === id);
        if (item) RelationService.cleanupRelations(item.tabId, id);
        state.projectData = state.projectData.filter(d=>d.id!==id);
        persist();
    }
}

function saveGenericData(projectId, tabId) {
    const config = TAB_CONFIG[tabId];
    if (!config || !config.fields) return;
    const vals = {};
    config.fields.forEach(f => {
        const el = $(`data_${tabId}_${f.id}`);
        if (el) { vals[f.id] = el.value; el.value = ""; }
    });
    ProjectService.saveData(projectId, tabId, vals);
    persist();
}
