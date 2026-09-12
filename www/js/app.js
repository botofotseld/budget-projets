
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

// --- Basic Calculations helpers ---

function projectSaved(id, targetCurrency){
  return state.transactions
    .filter(t=>t.type==="project"&&t.projectId===id)
    .reduce((s,t)=>s + Currency.convert(t.amount, t.currency, targetCurrency, state.rates), 0);
}
function availableBalance(targetCurrency = state.mainCurrency){
  return state.transactions.reduce((b,t)=>{
    const val = Currency.convert(t.amount, t.currency, targetCurrency, state.rates);
    if(t.type==="income") b+=val;
    if(t.type==="expense" || t.type === 'payment' || t.type === 'purchase') b-=val;
    if(t.type==="project") b-=val;
    return b;
  },0);
}
function projectsBalance(targetCurrency = state.mainCurrency){
  return state.projects.reduce((s,p)=>s + ProjectService.getKPIs(p).treasury, 0);
}
function totalAssets(){ return availableBalance() + projectsBalance(); }

function monthIncome(){
  return state.transactions
    .filter(t=>t.month===monthKey()&&t.type==="income")
    .reduce((s,t)=>s + Currency.convert(t.amount, t.currency, state.mainCurrency, state.rates), 0);
}
function monthExpenses(){
  return state.transactions
    .filter(t=>t.month===monthKey() && [TransactionService.TYPES.EXPENSE, TransactionService.TYPES.PAYMENT, TransactionService.TYPES.PURCHASE].includes(t.type))
    .reduce((s,t)=>s + Currency.convert(t.amount, t.currency, state.mainCurrency, state.rates), 0);
}
function persist(){ saveState(state); renderAll(); }

// --- Global Actions ---

function addTransaction(){
  const amount = parseFloat($("txAmount").value);
  if(!amount || amount<=0) return alert("Montant valide requis.");

  TransactionService.add({
    type: $("txType").value,
    description: $("txDescription").value.trim() || "Transaction",
    amount: amount,
    currency: $("txCurrency").value,
    month: monthKey()
  });

  $("txDescription").value=""; $("txAmount").value="";
  persist();
}

function deleteTransaction(id){
  const tx=state.transactions.find(t=>t.id===id);
  if(!tx) return;
  if(tx.type==="project") return alert("Annule ce versement depuis l'onglet Ce mois.");
  if(confirm("Supprimer cette transaction ?")){
    TransactionService.delete(id);
    persist();
  }
}

function createProject(){
  const name=$("projectName").value.trim();
  const target=parseFloat($("projectTarget").value);
  if(!name || !target || target<=0) return alert("Nom et objectif financier requis.");

  const subType = $("projectType").value;
  const config = PROJECT_TYPES[subType] || PROJECT_TYPES.house;

  state.projects.push({
    id: uid(),
    name,
    icon: $("projectIcon").value.trim() || config.icon,
    target,
    currency: $("projectCurrency").value,
    type: subType === "simple" ? "simple" : "detailed",
    subType: subType,
    status: "En cours",
    created: new Date().toISOString(),
    customTabs: []
  });

  $("projectName").value=""; $("projectIcon").value=""; $("projectTarget").value="";
  persist();
}

function updateProjectStatus(id, s) {
    const p = state.projects.find(x => x.id === id);
    if (p) { p.status = s; persist(); }
}

function archiveProject(id){
  updateProjectStatus(id, "Archivé");
  if (!isLargeScreen()) navigate("projectsPage");
}

function reactivateProject(id){
  updateProjectStatus(id, "En cours");
}

// --- Main Navigation & Rendering ---

function renderHome(){
  $("totalAssets").textContent=Currency.format(totalAssets(), state.mainCurrency);
  $("availableBalance").textContent=Currency.format(availableBalance(), state.mainCurrency);
  $("projectsBalance").textContent=Currency.format(projectsBalance(), state.mainCurrency);
  $("monthIncome").textContent=Currency.format(monthIncome(), state.mainCurrency);
  $("monthExpenses").textContent=Currency.format(monthExpenses(), state.mainCurrency);

  const active=state.projects.filter(p=>p.status !== "Archivé").slice(0,3);
  $("homeProjects").innerHTML=active.length?active.map(p => projectCard(p)).join(""):`<div class="card empty">Aucun projet actif.</div>`;

  const tx=[...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4);
  $("homeTransactions").innerHTML=tx.length?tx.map(t => transactionRow(t)).join(""):`<div class="empty">Aucune transaction.</div>`;
}

