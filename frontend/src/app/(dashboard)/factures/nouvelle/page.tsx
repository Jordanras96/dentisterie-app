'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Search, Plus, X, Save } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface PatientSuggestion {
  id: number
  numeroPatient: string
  nom: string
}

interface InterventionSuggestion {
  id: number
  codeTravail: string
  libelle: string
  prixPublic: string | number
  prixPriseCharge: string | number
  prixTiko: string | number
  prixPersonnel: string | number
  prixRetraite: string | number
  prixEnfcd: string | number
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

interface PersonnelItem {
  id: number
  nom: string
  prenom: string
  type: 'MEDECIN' | 'ASSISTANT'
}

interface ProduitItem {
  codeProduit: string
  libelle: string
  prixVte: string | number
  prixPers: string | number
  prixRetraite: string | number
  prixEnfcd: string | number
}

interface ProduitAssocieRaw {
  code: string
  libelle: string
  raw: ProduitItem
}

interface LigneIntervention {
  codeIntervention: string
  libelle: string
  nbr: number
  medecinId: number | null
  assistantId: number | null
  rawIntervention: InterventionSuggestion
  produitsAssociesRaw: ProduitAssocieRaw[]
}

interface LigneProduit {
  codeProduit: string
  libelle: string
  quantite: number
  rawProduit: ProduitItem | null
}

const TARIF_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'prise_charge', label: 'Prise en charge' },
  { value: 'tiko', label: 'TIKO' },
  { value: 'personnel', label: 'Personnel' },
  { value: 'retraite', label: 'Retraité' },
  { value: 'enfcd', label: 'Enf CD' },
]

function getInterventionPrix(intv: InterventionSuggestion, tarifType: string): number {
  const map: Record<string, string> = {
    public: 'prixPublic',
    prise_charge: 'prixPriseCharge',
    tiko: 'prixTiko',
    personnel: 'prixPersonnel',
    retraite: 'prixRetraite',
    enfcd: 'prixEnfcd',
  }
  return Number((intv as any)[map[tarifType] || 'prixPublic']) || 0
}

function getProduitPrix(prod: ProduitItem, tarifType: string): number {
  const map: Record<string, string> = {
    public: 'prixVte',
    prise_charge: 'prixVte',
    tiko: 'prixVte',
    personnel: 'prixPers',
    retraite: 'prixRetraite',
    enfcd: 'prixEnfcd',
  }
  return Number((prod as any)[map[tarifType] || 'prixVte']) || 0
}

