
/**
 * Global Configuration for all Project Types (V5 - Intelligent Connections)
 */

const PROJECT_GROUPS = [
    "Habitat & Immobilier", "Mobilité", "Voyages", "Études & Formation",
    "Entreprise & Commerce", "Vie personnelle & familiale", "Équipement & Achats",
    "Épargne & Investissement", "Travail & Carrière", "Personnalisé"
];

const PROJECT_TYPES = {
    house: {
        group: "Habitat & Immobilier", label: "Maison", icon: "🏠",
        tabs: ["summary", "expenses", "materials", "workers", "tasks", "documents"]
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
        tabs: ["summary", "itinerary", "transport", "lodging", "activities", "budget_detail", "documents"]
    },
    studies: {
        group: "Études & Formation", label: "Études", icon: "🎓",
        tabs: ["summary", "formation", "enrollment", "fees", "modules", "materials", "deadlines"]
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
        tabs: ["summary", "budget_detail", "vendors", "guests", "purchases", "planning"]
    },
    computer: {
        group: "Équipement & Achats", label: "Achat d’ordinateur", icon: "💻",
        tabs: ["summary", "criteria", "comparison", "budget_detail", "buy_info", "accessories"]
    },
    saving: {
        group: "Épargne & Investissement", label: "Épargne", icon: "💰",
        tabs: ["summary", "savings_goal", "transfers", "withdrawals", "progression"]
    },
    family: {
        group: "Vie personnelle & familiale", label: "Projet familial", icon: "👪",
        tabs: ["summary", "budget_detail", "participants", "expenses", "tasks"]
    },
    professional: {
        group: "Travail & Carrière", label: "Projet professionnel", icon: "🛠️",
        tabs: ["summary", "deliverables", "budget_detail", "team", "tasks", "documents"]
    },
    invest: {
        group: "Épargne & Investissement", label: "Investissement", icon: "📈",
        tabs: ["summary", "capital", "income_stream", "fees", "performance", "documents"]
    },
    custom: {
        group: "Personnalisé", label: "Projet personnalisé", icon: "⚙️",
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
        { id: 'surface', label: 'Surface (m²)' },
        { id: 'location', label: 'Localisation' },
        { id: 'parcel', label: 'Réf Cadastrale' },
        { id: 'title', label: 'Statut Juridique' },
        { id: 'price', label: 'Prix convenu', type: 'number' },
        { id: 'seller', label: 'Vendeur' }
    ]},
    fees: { label: "Frais & Taxes", module: "generic_financial", category: "Frais", transactionType: "expense" },
    documents: { label: "Documents", module: "generic", fields: [
        { id: 'name', label: 'Nom' },
        { id: 'status', label: 'Statut' },
        { id: 'expiry', label: 'Expiration', type: 'date' }
    ]},
    car_info: { label: "Véhicule", module: "generic", fields: [
        { id: 'brand', label: 'Marque' },
        { id: 'model', label: 'Modèle' },
        { id: 'year', label: 'Année', type: 'number' },
        { id: 'km', label: 'Kilométrage', type: 'number' },
        { id: 'vin', label: 'N° Châssis (VIN)' },
        { id: 'plate', label: 'Immatriculation' }
    ]},
    buy_finance: { label: "Achat & Financement", module: "generic", fields: [
        { id: 'price', label: 'Prix négocié', type: 'number' },
        { id: 'deposit', label: 'Acompte versé', type: 'number' },
        { id: 'credit', label: 'Crédit / Reste' }
    ]},
    maintenance: { label: "Entretien", module: "generic_financial", category: "Entretien", transactionType: "expense" },
    itinerary: { label: "Itinéraire", module: "generic", fields: [
        { id: 'date', label: 'Date', type: 'date' },
        { id: 'place', label: 'Lieu' },
        { id: 'note', label: 'Activité' }
    ]},
    transport: { label: "Transport", module: "booking", type: "Transport" },
    lodging: { label: "Hébergement", module: "booking", type: "Hébergement" },
    activities: { label: "Activités", module: "booking", type: "Activité" },
    formation: { label: "Formation", module: "generic", fields: [
        { id: 'school', label: 'Établissement' },
        { id: 'title', label: 'Diplôme / Spécialité' },
        { id: 'duration', label: 'Durée' }
    ]},
    enrollment: { label: "Inscriptions", module: "generic_financial", category: "Scolarité", transactionType: "expense" },
    modules: { label: "Cours & Modules", module: "generic", fields: [
        { id: 'name', label: 'Module' },
        { id: 'status', label: 'Statut (Validé/En cours)' },
        { id: 'grade', label: 'Note/Résultat' }
    ]},
    deadlines: { label: "Échéances", module: "tasks" },
    activity: { label: "Activité", module: "generic", fields: [
        { id: 'goal', label: 'Objectif principal' },
        { id: 'kpis', label: 'Indicateurs clés' }
    ]},
    capital: { label: "Capital & Financement", module: "generic_financial", category: "Investissement", transactionType: "purchase" },
    team: { label: "Équipe", module: "workers" },
    stock: { label: "Stock", module: "inventory" },
    suppliers: { label: "Fournisseurs", module: "generic", fields: [
        { id: 'name', label: 'Nom' },
        { id: 'contact', label: 'Contact' },
        { id: 'items', label: 'Articles fournis' }
    ]},
    sales: { label: "Ventes", module: "sales", category: "Ventes", transactionType: "revenue" },
    cash_flow: { label: "Trésorerie", module: "summary" },
    budget_detail: { label: "Budget", module: "generic", fields: [
        { id: 'label', label: 'Poste' },
        { id: 'planned', label: 'Montant prévu', type: 'number' }
    ]},
    vendors: { label: "Prestataires", module: "workers" },
    guests: { label: "Invités", module: "generic", fields: [
        { id: 'name', label: 'Nom' },
        { id: 'confirmation', label: 'Confirmation (Oui/Non/?)' },
        { id: 'plusone', label: 'Accompagnants', type: 'number' }
    ]},
    purchases: { label: "Achats", module: "expenses" },
    planning: { label: "Planning", module: "tasks" },
    criteria: { label: "Critères", module: "generic", fields: [
        { id: 'spec', label: 'Caractéristique (RAM, CPU...)' },
        { id: 'min', label: 'Minimum requis' }
    ]},
    comparison: { label: "Modèles comparés", module: "generic", fields: [
        { id: 'model', label: 'Modèle' },
        { id: 'price', label: 'Prix constaté', type: 'number' },
        { id: 'link', label: 'Lien/Vendeur' }
    ]},
    buy_info: { label: "Achat", module: "generic_financial", category: "Équipement", transactionType: "purchase" },
    accessories: { label: "Accessoires", module: "generic_financial", category: "Accessoires", transactionType: "purchase" },
    savings_goal: { label: "Objectif", module: "generic", fields: [
        { id: 'target', label: 'Montant cible', type: 'number' },
        { id: 'date', label: 'Échéance', type: 'date' }
    ]},
    transfers: { label: "Versements", module: "summary" },
    withdrawals: { label: "Retraits", module: "generic_financial", category: "Retrait", transactionType: "withdrawal" },
    progression: { label: "Progression", module: "summary" },
    participants: { label: "Participants", module: "workers" },
    deliverables: { label: "Objectifs & Livrables", module: "generic", fields: [
        { id: 'name', label: 'Nom' },
        { id: 'status', label: 'Statut' }
    ]},
    income_stream: { label: "Revenus", module: "generic_revenue", category: "Revenus", transactionType: "revenue" },
    performance: { label: "Performance", module: "summary" },
    custom_tabs_manager: { label: "Personnaliser", module: "custom_manager" }
};

const TAB_LIBRARY = ["summary", "budget_detail", "expenses", "materials", "workers", "tasks", "documents", "participants", "stock", "suppliers", "sales", "income_stream", "fees"];
