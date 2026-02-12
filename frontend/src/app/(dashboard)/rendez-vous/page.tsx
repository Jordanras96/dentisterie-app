'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Plus, CalendarDays, Clock, ChevronLeft, ChevronRight,
  Users, CheckCircle2, XCircle, AlertTriangle, Trash2,
} from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths,
  subMonths, addWeeks, subWeeks, addDays, subDays,
  isToday,
} from 'date-fns'
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

type ViewMode = 'month' | 'week' | 'day'

const STATUTS = [
  { value: 'PLANIFIE', label: 'Planifié', color: 'bg-blue-500', bgLight: 'bg-blue-50 text-blue-700 border-blue-200', icon: CalendarDays },
  { value: 'CONFIRME', label: 'Confirmé', color: 'bg-green-500', bgLight: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  { value: 'EN_COURS', label: 'En cours', color: 'bg-yellow-500', bgLight: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  { value: 'TERMINE', label: 'Terminé', color: 'bg-gray-500', bgLight: 'bg-gray-50 text-gray-700 border-gray-200', icon: CheckCircle2 },
  { value: 'ANNULE', label: 'Annulé', color: 'bg-red-500', bgLight: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  { value: 'REPORTE', label: 'Reporté', color: 'bg-orange-500', bgLight: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertTriangle },
]

const getStatutInfo = (statut: string) => STATUTS.find(s => s.value === statut) || STATUTS[0]

export default function RendezVousPage() {
  const [allRdv, setAllRdv] = useState<RendezVous[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailRdv, setDetailRdv] = useState<RendezVous | null>(null)
  const [form, setForm] = useState({
    numeroPatient: '',
    dateRdv: format(new Date(), 'yyyy-MM-dd'),
    heureDebut: '08:00',
    heureFin: '09:00',
    motif: '',
  })

  const dateRange = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      return {
        start: startOfWeek(monthStart, { weekStartsOn: 1 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
      }
    } else if (viewMode === 'week') {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      }
    } else {
      return { start: currentDate, end: currentDate }
    }
  }, [currentDate, viewMode])

  const fetchRdv = useCallback(async () => {
    setLoading(true)
    try {
      const data = await trpc.rendezVous.listByRange.query({
        dateDebut: format(dateRange.start, 'yyyy-MM-dd'),
        dateFin: format(dateRange.end, 'yyyy-MM-dd'),
      })
      setAllRdv(data as unknown as RendezVous[])
    } catch {
      toast.error('Erreur lors du chargement des rendez-vous')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => { fetchRdv() }, [fetchRdv])

  const rdvByDate = useMemo(() => {
    const map = new Map<string, RendezVous[]>()
    allRdv.forEach(rdv => {
      const key = format(new Date(rdv.dateRdv), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(rdv)
    })
    return map
  }, [allRdv])

  const stats = useMemo(() => {
    const counts: Record<string, number> = {}
    STATUTS.forEach(s => { counts[s.value] = 0 })
    allRdv.forEach(rdv => { counts[rdv.statut] = (counts[rdv.statut] || 0) + 1 })
    return counts
  }, [allRdv])

  const navigate = (dir: 'prev' | 'next') => {
    if (viewMode === 'month') setCurrentDate(dir === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(dir === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
    else setCurrentDate(dir === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1))
  }

  const goToday = () => setCurrentDate(new Date())

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.numeroPatient) { toast.error('Numéro patient requis'); return }
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

  const handleUpdateStatus = async (id: number, statut: string) => {
    try {
      await trpc.rendezVous.updateStatus.mutate({ id, statut: statut as 'PLANIFIE' | 'CONFIRME' | 'EN_COURS' | 'TERMINE' | 'ANNULE' | 'REPORTE' })
      toast.success('Statut mis à jour')
      fetchRdv()
      if (detailRdv?.id === id) setDetailRdv({ ...detailRdv, statut })
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce rendez-vous ?')) return
    try {
      await trpc.rendezVous.delete.mutate({ id })
      toast.success('Rendez-vous supprimé')
      setDetailRdv(null)
      fetchRdv()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const headerLabel = useMemo(() => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy', { locale: fr })
    if (viewMode === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 })
      const we = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(ws, 'dd MMM', { locale: fr })} — ${format(we, 'dd MMM yyyy', { locale: fr })}`
    }
    return format(currentDate, 'EEEE dd MMMM yyyy', { locale: fr })
  }, [currentDate, viewMode])

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
  }, [dateRange])

  const dayRdvList = useMemo(() => {
    if (!selectedDate) return []
    return rdvByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
  }, [selectedDate, rdvByDate])

  const openCreateForDate = (date: Date) => {
    setForm({ ...form, dateRdv: format(date, 'yyyy-MM-dd') })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rendez-vous</h1>
          <p className="text-muted-foreground">{allRdv.length} rendez-vous sur la période</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border">
            {(['month', 'week', 'day'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === v ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'} ${v === 'month' ? 'rounded-l-lg' : v === 'day' ? 'rounded-r-lg' : ''}`}
              >
                {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={goToday}>Aujourd&apos;hui</Button>
          <Button data-tour="new-rdv" onClick={() => { setForm({ ...form, dateRdv: format(new Date(), 'yyyy-MM-dd') }); setDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />Nouveau RDV
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {STATUTS.map(s => (
          <Card key={s.value} className="p-3">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="mt-1 text-xl font-bold">{stats[s.value] || 0}</p>
          </Card>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate('prev')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold capitalize">{headerLabel}</h2>
        <Button variant="ghost" size="icon" onClick={() => navigate('next')}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : viewMode === 'month' ? (
        /* Monthly calendar */
        <div>
          <div className="grid grid-cols-7 gap-px rounded-t-lg bg-muted">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
              <div key={d} className="bg-background p-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-muted rounded-b-lg">
            {calendarDays.map(day => {
              const key = format(day, 'yyyy-MM-dd')
              const dayRdvs = rdvByDate.get(key) || []
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(day)}
                  onDoubleClick={() => openCreateForDate(day)}
                  className={`min-h-24 bg-background p-1.5 text-left transition-all hover:bg-accent/50 ${
                    !isCurrentMonth ? 'opacity-40' : ''
                  } ${isSelected ? 'ring-2 ring-primary ring-inset' : ''} ${
                    isToday(day) ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      isToday(day) ? 'bg-primary text-primary-foreground' : ''
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {dayRdvs.length > 0 && (
                      <span className="text-[10px] font-medium text-muted-foreground">{dayRdvs.length}</span>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayRdvs.slice(0, 3).map(rdv => {
                      const info = getStatutInfo(rdv.statut)
                      return (
                        <div
                          key={rdv.id}
                          onClick={(e) => { e.stopPropagation(); setDetailRdv(rdv) }}
                          className={`truncate rounded px-1 py-0.5 text-[10px] font-medium border cursor-pointer transition-transform hover:scale-[1.02] ${info.bgLight}`}
                        >
                          {format(new Date(rdv.heureDebut), 'HH:mm')} {rdv.patient?.nom || rdv.numeroPatient}
                        </div>
                      )
                    })}
                    {dayRdvs.length > 3 && (
                      <p className="text-[10px] text-muted-foreground text-center">+{dayRdvs.length - 3} autres</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : viewMode === 'week' ? (
        /* Weekly view */
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map(day => {
            const key = format(day, 'yyyy-MM-dd')
            const dayRdvs = rdvByDate.get(key) || []
            return (
              <Card key={key} className={`${isToday(day) ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="p-3 pb-2">
                  <p className={`text-xs font-semibold uppercase ${isToday(day) ? 'text-primary' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE dd', { locale: fr })}
                  </p>
                  <Badge variant="secondary" className="w-fit text-[10px]">{dayRdvs.length} RDV</Badge>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-1.5">
                  {dayRdvs.map(rdv => {
                    const info = getStatutInfo(rdv.statut)
                    return (
                      <button
                        key={rdv.id}
                        onClick={() => setDetailRdv(rdv)}
                        className={`w-full rounded-md border p-2 text-left text-xs transition-all hover:shadow-sm ${info.bgLight}`}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="font-mono">{format(new Date(rdv.heureDebut), 'HH:mm')}</span>
                        </div>
                        <p className="mt-0.5 font-medium truncate">{rdv.patient?.nom || rdv.numeroPatient}</p>
                      </button>
                    )
                  })}
                  {dayRdvs.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">Aucun RDV</p>}
                  <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={() => openCreateForDate(day)}>
                    <Plus className="mr-1 h-3 w-3" />Ajouter
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Daily view */
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5" />
              {format(currentDate, 'EEEE dd MMMM yyyy', { locale: fr })}
              <Badge variant="secondary" className="ml-2">
                {(rdvByDate.get(format(currentDate, 'yyyy-MM-dd')) || []).length} RDV
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const dayRdvs = rdvByDate.get(format(currentDate, 'yyyy-MM-dd')) || []
              if (dayRdvs.length === 0) {
                return <p className="py-12 text-center text-muted-foreground">Aucun rendez-vous pour cette date</p>
              }
              return (
                <div className="space-y-3">
                  {dayRdvs.map((rdv) => {
                    const info = getStatutInfo(rdv.statut)
                    return (
                      <button
                        key={rdv.id}
                        onClick={() => setDetailRdv(rdv)}
                        className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-all hover:shadow-md ${info.bgLight}`}
                      >
                        <div className="flex flex-col items-center text-sm">
                          <Clock className="mb-1 h-4 w-4" />
                          <span className="font-mono font-medium">{format(new Date(rdv.heureDebut), 'HH:mm')}</span>
                          <span className="text-xs opacity-70">{format(new Date(rdv.heureFin), 'HH:mm')}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rdv.patient?.nom || rdv.numeroPatient}</span>
                            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium`}>
                              <div className={`h-2 w-2 rounded-full ${info.color}`} />
                              {info.label}
                            </div>
                          </div>
                          {rdv.motif && <p className="mt-1 text-sm opacity-80">{rdv.motif}</p>}
                          {rdv.medecin && <p className="mt-1 text-xs opacity-60">Dr. {rdv.medecin.prenom} {rdv.medecin.nom}</p>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Selected date sidebar (month view) */}
      {viewMode === 'month' && selectedDate && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                {format(selectedDate, 'EEEE dd MMMM', { locale: fr })}
                <Badge variant="secondary">{dayRdvList.length} RDV</Badge>
              </CardTitle>
              <Button size="sm" onClick={() => openCreateForDate(selectedDate)}>
                <Plus className="mr-1 h-3 w-3" />Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dayRdvList.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground text-sm">Aucun rendez-vous</p>
            ) : (
              <div className="space-y-2">
                {dayRdvList.map(rdv => {
                  const info = getStatutInfo(rdv.statut)
                  return (
                    <div
                      key={rdv.id}
                      className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:shadow-sm transition-all ${info.bgLight}`}
                      onClick={() => setDetailRdv(rdv)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="font-mono text-sm font-medium">{format(new Date(rdv.heureDebut), 'HH:mm')}</p>
                          <p className="font-mono text-[10px] opacity-60">{format(new Date(rdv.heureFin), 'HH:mm')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{rdv.patient?.nom || rdv.numeroPatient}</p>
                          {rdv.motif && <p className="text-xs opacity-70">{rdv.motif}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${info.color}`} />
                        <span className="text-xs font-medium">{info.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau rendez-vous</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>N° Patient *</Label>
              <Input value={form.numeroPatient} onChange={(e) => setForm({ ...form, numeroPatient: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.dateRdv} onChange={(e) => setForm({ ...form, dateRdv: e.target.value })} data-tour="date-filter" />
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

      {/* Detail dialog */}
      <Dialog open={!!detailRdv} onOpenChange={(open) => { if (!open) setDetailRdv(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Détail du rendez-vous</DialogTitle></DialogHeader>
          {detailRdv && (() => {
            const info = getStatutInfo(detailRdv.statut)
            return (
              <div className="space-y-4">
                <div className={`rounded-lg border p-4 ${info.bgLight}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-3 w-3 rounded-full ${info.color}`} />
                    <span className="font-semibold">{info.label}</span>
                  </div>
                  <p className="text-lg font-bold">{detailRdv.patient?.nom || detailRdv.numeroPatient}</p>
                  <p className="text-sm opacity-70">N° {detailRdv.numeroPatient}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">{format(new Date(detailRdv.dateRdv), 'dd/MM/yyyy', { locale: fr })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Horaire</p>
                    <p className="text-sm font-medium font-mono">
                      {format(new Date(detailRdv.heureDebut), 'HH:mm')} - {format(new Date(detailRdv.heureFin), 'HH:mm')}
                    </p>
                  </div>
                </div>
                {detailRdv.motif && (
                  <div>
                    <p className="text-xs text-muted-foreground">Motif</p>
                    <p className="text-sm">{detailRdv.motif}</p>
                  </div>
                )}
                {detailRdv.medecin && (
                  <div>
                    <p className="text-xs text-muted-foreground">Médecin</p>
                    <p className="text-sm">Dr. {detailRdv.medecin.prenom} {detailRdv.medecin.nom}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Changer le statut</Label>
                  <Select value={detailRdv.statut} onValueChange={(v) => handleUpdateStatus(detailRdv.id, v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUTS.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${s.color}`} />
                            {s.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="destructive" className="w-full" onClick={() => handleDelete(detailRdv.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />Supprimer
                </Button>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
