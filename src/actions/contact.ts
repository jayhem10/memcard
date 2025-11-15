'use server';

import { contactSchema, type ContactInput } from '@/lib/validations/contact';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server Action pour envoyer un message de contact
 * 
 * @param data - Données du formulaire de contact validées avec Zod
 * @returns Résultat de l'envoi
 */
export async function sendContactMessage(data: ContactInput) {
  // Validation avec Zod
  const validatedData = contactSchema.parse(data);

  // Récupérer le client Supabase serveur
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
  
  // Récupérer l'utilisateur authentifié
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw new Error('Non authentifié');
  }

  // Email de destination depuis les variables d'environnement
  const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'contact@memcard.fr';
  const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'contact@memcard.fr';

  // Validation de la longueur (déjà fait par Zod, mais sécurité supplémentaire)
  if (validatedData.subject.length < 3 || validatedData.subject.length > 200) {
    throw new Error('Le sujet doit contenir entre 3 et 200 caractères');
  }

  if (validatedData.message.length < 10 || validatedData.message.length > 2000) {
    throw new Error('Le message doit contenir entre 10 et 2000 caractères');
  }

  // Préparer le contenu de l'email
  const emailSubject = `[MemCard Contact] ${validatedData.subject}`;
  const emailBody = `
Bonjour,

Vous avez reçu un nouveau message de contact depuis MemCard.

**De :** ${validatedData.name} (${validatedData.email})
**Sujet :** ${validatedData.subject}

**Message :**
${validatedData.message}

---
Ce message a été envoyé automatiquement depuis le formulaire de contact de MemCard.
Pour répondre à l'utilisateur, utilisez l'adresse email : ${validatedData.email}
  `.trim();

  // Utiliser Resend pour envoyer l'email
  if (process.env.RESEND_API_KEY) {
    const fromEmail = `MemCard <${RESEND_FROM_EMAIL}>`;

    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: CONTACT_EMAIL,
          reply_to: validatedData.email,
          subject: emailSubject,
          text: emailBody,
        }),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.json();
        const errorMessage = errorData.message || 'Erreur lors de l\'envoi via Resend';
        
        console.error('Resend API Error:', {
          status: resendResponse.status,
          statusText: resendResponse.statusText,
          error: errorData,
        });
        
        throw new Error(errorMessage);
      }

      return { 
        success: true,
        message: 'Email envoyé avec succès' 
      };
    } catch (error: any) {
      console.error('Resend error:', error);
      throw new Error(error.message || 'Erreur lors de l\'envoi de l\'email');
    }
  }
  
  // Si aucun service d'email n'est configuré
  throw new Error(
    'Service d\'email non configuré. Veuillez configurer RESEND_API_KEY dans les variables d\'environnement.'
  );
}

