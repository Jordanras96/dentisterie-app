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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { DollarSign, Plus, Save, Search } from 'lucide-react'

interface InterventionPrice {
  codeTravail: string
  libelle: string
  prixPublic: string | number
  prixPriseCharge: string | number
  prixTiko: string | number
  prixPersonnel: string | number
  prixRetraite: string | number
  prixEnfcd: string | number
}

interface ProduitPrice {
  codeProduit: string
  libelle: string
  prixVte: string | number
  prixAchat: string | number
  prixPers: string | number
  prixRetraite: string | number
  prixEnfcd: string | number
}

const INT_FIELDS = [
  { key: 'prixPublic', label: 'Public' },
  { key: 'prixPriseCharge', label: 'Prise en charge' },
  { key: 'prixTiko', label: 'TIKO' },
  { key: 'prixPersonnel', label: 'Personnel' },
  { key: 'prixRetraite', label: 'Retraité' },
  { key: 'prixEnfcd', label: 'Enf CD' },
] as const

const PROD_FIELDS = [
  { key: 'prixVte', label: 'Prix vente' },
  { key: 'prixAchat', label: 'Prix achat' },
  { key: 'prixPers', label: 'Personnel' },
  { key: 'prixRetraite', label: 'Retraité' },
  { key: 'prixEnfcd', label: 'Enf CD' },
] as const

