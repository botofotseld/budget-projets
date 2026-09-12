
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

// --- Configuration Centrale ---

const STATUSES = ["À préparer", "En cours", "En pause", "Terminé", "Archivé"];

const PROJECT_TYPES = {
  house: {
    group: "Habitat & Immobilier", label: "Maison", icon: "🏠",
    tabs: ["summary", "expenses", "materials", "workers", "tasks"]
  },
  land: {
    group: "Habitat & Immobilier", label: "Terrain", icon: "🌳",
    tabs: ["summary", "land_info", "fees", "workers", "documents", "tasks"]
  },
  car: {
    group: "Mobilité", label: "Voiture", icon: "🚗",
    tabs: ["summary", "car_info", "buy_finance", "maintenance", "documents", "tasks"]
  },
  travel: {
    group: "Voyages", label: "Voyage", icon: "✈️",
    tabs: ["summary", "itinerary", "transport", "lodging", "expenses", "documents"]
  },
  studies: {
    group: "Études & Formation", label: "Études", icon: "🎓",
    tabs: ["summary", "formation", "enrollment", "fees", "modules", "materials", "tasks"]
  },
  business: {
    group: "Entreprise & Commerce", label: "Entreprise", icon: "💼",
    tabs: ["summary", "activity", "capital", "team", "expenses", "documents", "tasks"]
  },
  commerce: {
    group: "Entreprise & Commerce", label: "Commerce", icon: "🛒",
    tabs: ["summary", "stock", "suppliers", "sales", "expenses", "cash_flow"]
  },
  wedding: {
    group: "Vie personnelle & familiale", label: "Mariage", icon: "💍",
    tabs: ["summary", "budget_detail", "vendors", "guests", "expenses", "tasks"]
  },
  computer: {
    group: "Équipement & Achats", label: "Achat Ordinateur", icon: "💻",
    tabs: ["summary", "criteria", "comparison", "budget_detail", "buy_info", "accessories"]
  },
  saving: {
    group: "Épargne & Investissement", label: "Épargne", icon: "💰",
    tabs: ["summary", "savings_goal", "transfers", "withdrawals", "tasks"]
  },
  invest: {
    group: "Épargne & Investissement", label: "Investissement", icon: "📈",
    tabs: ["summary", "capital", "income_stream", "fees", "performance", "documents"]
  },
  family: {
    group: "Vie personnelle & familiale", label: "Projet Familial", icon: "👪",
    tabs: ["summary", "budget_detail", "participants", "expenses", "tasks", "tasks"]
  },
  professional: {
    group: "Travail & Carrière", label: "Projet Professionnel", icon: "🛠️",
    tabs: ["summary", "deliverables", "budget_detail", "team", "tasks", "documents"]
  },
  custom: {
    group: "Personnalisé", label: "Autre projet personnalisé", icon: "⚙️",
    tabs: ["summary", "custom_tabs_manager"]
  }
};

