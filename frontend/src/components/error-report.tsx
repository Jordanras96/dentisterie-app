'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Bug, Send, Loader2 } from 'lucide-react'

const REPORT_EMAIL = 'riantsoa96@gmail.com'

export function ErrorReportButton() {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    page: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Veuillez remplir le titre et la description')
      return
    }

    setSending(true)
    try {
      const currentPage = typeof window !== 'undefined' ? window.location.href : ''
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      const timestamp = new Date().toISOString()

      const subject = encodeURIComponent(`[Bug Report] ${form.title}`)
      const body = encodeURIComponent(
        `Rapport d'erreur - Dentisterie HLA\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📋 Titre: ${form.title}\n\n` +
        `📝 Description:\n${form.description}\n\n` +
        `🔗 Page: ${form.page || currentPage}\n` +
        `🕐 Date: ${timestamp}\n` +
        `💻 Navigateur: ${userAgent}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Ce rapport a été envoyé automatiquement depuis l'application Dentisterie.`
      )

      const mailtoUrl = `mailto:${REPORT_EMAIL}?subject=${subject}&body=${body}`
      window.open(mailtoUrl, '_blank')

      toast.success('Le rapport a été préparé dans votre client email')
      setOpen(false)
      setForm({ title: '', description: '', page: '' })
    } catch {
      toast.error("Erreur lors de la préparation du rapport")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-4 right-4 z-50 h-10 w-10 rounded-full bg-destructive text-white shadow-lg hover:bg-destructive/90 hover:text-white"
          title="Signaler une erreur"
        >
          <Bug className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-destructive" />
            Signaler une erreur
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Titre de l&apos;erreur *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Impossible de créer une facture"
            />
          </div>
          <div className="space-y-2">
            <Label>Description détaillée *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Décrivez les étapes pour reproduire l'erreur, ce que vous attendiez et ce qui s'est passé..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Page concernée</Label>
            <Input
              value={form.page}
              onChange={(e) => setForm({ ...form, page: e.target.value })}
              placeholder="Auto-détecté si vide"
            />
          </div>
          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Envoyer le rapport
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
