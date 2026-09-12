
/**
 * TransactionService - Central motor for all financial operations
 */
const TransactionService = {
    /**
     * Types of transactions supported by the system
     */
    TYPES: {
        INCOME: 'income',
        EXPENSE: 'expense',
        TRANSFER: 'transfer',
        ALLOCATION: 'project_allocation',
        PAYMENT: 'payment',
        PURCHASE: 'purchase',
        REVENUE: 'revenue',
        WITHDRAWAL: 'withdrawal',
        REFUND: 'refund'
    },

    /**
     * Add a new transaction and connect it to a source item if provided
     */
    add(data) {
        const tx = {
            id: uid(),
            projectId: data.projectId || null,
            type: data.type || this.TYPES.EXPENSE,
            description: data.description || "",
            amount: parseFloat(data.amount) || 0,
            currency: data.currency || state.mainCurrency,
            date: data.date || new Date().toISOString(),
            category: data.category || "Autre",
            sourceModule: data.sourceModule || null,
            sourceItemId: data.sourceItemId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        state.transactions.push(tx);
        return tx;
    },

    /**
     * Delete a transaction and handle any logic to keep data consistent
     */
    delete(id) {
        const tx = state.transactions.find(t => t.id === id);
        if (!tx) return false;

        // If it's a critical project allocation, we might need to update assignments
        if (tx.type === this.TYPES.ALLOCATION) {
            // Find assignment and clear it
            const key = Object.keys(state.monthlyAssignments).find(k => state.monthlyAssignments[k].transactionId === id);
            if (key) {
                state.monthlyAssignments[key].checked = false;
                state.monthlyAssignments[key].transactionId = null;
            }
        }

        state.transactions = state.transactions.filter(t => t.id !== id);
        return true;
    },

    /**
     * Get transactions filtered by project and/or module
     */
    getByProject(projectId, module = null) {
        let results = state.transactions.filter(t => t.projectId === projectId);
        if (module) {
            results = results.filter(t => t.sourceModule === module);
        }
        return results.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    /**
     * Get total spent for a project in a target currency
     */
    getSpent(projectId, targetCurrency) {
        return state.transactions
            .filter(t => t.projectId === projectId && [this.TYPES.EXPENSE, this.TYPES.PAYMENT, this.TYPES.PURCHASE, this.TYPES.WITHDRAWAL].includes(t.type))
            .reduce((sum, t) => sum + Currency.convert(t.amount, t.currency, targetCurrency, state.rates), 0);
    },

    /**
     * Get total income/revenue for a project
     */
    getRevenue(projectId, targetCurrency) {
        return state.transactions
            .filter(t => t.projectId === projectId && [this.TYPES.REVENUE, this.TYPES.INCOME].includes(t.type))
            .reduce((sum, t) => sum + Currency.convert(t.amount, t.currency, targetCurrency, state.rates), 0);
    }
};
