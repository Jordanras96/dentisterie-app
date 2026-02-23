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
  intervention?: {
    codeTravail: string
    libelle: string
    isParent: boolean
    isMiddle: boolean
    isChild: boolean
  } | null
  produit?: { codeProduit: string; libelle: string } | null
}

interface FactureData {
  numeroOrdre: string
  numeroPatient: string
  nomPatient: string
  dateVisite: string
  typePatient: number
  montantTotal: string | number
  lignes: LigneFacture[]
}

export interface InterventionTree {
  tree: {
    codeTravail: string
    libelle: string
    children: {
      codeTravail: string
      libelle: string
      children: { codeTravail: string; libelle: string }[]
    }[]
    directChildren: { codeTravail: string; libelle: string }[]
  }[]
  orphans: { codeTravail: string; libelle: string }[]
}

// ============ Helpers ============

const typeLabels: Record<number, string> = {
  1: 'Public',
  2: 'Personnel',
  3: 'Retraite',
  4: 'TIKO',
  5: 'Prise en charge',
  6: 'Enf CD',
}

const fmtNum = (v: string | number) => Number(v).toLocaleString('fr-FR')

function groupByParent(
  lignes: LigneFacture[],
  tree: InterventionTree,
) {
  const parentMap = new Map(tree.tree.map((p) => [p.codeTravail, p]))
  const parentCodes = [...parentMap.keys()]

  const groups: { code: string; label: string; total: number; lines: LigneFacture[] }[] = []
  const groupIdx = new Map<string, number>()
  const orphanLines: LigneFacture[] = []
  const productLines: LigneFacture[] = []

  for (const l of lignes) {
    if (l.codeProduit) {
      productLines.push(l)
      continue
    }
    if (!l.codeIntervention) {
      orphanLines.push(l)
      continue
    }
    const pc = parentCodes.find((c) => l.codeIntervention!.startsWith(c))
    if (pc) {
      if (!groupIdx.has(pc)) {
        groupIdx.set(pc, groups.length)
        groups.push({ code: pc, label: parentMap.get(pc)!.libelle, total: 0, lines: [] })
      }
      const g = groups[groupIdx.get(pc)!]
      g.total += Number(l.montant)
      g.lines.push(l)
    } else {
      orphanLines.push(l)
    }
  }

  return {
    groups,
    orphanLines,
    productLines,
    totalProducts: productLines.reduce((s, l) => s + Number(l.montant), 0),
    totalOrphans: orphanLines.reduce((s, l) => s + Number(l.montant), 0),
  }
}

function drawDashedLine(doc: jsPDF, x: number, y1: number, y2: number) {
  const dash = 2, gap = 2
  let y = y1
  while (y < y2) {
    const end = Math.min(y + dash, y2)
    doc.line(x, y, x, end)
    y = end + gap
  }
}

// ============================================================
// FACTURE SIMPLE — 2 colonnes identiques (comme createFactPDF)
// ============================================================