const TAB_CONFIG = {
  summary: { label: "Résumé", module: "summary" },
  expenses: { label: "Dépenses", module: "expenses" },
  materials: { label: "Matériaux", module: "materials" },
  workers: { label: "Intervenants", module: "workers" },
  tasks: { label: "Avancement", module: "tasks" },
  land_info: { label: "Parcelle", module: "generic", fields: [
    { id: 'surface', label: 'Surface', placeholder: 'Ex: 500m²' },
    { id: 'location', label: 'Localisation' },
    { id: 'parcel', label: 'N° Parcelle' },
    { id: 'title', label: 'Statut Titre' }
  ]},
  documents: { label: "Documents", module: "generic", fields: [
    { id: 'name', label: 'Nom du document' },
    { id: 'status', label: 'Statut' }
  ]},
  fees: { label: "Frais", module: "generic", fields: [
    { id: 'label', label: 'Nature' },
    { id: 'amount', label: 'Montant', type: 'number' }
  ]},
  car_info: { label: "Véhicule", module: "generic", fields: [
    { id: 'brand', label: 'Marque/Modèle' },
    { id: 'year', label: 'Année', type: 'number' },
    { id: 'km', label: 'Kilométrage', type: 'number' }
  ]},
  buy_finance: { label: "Achat", module: "generic", fields: [
    { id: 'price', label: 'Prix achat', type: 'number' },
    { id: 'source', label: 'Financement' }
  ]},
  maintenance: { label: "Entretien", module: "generic", fields: [
    { id: 'date', label: 'Date', type: 'date' },
    { id: 'label', label: 'Opération' },
    { id: 'cost', label: 'Coût', type: 'number' }
  ]},
  itinerary: { label: "Itinéraire", module: "generic", fields: [
    { id: 'step', label: 'Étape' },
    { id: 'date', label: 'Date', type: 'date' }
  ]},
  transport: { label: "Transport", module: "generic", fields: [
    { id: 'mode', label: 'Moyen' },
    { id: 'ref', label: 'Réf/Vol' },
    { id: 'cost', label: 'Prix', type: 'number' }
  ]},
  lodging: { label: "Hébergement", module: "generic", fields: [
    { id: 'name', label: 'Lieu' },
    { id: 'cost', label: 'Prix total', type: 'number' }
  ]},
  formation: { label: "Formation", module: "generic", fields: [
    { id: 'school', label: 'Établissement' },
    { id: 'title', label: 'Diplôme/Cours' }
  ]},
  enrollment: { label: "Inscriptions", module: "generic", fields: [
    { id: 'label', label: 'Frais/Echéance' },
    { id: 'amount', label: 'Montant', type: 'number' }
  ]},
  modules: { label: "Cours", module: "generic", fields: [
    { id: 'name', label: 'Module' },
    { id: 'status', label: 'Statut' }
  ]},
  activity: { label: "Activité", module: "generic", fields: [
    { id: 'goal', label: 'Objectif' },
    { id: 'kpi', label: 'Indicateur clé' }
  ]},
  capital: { label: "Capital", module: "generic", fields: [
    { id: 'source', label: 'Source' },
    { id: 'amount', label: 'Montant investi', type: 'number' }
  ]},
  team: { label: "Équipe", module: "generic", fields: [
    { id: 'name', label: 'Nom' },
    { id: 'role', label: 'Rôle' }
  ]},
  stock: { label: "Stock", module: "generic", fields: [
    { id: 'item', label: 'Article' },
    { id: 'qty', label: 'Quantité', type: 'number' },
    { id: 'buy', label: 'Prix achat', type: 'number' },
    { id: 'sell', label: 'Prix vente', type: 'number' }
  ]},
  suppliers: { label: "Fournisseurs", module: "generic", fields: [
    { id: 'name', label: 'Nom' },
    { id: 'contact', label: 'Contact' }
  ]},
  sales: { label: "Ventes", module: "generic", fields: [
    { id: 'date', label: 'Date', type: 'date' },
    { id: 'amount', label: 'Montant HT', type: 'number' }
  ]},
  cash_flow: { label: "Trésorerie", module: "summary" },
  budget_detail: { label: "Budget", module: "generic", fields: [
    { id: 'label', label: 'Poste' },
    { id: 'planned', label: 'Prévu', type: 'number' }
  ]},
  vendors: { label: "Prestataires", module: "generic", fields: [
    { id: 'name', label: 'Nom' },
    { id: 'service', label: 'Service' },
    { id: 'cost', label: 'Prix', type: 'number' }
  ]},
  guests: { label: "Invités", module: "generic", fields: [
    { id: 'name', label: 'Nom' },
    { id: 'confirmation', label: 'Statut' }
  ]},
  criteria: { label: "Critères", module: "generic", fields: [
    { id: 'spec', label: 'Besoin/Spécification' }
  ]},
  comparison: { label: "Comparatif", module: "generic", fields: [
    { id: 'model', label: 'Modèle' },
    { id: 'price', label: 'Prix', type: 'number' }
  ]},
  buy_info: { label: "Achat", module: "generic", fields: [
    { id: 'store', label: 'Vendeur' },
    { id: 'amount', label: 'Prix payé', type: 'number' }
  ]},
  accessories: { label: "Accessoires", module: "generic", fields: [
    { id: 'item', label: 'Article' },
    { id: 'warranty', label: 'Garantie' }
  ]},
  savings_goal: { label: "Objectif", module: "generic", fields: [
    { id: 'target', label: 'Cible', type: 'number' },
    { id: 'date', label: 'Échéance', type: 'date' }
  ]},
  transfers: { label: "Versements", module: "summary" },
  withdrawals: { label: "Retraits", module: "generic", fields: [
    { id: 'date', label: 'Date', type: 'date' },
    { id: 'amount', label: 'Montant', type: 'number' }
  ]},
  participants: { label: "Participants", module: "generic", fields: [
    { id: 'name', label: 'Nom' }
  ]},
  deliverables: { label: "Livrables", module: "generic", fields: [
    { id: 'name', label: 'Nom du livrable' },
    { id: 'status', label: 'Statut' }
  ]},
  income_stream: { label: "Revenus", module: "generic", fields: [
    { id: 'source', label: 'Actif' },
    { id: 'amount', label: 'Revenu reçu', type: 'number' }
  ]},
  performance: { label: "Performance", module: "generic", fields: [
    { id: 'roi', label: 'Rendement attendu %' },
    { id: 'val', label: 'Valeur actuelle', type: 'number' }
  ]},
  custom_tabs_manager: { label: "Personnaliser", module: "custom_manager" }
};

