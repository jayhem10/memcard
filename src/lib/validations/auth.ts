import { z } from 'zod';

/**
 * Schéma de validation pour l'authentification (login/signup)
 */
export const authSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    ),
});

/**
 * Schéma de validation pour le login uniquement
 * (peut être moins strict que le signup)
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis'),
});

/**
 * Schéma de validation pour l'inscription
 * (plus strict que le login)
 */
export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    ),
});

/**
 * Types TypeScript inférés depuis les schémas Zod
 */
export type AuthInput = z.infer<typeof authSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

