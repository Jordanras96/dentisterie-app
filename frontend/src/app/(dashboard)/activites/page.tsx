'use client'

import { useState, useEffect, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Activity } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface FactureActivity {
  id: number
  numeroOrdre: string
  nomPatient: string
  numeroPatient: string
  dateVisite: string
  typePatient: number
  montantTotal: string | number
  lignes: Array<{
    id: number
    codeIntervention: string | null
    codeProduit: string | null
    quantite: number
    montant: string | number
  }>
}

const typeLabels: Record<number, string> = {
  1: 'Public', 2: 'Personnel', 3: 'Retraité', 4: 'TIKO',
}

export default function ActivitesPage() {
  const [factures, setFactures] = useState<FactureActivity[]>([])
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(true)

  const fetchActivites = useCallback(async () => {
    setLoading(true)
    try {
      const result = await trpc.facture.list.query({
        page: 1,
        limit: 100,
        dateDebut: dateFilter,
        dateFin: dateFilter,
      })
      setFactures(result.data as unknown as FactureActivity[])
    } catch {
      toast.error('Erreur lors du chargement des activités')
    } finally {
      setLoading(false)
    }
  }, [dateFilter])

  useEffect(() => {
    fetchActivites()
  }, [fetchActivites])

  const totalJour = factures.reduce((sum, f) => sum + Number(f.montantTotal), 0)
  const totalActes = factures.reduce((sum, f) => sum + (f.lignes?.length || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activités</h1>
          <p className="text-muted-foreground">Suivi journalier des actes réalisés</p>
        </div>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-44"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Patients du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{factures.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Actes réalisés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalActes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Recette du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalJour.toLocaleString()} Ar</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5" />
            Détail des activités — {format(new Date(dateFilter), 'dd MMMM yyyy', { locale: fr })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Ordre</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Actes</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : factures.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-sm">{f.numeroOrdre}</TableCell>
                      <TableCell>
                        <span className="font-medium">{f.nomPatient}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{f.numeroPatient}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabels[f.typePatient] || 'Autre'}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{f.lignes?.length || 0}</TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(f.montantTotal).toLocaleString()} Ar
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && factures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Aucune activité pour cette date
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
