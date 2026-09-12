
/**
 * MigrationService - Safe transition from V2 (Independent tables) to V3 (Relational)
 */
const MigrationService = {
    migrateToV3(state) {
        console.log("Starting Migration to V3...");

        // 1. Create a backup entry in localStorage just in case
        localStorage.setItem("backup_v2_" + Date.now(), JSON.stringify(state));

        // 2. Ensure new tables exist
        state.projectData = state.projectData || [];
        state.projectEvents = state.projectEvents || [];

        // 3. Migrate Materials to Generic ProjectData
        // We look for existing projectMaterials and move them to projectData under 'materials' tab
        if (state.projectMaterials && state.projectMaterials.length > 0) {
            state.projectMaterials.forEach(m => {
                state.projectData.push({
                    id: m.id,
                    projectId: m.projectId,
                    tabId: 'materials',
                    values: {
                        name: m.name,
                        planned_qty: m.planned || 0,
                        received_qty: m.bought || 0,
                        unit: 'unité',
                        status: (m.bought >= m.planned && m.planned > 0) ? 'Complet' : 'À commander'
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            });
            // Clear old table to avoid duplication if migration runs again
            state.projectMaterials = [];
        }

        // 4. Migrate Workers to Generic ProjectData
        if (state.projectWorkers && state.projectWorkers.length > 0) {
            state.projectWorkers.forEach(w => {
                const workerId = w.id;
                state.projectData.push({
                    id: workerId,
                    projectId: w.projectId,
                    tabId: 'workers',
                    values: {
                        name: w.name,
                        role: w.role || 'Ouvrier',
                        agreed_amount: w.total || 0,
                        paid_amount: w.paid || 0
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                // Link existing expenses that might be related to this worker
                // (Heuristic: search in projectExpenses for the worker's name)
                state.projectExpenses.forEach(e => {
                    if (e.projectId === w.projectId && e.label.toLowerCase().includes(w.name.toLowerCase())) {
                        e.sourceModule = 'workers';
                        e.sourceItemId = workerId;
                    }
                });
            });
            state.projectWorkers = [];
        }

        // 5. Unify all projectExpenses into the main Transactions table
        if (state.projectExpenses && state.projectExpenses.length > 0) {
            state.projectExpenses.forEach(e => {
                state.transactions.push({
                    id: e.id,
                    projectId: e.projectId,
                    type: 'expense',
                    description: e.label,
                    amount: e.amount,
                    currency: e.currency || 'EUR',
                    date: e.date || new Date().toISOString(),
                    category: e.category || 'Chantier',
                    sourceModule: e.sourceModule || 'expenses',
                    sourceItemId: e.sourceItemId || null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            });
            state.projectExpenses = [];
        }

        // 6. Update Schema Version
        state.schemaVersion = 3;
        console.log("Migration to V3 complete.");
        return state;
    }
};
