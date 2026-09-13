
/**
 * RelationService - Intelligent Entity Linking (V6)
 */
const RelationService = {
    /**
     * Get all transactions linked to a specific item
     */
    getTransactionsForItem(moduleId, itemId) {
        return state.transactions.filter(t => t.sourceModule === moduleId && t.sourceItemId === itemId);
    },

    /**
     * Calculate total money spent/received for a specific item
     */
    calculateLinkedTotal(moduleId, itemId, targetCurrency) {
        const txs = this.getTransactionsForItem(moduleId, itemId);
        return txs.reduce((sum, t) => sum + Currency.convert(t.amount, t.currency, targetCurrency, state.rates), 0);
    },

    /**
     * Calculate total quantity involved in transactions for an item (e.g. stock sold)
     */
    calculateLinkedQty(moduleId, itemId) {
        const txs = this.getTransactionsForItem(moduleId, itemId);
        return txs.reduce((sum, t) => sum + (parseFloat(t.qty) || 0), 0);
    },

    /**
     * Cleanup and integrity check
     */
    cleanupRelations(moduleId, itemId) {
        // We keep transactions for accounting but remove the link
        state.transactions.forEach(t => {
            if (t.sourceModule === moduleId && t.sourceItemId === itemId) {
                t.sourceItemId = null;
                t.description += " (Élément parent supprimé)";
            }
        });
    }
};
