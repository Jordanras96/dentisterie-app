import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

const tourConfig = {
  showProgress: true,
  animate: true,
  allowClose: true,
  overlayClickNext: false,
  stagePadding: 4,
  stageRadius: 8,
  popoverClass: 'driverjs-theme',
  nextBtnText: 'Suivant',
  prevBtnText: 'Précédent',
  doneBtnText: 'Terminé',
  progressText: '{{current}} sur {{total}}',
}

export const tours: Record<string, DriveStep[]> = {
  patients: [
    {
      element: 'h1',
      popover: {
        title: 'Page Patients',
        description: 'Bienvenue sur la page de gestion des patients. Ici, vous pouvez voir la liste de tous les patients enregistrés.',
      },
    },
    {
      element: '[data-tour="search"]',
      popover: {
        title: 'Recherche',
        description: 'Utilisez la barre de recherche pour trouver un patient par nom, numéro ou téléphone.',
      },
    },
    {
      element: '[data-tour="new-patient"]',
      popover: {
        title: 'Nouveau Patient',
        description: 'Cliquez ici pour enregistrer un nouveau patient. Remplissez le formulaire avec les informations du patient.',
      },
    },
  ],

  factures: [
    {
      element: 'h1',
      popover: {
        title: 'Page Factures',
        description: 'Gérez toutes les factures de vos patients. Filtrez par date et consultez les détails.',
      },
    },
    {
      element: '[data-tour="new-invoice"]',
      popover: {
        title: 'Nouvelle Facture',
        description: 'Créez une nouvelle facture en sélectionnant un patient, des interventions et des produits.',
      },
    },
  ],

  'nouvelle-facture': [
    {
      element: '[data-tour="patient-search"]',
      popover: {
        title: 'Recherche Patient',
        description: 'Commencez par rechercher le patient. Tapez son nom ou numéro pour le trouver.',
      },
    },
    {
      element: '[data-tour="tarif-type"]',
      popover: {
        title: 'Type de Tarif',
        description: 'Sélectionnez le type de tarif applicable (Public, Personnel, Retraité, TIKO). Les prix se mettent à jour automatiquement.',
      },
    },
    {
      element: '[data-tour="interventions"]',
      popover: {
        title: 'Interventions',
        description: "Ajoutez les interventions réalisées. Sélectionnez l'intervention dans la liste.",
      },
    },
    {
      element: '[data-tour="submit-invoice"]',
      popover: {
        title: 'Valider la Facture',
        description: 'Une fois toutes les informations renseignées, cliquez pour créer la facture.',
      },
    },
  ],

  produits: [
    {
      element: 'h1',
      popover: {
        title: 'Page Produits',
        description: 'Gérez votre catalogue de produits et le stock.',
      },
    },
    {
      element: '[data-tour="new-product"]',
      popover: {
        title: 'Nouveau Produit',
        description: 'Ajoutez un nouveau produit au catalogue avec ses prix pour chaque type de tarif.',
      },
    },
    {
      element: '[data-tour="stock-entry"]',
      popover: {
        title: "Saisie d'entrée",
        description: 'Enregistrez une entrée de stock en sélectionnant les produits et quantités reçues.',
      },
    },
  ],

  interventions: [
    {
      element: 'h1',
      popover: {
        title: 'Page Interventions',
        description: 'Consultez et gérez les interventions dentaires organisées en arbre hiérarchique.',
      },
    },
  ],

  'rendez-vous': [
    {
      element: 'h1',
      popover: {
        title: 'Page Rendez-vous',
        description: 'Gérez le planning journalier des rendez-vous de vos patients.',
      },
    },
    {
      element: '[data-tour="date-filter"]',
      popover: {
        title: 'Filtrer par Date',
        description: 'Changez la date pour voir les rendez-vous d\'un autre jour.',
      },
    },
    {
      element: '[data-tour="new-rdv"]',
      popover: {
        title: 'Nouveau Rendez-vous',
        description: 'Créez un nouveau rendez-vous en indiquant le patient, la date, l\'heure et le motif.',
      },
    },
  ],

  statistiques: [
    {
      element: 'h1',
      popover: {
        title: 'Page Statistiques',
        description: 'Visualisez les statistiques démographiques de vos patients.',
      },
    },
    {
      element: '[data-tour="generate"]',
      popover: {
        title: 'Générer les Statistiques',
        description: 'Sélectionnez une année et cliquez sur "Générer" pour voir la répartition par sexe et par âge.',
      },
    },
  ],

  utilisateurs: [
    {
      element: 'h1',
      popover: {
        title: 'Page Utilisateurs',
        description: 'Gérez les comptes utilisateurs, les rôles et les permissions.',
      },
    },
    {
      element: '[data-tour="change-password"]',
      popover: {
        title: 'Changer de Mot de Passe',
        description: 'Modifiez votre mot de passe pour sécuriser votre compte.',
      },
    },
  ],
}

export function startTour(tourName: string) {
  const steps = tours[tourName]
  if (!steps || steps.length === 0) return

  const driverObj = driver({
    ...tourConfig,
    steps,
  })

  driverObj.drive()
}
