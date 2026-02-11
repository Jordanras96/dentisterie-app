'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { BarChart3, Loader2, Users, Baby } from 'lucide-react'

interface StatsSexe {
  M: number
  F: number
  Inconnu: number
}

interface StatsAge {
  bebe: number
  enfant: number
  adolescent: number
  adulte: number
  age: number
}

export default function StatistiquesPage() {
  const [annee, setAnnee] = useState(new Date().getFullYear())
  const [statsSexe, setStatsSexe] = useState<StatsSexe | null>(null)
  const [statsAge, setStatsAge] = useState<StatsAge | null>(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const [sexe, age] = await Promise.all([
        trpc.statistique.parSexe.query({ annee }),
        trpc.statistique.parAge.query({ annee }),
      ])
      setStatsSexe(sexe as StatsSexe)
      setStatsAge(age as StatsAge)
    } catch {
      toast.error('Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  const totalSexe = statsSexe ? statsSexe.M + statsSexe.F + statsSexe.Inconnu : 0
  const totalAge = statsAge ? statsAge.bebe + statsAge.enfant + statsAge.adolescent + statsAge.adulte + statsAge.age : 0

  const pct = (val: number, total: number) => total > 0 ? Math.round((val / total) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Statistiques</h1>
          <p className="text-muted-foreground">Analyses démographiques des patients</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={2020}
            max={2030}
            value={annee}
            onChange={(e) => setAnnee(parseInt(e.target.value) || new Date().getFullYear())}
            className="w-28"
          />
          <Button onClick={generate} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Générer
          </Button>
        </div>
      </div>

      {statsSexe && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                Répartition par sexe — {annee}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <StatBar label="Masculin" value={statsSexe.M} total={totalSexe} color="bg-blue-500" />
                <StatBar label="Féminin" value={statsSexe.F} total={totalSexe} color="bg-pink-500" />
                <StatBar label="Non spécifié" value={statsSexe.Inconnu} total={totalSexe} color="bg-gray-400" />
              </div>
              <p className="text-sm text-muted-foreground">Total : {totalSexe} patients</p>
            </CardContent>
          </Card>

          {statsAge && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Baby className="h-5 w-5" />
                  Répartition par âge — {annee}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <StatBar label="Bébé (0-2 ans)" value={statsAge.bebe} total={totalAge} color="bg-purple-400" />
                  <StatBar label="Enfant (2-12 ans)" value={statsAge.enfant} total={totalAge} color="bg-green-400" />
                  <StatBar label="Adolescent (12-18 ans)" value={statsAge.adolescent} total={totalAge} color="bg-yellow-500" />
                  <StatBar label="Adulte (18-60 ans)" value={statsAge.adulte} total={totalAge} color="bg-blue-500" />
                  <StatBar label="Senior (60+ ans)" value={statsAge.age} total={totalAge} color="bg-orange-500" />
                </div>
                <p className="text-sm text-muted-foreground">Total : {totalAge} patients</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!statsSexe && !loading && (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">Sélectionnez une année et cliquez sur &quot;Générer&quot;</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value} ({percentage}%)</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted">
        <div className={`h-2.5 rounded-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
