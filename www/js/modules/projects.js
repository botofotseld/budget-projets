
/**
 * Projects Module - Lifecycle and Detail rendering
 */
function renderProjects() {
    const active = state.projects.filter(p => p.status !== "Archivé");
    const archived = state.projects.filter(p => p.status === "Archivé");
    if ($("projectsList")) {
        $("projectsList").innerHTML = `<div class="section-head"><h2>Projets actifs</h2></div>${active.length ? active.map(p => projectCard(p)).join("") : `<div class="card empty">Aucun projet actif</div>`}${archived.length ? `<div class="section-head"><h2>Archivés</h2></div>${archived.map(p => `<div class="card"><div class="project-card-header"><strong>${p.icon} ${esc(p.name)}</strong><button class="secondary" onclick="reactivateProject('${p.id}')">Réactiver</button></div></div>`).join("")}` : ""}`;
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

function openProject(id) {
    activeProjectId = id;
    if (isLargeScreen()) navigate("projectsPage");
    else navigate("projectDetailPage");
    renderProjectDetail();
}

function renderProjectDetail() {
    const p = state.projects.find(p => p.id === activeProjectId);
    const container = isLargeScreen() ? $("tabletDetailPane") : $("projectDetail");
    if (!p) { if (container) container.innerHTML = isLargeScreen() ? '<div class="empty-detail"><p>Sélectionnez un projet</p></div>' : ''; return; }
    const tabs = p.type === 'detailed' ? (PROJECT_TYPES[p.subType]?.tabs || ["summary", "expenses", "tasks"]) : [];
    if (p.customTabs) p.customTabs.forEach(ct => tabs.push(`custom_${ct.id}`));
    if (container) container.innerHTML = `<div class="detail-pane-content">${UIModules.renderProjectHeader(p)}${p.type === 'detailed' ? `<div class="detail-tabs">${tabs.map((t, i) => `<button class="${i === 0 ? 'active' : ''}" onclick="switchDetailTab(this,'tab_${t}')">${TAB_CONFIG[t]?.label || (p.customTabs.find(c => `custom_${c.id}` === t)?.name) || t}</button>`).join("")}</div>${tabs.map((t, i) => `<div id="tab_${t}" class="op-pane ${i === 0 ? 'active' : ''}">${renderTabRouter(p, t)}</div>`).join("")}` : `<div class="card"><h2>Historique des versements</h2>${projectTransfers(p.id)}</div>`}</div>`;
}

function renderTabRouter(p, tabId) {
    const config = TAB_CONFIG[tabId];
    if (tabId === "summary") return UIModules.renderSummaryModule(p);
    if (tabId === "expenses") return UIModules.renderExpensesModule(p);
    if (tabId === "materials") return UIModules.renderMaterialsModule(p);
    if (tabId === "workers" || tabId === "vendors" || tabId === "participants" || tabId === "team") return UIModules.renderWorkersModule(p);
    if (tabId === "tasks" || tabId === "planning" || tabId === "progression" || tabId === "deadlines") return UIModules.renderTasksModule(p);
    if (tabId === "stock") return UIModules.renderInventoryModule(p);
    if (tabId === "sales") return UIModules.renderSalesModule(p);
    if (config && config.module === "booking") return UIModules.renderBookingModule(p, tabId);
    if (tabId === "custom_tabs_manager") return UIModules.renderCustomTabsManager(p);
    if (tabId.startsWith("custom_")) return UIModules.renderCustomTabModule(p, tabId.replace("custom_", ""));
    if (config && config.module === "generic") return UIModules.renderGenericModule(p, tabId);
    return `<div class="empty">Contenu bientôt disponible</div>`;
}

function updateProjectStatus(id, s) { const p = state.projects.find(x => x.id === id); if (p) { p.status = s; persist(); } }
function archiveProject(id) { updateProjectStatus(id, "Archivé"); if (!isLargeScreen()) navigate("projectsPage"); }
function reactivateProject(id) { updateProjectStatus(id, "En cours"); }

function addProjectExpense(projectId) {
    const amount = parseFloat($("detailExpenseAmount").value);
    if (!amount || amount <= 0) return alert("Montant requis.");
    TransactionService.add({ projectId, type: TransactionService.TYPES.EXPENSE, description: $("detailExpenseLabel").value.trim() || "Dépense projet", amount, currency: $("detailExpenseCurrency").value, category: $("detailExpenseCategory").value, sourceModule: 'expenses' });
    persist();
}

function addTask(projectId) {
    const name = $("taskName").value.trim();
    if (!name) return alert("Désignation requise.");
    state.projectTasks.push({ id: uid(), projectId, name, done: false, createdAt: new Date().toISOString() });
    persist();
}
function toggleTask(id, pid) { const t = state.projectTasks.find(x => x.id === id); if (t) { t.done = !t.done; t.updatedAt = new Date().toISOString(); persist(); } }
