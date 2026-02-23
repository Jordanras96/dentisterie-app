/**
 * Form validation utilities for all frontend forms.
 */

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

/**
 * Validate patient form data.
 */
export function validatePatientForm(data: {
  nom?: string
  sexe?: string
  numeroPatient?: string
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.nom || data.nom.trim().length === 0) {
    errors.nom = 'Le nom est requis'
  }

  if (data.sexe && !['M', 'F'].includes(data.sexe)) {
    errors.sexe = 'Le sexe doit être M ou F'
  }

  if (data.numeroPatient !== undefined && data.numeroPatient.trim().length === 0) {
    errors.numeroPatient = 'Le numéro patient est requis'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * Validate product form data.
 */
export function validateProductForm(data: {
  codeProduit?: string
  libelle?: string
  prixVte?: number
  prixAchat?: number
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.codeProduit || data.codeProduit.trim().length === 0) {
    errors.codeProduit = 'Le code produit est requis'
  }

  if (!data.libelle || data.libelle.trim().length === 0) {
    errors.libelle = 'Le libellé est requis'
  }

  if (data.prixVte !== undefined && data.prixVte < 0) {
    errors.prixVte = 'Le prix de vente ne peut pas être négatif'
  }

  if (data.prixAchat !== undefined && data.prixAchat < 0) {
    errors.prixAchat = "Le prix d'achat ne peut pas être négatif"
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * Validate intervention form data.
 */
export function validateInterventionForm(data: {
  codeTravail?: string
  libelle?: string
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.codeTravail || data.codeTravail.trim().length === 0) {
    errors.codeTravail = 'Le code travail est requis'
  }

  if (!data.libelle || data.libelle.trim().length === 0) {
    errors.libelle = 'Le libellé est requis'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * Validate rendez-vous form data.
 */
export function validateRendezVousForm(data: {
  numeroPatient?: string
  dateRdv?: string
  heureDebut?: string
  heureFin?: string
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.numeroPatient || data.numeroPatient.trim().length === 0) {
    errors.numeroPatient = 'Le numéro patient est requis'
  }

  if (!data.dateRdv || data.dateRdv.trim().length === 0) {
    errors.dateRdv = 'La date est requise'
  }

  if (!data.heureDebut) {
    errors.heureDebut = "L'heure de début est requise"
  }

  if (!data.heureFin) {
    errors.heureFin = "L'heure de fin est requise"
  }

  if (data.heureDebut && data.heureFin && data.heureDebut >= data.heureFin) {
    errors.heureFin = "L'heure de fin doit être après l'heure de début"
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * Validate login form data.
 */
export function validateLoginForm(data: {
  username?: string
  password?: string
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.username || data.username.trim().length === 0) {
    errors.username = "Le nom d'utilisateur est requis"
  }

  if (!data.password || data.password.length === 0) {
    errors.password = 'Le mot de passe est requis'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * Validate password change form.
 */
export function validatePasswordChangeForm(data: {
  oldPassword?: string
  newPassword?: string
  confirm?: string
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.oldPassword || data.oldPassword.length === 0) {
    errors.oldPassword = 'Le mot de passe actuel est requis'
  }

  if (!data.newPassword || data.newPassword.length === 0) {
    errors.newPassword = 'Le nouveau mot de passe est requis'
  } else if (data.newPassword.length < 4) {
    errors.newPassword = 'Le mot de passe doit contenir au moins 4 caractères'
  }

  if (data.newPassword && data.confirm && data.newPassword !== data.confirm) {
    errors.confirm = 'Les mots de passe ne correspondent pas'
  }

  if (!data.confirm) {
    errors.confirm = 'La confirmation est requise'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * Sanitize string input to prevent XSS/injection.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate that a string doesn't contain SQL injection patterns.
 */
export function isSafeInput(input: string): boolean {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
  ]
  return !dangerousPatterns.some((pattern) => pattern.test(input))
}
