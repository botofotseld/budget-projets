
/**
 * Global Configuration for all Project Types and their hierarchical structure
 */

const PROJECT_TYPES = {
    house: {
        group: "Habitat & Immobilier", label: "Maison", icon: "🏠",
        tabs: ["summary", "expenses", "materials", "workers", "tasks"]
    },
    land: {
        group: "Habitat & Immobilier", label: "Terrain", icon: "🌳",
        tabs: ["summary", "land_info", "fees", "workers", "documents", "tasks"]
    },
    car: {
        group: "Mobilité", label: "Voiture", icon: "🚗",
        tabs: ["summary", "car_info", "buy_finance", "maintenance", "documents", "tasks"]
    },
    travel: {
        group: "Voyages", label: "Voyage", icon: "✈️",
        tabs: ["summary", "itinerary", "transport", "lodging", "expenses", "documents"]
    },
    studies: {
        group: "Études & Formation", label: "Études", icon: "🎓",
        tabs: ["summary", "formation", "enrollment", "fees", "modules", "materials", "tasks"]
    },
    business: {
        group: "Entreprise & Commerce", label: "Entreprise", icon: "💼",
        tabs: ["summary", "activity", "capital", "team", "expenses", "documents", "tasks"]
    },
    commerce: {
        group: "Entreprise & Commerce", label: "Commerce", icon: "🛒",
        tabs: ["summary", "stock", "suppliers", "sales", "expenses", "cash_flow"]
    },
    wedding: {
        group: "Vie personnelle & familiale", label: "Mariage", icon: "💍",
        tabs: ["summary", "budget_detail", "vendors", "guests", "expenses", "tasks"]
    },
    computer: {
        group: "Équipement & Achats", label: "Achat Ordinateur", icon: "💻",
        tabs: ["summary", "criteria", "comparison", "budget_detail", "buy_info", "accessories"]
    },
    saving: {
        group: "Épargne & Investissement", label: "Épargne", icon: "💰",
        tabs: ["summary", "savings_goal", "transfers", "withdrawals", "tasks"]
    },
    invest: {
        group: "Épargne & Investissement", label: "Investissement", icon: "📈",
        tabs: ["summary", "capital", "income_stream", "fees", "performance", "documents"]
    },
    family: {
        group: "Vie personnelle & familiale", label: "Projet Familial", icon: "👪",
        tabs: ["summary", "budget_detail", "participants", "expenses", "tasks"]
    },
    professional: {
        group: "Travail & Carrière", label: "Projet Professionnel", icon: "🛠️",
        tabs: ["summary", "deliverables", "budget_detail", "team", "tasks", "documents"]
    },
    custom: {
        group: "Personnalisé", label: "Autre projet personnalisé", icon: "⚙️",
        tabs: ["summary", "custom_tabs_manager"]
    }
};

