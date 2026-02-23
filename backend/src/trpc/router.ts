import { router } from './trpc'
import { authRouter } from './routers/auth'
import { patientRouter } from './routers/patient'
import { interventionRouter } from './routers/intervention'
import { produitRouter } from './routers/produit'
import { factureRouter } from './routers/facture'
import { rendezVousRouter } from './routers/rendezVous'
import { personnelRouter } from './routers/personnel'
import { rapportRouter } from './routers/rapport'
import { statistiqueRouter } from './routers/statistique'
import { parametreRouter } from './routers/parametre'
import { userRouter } from './routers/user'
import { tarifRouter } from './routers/tarif'

export const appRouter = router({
  auth: authRouter,
  patient: patientRouter,
  intervention: interventionRouter,
  produit: produitRouter,
  facture: factureRouter,
  rendezVous: rendezVousRouter,
  personnel: personnelRouter,
  rapport: rapportRouter,
  statistique: statistiqueRouter,
  parametre: parametreRouter,
  user: userRouter,
  tarif: tarifRouter,
})

export type AppRouter = typeof appRouter
