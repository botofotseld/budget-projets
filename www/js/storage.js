
const STORAGE_KEY = "budgetProjetsV1_2";

const defaultState = () => ({
  transactions: [],
  projects: [],
  monthlyAssignments: {},
  projectExpenses: [],
  projectMaterials: [],
  projectWorkers: [],
  projectTasks: [],
  projectData: [], // New: generic data store for specific project fields
  theme: "system",
  mainCurrency: "EUR",
  showArFmg: true,
  rates: {
    EUR: 5200,
    USD: 4700
  }
});

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return defaultState();
  try{
    const parsed = JSON.parse(raw);
    let state = {...defaultState(), ...parsed};

    // Migration: ensure currency is set for old items
    state.transactions = state.transactions.map(t => ({...t, currency: t.currency || 'EUR'}));
    state.projects = state.projects.map(p => {
        let updated = {...p, currency: p.currency || 'EUR'};
        // Migrate old 'detailed' projects to 'house' subtype if not already set
        if (updated.type === 'detailed' && !updated.subType) {
            updated.subType = 'house';
        }
        return updated;
    });
    state.projectExpenses = state.projectExpenses.map(e => ({...e, currency: e.currency || 'EUR'}));
    state.projectData = state.projectData || [];

    return state;
  }catch{
    return defaultState();
  }
}

function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function exportState(state){
  const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "budget-projets-sauvegarde.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importStateFile(file, callback){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result);
      const normalized = {...defaultState(), ...parsed};
      saveState(normalized);
      callback(null, normalized);
    }catch(e){
      callback(e);
    }
  };
  reader.readAsText(file);
}

function resetState(){
  localStorage.removeItem(STORAGE_KEY);
}
