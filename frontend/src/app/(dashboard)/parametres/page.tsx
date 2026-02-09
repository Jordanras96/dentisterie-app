'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Settings, Save, Loader2 } from 'lucide-react'

export default function ParametresPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nomEtablissement: '',
    adresse: '',
    telephone: '',
    email: '',
    logo: '',
  })

  useEffect(() => {
    async function load() {
      try {
        const data = await trpc.parametre.get.query()
        if (data) {
          setForm({
            nomEtablissement: (data as Record<string, string>).nomEtablissement || '',
            adresse: (data as Record<string, string>).adresse || '',
            telephone: (data as Record<string, string>).telephone || '',
            email: (data as Record<string, string>).email || '',
            logo: (data as Record<string, string>).logo || '',
          })
        }
      } catch {
        toast.error('Erreur lors du chargement des paramètres')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await trpc.parametre.update.mutate(form)
      toast.success('Paramètres mis à jour')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Configuration de l&apos;établissement</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-5 w-5" />
            Informations de l&apos;établissement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom de l&apos;établissement</Label>
            <Input
              value={form.nomEtablissement}
              onChange={(e) => setForm({ ...form, nomEtablissement: e.target.value })}
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              disabled={!isAdmin}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={!isAdmin}
              />
            </div>
          </div>
          {isAdmin && (
            <Button onClick={handleSave} disabled={saving} className="mt-2">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Enregistrer
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