const TAB_CONFIG = {
    summary: { label: "Résumé", module: "summary" },
    expenses: { label: "Dépenses", module: "expenses" },
    materials: { label: "Matériaux", module: "materials" },
    workers: { label: "Intervenants", module: "workers" },
    tasks: { label: "Avancement", module: "tasks" },
    land_info: { label: "Parcelle", module: "generic", fields: [
        { id: 'surface', label: 'Surface', placeholder: 'Ex: 500m²' },
        { id: 'location', label: 'Localisation' },
        { id: 'parcel', label: 'N° Parcelle' },
        { id: 'title', label: 'Statut Titre' }
    ]},
    documents: { label: "Documents", module: "generic", fields: [
        { id: 'name', label: 'Nom du document' },
        { id: 'status', label: 'Statut' }
    ]},
    fees: { label: "Frais", module: "generic", fields: [
        { id: 'label', label: 'Nature' },
        { id: 'amount', label: 'Montant', type: 'number' }
    ]},
    car_info: { label: "Véhicule", module: "generic", fields: [
        { id: 'brand', label: 'Marque/Modèle' },
        { id: 'year', label: 'Année', type: 'number' },
        { id: 'km', label: 'Kilométrage', type: 'number' }
    ]},
    buy_finance: { label: "Achat & Financement", module: "generic", fields: [
        { id: 'price', label: 'Prix négocié', type: 'number' },
        { id: 'acompte', label: 'Acompte payé', type: 'number' },
        { id: 'credit', label: 'Crédit / Mensualité' }
    ]},
    maintenance: { label: "Entretien", module: "generic", fields: [
        { id: 'date', label: 'Date', type: 'date' },
        { id: 'label', label: 'Opération' },
        { id: 'cost', label: 'Coût', type: 'number' }
    ]},
    itinerary: { label: "Itinéraire", module: "generic", fields: [
        { id: 'step', label: 'Étape' },
        { id: 'date', label: 'Date', type: 'date' }
    ]},
    transport: { label: "Transport", module: "generic", fields: [
        { id: 'mode', label: 'Moyen (Vol, Train...)' },
        { id: 'ref', label: 'N° de référence' },
        { id: 'cost', label: 'Prix', type: 'number' }
    ]},
    lodging: { label: "Hébergement", module: "generic", fields: [
        { id: 'name', label: 'Nom hôtel/Airbnb' },
        { id: 'cost', label: 'Prix total', type: 'number' }
    ]},
    formation: { label: "Formation", module: "generic", fields: [
        { id: 'school', label: 'Établissement' },
        { id: 'title', label: 'Diplôme / Spécialité' }
    ]},
    enrollment: { label: "Inscriptions", module: "generic", fields: [
        { id: 'label', label: 'Type de frais' },
        { id: 'amount', label: 'Montant', type: 'number' }
    ]},
    modules: { label: "Cours & Modules", module: "generic", fields: [
        { id: 'name', label: 'Nom du module' },
        { id: 'status', label: 'Statut / Note' }
    ]},
    activity: { label: "Activité", module: "generic", fields: [
        { id: 'goal', label: 'Objectif principal' },
        { id: 'kpi', label: 'Indicateur de succès' }
    ]},
    capital: { label: "Capital & Financement", module: "generic", fields: [
        { id: 'source', label: 'Source des fonds' },
        { id: 'amount', label: 'Montant engagé', type: 'number' }
    ]},
    team: { label: "Équipe", module: "generic", fields: [
        { id: 'name', label: 'Nom' },
        { id: 'role', label: 'Rôle / Responsabilité' }
    ]},
    stock: { label: "Stock", module: "generic", fields: [
        { id: 'item', label: 'Article' },
        { id: 'qty', label: 'Quantité' },
        { id: 'buy', label: 'Prix achat unit.', type: 'number' },
        { id: 'sell', label: 'Prix vente unit.', type: 'number' }
    ]},
    suppliers: { label: "Fournisseurs", module: "generic", fields: [
        { id: 'name', label: 'Nom' },
        { id: 'contact', label: 'Contact' }
    ]},
    sales: { label: "Ventes", module: "generic", fields: [
        { id: 'date', label: 'Date', type: 'date' },
        { id: 'amount', label: 'Montant total reçu', type: 'number' }
    ]},
    cash_flow: { label: "Trésorerie", module: "summary" },
    budget_detail: { label: "Budget", module: "generic", fields: [
        { id: 'label', label: 'Poste de dépense' },
        { id: 'planned', label: 'Montant prévu', type: 'number' }
    ]},
    vendors: { label: "Prestataires", module: "generic", fields: [
        { id: 'name', label: 'Nom' },
        { id: 'service', label: 'Service fourni' },
        { id: 'cost', label: 'Prix convenu', type: 'number' }
    ]},
    guests: { label: "Invités", module: "generic", fields: [
        { id: 'name', label: 'Nom' },
        { id: 'confirmation', label: 'Confirmation (Oui/Non/?)' }
    ]},
    criteria: { label: "Critères", module: "generic", fields: [
        { id: 'spec', label: 'Caractéristique (RAM, CPU...)' },
        { id: 'min', label: 'Minimum requis' }
    ]},
    comparison: { label: "Comparatif", module: "generic", fields: [
        { id: 'model', label: 'Modèle' },
        { id: 'price', label: 'Prix constaté', type: 'number' }
    ]},
    buy_info: { label: "Achat", module: "generic", fields: [
        { id: 'store', label: 'Enseigne / Vendeur' },
        { id: 'amount', label: 'Prix payé', type: 'number' }
    ]},
    accessories: { label: "Accessoires & Garantie", module: "generic", fields: [
        { id: 'item', label: 'Accessoire' },
        { id: 'warranty', label: 'Fin de garantie', type: 'date' }
    ]},
    savings_goal: { label: "Objectif", module: "generic", fields: [
        { id: 'target', label: 'Montant cible', type: 'number' },
        { id: 'date', label: 'Échéance prévue', type: 'date' }
    ]},
    transfers: { label: "Versements", module: "summary" },
    withdrawals: { label: "Retraits", module: "generic", fields: [
        { id: 'date', label: 'Date', type: 'date' },
        { id: 'amount', label: 'Montant retiré', type: 'number' }
    ]},
    participants: { label: "Participants", module: "generic", fields: [
        { id: 'name', label: 'Nom' },
        { id: 'contribution', label: 'Contribution prévue', type: 'number' }
    ]},
    deliverables: { label: "Objectifs & Livrables", module: "generic", fields: [
        { id: 'name', label: 'Nom' },
        { id: 'status', label: 'Statut' }
    ]},
    income_stream: { label: "Revenus", module: "generic", fields: [
        { id: 'source', label: 'Actif / Source' },
        { id: 'amount', label: 'Revenu reçu', type: 'number' }
    ]},
    performance: { label: "Performance", module: "generic", fields: [
        { id: 'roi', label: 'Rendement %' },
        { id: 'val', label: 'Valeur actuelle estimée', type: 'number' }
    ]},
    custom_tabs_manager: { label: "Personnaliser", module: "custom_manager" }
};

const TAB_LIBRARY = ["summary", "budget_detail", "expenses", "materials", "workers", "tasks", "documents", "participants", "stock", "suppliers", "sales", "income_stream", "fees"];
