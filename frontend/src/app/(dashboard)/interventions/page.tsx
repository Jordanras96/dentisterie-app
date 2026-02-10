'use client'

import { useState, useEffect, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ChevronRight, Stethoscope, Plus, Pencil, Trash2 } from 'lucide-react'

interface InterventionItem {
  id: number
  codeTravail: string
  libelle: string
  prixPublic: string | number
  prixPriseCharge: string | number
  prixTiko: string | number
  prixPersonnel: string | number
  prixRetraite: string | number
  prixEnfcd: string | number
  isParent: boolean
  isMiddle: boolean
  isChild: boolean
  produit1?: string | null
  produit2?: string | null
  produit3?: string | null
  produit4?: string | null
  produit5?: string | null
  produit6?: string | null
  produit7?: string | null
  produit8?: string | null
  produit9?: string | null
  produit10?: string | null
}

interface TreeNode extends InterventionItem {
  children?: TreeNode[]
  directChildren?: InterventionItem[]
}

interface TreeData {
  tree: TreeNode[]
  orphans: InterventionItem[]
}

const PRIX_LABELS = [
  { key: 'prixPublic', label: 'Public' },
  { key: 'prixPriseCharge', label: 'Prise en charge' },
  { key: 'prixTiko', label: 'TIKO' },
  { key: 'prixPersonnel', label: 'Personnel' },
  { key: 'prixRetraite', label: 'Retraité' },
  { key: 'prixEnfcd', label: 'Enf CD' },
] as const

const emptyForm = {
  codeTravail: '',
  libelle: '',
  prixPublic: 0,
  prixPriseCharge: 0,
  prixTiko: 0,
  prixPersonnel: 0,
  prixRetraite: 0,
  prixEnfcd: 0,
  produits: [] as string[],
}

