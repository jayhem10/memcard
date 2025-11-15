import { z } from 'zod';

/**
 * Schéma de validation pour la mise à jour du profil utilisateur
 */
export const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(30, 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'
    )
    .optional(),
  full_name: z
    .string()
    .max(100, 'Le nom complet ne peut pas dépasser 100 caractères')
    .optional()
    .nullable(),
  avatar_url: z
    .string()
    .url('L\'URL de l\'avatar doit être valide')
    .optional()
    .nullable(),
  theme: z
    .enum(['light', 'dark', 'system'], {
      errorMap: () => ({ message: 'Le thème doit être light, dark ou system' }),
    })
    .optional(),
  is_public: z
    .boolean()
    .optional(),
});

/**
 * Schéma de validation pour le changement de mot de passe
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Le mot de passe actuel est requis'),
  newPassword: z
    .string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    ),
  confirmPassword: z
    .string()
    .min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

/**
 * Schéma combiné pour le formulaire de profil complet
 * Inclut les champs du profil + optionnellement le changement de mot de passe
 */
export const profileFormSchema = z.object({
  username: z
    .string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(30, 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'
    ),
  full_name: z
    .string()
    .max(100, 'Le nom complet ne peut pas dépasser 100 caractères')
    .optional()
    .nullable(),
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  avatar_url: z
    .string()
    .refine((val) => {
      // Si vide ou null, c'est OK
      if (!val || val.trim() === '') return true;
      // Sinon, doit être une URL valide
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, {
      message: 'L\'URL de l\'avatar doit être valide',
    })
    .optional()
    .nullable(),
  // Champs optionnels pour le changement de mot de passe
  currentPassword: z
    .string()
    .optional(),
  newPassword: z
    .string()
    .optional(),
  confirmPassword: z
    .string()
    .optional(),
}).refine((data) => {
  // Si un nouveau mot de passe est fourni, valider avec les règles strictes
  if (data.newPassword && data.newPassword.trim() !== '') {
    if (data.newPassword.length < 8) {
      return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.newPassword)) {
      return false;
    }
    if (data.newPassword !== data.confirmPassword) {
      return false;
    }
    if (!data.currentPassword || data.currentPassword.trim() === '') {
      return false;
    }
  }
  return true;
}, {
  message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre. Le mot de passe actuel est requis.',
  path: ['newPassword'],
}).refine((data) => {
  // Si un nouveau mot de passe est fourni, le mot de passe actuel est requis
  if (data.newPassword && data.newPassword.trim() !== '') {
    if (!data.currentPassword || data.currentPassword.trim() === '') {
      return false;
    }
  }
  return true;
}, {
  message: 'Le mot de passe actuel est requis pour changer le mot de passe',
  path: ['currentPassword'],
}).refine((data) => {
  // Si confirmPassword est fourni et non vide, il doit correspondre à newPassword
  if (data.confirmPassword && data.confirmPassword.trim() !== '' && data.newPassword) {
    return data.confirmPassword === data.newPassword;
  }
  return true;
}, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

/**
 * Types TypeScript inférés depuis les schémas Zod
 */
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ProfileFormInput = z.infer<typeof profileFormSchema>;