const TAB_LIBRARY = ["summary", "budget_detail", "expenses", "materials", "workers", "tasks", "documents", "participants", "stock", "suppliers", "sales", "income_stream", "fees"];

// --- Fonctions Financières (Inchangées sur le fond, vocabulaire mis à jour) ---

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

// --- Gestion des Actions ---

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
  const subType=$("projectType").value;

  if(!name || !target || target<=0) return alert("Renseigne un nom et un objectif financier valide.");

  const type = subType === "simple" ? "simple" : "detailed";

  state.projects.push({
    id:uid(), name, icon, target, currency, type, subType,
    status: "En cours", created:new Date().toISOString(),
    customTabs: []
  });
  $("projectName").value=""; $("projectIcon").value=""; $("projectTarget").value="";
  persist();
}

function updateProjectStatus(projectId, status) {
  const p = state.projects.find(x => x.id === projectId);
  if (p) {
    p.status = status;
    persist();
  }
}

function archiveProject(id){
  const p=state.projects.find(p=>p.id===id); if(!p) return;
  p.status="Archivé"; persist();
  if (!isLargeScreen()) navigate("projectsPage");
  else renderProjectDetail();
}

function reactivateProject(id){
  const p=state.projects.find(p=>p.id===id); if(!p) return;
  p.status="En cours"; persist();
}

// --- Rendu UI ---

function renderHome(){
  $("totalAssets").textContent=Currency.format(totalAssets(), state.mainCurrency);
  $("availableBalance").textContent=Currency.format(availableBalance(), state.mainCurrency);
  $("projectsBalance").textContent=Currency.format(projectsBalance(), state.mainCurrency);
  $("monthIncome").textContent=Currency.format(monthIncome(), state.mainCurrency);
  $("monthExpenses").textContent=Currency.format(monthExpenses(), state.mainCurrency);

  const active=state.projects.filter(p=>p.status !== "Archivé").slice(0,3);
  $("homeProjects").innerHTML=active.length?active.map(projectCard).join(""):`<div class="card empty">Aucun projet actif.</div>`;

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
      <div><div class="project-name">${p.icon} ${esc(p.name)}</div><div class="muted">${PROJECT_TYPES[p.subType]?.label || 'Projet'} · ${p.status}</div></div>
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
  const active=state.projects.filter(p=>p.status !== "Archivé");
  const archived=state.projects.filter(p=>p.status === "Archivé");
  $("projectsList").innerHTML = `
    <div class="section-head"><h2>Projets actifs</h2></div>
    ${active.length?active.map(projectCard).join(""):`<div class="card empty">Aucun projet actif.</div>`}
    ${archived.length?`<div class="section-head"><h2>Archivés</h2></div>${archived.map(p=>`
      <div class="card"><div class="project-card-header"><strong>${p.icon} ${esc(p.name)}</strong><button class="secondary" onclick="reactivateProject('${p.id}')">Réactiver</button></div></div>`).join("")}`:""}
  `;
}

