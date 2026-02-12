'use client'

import { useState, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Printer, Banknote, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { generateBilletagePdf } from '@/lib/pdf-billetage'

interface LigneFacture {
  id: number
  codeIntervention: string | null
  codeProduit: string | null
  quantite: number
  prixUnitaire: string | number
  montant: string | number
  intervention?: { codeTravail: string; libelle: string; isParent: boolean; isMiddle: boolean; isChild: boolean } | null
  produit?: { codeProduit: string; libelle: string } | null
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

const DENOMINATIONS = [
  { value: 20000, label: '20 000 Ar' },
  { value: 10000, label: '10 000 Ar' },
  { value: 5000, label: '5 000 Ar' },
  { value: 2000, label: '2 000 Ar' },
  { value: 1000, label: '1 000 Ar' },
  { value: 500, label: '500 Ar' },
  { value: 200, label: '200 Ar' },
  { value: 100, label: '100 Ar' },
  { value: 50, label: '50 Ar' },
  { value: 20, label: '20 Ar' },
  { value: 10, label: '10 Ar' },
  { value: 5, label: '5 Ar' },
  { value: 2, label: '2 Ar' },
  { value: 1, label: '1 Ar' },
]

export default function BilletagePage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [dateDebut, setDateDebut] = useState(today)
  const [dateFin, setDateFin] = useState(today)
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(false)
  const [counts, setCounts] = useState<Record<number, number>>(
    Object.fromEntries(DENOMINATIONS.map(d => [d.value, 0]))
  )

  const fetchFactures = useCallback(async () => {
    setLoading(true)
    try {
      const result = await trpc.facture.list.query({
        page: 1,
        limit: 1000,
        dateDebut: dateDebut || undefined,
        dateFin: dateFin || undefined,
      })
      setFactures(result.data as unknown as Facture[])
    } catch {
      toast.error('Erreur lors du chargement des factures')
    } finally {
      setLoading(false)
    }
  }, [dateDebut, dateFin])

  const totalFactures = factures.reduce((s, f) => s + Number(f.montantTotal), 0)
  const totalBilletage = DENOMINATIONS.reduce((s, d) => s + d.value * (counts[d.value] || 0), 0)
  const difference = totalBilletage - totalFactures

  const handlePrint = async () => {
    try {
      const parents = await trpc.intervention.list.query({ type: 'parent' as const })
      await generateBilletagePdf(
        factures,
        counts,
        DENOMINATIONS,
        dateDebut,
        dateFin,
        parents as unknown as { codeTravail: string; libelle: string }[],
      )
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la generation du PDF')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Banknote className="h-6 w-6" /> Billetage
          </h1>
          <p className="text-muted-foreground">Comptage de caisse et rapport journalier</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={factures.length === 0}>
            <Printer className="mr-2 h-4 w-4" />Imprimer le rapport
          </Button>
        </div>
      </div>

      {/* Date range + load */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Date début</Label>
              <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-44" />
            </div>
            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-44" />
            </div>
            <Button onClick={fetchFactures} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Charger les factures
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Billetage input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comptage des coupures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {DENOMINATIONS.map((d) => (
                <div key={d.value} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-right">{d.label}</span>
                  <span className="text-muted-foreground">×</span>
                  <Input
                    type="number"
                    min={0}
                    value={counts[d.value] || ''}
                    onChange={(e) => setCounts({ ...counts, [d.value]: parseInt(e.target.value) || 0 })}
                    className="w-24"
                    placeholder="0"
                  />
                  <span className="text-sm text-muted-foreground w-28 text-right">
                    = {(d.value * (counts[d.value] || 0)).toLocaleString()} Ar
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">Total billetage</p>
              <p className="text-2xl font-bold">{totalBilletage.toLocaleString()} Ar</p>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Nombre de factures</span>
                <span className="text-lg font-semibold">{factures.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total factures</span>
                <span className="text-lg font-semibold">{totalFactures.toLocaleString()} Ar</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total billetage</span>
                <span className="text-lg font-semibold">{totalBilletage.toLocaleString()} Ar</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-sm font-medium">Différence</span>
                <span className={`text-lg font-bold ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {difference >= 0 ? '+' : ''}{difference.toLocaleString()} Ar
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Factures table */}
          {factures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Factures du jour ({factures.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N°</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {factures.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-mono text-xs">{f.numeroOrdre}</TableCell>
                          <TableCell className="text-sm">{f.nomPatient}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{Number(f.montantTotal).toLocaleString()} Ar</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
