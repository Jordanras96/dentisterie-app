'use client'

import { useState, useEffect, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, CalendarDays, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface RendezVous {
  id: number
  numeroPatient: string
  dateRdv: string
  heureDebut: string
  heureFin: string
  motif: string | null
  statut: string
  patient?: { nom: string }
  medecin?: { nom: string; prenom: string } | null
}

const statutColors: Record<string, string> = {
  PLANIFIE: 'bg-blue-100 text-blue-800',
  CONFIRME: 'bg-green-100 text-green-800',
  EN_COURS: 'bg-yellow-100 text-yellow-800',
  TERMINE: 'bg-gray-100 text-gray-800',
  ANNULE: 'bg-red-100 text-red-800',
  REPORTE: 'bg-orange-100 text-orange-800',
}

export default function RendezVousPage() {
  const [rdvList, setRdvList] = useState<RendezVous[]>([])
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    numeroPatient: '',
    dateRdv: format(new Date(), 'yyyy-MM-dd'),
    heureDebut: '08:00',
    heureFin: '09:00',
    motif: '',
  })

  const fetchRdv = useCallback(async () => {
    setLoading(true)
    try {
      const data = await trpc.rendezVous.list.query({ date: dateFilter })
      setRdvList(data as unknown as RendezVous[])
    } catch {
      toast.error('Erreur lors du chargement des rendez-vous')
    } finally {
      setLoading(false)
    }
  }, [dateFilter])

  useEffect(() => {
    fetchRdv()
  }, [fetchRdv])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.numeroPatient) {
      toast.error('Numéro patient requis')
      return
    }
    try {
      await trpc.rendezVous.create.mutate({
        numeroPatient: form.numeroPatient,
        dateRdv: form.dateRdv,
        heureDebut: `${form.dateRdv}T${form.heureDebut}:00`,
        heureFin: `${form.dateRdv}T${form.heureFin}:00`,
        motif: form.motif || undefined,
      })
      toast.success('Rendez-vous créé')
      setDialogOpen(false)
      setForm({ numeroPatient: '', dateRdv: format(new Date(), 'yyyy-MM-dd'), heureDebut: '08:00', heureFin: '09:00', motif: '' })
      fetchRdv()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rendez-vous</h1>
          <p className="text-muted-foreground">Planning journalier</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-44"
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nouveau RDV</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouveau rendez-vous</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>N° Patient *</Label>
                  <Input value={form.numeroPatient} onChange={(e) => setForm({ ...form, numeroPatient: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.dateRdv} onChange={(e) => setForm({ ...form, dateRdv: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Heure début</Label>
                    <Input type="time" value={form.heureDebut} onChange={(e) => setForm({ ...form, heureDebut: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Heure fin</Label>
                    <Input type="time" value={form.heureFin} onChange={(e) => setForm({ ...form, heureFin: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Motif</Label>
                  <Textarea value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} rows={2} />
                </div>
                <Button type="submit" className="w-full">Créer le rendez-vous</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5" />
            {format(new Date(dateFilter), 'EEEE dd MMMM yyyy', { locale: fr })}
            <Badge variant="secondary" className="ml-2">{rdvList.length} RDV</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : rdvList.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">Aucun rendez-vous pour cette date</p>
          ) : (
            <div className="space-y-3">
              {rdvList.map((rdv) => (
                <div key={rdv.id} className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/30">
                  <div className="flex flex-col items-center text-sm">
                    <Clock className="mb-1 h-4 w-4 text-muted-foreground" />
                    <span className="font-mono font-medium">
                      {format(new Date(rdv.heureDebut), 'HH:mm')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(rdv.heureFin), 'HH:mm')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rdv.patient?.nom || rdv.numeroPatient}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statutColors[rdv.statut] || 'bg-gray-100'}`}>
                        {rdv.statut}
                      </span>
                    </div>
                    {rdv.motif && <p className="mt-1 text-sm text-muted-foreground">{rdv.motif}</p>}
                    {rdv.medecin && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Dr. {rdv.medecin.prenom} {rdv.medecin.nom}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
