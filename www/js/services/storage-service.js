
/**
 * StorageService - LocalStorage management and State persistence
 */
const StorageService = {
    STORAGE_KEY: "budgetProjetsV1_2",

    defaultState() {
        return {
            schemaVersion: MigrationService.LATEST_VERSION,
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
        };
    },

    load() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) return this.defaultState();

        try {
            let state = JSON.parse(raw);

            // Secured Migration Process
            if (typeof MigrationService !== 'undefined') {
                state = MigrationService.migrate(state);
            }

            // Deep merge to ensure all keys exist
            return { ...this.defaultState(), ...state };
        } catch (e) {
            console.error("Critical error loading storage", e);
            return this.defaultState();
        }
    },

    save(state) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    },

    export(state) {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `budget-projets-backup-v${state.schemaVersion || 1}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    import(file, callback) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                const migrated = MigrationService.migrate(parsed);
                const normalized = { ...this.defaultState(), ...migrated };
                this.save(normalized);
                callback(null, normalized);
            } catch (e) {
                callback(e);
            }
        };
        reader.readAsText(file);
    },

    reset() {
        if (confirm("ATTENTION : Cette action supprimera définitivement TOUTES vos données. Une sauvegarde automatique sera créée avant la suppression. Continuer ?")) {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                localStorage.setItem(`budgetProjets_FINAL_BACKUP_${Date.now()}`, raw);
            }
            localStorage.removeItem(this.STORAGE_KEY);
            location.reload();
        }
    }
};
