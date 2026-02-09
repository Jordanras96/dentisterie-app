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
import { Search, Package } from 'lucide-react'

interface Produit {
  id: number
  codeProduit: string
  libelle: string
  unite: string | null
  prixVte: string | number
  prixAchat: string | number
  isParent: boolean
}

export default function ProduitsPage() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchProduits = useCallback(async () => {
    setLoading(true)
    try {
      const data = await trpc.produit.list.query({ search: search || undefined })
      setProduits(data as unknown as Produit[])
    } catch {
      toast.error('Erreur lors du chargement des produits')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(fetchProduits, 300)
    return () => clearTimeout(timer)
  }, [fetchProduits])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Produits</h1>
        <p className="text-muted-foreground">{produits.length} produits enregistrés</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Catalogue produits</CardTitle>
            <div className="relative ml-auto w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead className="text-right">Prix vente</TableHead>
                <TableHead className="text-right">Prix achat</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : produits.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.codeProduit}</TableCell>
                      <TableCell className="font-medium">{p.libelle}</TableCell>
                      <TableCell>{p.unite || '-'}</TableCell>
                      <TableCell className="text-right">{Number(p.prixVte).toLocaleString()} Ar</TableCell>
                      <TableCell className="text-right">{Number(p.prixAchat).toLocaleString()} Ar</TableCell>
                      <TableCell>
                        <Badge variant={p.isParent ? 'default' : 'outline'}>
                          {p.isParent ? 'Catégorie' : 'Produit'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && produits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Aucun produit trouvé
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
