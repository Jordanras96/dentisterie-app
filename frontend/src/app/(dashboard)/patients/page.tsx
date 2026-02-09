'use client'

import { useState, useEffect, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Plus, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

interface Patient {
  id: number
  numeroPatient: string
  nom: string
  dateNaissance: string | null
  sexe: string | null
  profession: string | null
  telephone: string | null
  derniereVisite: string | null
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [sexeFilter, setSexeFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [form, setForm] = useState({
    numeroPatient: '',
    nom: '',
    dateNaissance: '',
    sexe: '' as '' | 'M' | 'F',
    profession: '',
    telephone: '',
    adresse: '',
    observations: '',
  })

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const result = await trpc.patient.list.query({
        page,
        limit: 25,
        search: search || undefined,
        sexe: (sexeFilter as 'M' | 'F') || undefined,
      })
      setPatients(result.data as unknown as Patient[])
      setTotal(result.total)
      setPages(result.pages)
    } catch {
      toast.error('Erreur lors du chargement des patients')
    } finally {
      setLoading(false)
    }
  }, [page, search, sexeFilter])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.numeroPatient || !form.nom) {
      toast.error('Numéro patient et nom sont obligatoires')
      return
    }
    try {
      await trpc.patient.create.mutate({
        ...form,
        sexe: form.sexe || undefined,
        dateNaissance: form.dateNaissance || undefined,
      })
      toast.success('Patient créé avec succès')
      setDialogOpen(false)
      setForm({ numeroPatient: '', nom: '', dateNaissance: '', sexe: '', profession: '', telephone: '', adresse: '', observations: '' })
      fetchPatients()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-muted-foreground">{total} patients enregistrés</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau patient</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>N° Patient *</Label>
                  <Input value={form.numeroPatient} onChange={(e) => setForm({ ...form, numeroPatient: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Nom complet *</Label>
                  <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Date de naissance</Label>
                  <Input type="date" value={form.dateNaissance} onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Sexe</Label>
                  <Select value={form.sexe} onValueChange={(v) => setForm({ ...form, sexe: v as 'M' | 'F' })}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Profession</Label>
                  <Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Créer le patient</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou numéro..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={sexeFilter} onValueChange={(v) => { setSexeFilter(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Sexe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="M">Masculin</SelectItem>
                <SelectItem value="F">Féminin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Patient</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Sexe</TableHead>
                <TableHead>Date de naissance</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Dernière visite</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : patients.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.numeroPatient}</TableCell>
                      <TableCell className="font-medium">{p.nom}</TableCell>
                      <TableCell>
                        {p.sexe && (
                          <Badge variant={p.sexe === 'M' ? 'default' : 'secondary'}>
                            {p.sexe === 'M' ? 'M' : 'F'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.dateNaissance
                          ? format(new Date(p.dateNaissance), 'dd/MM/yyyy', { locale: fr })
                          : '-'}
                      </TableCell>
                      <TableCell>{p.telephone || '-'}</TableCell>
                      <TableCell>
                        {p.derniereVisite
                          ? format(new Date(p.derniereVisite), 'dd/MM/yyyy', { locale: fr })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Link href={`/patients/${p.numeroPatient}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
              {!loading && patients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Aucun patient trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {pages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Page {page} sur {pages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
