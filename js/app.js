
let state = loadState();
let activeProjectId = null;

const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(Number(n)||0);
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2);
const esc = (s) => String(s ?? "")
  .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
  .replaceAll('"',"&quot;").replaceAll("'","&#039;");
const monthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
};
const monthLabel = () => new Intl.DateTimeFormat("fr-FR",{month:"long",year:"numeric"}).format(new Date());

function projectSaved(id){
  return state.transactions.filter(t=>t.type==="project"&&t.projectId===id).reduce((s,t)=>s+t.amount,0);
}
function projectSpent(id){
  return state.projectExpenses.filter(e=>e.projectId===id).reduce((s,e)=>s+e.amount,0);
}
function projectCash(id){ return projectSaved(id)-projectSpent(id); }
function availableBalance(){
  return state.transactions.reduce((b,t)=>{
    if(t.type==="income") b+=t.amount;
    if(t.type==="expense") b-=t.amount;
    if(t.type==="project") b-=t.amount;
    return b;
  },0);
}
function projectsBalance(){ return state.projects.reduce((s,p)=>s+projectCash(p.id),0); }
function totalAssets(){ return availableBalance()+projectsBalance(); }
function monthIncome(){
  return state.transactions.filter(t=>t.month===monthKey()&&t.type==="income").reduce((s,t)=>s+t.amount,0);
}
function monthExpenses(){
  const personal = state.transactions.filter(t=>t.month===monthKey()&&t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const project = state.projectExpenses.filter(e=>e.month===monthKey()).reduce((s,e)=>s+e.amount,0);
  return personal+project;
}
function persist(){ saveState(state); renderAll(); }

function addTransaction(){
  const type=$("txType").value;
  const description=$("txDescription").value.trim();
  const amount=parseFloat($("txAmount").value);
  if(!description || !amount || amount<=0) return alert("Renseigne une description et un montant valide.");
  state.transactions.push({id:uid(),type,description,amount,date:new Date().toISOString(),month:monthKey()});
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
  const type=$("projectType").value;
  if(!name || !target || target<=0) return alert("Renseigne un nom et un objectif financier valide.");
  state.projects.push({id:uid(),name,icon,target,type,status:"active",created:new Date().toISOString()});
  $("projectName").value=""; $("projectIcon").value=""; $("projectTarget").value="";
  persist();
}
function archiveProject(id){
  const p=state.projects.find(p=>p.id===id); if(!p) return;
  p.status="archived"; persist(); navigate("projectsPage");
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
    if(amount>availableBalance()) return alert("Solde disponible insuffisant.");
    if(a.transactionId) return;
    const txId=uid();
    state.transactions.push({
      id:txId,type:"project",description:`Versement → ${p.name}`,amount,
      projectId:p.id,date:new Date().toISOString(),month:monthKey()
    });
    a.checked=true; a.transactionId=txId;
  }else{
    if(a.transactionId) state.transactions=state.transactions.filter(t=>t.id!==a.transactionId);
    a.checked=false; a.transactionId=null;
  }
  persist();
}
function addProjectExpense(projectId){
  const label=$("detailExpenseLabel").value.trim();
  const amount=parseFloat($("detailExpenseAmount").value);
  const category=$("detailExpenseCategory").value;
  if(!label||!amount||amount<=0) return alert("Description et montant requis.");
  if(amount>projectCash(projectId)) return alert("Trésorerie du projet insuffisante.");
  state.projectExpenses.push({id:uid(),projectId,label,amount,category,date:new Date().toISOString(),month:monthKey()});
  persist(); openProject(projectId);
}
function addMaterial(projectId){
  const name=$("materialName").value.trim();
  const planned=parseFloat($("materialPlanned").value)||0;
  const bought=parseFloat($("materialBought").value)||0;
  if(!name) return alert("Nom du matériau requis.");
  state.projectMaterials.push({id:uid(),projectId,name,planned,bought});
  persist(); openProject(projectId);
}
function addWorker(projectId){
  const name=$("workerName").value.trim();
  const total=parseFloat($("workerTotal").value)||0;
  const paid=parseFloat($("workerPaid").value)||0;
  if(!name) return alert("Nom ou rôle requis.");
  state.projectWorkers.push({id:uid(),projectId,name,total,paid});
  persist(); openProject(projectId);
}
function addTask(projectId){
  const name=$("taskName").value.trim();
  if(!name) return alert("Nom de l'étape requis.");
  state.projectTasks.push({id:uid(),projectId,name,done:false});
  persist(); openProject(projectId);
}
function toggleTask(taskId, projectId){
  const t=state.projectTasks.find(x=>x.id===taskId); if(!t)return;
  t.done=!t.done; persist(); openProject(projectId);
}

