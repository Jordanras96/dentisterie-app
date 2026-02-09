'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { UserCog, Lock, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface UserInfo {
  id: number
  username: string
  role: string
  permissions: Record<string, boolean>
  isActive: boolean
  createdAt: string
}

interface DeletionReq {
  id: number
  module: string
  entityType: string
  entityId: string
  reason: string | null
  status: string
  createdAt: string
  user: { username: string }
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  OPERATOR: 'Opérateur',
}

export default function UtilisateursPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserInfo[]>([])
  const [deletionRequests, setDeletionRequests] = useState<DeletionReq[]>([])
  const [loading, setLoading] = useState(true)
  const [passwordDialog, setPasswordDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirm: '' })

  useEffect(() => {
    async function load() {
      try {
        const [usersData, reqData] = await Promise.all([
          trpc.user.list.query(),
          trpc.user.deletionRequests.query(),
        ])
        setUsers(usersData as unknown as UserInfo[])
        setDeletionRequests(reqData as unknown as DeletionReq[])
      } catch {
        toast.error('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    try {
      await trpc.user.changePassword.mutate({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Mot de passe mis à jour')
      setPasswordDialog(false)
      setPasswordForm({ oldPassword: '', newPassword: '', confirm: '' })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  const handleApprove = async (requestId: number, approve: boolean) => {
    try {
      await trpc.user.approveDeletion.mutate({ requestId, approve })
      toast.success(approve ? 'Suppression approuvée' : 'Suppression rejetée')
      setDeletionRequests((prev) => prev.filter((r) => r.id !== requestId))
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erreur')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground">Gestion des comptes et permissions</p>
        </div>
        <Button variant="outline" onClick={() => setPasswordDialog(true)}>
          <Lock className="mr-2 h-4 w-4" />
          Changer mon mot de passe
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="h-5 w-5" />
            Comptes utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Permissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'SUPER_ADMIN' ? 'destructive' : u.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {roleLabels[u.role] || u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? 'default' : 'destructive'}>
                      {u.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(u.permissions || {}).map(([key, val]) => (
                        <Badge key={key} variant={val ? 'outline' : 'destructive'} className="text-[10px]">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {deletionRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Demandes de suppression en attente
              <Badge variant="destructive" className="ml-2">{deletionRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Demandeur</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletionRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{req.user.username}</TableCell>
                    <TableCell>{req.module}</TableCell>
                    <TableCell>{req.entityType}</TableCell>
                    <TableCell className="font-mono text-sm">{req.entityId}</TableCell>
                    <TableCell>{format(new Date(req.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="default" onClick={() => handleApprove(req.id, true)}>
                          <CheckCircle className="mr-1 h-4 w-4" />Approuver
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleApprove(req.id, false)}>
                          <XCircle className="mr-1 h-4 w-4" />Rejeter
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Changer mon mot de passe</DialogTitle></DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Mot de passe actuel</Label>
              <Input type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Confirmer</Label>
              <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Mettre à jour</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