function projectCard(p){
  const kpis = ProjectService.getKPIs(p);
  const activeClass = activeProjectId === p.id ? "active-border" : "";

  let secondary = "";
  if (p.currency !== state.mainCurrency) {
    secondary = `<div class="muted" style="font-size:11px">≈ ${Currency.format(Currency.convert(kpis.allocated, p.currency, state.mainCurrency, state.rates), state.mainCurrency)}</div>`;
  }

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

function transactionRow(t){
  let cls="amount-expense", sign="-", label="Dépense";
  if(t.type==="income") { cls="amount-income"; sign="+"; label="Entrée"; }
  if(t.type==="project") { cls="amount-project"; sign="→"; label="Projet"; }
  if(t.type==="revenue") { cls="amount-income"; sign="+"; label="Revenu"; }

  return `
    <div class="tx">
        <div><strong>${esc(t.description)}</strong><small>${new Date(t.date).toLocaleDateString("fr-FR")} · ${label}</small></div>
        <div style="text-align:right"><strong class="${cls}">${sign}${Currency.format(t.amount, t.currency)}</strong></div>
    </div>`;
}

function renderTransactions(){
    const filter=$("txFilter").value;
    let rows=[...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date));
    if(filter!=="all") rows=rows.filter(r=>r.type===filter);

    $("transactionList").innerHTML=rows.length?rows.map(r=>{
        const del = ["income","expense"].includes(r.type)?`<button class="link-btn" onclick="deleteTransaction('${r.id}')">Supprimer</button>`:"";
        return `
            <div class="tx">
                <div><strong>${esc(r.description)}</strong><small>${new Date(r.date).toLocaleDateString("fr-FR")} · ${r.type}</small>${del}</div>
                <strong class="amount-expense">${Currency.format(r.amount, r.currency)}</strong>
            </div>`;
    }).join(""):`<div class="empty">Aucune transaction.</div>`;
}

function renderProjects(){
  const active=state.projects.filter(p=>p.status !== "Archivé");
  const archived=state.projects.filter(p=>p.status === "Archivé");
  $("projectsList").innerHTML = `
    <div class="section-head"><h2>Projets actifs</h2></div>
    ${active.length?active.map(p => projectCard(p)).join(""):`<div class="card empty">Aucun projet actif.</div>`}
    ${archived.length?`<div class="section-head"><h2>Archivés</h2></div>${archived.map(p=>`
      <div class="card"><div class="project-card-header"><strong>${p.icon} ${esc(p.name)}</strong><button class="secondary" onclick="reactivateProject('${p.id}')">Réactiver</button></div></div>`).join("")}`:""}
  `;
}

function renderMonthly(){
  const list=state.projects.filter(p=>p.status !== "Archivé");
  $("monthlyList").innerHTML=list.length?list.map(p=>{
    const k = `${monthKey()}:${p.id}`, a=state.monthlyAssignments[k]||{amount:"",checked:false};
    return `
      <div class="card">
        <div class="check-card">
          <input type="checkbox" ${a.checked?"checked":""} onchange="toggleAssignment('${p.id}',this.checked)" />
          <div><strong>${p.icon} ${esc(p.name)}</strong><div class="muted">Trésorerie : ${Currency.format(ProjectService.getKPIs(p).treasury, p.currency)}</div></div>
          <div class="field"><input type="number" value="${a.amount||""}" placeholder="Montant ${p.currency}" onchange="setAssignmentAmount('${p.id}',this.value)" ${a.checked?'disabled':''}/></div>
        </div>
      </div>`;
  }).join(""):`<div class="card empty">Aucun projet actif.</div>`;
}

function toggleAssignment(projectId, checked){
  const p=state.projects.find(x=>x.id===projectId); if(!p)return;
  const key=`${monthKey()}:${projectId}`;
  state.monthlyAssignments[key] ||= {amount:0,checked:false,transactionId:null};
  const a=state.monthlyAssignments[key];
  if(checked){
    const amount=parseFloat(a.amount);
    if(!amount||amount<=0) return alert("Entrez un montant.");
    if(a.transactionId) return;
    const tx = TransactionService.add({
        projectId, type: TransactionService.TYPES.ALLOCATION,
        description: `Versement → ${p.name}`, amount, currency: p.currency, month: monthKey()
    });
    a.checked=true; a.transactionId=tx.id;
  }else{
    if(a.transactionId) TransactionService.delete(a.transactionId);
    a.checked=false; a.transactionId=null;
  }
  persist();
}

function setAssignmentAmount(projectId, value){
  const key=`${monthKey()}:${projectId}`;
  state.monthlyAssignments[key] ||= {amount:0,checked:false,transactionId:null};
  if(state.monthlyAssignments[key].checked) return;
  state.monthlyAssignments[key].amount=parseFloat(value)||0;
  saveState(state);
}