export default function InterventionsPage() {
  const [treeData, setTreeData] = useState<TreeData>({ tree: [], orphans: [] })
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<InterventionItem | null>(null)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [expandedMiddles, setExpandedMiddles] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })

  const loadTree = useCallback(async () => {
    try {
      const data = await trpc.intervention.tree.query()
      setTreeData(data as unknown as TreeData)
    } catch {
      toast.error('Erreur lors du chargement des interventions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTree() }, [loadTree])

  const toggleParent = (code: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const toggleMiddle = (code: string) => {
    setExpandedMiddles((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const openCreate = () => {
    setEditMode(false)
    setForm({ ...emptyForm })
    setDialogOpen(true)
  }

  const openEdit = (item: InterventionItem) => {
    setEditMode(true)
    const produits: string[] = []
    for (let i = 1; i <= 10; i++) {
      const val = (item as any)[`produit${i}`]
      if (val) produits.push(val)
    }
    setForm({
      codeTravail: item.codeTravail,
      libelle: item.libelle,
      prixPublic: Number(item.prixPublic),
      prixPriseCharge: Number(item.prixPriseCharge),
      prixTiko: Number(item.prixTiko),
      prixPersonnel: Number(item.prixPersonnel),
      prixRetraite: Number(item.prixRetraite),
      prixEnfcd: Number(item.prixEnfcd),
      produits,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.codeTravail || !form.libelle) {
      toast.error('Code et libellé sont requis')
      return
    }
    try {
      if (editMode) {
        await trpc.intervention.update.mutate({
          codeTravail: form.codeTravail,
          libelle: form.libelle,
          prixPublic: form.prixPublic,
          prixPriseCharge: form.prixPriseCharge,
          prixTiko: form.prixTiko,
          prixPersonnel: form.prixPersonnel,
          prixRetraite: form.prixRetraite,
          prixEnfcd: form.prixEnfcd,
          produits: form.produits.filter(Boolean),
        })
        toast.success('Intervention modifiée')
      } else {
        await trpc.intervention.create.mutate({
          ...form,
          produits: form.produits.filter(Boolean),
        })
        toast.success('Intervention créée')
      }
      setDialogOpen(false)
      setForm({ ...emptyForm })
      loadTree()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  const handleDelete = async (code: string) => {
    if (!confirm(`Supprimer l'intervention ${code} ?`)) return
    try {
      await trpc.intervention.delete.mutate({ codeTravail: code })
      toast.success('Intervention supprimée')
      if (selected?.codeTravail === code) setSelected(null)
      loadTree()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  const renderPrix = (item: InterventionItem) => (
    <div className="grid grid-cols-3 gap-2">
      {PRIX_LABELS.map(({ key, label }) => (
        <div key={key} className="rounded-md border p-2 text-center">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-semibold text-sm">{Number((item as any)[key]).toLocaleString()} Ar</p>
        </div>
      ))}
    </div>
  )

  const renderChildRow = (child: InterventionItem) => (
    <button
      key={child.codeTravail}
      className={`ml-6 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors group ${
        selected?.codeTravail === child.codeTravail ? 'bg-primary/10' : 'hover:bg-accent/30'
      }`}
      onClick={() => setSelected(child)}
    >
      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      <Badge variant="outline" className="font-mono text-xs">{child.codeTravail}</Badge>
      <span className="text-sm flex-1">{child.libelle}</span>
      <span className="text-xs text-muted-foreground mr-2">
        {Number(child.prixPublic).toLocaleString()} Ar
      </span>
      <span className="hidden group-hover:flex gap-1">
        <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-pointer" onClick={(e) => { e.stopPropagation(); openEdit(child) }} />
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDelete(child.codeTravail) }} />
      </span>
    </button>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Interventions</h1>
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
          <h1 className="text-2xl font-bold">Interventions</h1>
          <p className="text-muted-foreground">Arbre hiérarchique des interventions dentaires</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nouvelle intervention</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Modifier intervention' : 'Nouvelle intervention'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input
                    value={form.codeTravail}
                    onChange={(e) => setForm({ ...form, codeTravail: e.target.value.toUpperCase() })}
                    placeholder="Ex: I201"
                    disabled={editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Libellé *</Label>
                  <Input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {PRIX_LABELS.map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      type="number"
                      value={form[key as keyof typeof form] as number}
                      onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Produits associés (codes séparés par virgule)</Label>
                <Input
                  value={form.produits.join(', ')}
                  onChange={(e) => setForm({ ...form, produits: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="P601, P602, P603"
                />
              </div>
              <Button type="submit" className="w-full">{editMode ? 'Modifier' : 'Créer'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Catalogue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-1 p-4">
                {treeData.tree.map((parent) => (
                  <div key={parent.codeTravail}>
                    <div className="flex items-center group">
                      <button
                        className="flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors"
                        onClick={() => { toggleParent(parent.codeTravail); setSelected(parent) }}
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${expandedParents.has(parent.codeTravail) ? 'rotate-90' : ''}`}
                        />
                        <Badge variant="default" className="font-mono text-xs">{parent.codeTravail}</Badge>
                        <span className="font-medium">{parent.libelle}</span>
                      </button>
                      <span className="hidden group-hover:flex gap-1 pr-2">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => openEdit(parent)} />
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive cursor-pointer" onClick={() => handleDelete(parent.codeTravail)} />
                      </span>
                    </div>

                    {expandedParents.has(parent.codeTravail) && (
                      <>
                        {parent.children?.map((middle) => (
                          <div key={middle.codeTravail} className="ml-6">
                            <div className="flex items-center group">
                              <button
                                className="flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-accent/50 transition-colors"
                                onClick={() => { toggleMiddle(middle.codeTravail); setSelected(middle) }}
                              >
                                <ChevronRight
                                  className={`h-4 w-4 transition-transform ${expandedMiddles.has(middle.codeTravail) ? 'rotate-90' : ''}`}
                                />
                                <Badge variant="secondary" className="font-mono text-xs">{middle.codeTravail}</Badge>
                                <span className="text-sm">{middle.libelle}</span>
                              </button>
                              <span className="hidden group-hover:flex gap-1 pr-2">
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => openEdit(middle)} />
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive cursor-pointer" onClick={() => handleDelete(middle.codeTravail)} />
                              </span>
                            </div>
                            {expandedMiddles.has(middle.codeTravail) && middle.children?.map(renderChildRow)}
                          </div>
                        ))}
                        {parent.directChildren?.map(renderChildRow)}
                      </>
                    )}
                  </div>
                ))}

                {treeData.orphans.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Interventions orphelines</p>
                    {treeData.orphans.map(renderChildRow)}
                  </div>
                )}

                {treeData.tree.length === 0 && treeData.orphans.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">Aucune intervention configurée</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {selected && (
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Badge className="font-mono">{selected.codeTravail}</Badge>
                  Détail
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(selected)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />Modifier
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(selected.codeTravail)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" />Supprimer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Libellé</p>
                <p className="font-medium">{selected.libelle}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant={selected.isParent ? 'default' : selected.isMiddle ? 'secondary' : 'outline'}>
                  {selected.isParent ? 'Parent' : selected.isMiddle ? 'Sous-parent' : 'Intervention'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tarifs</p>
                {renderPrix(selected)}
              </div>
              {(() => {
                const produits = []
                for (let i = 1; i <= 10; i++) {
                  const val = (selected as any)[`produit${i}`]
                  if (val) produits.push(val)
                }
                if (produits.length === 0) return null
                return (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Produits associés</p>
                    <div className="flex flex-wrap gap-1">
                      {produits.map((p) => (
                        <Badge key={p} variant="outline" className="font-mono text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
