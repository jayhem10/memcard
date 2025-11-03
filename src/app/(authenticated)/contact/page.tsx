'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useProfileStore } from '@/store/useProfileStore';

type ContactFormData = {
  subject: string;
  message: string;
};

export default function ContactPage() {
  const { user } = useAuth();
  const { profile } = useProfileStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    defaultValues: {
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      // Récupérer le token d'authentification Supabase
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Ajouter le token dans les headers si disponible
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers,
        credentials: 'include', // Inclure les cookies pour l'authentification
        body: JSON.stringify({
          subject: data.subject,
          message: data.message,
          userEmail: user?.email || 'email inconnu',
          userName: profile?.username || user?.email?.split('@')[0] || 'Utilisateur',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi du message');
      }

      toast.success('Votre message a été envoyé avec succès ! Nous vous répondrons dès que possible.');
      reset();
    } catch (error: any) {
      console.error('Error sending contact message:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi du message. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="mt-2 text-muted-foreground">
          Envoyez-nous un message et nous vous répondrons à l'adresse {user?.email || 'mail de votre compte'}.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject">
                Sujet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="Ex: Question sur ma collection, bug signalé, suggestion..."
                {...register('subject', {
                  required: 'Le sujet est requis',
                  minLength: {
                    value: 3,
                    message: 'Le sujet doit contenir au moins 3 caractères',
                  },
                  maxLength: {
                    value: 200,
                    message: 'Le sujet ne peut pas dépasser 200 caractères',
                  },
                })}
                className={errors.subject ? 'border-destructive' : ''}
              />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Message <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="message"
                rows={8}
                placeholder="Décrivez votre demande, question ou problème en détail..."
                {...register('message', {
                  required: 'Le message est requis',
                  minLength: {
                    value: 10,
                    message: 'Le message doit contenir au moins 10 caractères',
                  },
                  maxLength: {
                    value: 2000,
                    message: 'Le message ne peut pas dépasser 2000 caractères',
                  },
                })}
                className={`flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.message ? 'border-destructive' : ''
                }`}
              />
              {errors.message && (
                <p className="text-sm text-destructive">{errors.message.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isSubmitting}
              >
                Réinitialiser
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