export default function NouvelleFacturePage() {
  const router = useRouter()
  const [numeroOrdre, setNumeroOrdre] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [patientSuggestions, setPatientSuggestions] = useState<PatientSuggestion[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientSuggestion | null>(null)
  const [dateVisite, setDateVisite] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [typeCas, setTypeCas] = useState<'rendez_vous' | 'nouvelle_fiche' | 'ancien_cas'>('nouvelle_fiche')
  const [tarifType, setTarifType] = useState('public')

  const [interventionSearch, setIntervSearch] = useState('')
  const [interventionSuggestions, setIntervSuggestions] = useState<InterventionSuggestion[]>([])
  const [lignesIntervention, setLignesIntervention] = useState<LigneIntervention[]>([])
  const [lignesProduit, setLignesProduit] = useState<LigneProduit[]>([])
  const [produitSearch, setProduitSearch] = useState('')
  const [produitSuggestions, setProduitSuggestions] = useState<ProduitItem[]>([])

  const [medecins, setMedecins] = useState<PersonnelItem[]>([])
  const [assistants, setAssistants] = useState<PersonnelItem[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const [num, meds, assts] = await Promise.all([
          trpc.facture.nextNumeroOrdre.query(),
          trpc.personnel.list.query({ type: 'MEDECIN' }),
          trpc.personnel.list.query({ type: 'ASSISTANT' }),
        ])
        setNumeroOrdre(String(num))
        setMedecins(meds as unknown as PersonnelItem[])
        setAssistants(assts as unknown as PersonnelItem[])
      } catch (err) {
        console.error('Init error:', err)
        toast.error('Erreur de chargement des données initiales')
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!patientSearch || patientSearch.length < 2) {
      setPatientSuggestions([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const res = await trpc.patient.list.query({ page: 1, limit: 8, search: patientSearch })
        setPatientSuggestions(res.data as unknown as PatientSuggestion[])
      } catch { /* ignore */ }
    }, 200)
    return () => clearTimeout(t)
  }, [patientSearch])

  useEffect(() => {
    if (!interventionSearch || interventionSearch.length < 1) {
      setIntervSuggestions([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const res = await trpc.intervention.list.query({ type: 'child', search: interventionSearch })
        setIntervSuggestions(res as unknown as InterventionSuggestion[])
      } catch { /* ignore */ }
    }, 200)
    return () => clearTimeout(t)
  }, [interventionSearch])

  useEffect(() => {
    if (!produitSearch || produitSearch.length < 2) {
      setProduitSuggestions([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const res = await trpc.produit.list.query({ search: produitSearch })
        setProduitSuggestions(res as unknown as ProduitItem[])
      } catch { /* ignore */ }
    }, 200)
    return () => clearTimeout(t)
  }, [produitSearch])

  const selectPatient = (p: PatientSuggestion) => {
    setSelectedPatient(p)
    setPatientSearch(`${p.numeroPatient} - ${p.nom}`)
    setPatientSuggestions([])
  }

  const addIntervention = async (intv: InterventionSuggestion) => {
    if (lignesIntervention.some((l) => l.codeIntervention === intv.codeTravail)) {
      toast.error('Intervention déjà ajoutée')
      return
    }

    const produitsAssociesRaw: ProduitAssocieRaw[] = []
    for (let i = 1; i <= 10; i++) {
      const code = (intv as any)[`produit${i}`]
      if (code) {
        try {
          const prod = await trpc.produit.getByCode.query({ code })
          if (prod) {
            produitsAssociesRaw.push({
              code: prod.codeProduit,
              libelle: prod.libelle,
              raw: prod as unknown as ProduitItem,
            })
          }
        } catch { /* ignore */ }
      }
    }

    setLignesIntervention([...lignesIntervention, {
      codeIntervention: intv.codeTravail,
      libelle: intv.libelle,
      nbr: 1,
      medecinId: null,
      assistantId: null,
      rawIntervention: intv,
      produitsAssociesRaw,
    }])
    setIntervSearch('')
    setIntervSuggestions([])
  }

  const removeIntervention = (idx: number) => {
    setLignesIntervention(lignesIntervention.filter((_, i) => i !== idx))
  }

  const updateIntervention = (idx: number, updates: Partial<LigneIntervention>) => {
    const lignes = [...lignesIntervention]
    lignes[idx] = { ...lignes[idx], ...updates }
    setLignesIntervention(lignes)
  }

  const addProduitFromSearch = (p: ProduitItem) => {
    if (lignesProduit.some((l) => l.codeProduit === p.codeProduit)) {
      toast.error('Produit déjà ajouté')
      return
    }
    setLignesProduit([...lignesProduit, {
      codeProduit: p.codeProduit,
      libelle: p.libelle,
      quantite: 1,
      rawProduit: p,
    }])
    setProduitSearch('')
    setProduitSuggestions([])
  }

  const removeProduit = (idx: number) => {
    setLignesProduit(lignesProduit.filter((_, i) => i !== idx))
  }

  const getIntPrix = (l: LigneIntervention) => getInterventionPrix(l.rawIntervention, tarifType)
  const getProdAssoPrix = (p: ProduitAssocieRaw) => getProduitPrix(p.raw, tarifType)
  const getProdManuelPrix = (l: LigneProduit) => l.rawProduit ? getProduitPrix(l.rawProduit, tarifType) : 0

  const totalInterventions = lignesIntervention.reduce((sum, l) => sum + getIntPrix(l) * l.nbr, 0)
  const totalProduitsAssocies = lignesIntervention.reduce(
    (sum, l) => sum + l.produitsAssociesRaw.reduce((s, p) => s + getProdAssoPrix(p), 0) * l.nbr,
    0
  )
  const totalProduitsManuels = lignesProduit.reduce((sum, l) => sum + getProdManuelPrix(l) * l.quantite, 0)
  const totalGeneral = totalInterventions + totalProduitsAssocies + totalProduitsManuels

  const handleSave = async () => {
    if (!selectedPatient) {
      toast.error('Sélectionnez un patient')
      return
    }
    if (lignesIntervention.length === 0) {
      toast.error('Ajoutez au moins une intervention')
      return
    }
    setSaving(true)
    try {
      const produits = [
        ...lignesIntervention.flatMap((l) =>
          l.produitsAssociesRaw.map((p) => ({ codeProduit: p.code, quantite: l.nbr }))
        ),
        ...lignesProduit.filter((l) => l.codeProduit).map((l) => ({
          codeProduit: l.codeProduit,
          quantite: l.quantite,
        })),
      ]

      const result = await trpc.facture.create.mutate({
        numeroPatient: selectedPatient.numeroPatient,
        dateVisite,
        typePatient: TARIF_OPTIONS.findIndex((t) => t.value === tarifType) + 1,
        typeCas,
        tarifType,
        interventions: lignesIntervention.map((l) => ({
          codeIntervention: l.codeIntervention,
          nbr: l.nbr,
          medecinId: l.medecinId || undefined,
          assistantId: l.assistantId || undefined,
        })),
        produits,
      })

      toast.success(`Facture ${(result as any)?.numeroOrdre || numeroOrdre} créée`)
      router.push('/factures')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nouvelle facture</h1>
          <p className="text-muted-foreground">N° Ordre : <Badge variant="outline" className="font-mono">{numeroOrdre}</Badge></p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/factures')}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      {/* En-tête facture */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Patient search */}
            <div className="space-y-2 col-span-2 relative">
              <Label>Patient *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="N° patient ou nom..."
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatient(null) }}
                  className="pl-9"
                />
              </div>
              {patientSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                  {patientSuggestions.map((p) => (
                    <button
                      key={p.id}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent text-sm"
                      onClick={() => selectPatient(p)}
                    >
                      <Badge variant="outline" className="font-mono text-xs">{p.numeroPatient}</Badge>
                      <span>{p.nom}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date visite */}
            <div className="space-y-2">
              <Label>Date visite</Label>
              <Input type="date" value={dateVisite} onChange={(e) => setDateVisite(e.target.value)} />
            </div>

            {/* Tarif */}
            <div className="space-y-2">
              <Label>Tarif</Label>
              <Select value={tarifType} onValueChange={setTarifType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TARIF_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type de cas */}
          <div className="flex items-center gap-6 mt-4">
            <Label className="text-sm text-muted-foreground">Type :</Label>
            {[
              { value: 'rendez_vous', label: 'Rendez-vous' },
              { value: 'nouvelle_fiche', label: 'Nouvelle fiche' },
              { value: 'ancien_cas', label: 'Ancien cas' },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={typeCas === opt.value}
                  onCheckedChange={() => setTypeCas(opt.value as typeof typeCas)}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal : Interventions + Facturation */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tableau interventions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Interventions</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code ou libellé..."
                value={interventionSearch}
                onChange={(e) => setIntervSearch(e.target.value)}
                className="pl-9"
              />
              {interventionSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                  {interventionSuggestions.map((i) => (
                    <button
                      key={i.codeTravail}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent text-sm"
                      onClick={() => addIntervention(i)}
                    >
                      <Badge variant="outline" className="font-mono text-xs">{i.codeTravail}</Badge>
                      <span className="flex-1 truncate">{i.libelle}</span>
                      <span className="text-xs text-muted-foreground">
                        {getInterventionPrix(i, tarifType).toLocaleString()} Ar
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="w-14">Nbr</TableHead>
                  <TableHead className="w-28">Médecin</TableHead>
                  <TableHead className="w-28">Assistant</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignesIntervention.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-muted-foreground text-sm">
                      Recherchez et ajoutez des interventions
                    </TableCell>
                  </TableRow>
                ) : (
                  lignesIntervention.map((l, idx) => (
                    <TableRow key={l.codeIntervention}>
                      <TableCell className="font-mono text-xs">{l.codeIntervention}</TableCell>
                      <TableCell className="text-sm">{l.libelle}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={l.nbr}
                          onChange={(e) => updateIntervention(idx, { nbr: parseInt(e.target.value) || 1 })}
                          className="h-7 w-12"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={l.medecinId ? String(l.medecinId) : ''}
                          onValueChange={(v) => updateIntervention(idx, { medecinId: v ? parseInt(v) : null })}
                        >
                          <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="-" /></SelectTrigger>
                          <SelectContent>
                            {medecins.map((m) => (
                              <SelectItem key={m.id} value={String(m.id)}>{m.prenom} {m.nom}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={l.assistantId ? String(l.assistantId) : ''}
                          onValueChange={(v) => updateIntervention(idx, { assistantId: v ? parseInt(v) : null })}
                        >
                          <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="-" /></SelectTrigger>
                          <SelectContent>
                            {assistants.map((a) => (
                              <SelectItem key={a.id} value={String(a.id)}>{a.prenom} {a.nom}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeIntervention(idx)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tableau facturation */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Facturation</CardTitle>
              <Badge variant="secondary" className="text-sm">
                {TARIF_OPTIONS.find((t) => t.value === tarifType)?.label || 'Public'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Désignation</TableHead>
                  <TableHead className="w-14 text-right">Qté</TableHead>
                  <TableHead className="w-24 text-right">Prix</TableHead>
                  <TableHead className="w-28 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignesIntervention.map((l) => (
                  <Fragment key={`grp-${l.codeIntervention}`}>
                    <TableRow className="bg-muted/30">
                      <TableCell className="text-sm font-medium">
                        <Badge variant="outline" className="font-mono text-xs mr-2">{l.codeIntervention}</Badge>
                        {l.libelle}
                      </TableCell>
                      <TableCell className="text-right">{l.nbr}</TableCell>
                      <TableCell className="text-right text-sm">{getIntPrix(l).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{(getIntPrix(l) * l.nbr).toLocaleString()} Ar</TableCell>
                    </TableRow>
                    {l.produitsAssociesRaw.map((p) => (
                      <TableRow key={`prod-${l.codeIntervention}-${p.code}`} className="text-muted-foreground">
                        <TableCell className="text-xs pl-8">
                          <Badge variant="outline" className="font-mono text-xs mr-1">{p.code}</Badge>
                          {p.libelle}
                        </TableCell>
                        <TableCell className="text-right text-xs">{l.nbr}</TableCell>
                        <TableCell className="text-right text-xs">{getProdAssoPrix(p).toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs">{(getProdAssoPrix(p) * l.nbr).toLocaleString()} Ar</TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}

                {lignesProduit.map((l, idx) => (
                  <TableRow key={`manual-${idx}`}>
                    <TableCell className="text-sm">
                      <Badge variant="outline" className="font-mono text-xs mr-1">{l.codeProduit}</Badge>
                      {l.libelle}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={1}
                        value={l.quantite}
                        onChange={(e) => {
                          const lignes = [...lignesProduit]
                          lignes[idx] = { ...l, quantite: parseInt(e.target.value) || 1 }
                          setLignesProduit(lignes)
                        }}
                        className="h-7 w-14"
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm">{getProdManuelPrix(l).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-sm">{(getProdManuelPrix(l) * l.quantite).toLocaleString()} Ar</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeProduit(idx)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {lignesIntervention.length === 0 && lignesProduit.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground text-sm">
                      Ajoutez des interventions pour voir la facturation
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Footer : recherche produit + total */}
            <div className="border-t p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Ajouter un produit (code ou libellé)..."
                  value={produitSearch}
                  onChange={(e) => setProduitSearch(e.target.value)}
                  className="pl-9"
                />
                {produitSuggestions.length > 0 && (
                  <div className="absolute z-10 bottom-full mb-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                    {produitSuggestions.map((p) => (
                      <button
                        key={p.codeProduit}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent text-sm"
                        onClick={() => addProduitFromSearch(p)}
                      >
                        <Badge variant="outline" className="font-mono text-xs">{p.codeProduit}</Badge>
                        <span className="flex-1 truncate">{p.libelle}</span>
                        <span className="text-xs text-muted-foreground">
                          {getProduitPrix(p, tarifType).toLocaleString()} Ar
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {totalInterventions > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interventions</span>
                  <span>{totalInterventions.toLocaleString()} Ar</span>
                </div>
              )}
              {totalProduitsAssocies > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produits (interventions)</span>
                  <span>{totalProduitsAssocies.toLocaleString()} Ar</span>
                </div>
              )}
              {totalProduitsManuels > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produits (ajoutés)</span>
                  <span>{totalProduitsManuels.toLocaleString()} Ar</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>{totalGeneral.toLocaleString()} Ar</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
