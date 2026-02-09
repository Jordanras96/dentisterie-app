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

  let stats = { patients: 0, interventions: 0, produits: 0, factures: 0, lignes: 0, skipped: 0 }

  try {
    // ============================================
    // 1. PATIENTS (55k+)
    // ============================================
    console.log('\n📋 Migration des patients...')
    const [patients] = await mysqlConnection.query('SELECT * FROM patient ORDER BY id')

    for (const p of patients as any[]) {
      try {
        await prisma.patient.upsert({
          where: { numeroPatient: p.numero_patient },
          update: {},
          create: {
            numeroPatient: p.numero_patient,
            nom: p.nom || 'INCONNU',
            dateNaissance: p.date_naissance || null,
            sexe: p.sexe || null,
            profession: p.profession || null,
            adresse: p.adresse || null,
            telephone: p.telephone || null,
            telephone2: p.telephone2 || null,
            derniereVisite: p.derniere_visite || null,
            dateCreation: p.date_creation || null,
            observations: p.observations || null,
          },
        })
        stats.patients++
      } catch (err: any) {
        console.warn(`  ⚠ Patient ${p.numero_patient} ignoré: ${err.message?.slice(0, 80)}`)
        stats.skipped++
      }
    }
    console.log(`✓ ${stats.patients} patients migrés`)

    // ============================================
    // 2. INTERVENTIONS / TRAVAUX (147)
    // ============================================
    console.log('\n🔧 Migration des interventions (travaux)...')
    const [interventions] = await mysqlConnection.query('SELECT * FROM travaux ORDER BY id')

    for (const i of interventions as any[]) {
      try {
        await prisma.intervention.upsert({
          where: { codeTravail: i.code_travail },
          update: {},
          create: {
            codeTravail: i.code_travail,
            libelle: i.libelle || '',
            prixPublic: i.prix_public || 0,
            prixPriseCharge: i.prix_prise_charge || 0,
            prixTiko: i.prix_tiko || 0,
            prixPersonnel: i.prix_personnel || 0,
            prixRetraite: i.prix_retraite || 0,
            produit1: i.produit1 || null,
            produit2: i.produit2 || null,
            produit3: i.produit3 || null,
            produit4: i.produit4 || null,
            produit5: i.produit5 || null,
            produit6: i.produit6 || null,
            produit7: i.produit7 || null,
            produit8: i.produit8 || null,
            produit9: i.produit9 || null,
            produit10: i.produit10 || null,
            isParent: i.is_parent === 1,
            isMiddle: i.is_middle === 1,
            isChild: i.is_child === 1,
          },
        })
        stats.interventions++
      } catch (err: any) {
        console.warn(`  ⚠ Intervention ${i.code_travail} ignorée: ${err.message?.slice(0, 80)}`)
        stats.skipped++
      }
    }
    console.log(`✓ ${stats.interventions} interventions migrées`)

    // ============================================
    // 3. PRODUITS (206)
    // ============================================
    console.log('\n📦 Migration des produits...')
    const [produits] = await mysqlConnection.query('SELECT * FROM produit ORDER BY id')

    for (const p of produits as any[]) {
      try {
        await prisma.produit.upsert({
          where: { codeProduit: p.code_produit },
          update: {},
          create: {
            codeProduit: p.code_produit,
            libelle: p.libelle || '',
            unite: p.unite || null,
            nbrUtil: p.nbr_util || 0,
            prixVte: p.prix_vte || 0,
            prixAchat: p.prix_achat || 0,
            prixPers: p.prix_pers || 0,
            prixRetraite: p.prix_retraite || 0,
            prixEnfcd: p.prix_enfcd || 0,
            categorieProduit: p.categorie_produit || null,
            isParent: p.is_parent === 1,
          },
        })
        stats.produits++
      } catch (err: any) {
        console.warn(`  ⚠ Produit ${p.code_produit} ignoré: ${err.message?.slice(0, 80)}`)
        stats.skipped++
      }
    }
    console.log(`✓ ${stats.produits} produits migrés`)

    // ============================================
    // 4. FACTURES / ACTI1 (4100)
    // Créer les patients orphelins d'abord
    // ============================================
    console.log('\n💰 Migration des factures (acti1)...')

    // Créer les patients manquants référencés par des factures
    const [orphanFactures] = await mysqlConnection.query(
      `SELECT DISTINCT a.numero_patient, a.nom_patient
       FROM acti1 a
       WHERE a.numero_patient NOT IN (SELECT numero_patient FROM patient)`
    )
    for (const orphan of orphanFactures as any[]) {
      try {
        await prisma.patient.upsert({
          where: { numeroPatient: orphan.numero_patient },
          update: {},
          create: {
            numeroPatient: orphan.numero_patient,
            nom: orphan.nom_patient || 'INCONNU',
          },
        })
        stats.patients++
        console.log(`  + Patient orphelin créé: ${orphan.numero_patient} (${orphan.nom_patient})`)
      } catch {
        // Ignore
      }
    }

    const [factures] = await mysqlConnection.query('SELECT * FROM acti1 ORDER BY id')

    for (const f of factures as any[]) {
      try {
        await prisma.facture.upsert({
          where: { numeroOrdre: f.numero_ordre },
          update: {},
          create: {
            numeroOrdre: f.numero_ordre,
            numeroPatient: f.numero_patient,
            nomPatient: f.nom_patient || 'INCONNU',
            dateVisite: f.date_visite || new Date(),
            typePatient: f.type_patient || 1,
            assurance: f.assurance || null,
            montantTotal: f.montant_total || 0,
          },
        })
        stats.factures++
      } catch (err: any) {
        console.warn(`  ⚠ Facture ${f.numero_ordre} ignorée: ${err.message?.slice(0, 80)}`)
        stats.skipped++
      }
    }
    console.log(`✓ ${stats.factures} factures migrées`)

    // ============================================
    // 5. LIGNES DE FACTURE / ACTI2 (28k+)
    // code_intervention dans acti2 = numéro brut
    // → I{code} dans travaux, P{code} dans produit
    // ============================================
    console.log('\n📄 Migration des lignes de facture (acti2)...')

    // Charger les sets de codes existants pour le mapping
    const travauxCodes = new Set((interventions as any[]).map((i: any) => i.code_travail))
    const produitCodes = new Set((produits as any[]).map((p: any) => p.code_produit))
    const factureOrdres = new Set((factures as any[]).map((f: any) => f.numero_ordre))

    const [lignes] = await mysqlConnection.query('SELECT * FROM acti2 ORDER BY id')

    for (const l of lignes as any[]) {
      // Vérifier que la facture existe
      if (!factureOrdres.has(l.numero_ordre)) {
        stats.skipped++
        continue
      }

      const code = l.code_intervention?.toString() || ''
      const codeI = `I${code}`
      const codeP = `P${code}`

      let codeIntervention: string | null = null
      let codeProduit: string | null = null

      if (travauxCodes.has(codeI)) {
        codeIntervention = codeI
      } else if (produitCodes.has(codeP)) {
        codeProduit = codeP
      }
      // Si ni travaux ni produit trouvé, on insère quand même sans FK

      try {
        await prisma.ligneFacture.create({
          data: {
            numeroOrdre: l.numero_ordre,
            codeIntervention,
            codeProduit,
            quantite: l.quantite || 1,
            prixUnitaire: l.prix_unitaire || 0,
            montant: l.montant_total || 0,
          },
        })
        stats.lignes++
      } catch (err: any) {
        console.warn(`  ⚠ Ligne acti2 #${l.id} ignorée: ${err.message?.slice(0, 80)}`)
        stats.skipped++
      }
    }
    console.log(`✓ ${stats.lignes} lignes de facture migrées`)

    // ============================================
    // 6. PARAMÈTRES
    // ============================================
    console.log('\n⚙️  Migration des paramètres...')
    const [params] = await mysqlConnection.query('SELECT * FROM param LIMIT 1')
    if ((params as any[]).length > 0) {
      const par = (params as any[])[0]
      await prisma.parametre.upsert({
        where: { id: 1 },
        update: {
          nomEtablissement: (par.nom_etablissement || '').trim(),
          adresse: (par.adresse || '').trim(),
          telephone: (par.telephone || '').trim(),
        },
        create: {
          nomEtablissement: (par.nom_etablissement || '').trim(),
          adresse: (par.adresse || '').trim(),
          telephone: (par.telephone || '').trim(),
        },
      })
    }
    console.log('✓ Paramètres migrés')

    // ============================================
    // RÉSUMÉ
    // ============================================
    console.log('\n================================')
    console.log('✅ Migration terminée!')
    console.log(`   Patients:       ${stats.patients}`)
    console.log(`   Interventions:  ${stats.interventions}`)
    console.log(`   Produits:       ${stats.produits}`)
    console.log(`   Factures:       ${stats.factures}`)
    console.log(`   Lignes facture: ${stats.lignes}`)
    console.log(`   Ignorés:        ${stats.skipped}`)

  } catch (error) {
    console.error('❌ Erreur de migration:', error)
    throw error
  } finally {
    await mysqlConnection.end()
    await prisma.$disconnect()
  }
}

main()
