'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ClipboardList, Loader2, Download } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface RapportFacture {
  id: number
  numeroOrdre: string
  nomPatient: string
  montantTotal: string | number
  dateVisite: string
}

interface RapportResult {
  factures: RapportFacture[]
  total: number
}

export default function RapportsPage() {
  const [tab, setTab] = useState('journalier')
  const [dateJour, setDateJour] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [mois, setMois] = useState(new Date().getMonth() + 1)
  const [annee, setAnnee] = useState(new Date().getFullYear())
  const [result, setResult] = useState<RapportResult | null>(null)
  const [loading, setLoading] = useState(false)

  const generateRapport = async () => {
    setLoading(true)
    try {
      let data: RapportResult
      if (tab === 'journalier') {
        data = await trpc.rapport.journalier.query({ date: dateJour }) as unknown as RapportResult
      } else if (tab === 'mensuel') {
        data = await trpc.rapport.mensuel.query({ mois, annee }) as unknown as RapportResult
      } else {
        data = await trpc.rapport.annuel.query({ annee }) as unknown as RapportResult
      }
      setResult(data)
    } catch {
      toast.error('Erreur lors de la génération du rapport')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rapports</h1>
        <p className="text-muted-foreground">Générez des rapports d&apos;activité</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5" />
            Paramètres du rapport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => { setTab(v); setResult(null) }}>
            <TabsList className="mb-4">
              <TabsTrigger value="journalier">Journalier</TabsTrigger>
              <TabsTrigger value="mensuel">Mensuel</TabsTrigger>
              <TabsTrigger value="annuel">Annuel</TabsTrigger>
            </TabsList>

            <TabsContent value="journalier" className="flex items-end gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={dateJour} onChange={(e) => setDateJour(e.target.value)} className="w-44" />
              </div>
              <Button onClick={generateRapport} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Générer
              </Button>
            </TabsContent>

            <TabsContent value="mensuel" className="flex items-end gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mois</label>
                <Input type="number" min={1} max={12} value={mois} onChange={(e) => setMois(parseInt(e.target.value))} className="w-24" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Année</label>
                <Input type="number" min={2020} max={2030} value={annee} onChange={(e) => setAnnee(parseInt(e.target.value))} className="w-28" />
              </div>
              <Button onClick={generateRapport} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Générer
              </Button>
            </TabsContent>

            <TabsContent value="annuel" className="flex items-end gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Année</label>
                <Input type="number" min={2020} max={2030} value={annee} onChange={(e) => setAnnee(parseInt(e.target.value))} className="w-28" />
              </div>
              <Button onClick={generateRapport} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Générer
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Résultat — <Badge variant="secondary">{result.factures.length} facture(s)</Badge>
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold">{result.total.toLocaleString()} Ar</span>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Ordre</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.factures.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-sm">{f.numeroOrdre}</TableCell>
                    <TableCell>{f.nomPatient}</TableCell>
                    <TableCell>{format(new Date(f.dateVisite), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                    <TableCell className="text-right font-medium">{Number(f.montantTotal).toLocaleString()} Ar</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
