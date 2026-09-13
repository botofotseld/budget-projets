
/**
 * ProjectService - Project Management & Operational Logic
 */
const ProjectService = {
    STATUSES: ["À préparer", "En cours", "En pause", "Terminé", "Archivé"],

    /**
     * Get KPIs including Financial and Operational data
     */
    getKPIs(p) {
        const fin = FinanceService.getProjectSummary(p.id, p.currency);

        // Operational progress: based on completed tasks
        const tasks = state.projectTasks.filter(t => t.projectId === p.id);
        const done = tasks.filter(t => t.done).length;
        const operationalProg = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

        return {
            ...fin,
            operationalProg
        };
    },

    getData(projectId, tabId) {
        return state.projectData.filter(d => d.projectId === projectId && d.tabId === tabId);
    },

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
    }
};
