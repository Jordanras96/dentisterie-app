import type { jsPDF } from 'jspdf'

export async function savePdf(doc: jsPDF, _defaultFileName: string): Promise<void> {
  const blob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)

  const printWindow = window.open(url, '_blank')
  if (!printWindow) {
    URL.revokeObjectURL(url)
    throw new Error('Impossible d\'ouvrir la fenêtre d\'impression')
  }
}
