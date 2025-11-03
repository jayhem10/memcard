import { withApi, ApiError } from '@/lib/api-wrapper';
import { validateBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * Route API pour envoyer un email de contact
 * 
 * Cette route utilise un service d'email externe pour envoyer les messages.
 * 
 * Options disponibles :
 * 1. Resend (recommandé) - https://resend.com
 * 2. SendGrid - https://sendgrid.com
 * 3. Nodemailer avec SMTP
 * 4. Supabase Edge Function
 * 
 * Configuration requise dans .env.local :
 * - CONTACT_EMAIL=contact@memcard.fr (email de destination)
 * - RESEND_API_KEY=votre_clé_resend (si vous utilisez Resend)
 * - ou EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, etc. (si vous utilisez SMTP)
 */

interface ContactRequest {
  subject: string;
  message: string;
  userEmail: string;
  userName: string;
}

// Email de destination depuis les variables d'environnement
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'contact@memcard.fr';

// Email d'envoi - utiliser le domaine vérifié (memcard.fr)
// Le domaine doit être vérifié sur Resend pour envoyer à d'autres adresses
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'contact@memcard.fr';

export const POST = withApi(async (request, { user }) => {
  const body = await request.json();

  // Validation des champs requis
  validateBody<ContactRequest>(body, ['subject', 'message', 'userEmail', 'userName']);

    const { subject, message, userEmail, userName } = body;

  // Validation de la longueur
    if (subject.length < 3 || subject.length > 200) {
    throw new ApiError('Le sujet doit contenir entre 3 et 200 caractères', 400);
    }

    if (message.length < 10 || message.length > 2000) {
    throw new ApiError('Le message doit contenir entre 10 et 2000 caractères', 400);
    }

    // Préparer le contenu de l'email
    const emailSubject = `[MemCard Contact] ${subject}`;
    const emailBody = `
Bonjour,

Vous avez reçu un nouveau message de contact depuis MemCard.

**De :** ${userName} (${userEmail})
**Sujet :** ${subject}

**Message :**
${message}

---
Ce message a été envoyé automatiquement depuis le formulaire de contact de MemCard.
Pour répondre à l'utilisateur, utilisez l'adresse email : ${userEmail}
    `.trim();

    // Option 1 : Utiliser Resend (recommandé)
    if (process.env.RESEND_API_KEY) {
      // Utiliser l'email du domaine vérifié (memcard.fr)
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
            reply_to: userEmail,
            subject: emailSubject,
            text: emailBody,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json();
          const errorMessage = errorData.message || 'Erreur lors de l\'envoi via Resend';
          
          // Log détaillé pour debug
          console.error('Resend API Error:', {
            status: resendResponse.status,
            statusText: resendResponse.statusText,
            error: errorData,
            from: fromEmail,
            to: CONTACT_EMAIL
          });
          
          throw new Error(errorMessage);
        }

        return { 
          success: true,
          message: 'Email envoyé avec succès' 
        };
      } catch (resendError: any) {
        console.error('Resend error:', resendError);
        throw new ApiError(
          resendError.message || 'Erreur lors de l\'envoi via Resend',
          500
        );
      }
    }
    
    // Si aucun service d'email n'est configuré, throw une erreur
    throw new ApiError(
      'Service d\'email non configuré. Veuillez configurer RESEND_API_KEY ou un autre service d\'email dans les variables d\'environnement.',
      503
    );
});

