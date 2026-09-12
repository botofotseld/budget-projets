
const STORAGE_KEY = "budgetProjetsV1_2";
const SCHEMA_VERSION = 2;

const defaultState = () => ({
  schemaVersion: SCHEMA_VERSION,
  transactions: [],
  projects: [],
  monthlyAssignments: {},
  projectExpenses: [],
  projectMaterials: [],
  projectWorkers: [],
  projectTasks: [],
  projectData: [],
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

    // --- Migration Logic ---

    if (!state.schemaVersion || state.schemaVersion < 2) {
      console.log("Migrating state to version 2...");

      // 1. Harmonize Statuses
      const statusMap = {
        'active': 'En cours',
        'archived': 'Archivé',
        'En cours': 'En cours',
        'Archivé': 'Archivé'
      };

      // 2. Harmonize Groups & SubTypes
      state.projects = state.projects.map(p => {
        let updated = {...p};
        updated.status = statusMap[p.status] || 'En cours';

        // If it was a generic 'detailed' project (old 'house'), ensure subType is set
        if (updated.type === 'detailed' && !updated.subType) {
          updated.subType = 'house';
        }
        if (updated.type === 'simple') updated.subType = 'simple';

        updated.customTabs = updated.customTabs || [];
        return updated;
      });

      state.schemaVersion = 2;
      saveState(state);
    }

    // Ensure currency exists for all items
    state.transactions = state.transactions.map(t => ({...t, currency: t.currency || 'EUR'}));
    state.projectExpenses = state.projectExpenses.map(e => ({...e, currency: e.currency || 'EUR'}));
    state.projectData = state.projectData || [];

    return state;
  }catch(e){
    console.error("Failed to load state", e);
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
  a.download = `budget-projets-backup-v${state.schemaVersion || 1}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importStateFile(file, callback){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result);
      // Logic for import could be improved with version check
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