// --- Project Detail Logic ---

function openProject(id){
  activeProjectId=id;
  if(isLargeScreen()) navigate("projectsPage");
  else navigate("projectDetailPage");
  renderProjectDetail();
}

function renderProjectDetail(){
  const p=state.projects.find(p=>p.id===activeProjectId);
  const container = isLargeScreen() ? $("tabletDetailPane") : $("projectDetail");
  if(!p) { container.innerHTML = isLargeScreen() ? '<div class="empty-detail"><p>Sélectionnez un projet</p></div>' : ''; return; }

  const tabs = p.type === 'detailed' ? (PROJECT_TYPES[p.subType]?.tabs || ["summary", "expenses", "tasks"]) : [];
  if (p.customTabs) p.customTabs.forEach(ct => tabs.push(`custom_${ct.id}`));

  container.innerHTML = `
    <div class="detail-pane-content">
        ${UIModules.renderProjectHeader(p)}
        ${p.type === 'detailed' ? `
            <div class="detail-tabs">
                ${tabs.map((t, i) => `<button class="${i===0?'active':''}" onclick="switchDetailTab(this,'tab_${t}')">${TAB_CONFIG[t]?.label || (p.customTabs.find(c=>`custom_${c.id}`===t)?.name) || t}</button>`).join("")}
            </div>
            ${tabs.map((t, i) => `<div id="tab_${t}" class="op-pane ${i===0?'active':''}">
                ${renderTabRouter(p, t)}
            </div>`).join("")}
        ` : `<div class="card"><h2>Historique des versements</h2>${projectTransfers(p.id)}</div>`}
    </div>`;
}

function renderTabRouter(p, tabId) {
    const config = TAB_CONFIG[tabId];
    if (tabId === "summary") return `<div class="card"><h2>Versements reçus</h2>${projectTransfers(p.id)}</div>`;
    if (tabId === "expenses") return UIModules.renderExpensesModule(p);
    if (tabId === "materials") return UIModules.renderMaterialsModule(p);
    if (tabId === "workers") return UIModules.renderWorkersModule(p);
    if (tabId === "tasks") return UIModules.renderTasksModule(p);
    if (tabId === "custom_tabs_manager") return UIModules.renderCustomTabsManager(p);
    if (tabId.startsWith("custom_")) return UIModules.renderCustomTabModule(p, tabId.replace("custom_", ""));

    if (config && config.module === "generic") return UIModules.renderGenericModule(p, tabId);
    return `<div class="empty">Contenu disponible prochainement</div>`;
}

function addProjectExpense(projectId){
  const p=state.projects.find(x=>x.id===projectId);
  const amount = parseFloat($("detailExpenseAmount").value);
  if(!amount || amount<=0) return alert("Montant requis.");

  TransactionService.add({
    projectId,
    type: TransactionService.TYPES.EXPENSE,
    description: $("detailExpenseLabel").value.trim() || "Dépense projet",
    amount,
    currency: $("detailExpenseCurrency").value,
    category: $("detailExpenseCategory").value,
    sourceModule: 'expenses'
  });
  persist();
}

function addTask(projectId){
  const name=$("taskName").value.trim();
  if(!name) return alert("Nom de l'étape requis.");
  state.projectTasks.push({id:uid(),projectId,name,done:false});
  persist();
}

function addMaterial(projectId) { saveMaterial(projectId); }
function addWorker(projectId) { saveWorker(projectId); }

// Generic module data handlers
function saveGenericData(projectId, tabId) {
    const fields = TAB_CONFIG[tabId].fields;
    const vals = {};
    fields.forEach(f => { vals[f.id] = $(`data_${tabId}_${f.id}`).value; $(`data_${tabId}_${f.id}`).value = ""; });
    ProjectService.saveData(projectId, tabId, vals);
    persist();
}
function deleteGenericData(id) { if(confirm("Supprimer ?")) { state.projectData = state.projectData.filter(d=>d.id!==id); persist(); } }

// --- Helpers UI ---

