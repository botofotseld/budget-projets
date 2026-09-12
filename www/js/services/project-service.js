
/**
 * ProjectService - Handles complex project-level calculations and states
 */
const ProjectService = {
    /**
     * Standard statuses for all project types
     */
    STATUSES: ["À préparer", "En cours", "En pause", "Terminé", "Archivé"],

    /**
     * Calculate all KPIs for a project
     */
    getKPIs(p) {
        const allocated = projectSaved(p.id, p.currency); // Still uses app.js helper for now
        const spent = TransactionService.getSpent(p.id, p.currency);
        const revenue = TransactionService.getRevenue(p.id, p.currency);

        // Cash currently in project wallet (Allocated + Revenue - Spent)
        const treasury = (allocated + revenue) - spent;

        // Financial progress: spent vs target
        const financialProg = Math.round(Math.min(100, (spent / p.target) * 100)) || 0;

        // Operational progress: based on completed tasks
        const tasks = state.projectTasks.filter(t => t.projectId === p.id);
        const done = tasks.filter(t => t.done).length;
        const operationalProg = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

        return {
            target: p.target,
            allocated,
            spent,
            revenue,
            treasury,
            financialProg,
            operationalProg
        };
    },

    /**
     * Get generic project data filtered by tab
     */
    getData(projectId, tabId) {
        return state.projectData.filter(d => d.projectId === projectId && d.tabId === tabId);
    },

    /**
     * Save/Update generic project data
     */
    saveData(projectId, tabId, values, id = null) {
        if (id) {
            const idx = state.projectData.findIndex(d => d.id === id);
            if (idx !== -1) {
                state.projectData[idx].values = values;
                state.projectData[idx].updatedAt = new Date().toISOString();
                return state.projectData[idx];
            }
        }

        const newData = {
            id: id || uid(),
            projectId,
            tabId,
            values,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        state.projectData.push(newData);
        return newData;
    },

    /**
     * Connect a data item to a financial transaction
     */
    linkTransaction(dataId, transactionId) {
        const item = state.projectData.find(d => d.id === dataId);
        if (item) {
            item.transactionId = transactionId;
            return true;
        }
        return false;
    }
};
