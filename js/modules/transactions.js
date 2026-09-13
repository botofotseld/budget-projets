
/**
 * Transactions Module - History and creation
 */
function renderTransactions() {
    const filter = $("txFilter") ? $("txFilter").value : "all";
    let rows = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filter !== "all") rows = rows.filter(r => r.type === filter);

    if ($("transactionList")) {
        $("transactionList").innerHTML = rows.length ? rows.map(r => {
            const canDelete = ["income", "expense", "revenue", "payment", "purchase"].includes(r.type);
            return `<div class="tx"><div><strong>${esc(r.description)}</strong><small>${new Date(r.date).toLocaleDateString()} · ${r.type}</small>${canDelete ? `<button class="link-btn" onclick="deleteTransaction('${r.id}')">X</button>` : ''}</div><strong class="amount-expense">${Currency.format(r.amount, r.currency)}</strong></div>`;
        }).join("") : `<div class="empty">Aucune opération</div>`;
    }
}

function transactionRow(t) {
    let cls = "amount-expense", sign = "-", label = "Dépense";
    if (t.type === "income") { cls = "amount-income"; sign = "+"; label = "Entrée"; }
    if (t.type === "project_allocation") { cls = "amount-project"; sign = "→"; label = "Versement"; }
    if (t.type === "revenue") { cls = "amount-income"; sign = "+"; label = "Revenu"; }
    if (t.type === "payment") { cls = "amount-expense"; sign = "-"; label = "Paiement"; }
    if (t.type === "purchase") { cls = "amount-expense"; sign = "-"; label = "Achat"; }
    return `<div class="tx"><div><strong>${esc(t.description)}</strong><small>${new Date(t.date).toLocaleDateString()} · ${label}</small></div><div style="text-align:right"><strong class="${cls}">${sign}${Currency.format(t.amount, t.currency)}</strong></div></div>`;
}

function addTransaction() {
    const amount = parseFloat($("txAmount").value);
    if (!amount || amount <= 0) return alert("Montant requis.");

    TransactionService.add({
        type: $("txType").value,
        description: $("txDescription").value.trim() || "Opération",
        amount,
        currency: $("txCurrency").value,
        month: monthKey()
    });

    $("txDescription").value = ""; $("txAmount").value = "";
    persist();
}

function deleteTransaction(id) {
    if (confirm("Supprimer cette transaction ?")) {
        TransactionService.delete(id);
        persist();
    }
}
