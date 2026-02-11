'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function PatientDetailClient() {
  const params = useParams()
  const router = useRouter()
  const numero = params.numero as string
  const [patient, setPatient] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nom: '',
    dateNaissance: '',
    sexe: '',
    profession: '',
    telephone: '',
    telephone2: '',
    adresse: '',
    observations: '',
  })

  useEffect(() => {
    async function load() {
      try {
        const p = await trpc.patient.getByNumero.query({ numero })
        setPatient(p as unknown as Record<string, unknown>)
        setForm({
          nom: p.nom || '',
          dateNaissance: p.dateNaissance ? format(new Date(p.dateNaissance as unknown as string), 'yyyy-MM-dd') : '',
          sexe: p.sexe || '',
          profession: p.profession || '',
          telephone: p.telephone || '',
          telephone2: (p as unknown as Record<string, string>).telephone2 || '',
          adresse: p.adresse || '',
          observations: p.observations || '',
        })
      } catch {
        toast.error('Patient non trouvé')
        router.push('/patients')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [numero, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      await trpc.patient.update.mutate({
        numero,
        ...form,
        sexe: (form.sexe as 'M' | 'F') || undefined,
        dateNaissance: form.dateNaissance || undefined,
      })
      toast.success('Patient mis à jour')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce patient ?')) return
    try {
      const result = await trpc.patient.delete.mutate({ numero })
      toast.success((result as { message: string }).message)
      router.push('/patients')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!patient) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/patients')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{form.nom}</h1>
          <p className="text-muted-foreground font-mono">N° {numero}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Informations personnelles</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de naissance</Label>
                <Input type="date" value={form.dateNaissance} onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sexe</Label>
                <Input value={form.sexe} onChange={(e) => setForm({ ...form, sexe: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Profession</Label>
              <Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone 2</Label>
              <Input value={form.telephone2} onChange={(e) => setForm({ ...form, telephone2: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Observations</Label>
              <Textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} rows={3} />
            </div>
          </CardContent>
        </Card>
      </div>

      {(() => {
        const factures = patient.factures as Array<{ numeroOrdre: string; dateVisite: string; montantTotal: number }> | undefined
        if (!factures || factures.length === 0) return null
        return (
          <Card>
            <CardHeader><CardTitle>Dernières factures</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {factures.map((f) => (
                  <div key={f.numeroOrdre} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <span className="font-mono text-sm">{f.numeroOrdre}</span>
                      <span className="ml-3 text-sm text-muted-foreground">
                        {format(new Date(f.dateVisite), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </div>
                    <Badge variant="secondary">{Number(f.montantTotal).toLocaleString()} Ar</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })()}
    </div>
  )
}
