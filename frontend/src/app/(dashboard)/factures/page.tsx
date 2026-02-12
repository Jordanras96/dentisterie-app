'use client'

import { useState, useEffect, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Plus, FileText, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

interface Facture {
  id: number
  numeroOrdre: string
  numeroPatient: string
  nomPatient: string
  dateVisite: string
  typePatient: number
  montantTotal: string | number
}

const typeLabels: Record<number, string> = {
  1: 'Public',
  2: 'Personnel',
  3: 'Retraité',
  4: 'TIKO',
}

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [dateDebut, setDateDebut] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [dateFin, setDateFin] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(true)

  const fetchFactures = useCallback(async () => {
    setLoading(true)
    try {
      const result = await trpc.facture.list.query({
        page,
        limit: 25,
        dateDebut: dateDebut || undefined,
        dateFin: dateFin || undefined,
      })
      setFactures(result.data as unknown as Facture[])
      setTotal(result.total)
      setPages(result.pages)
    } catch {
      toast.error('Erreur lors du chargement des factures')
    } finally {
      setLoading(false)
    }
  }, [page, dateDebut, dateFin])

  useEffect(() => {
    fetchFactures()
  }, [fetchFactures])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Factures</h1>
          <p className="text-muted-foreground">{total} factures</p>
        </div>
        <Link href="/factures/nouvelle">
          <Button data-tour="new-invoice"><Plus className="mr-2 h-4 w-4" />Nouvelle facture</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Liste des factures</CardTitle>
            <div className="ml-auto flex items-center gap-2">
              <Input type="date" value={dateDebut} onChange={(e) => { setDateDebut(e.target.value); setPage(1) }} className="w-40" />
              <span className="text-sm text-muted-foreground">à</span>
              <Input type="date" value={dateFin} onChange={(e) => { setDateFin(e.target.value); setPage(1) }} className="w-40" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Ordre</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Date visite</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : factures.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-sm">{f.numeroOrdre}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{f.nomPatient}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{f.numeroPatient}</span>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(f.dateVisite), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabels[f.typePatient] || 'Autre'}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(f.montantTotal).toLocaleString()} Ar
                      </TableCell>
                      <TableCell>
                        <Link href={`/factures/detail?numero=${f.numeroOrdre}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && factures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Aucune facture trouvée</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {pages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-sm text-muted-foreground">Page {page} sur {pages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