export async function generateFactureSimplePdf(
  facture: FactureData,
  tree: InterventionTree,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 9, gap = 10
  const colW = (pageW - 2 * margin - gap) / 2

  const { groups, totalProducts, totalOrphans } = groupByParent(facture.lignes, tree)
  const total = Number(facture.montantTotal)

  const dateStr = format(new Date(facture.dateVisite), 'dd/MM/yyyy', { locale: fr })
  const timeStr = format(new Date(), 'HH:mm')
  const year = new Date(facture.dateVisite).getFullYear()
  const factTitle = `FACTURE CAISSE - N\u00B0 ${String(year).slice(2)}/${facture.numeroOrdre}`
  const somme = numberToLetters(total)
  const sommeLettre = somme.charAt(0).toUpperCase() + somme.slice(1) + ' Ariary'

  // Build table body
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableBody: any[][] = []
  for (const g of groups) {
    tableBody.push([`- ${g.label}`, fmtNum(g.total)])
  }
  if (totalProducts > 0) tableBody.push(['- Produits', fmtNum(totalProducts)])
  if (totalOrphans > 0) tableBody.push(['- Divers', fmtNum(totalOrphans)])
  tableBody.push([
    { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } },
    { content: `${fmtNum(total)} Ar`, styles: { fontStyle: 'bold', halign: 'right' as const, fillColor: [230, 230, 230] } },
  ])

  function drawColumn(xB: number) {
    let y = 10
    doc.setDrawColor(0)
    doc.setLineWidth(0.25)

    // Box 1 — Nom hôpital
    const hospH = 5.5
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.rect(xB, y, colW, hospH)
    doc.text('HOPITALY LOTERANA ANDRANOMADIO', xB + colW / 2, y + hospH / 2, { align: 'center', baseline: 'middle' })
    y += hospH

    // Box 2 — Stat | NIF
    const statH = 4.5
    doc.setFontSize(5.5)
    doc.setFont('helvetica', 'normal')
    doc.rect(xB, y, colW / 2, statH)
    doc.text('Stat n\u00B0 85113 12 200 60 00614', xB + colW / 4, y + statH / 2, { align: 'center', baseline: 'middle' })
    doc.rect(xB + colW / 2, y, colW / 2, statH)
    doc.text('NIF n\u00B0 20000038126', xB + 3 * colW / 4, y + statH / 2, { align: 'center', baseline: 'middle' })
    y += statH

    // Box 3 — Titre facture
    const titleH = 6
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.rect(xB, y, colW, titleH)
    doc.text(factTitle, xB + colW / 2, y + titleH / 2, { align: 'center', baseline: 'middle' })
    y += titleH

    // Box 4 — Date | Caissier
    const dateH = 4.5
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.rect(xB, y, colW / 2, dateH)
    doc.text(`${dateStr} -- ${timeStr}`, xB + colW / 4, y + dateH / 2, { align: 'center', baseline: 'middle' })
    doc.rect(xB + colW / 2, y, colW / 2, dateH)
    doc.text('CAISSIER : -', xB + 3 * colW / 4, y + dateH / 2, { align: 'center', baseline: 'middle' })
    y += dateH

    // Infos patient
    y += 3
    doc.setFontSize(7)
    doc.text('DEP : Dentisterie', xB + colW / 2, y, { align: 'center' })
    y += 3.5
    doc.text(`Patient: ${facture.numeroPatient}`, xB + colW / 2, y, { align: 'center' })
    y += 3.5
    doc.setFont('helvetica', 'bold')
    doc.text(facture.nomPatient.toUpperCase(), xB + colW / 2, y, { align: 'center' })
    y += 3.5
    doc.setFont('helvetica', 'normal')
    doc.text('-', xB + colW / 2, y, { align: 'center' })
    y += 4

    // Tableau
    autoTable(doc, {
      startY: y,
      margin: { left: xB, right: pageW - (xB + colW) },
      head: [['D\u00E9signation des actes', 'Montant']],
      body: tableBody,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [80, 80, 80], fontSize: 7 },
      columnStyles: { 0: { cellWidth: colW * 3 / 4 }, 1: { halign: 'right', cellWidth: colW / 4 } },
      theme: 'grid',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = ((doc as any).lastAutoTable?.finalY ?? y + 30) + 3

    // Somme en lettres
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('Soit la somme de:', xB, y)
    doc.setFont('helvetica', 'normal')
    y += 3.5
    doc.text(sommeLettre, xB, y, { maxWidth: colW })

    // Paiement
    y += 7
    doc.setFont('helvetica', 'bold')
    doc.text('Paiement:', xB, y)
    doc.setFont('helvetica', 'normal')
    doc.text(typeLabels[facture.typePatient] || 'Public', xB + 22, y)

    return y
  }

  const y1 = drawColumn(margin)
  const y2 = drawColumn(margin + colW + gap)

  // Ligne pointillée au milieu
  doc.setLineWidth(0.3)
  drawDashedLine(doc, pageW / 2, 8, Math.max(y1, y2) + 5)

  // Pied de page
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.text(`H\u00F4pital Andranomadio ${new Date().getFullYear()}`, pageW / 2, pageH - 5, { align: 'center' })

  await savePdf(doc, `Facture_${facture.numeroOrdre}_simple.pdf`)
}

