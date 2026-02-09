-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PersonnelType" AS ENUM ('MEDECIN', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "RdvStatut" AS ENUM ('PLANIFIE', 'CONFIRME', 'EN_COURS', 'TERMINE', 'ANNULE', 'REPORTE');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permissions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_requests" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "module" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" SERIAL NOT NULL,
    "numero_patient" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "date_naissance" TIMESTAMP(3),
    "sexe" TEXT,
    "profession" TEXT,
    "adresse" TEXT,
    "telephone" TEXT,
    "telephone2" TEXT,
    "derniere_visite" TIMESTAMP(3),
    "date_creation" TIMESTAMP(3),
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interventions" (
    "id" SERIAL NOT NULL,
    "code_travail" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "prix_public" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "prix_prise_charge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "prix_tiko" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "prix_personnel" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "prix_retraite" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "produit1" TEXT,
    "produit2" TEXT,
    "produit3" TEXT,
    "produit4" TEXT,
    "produit5" TEXT,
    "produit6" TEXT,
    "produit7" TEXT,
    "produit8" TEXT,
    "produit9" TEXT,
    "produit10" TEXT,
    "is_parent" BOOLEAN NOT NULL DEFAULT false,
    "is_middle" BOOLEAN NOT NULL DEFAULT false,
    "is_child" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" SERIAL NOT NULL,
    "code_produit" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "unite" TEXT,
    "nbr_util" INTEGER NOT NULL DEFAULT 0,
    "prix_vte" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "prix_achat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "prix_pers" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "prix_retraite" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "prix_enfcd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "categorie_produit" TEXT,
    "is_parent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factures" (
    "id" SERIAL NOT NULL,
    "numero_ordre" TEXT NOT NULL,
    "numero_patient" TEXT NOT NULL,
    "nom_patient" TEXT NOT NULL,
    "date_visite" TIMESTAMP(3) NOT NULL,
    "type_patient" INTEGER NOT NULL DEFAULT 1,
    "assurance" TEXT,
    "montant_total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_facture" (
    "id" SERIAL NOT NULL,
    "numero_ordre" TEXT NOT NULL,
    "code_intervention" TEXT,
    "code_produit" TEXT,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "prix_unitaire" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "montant" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lignes_facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interventions_activite" (
    "id" SERIAL NOT NULL,
    "numero_ordre" TEXT NOT NULL,
    "code_intervention" TEXT NOT NULL,
    "medecin_id" INTEGER,
    "assistant_id" INTEGER,
    "nbr" INTEGER NOT NULL DEFAULT 1,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interventions_activite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "type" "PersonnelType" NOT NULL,
    "specialite" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rendez_vous" (
    "id" SERIAL NOT NULL,
    "numero_patient" TEXT NOT NULL,
    "date_rdv" TIMESTAMP(3) NOT NULL,
    "heure_debut" TIMESTAMP(3) NOT NULL,
    "heure_fin" TIMESTAMP(3) NOT NULL,
    "medecin_id" INTEGER,
    "motif" TEXT,
    "interventions_prevues" JSONB,
    "statut" "RdvStatut" NOT NULL DEFAULT 'PLANIFIE',
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rendez_vous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mouvements_stock" (
    "id" SERIAL NOT NULL,
    "date_mouvement" TIMESTAMP(3) NOT NULL,
    "code_produit" TEXT NOT NULL,
    "type_mouvement" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvements_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametres" (
    "id" SERIAL NOT NULL,
    "nom_etablissement" TEXT NOT NULL,
    "adresse" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parametres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifs_personnalises" (
    "id" SERIAL NOT NULL,
    "nom_tarif" TEXT NOT NULL,
    "code_intervention" TEXT NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarifs_personnalises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "user_logs_userId_idx" ON "user_logs"("userId");

-- CreateIndex
CREATE INDEX "user_logs_createdAt_idx" ON "user_logs"("createdAt");

-- CreateIndex
CREATE INDEX "user_logs_module_idx" ON "user_logs"("module");

-- CreateIndex
CREATE INDEX "deletion_requests_status_idx" ON "deletion_requests"("status");

-- CreateIndex
CREATE INDEX "deletion_requests_userId_idx" ON "deletion_requests"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_numero_patient_key" ON "patients"("numero_patient");

-- CreateIndex
CREATE INDEX "patients_nom_idx" ON "patients"("nom");

-- CreateIndex
CREATE INDEX "patients_derniere_visite_idx" ON "patients"("derniere_visite");

-- CreateIndex
CREATE UNIQUE INDEX "interventions_code_travail_key" ON "interventions"("code_travail");

-- CreateIndex
CREATE INDEX "interventions_is_parent_idx" ON "interventions"("is_parent");

-- CreateIndex
CREATE INDEX "interventions_is_middle_idx" ON "interventions"("is_middle");

-- CreateIndex
CREATE INDEX "interventions_is_child_idx" ON "interventions"("is_child");

-- CreateIndex
CREATE UNIQUE INDEX "produits_code_produit_key" ON "produits"("code_produit");

-- CreateIndex
CREATE INDEX "produits_is_parent_idx" ON "produits"("is_parent");

-- CreateIndex
CREATE UNIQUE INDEX "factures_numero_ordre_key" ON "factures"("numero_ordre");

-- CreateIndex
CREATE INDEX "factures_numero_patient_idx" ON "factures"("numero_patient");

-- CreateIndex
CREATE INDEX "factures_date_visite_idx" ON "factures"("date_visite");

-- CreateIndex
CREATE INDEX "lignes_facture_numero_ordre_idx" ON "lignes_facture"("numero_ordre");

-- CreateIndex
CREATE INDEX "lignes_facture_code_intervention_idx" ON "lignes_facture"("code_intervention");

-- CreateIndex
CREATE INDEX "lignes_facture_code_produit_idx" ON "lignes_facture"("code_produit");

-- CreateIndex
CREATE INDEX "interventions_activite_numero_ordre_idx" ON "interventions_activite"("numero_ordre");

-- CreateIndex
CREATE INDEX "rendez_vous_numero_patient_idx" ON "rendez_vous"("numero_patient");

-- CreateIndex
CREATE INDEX "rendez_vous_date_rdv_idx" ON "rendez_vous"("date_rdv");

-- CreateIndex
CREATE INDEX "rendez_vous_statut_idx" ON "rendez_vous"("statut");

-- CreateIndex
CREATE INDEX "mouvements_stock_date_mouvement_idx" ON "mouvements_stock"("date_mouvement");

-- CreateIndex
CREATE INDEX "mouvements_stock_code_produit_idx" ON "mouvements_stock"("code_produit");

-- CreateIndex
CREATE INDEX "tarifs_personnalises_code_intervention_idx" ON "tarifs_personnalises"("code_intervention");

-- AddForeignKey
ALTER TABLE "user_logs" ADD CONSTRAINT "user_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_numero_patient_fkey" FOREIGN KEY ("numero_patient") REFERENCES "patients"("numero_patient") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_facture" ADD CONSTRAINT "lignes_facture_numero_ordre_fkey" FOREIGN KEY ("numero_ordre") REFERENCES "factures"("numero_ordre") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_facture" ADD CONSTRAINT "lignes_facture_code_intervention_fkey" FOREIGN KEY ("code_intervention") REFERENCES "interventions"("code_travail") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_facture" ADD CONSTRAINT "lignes_facture_code_produit_fkey" FOREIGN KEY ("code_produit") REFERENCES "produits"("code_produit") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions_activite" ADD CONSTRAINT "interventions_activite_code_intervention_fkey" FOREIGN KEY ("code_intervention") REFERENCES "interventions"("code_travail") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions_activite" ADD CONSTRAINT "interventions_activite_medecin_id_fkey" FOREIGN KEY ("medecin_id") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions_activite" ADD CONSTRAINT "interventions_activite_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_numero_patient_fkey" FOREIGN KEY ("numero_patient") REFERENCES "patients"("numero_patient") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_medecin_id_fkey" FOREIGN KEY ("medecin_id") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_stock" ADD CONSTRAINT "mouvements_stock_code_produit_fkey" FOREIGN KEY ("code_produit") REFERENCES "produits"("code_produit") ON DELETE RESTRICT ON UPDATE CASCADE;