function renderHome(){
  $("totalAssets").textContent=money(totalAssets());
  $("availableBalance").textContent=money(availableBalance());
  $("projectsBalance").textContent=money(projectsBalance());
  $("monthIncome").textContent=money(monthIncome());
  $("monthExpenses").textContent=money(monthExpenses());

  const projects=state.projects.filter(p=>p.status==="active").slice(0,3);
  $("homeProjects").innerHTML=projects.length?projects.map(projectCard).join(""):`<div class="card empty">Aucun projet actif.</div>`;

  const tx=[...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4);
  $("homeTransactions").innerHTML=tx.length?tx.map(transactionRow).join(""):`<div class="empty">Aucune transaction.</div>`;
}
function projectCard(p){
  const saved=projectSaved(p.id), pct=Math.min(100,(saved/p.target)*100), cash=projectCash(p.id);
  return `<article class="project-card" onclick="openProject('${p.id}')">
    <div class="project-card-header">
      <div><div class="project-name">${p.icon} ${esc(p.name)}</div><div class="muted">${p.type==="detailed"?"Projet détaillé":"Projet simple"}</div></div>
      <span class="badge">${Math.round(pct)} %</span>
    </div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <div class="project-meta"><span>${money(saved)} / ${money(p.target)}</span><span>Disponible projet : ${money(cash)}</span></div>
  </article>`;
}
function transactionRow(t){
  let cls="amount-expense", sign="-", label="Dépense";
  if(t.type==="income"){cls="amount-income";sign="+";label="Entrée"}
  if(t.type==="project"){cls="amount-project";sign="→";label="Projet"}
  return `<div class="tx"><div><strong>${esc(t.description)}</strong><small>${new Date(t.date).toLocaleDateString("fr-FR")} · ${label}</small></div><strong class="${cls}">${sign}${money(t.amount)}</strong></div>`;
}
function renderTransactions(){
  const filter=$("txFilter").value;
  let rows=[
    ...state.transactions.map(t=>({...t,displayType:t.type})),
    ...state.projectExpenses.map(e=>({id:e.id,displayType:"project_expense",description:e.label,amount:e.amount,date:e.date}))
  ].sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(filter!=="all") rows=rows.filter(r=>r.displayType===filter);

  $("transactionList").innerHTML=rows.length?rows.map(r=>{
    let cls="amount-expense",sign="-",label="Dépense";
    if(r.displayType==="income"){cls="amount-income";sign="+";label="Entrée"}
    if(r.displayType==="project"){cls="amount-project";sign="→";label="Versement projet"}
    if(r.displayType==="project_expense"){cls="amount-project-expense";sign="-";label="Dépense projet"}
    const del=["income","expense"].includes(r.displayType)?`<button class="link-btn" onclick="deleteTransaction('${r.id}')">Supprimer</button>`:"";
    return `<div class="tx"><div><strong>${esc(r.description)}</strong><small>${new Date(r.date).toLocaleDateString("fr-FR")} · ${label}</small>${del}</div><strong class="${cls}">${sign}${money(r.amount)}</strong></div>`;
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
        <div><strong>${p.icon} ${esc(p.name)}</strong><div class="muted">Affecté : ${money(projectSaved(p.id))} · Solde projet : ${money(projectCash(p.id))}</div></div>
        <div class="amount-box field"><input type="number" min="0" step="0.01" placeholder="Montant €" value="${a.amount||""}" ${a.checked?"disabled":""} onchange="setAssignmentAmount('${p.id}',this.value)" /></div>
      </div>
    </div>`;
  }).join(""):`<div class="card empty">Aucun projet actif.</div>`;
}

function openProject(id){
  activeProjectId=id;
  navigate("projectDetailPage");
  renderProjectDetail();
}
function renderProjectDetail(){
  const p=state.projects.find(p=>p.id===activeProjectId);
  if(!p){ $("projectDetail").innerHTML=""; return; }
  const saved=projectSaved(p.id), spent=projectSpent(p.id), cash=projectCash(p.id), pct=Math.min(100,(saved/p.target)*100);

  $("projectDetail").innerHTML=`
    <div class="card">
      <div class="project-card-header">
        <div><div class="project-name">${p.icon} ${esc(p.name)}</div><div class="muted">${p.type==="detailed"?"Projet détaillé / chantier":"Projet simple"}</div></div>
        <button class="danger" onclick="archiveProject('${p.id}')">Archiver</button>
      </div>
      <div class="kpi-grid" style="margin-top:14px">
        <div class="kpi"><span>Objectif</span><strong>${money(p.target)}</strong></div>
        <div class="kpi"><span>Affecté</span><strong>${money(saved)}</strong></div>
        <div class="kpi"><span>Dépensé</span><strong>${money(spent)}</strong></div>
        <div class="kpi"><span>Trésorerie projet</span><strong>${money(cash)}</strong></div>
      </div>
      <div class="progress"><div style="width:${pct}%"></div></div>
    </div>
    ${p.type==="detailed"?detailedProjectHtml(p):simpleProjectHtml(p)}
  `;
}
function simpleProjectHtml(p){
  return `<div class="card"><h2>Versements</h2>${projectTransfers(p.id)}</div>`;
}
function detailedProjectHtml(p){
  return `
    <div class="detail-tabs">
      <button class="active" onclick="switchDetailTab(this,'detailSummary')">Résumé</button>
      <button onclick="switchDetailTab(this,'detailExpenses')">Dépenses</button>
      <button onclick="switchDetailTab(this,'detailMaterials')">Matériaux</button>
      <button onclick="switchDetailTab(this,'detailWorkers')">Ouvriers</button>
      <button onclick="switchDetailTab(this,'detailTasks')">Avancement</button>
    </div>
    <div id="detailSummary" class="detail-pane active"><div class="card"><h2>Versements reçus</h2>${projectTransfers(p.id)}</div></div>
    <div id="detailExpenses" class="detail-pane">
      <div class="card form-card">
        <h2>Nouvelle dépense projet</h2>
        <div class="field"><label>Description</label><input id="detailExpenseLabel" placeholder="Ex : Achat bois" /></div>
        <div class="field"><label>Montant (€)</label><input id="detailExpenseAmount" type="number" min="0" step="0.01" /></div>
        <div class="field"><label>Catégorie</label><select id="detailExpenseCategory"><option>Matériaux</option><option>Ouvrier</option><option>Transport</option><option>Administration</option><option>Autre</option></select></div>
        <button class="primary full" onclick="addProjectExpense('${p.id}')">Ajouter la dépense</button>
      </div>
      <div class="card"><h2>Historique des dépenses</h2>${projectExpenseRows(p.id)}</div>
    </div>
    <div id="detailMaterials" class="detail-pane">
      <div class="card form-card">
        <h2>Matériaux</h2>
        <div class="field"><label>Nom</label><input id="materialName" placeholder="Ex : Planche" /></div>
        <div class="two-cols"><div class="field"><label>Prévu</label><input id="materialPlanned" type="number" /></div><div class="field"><label>Acheté</label><input id="materialBought" type="number" /></div></div>
        <button class="primary full" onclick="addMaterial('${p.id}')">Ajouter</button>
      </div>
      <div class="card">${materialsTable(p.id)}</div>
    </div>
    <div id="detailWorkers" class="detail-pane">
      <div class="card form-card">
        <h2>Ouvriers</h2>
        <div class="field"><label>Nom / rôle</label><input id="workerName" placeholder="Ex : Maçon" /></div>
        <div class="two-cols"><div class="field"><label>Convenu (€)</label><input id="workerTotal" type="number" /></div><div class="field"><label>Payé (€)</label><input id="workerPaid" type="number" /></div></div>
        <button class="primary full" onclick="addWorker('${p.id}')">Ajouter</button>
      </div>
      <div class="card">${workersTable(p.id)}</div>
    </div>
    <div id="detailTasks" class="detail-pane">
      <div class="card form-card">
        <h2>Étapes du projet</h2>
        <div class="field"><label>Nouvelle étape</label><input id="taskName" placeholder="Ex : Toiture terminée" /></div>
        <button class="primary full" onclick="addTask('${p.id}')">Ajouter</button>
      </div>
      <div class="card">${tasksList(p.id)}</div>
    </div>`;
}
function switchDetailTab(btn,id){
  document.querySelectorAll(".detail-pane").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".detail-tabs button").forEach(b=>b.classList.remove("active"));
  $(id).classList.add("active"); btn.classList.add("active");
}
function projectTransfers(id){
  const rows=state.transactions.filter(t=>t.type==="project"&&t.projectId===id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  return rows.length?rows.map(transactionRow).join(""):`<div class="empty">Aucun versement.</div>`;
}
function projectExpenseRows(id){
  const rows=state.projectExpenses.filter(e=>e.projectId===id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  return rows.length?rows.map(e=>`<div class="tx"><div><strong>${esc(e.label)}</strong><small>${esc(e.category)} · ${new Date(e.date).toLocaleDateString("fr-FR")}</small></div><strong class="amount-project-expense">-${money(e.amount)}</strong></div>`).join(""):`<div class="empty">Aucune dépense projet.</div>`;
}
function materialsTable(id){
  const rows=state.projectMaterials.filter(m=>m.projectId===id);
  if(!rows.length) return `<div class="empty">Aucun matériau.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Matériau</th><th>Prévu</th><th>Acheté</th><th>Reste</th></tr></thead><tbody>${rows.map(m=>`<tr><td>${esc(m.name)}</td><td>${m.planned}</td><td>${m.bought}</td><td>${Math.max(0,m.planned-m.bought)}</td></tr>`).join("")}</tbody></table></div>`;
}
function workersTable(id){
  const rows=state.projectWorkers.filter(w=>w.projectId===id);
  if(!rows.length) return `<div class="empty">Aucun ouvrier.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Ouvrier</th><th>Convenu</th><th>Payé</th><th>Reste</th></tr></thead><tbody>${rows.map(w=>`<tr><td>${esc(w.name)}</td><td>${money(w.total)}</td><td>${money(w.paid)}</td><td>${money(Math.max(0,w.total-w.paid))}</td></tr>`).join("")}</tbody></table></div>`;
}
function tasksList(id){
  const rows=state.projectTasks.filter(t=>t.projectId===id);
  return rows.length?rows.map(t=>`<div class="task-row"><label><input type="checkbox" ${t.done?"checked":""} onchange="toggleTask('${t.id}','${id}')" /><span style="${t.done?"text-decoration:line-through;opacity:.6":""}">${esc(t.name)}</span></label><span class="badge">${t.done?"Terminé":"À faire"}</span></div>`).join(""):`<div class="empty">Aucune étape.</div>`;
}

function navigate(pageId){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  $(pageId).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===pageId));
  const titles={homePage:"Accueil",transactionsPage:"Transactions",projectsPage:"Projets",monthlyPage:"Ce mois",settingsPage:"Réglages",projectDetailPage:"Projet"};
  $("pageTitle").textContent=titles[pageId]||"Budget & Projets";
  window.scrollTo({top:0,behavior:"smooth"});
}
function renderAll(){
  renderHome(); renderTransactions(); renderProjects(); renderMonthly();
  if(activeProjectId && $("projectDetailPage").classList.contains("active")) renderProjectDetail();
}

document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.nav)));
$("addTxBtn").addEventListener("click",addTransaction);
$("createProjectBtn").addEventListener("click",createProject);
$("txFilter").addEventListener("change",renderTransactions);
$("backProjectsBtn").addEventListener("click",()=>navigate("projectsPage"));
$("quickAddBtn").addEventListener("click",()=>navigate("transactionsPage"));
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
  const btn = document.getElementById("installBtn");
  if (btn) btn.hidden = false;
});

document.getElementById("installBtn")?.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById("installBtn").hidden = true;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  const btn = document.getElementById("installBtn");
  if (btn) btn.hidden = true;
});
