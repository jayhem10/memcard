'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, LogIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useFriends } from '@/hooks/useFriends';
import { toast } from 'sonner';

export default function AddFriendPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addFriendAsync, isAddingFriend } = useFriends();

  const friendCode = params.code as string;

  useEffect(() => {
    const addFriend = async () => {
      if (!user || !friendCode) return;

      const normalizedCode = friendCode.toUpperCase();

      try {
        await addFriendAsync(normalizedCode);
        toast.success('Ami ajouté avec succès !');

        // Rediriger vers la page amis après un court délai
        setTimeout(() => {
          router.push('/friends');
        }, 2000);

      } catch (error: any) {
        // L'erreur est déjà affichée par le hook via toast
        console.error('Erreur lors de l\'ajout d\'ami:', error);
      }
    };

    if (user && friendCode) {
      addFriend();
    }
  }, [user, friendCode, addFriendAsync, router]);

  // Si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <LogIn className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle>Connexion requise</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Vous devez être connecté pour ajouter un ami.
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Se connecter
            </Button>
            <p className="text-sm text-muted-foreground">
              Votre code ami : <code className="font-mono">{friendCode}</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // État de chargement
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <CardTitle>Ajout d'un ami</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Recherche de l'utilisateur avec le code <code className="font-mono">{friendCode}</code>...
          </p>

          {isAddingFriend && (
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Ajout en cours...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
