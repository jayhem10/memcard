import { z } from 'zod';

/**
 * Schéma de validation pour le formulaire de contact
 */
export const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  subject: z
    .string()
    .min(3, 'Le sujet doit contenir au moins 3 caractères')
    .max(200, 'Le sujet ne peut pas dépasser 200 caractères'),
  message: z
    .string()
    .min(10, 'Le message doit contenir au moins 10 caractères')
    .max(2000, 'Le message ne peut pas dépasser 2000 caractères'),
});

/**
 * Type TypeScript inféré depuis le schéma Zod
 */
export type ContactInput = z.infer<typeof contactSchema>;