function renderMonthly(){
  $("monthLabel").textContent=`📅 ${monthLabel()}`;
  const list=state.projects.filter(p=>p.status !== "Archivé");
  $("monthlyList").innerHTML=list.length?list.map(p=>{
    const key=assignmentKey(p.id), a=state.monthlyAssignments[key]||{amount:"",checked:false};
    return `<div class="card">
      <div class="check-card">
        <input type="checkbox" ${a.checked?"checked":""} onchange="toggleAssignment('${p.id}',this.checked)" />
        <div><strong>${p.icon} ${esc(p.name)}</strong><div class="muted">${Currency.format(projectSaved(p.id, p.currency), p.currency)} · Trésorerie : ${Currency.format(projectCash(p.id, p.currency), p.currency)}</div></div>
        <div class="field"><input type="number" min="0" step="0.01" placeholder="Montant ${p.currency}" value="${a.amount||""}" ${a.checked?"disabled":""} onchange="setAssignmentAmount('${p.id}',this.value)" /></div>
      </div>
    </div>`;
  }).join(""):`<div class="card empty">Aucun projet actif.</div>`;
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

  const saved=projectSaved(p.id, p.currency), spent=projectSpent(p.id, p.currency), cash=projectCash(p.id, p.currency), pct=Math.round(Math.min(100,(saved/p.target)*100));
  const tabs = p.type === 'detailed' ? (PROJECT_TYPES[p.subType]?.tabs || ["summary", "expenses", "tasks"]) : [];
  if (p.customTabs) p.customTabs.forEach(ct => tabs.push(`custom_${ct.id}`));

  container.innerHTML=`
    <div class="detail-pane-content">
      <div class="card project-header-card">
        <div class="project-card-header">
          <div>
            <div class="project-name" style="font-size: 22px;">${p.icon} ${esc(p.name)}</div>
            <select class="status-select" onchange="updateProjectStatus('${p.id}', this.value)">
                ${STATUSES.map(s => `<option value="${s}" ${p.status === s ? 'selected' : ''}>${s}</option>`).join("")}
            </select>
          </div>
          <button class="danger" onclick="archiveProject('${p.id}')">Archiver</button>
        </div>

        <div class="kpi-grid" style="margin-top:20px">
          <div class="kpi"><span>Objectif</span><strong>${Currency.format(p.target, p.currency)}</strong></div>
          <div class="kpi"><span>Affecté</span><strong>${Currency.format(saved, p.currency)}</strong></div>
          <div class="kpi"><span>Dépensé</span><strong>${Currency.format(spent, p.currency)}</strong></div>
          <div class="kpi"><span>Trésorerie</span><strong class="${cash < 0 ? 'danger' : ''}">${Currency.format(cash, p.currency)}</strong></div>
        </div>

        <div class="progress" style="height: 12px; margin-top: 18px;"><div style="width:${pct}%"></div></div>
        <div class="muted" style="text-align: right; font-size: 13px; font-weight: 700; margin-top: 6px;">Progression : ${pct}%</div>
      </div>

      ${p.type === 'detailed' ? `
        <div class="detail-tabs">
          ${tabs.map((t, idx) => {
            const label = t.startsWith("custom_") ? (p.customTabs.find(ct => `custom_${ct.id}` === t)?.name || "Onglet") : (TAB_CONFIG[t]?.label || t);
            return `<button class="${idx === 0 ? 'active' : ''}" onclick="switchDetailTab(this,'tab_${t}')">${label}</button>`;
          }).join("")}
        </div>
        ${tabs.map((t, idx) => `
          <div id="tab_${t}" class="op-pane ${idx === 0 ? 'active' : ''}">
            ${renderTabContent(p, t)}
          </div>
        `).join("")}
      ` : `<div class="card"><h2>Versements reçus</h2>${projectTransfers(p.id)}</div>`}
    </div>
  `;
}

