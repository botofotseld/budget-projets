
/**
 * UI Modules - Harmonized & Standardized (V6)
 */
const UIModules = {
    /**
     * Standard Project Header
     */
    renderProjectHeader(p) {
        const kpis = ProjectService.getKPIs(p);

        return `
            <div class="card project-header-card">
                <div class="project-card-header">
                    <div>
                        <div class="project-name" style="font-size: 24px;">${p.icon} ${esc(p.name)}</div>
                        <select class="status-select">
                            ${ProjectService.STATUSES.map(s => `<option value="${s}" ${p.status === s ? 'selected' : ''}>${s}</option>`).join("")}
                        </select>
                    </div>
                    <button class="danger" data-action="archive-project" data-project-id="${p.id}">Archiver</button>
                </div>

                <div class="kpi-grid-5" style="margin-top:24px">
                    <div class="kpi"><span>Objectif</span><strong>${Currency.format(kpis.budget, p.currency)}</strong></div>
                    <div class="kpi"><span>Affecté</span><strong>${Currency.format(kpis.allocated, p.currency)}</strong></div>
                    <div class="kpi"><span>Engagé</span><strong>${Currency.format(kpis.engaged, p.currency)}</strong></div>
                    <div class="kpi"><span>Dépensé</span><strong>${Currency.format(kpis.paid, p.currency)}</strong></div>
                    <div class="kpi"><span>Disponible</span><strong class="${kpis.treasury < 0 ? 'danger' : 'success'}">${Currency.format(kpis.treasury, p.currency)}</strong></div>
                </div>

                <div class="progress-section" style="margin-top:20px">
                    <div class="prog-item">
                        <div class="prog-label"><span>Progression Financière</span><strong>${kpis.financialProg}%</strong></div>
                        <div class="progress"><div style="width:${kpis.financialProg}%"></div></div>
                    </div>
                    <div class="prog-item">
                        <div class="prog-label"><span>Progression Opérationnelle</span><strong>${kpis.operationalProg}%</strong></div>
                        <div class="progress op-progress"><div style="width:${kpis.operationalProg}%"></div></div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Standard Summary Module (Dashboard of the project)
     */
    renderSummaryModule(p) {
        const kpis = ProjectService.getKPIs(p);
        const recentOps = TransactionService.getByProject(p.id).slice(0, 5);
        const deadlines = state.projectData.filter(d => d.projectId === p.id && d.values.expiry).sort((a, b) => new Date(a.values.expiry) - new Date(b.values.expiry)).slice(0, 3);
        const overdueTasks = state.projectTasks.filter(t => t.projectId === p.id && !t.done).slice(0, 3);

        let alertsHtml = "";
        if (kpis.treasury < 0) alertsHtml += `<div class="alert danger">⚠️ Trésorerie négative : le projet a dépensé plus qu'il n'a reçu.</div>`;
        if (kpis.engaged > kpis.budget) alertsHtml += `<div class="alert warning">🔔 Budget dépassé : les engagements dépassent l'objectif financier.</div>`;

        return `
            <div class="summary-grid">
                ${alertsHtml ? `<div class="card">${alertsHtml}</div>` : ''}

                <div class="summary-columns">
                    <div class="sum-col">
                        <div class="card">
                            <h3>Dernières opérations</h3>
                            ${recentOps.length ? recentOps.map(t => transactionRow(t)).join("") : '<div class="empty">Aucune opération</div>'}
                        </div>
                        <div class="card">
                            <h3>Échéances à venir</h3>
                            ${deadlines.length ? deadlines.map(d => `
                                <div class="tx">
                                    <div><strong>${esc(d.values.name || d.values.label)}</strong><small>Expire le ${new Date(d.values.expiry).toLocaleDateString()}</small></div>
                                    <span class="badge">${TAB_CONFIG[d.tabId]?.label || "Info"}</span>
                                </div>
                            `).join("") : '<div class="empty">Aucune échéance proche</div>'}
                        </div>
                    </div>

                    <div class="sum-col">
                        <div class="card">
                            <h3>Tâches en attente</h3>
                            ${overdueTasks.length ? overdueTasks.map(t => `
                                <div class="task-row">
                                    <label><input type="checkbox" onchange="toggleTask('${t.id}','${p.id}')" /><span>${esc(t.name)}</span></label>
                                </div>
                            `).join("") : '<div class="empty">Toutes les tâches sont à jour</div>'}
                        </div>
                        <div class="card">
                            <h3>Reste à payer estimé</h3>
                            <div class="hero-val">${Currency.format(kpis.remainingToPay, p.currency)}</div>
                            <p class="muted" style="font-size:12px">Basé sur les engagements enregistrés (ouvriers, matériaux prévus).</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Module: Expenses
     */
    renderExpensesModule(p) {
        const rows = TransactionService.getByProject(p.id);
        return `
            <div class="card form-card">
                <h2>Enregistrer une opération</h2>
                <div class="field"><label>Description</label><input id="detailExpenseLabel" placeholder="Ex : Petit matériel..." /></div>
                <div class="two-cols">
                    <div class="field"><label>Montant</label><input id="detailExpenseAmount" type="number" /></div>
                    <div class="field">
                        <label>Devise</label>
                        <select id="detailExpenseCurrency">
                            ${['EUR', 'USD', 'MGA', 'FMG'].map(c => `<option value="${c}" ${c === p.currency ? 'selected' : ''}>${c}</option>`).join("")}
                        </select>
                    </div>
                </div>
                <div id="detailExpenseFmgHint" class="muted" style="margin-bottom:12px; font-size:12px; display:none"></div>
                <div class="field"><label>Catégorie</label><select id="detailExpenseCategory"><option>Matériaux</option><option>Main-d'œuvre</option><option>Transport</option><option>Hébergement</option><option>Frais</option><option>Autre</option></select></div>
                <button class="primary full" data-action="save-project-expense" data-project-id="${p.id}">Enregistrer la dépense</button>
            </div>
            <div class="card">
                <h2>Historique financier</h2>
                ${rows.length ? rows.map(r => transactionRow(r)).join("") : '<div class="empty">Aucune transaction enregistrée</div>'}
            </div>
        `;
    },

    /**
     * Module: Workers
     */
    renderWorkersModule(p) {
        const data = ProjectService.getData(p.id, 'workers');
        return `
            <div class="card form-card">
                <h2>Ajouter un intervenant</h2>
                <div class="field"><label>Nom complet</label><input id="worker_name" /></div>
                <div class="field"><label>Mission / Rôle</label><input id="worker_role" /></div>
                <div class="field"><label>Montant total convenu (${p.currency})</label><input id="worker_total" type="number" /></div>
                <button class="primary full" data-action="save-worker" data-project-id="${p.id}">Enregistrer l'intervenant</button>
            </div>
            ${data.map(d => {
                const stats = FinanceService.getItemStats('workers', d.id, p.currency);
                return `
                    <div class="card">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start">
                            <div><h3 style="margin-bottom:2px">${esc(d.values.name)}</h3><div class="badge">${esc(d.values.role)}</div></div>
                            <button class="link-btn danger" data-action="delete-generic" data-item-id="${d.id}">Supprimer</button>
                        </div>
                        <div class="kpi-grid" style="margin-top:16px; background:var(--surface-2); padding:10px; border-radius:12px">
                            <div class="kpi"><span>Convenu</span><strong>${Currency.format(stats.agreed, p.currency)}</strong></div>
                            <div class="kpi"><span>Payé</span><strong>${Currency.format(stats.paid, p.currency)}</strong></div>
                            <div class="kpi"><span>Reste</span><strong class="${stats.remaining > 0 ? 'warning' : 'success'}">${Currency.format(stats.remaining, p.currency)}</strong></div>
                        </div>
                        <div style="margin-top:16px">
                            <button class="secondary full" data-action="pay-worker" data-project-id="${p.id}" data-worker-id="${d.id}">💰 Enregistrer un paiement</button>
                        </div>
                    </div>
                `;
            }).join("") || '<div class="empty">Aucun intervenant</div>'}
        `;
    },

    /**
     * Module: Materials
     */
    renderMaterialsModule(p) {
        const data = ProjectService.getData(p.id, 'materials');
        return `
            <div class="card form-card">
                <h2>Planifier un besoin</h2>
                <div class="field"><label>Désignation</label><input id="mat_name" /></div>
                <div class="two-cols">
                    <div class="field"><label>Qté prévue</label><input id="mat_planned" type="number" /></div>
                    <div class="field"><label>Prix unit. prévu</label><input id="mat_price" type="number" /></div>
                </div>
                <div class="field"><label>Unité</label><input id="mat_unit" placeholder="m3, sacs..." /></div>
                <button class="primary full" data-action="save-material" data-project-id="${p.id}">Enregistrer</button>
            </div>
            <div class="card">
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>Article</th><th>Prévu</th><th>Reçu</th><th>Historique</th><th></th></tr></thead>
                        <tbody>
                            ${data.map(d => {
                                const stats = FinanceService.getItemStats('materials', d.id, p.currency);
                                return `
                                    <tr>
                                        <td><strong>${esc(d.values.name)}</strong></td>
                                        <td>${d.values.planned_qty} ${d.values.unit}</td>
                                        <td>${d.values.received_qty}</td>
                                        <td>${Currency.format(stats.paid, p.currency)}</td>
                                        <td>
                                            <button class="link-btn" data-action="buy-material" data-project-id="${p.id}" data-material-id="${d.id}">Acheter</button>
                                            <button class="link-btn danger" data-action="delete-generic" data-item-id="${d.id}">X</button>
                                        </td>
                                    </tr>
                                `;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Module: Inventory / Stock
     */
    renderInventoryModule(p) {
        const data = ProjectService.getData(p.id, 'inventory');
        return `
            <div class="card form-card">
                <h2>Nouveau produit</h2>
                <div class="field"><label>Article</label><input id="inv_item" /></div>
                <div class="field"><label>Quantité initiale</label><input id="inv_qty" type="number" /></div>
                <button class="primary full" data-action="save-inventory-item" data-project-id="${p.id}">Créer la fiche</button>
            </div>
            <div class="card">
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>Article</th><th>En stock</th><th></th></tr></thead>
                        <tbody>${data.map(d => `<tr><td><strong>${esc(d.values.item)}</strong></td><td>${d.values.qty}</td>
                            <td style="display:flex; gap:8px">
                                <button class="link-btn success" data-action="sell-product" data-project-id="${p.id}" data-item-id="${d.id}">Vendre</button>
                                <button class="link-btn" data-action="buy-stock" data-project-id="${p.id}" data-item-id="${d.id}">Réappro</button>
                                <button class="link-btn danger" data-action="delete-generic" data-item-id="${d.id}">X</button>
                            </td></tr>`).join("")}</tbody>
                    </table>
                </div>
            </div>`;
    },

    /**
     * Module: Booking (Travel)
     */
    renderBookingModule(p, tabId) {
        const config = TAB_CONFIG[tabId];
        return `
            <div class="card form-card">
                <h2>Nouvelle réservation (${config.type})</h2>
                <div class="field"><label>Désignation</label><input id="book_name" /></div>
                <div class="field"><label>Prix payé</label><input id="book_price" type="number" /></div>
                <button class="primary full" data-action="save-booking" data-project-id="${p.id}" data-tab-id="${tabId}">Enregistrer</button>
            </div>
            <div class="card">${this.renderGenericModule(p, tabId)}</div>`;
    },

    /**
     * Module: Tasks
     */
    renderTasksModule(p) {
        const rows = state.projectTasks.filter(t => t.projectId === p.id);
        return `
            <div class="card form-card">
                <h2>Nouvelle tâche</h2>
                <div class="field"><label>Désignation</label><input id="taskName" placeholder="Ex : Toiture..." /></div>
                <button class="primary full" data-action="save-task" data-project-id="${p.id}">Ajouter la tâche</button>
            </div>
            <div class="card">
                ${rows.length ? rows.map(t => `
                    <div class="task-row">
                        <label><input type="checkbox" ${t.done ? "checked" : ""} data-action="toggle-task" data-task-id="${t.id}" data-project-id="${p.id}" /><span>${esc(t.name)}</span></label>
                        <span class="badge ${t.done ? 'success' : ''}">${t.done ? "Terminé" : "En cours"}</span>
                    </div>
                `).join("") : '<div class="empty">Aucune tâche planifiée</div>'}
            </div>
        `;
    },

    /**
     * Module: Generic Data
     */
    renderGenericModule(p, tabId) {
        const config = TAB_CONFIG[tabId];
        const data = ProjectService.getData(p.id, tabId);
        return `
            <div class="card form-card">
                <h2>${config.label}</h2>
                ${config.fields.map(f => `<div class="field"><label>${f.label}</label><input id="data_${tabId}_${f.id}" type="${f.type || 'text'}" /></div>`).join("")}
                <button class="primary full" data-action="save-generic-data" data-project-id="${p.id}" data-tab-id="${tabId}">Enregistrer</button>
            </div>
            <div class="card">
                <div class="table-wrap">
                    <table>
                        <thead><tr>${config.fields.map(f => `<th>${f.label}</th>`).join("")}<th></th></tr></thead>
                        <tbody>
                            ${data.map(d => `<tr>${config.fields.map(f => `<td>${esc(d.values[f.id])}</td>`).join("")}<td><button class="link-btn danger" data-action="delete-generic" data-item-id="${d.id}">X</button></td></tr>`).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderCustomTabsManager(p) {
        return `
            <div class="card form-card">
                <h2>Bibliothèque de modules</h2>
                <div class="field">
                    <label>Modèle à ajouter</label>
                    <select id="libTabSelect">${TAB_LIBRARY.map(t => `<option value="${t}">${TAB_CONFIG[t]?.label || t}</option>`).join("")}</select>
                </div>
                <button class="secondary full" data-action="add-library-tab" data-project-id="${p.id}">Ajouter ce module</button>
            </div>
            <div class="card">
                <h2>Modules personnalisés actifs</h2>
                ${p.customTabs?.map(t => `<div class="task-row"><span>${esc(t.name)}</span><button class="link-btn danger" data-action="delete-custom-tab" data-project-id="${p.id}" data-tab-id="${t.id}">Retirer</button></div>`).join("") || '<div class="empty">Aucun module ajouté</div>'}
            </div>
        `;
    }
};

// Global Handlers (Now used by delegation in events.js)

function saveMaterial(projectId) {
    const values = {
        name: $("mat_name").value.trim(),
        planned_qty: parseFloat($("mat_planned").value) || 0,
        unit_price: parseFloat($("mat_price").value) || 0,
        received_qty: 0,
        unit: $("mat_unit").value || "unité",
        status: "À préparer"
    };
    if (!values.name) return alert("Nom requis.");
    ProjectService.saveData(projectId, 'materials', values);
    persist();
}

function saveWorker(projectId) {
    const values = {
        name: $("worker_name").value.trim(),
        role: $("worker_role") ? $("worker_role").value : "Expert",
        agreed_amount: parseFloat($("worker_total").value) || 0,
        paid_amount: 0
    };
    if (!values.name) return alert("Nom requis.");
    ProjectService.saveData(projectId, 'workers', values);
    persist();
}

function payWorker(projectId, workerId) {
    const worker = state.projectData.find(d => d.id === workerId);
    if (!worker) return;
    const amount = prompt(`Montant du paiement pour ${worker.values.name} ?`);
    if (!amount || isNaN(amount)) return;
    const p = state.projects.find(x => x.id === projectId);
    TransactionService.add({
        projectId, type: TransactionService.TYPES.PAYMENT,
        description: `Paiement : ${worker.values.name}`,
        amount: parseFloat(amount), currency: p.currency,
        sourceModule: 'workers', sourceItemId: workerId, category: "Main-d'œuvre"
    });
    persist();
}

function openAchatMaterial(pid, mid) {
    const p = state.projects.find(x=>x.id===pid);
    const mat = state.projectData.find(x=>x.id===mid);
    const qty = prompt("Quantité reçue ?"), price = prompt("Montant payé ?");
    if (!qty || !price) return;
    TransactionService.add({ projectId: pid, type: 'purchase', description: `Achat ${mat.values.name}`, amount: parseFloat(price), currency: p.currency, sourceModule: 'materials', sourceItemId: mid, category: 'Matériaux' });
    mat.values.received_qty = (parseFloat(mat.values.received_qty) || 0) + parseFloat(qty);
    persist();
}

function sellProduct(pid, mid) {
    const p = state.projects.find(x=>x.id===pid);
    const item = state.projectData.find(x=>x.id===mid);
    const qty = prompt("Quantité vendue ?"), price = prompt("Montant total reçu ?");
    if (!qty || !price) return;
    TransactionService.add({ projectId: pid, type: 'revenue', description: `Vente ${item.values.item}`, amount: parseFloat(price), currency: p.currency, sourceModule: 'inventory', sourceItemId: mid, category: 'Commerce' });
    item.values.qty = (parseFloat(item.values.qty) || 0) - parseFloat(qty);
    persist();
}

function buyStock(pid, mid) {
    const p = state.projects.find(x=>x.id===pid);
    const item = state.projectData.find(x=>x.id===mid);
    const qty = prompt("Quantité achetée ?"), price = prompt("Montant payé ?");
    if (!qty || !price) return;
    TransactionService.add({ projectId: pid, type: 'purchase', description: `Réappro ${item.values.item}`, amount: parseFloat(price), currency: p.currency, sourceModule: 'inventory', sourceItemId: mid, category: 'Commerce' });
    item.values.qty = (parseFloat(item.values.qty) || 0) + parseFloat(qty);
    persist();
}

function saveInventoryItem(pid) {
    ProjectService.saveData(pid, 'inventory', { item: $("inv_item").value, qty: parseFloat($("inv_qty").value) || 0 });
    persist();
}

function saveBooking(pid, tabId) {
    const p = state.projects.find(x=>x.id===pid);
    const name = $("book_name").value, price = parseFloat($("book_price").value) || 0;
    const tx = TransactionService.add({ projectId: pid, type: 'expense', description: `Réservation ${name}`, amount: price, currency: p.currency, sourceModule: tabId, category: TAB_CONFIG[tabId].type });
    ProjectService.saveData(pid, tabId, { name, cost: price, transactionId: tx.id });
    persist();
}
