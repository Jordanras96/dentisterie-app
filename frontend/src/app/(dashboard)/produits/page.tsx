'use client'

import { useState, useEffect, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Search, Package, Plus, Pencil, Trash2, PackagePlus, X } from 'lucide-react'

interface Produit {
  id: number
  codeProduit: string
  libelle: string
  unite: string | null
  nbrUtil: number
  prixVte: string | number
  prixAchat: string | number
  prixPers: string | number
  prixRetraite: string | number
  prixEnfcd: string | number
  isParent: boolean
  cumulAppro: number
}

const emptyForm = {
  codeProduit: '',
  libelle: '',
  unite: '',
  prixVte: 0,
  prixAchat: 0,
  prixPers: 0,
  prixRetraite: 0,
  prixEnfcd: 0,
}

interface StockLigne {
  codeProduit: string
  libelle: string
  quantite: number
  prixUnitaire: number
}

export default function ProduitsPage() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editDialog, setEditDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [stockDialog, setStockDialog] = useState(false)
  const [stockSearch, setStockSearch] = useState('')
  const [stockSuggestions, setStockSuggestions] = useState<Produit[]>([])
  const [stockLignes, setStockLignes] = useState<StockLigne[]>([])

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

  useEffect(() => {
    if (!stockSearch || stockSearch.length < 2) {
      setStockSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const data = await trpc.produit.list.query({ search: stockSearch })
        setStockSuggestions(data as unknown as Produit[])
      } catch { /* ignore */ }
    }, 200)
    return () => clearTimeout(timer)
  }, [stockSearch])

  const openCreate = () => {
    setEditMode(false)
    setForm({ ...emptyForm })
    setEditDialog(true)
  }

  const openEdit = (p: Produit) => {
    setEditMode(true)
    setForm({
      codeProduit: p.codeProduit,
      libelle: p.libelle,
      unite: p.unite || '',
      prixVte: Number(p.prixVte),
      prixAchat: Number(p.prixAchat),
      prixPers: Number(p.prixPers),
      prixRetraite: Number(p.prixRetraite),
      prixEnfcd: Number(p.prixEnfcd),
    })
    setEditDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = form.codeProduit.trim()
    const libelle = form.libelle.trim()
    if (!code || !libelle) {
      toast.error(`Code et libellé sont requis (code="${code}", libellé="${libelle}")`)
      return
    }
    try {
      if (editMode) {
        await trpc.produit.update.mutate({
          codeProduit: code,
          libelle,
          unite: form.unite || undefined,
          prixVte: form.prixVte,
          prixAchat: form.prixAchat,
          prixPers: form.prixPers,
          prixRetraite: form.prixRetraite,
          prixEnfcd: form.prixEnfcd,
        })
        toast.success('Produit modifié')
      } else {
        await trpc.produit.create.mutate({
          codeProduit: code,
          libelle,
          unite: form.unite || undefined,
          prixVte: form.prixVte,
          prixAchat: form.prixAchat,
          prixPers: form.prixPers,
          prixRetraite: form.prixRetraite,
          prixEnfcd: form.prixEnfcd,
        })
        toast.success('Produit créé')
      }
      setEditDialog(false)
      fetchProduits()
    } catch (error: unknown) {
      const msg = (error as any)?.message || (error as any)?.data?.message || 'Erreur serveur'
      toast.error(msg)
    }
  }

  const handleDelete = async (code: string) => {
    if (!confirm(`Supprimer le produit ${code} ?`)) return
    try {
      await trpc.produit.delete.mutate({ codeProduit: code })
      toast.success('Produit supprimé')
      fetchProduits()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  const addStockLigne = (p: Produit) => {
    if (stockLignes.some((l) => l.codeProduit === p.codeProduit)) {
      toast.error('Produit déjà ajouté')
      return
    }
    setStockLignes([...stockLignes, {
      codeProduit: p.codeProduit,
      libelle: p.libelle,
      quantite: 1,
      prixUnitaire: Number(p.prixAchat),
    }])
    setStockSearch('')
    setStockSuggestions([])
  }

  const handleStockEntry = async () => {
    if (stockLignes.length === 0) {
      toast.error('Ajoutez au moins un produit')
      return
    }
    try {
      const result = await trpc.produit.stockEntry.mutate({
        lignes: stockLignes.map((l) => ({
          codeProduit: l.codeProduit,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
        })),
      })
      toast.success(`Saisie d'entrée ${result.reference} enregistrée (${stockLignes.length} produit(s))`)
      setStockDialog(false)
      setStockLignes([])
      fetchProduits()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  const openStockWithNewProduct = () => {
    setStockDialog(false)
    setForm({ ...emptyForm })
    setEditMode(false)
    setEditDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produits</h1>
          <p className="text-muted-foreground">{produits.length} produits enregistrés</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setStockDialog(true); setStockLignes([]); setStockSearch('') }}>
            <PackagePlus className="mr-2 h-4 w-4" />Saisie d&apos;entrée
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />Nouveau produit
          </Button>
        </div>
      </div>

      {/* Produit create/edit dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Modifier produit' : 'Nouveau produit'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input value={form.codeProduit} onChange={(e) => setForm({ ...form, codeProduit: e.target.value.toUpperCase() })} placeholder="P601" disabled={editMode} />
              </div>
              <div className="space-y-2">
                <Label>Libellé *</Label>
                <Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Unité</Label>
              <Input value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} placeholder="Boîte, Pièce, Tube..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-xs">Prix vente</Label><Input type="number" value={form.prixVte} onChange={(e) => setForm({ ...form, prixVte: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1"><Label className="text-xs">Prix achat</Label><Input type="number" value={form.prixAchat} onChange={(e) => setForm({ ...form, prixAchat: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1"><Label className="text-xs">Personnel</Label><Input type="number" value={form.prixPers} onChange={(e) => setForm({ ...form, prixPers: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1"><Label className="text-xs">Retraité</Label><Input type="number" value={form.prixRetraite} onChange={(e) => setForm({ ...form, prixRetraite: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1"><Label className="text-xs">Enf CD</Label><Input type="number" value={form.prixEnfcd} onChange={(e) => setForm({ ...form, prixEnfcd: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <Button type="submit" className="w-full">{editMode ? 'Modifier' : 'Créer'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock entry dialog */}
      <Dialog open={stockDialog} onOpenChange={setStockDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Saisie d&apos;entrée de stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code ou libellé..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="pl-9"
              />
              {stockSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                  {stockSuggestions.map((p) => (
                    <button
                      key={p.codeProduit}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent text-sm"
                      onClick={() => addStockLigne(p)}
                    >
                      <Badge variant="outline" className="font-mono text-xs">{p.codeProduit}</Badge>
                      <span>{p.libelle}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{p.unite || ''}</span>
                    </button>
                  ))}
                </div>
              )}
              {stockSearch.length >= 2 && stockSuggestions.length === 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Aucun produit trouvé</p>
                  <Button size="sm" variant="outline" onClick={openStockWithNewProduct}>
                    <Plus className="mr-1 h-3 w-3" />Créer un nouveau produit
                  </Button>
                </div>
              )}
            </div>

            {stockLignes.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="w-24">Quantité</TableHead>
                    <TableHead className="w-32">Prix unit.</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockLignes.map((l, i) => (
                    <TableRow key={l.codeProduit}>
                      <TableCell className="font-mono text-sm">{l.codeProduit}</TableCell>
                      <TableCell>{l.libelle}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={l.quantite}
                          onChange={(e) => {
                            const lignes = [...stockLignes]
                            lignes[i] = { ...l, quantite: parseInt(e.target.value) || 1 }
                            setStockLignes(lignes)
                          }}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={l.prixUnitaire}
                          onChange={(e) => {
                            const lignes = [...stockLignes]
                            lignes[i] = { ...l, prixUnitaire: parseFloat(e.target.value) || 0 }
                            setStockLignes(lignes)
                          }}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStockLignes(stockLignes.filter((_, j) => j !== i))}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex items-center justify-between border-t pt-3">
              <p className="text-sm text-muted-foreground">{stockLignes.length} produit(s)</p>
              <Button onClick={handleStockEntry} disabled={stockLignes.length === 0}>
                Enregistrer la saisie d&apos;entrée
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Cumul appro.</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead className="text-right">Nbr utilisé</TableHead>
                  <TableHead className="text-right">Prix vente</TableHead>
                  <TableHead className="text-right">Prix achat</TableHead>
                  <TableHead className="text-right">Personnel</TableHead>
                  <TableHead className="text-right">Retraité</TableHead>
                  <TableHead className="text-right">Enf CD</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 11 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : produits.map((p) => (
                      <TableRow key={p.id} className="group">
                        <TableCell className="font-mono text-sm">{p.codeProduit}</TableCell>
                        <TableCell className="font-medium max-w-48 truncate">{p.libelle}</TableCell>
                        <TableCell className="text-right">{p.cumulAppro || '-'}</TableCell>
                        <TableCell>{p.unite || '-'}</TableCell>
                        <TableCell className="text-right">{p.nbrUtil || '-'}</TableCell>
                        <TableCell className="text-right">{Number(p.prixVte).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{Number(p.prixAchat).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{Number(p.prixPers).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{Number(p.prixRetraite).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{Number(p.prixEnfcd).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.codeProduit)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                {!loading && produits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                      Aucun produit trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
