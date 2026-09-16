
/**
 * Dashboard Module - Home screen rendering
 */
function renderHome() {
    const assets = FinanceService.getAvailableBalance(state.mainCurrency) + state.projects.reduce((s, p) => s + FinanceService.getProjectSummary(p.id, state.mainCurrency).treasury, 0);
    if ($("totalAssets")) $("totalAssets").textContent = Currency.format(assets, state.mainCurrency);
    if ($("availableBalance")) $("availableBalance").textContent = Currency.format(FinanceService.getAvailableBalance(state.mainCurrency), state.mainCurrency);
    if ($("projectsBalance")) $("projectsBalance").textContent = Currency.format(state.projects.reduce((s, p) => s + FinanceService.getProjectSummary(p.id, state.mainCurrency).treasury, 0), state.mainCurrency);
    const monthlyTotals = getCurrentMonthTotals();
    if ($("monthIncome")) $("monthIncome").textContent = Currency.format(monthlyTotals.income, state.mainCurrency);
    if ($("monthExpenses")) $("monthExpenses").textContent = Currency.format(monthlyTotals.expenses, state.mainCurrency);

    const active = state.projects.filter(p => p.status !== "Archivé").slice(0, 3);
    if ($("homeProjects")) $("homeProjects").innerHTML = active.length ? active.map(p => projectCard(p)).join("") : `<div class="card empty">Aucun projet actif</div>`;

    const tx = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
    if ($("homeTransactions")) $("homeTransactions").innerHTML = tx.length ? tx.map(t => transactionRow(t)).join("") : `<div class="empty">Aucune transaction</div>`;
}

function getCurrentMonthTotals() {
    const currentMonth = monthKey();
    const incomeTypes = [TransactionService.TYPES.INCOME, TransactionService.TYPES.REVENUE];
    const expenseTypes = [
        TransactionService.TYPES.EXPENSE,
        TransactionService.TYPES.PAYMENT,
        TransactionService.TYPES.PURCHASE,
        TransactionService.TYPES.WITHDRAWAL
    ];

    return state.transactions.reduce((totals, transaction) => {
        const transactionMonth = transaction.month || String(transaction.date || "").slice(0, 7);
        if (transactionMonth !== currentMonth) return totals;

        const amount = Currency.convert(transaction.amount, transaction.currency, state.mainCurrency, state.rates);
        if (incomeTypes.includes(transaction.type)) totals.income += amount;
        if (expenseTypes.includes(transaction.type)) totals.expenses += amount;
        return totals;
    }, { income: 0, expenses: 0 });
}

function projectCard(p) {
    const kpis = ProjectService.getKPIs(p);
    const activeClass = activeProjectId === p.id ? "active-border" : "";
    let secondary = p.currency !== state.mainCurrency ? `<div class="muted" style="font-size:11px">≈ ${Currency.format(Currency.convert(kpis.allocated, p.currency, state.mainCurrency, state.rates), state.mainCurrency)}</div>` : "";
    return `
    <article class="project-card ${activeClass}" role="button" tabindex="0" data-action="open-project" data-project-id="${p.id}" aria-label="Ouvrir le projet ${esc(p.name)}">
      <div class="project-card-header">
        <div><div class="project-name">${p.icon} ${esc(p.name)}</div><div class="muted">${p.status}</div></div>
        <span class="badge">${kpis.financialProg}%</span>
      </div>
      <div class="progress"><div style="width:${kpis.financialProg}%"></div></div>
      <div class="project-meta">
        <div><span>${Currency.format(kpis.allocated, p.currency)} / ${Currency.format(p.target, p.currency)}</span>${secondary}</div>
        <span>Trésorerie : ${Currency.format(kpis.treasury, p.currency)}</span>
      </div>
    </article>`;
}
