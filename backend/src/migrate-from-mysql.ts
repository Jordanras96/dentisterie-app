import { PrismaClient } from '@prisma/client'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

const mysqlConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  database: 'hopital_base_dentisterie',
}

async function main() {
  console.log('🔄 Migration MySQL → PostgreSQL')
  console.log('================================\n')

  const mysqlConnection = await mysql.createConnection(mysqlConfig)
  console.log('✓ Connecté à MySQL')

  try {
    // 1. Migrer les patients
    console.log('\n📋 Migration des patients...')
    const [patients] = await mysqlConnection.query('SELECT * FROM patient')
    
    for (const p of patients as any[]) {
      await prisma.patient.upsert({
        where: { numeroPatient: p.numero_patient },
        update: {},
        create: {
          numeroPatient: p.numero_patient,
          nom: p.nom,
          dateNaissance: p.date_naissance,
          sexe: p.sexe,
          profession: p.profession,
          adresse: p.adresse,
          telephone: p.telephone,
          telephone2: p.telephone2,
          derniereVisite: p.derniere_visite,
          dateCreation: p.date_creation,
          observations: p.observations,
        },
      })
    }
    console.log(`✓ ${(patients as any[]).length} patients migrés`)

    // 2. Migrer les interventions
    console.log('\n🔧 Migration des interventions...')
    const [interventions] = await mysqlConnection.query('SELECT * FROM travaux')
    
    for (const i of interventions as any[]) {
      await prisma.intervention.upsert({
        where: { codeTravail: i.code_travail },
        update: {},
        create: {
          codeTravail: i.code_travail,
          libelle: i.libelle,
          prixPublic: i.prix_public,
          prixPriseCharge: i.prix_prise_charge,
          prixTiko: i.prix_tiko,
          prixPersonnel: i.prix_personnel,
          prixRetraite: i.prix_retraite,
          produit1: i.produit1,
          produit2: i.produit2,
          produit3: i.produit3,
          produit4: i.produit4,
          produit5: i.produit5,
          produit6: i.produit6,
          produit7: i.produit7,
          produit8: i.produit8,
          produit9: i.produit9,
          produit10: i.produit10,
          isParent: i.is_parent === 1,
          isMiddle: i.is_middle === 1,
          isChild: i.is_child === 1,
        },
      })
    }
    console.log(`✓ ${(interventions as any[]).length} interventions migrées`)

    // 3. Migrer les produits
    console.log('\n📦 Migration des produits...')
    const [produits] = await mysqlConnection.query('SELECT * FROM produit')
    
    for (const p of produits as any[]) {
      await prisma.produit.upsert({
        where: { codeProduit: p.code_produit },
        update: {},
        create: {
          codeProduit: p.code_produit,
          libelle: p.libelle,
          unite: p.unite,
          nbrUtil: p.nbr_util || 0,
          prixVte: p.prix_vte || 0,
          prixAchat: p.prix_achat || 0,
          prixPers: p.prix_pers || 0,
          prixRetraite: p.prix_retraite || 0,
          prixEnfcd: p.prix_enfcd || 0,
          categorieProduit: p.categorie_produit,
          isParent: p.is_parent === 1,
        },
      })
    }
    console.log(`✓ ${(produits as any[]).length} produits migrés`)

    // 4. Migrer les factures (acti1)
    console.log('\n💰 Migration des factures...')
    const [factures] = await mysqlConnection.query('SELECT * FROM acti1 LIMIT 1000')
    
    for (const f of factures as any[]) {
      await prisma.facture.upsert({
        where: { numeroOrdre: f.numero_ordre },
        update: {},
        create: {
          numeroOrdre: f.numero_ordre,
          numeroPatient: f.numero_patient,
          nomPatient: f.nom_patient,
          dateVisite: f.date_visite || new Date(),
          typePatient: f.type_patient || 1,
          assurance: f.assurance,
          montantTotal: 0,
        },
      })
    }
    console.log(`✓ ${(factures as any[]).length} factures migrées`)

    // 5. Migrer les lignes de facture (acti2)
    console.log('\n📄 Migration des lignes de facture...')
    const [lignes] = await mysqlConnection.query('SELECT * FROM acti2 LIMIT 5000')
    
    for (const l of lignes as any[]) {
      const isIntervention = l.code_intervention && !l.code_intervention.match(/^[6-9]/)
      
      await prisma.ligneFacture.create({
        data: {
          numeroOrdre: l.numero_ordre,
          codeIntervention: isIntervention ? `I${l.code_intervention}` : null,
          codeProduit: !isIntervention ? `P${l.code_intervention}` : null,
          quantite: l.quantite || 1,
          prixUnitaire: 0,
          montant: 0,
        },
      })
    }
    console.log(`✓ ${(lignes as any[]).length} lignes de facture migrées`)

    console.log('\n✅ Migration terminée avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur de migration:', error)
    throw error
  } finally {
    await mysqlConnection.end()
    await prisma.$disconnect()
  }
}

main()
