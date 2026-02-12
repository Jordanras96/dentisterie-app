'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ArrowLeft, FileText, Printer, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { generateFactureSimplePdf, generateFactureDetailPdf, type InterventionTree } from '@/lib/pdf-facture'

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

interface FactureDetail {
  id: number
  numeroOrdre: string
  numeroPatient: string
  nomPatient: string
  dateVisite: string
  typePatient: number
  montantTotal: string | number
  assurance?: string | null
  lignes: LigneFacture[]
  patient?: { nom: string; sexe: string; age: number | null } | null
}

const typeLabels: Record<number, string> = {
  1: 'Public',
  2: 'Personnel',
  3: 'Retraité',
  4: 'TIKO',
  5: 'Prise en charge',
  6: 'Enf CD',
}

export default function FactureDetailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const numeroOrdre = searchParams.get('numero') || ''
  const [facture, setFacture] = useState<FactureDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!numeroOrdre) {
        router.replace('/factures')
        return
      }
      try {
        const result = await trpc.facture.getByNumero.query({ numeroOrdre })
        if (!result) {
          toast.error('Facture introuvable')
          router.replace('/factures')
          return
        }
        setFacture(result as unknown as FactureDetail)
      } catch {
        toast.error('Erreur lors du chargement de la facture')
        router.replace('/factures')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [numeroOrdre, router])

  const fetchTree = async (): Promise<InterventionTree> => {
    return await trpc.intervention.tree.query() as unknown as InterventionTree
  }

  const handlePrintSimple = async () => {
    if (!facture) return
    try {
      const tree = await fetchTree()
      await generateFactureSimplePdf(facture, tree)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la generation du PDF')
    }
  }

  const handlePrintDetailed = async () => {
    if (!facture) return
    try {
      const tree = await fetchTree()
      await generateFactureDetailPdf(facture, tree)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la generation du PDF')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!facture) return null

  const interventions = facture.lignes.filter(l => l.codeIntervention)
  const produits = facture.lignes.filter(l => l.codeProduit)
  const totalInterventions = interventions.reduce((s, l) => s + Number(l.montant), 0)
  const totalProduits = produits.reduce((s, l) => s + Number(l.montant), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/factures')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Facture {facture.numeroOrdre}</h1>
            <p className="text-muted-foreground">{facture.nomPatient}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintSimple}>
            <Printer className="mr-2 h-4 w-4" />Facture simple
          </Button>
          <Button variant="outline" onClick={handlePrintDetailed}>
            <Printer className="mr-2 h-4 w-4" />Facture détaillée
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">N° Ordre</p>
              <p className="text-lg font-bold font-mono">{facture.numeroOrdre}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <User className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="text-sm font-medium">{facture.nomPatient}</p>
              <p className="text-xs text-muted-foreground">{facture.numeroPatient}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Calendar className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Date visite</p>
              <p className="text-sm font-medium">{format(new Date(facture.dateVisite), 'dd MMMM yyyy', { locale: fr })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <p className="text-xs text-muted-foreground">Montant total</p>
            <p className="text-2xl font-bold text-primary">{Number(facture.montantTotal).toLocaleString()} Ar</p>
            <Badge variant="outline" className="mt-1">{typeLabels[facture.typePatient] || 'Autre'}</Badge>
          </CardContent>
        </Card>
      </div>

      {interventions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interventions ({interventions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-center">Qté</TableHead>
                  <TableHead className="text-right">P.U.</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interventions.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-sm">{l.intervention?.codeTravail || l.codeIntervention}</TableCell>
                    <TableCell>{l.intervention?.libelle || '-'}</TableCell>
                    <TableCell className="text-center">{l.quantite}</TableCell>
                    <TableCell className="text-right">{Number(l.prixUnitaire).toLocaleString()} Ar</TableCell>
                    <TableCell className="text-right font-medium">{Number(l.montant).toLocaleString()} Ar</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={4}>Sous-total Interventions</TableCell>
                  <TableCell className="text-right">{totalInterventions.toLocaleString()} Ar</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {produits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produits ({produits.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-center">Qté</TableHead>
                  <TableHead className="text-right">P.U.</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produits.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-sm">{l.produit?.codeProduit || l.codeProduit}</TableCell>
                    <TableCell>{l.produit?.libelle || '-'}</TableCell>
                    <TableCell className="text-center">{l.quantite}</TableCell>
                    <TableCell className="text-right">{Number(l.prixUnitaire).toLocaleString()} Ar</TableCell>
                    <TableCell className="text-right font-medium">{Number(l.montant).toLocaleString()} Ar</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={4}>Sous-total Produits</TableCell>
                  <TableCell className="text-right">{totalProduits.toLocaleString()} Ar</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/30">
        <CardContent className="flex items-center justify-between pt-6">
          <span className="text-lg font-semibold">TOTAL GENERAL</span>
          <span className="text-3xl font-bold text-primary">{Number(facture.montantTotal).toLocaleString()} Ar</span>
        </CardContent>
      </Card>
    </div>
  )
}
