
const STORAGE_KEY = "budgetProjetsV1_2";

const defaultState = () => ({
  transactions: [],
  projects: [],
  monthlyAssignments: {},
  projectExpenses: [],
  projectMaterials: [],
  projectWorkers: [],
  projectTasks: []
});

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return defaultState();
  try{
    const parsed = JSON.parse(raw);
    return {...defaultState(), ...parsed};
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
