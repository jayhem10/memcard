'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/store';
import { contactSchema, type ContactInput } from '@/lib/validations/contact';

export default function ContactPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: profile?.username || user?.email?.split('@')[0] || '',
      email: user?.email || '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactInput) => {
    setIsSubmitting(true);
    
    try {
      // Utiliser la Server Action au lieu de l'API Route
      const { sendContactMessage } = await import('@/actions/contact');
      await sendContactMessage(data);

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            Contact
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Envoyez-nous un message et nous vous répondrons à l'adresse {user?.email || 'mail de votre compte'}.
          </p>
        </div>
      </section>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
        <CardContent className="relative p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Votre nom"
                  {...register('name')}
                  className={`rounded-lg ${errors.name ? 'border-destructive' : ''}`}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  {...register('email')}
                  className={`rounded-lg ${errors.email ? 'border-destructive' : ''}`}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Sujet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="Ex: Question sur ma collection, bug signalé, suggestion..."
                {...register('subject')}
                className={`rounded-lg ${errors.subject ? 'border-destructive' : ''}`}
              />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Message <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="message"
                rows={8}
                placeholder="Décrivez votre demande, question ou problème en détail..."
                {...register('message')}
                className={`flex min-h-[120px] w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
                  errors.message ? 'border-destructive' : ''
                }`}
              />
              {errors.message && (
                <p className="text-sm text-destructive">{errors.message.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isSubmitting}
                className="rounded-lg"
              >
                Réinitialiser
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-lg shadow-lg hover:shadow-xl transition-all">
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
      </div>
    </div>
  );
}

