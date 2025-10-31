import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est authentifié
    const authHeader = request.headers.get('authorization');
    // Note: L'authentification est vérifiée côté client, mais pour plus de sécurité
    // vous pourriez ajouter une vérification JWT ici

    const body: ContactRequest = await request.json();
    const { subject, message, userEmail, userName } = body;

    // Validation
    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Le sujet et le message sont requis' },
        { status: 400 }
      );
    }

    if (subject.length < 3 || subject.length > 200) {
      return NextResponse.json(
        { error: 'Le sujet doit contenir entre 3 et 200 caractères' },
        { status: 400 }
      );
    }

    if (message.length < 10 || message.length > 2000) {
      return NextResponse.json(
        { error: 'Le message doit contenir entre 10 et 2000 caractères' },
        { status: 400 }
      );
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

        return NextResponse.json({ 
          success: true,
          message: 'Email envoyé avec succès' 
        });
      } catch (resendError: any) {
        console.error('Resend error:', resendError);
        throw resendError; // Relancer l'erreur pour qu'elle soit capturée et loggée
      }
    }

    // Option 2 : Fallback - Utiliser Supabase pour stocker temporairement
    // et envoyer via une fonction Edge ou un service externe
    // Ici, on peut aussi simplement logger l'email pour debug
    console.log('📧 Contact Email Request:');
    console.log('To:', CONTACT_EMAIL);
    console.log('From:', userEmail);
    console.log('Subject:', emailSubject);
    console.log('Body:', emailBody);

    // Pour l'instant, on retourne un succès même sans service d'email configuré
    // Vous devrez configurer un service d'email (Resend, SendGrid, etc.)
    // pour que les emails soient réellement envoyés
    
        // Si aucun service d'email n'est configuré, retourner une erreur claire
        return NextResponse.json(
          { 
            error: 'Service d\'email non configuré. Veuillez configurer RESEND_API_KEY ou un autre service d\'email dans les variables d\'environnement.',
            details: 'Le message a été loggé dans la console mais n\'a pas été envoyé par email.'
          },
          { status: 503 }
        );

  } catch (error: any) {
    console.error('Error in contact API:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors de l\'envoi du message' },
      { status: 500 }
    );
  }
}

