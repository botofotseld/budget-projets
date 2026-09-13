
/**
 * Dashboard Module - Home screen rendering
 */
function renderHome() {
    const assets = FinanceService.getAvailableBalance(state.mainCurrency) + state.projects.reduce((s, p) => s + FinanceService.getProjectSummary(p.id, state.mainCurrency).treasury, 0);
    if ($("totalAssets")) $("totalAssets").textContent = Currency.format(assets, state.mainCurrency);
    if ($("availableBalance")) $("availableBalance").textContent = Currency.format(FinanceService.getAvailableBalance(state.mainCurrency), state.mainCurrency);
    if ($("projectsBalance")) $("projectsBalance").textContent = Currency.format(state.projects.reduce((s, p) => s + FinanceService.getProjectSummary(p.id, state.mainCurrency).treasury, 0), state.mainCurrency);
    if ($("monthIncome")) $("monthIncome").textContent = Currency.format(monthIncome(), state.mainCurrency);
    if ($("monthExpenses")) $("monthExpenses").textContent = Currency.format(monthExpenses(), state.mainCurrency);

    const active = state.projects.filter(p => p.status !== "Archivé").slice(0, 3);
    if ($("homeProjects")) $("homeProjects").innerHTML = active.length ? active.map(p => projectCard(p)).join("") : `<div class="card empty">Aucun projet actif</div>`;

    const tx = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
    if ($("homeTransactions")) $("homeTransactions").innerHTML = tx.length ? tx.map(t => transactionRow(t)).join("") : `<div class="empty">Aucune transaction</div>`;
}

function projectCard(p) {
    const kpis = ProjectService.getKPIs(p);
    const activeClass = activeProjectId === p.id ? "active-border" : "";
    let secondary = p.currency !== state.mainCurrency ? `<div class="muted" style="font-size:11px">≈ ${Currency.format(Currency.convert(kpis.allocated, p.currency, state.mainCurrency, state.rates), state.mainCurrency)}</div>` : "";
    return `
    <article class="project-card ${activeClass}" onclick="openProject('${p.id}')">
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
