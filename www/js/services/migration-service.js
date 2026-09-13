
/**
 * MigrationService - Secured & Versioned Data Migration (V5)
 */
const MigrationService = {
    LATEST_VERSION: 4,

    /**
     * Orchestrate migration version by version
     */
    migrate(oldState) {
        let state = { ...oldState };
        const currentVersion = state.schemaVersion || 1;

        if (currentVersion >= this.LATEST_VERSION) return state;

        console.log(`Migration required: v${currentVersion} -> v${this.LATEST_VERSION}`);

        try {
            // 1. Automatic Safety Backup
            const backupKey = `budgetProjets_backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
            localStorage.setItem(backupKey, JSON.stringify(state));
            console.log(`Safety backup created: ${backupKey}`);

            // 2. Sequential Migration
            if (currentVersion < 2) state = this._v1ToV2(state);
            if (currentVersion < 3) state = this._v2ToV3(state);
            if (currentVersion < 4) state = this._v3ToV4(state);

            // 3. Post-migration Validation
            if (this.validate(state)) {
                state.schemaVersion = this.LATEST_VERSION;
                console.log("Migration successful and validated.");
                return state;
            } else {
                throw new Error("Migration validation failed.");
            }

        } catch (error) {
            console.error("CRITICAL: Migration failed!", error);
            alert("Une erreur est survenue lors de la mise à jour des données. Une sauvegarde a été créée par sécurité.");
            return oldState; // Return original data to avoid corruption
        }
    },

    /**
     * Migration Step: V1 to V2 (Multi-currency & Basic cleanup)
     */
    _v1ToV2(state) {
        console.log("- Step v1 to v2...");
        state.mainCurrency = state.mainCurrency || "EUR";
        state.rates = state.rates || { EUR: 5200, USD: 4700 };
        state.showArFmg = state.showArFmg !== undefined ? state.showArFmg : true;

        state.projects = (state.projects || []).map(p => ({
            ...p,
            currency: p.currency || "EUR",
            status: p.status || "En cours"
        }));

        state.transactions = (state.transactions || []).map(t => ({
            ...t,
            currency: t.currency || "EUR"
        }));

        return state;
    },

    /**
     * Migration Step: V2 to V3 (Generic projectData & Merging modules)
     */
    _v2ToV3(state) {
        console.log("- Step v2 to v3...");
        state.projectData = state.projectData || [];

        // Migrate Materials
        if (state.projectMaterials && state.projectMaterials.length > 0) {
            state.projectMaterials.forEach(m => {
                if (!state.projectData.find(d => d.id === m.id)) { // Idempotency check
                    state.projectData.push({
                        id: m.id, projectId: m.projectId, tabId: 'materials',
                        values: { name: m.name, planned_qty: m.planned || 0, received_qty: m.bought || 0, unit: 'unité', status: 'À préparer' },
                        createdAt: new Date().toISOString()
                    });
                }
            });
            state.projectMaterials = [];
        }

        // Migrate Workers
        if (state.projectWorkers && state.projectWorkers.length > 0) {
            state.projectWorkers.forEach(w => {
                if (!state.projectData.find(d => d.id === w.id)) { // Idempotency check
                    state.projectData.push({
                        id: w.id, projectId: w.projectId, tabId: 'workers',
                        values: { name: w.name, role: w.role || 'Ouvrier', agreed_amount: w.total || 0, paid_amount: w.paid || 0 },
                        createdAt: new Date().toISOString()
                    });
                }
            });
            state.projectWorkers = [];
        }

        // Merge projectExpenses into main Transactions
        if (state.projectExpenses && state.projectExpenses.length > 0) {
            state.projectExpenses.forEach(e => {
                if (!state.transactions.find(t => t.id === e.id)) { // Idempotency check
                    state.transactions.push({
                        id: e.id, projectId: e.projectId, type: 'expense', description: e.label,
                        amount: e.amount, currency: e.currency || 'EUR', date: e.date || new Date().toISOString(),
                        category: e.category || 'Chantier', sourceModule: 'expenses'
                    });
                }
            });
            state.projectExpenses = [];
        }

        return state;
    },

    /**
     * Migration Step: V3 to V4 (Relational Core & Metadata)
     */
    _v3ToV4(state) {
        console.log("- Step v3 to v4...");
        const now = new Date().toISOString();

        state.projects = (state.projects || []).map(p => {
            let updated = { ...p, createdAt: p.createdAt || p.created || now, updatedAt: p.updatedAt || now };
            // Ensure proper subType for old projects
            if (updated.type === 'detailed' && !updated.subType) updated.subType = 'house';
            if (updated.type === 'simple') updated.subType = 'simple';
            return updated;
        });

        state.transactions = (state.transactions || []).map(t => ({
            ...t,
            createdAt: t.createdAt || now,
            updatedAt: t.updatedAt || now,
            type: t.type === 'project' ? 'project_allocation' : t.type // Standardize type name
        }));

        state.projectData = (state.projectData || []).map(d => ({
            ...d,
            createdAt: d.createdAt || now,
            updatedAt: d.updatedAt || now
        }));

        return state;
    },

    /**
     * Final validation of the migrated state
     */
    validate(state) {
        const requiredArrays = ['projects', 'transactions', 'projectData', 'projectTasks'];
        for (const key of requiredArrays) {
            if (!Array.isArray(state[key])) {
                console.error(`Validation error: ${key} is not an array`);
                return false;
            }
        }
        return true;
    }
};
