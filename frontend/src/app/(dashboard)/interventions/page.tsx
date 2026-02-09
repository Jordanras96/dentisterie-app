'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { ChevronRight, Stethoscope } from 'lucide-react'

interface InterventionNode {
  id: number
  codeTravail: string
  libelle: string
  prixPublic: string | number
  isParent: boolean
  isMiddle: boolean
  isChild: boolean
  children?: InterventionNode[]
}

export default function InterventionsPage() {
  const [tree, setTree] = useState<InterventionNode[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<InterventionNode | null>(null)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [expandedMiddles, setExpandedMiddles] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      try {
        const data = await trpc.intervention.tree.query()
        setTree(data as unknown as InterventionNode[])
      } catch {
        toast.error('Erreur lors du chargement des interventions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
      <div>
        <h1 className="text-2xl font-bold">Interventions</h1>
        <p className="text-muted-foreground">Arbre hiérarchique des interventions dentaires</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
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
                {tree.map((parent) => (
                  <div key={parent.codeTravail}>
                    <button
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors"
                      onClick={() => { toggleParent(parent.codeTravail); setSelected(parent) }}
                    >
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${expandedParents.has(parent.codeTravail) ? 'rotate-90' : ''}`}
                      />
                      <Badge variant="default" className="font-mono text-xs">{parent.codeTravail}</Badge>
                      <span className="font-medium">{parent.libelle}</span>
                    </button>

                    {expandedParents.has(parent.codeTravail) && parent.children?.map((middle) => (
                      <div key={middle.codeTravail} className="ml-6">
                        <button
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-accent/50 transition-colors"
                          onClick={() => { toggleMiddle(middle.codeTravail); setSelected(middle) }}
                        >
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${expandedMiddles.has(middle.codeTravail) ? 'rotate-90' : ''}`}
                          />
                          <Badge variant="secondary" className="font-mono text-xs">{middle.codeTravail}</Badge>
                          <span className="text-sm">{middle.libelle}</span>
                        </button>

                        {expandedMiddles.has(middle.codeTravail) && middle.children?.map((child) => (
                          <button
                            key={child.codeTravail}
                            className={`ml-6 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
                              selected?.codeTravail === child.codeTravail ? 'bg-primary/10' : 'hover:bg-accent/30'
                            }`}
                            onClick={() => setSelected(child)}
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                            <Badge variant="outline" className="font-mono text-xs">{child.codeTravail}</Badge>
                            <span className="text-sm">{child.libelle}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {Number(child.prixPublic).toLocaleString()} Ar
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
                {tree.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">Aucune intervention configurée</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {selected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="font-mono">{selected.codeTravail}</Badge>
                Détail
              </CardTitle>
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
                <p className="text-sm text-muted-foreground">Prix public</p>
                <p className="text-lg font-bold">{Number(selected.prixPublic).toLocaleString()} Ar</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