// ============================================================
// FACTURE DETAILLEE (comme createDetFacturePDF)
// ============================================================

export async function generateFactureDetailPdf(
  facture: FactureData,
  tree: InterventionTree,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const mg = 15

  const year = new Date(facture.dateVisite).getFullYear()
  const dateStr = format(new Date(facture.dateVisite), 'dd/MM/yyyy', { locale: fr })
  const total = Number(facture.montantTotal)
  const somme = numberToLetters(total)
  const sommeLettre = somme.charAt(0).toUpperCase() + somme.slice(1) + ' Ariary'

  // Pied de page
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(`H\u00F4pital Andranomadio ${new Date().getFullYear()}`, pageW / 2, pageH - 5, { align: 'center' })

  // -------- EN-TETE GAUCHE --------
  let y = mg
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('HOPITALY LOTERANA', mg, y + 5)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const addr = 'Andranomadio - Antsirabe'
  doc.text(addr, mg, y + 10)
  const addrW = doc.getTextWidth(addr)
  doc.line(mg, y + 11, mg + addrW, y + 11)

  doc.setFontSize(8)
  y += 16
  doc.text('Stat n\u00B0 85113 12 200 60 00614', mg, y)
  y += 4
  doc.text('NIF n\u00B0 20000038126', mg, y)

  // -------- EN-TETE DROITE — Boîtes --------
  doc.setLineWidth(0.3)
  const boxW = 95
  const boxX = pageW - boxW - mg
  const boxY = mg

  // Titre
  const tH = 8
  doc.rect(boxX, boxY, boxW, tH)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('ORDONNANCE ET FACTURE', boxX + boxW / 2, boxY + tH / 2, { align: 'center', baseline: 'middle' })

  // N° | Date
  const nH = 6
  doc.setFontSize(8)
  doc.rect(boxX, boxY + tH, boxW / 2, nH)
  doc.text(`N\u00B0 ${String(year).slice(2)}/${facture.numeroOrdre}`, boxX + 3, boxY + tH + nH / 2, { baseline: 'middle' })
  doc.rect(boxX + boxW / 2, boxY + tH, boxW / 2, nH)
  doc.text(dateStr, boxX + boxW / 2 + 3, boxY + tH + nH / 2, { baseline: 'middle' })

  // Patient
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('Patient :', mg, y)
  const pw = doc.getTextWidth('Patient :')
  doc.line(mg, y + 0.5, mg + pw, y + 0.5)
  doc.setFont('helvetica', 'normal')
  y += 4
  doc.text(facture.nomPatient.toUpperCase(), mg, y)

  // -------- TABLEAU --------
  y += 10
  const usableW = pageW - 2 * mg

  // Construction données hiérarchiques
  const lineByCode = new Map<string, LigneFacture[]>()
  const prodLines: LigneFacture[] = []
  for (const l of facture.lignes) {
    if (l.codeProduit) { prodLines.push(l); continue }
    if (!l.codeIntervention) continue
    const arr = lineByCode.get(l.codeIntervention) || []
    arr.push(l)
    lineByCode.set(l.codeIntervention, arr)
  }

  const usedCodes = new Set<string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any[][] = []

  for (const parent of tree.tree) {
    const sectionRows: typeof body = []

    // Enfants directs du parent
    for (const dc of parent.directChildren) {
      const lines = lineByCode.get(dc.codeTravail)
      if (!lines) continue
      for (const l of lines) {
        sectionRows.push([`    ${dc.libelle}`, String(l.quantite), `${fmtNum(l.montant)} Ar`])
        usedCodes.add(dc.codeTravail)
      }
    }

    // Sous-parents (middles) et leurs enfants
    for (const mid of parent.children) {
      const midRows: typeof body = []

      // Enfants du sous-parent
      for (const ch of mid.children) {
        const lines = lineByCode.get(ch.codeTravail)
        if (!lines) continue
        for (const l of lines) {
          midRows.push([`        ${ch.libelle}`, String(l.quantite), `${fmtNum(l.montant)} Ar`])
          usedCodes.add(ch.codeTravail)
        }
      }

      // Le sous-parent lui-même facturé directement
      const midLines = lineByCode.get(mid.codeTravail)
      if (midLines) {
        for (const l of midLines) {
          midRows.push([`      ${mid.libelle}`, String(l.quantite), `${fmtNum(l.montant)} Ar`])
          usedCodes.add(mid.codeTravail)
        }
      }

      if (midRows.length > 0) {
        sectionRows.push([
          { content: `  --- ${mid.libelle} ---`, styles: { fontStyle: 'italic', textColor: [80, 80, 80] } },
          { content: '', styles: {} },
          { content: '', styles: {} },
        ])
        sectionRows.push(...midRows)
      }
    }

    // Le parent lui-même facturé directement
    const parentLines = lineByCode.get(parent.codeTravail)
    if (parentLines) {
      for (const l of parentLines) {
        sectionRows.push([`    ${parent.libelle}`, String(l.quantite), `${fmtNum(l.montant)} Ar`])
        usedCodes.add(parent.codeTravail)
      }
    }

    if (sectionRows.length > 0) {
      body.push([
        { content: `----- ${parent.libelle} -----`, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
        { content: '', styles: { fillColor: [245, 245, 245] } },
        { content: '', styles: { fillColor: [245, 245, 245] } },
      ])
      body.push(...sectionRows)
    }
  }

  // Orphelins
  const orphans = facture.lignes.filter(
    (l) => l.codeIntervention && !usedCodes.has(l.codeIntervention),
  )
  if (orphans.length > 0) {
    body.push([
      { content: '----- Divers -----', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
      { content: '', styles: { fillColor: [245, 245, 245] } },
      { content: '', styles: { fillColor: [245, 245, 245] } },
    ])
    for (const l of orphans) {
      body.push([`    ${l.intervention?.libelle || '-'}`, String(l.quantite), `${fmtNum(l.montant)} Ar`])
    }
  }

  // Produits
  if (prodLines.length > 0) {
    body.push([
      { content: '----- Produits -----', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } },
      { content: '', styles: { fillColor: [245, 245, 245] } },
      { content: '', styles: { fillColor: [245, 245, 245] } },
    ])
    for (const l of prodLines) {
      body.push([`    ${l.produit?.libelle || '-'}`, String(l.quantite), `${fmtNum(l.montant)} Ar`])
    }
  }

  // TOTAL
  body.push([
    { content: 'TOTAL', styles: { fontStyle: 'bold', fontSize: 10, fillColor: [230, 230, 230] } },
    { content: '', styles: { fillColor: [230, 230, 230] } },
    { content: `${fmtNum(total)} Ar`, styles: { fontStyle: 'bold', halign: 'right', fontSize: 10, fillColor: [230, 230, 230] } },
  ])

  autoTable(doc, {
    startY: y,
    margin: { left: mg, right: mg },
    head: [['DESIGNATION', 'QTE', 'MONTANT']],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [80, 80, 80], textColor: 255, fontSize: 8 },
    columnStyles: {
      0: { cellWidth: usableW - 20 - 35 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 35 },
    },
    theme: 'grid',
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = ((doc as any).lastAutoTable?.finalY ?? y + 30) + 6

  // Somme en lettres
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const sLabel = 'Sois la somme de :'
  doc.text(sLabel, mg, y)
  const sW = doc.getTextWidth(sLabel)
  doc.line(mg, y + 0.5, mg + sW, y + 0.5)
  doc.text(sommeLettre, mg + sW + 3, y, { maxWidth: usableW - sW - 5 })

  // Signature
  y += 15
  doc.setFont('helvetica', 'bold')
  doc.text('Le M\u00E9decin Chef,', mg + 10, y)

  await savePdf(doc, `Facture_${facture.numeroOrdre}_detaillee.pdf`)
}
