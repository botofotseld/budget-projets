
/**
 * UI Modules - Reusable components for project tabs
 */
const UIModules = {
    /**
     * Render the Header KPI section for any project
     */
    renderProjectHeader(p) {
        const kpis = ProjectService.getKPIs(p);
        return `
            <div class="card project-header-card">
                <div class="project-card-header">
                    <div>
                        <div class="project-name" style="font-size: 22px;">${p.icon} ${esc(p.name)}</div>
                        <select class="status-select" onchange="updateProjectStatus('${p.id}', this.value)">
                            ${ProjectService.STATUSES.map(s => `<option value="${s}" ${p.status === s ? 'selected' : ''}>${s}</option>`).join("")}
                        </select>
                    </div>
                    <button class="danger" onclick="archiveProject('${p.id}')">Archiver</button>
                </div>

                <div class="kpi-grid" style="margin-top:20px">
                    <div class="kpi"><span>Objectif</span><strong>${Currency.format(p.target, p.currency)}</strong></div>
                    <div class="kpi"><span>Affecté</span><strong>${Currency.format(kpis.allocated, p.currency)}</strong></div>
                    <div class="kpi"><span>Dépensé</span><strong>${Currency.format(kpis.spent, p.currency)}</strong></div>
                    <div class="kpi"><span>Trésorerie</span><strong class="${kpis.treasury < 0 ? 'danger' : ''}">${Currency.format(kpis.treasury, p.currency)}</strong></div>
                </div>

                <div class="progress" style="height: 12px; margin-top: 18px;"><div style="width:${kpis.financialProg}%"></div></div>
                <div class="muted" style="display:flex; justify-content:space-between; font-size: 12px; font-weight: 700; margin-top: 8px;">
                    <span>Budget consommé : ${kpis.financialProg}%</span>
                    <span>Avancement terrain : ${kpis.operationalProg}%</span>
                </div>
            </div>
        `;
    },

    /**
     * Module: Expenses - Centralized view of all project transactions
     */
    renderExpensesModule(p) {
        const rows = TransactionService.getByProject(p.id);
        return `
            <div class="card form-card">
                <h2>Nouvelle dépense directe</h2>
                <div class="field"><label>Description</label><input id="detailExpenseLabel" placeholder="Ex : Achat bois" /></div>
                <div class="two-cols">
                    <div class="field"><label>Montant</label><input id="detailExpenseAmount" type="number" min="0" step="0.01" /></div>
                    <div class="field">
                        <label>Devise</label>
                        <select id="detailExpenseCurrency">
                            <option value="EUR">EUR (€)</option>
                            <option value="USD">USD ($)</option>
                            <option value="MGA">MGA (Ar)</option>
                            <option value="FMG">FMG</option>
                        </select>
                    </div>
                </div>
                <div id="detailExpenseFmgHint" class="muted" style="margin-bottom:12px; font-size:12px; display:none"></div>
                <div class="field"><label>Catégorie</label><select id="detailExpenseCategory"><option>Matériaux</option><option>Ouvrier</option><option>Transport</option><option>Administration</option><option>Autre</option></select></div>
                <button class="primary full" onclick="addProjectExpense('${p.id}')">Ajouter la dépense</button>
            </div>
            <div class="card">
                <h2>Historique financier</h2>
                ${rows.length ? rows.map(r => transactionRow(r)).join("") : '<div class="empty">Aucune transaction enregistrée</div>'}
            </div>
        `;
    },

    /**
     * Module: Materials - Connected to Transactions
     */
    renderMaterialsModule(p) {
        const data = ProjectService.getData(p.id, 'materials');
        return `
            <div class="card form-card">
                <h2>Planifier un matériau</h2>
                <div class="field"><label>Désignation</label><input id="mat_name" /></div>
                <div class="two-cols">
                    <div class="field"><label>Qté prévue</label><input id="mat_planned" type="number" /></div>
                    <div class="field"><label>Unité</label><input id="mat_unit" placeholder="Sacs, m3..." /></div>
                </div>
                <button class="primary full" onclick="saveMaterial('${p.id}')">Enregistrer dans le planning</button>
            </div>
            <div class="card">
                <h2>Suivi des matériaux</h2>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>Matériau</th><th>Prévu</th><th>Reçu</th><th>Statut</th><th></th></tr></thead>
                        <tbody>
                            ${data.map(d => `
                                <tr>
                                    <td><strong>${esc(d.values.name)}</strong></td>
                                    <td>${d.values.planned_qty} ${d.values.unit}</td>
                                    <td>${d.values.received_qty}</td>
                                    <td><span class="badge">${d.values.status}</span></td>
                                    <td><button class="link-btn" onclick="openAchatMaterial('${p.id}', '${d.id}')">Acheter</button></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Module: Workers - Connected to Transactions
     */
    renderWorkersModule(p) {
        const data = ProjectService.getData(p.id, 'workers');
        return `
            <div class="card form-card">
                <h2>Nouvel intervenant</h2>
                <div class="field"><label>Nom / Entreprise</label><input id="worker_name" /></div>
                <div class="field"><label>Rôle / Métier</label><input id="worker_role" /></div>
                <div class="field"><label>Montant convenu (${p.currency})</label><input id="worker_total" type="number" /></div>
                <button class="primary full" onclick="saveWorker('${p.id}')">Ajouter l'intervenant</button>
            </div>
            <div class="card">
                <h2>Gestion de l'équipe</h2>
                ${data.map(d => {
                    const reste = (parseFloat(d.values.agreed_amount) || 0) - (parseFloat(d.values.paid_amount) || 0);
                    return `
                        <div class="tx" style="flex-direction:column; align-items:flex-start; gap:8px">
                            <div style="width:100%; display:flex; justify-content:space-between">
                                <div><strong>${esc(d.values.name)}</strong><small>${esc(d.values.role)}</small></div>
                                <strong class="amount-project">${Currency.format(d.values.paid_amount, p.currency)} payés</strong>
                            </div>
                            <div class="muted" style="font-size:12px; width:100%; display:flex; justify-content:space-between">
                                <span>Convenu : ${Currency.format(d.values.agreed_amount, p.currency)}</span>
                                <span class="${reste > 0 ? 'danger' : ''}">Reste : ${Currency.format(reste, p.currency)}</span>
                            </div>
                            <button class="secondary full" style="padding:6px; font-size:12px" onclick="payWorker('${p.id}', '${d.id}')">Enregistrer un paiement</button>
                        </div>
                    `;
                }).join("") || '<div class="empty">Aucun intervenant enregistré</div>'}
            </div>
        `;
    },

    /**
     * Module: Generic Data - Form-driven data entry
     */
    renderGenericModule(p, tabId) {
        const config = TAB_CONFIG[tabId];
        const data = ProjectService.getData(p.id, tabId);
        return `
            <div class="card form-card">
                <h2>${config.label}</h2>
                ${config.fields.map(f => `
                    <div class="field">
                        <label>${f.label}</label>
                        <input id="data_${tabId}_${f.id}" type="${f.type || 'text'}" placeholder="${f.placeholder || ''}" />
                    </div>
                `).join("")}
                <button class="primary full" onclick="saveGenericData('${p.id}', '${tabId}')">Enregistrer</button>
            </div>
            <div class="card">
                <div class="table-wrap">
                    <table>
                        <thead><tr>${config.fields.map(f => `<th>${f.label}</th>`).join("")}<th></th></tr></thead>
                        <tbody>
                            ${data.map(d => `
                                <tr>
                                    ${config.fields.map(f => `<td>${esc(d.values[f.id])}</td>`).join("")}
                                    <td><button class="link-btn danger" onclick="deleteGenericData('${d.id}')">X</button></td>
                                </tr>
                            `).join("")}
                            ${!data.length ? `<tr><td colspan="${config.fields.length + 1}" class="empty">Aucune donnée</td></tr>` : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
};

// Global handlers for module buttons (delegated to services)
function saveMaterial(projectId) {
    const values = {
        name: $("mat_name").value.trim(),
        planned_qty: parseFloat($("mat_planned").value) || 0,
        received_qty: 0,
        unit: $("mat_unit").value || "unité",
        status: "À commander"
    };
    if (!values.name) return alert("Désignation requise");
    ProjectService.saveData(projectId, 'materials', values);
    persist();
}

function payWorker(projectId, workerId) {
    const amount = prompt("Montant du paiement ?");
    if (!amount || isNaN(amount)) return;

    const p = state.projects.find(x => x.id === projectId);
    const worker = state.projectData.find(d => d.id === workerId);

    // 1. Create Transaction
    const tx = TransactionService.add({
        projectId,
        type: TransactionService.TYPES.PAYMENT,
        description: `Paiement ${worker.values.name} (${worker.values.role})`,
        amount: parseFloat(amount),
        currency: p.currency,
        sourceModule: 'workers',
        sourceItemId: workerId,
        category: 'Main-d\'œuvre'
    });

    // 2. Update Worker data
    worker.values.paid_amount = (parseFloat(worker.values.paid_amount) || 0) + tx.amount;

    persist();
}
