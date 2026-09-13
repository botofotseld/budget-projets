
/**
 * Monthly Module - Recurrent allocations
 */
function renderMonthly() {
    const list = state.projects.filter(p => p.status !== "Archivé");
    if ($("monthlyList")) {
        $("monthlyList").innerHTML = list.length ? list.map(p => {
            const k = `${monthKey()}:${p.id}`, a = state.monthlyAssignments[k] || { amount: "", checked: false };
            return `<div class="card"><div class="check-card"><input type="checkbox" ${a.checked ? "checked" : ""} onchange="toggleAssignment('${p.id}',this.checked)" /><div><strong>${p.icon} ${esc(p.name)}</strong><div class="muted">Trésorerie : ${Currency.format(ProjectService.getKPIs(p).treasury, p.currency)}</div></div><div class="field"><input type="number" value="${a.amount || ""}" onchange="setAssignmentAmount('${p.id}',this.value)" ${a.checked ? 'disabled' : ''}/></div></div></div>`;
        }).join("") : `<div class="card empty">Aucun projet actif</div>`;
    }
}

function toggleAssignment(projectId, checked) {
    const p = state.projects.find(x => x.id === projectId); if (!p) return;
    const key = `${monthKey()}:${projectId}`;
    state.monthlyAssignments[key] ||= { amount: 0, checked: false, transactionId: null };
    const a = state.monthlyAssignments[key];
    if (checked) {
        const amount = parseFloat(a.amount);
        if (!amount || amount <= 0) return alert("Montant ?");
        if (a.transactionId) return;
        const tx = TransactionService.add({ projectId, type: TransactionService.TYPES.ALLOCATION, description: `Versement → ${p.name}`, amount, currency: p.currency, month: monthKey() });
        a.checked = true; a.transactionId = tx.id;
    } else {
        if (a.transactionId) TransactionService.delete(a.transactionId);
        a.checked = false; a.transactionId = null;
    }
    persist();
}

function setAssignmentAmount(projectId, value) {
    const key = `${monthKey()}:${projectId}`;
    state.monthlyAssignments[key] ||= { amount: 0, checked: false, transactionId: null };
    if (state.monthlyAssignments[key].checked) return;
    state.monthlyAssignments[key].amount = parseFloat(value) || 0;
    saveState(state);
}
