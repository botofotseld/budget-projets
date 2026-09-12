
const STORAGE_KEY = "budgetProjetsV1_2";
const SCHEMA_VERSION = 3;

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
  projectEvents: [],
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
    let state = JSON.parse(raw);

    // --- Step-by-Step Migration ---

    // Migration V1/V2 to V3
    if (!state.schemaVersion || state.schemaVersion < 3) {
        // We use the MigrationService which must be loaded before app.js
        if (typeof MigrationService !== 'undefined') {
            state = MigrationService.migrateToV3(state);
        } else {
            console.error("MigrationService not found! Skipping migration, this might cause issues.");
        }
    }

    // Basic ensure logic (always run for safety)
    state = {...defaultState(), ...state};
    state.transactions = state.transactions.map(t => ({...t, currency: t.currency || 'EUR'}));
    state.projectData = state.projectData || [];
    state.projectEvents = state.projectEvents || [];

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
  if (confirm("ATTENTION : Cette action supprimera définitivement toutes vos données. Continuer ?")) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
  }
}