function renderTabContent(p, tabId) {
    const config = TAB_CONFIG[tabId];
    if (tabId === "summary") return `<div class="card"><h2>Versements reçus</h2>${projectTransfers(p.id)}</div>`;
    if (tabId === "expenses") return renderExpensesModule(p);
    if (tabId === "materials") return renderMaterialsModule(p);
    if (tabId === "workers") return renderWorkersModule(p);
    if (tabId === "tasks") return renderTasksModule(p);
    if (tabId === "custom_tabs_manager") return renderCustomTabsManager(p);
    if (tabId.startsWith("custom_")) return renderCustomTabModule(p, tabId.replace("custom_", ""));

    if (config && config.module === "generic") return renderGenericDataModule(p, tabId, config.fields);
    return `<div class="empty">Contenu bientôt disponible pour ${tabId}</div>`;
}

// --- Modules Réutilisables ---

function renderExpensesModule(p) {
    return `
      <div class="card form-card">
        <h2>Nouvelle dépense</h2>
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

function renderMaterialsModule(p) {
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

function renderWorkersModule(p) {
    return `
      <div class="card form-card">
        <h2>Intervenants / Équipe</h2>
        <div class="field"><label>Nom / rôle</label><input id="workerName" placeholder="Ex : Maçon" /></div>
        <div class="two-cols"><div class="field"><label>Convenu (${p.currency})</label><input id="workerTotal" type="number" /></div><div class="field"><label>Payé (${p.currency})</label><input id="workerPaid" type="number" /></div></div>
        <button class="primary full" onclick="addWorker('${p.id}')">Ajouter</button>
      </div>
      <div class="card">${workersTable(p.id)}</div>
    `;
}

function renderTasksModule(p) {
    return `
      <div class="card form-card">
        <h2>Avancement / Étapes</h2>
        <div class="field"><label>Nouvelle étape</label><input id="taskName" placeholder="Ex : Toiture terminée" /></div>
        <button class="primary full" onclick="addTask('${p.id}')">Ajouter</button>
      </div>
      <div class="card">${tasksList(p.id)}</div>
    `;
}

function renderGenericDataModule(p, tabId, fields) {
    const data = state.projectData.filter(d => d.projectId === p.id && d.tabId === tabId);
    return `
        <div class="card form-card">
            <h2>${TAB_CONFIG[tabId].label}</h2>
            ${fields.map(f => `
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
                    <thead><tr>${fields.map(f => `<th>${f.label}</th>`).join("")}<th></th></tr></thead>
                    <tbody>
                        ${data.map(d => `
                            <tr>
                                ${fields.map(f => `<td>${esc(d.values[f.id])}</td>`).join("")}
                                <td><button class="link-btn danger" onclick="deleteGenericData('${d.id}')">X</button></td>
                            </tr>
                        `).join("")}
                        ${!data.length ? `<tr><td colspan="${fields.length + 1}" class="empty">Aucune donnée</td></tr>` : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderCustomTabModule(p, tabId) {
    const data = state.projectData.filter(d => d.projectId === p.id && d.tabId === `custom_${tabId}`);
    return `
        <div class="card form-card">
            <h2>Ajouter un élément</h2>
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
                            <tr><td>${esc(d.values.desc)}</td><td>${esc(d.values.val)}</td><td><button class="link-btn danger" onclick="deleteGenericData('${d.id}')">X</button></td></tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderCustomTabsManager(p) {
    return `
        <div class="card form-card">
            <h2>Bibliothèque de sous-groupes</h2>
            <div class="field">
                <label>Choisir un modèle</label>
                <select id="libTabSelect">
                    ${TAB_LIBRARY.map(t => `<option value="${t}">${TAB_CONFIG[t]?.label || t}</option>`).join("")}
                </select>
            </div>
            <button class="secondary full" onclick="addLibraryTab('${p.id}')">Ajouter ce sous-groupe</button>
            <div style="margin: 20px 0; border-top: 1px solid var(--border); padding-top: 20px;">
                <div class="field">
                    <label>Ou créer un nom personnalisé</label>
                    <input id="newTabName" placeholder="Ex: Risques" />
                </div>
                <button class="primary full" onclick="addCustomTab('${p.id}')">Créer un nouveau sous-groupe</button>
            </div>
        </div>
        <div class="card">
            <h2>Mes sous-groupes</h2>
            ${p.customTabs?.map(t => `
                <div class="task-row">
                    <span>${esc(t.name)}</span>
                    <button class="link-btn danger" onclick="deleteCustomTab('${p.id}', '${t.id}')">Supprimer</button>
                </div>
            `).join("") || '<div class="empty">Aucun sous-groupe ajouté</div>'}
        </div>
    `;
}

// --- Logique Métier Additionnelle ---

function addLibraryTab(projectId) {
    const tabId = $("libTabSelect").value;
    const p = state.projects.find(x => x.id === projectId);
    const existing = PROJECT_TYPES[p.subType]?.tabs || [];
    if (existing.includes(tabId)) return alert("Ce sous-groupe fait déjà partie du modèle de base.");

    addCustomTab(projectId, TAB_CONFIG[tabId].label, tabId);
}

function addCustomTab(projectId, nameOverride = null, refId = null) {
    const name = nameOverride || $("newTabName").value.trim();
    if (!name) return alert("Nom requis");
    const p = state.projects.find(x => x.id === projectId);
    p.customTabs = p.customTabs || [];
    p.customTabs.push({ id: refId || uid(), name });
    if ($("newTabName")) $("newTabName").value = "";
    persist();
}

function deleteCustomTab(projectId, tabId) {
    if(confirm("Supprimer ce sous-groupe et toutes ses données ?")) {
        const p = state.projects.find(x => x.id === projectId);
        p.customTabs = p.customTabs.filter(t => t.id !== tabId);
        state.projectData = state.projectData.filter(d => d.projectId === projectId && d.tabId === `custom_${tabId}`);
        persist();
    }
}

function saveGenericData(projectId, tabId) {
    const fields = TAB_CONFIG[tabId].fields;
    const values = {};
    fields.forEach(f => {
        values[f.id] = $(`data_${tabId}_${f.id}`).value;
        $(`data_${tabId}_${f.id}`).value = "";
    });
    state.projectData.push({ id: uid(), projectId, tabId, values });
    persist();
}

function deleteGenericData(id) {
    if(confirm("Supprimer cette ligne ?")) {
        state.projectData = state.projectData.filter(d => d.id !== id);
        persist();
    }
}

function saveCustomData(projectId, tabId) {
    const desc = $(`custom_desc_${tabId}`).value;
    const val = $(`custom_val_${tabId}`).value;
    state.projectData.push({ id: uid(), projectId, tabId: `custom_${tabId}`, values: { desc, val } });
    $(`custom_desc_${tabId}`).value = "";
    $(`custom_val_${tabId}`).value = "";
    persist();
}

// --- Helpers Rendu ---

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
  if(!rows.length) return `<div class="empty">Aucun intervenant.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Intervenant</th><th>Convenu</th><th>Payé</th><th>Reste</th></tr></thead><tbody>${rows.map(w=>`<tr><td>${esc(w.name)}</td><td>${Currency.format(w.total, p.currency)}</td><td>${Currency.format(w.paid, p.currency)}</td><td>${Currency.format(Math.max(0,w.total-w.paid), p.currency)}</td></tr>`).join("")}</tbody></table></div>`;
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

window.addEventListener("resize", () => {
  const isProjDetail = $("projectDetailPage").classList.contains("active");
  if(isProjDetail && isLargeScreen()) navigate("projectsPage");
  renderAll();
});

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
