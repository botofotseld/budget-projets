
/**
 * Global Application State
 */
let state = StorageService.load();
let activeProjectId = null;

/**
 * Persistence wrapper
 */
function persist() {
    StorageService.save(state);
    renderAll();
}

/**
 * Global helpers moved from app.js if they are state-related
 */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const esc = (s) => String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const monthKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const monthLabel = () => new Intl.DateTimeFormat("fr-FR",{month:"long",year:"numeric"}).format(new Date());

function applyTheme(){
    const theme = state.theme || 'system';
    if(theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    if(document.getElementById("themeSelect")) document.getElementById("themeSelect").value = theme;
}

function applySettings(){
    if(document.getElementById("mainCurrencySelect")) document.getElementById("mainCurrencySelect").value = state.mainCurrency;
    if(document.getElementById("showArFmgToggle")) document.getElementById("showArFmgToggle").checked = state.showArFmg;
    if(document.getElementById("rateEur")) document.getElementById("rateEur").value = state.rates.EUR;
    if(document.getElementById("rateUsd")) document.getElementById("rateUsd").value = state.rates.USD;
}
