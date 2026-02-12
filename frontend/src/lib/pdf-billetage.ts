import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { savePdf } from './pdf-save'
import { numberToLetters } from './number-to-letters'

// ============ Types ============

interface LigneFacture {
  id: number
  codeIntervention: string | null
  codeProduit: string | null
  quantite: number
  prixUnitaire: string | number
  montant: string | number
}

interface Facture {
  id: number
  numeroOrdre: string
  nomPatient: string
  numeroPatient: string
  dateVisite: string
  montantTotal: string | number
  typePatient: number
  lignes: LigneFacture[]
}

interface Denomination {
  value: number
  label: string
}

interface ParentIntervention {
  codeTravail: string
  libelle: string
}

const fmtNum = (v: number) => v.toLocaleString('fr-FR')

const TARIF_COLS = [
  { key: 1, label: 'Public' },
  { key: 5, label: 'Prise en ch.' },
  { key: 4, label: 'TIKO' },
  { key: 2, label: 'Personnel' },
  { key: 3, label: 'Retraite' },
  { key: 6, label: 'Enf CD' },
]

// ============================================================
// RAPPORT DE VERSEMENT (comme createRapportVT) — Landscape
// ============================================================

export async function generateBilletagePdf(
  factures: Facture[],
  counts: Record<number, number>,
  denominations: Denomination[],
  dateDebut: string,
  dateFin: string,
  parentInterventions: ParentIntervention[],
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth() // 297
  const pageH = doc.internal.pageSize.getHeight() // 210
  const mg = 10

  const totalFactures = factures.reduce((s, f) => s + Number(f.montantTotal), 0)
  const totalBilletage = denominations.reduce((s, d) => s + d.value * (counts[d.value] || 0), 0)

  const dateValue =
    dateDebut === dateFin
      ? format(new Date(dateDebut), 'dd MMMM yyyy', { locale: fr })
      : `${format(new Date(dateDebut), 'dd/MM/yyyy')} au ${format(new Date(dateFin), 'dd/MM/yyyy')}`

  // Pied de page
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(`H\u00F4pital Andranomadio ${new Date().getFullYear()}`, pageW / 2, pageH - 5, { align: 'center' })

  // --------- EN-TETE ---------
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  let y = mg
  doc.text('HOPITALY LOTERANA - ANDRANOMADIO', mg, y + 3)
  const ul = doc.getTextWidth('HOPITALY LOTERANA - ANDRANOMADIO')
  doc.line(mg, y + 4, mg + ul, y + 4)

  doc.text('RAPPORT DE VERSEMENT JOURNALIER', pageW / 2, y + 3, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const dlabel = 'Journ\u00E9e du : '
  const dlW = doc.getTextWidth(dlabel)
  doc.text(dlabel, pageW - mg - dlW - doc.getTextWidth(dateValue), y + 3)
  doc.text(dateValue, pageW - mg - doc.getTextWidth(dateValue), y + 3)

  y += 6
  doc.setLineWidth(0.4)
  doc.line(mg, y, pageW - mg, y)

  // --------- BILLETAGE TABLE (gauche) ---------
  y += 6
  const billStartY = y

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const billBody: any[][] = denominations
    .filter((d) => (counts[d.value] || 0) > 0)
    .map((d) => [
      String(counts[d.value] || ''),
      d.label,
      fmtNum(d.value * (counts[d.value] || 0)),
    ])

  autoTable(doc, {
    startY: y,
    margin: { left: mg, right: pageW - mg - 75 },
    head: [['Nbr', 'Billets', 'Montant']],
    body: billBody,
    styles: { fontSize: 7, cellPadding: 1.2 },
    headStyles: { fillColor: [80, 80, 80], fontSize: 7 },
    columnStyles: {
      0: { halign: 'right', cellWidth: 15 },
      1: { halign: 'right', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 30 },
    },
    theme: 'grid',
    tableWidth: 70,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let billEndY = ((doc as any).lastAutoTable?.finalY ?? y + 40) + 2

  // TOTAL ESP sous billetage
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL ESP', mg, billEndY + 3)
  doc.setFont('helvetica', 'normal')
  doc.text(fmtNum(totalBilletage), mg + 55, billEndY + 3, { align: 'right' })

  // --------- INFOS AU MILIEU ---------
  const xMid = mg + 85
  let yInfo = billStartY

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Total Billetage', xMid, yInfo)
  doc.setFont('helvetica', 'normal')
  doc.text(`${fmtNum(totalBilletage)} Ar`, xMid + 55, yInfo)

  yInfo += 5
  doc.setFont('helvetica', 'bold')
  doc.text('Total Factures', xMid, yInfo)
  doc.setFont('helvetica', 'normal')
  doc.text(`${fmtNum(totalFactures)} Ar`, xMid + 55, yInfo)

  yInfo += 5
  doc.setFont('helvetica', 'bold')
  doc.text('Diff\u00E9rence', xMid, yInfo)
  doc.setFont('helvetica', 'normal')
  const diff = totalBilletage - totalFactures
  doc.text(`${diff >= 0 ? '+' : ''}${fmtNum(diff)} Ar`, xMid + 55, yInfo)

  // Montant versé en lettres
  yInfo += 10
  doc.setFont('helvetica', 'normal')
  doc.text('Montant vers\u00E9 (en toute lettre) :', xMid, yInfo)
  yInfo += 3
  const versLettre = numberToLetters(totalBilletage).toUpperCase()
  doc.setLineWidth(0.3)
  doc.rect(xMid, yInfo, 100, 12)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text(versLettre, xMid + 2, yInfo + 4, { maxWidth: 96 })

  // OBSERVATION
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('OBSERVATION', xMid + 110, yInfo - 3)
  doc.rect(xMid + 110, yInfo, 80, 12)

  // --------- TABLE REPARTITION PAR INTERVENTION ET PAR TARIF ---------
  const repY = Math.max(billEndY + 12, yInfo + 20)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('R\u00E9partition par intervention et par tarif', mg, repY)

  // Build repartition data
  const parentCodes = parentInterventions.map((p) => p.codeTravail)
  const parentLabels = new Map(parentInterventions.map((p) => [p.codeTravail, p.libelle]))

  // Accumulate: repartition[parentCode][typePatient] = sum of amounts
  const rep: Record<string, Record<number, number>> = {}
  for (const pc of parentCodes) rep[pc] = {}
  rep['_PRODUITS'] = {}

  for (const f of factures) {
    for (const l of f.lignes) {
      if (l.codeProduit) {
        rep['_PRODUITS'][f.typePatient] = (rep['_PRODUITS'][f.typePatient] || 0) + Number(l.montant)
        continue
      }
      if (!l.codeIntervention) continue
      const pc = parentCodes.find((c) => l.codeIntervention!.startsWith(c))
      if (pc) {
        rep[pc][f.typePatient] = (rep[pc][f.typePatient] || 0) + Number(l.montant)
      }
    }
  }

  // Build table
  const repHead = ['DESIGNATION', ...TARIF_COLS.map((c) => c.label), 'TOTAL']

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repBody: any[][] = []

  // Intervention parents rows
  for (const pc of parentCodes) {
    const row: (string | { content: string; styles: object })[] = [parentLabels.get(pc) || pc]
    let rowTotal = 0
    for (const tc of TARIF_COLS) {
      const v = rep[pc][tc.key] || 0
      rowTotal += v
      row.push(v ? fmtNum(v) : '-')
    }
    row.push(rowTotal ? fmtNum(rowTotal) : '-')
    if (rowTotal > 0) repBody.push(row)
  }

  // Produits row
  {
    const row: string[] = ['Produits']
    let rowTotal = 0
    for (const tc of TARIF_COLS) {
      const v = rep['_PRODUITS'][tc.key] || 0
      rowTotal += v
      row.push(v ? fmtNum(v) : '-')
    }
    row.push(rowTotal ? fmtNum(rowTotal) : '-')
    if (rowTotal > 0) repBody.push(row)
  }

  // TOTAL row
  {
    const totRow: (string | { content: string; styles: object })[] = [
      { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } },
    ]
    let grandTotal = 0
    for (const tc of TARIF_COLS) {
      let colSum = 0
      for (const pc of [...parentCodes, '_PRODUITS']) colSum += rep[pc][tc.key] || 0
      grandTotal += colSum
      totRow.push({ content: colSum ? fmtNum(colSum) : '-', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } })
    }
    totRow.push({ content: grandTotal ? fmtNum(grandTotal) : '-', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } })
    repBody.push(totRow)
  }

  const colCount = TARIF_COLS.length + 2 // designation + tarifs + total
  const desW = 55
  const totW = 30
  const tarColW = (pageW - 2 * mg - desW - totW) / TARIF_COLS.length

  const colStyles: Record<number, object> = { 0: { cellWidth: desW } }
  for (let i = 0; i < TARIF_COLS.length; i++) {
    colStyles[i + 1] = { halign: 'right', cellWidth: tarColW }
  }
  colStyles[colCount - 1] = { halign: 'right', cellWidth: totW, fontStyle: 'bold' }

  autoTable(doc, {
    startY: repY + 3,
    margin: { left: mg, right: mg },
    head: [repHead],
    body: repBody,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [80, 80, 80], textColor: 255, fontSize: 7 },
    columnStyles: colStyles,
    theme: 'grid',
  })

  const dateSlug = dateDebut === dateFin ? dateDebut : `${dateDebut}_${dateFin}`
  await savePdf(doc, `Rapport_${dateSlug}.pdf`)
}
