
/**
 * FinanceService - Business intelligence for financial data (V6 - Harmonized)
 */
const FinanceService = {
    /**
     * Get global summary for a project
     */
    getProjectSummary(projectId, targetCurrency) {
        const p = state.projects.find(x => x.id === projectId);
        if (!p) return null;

        const txs = state.transactions.filter(t => t.projectId === projectId);

        // 1. Objectif (Budget Prévu)
        const budget = p.target;

        // 2. Affecté (Argent mis de côté pour le projet)
        const allocated = txs
            .filter(t => t.type === TransactionService.TYPES.ALLOCATION)
            .reduce((sum, t) => sum + Currency.convert(t.amount, t.currency, targetCurrency, state.rates), 0);

        // 3. Dépensé (Réellement payé)
        const outTypes = [
            TransactionService.TYPES.EXPENSE,
            TransactionService.TYPES.PAYMENT,
            TransactionService.TYPES.PURCHASE,
            TransactionService.TYPES.WITHDRAWAL
        ];
        const paid = txs
            .filter(t => outTypes.includes(t.type))
            .reduce((sum, t) => sum + Currency.convert(t.amount, t.currency, targetCurrency, state.rates), 0);

        // 4. Entrées propres au projet
        const revenue = txs
            .filter(t => t.type === TransactionService.TYPES.REVENUE)
            .reduce((sum, t) => sum + Currency.convert(t.amount, t.currency, targetCurrency, state.rates), 0);

        const refunds = txs
            .filter(t => t.type === TransactionService.TYPES.REFUND)
            .reduce((sum, t) => sum + Currency.convert(t.amount, t.currency, targetCurrency, state.rates), 0);

        // 5. Engagé (Budget déjà promis ou commandé)
        const engagedWorkers = state.projectData
            .filter(d => d.projectId === projectId && (d.tabId === 'workers' || TAB_CONFIG[d.tabId]?.module === 'workers'))
            .reduce((sum, d) => sum + Currency.convert(parseFloat(d.values.agreed_amount) || 0, p.currency, targetCurrency, state.rates), 0);

        const engagedMaterials = state.projectData
            .filter(d => d.projectId === projectId && d.tabId === 'materials')
            .reduce((sum, d) => sum + Currency.convert((parseFloat(d.values.planned_qty) || 0) * (parseFloat(d.values.unit_price) || 0), p.currency, targetCurrency, state.rates), 0);

        // Engaged is either what we promised or what we already paid if it's higher
        const engaged = Math.max(paid, engagedWorkers + engagedMaterials);

        // 6. Disponible (Trésorerie effective dans le projet)
        const treasury = (allocated + revenue + refunds) - paid;

        // 7. Progressions
        const financialProg = budget > 0 ? Math.round(Math.min(100, (paid / budget) * 100)) : 0;

        return {
            budget,
            allocated,
            engaged,
            paid,
            revenue,
            refunds,
            treasury,
            financialProg,
            remainingToPay: Math.max(0, engaged - paid)
        };
    },

    /**
     * Specialized Commerce stats
     */
    getCommerceStats(projectId, currency) {
        const txs = TransactionService.getByProject(projectId);
        const sales = txs.filter(t => t.type === TransactionService.TYPES.REVENUE).reduce((s, t) => s + Currency.convert(t.amount, t.currency, currency, state.rates), 0);
        const stockCost = txs.filter(t => t.type === TransactionService.TYPES.PURCHASE && t.sourceModule === 'inventory').reduce((s, t) => s + Currency.convert(t.amount, t.currency, currency, state.rates), 0);

        return {
            ca: sales,
            cost: stockCost,
            margin: sales - stockCost,
            marginPct: sales ? Math.round(((sales - stockCost) / sales) * 100) : 0
        };
    },

    /**
     * Specialized Investment stats
     */
    getInvestStats(projectId, currency) {
        const txs = TransactionService.getByProject(projectId);
        const capital = txs.filter(t => t.type === TransactionService.TYPES.PURCHASE).reduce((s, t) => s + Currency.convert(t.amount, t.currency, currency, state.rates), 0);
        const revenues = txs.filter(t => t.type === TransactionService.TYPES.REVENUE).reduce((s, t) => s + Currency.convert(t.amount, t.currency, currency, state.rates), 0);
        const fees = txs.filter(t => t.type === TransactionService.TYPES.EXPENSE).reduce((s, t) => s + Currency.convert(t.amount, t.currency, currency, state.rates), 0);

        return {
            capital,
            revenues,
            fees,
            net: revenues - fees,
            performance: capital ? Math.round(((revenues - fees) / capital) * 100) : 0
        };
    },

    getItemStats(moduleId, itemId, targetCurrency) {
        const item = state.projectData.find(d => d.id === itemId);
        if (!item) return { agreed: 0, paid: 0, remaining: 0 };
        const txs = RelationService.getTransactionsForItem(moduleId, itemId);
        const paid = txs.reduce((sum, t) => sum + Currency.convert(t.amount, t.currency, targetCurrency, state.rates), 0);
        const agreed = parseFloat(item.values.agreed_amount || 0);
        return { agreed, paid, remaining: Math.max(0, agreed - paid) };
    },

    getAvailableBalance(targetCurrency) {
        return state.transactions.reduce((bal, t) => {
            const val = Currency.convert(t.amount, t.currency, targetCurrency, state.rates);

            // Une affectation déplace l'argent du disponible vers la trésorerie du projet.
            if (t.type === TransactionService.TYPES.ALLOCATION) return bal - val;

            // Les mouvements d'un projet restent dans sa propre trésorerie. Ils ne doivent
            // pas être comptés une seconde fois dans le solde général.
            if (t.projectId) {
                // Un retrait de projet rend l'argent au solde disponible.
                if (t.type === TransactionService.TYPES.WITHDRAWAL) return bal + val;
                return bal;
            }

            const inflows = [
                TransactionService.TYPES.INCOME,
                TransactionService.TYPES.REVENUE,
                TransactionService.TYPES.REFUND
            ];
            if (inflows.includes(t.type)) return bal + val;

            const outflows = [
                TransactionService.TYPES.EXPENSE,
                TransactionService.TYPES.PAYMENT,
                TransactionService.TYPES.PURCHASE,
                TransactionService.TYPES.WITHDRAWAL
            ];
            if (outflows.includes(t.type)) return bal - val;
            return bal;
        }, 0);
    }
};