function switchDetailTab(btn,id){
  document.querySelectorAll(".op-pane").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".detail-tabs button").forEach(b=>b.classList.remove("active"));
  $(id).classList.add("active"); btn.classList.add("active");
}
function projectTransfers(id){
  const rows=TransactionService.getByProject(id).filter(t=>t.type==='project_allocation');
  return rows.length?rows.map(t=>transactionRow(t)).join(""):`<div class="empty">Aucun versement.</div>`;
}
function projectExpenseRows(id){
    const rows = TransactionService.getByProject(id);
    return rows.length?rows.map(r=>transactionRow(r)).join(""):`<div class="empty">Aucune dépense.</div>`;
}
function materialsTable(id){ /* Deprecated or kept for compat */ return ""; }
function workersTable(id){ return ""; }
function tasksList(id){
  const rows=state.projectTasks.filter(t=>t.projectId===id);
  return rows.length?rows.map(t=>`
    <div class="task-row">
        <label><input type="checkbox" ${t.done?"checked":""} onchange="toggleTask('${t.id}','${id}')" /><span>${esc(t.name)}</span></label>
        <span class="badge">${t.done?"Terminé":"À faire"}</span>
    </div>`).join(""):`<div class="empty">Aucune étape.</div>`;
}
function toggleTask(id, pid){ const t=state.projectTasks.find(x=>x.id===id); if(t){t.done=!t.done; persist();} }

function navigate(pageId){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  $(pageId).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===pageId));
  const t={homePage:"Accueil",transactionsPage:"Transactions",projectsPage:"Projets",monthlyPage:"Ce mois",settingsPage:"Réglages",projectDetailPage:"Projet"};
  $("pageTitle").textContent=t[pageId]||"Budget & Projets";
  if($("sidePageTitle")) $("sidePageTitle").textContent=t[pageId];
  $("mainScroll").scrollTo({top:0,behavior:"smooth"});
}

function renderAll(){
  applyTheme(); applySettings();
  renderHome(); renderTransactions(); renderProjects(); renderMonthly();
  if(activeProjectId && ($("projectDetailPage").classList.contains("active") || ($("projectsPage").classList.contains("active") && isLargeScreen()))) renderProjectDetail();
}

window.addEventListener("resize", () => { if($("projectDetailPage").classList.contains("active") && isLargeScreen()) navigate("projectsPage"); renderAll(); });
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.nav)));
$("addTxBtn").addEventListener("click",addTransaction);
$("createProjectBtn").addEventListener("click",createProject);
$("txFilter").addEventListener("change",renderTransactions);
$("backProjectsBtn").addEventListener("click",()=>navigate("projectsPage"));
$("quickAddBtn").addEventListener("click",()=>navigate("transactionsPage"));
$("themeSelect").addEventListener("change",(e)=>{ state.theme=e.target.value; persist(); });
$("mainCurrencySelect").addEventListener("change",(e)=>{ state.mainCurrency=e.target.value; persist(); });
$("showArFmgToggle").addEventListener("change",(e)=>{ state.showArFmg=e.target.checked; persist(); });
$("rateEur").addEventListener("change",(e)=>{ state.rates.EUR=parseFloat(e.target.value)||5000; persist(); });
$("rateUsd").addEventListener("change",(e)=>{ state.rates.USD=parseFloat(e.target.value)||4500; persist(); });

function updateFmgHint(aId, cId, hId){
  const a = parseFloat($(aId).value), c = $(cId).value;
  if (!state.showArFmg || !a || (c !== 'MGA' && c !== 'FMG')) { $(hId).style.display = 'none'; return; }
  $(hId).textContent = `= ${c==='MGA'?Currency.format(Currency.arToFmg(a),'FMG'):Currency.format(Currency.fmgToAr(a),'MGA')}`;
  $(hId).style.display = 'block';
}
$("txAmount").addEventListener("input", ()=>updateFmgHint("txAmount", "txCurrency", "txFmgHint"));
$("txCurrency").addEventListener("change", ()=>updateFmgHint("txAmount", "txCurrency", "txFmgHint"));
document.addEventListener("input", (e) => { if (e.target.id === "detailExpenseAmount") updateFmgHint("detailExpenseAmount", "detailExpenseCurrency", "detailExpenseFmgHint"); });
document.addEventListener("change", (e) => { if (e.target.id === "detailExpenseCurrency") updateFmgHint("detailExpenseAmount", "detailExpenseCurrency", "detailExpenseFmgHint"); });

$("exportBtn").addEventListener("click",()=>exportState(state));
$("importInput").addEventListener("change",(e)=>{
  const f=e.target.files[0]; if(!f)return;
  importStateFile(f,(err,ns)=>{ if(err) return alert("Invalide."); state=ns; renderAll(); alert("Importé."); });
});
$("resetBtn").addEventListener("click",()=>resetState());

renderAll();

let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstallPrompt = e; if ($("installBtn")) $("installBtn").hidden = false; });
$("installBtn")?.addEventListener("click", async () => { if (!deferredInstallPrompt) return; deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; $("installBtn").hidden = true; });
window.addEventListener("appinstalled", () => { deferredInstallPrompt = null; if ($("installBtn")) $("installBtn").hidden = true; });
