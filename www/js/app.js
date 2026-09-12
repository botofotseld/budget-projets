
let state = loadState();
let activeProjectId = null;

const $ = (id) => document.getElementById(id);
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2);
const esc = (s) => String(s ?? "")
  .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
  .replaceAll('"',"&quot;").replaceAll("'","&#039;");
const monthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
};
const monthLabel = () => new Intl.DateTimeFormat("fr-FR",{month:"long",year:"numeric"}).format(new Date());

function applyTheme(){
  const theme = state.theme || 'system';
  if(theme === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
  if($("themeSelect")) $("themeSelect").value = theme;
}

function applySettings(){
  if($("mainCurrencySelect")) $("mainCurrencySelect").value = state.mainCurrency;
  if($("showArFmgToggle")) $("showArFmgToggle").checked = state.showArFmg;
  if($("rateEur")) $("rateEur").value = state.rates.EUR;
  if($("rateUsd")) $("rateUsd").value = state.rates.USD;
}

applyTheme();

function isLargeScreen() {
  return window.innerWidth >= 840;
}

function projectSaved(id, targetCurrency){
  return state.transactions
    .filter(t=>t.type==="project"&&t.projectId===id)
    .reduce((s,t)=>s + Currency.convert(t.amount, t.currency, targetCurrency, state.rates), 0);
}
function projectSpent(id, targetCurrency){
  return state.projectExpenses
    .filter(e=>e.projectId===id)
    .reduce((s,e)=>s + Currency.convert(e.amount, e.currency, targetCurrency, state.rates), 0);
}
function projectCash(id, targetCurrency){
  return projectSaved(id, targetCurrency) - projectSpent(id, targetCurrency);
}
function availableBalance(targetCurrency = state.mainCurrency){
  return state.transactions.reduce((b,t)=>{
    const val = Currency.convert(t.amount, t.currency, targetCurrency, state.rates);
    if(t.type==="income") b+=val;
    if(t.type==="expense") b-=val;
    if(t.type==="project") b-=val;
    return b;
  },0);
}
function projectsBalance(targetCurrency = state.mainCurrency){
  return state.projects.reduce((s,p)=>s + projectCash(p.id, targetCurrency), 0);
}
function totalAssets(){ return availableBalance() + projectsBalance(); }

function monthIncome(){
  return state.transactions
    .filter(t=>t.month===monthKey()&&t.type==="income")
    .reduce((s,t)=>s + Currency.convert(t.amount, t.currency, state.mainCurrency, state.rates), 0);
}
function monthExpenses(){
  const personal = state.transactions
    .filter(t=>t.month===monthKey()&&t.type==="expense")
    .reduce((s,t)=>s + Currency.convert(t.amount, t.currency, state.mainCurrency, state.rates), 0);
  const project = state.projectExpenses
    .filter(e=>e.month===monthKey())
    .reduce((s,e)=>s + Currency.convert(e.amount, e.currency, state.mainCurrency, state.rates), 0);
  return personal+project;
}
function persist(){ saveState(state); renderAll(); }

function addTransaction(){
  const type=$("txType").value;
  const description=$("txDescription").value.trim();
  const amount=parseFloat($("txAmount").value);
  const currency=$("txCurrency").value;
  if(!description || !amount || amount<=0) return alert("Renseigne une description et un montant valide.");
  state.transactions.push({
    id:uid(),type,description,amount,currency,
    date:new Date().toISOString(),month:monthKey()
  });
  $("txDescription").value=""; $("txAmount").value="";
  persist();
}
function deleteTransaction(id){
  const tx=state.transactions.find(t=>t.id===id);
  if(!tx) return;
  if(tx.type==="project") return alert("Annule ce versement depuis l'onglet Ce mois.");
  if(confirm("Supprimer cette transaction ?")){
    state.transactions=state.transactions.filter(t=>t.id!==id);
    persist();
  }
}

function createProject(){
  const name=$("projectName").value.trim();
  const icon=$("projectIcon").value.trim()||"🎯";
  const target=parseFloat($("projectTarget").value);
  const currency=$("projectCurrency").value;
  const rawType=$("projectType").value;

  if(!name || !target || target<=0) return alert("Renseigne un nom et un objectif financier valide.");

  let type = "simple";
  let subType = null;

  if (rawType !== "simple") {
    type = "detailed";
    subType = rawType;
  }

  state.projects.push({
    id:uid(), name, icon, target, currency, type, subType,
    status:"active", created:new Date().toISOString(),
    customTabs: []
  });
  $("projectName").value=""; $("projectIcon").value=""; $("projectTarget").value="";
  persist();
}
function archiveProject(id){
  const p=state.projects.find(p=>p.id===id); if(!p) return;
  p.status="archived"; persist();
  if (!isLargeScreen()) navigate("projectsPage");
  else renderProjectDetail();
}
function reactivateProject(id){
  const p=state.projects.find(p=>p.id===id); if(!p) return;
  p.status="active"; persist();
}
function assignmentKey(projectId){ return `${monthKey()}:${projectId}`; }
function setAssignmentAmount(projectId, value){
  const key=assignmentKey(projectId);
  state.monthlyAssignments[key] ||= {amount:0,checked:false,transactionId:null};
  if(state.monthlyAssignments[key].checked) return;
  state.monthlyAssignments[key].amount=parseFloat(value)||0;
  saveState(state);
}
function toggleAssignment(projectId, checked){
  const p=state.projects.find(x=>x.id===projectId); if(!p)return;
  const key=assignmentKey(projectId);
  state.monthlyAssignments[key] ||= {amount:0,checked:false,transactionId:null};
  const a=state.monthlyAssignments[key];
  if(checked){
    const amount=parseFloat(a.amount);
    if(!amount||amount<=0) return alert("Entre d'abord un montant.");
    if(amount > availableBalance(p.currency)) return alert("Solde disponible insuffisant.");
    if(a.transactionId) return;
    const txId=uid();
    state.transactions.push({
      id:txId,type:"project",description:`Versement → ${p.name}`,amount,
      currency:p.currency, projectId:p.id,date:new Date().toISOString(),month:monthKey()
    });
    a.checked=true; a.transactionId=txId;
  }else{
    if(a.transactionId) state.transactions=state.transactions.filter(t=>t.id!==a.transactionId);
    a.checked=false; a.transactionId=null;
  }
  persist();
}
function addProjectExpense(projectId){
  const p=state.projects.find(x=>x.id===projectId);
  const label=$("detailExpenseLabel").value.trim();
  const amount=parseFloat($("detailExpenseAmount").value);
  const currency=$("detailExpenseCurrency").value;
  const category=$("detailExpenseCategory").value;
  if(!label||!amount||amount<=0) return alert("Description et montant requis.");
  if(amount > projectCash(projectId, currency)) return alert("Trésorerie du projet insuffisante.");
  state.projectExpenses.push({
    id:uid(),projectId,label,amount,currency,category,
    date:new Date().toISOString(),month:monthKey()
  });
  persist();
}
function addMaterial(projectId){
  const name=$("materialName").value.trim();
  const planned=parseFloat($("materialPlanned").value)||0;
  const bought=parseFloat($("materialBought").value)||0;
  if(!name) return alert("Nom du matériau requis.");
  state.projectMaterials.push({id:uid(),projectId,name,planned,bought});
  persist();
}
function addWorker(projectId){
  const name=$("workerName").value.trim();
  const total=parseFloat($("workerTotal").value)||0;
  const paid=parseFloat($("workerPaid").value)||0;
  if(!name) return alert("Nom ou rôle requis.");
  state.projectWorkers.push({id:uid(),projectId,name,total,paid});
  persist();
}
function addTask(projectId){
  const name=$("taskName").value.trim();
  if(!name) return alert("Nom de l'étape requis.");
  state.projectTasks.push({id:uid(),projectId,name,done:false});
  persist();
}
function toggleTask(taskId, projectId){
  const t=state.projectTasks.find(x=>x.id===taskId); if(!t)return;
  t.done=!t.done; persist();
}

function renderHome(){
  $("totalAssets").textContent=Currency.format(totalAssets(), state.mainCurrency);
  $("availableBalance").textContent=Currency.format(availableBalance(), state.mainCurrency);
  $("projectsBalance").textContent=Currency.format(projectsBalance(), state.mainCurrency);
  $("monthIncome").textContent=Currency.format(monthIncome(), state.mainCurrency);
  $("monthExpenses").textContent=Currency.format(monthExpenses(), state.mainCurrency);

  const projects=state.projects.filter(p=>p.status==="active").slice(0,3);
  $("homeProjects").innerHTML=projects.length?projects.map(projectCard).join(""):`<div class="card empty">Aucun projet actif.</div>`;

  const tx=[...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4);
  $("homeTransactions").innerHTML=tx.length?tx.map(transactionRow).join(""):`<div class="empty">Aucune transaction.</div>`;
}
function projectCard(p){
  const saved=projectSaved(p.id, p.currency), pct=Math.min(100,(saved/p.target)*100), cash=projectCash(p.id, p.currency);
  const activeClass = activeProjectId === p.id ? "active-border" : "";

  let secondaryHtml = "";
  if (p.currency !== state.mainCurrency) {
    secondaryHtml = `<div class="muted" style="font-size:11px">≈ ${Currency.format(Currency.convert(saved, p.currency, state.mainCurrency, state.rates), state.mainCurrency)} / ${Currency.format(Currency.convert(p.target, p.currency, state.mainCurrency, state.rates), state.mainCurrency)}</div>`;
  } else if (state.showArFmg && (p.currency === 'MGA' || p.currency === 'FMG')) {
    const other = p.currency === 'MGA' ? Currency.format(Currency.arToFmg(saved), 'FMG') : Currency.format(Currency.fmgToAr(saved), 'MGA');
    secondaryHtml = `<div class="muted" style="font-size:11px">= ${other}</div>`;
  }

  return `<article class="project-card ${activeClass}" onclick="openProject('${p.id}')">
    <div class="project-card-header">
      <div><div class="project-name">${p.icon} ${esc(p.name)}</div><div class="muted">${PROJECT_CONFIGS[p.subType]?.label || (p.type === 'detailed' ? 'Projet détaillé' : 'Projet simple')}</div></div>
      <span class="badge">${Math.round(pct)} %</span>
    </div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <div class="project-meta">
      <div>
        <div>${Currency.format(saved, p.currency)} / ${Currency.format(p.target, p.currency)}</div>
        ${secondaryHtml}
      </div>
      <span>Dispo : ${Currency.format(cash, p.currency)}</span>
    </div>
  </article>`;
}
function transactionRow(t){
  let cls="amount-expense", sign="-", label="Dépense";
  if(t.type==="income"){cls="amount-income";sign="+";label="Entrée"}
  if(t.type==="project"){cls="amount-project";sign="→";label="Projet"}

  let secondary = "";
  if (state.showArFmg && (t.currency === 'MGA' || t.currency === 'FMG')) {
    const other = t.currency === 'MGA' ? Currency.format(Currency.arToFmg(t.amount), 'FMG') : Currency.format(Currency.fmgToAr(t.amount), 'MGA');
    secondary = `<br><small class="muted">= ${other}</small>`;
  }

  return `<div class="tx"><div><strong>${esc(t.description)}</strong><small>${new Date(t.date).toLocaleDateString("fr-FR")} · ${label}</small></div><div style="text-align:right"><strong class="${cls}">${sign}${Currency.format(t.amount, t.currency)}</strong>${secondary}</div></div>`;
}
function renderTransactions(){
  const filter=$("txFilter").value;
  let rows=[
    ...state.transactions.map(t=>({...t,displayType:t.type})),
    ...state.projectExpenses.map(e=>({id:e.id,displayType:"project_expense",description:e.label,amount:e.amount,currency:e.currency,date:e.date}))
  ].sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(filter!=="all") rows=rows.filter(r=>r.displayType===filter);

  $("transactionList").innerHTML=rows.length?rows.map(r=>{
    let cls="amount-expense",sign="-",label="Dépense";
    if(r.displayType==="income"){cls="amount-income";sign="+";label="Entrée"}
    if(r.displayType==="project"){cls="amount-project";sign="→";label="Versement projet"}
    if(r.displayType==="project_expense"){cls="amount-project-expense";sign="-";label="Dépense projet"}
    const del=["income","expense"].includes(r.displayType)?`<button class="link-btn" onclick="deleteTransaction('${r.id}')">Supprimer</button>`:"";

    let secondary = "";
    if (state.showArFmg && (r.currency === 'MGA' || r.currency === 'FMG')) {
      const other = r.currency === 'MGA' ? Currency.format(Currency.arToFmg(r.amount), 'FMG') : Currency.format(Currency.fmgToAr(r.amount), 'MGA');
      secondary = `<br><small class="muted">= ${other}</small>`;
    }

    return `<div class="tx"><div><strong>${esc(r.description)}</strong><small>${new Date(r.date).toLocaleDateString("fr-FR")} · ${label}</small>${del}</div><div style="text-align:right"><strong class="${cls}">${sign}${Currency.format(r.amount, r.currency)}</strong>${secondary}</div></div>`;
  }).join(""):`<div class="empty">Aucune transaction.</div>`;
}
function renderProjects(){
  const active=state.projects.filter(p=>p.status==="active");
  const archived=state.projects.filter(p=>p.status==="archived");
  $("projectsList").innerHTML = `
    <div class="section-head"><h2>Projets actifs</h2></div>
    ${active.length?active.map(projectCard).join(""):`<div class="card empty">Aucun projet actif.</div>`}
    ${archived.length?`<div class="section-head"><h2>Archivés</h2></div>${archived.map(p=>`
      <div class="card"><div class="project-card-header"><strong>${p.icon} ${esc(p.name)}</strong><button class="secondary" onclick="reactivateProject('${p.id}')">Réactiver</button></div></div>`).join("")}`:""}
  `;
}
function renderMonthly(){
  $("monthLabel").textContent=`📅 ${monthLabel()}`;
  const list=state.projects.filter(p=>p.status==="active");
  $("monthlyList").innerHTML=list.length?list.map(p=>{
    const key=assignmentKey(p.id), a=state.monthlyAssignments[key]||{amount:"",checked:false};
    return `<div class="card">
      <div class="check-card">
        <input type="checkbox" ${a.checked?"checked":""} onchange="toggleAssignment('${p.id}',this.checked)" />
        <div><strong>${p.icon} ${esc(p.name)}</strong><div class="muted">${Currency.format(projectSaved(p.id, p.currency), p.currency)} · Solde : ${Currency.format(projectCash(p.id, p.currency), p.currency)}</div></div>
        <div class="field"><input type="number" min="0" step="0.01" placeholder="Montant ${p.currency}" value="${a.amount||""}" ${a.checked?"disabled":""} onchange="setAssignmentAmount('${p.id}',this.value)" /></div>
      </div>
    </div>`;
  }).join(""):`<div class="card empty">Aucun projet actif.</div>`;
}

const PROJECT_CONFIGS = {
  house: { label: "Maison", tabs: ["summary", "expenses", "materials", "workers", "tasks"] },
  land: { label: "Terrain", tabs: ["summary", "land_info", "documents", "fees", "workers", "tasks"] },
  car: { label: "Voiture", tabs: ["summary", "car_info", "maintenance", "insurance", "expenses", "tasks"] },
  travel: { label: "Voyage", tabs: ["summary", "transport", "lodging", "activities", "expenses", "documents"] },
  studies: { label: "Études", tabs: ["summary", "enrollment", "fees", "materials", "modules", "tasks"] },
  business: { label: "Entreprise", tabs: ["summary", "capital", "expenses", "team", "documents", "tasks"] },
  commerce: { label: "Commerce", tabs: ["summary", "stock", "suppliers", "sales", "expenses", "tasks"] },
  wedding: { label: "Mariage", tabs: ["summary", "budget_detail", "vendors", "guests", "expenses", "tasks"] },
  computer: { label: "Achat Ordinateur", tabs: ["summary", "criteria", "comparison", "budget_detail", "expenses"] },
  saving: { label: "Épargne", tabs: ["summary", "savings_goal", "transfers", "withdrawals", "tasks"] },
  family: { label: "Projet Familial", tabs: ["summary", "participants", "budget_detail", "expenses", "tasks"] },
  pro: { label: "Projet Pro", tabs: ["summary", "tasks", "team", "expenses", "documents"] },
  invest: { label: "Investissement", tabs: ["summary", "invest_capital", "income_stream", "fees", "tasks", "documents"] },
  custom: { label: "Personnalisé", tabs: ["summary", "expenses", "tasks", "custom_tabs"] }
};

const TAB_LABELS = {
  summary: "Résumé", expenses: "Dépenses", materials: "Matériaux", workers: "Ouvriers", tasks: "Avancement",
  land_info: "Parcelle", documents: "Documents", fees: "Frais", car_info: "Véhicule", maintenance: "Entretien",
  insurance: "Assurance", transport: "Transport", lodging: "Hébergement", activities: "Activités",
  enrollment: "Inscriptions", modules: "Cours", capital: "Capital", team: "Équipe", stock: "Stock",
  suppliers: "Fournisseurs", sales: "Ventes", budget_detail: "Budget", vendors: "Prestataires",
  guests: "Invités", criteria: "Critères", comparison: "Comparatif", savings_goal: "Objectif",
  transfers: "Versements", withdrawals: "Retraits", participants: "Participants", invest_capital: "Investi",
  income_stream: "Revenus", custom_tabs: "Personnaliser"
};

function getProjectTabs(p) {
  const config = PROJECT_CONFIGS[p.subType] || { tabs: ["summary", "expenses", "tasks"] };
  let tabs = [...config.tabs];
  if (p.customTabs) {
      p.customTabs.forEach(t => tabs.push(`custom_${t.id}`));
  }
  return tabs;
}

function openProject(id){
  activeProjectId=id;
  if(isLargeScreen()){
    navigate("projectsPage");
  } else {
    navigate("projectDetailPage");
  }
  renderProjectDetail();
}

function renderProjectDetail(){
  const p=state.projects.find(p=>p.id===activeProjectId);
  const container = isLargeScreen() ? $("tabletDetailPane") : $("projectDetail");

  if(!p){
    if(isLargeScreen()){
       container.innerHTML = `<div class="empty-detail"><p>Sélectionnez un projet pour voir les détails</p></div>`;
    } else {
       container.innerHTML = "";
    }
    return;
  }

  const saved=projectSaved(p.id, p.currency), spent=projectSpent(p.id, p.currency), cash=projectCash(p.id, p.currency), pct=Math.min(100,(saved/p.target)*100);
  const tabs = getProjectTabs(p);

  container.innerHTML=`
    <div class="detail-pane-content">
      <div class="card">
        <div class="project-card-header">
          <div>
            <div class="project-name">${p.icon} ${esc(p.name)}</div>
            <div class="muted">${PROJECT_CONFIGS[p.subType]?.label || (p.type === 'detailed' ? 'Projet détaillé' : 'Projet simple')}</div>
          </div>
          <button class="danger" onclick="archiveProject('${p.id}')">Archiver</button>
        </div>
        <div class="kpi-grid" style="margin-top:14px">
          <div class="kpi"><span>Objectif</span><strong>${Currency.format(p.target, p.currency)}</strong></div>
          <div class="kpi"><span>Affecté</span><strong>${Currency.format(saved, p.currency)}</strong></div>
          <div class="kpi"><span>Dépensé</span><strong>${Currency.format(spent, p.currency)}</strong></div>
          <div class="kpi"><span>Trésorerie</span><strong>${Currency.format(cash, p.currency)}</strong></div>
        </div>
        <div class="progress"><div style="width:${pct}%"></div></div>
      </div>

      ${p.type === 'detailed' ? `
        <div class="detail-tabs">
          ${tabs.map((t, idx) => {
            const label = t.startsWith("custom_") ? (p.customTabs.find(ct => `custom_${ct.id}` === t)?.name || "Onglet") : (TAB_LABELS[t] || t);
            return `<button class="${idx === 0 ? 'active' : ''}" onclick="switchDetailTab(this,'tab_${t}')">${label}</button>`;
          }).join("")}
        </div>
        ${tabs.map((t, idx) => `
          <div id="tab_${t}" class="op-pane ${idx === 0 ? 'active' : ''}">
            ${renderTabContent(p, t)}
          </div>
        `).join("")}
      ` : simpleProjectHtml(p)}
    </div>
  `;
}

function renderTabContent(p, tabId) {
    if (tabId === "summary") return `<div class="card"><h2>Versements reçus</h2>${projectTransfers(p.id)}</div>`;
    if (tabId === "expenses") return renderExpensesTab(p);
    if (tabId === "materials") return renderMaterialsTab(p);
    if (tabId === "workers") return renderWorkersTab(p);
    if (tabId === "tasks") return renderTasksTab(p);
    if (tabId === "custom_tabs") return renderCustomTabsManager(p);
    if (tabId.startsWith("custom_")) return renderCustomTab(p, tabId.replace("custom_", ""));

    // Generic Data Tab
    return renderGenericDataTab(p, tabId);
}

function renderExpensesTab(p) {
    return `
      <div class="card form-card">
        <h2>Nouvelle dépense projet</h2>
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
      <div class="card"><h2>Historique des dépenses</h2>${projectExpenseRows(p.id)}</div>
    `;
}

function renderMaterialsTab(p) {
    return `
      <div class="card form-card">
        <h2>Matériaux</h2>
        <div class="field"><label>Nom</label><input id="materialName" placeholder="Ex : Planche" /></div>
        <div class="two-cols"><div class="field"><label>Prévu</label><input id="materialPlanned" type="number" /></div><div class="field"><label>Acheté</label><input id="materialBought" type="number" /></div></div>
        <button class="primary full" onclick="addMaterial('${p.id}')">Ajouter</button>
      </div>
      <div class="card">${materialsTable(p.id)}</div>
    `;
}

function renderWorkersTab(p) {
    return `
      <div class="card form-card">
        <h2>Intervenants / Ouvriers</h2>
        <div class="field"><label>Nom / rôle</label><input id="workerName" placeholder="Ex : Maçon" /></div>
        <div class="two-cols"><div class="field"><label>Convenu (${p.currency})</label><input id="workerTotal" type="number" /></div><div class="field"><label>Payé (${p.currency})</label><input id="workerPaid" type="number" /></div></div>
        <button class="primary full" onclick="addWorker('${p.id}')">Ajouter</button>
      </div>
      <div class="card">${workersTable(p.id)}</div>
    `;
}

function renderTasksTab(p) {
    return `
      <div class="card form-card">
        <h2>Étapes / Avancement</h2>
        <div class="field"><label>Nouvelle étape</label><input id="taskName" placeholder="Ex : Toiture terminée" /></div>
        <button class="primary full" onclick="addTask('${p.id}')">Ajouter</button>
      </div>
      <div class="card">${tasksList(p.id)}</div>
    `;
}

function renderGenericDataTab(p, tabId) {
    const fields = getFieldsForTab(tabId);
    const data = state.projectData.filter(d => d.projectId === p.id && d.tabId === tabId);

    return `
        <div class="card form-card">
            <h2>${TAB_LABELS[tabId]}</h2>
            ${fields.map(f => `
                <div class="field">
                    <label>${f.label}</label>
                    <input id="data_${tabId}_${f.id}" type="${f.type || 'text'}" placeholder="${f.placeholder || ''}" />
                </div>
            `).join("")}
            <button class="primary full" onclick="saveGenericData('${p.id}', '${tabId}')">Enregistrer</button>
        </div>
        <div class="card">
            <h2>Récapitulatif</h2>
            <div class="table-wrap">
                <table>
                    <thead><tr>${fields.map(f => `<th>${f.label}</th>`).join("")}<th></th></tr></thead>
                    <tbody>
                        ${data.map(d => `
                            <tr>
                                ${fields.map(f => `<td>${esc(d.values[f.id])}</td>`).join("")}
                                <td><button class="link-btn danger" onclick="deleteGenericData('${d.id}')">X</button></td>
                            </tr>
                        `).join("")}
                        ${!data.length ? `<tr><td colspan="${fields.length + 1}" class="empty">Aucune donnée enregistrée</td></tr>` : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function getFieldsForTab(tabId) {
    const map = {
        land_info: [
            { id: 'surface', label: 'Surface', placeholder: 'Ex: 500m²' },
            { id: 'location', label: 'Localisation', placeholder: 'Ex: Ivato' },
            { id: 'parcel', label: 'N° de parcelle' },
            { id: 'title', label: 'Statut du titre' }
        ],
        fees: [
            { id: 'label', label: 'Nature du frais' },
            { id: 'amount', label: 'Montant', type: 'number' }
        ],
        documents: [
            { id: 'label', label: 'Nom du document' },
            { id: 'status', label: 'Statut (Obtenu, En cours...)' }
        ],
        car_info: [
            { id: 'brand', label: 'Marque/Modèle' },
            { id: 'year', label: 'Année', type: 'number' },
            { id: 'km', label: 'Kilométrage', type: 'number' }
        ],
        maintenance: [
            { id: 'date', label: 'Date', type: 'date' },
            { id: 'label', label: 'Opération' },
            { id: 'cost', label: 'Coût', type: 'number' }
        ],
        insurance: [
            { id: 'company', label: 'Assureur' },
            { id: 'expiry', label: 'Échéance', type: 'date' }
        ],
        transport: [
            { id: 'mode', label: 'Moyen de transport' },
            { id: 'ref', label: 'N° Vol / Réf' },
            { id: 'cost', label: 'Prix', type: 'number' }
        ],
        lodging: [
            { id: 'name', label: 'Nom hébergement' },
            { id: 'address', label: 'Adresse' },
            { id: 'cost', label: 'Prix', type: 'number' }
        ],
        activities: [
            { id: 'label', label: 'Activité' },
            { id: 'cost', label: 'Prix', type: 'number' }
        ],
        enrollment: [
            { id: 'school', label: 'Établissement' },
            { id: 'course', label: 'Formation' }
        ],
        modules: [
            { id: 'name', label: 'Nom du module' },
            { id: 'grade', label: 'Note / Statut' }
        ],
        capital: [
            { id: 'source', label: 'Source des fonds' },
            { id: 'amount', label: 'Montant', type: 'number' }
        ],
        team: [
            { id: 'name', label: 'Nom' },
            { id: 'role', label: 'Rôle' }
        ],
        stock: [
            { id: 'item', label: 'Article' },
            { id: 'qty', label: 'Quantité', type: 'number' },
            { id: 'buy', label: 'Prix achat', type: 'number' },
            { id: 'sell', label: 'Prix vente', type: 'number' }
        ],
        suppliers: [
            { id: 'name', label: 'Fournisseur' },
            { id: 'contact', label: 'Contact' }
        ],
        sales: [
            { id: 'date', label: 'Date', type: 'date' },
            { id: 'amount', label: 'Montant', type: 'number' }
        ],
        budget_detail: [
            { id: 'label', label: 'Poste de dépense' },
            { id: 'planned', label: 'Budget prévu', type: 'number' }
        ],
        vendors: [
            { id: 'name', label: 'Nom du prestataire' },
            { id: 'service', label: 'Service' },
            { id: 'cost', label: 'Prix convenu', type: 'number' }
        ],
        guests: [
            { id: 'name', label: 'Nom invité' },
            { id: 'status', label: 'Confirmation' }
        ],
        criteria: [
            { id: 'spec', label: 'Caractéristique' },
            { id: 'requirement', label: 'Besoin' }
        ],
        comparison: [
            { id: 'model', label: 'Modèle' },
            { id: 'price', label: 'Prix', type: 'number' },
            { id: 'rating', label: 'Note /5', type: 'number' }
        ],
        savings_goal: [
            { id: 'date', label: 'Échéance', type: 'date' },
            { id: 'amount', label: 'Cible', type: 'number' }
        ],
        withdrawals: [
            { id: 'date', label: 'Date', type: 'date' },
            { id: 'amount', label: 'Montant', type: 'number' }
        ],
        participants: [
            { id: 'name', label: 'Nom' }
        ],
        invest_capital: [
            { id: 'asset', label: 'Actif (Action, Immo...)' },
            { id: 'val', label: 'Montant investi', type: 'number' }
        ],
        income_stream: [
            { id: 'date', label: 'Date', type: 'date' },
            { id: 'amount', label: 'Dividendes / Loyer', type: 'number' }
        ]
    };
    return map[tabId] || [{ id: 'label', label: 'Description' }, { id: 'value', label: 'Valeur' }];
}

function saveGenericData(projectId, tabId) {
    const fields = getFieldsForTab(tabId);
    const values = {};
    fields.forEach(f => {
        values[f.id] = $(`data_${tabId}_${f.id}`).value;
        $(`data_${tabId}_${f.id}`).value = "";
    });

    state.projectData.push({
        id: uid(), projectId, tabId, values
    });
    persist();
}

function deleteGenericData(id) {
    if(confirm("Supprimer cette donnée ?")) {
        state.projectData = state.projectData.filter(d => d.id !== id);
        persist();
    }
}

function renderCustomTabsManager(p) {
    return `
        <div class="card form-card">
            <h2>Gérer les sous-groupes</h2>
            <div class="field">
                <label>Nom du nouveau sous-groupe</label>
                <input id="newTabName" placeholder="Ex: Checklist invités" />
            </div>
            <button class="primary full" onclick="addCustomTab('${p.id}')">Ajouter le sous-groupe</button>
        </div>
        <div class="card">
            <h2>Sous-groupes actuels</h2>
            ${p.customTabs?.map(t => `
                <div class="task-row">
                    <span>${esc(t.name)}</span>
                    <button class="link-btn danger" onclick="deleteCustomTab('${p.id}', '${t.id}')">Supprimer</button>
                </div>
            `).join("") || '<div class="empty">Aucun sous-groupe personnalisé</div>'}
        </div>
    `;
}

function addCustomTab(projectId) {
    const name = $("newTabName").value.trim();
    if (!name) return alert("Nom requis");
    const p = state.projects.find(x => x.id === projectId);
    p.customTabs = p.customTabs || [];
    p.customTabs.push({ id: uid(), name });
    persist();
}

function deleteCustomTab(projectId, tabId) {
    if(confirm("Supprimer ce sous-groupe et toutes ses données ?")) {
        const p = state.projects.find(x => x.id === projectId);
        p.customTabs = p.customTabs.filter(t => t.id !== tabId);
        state.projectData = state.projectData.filter(d => d.projectId === projectId && d.tabId !== `custom_${tabId}`);
        persist();
    }
}

function renderCustomTab(p, tabId) {
    const data = state.projectData.filter(d => d.projectId === p.id && d.tabId === `custom_${tabId}`);
    return `
        <div class="card form-card">
            <h2>Ajouter une ligne</h2>
            <div class="field"><label>Description</label><input id="custom_desc_${tabId}" /></div>
            <div class="field"><label>Valeur / Note</label><input id="custom_val_${tabId}" /></div>
            <button class="primary full" onclick="saveCustomData('${p.id}', '${tabId}')">Ajouter</button>
        </div>
        <div class="card">
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Description</th><th>Valeur</th><th></th></tr></thead>
                    <tbody>
                        ${data.map(d => `
                            <tr>
                                <td>${esc(d.values.desc)}</td>
                                <td>${esc(d.values.val)}</td>
                                <td><button class="link-btn danger" onclick="deleteGenericData('${d.id}')">X</button></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function saveCustomData(projectId, tabId) {
    const desc = $(`custom_desc_${tabId}`).value;
    const val = $(`custom_val_${tabId}`).value;
    state.projectData.push({
        id: uid(), projectId, tabId: `custom_${tabId}`, values: { desc, val }
    });
    $(`custom_desc_${tabId}`).value = "";
    $(`custom_val_${tabId}`).value = "";
    persist();
}

function simpleProjectHtml(p){
  return `<div class="card"><h2>Versements</h2>${projectTransfers(p.id)}</div>`;
}

function switchDetailTab(btn,id){
  document.querySelectorAll(".op-pane").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".detail-tabs button").forEach(b=>b.classList.remove("active"));
  $(id).classList.add("active"); btn.classList.add("active");
}
function projectTransfers(id){
  const rows=state.transactions.filter(t=>t.type==="project"&&t.projectId===id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  return rows.length?rows.map(transactionRow).join(""):`<div class="empty">Aucun versement.</div>`;
}
function projectExpenseRows(id){
  const rows=state.projectExpenses.filter(e=>e.projectId===id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  return rows.length?rows.map(e=>{
    let secondary = "";
    if (state.showArFmg && (e.currency === 'MGA' || e.currency === 'FMG')) {
      const other = e.currency === 'MGA' ? Currency.format(Currency.arToFmg(e.amount), 'FMG') : Currency.format(Currency.fmgToAr(e.amount), 'MGA');
      secondary = `<br><small class="muted">= ${other}</small>`;
    }
    return `<div class="tx"><div><strong>${esc(e.label)}</strong><small>${esc(e.category)} · ${new Date(e.date).toLocaleDateString("fr-FR")}</small></div><div style="text-align:right"><strong class="amount-project-expense">-${Currency.format(e.amount, e.currency)}</strong>${secondary}</div></div>`;
  }).join(""):`<div class="empty">Aucune dépense projet.</div>`;
}
function materialsTable(id){
  const rows=state.projectMaterials.filter(m=>m.projectId===id);
  if(!rows.length) return `<div class="empty">Aucun matériau.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Matériau</th><th>Prévu</th><th>Acheté</th><th>Reste</th></tr></thead><tbody>${rows.map(m=>`<tr><td>${esc(m.name)}</td><td>${m.planned}</td><td>${m.bought}</td><td>${Math.max(0,m.planned-m.bought)}</td></tr>`).join("")}</tbody></table></div>`;
}
function workersTable(id){
  const rows=state.projectWorkers.filter(w=>w.projectId===id);
  const p=state.projects.find(x=>x.id===id);
  if(!rows.length) return `<div class="empty">Aucun ouvrier.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Ouvrier</th><th>Convenu</th><th>Payé</th><th>Reste</th></tr></thead><tbody>${rows.map(w=>`<tr><td>${esc(w.name)}</td><td>${Currency.format(w.total, p.currency)}</td><td>${Currency.format(w.paid, p.currency)}</td><td>${Currency.format(Math.max(0,w.total-w.paid), p.currency)}</td></tr>`).join("")}</tbody></table></div>`;
}
function tasksList(id){
  const rows=state.projectTasks.filter(t=>t.projectId===id);
  return rows.length?rows.map(t=>`<div class="task-row"><label><input type="checkbox" ${t.done?"checked":""} onchange="toggleTask('${t.id}','${id}')" /><span style="${t.done?"text-decoration:line-through;opacity:.6":""}">${esc(t.name)}</span></label><span class="badge">${t.done?"Terminé":"À faire"}</span></div>`).join(""):`<div class="empty">Aucune étape.</div>`;
}

function navigate(pageId){
  // If moving from mobile detail to projects list, ensure active ID remains if we're now on large screen
  if(pageId === "projectsPage" && isLargeScreen() && activeProjectId) {
    // Keep active project
  } else if (pageId !== "projectDetailPage") {
    // activeProjectId = null; // Optional: clear selection when switching main tabs
  }

  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  $(pageId).classList.add("active");

  // Sync all nav items
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===pageId));

  const titles={homePage:"Accueil",transactionsPage:"Transactions",projectsPage:"Projets",monthlyPage:"Ce mois",settingsPage:"Réglages",projectDetailPage:"Projet"};
  $("pageTitle").textContent=titles[pageId]||"Budget & Projets";
  if($("sidePageTitle")) $("sidePageTitle").textContent=titles[pageId]||"Budget & Projets";

  $("mainScroll").scrollTo({top:0,behavior:"smooth"});
}

function renderAll(){
  applyTheme();
  applySettings();
  renderHome(); renderTransactions(); renderProjects(); renderMonthly();

  const isProjDetail = $("projectDetailPage").classList.contains("active");
  const isProjPage = $("projectsPage").classList.contains("active");

  if(activeProjectId && (isProjDetail || (isProjPage && isLargeScreen()))) {
    renderProjectDetail();
  }
}

// Global Event Listeners
window.addEventListener("resize", () => {
  // Handle layout switch dynamically
  const isProjDetail = $("projectDetailPage").classList.contains("active");
  if(isProjDetail && isLargeScreen()) {
    navigate("projectsPage");
  }
  renderAll();
});

document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.nav)));
$("addTxBtn").addEventListener("click",addTransaction);
$("createProjectBtn").addEventListener("click",createProject);
$("txFilter").addEventListener("change",renderTransactions);
$("backProjectsBtn").addEventListener("click",()=>navigate("projectsPage"));
$("quickAddBtn").addEventListener("click",()=>navigate("transactionsPage"));
$("themeSelect").addEventListener("change",(e)=>{
  state.theme=e.target.value;
  persist();
});
$("mainCurrencySelect").addEventListener("change",(e)=>{
  state.mainCurrency=e.target.value;
  persist();
});
$("showArFmgToggle").addEventListener("change",(e)=>{
  state.showArFmg=e.target.checked;
  persist();
});
$("rateEur").addEventListener("change",(e)=>{
  state.rates.EUR=parseFloat(e.target.value)||5000;
  persist();
});
$("rateUsd").addEventListener("change",(e)=>{
  state.rates.USD=parseFloat(e.target.value)||4500;
  persist();
});

function updateFmgHint(amountEl, currencyEl, hintEl){
  const amount = parseFloat($(amountEl).value);
  const curr = $(currencyEl).value;
  if (!state.showArFmg || !amount || (curr !== 'MGA' && curr !== 'FMG')) {
    $(hintEl).style.display = 'none';
    return;
  }
  const result = curr === 'MGA' ? Currency.format(Currency.arToFmg(amount), 'FMG') : Currency.format(Currency.fmgToAr(amount), 'MGA');
  $(hintEl).textContent = `= ${result}`;
  $(hintEl).style.display = 'block';
}

$("txAmount").addEventListener("input", ()=>updateFmgHint("txAmount", "txCurrency", "txFmgHint"));
$("txCurrency").addEventListener("change", ()=>updateFmgHint("txAmount", "txCurrency", "txFmgHint"));

// Delegation for dynamic project expense hint
document.addEventListener("input", (e) => {
  if (e.target.id === "detailExpenseAmount") updateFmgHint("detailExpenseAmount", "detailExpenseCurrency", "detailExpenseFmgHint");
});
document.addEventListener("change", (e) => {
  if (e.target.id === "detailExpenseCurrency") updateFmgHint("detailExpenseAmount", "detailExpenseCurrency", "detailExpenseFmgHint");
});

$("exportBtn").addEventListener("click",()=>exportState(state));
$("importInput").addEventListener("change",(e)=>{
  const file=e.target.files[0]; if(!file)return;
  importStateFile(file,(err,newState)=>{
    if(err) return alert("Sauvegarde invalide.");
    state=newState; renderAll(); alert("Sauvegarde importée.");
  });
});
$("resetBtn").addEventListener("click",()=>{
  if(confirm("Effacer toutes les données ?")){
    resetState(); state=loadState(); activeProjectId=null; renderAll(); navigate("homePage");
  }
});

renderAll();

let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if ($("installBtn")) $("installBtn").hidden = false;
});

$("installBtn")?.addEventListener("click", async () => {
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