export default function TarifsPage() {
  const [interventions, setInterventions] = useState<InterventionPrice[]>([])
  const [produits, setProduits] = useState<ProduitPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInt, setSearchInt] = useState('')
  const [searchProd, setSearchProd] = useState('')
  const [editingCell, setEditingCell] = useState<{ code: string; field: string; type: 'int' | 'prod' } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [customDialog, setCustomDialog] = useState(false)
  const [customForm, setCustomForm] = useState({ nomTarif: '', codeIntervention: '', montant: 0 })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [intData, prodData] = await Promise.all([
        trpc.tarif.listInterventionPrices.query(),
        trpc.tarif.listProduitPrices.query(),
      ])
      setInterventions(intData as unknown as InterventionPrice[])
      setProduits(prodData as unknown as ProduitPrice[])
    } catch {
      toast.error('Erreur lors du chargement des tarifs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const startEdit = (code: string, field: string, type: 'int' | 'prod', currentValue: string | number) => {
    setEditingCell({ code, field, type })
    setEditValue(String(Number(currentValue)))
  }

  const saveEdit = async () => {
    if (!editingCell) return
    const value = parseFloat(editValue) || 0
    try {
      if (editingCell.type === 'int') {
        await trpc.tarif.updateInterventionPrice.mutate({
          codeTravail: editingCell.code,
          field: editingCell.field as any,
          value,
        })
        setInterventions((prev) =>
          prev.map((i) =>
            i.codeTravail === editingCell.code
              ? { ...i, [editingCell.field]: value }
              : i
          )
        )
      } else {
        await trpc.tarif.updateProduitPrice.mutate({
          codeProduit: editingCell.code,
          field: editingCell.field as any,
          value,
        })
        setProduits((prev) =>
          prev.map((p) =>
            p.codeProduit === editingCell.code
              ? { ...p, [editingCell.field]: value }
              : p
          )
        )
      }
      toast.success('Prix mis à jour')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
    setEditingCell(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') setEditingCell(null)
  }

  const handleAddCustom = async () => {
    if (!customForm.nomTarif || !customForm.codeIntervention) {
      toast.error('Nom du tarif et code intervention requis')
      return
    }
    try {
      await trpc.tarif.addCustomTarif.mutate(customForm)
      toast.success('Tarif personnalisé ajouté')
      setCustomDialog(false)
      setCustomForm({ nomTarif: '', codeIntervention: '', montant: 0 })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  const filteredInt = interventions.filter(
    (i) =>
      !searchInt ||
      i.codeTravail.toLowerCase().includes(searchInt.toLowerCase()) ||
      i.libelle.toLowerCase().includes(searchInt.toLowerCase())
  )

  const filteredProd = produits.filter(
    (p) =>
      !searchProd ||
      p.codeProduit.toLowerCase().includes(searchProd.toLowerCase()) ||
      p.libelle.toLowerCase().includes(searchProd.toLowerCase())
  )

  const renderPriceCell = (code: string, field: string, value: string | number, type: 'int' | 'prod') => {
    const isEditing = editingCell?.code === code && editingCell?.field === field && editingCell?.type === type
    if (isEditing) {
      return (
        <Input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-7 w-24 text-right text-sm"
        />
      )
    }
    return (
      <button
        className="w-full text-right text-sm hover:bg-accent/50 rounded px-1 py-0.5 transition-colors cursor-pointer"
        onClick={() => startEdit(code, field, type, value)}
        title="Cliquer pour modifier"
      >
        {Number(value).toLocaleString()}
      </button>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Tarifs</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tarifs</h1>
          <p className="text-muted-foreground">Gestion des prix par tarif pour interventions et produits</p>
        </div>
        <Button variant="outline" onClick={() => setCustomDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />Tarif personnalisé
        </Button>
      </div>

      <Dialog open={customDialog} onOpenChange={setCustomDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajouter un tarif personnalisé</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du tarif</Label>
              <Input
                value={customForm.nomTarif}
                onChange={(e) => setCustomForm({ ...customForm, nomTarif: e.target.value })}
                placeholder="Ex: Étudiant, Militaire..."
              />
            </div>
            <div className="space-y-2">
              <Label>Code intervention</Label>
              <Input
                value={customForm.codeIntervention}
                onChange={(e) => setCustomForm({ ...customForm, codeIntervention: e.target.value.toUpperCase() })}
                placeholder="Ex: I201"
              />
            </div>
            <div className="space-y-2">
              <Label>Montant</Label>
              <Input
                type="number"
                value={customForm.montant}
                onChange={(e) => setCustomForm({ ...customForm, montant: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <Button className="w-full" onClick={handleAddCustom}>Ajouter</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="interventions">
        <TabsList>
          <TabsTrigger value="interventions">Interventions ({filteredInt.length})</TabsTrigger>
          <TabsTrigger value="produits">Produits ({filteredProd.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="interventions" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Tarifs interventions</CardTitle>
                <p className="text-xs text-muted-foreground">(cliquer sur un prix pour le modifier)</p>
                <div className="relative ml-auto w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchInt}
                    onChange={(e) => setSearchInt(e.target.value)}
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
                      <TableHead className="w-20">Code</TableHead>
                      <TableHead>Libellé</TableHead>
                      {INT_FIELDS.map((f) => (
                        <TableHead key={f.key} className="text-right w-28">{f.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInt.map((i) => (
                      <TableRow key={i.codeTravail}>
                        <TableCell className="font-mono text-xs">{i.codeTravail}</TableCell>
                        <TableCell className="text-sm max-w-48 truncate">{i.libelle}</TableCell>
                        {INT_FIELDS.map((f) => (
                          <TableCell key={f.key} className="text-right p-1">
                            {renderPriceCell(i.codeTravail, f.key, (i as any)[f.key], 'int')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {filteredInt.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          Aucune intervention trouvée
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produits" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Tarifs produits</CardTitle>
                <p className="text-xs text-muted-foreground">(cliquer sur un prix pour le modifier)</p>
                <div className="relative ml-auto w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchProd}
                    onChange={(e) => setSearchProd(e.target.value)}
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
                      <TableHead className="w-20">Code</TableHead>
                      <TableHead>Libellé</TableHead>
                      {PROD_FIELDS.map((f) => (
                        <TableHead key={f.key} className="text-right w-28">{f.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProd.map((p) => (
                      <TableRow key={p.codeProduit}>
                        <TableCell className="font-mono text-xs">{p.codeProduit}</TableCell>
                        <TableCell className="text-sm max-w-48 truncate">{p.libelle}</TableCell>
                        {PROD_FIELDS.map((f) => (
                          <TableCell key={f.key} className="text-right p-1">
                            {renderPriceCell(p.codeProduit, f.key, (p as any)[f.key], 'prod')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {filteredProd.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Aucun produit trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
