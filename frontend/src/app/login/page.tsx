'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/auth'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)
    try {
      const result = await trpc.auth.login.mutate({ username, password })
      login(result.token, {
        ...result.user,
        role: result.user.role as 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR',
        permissions: (result.user.permissions || {}) as Record<string, boolean>,
      })
      toast.success(`Bienvenue, ${result.user.username}`)
      router.replace('/patients')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Identifiants invalides'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
      {/* Background image */}
      <Image
        src="/images/bg.png"
        alt="Hôpital Loterana Andranomadio"
        fill
        className="object-cover"
        priority
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Glassmorphism card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/images/logodt.png"
            alt="SyGeDe"
            width={72}
            height={72}
            className="rounded-2xl shadow-lg"
          />
          <h1 className="text-3xl font-bold text-white drop-shadow-md">SyGeDe</h1>
          <p className="text-sm text-white/80 text-center">
            Système de Gestion Dentisterie
            <br />
            <span className="text-xs text-white/60">Hôpitaly Loterana Andranomadio</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white/90 text-sm font-medium">
              Nom d&apos;utilisateur
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre identifiant"
              autoFocus
              disabled={loading}
              className="border-white/20 bg-white/10 text-white placeholder:text-white/40 backdrop-blur-sm focus:border-white/40 focus:ring-white/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/90 text-sm font-medium">
              Mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              disabled={loading}
              className="border-white/20 bg-white/10 text-white placeholder:text-white/40 backdrop-blur-sm focus:border-white/40 focus:ring-white/20"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 border border-white/20 transition-all duration-300"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Se connecter
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-white/40">
          SyGeDe v1.0 &mdash; Tous droits réservés
        </p>
      </div>
    </div>
  )
}
