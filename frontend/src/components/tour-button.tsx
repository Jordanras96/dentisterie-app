'use client'

import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'
import { startTour } from '@/lib/guided-tours'

const pathToTourMap: Record<string, string> = {
  '/patients': 'patients',
  '/factures': 'factures',
  '/factures/nouvelle': 'nouvelle-facture',
  '/produits': 'produits',
  '/interventions': 'interventions',
  '/rendez-vous': 'rendez-vous',
  '/statistiques': 'statistiques',
  '/utilisateurs': 'utilisateurs',
}

export function TourButton() {
  const pathname = usePathname()
  const tourName = pathToTourMap[pathname]

  if (!tourName) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed bottom-4 right-16 z-50 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
      title="Guide interactif"
      onClick={() => startTour(tourName)}
    >
      <HelpCircle className="h-5 w-5" />
    </Button>
  )
}
