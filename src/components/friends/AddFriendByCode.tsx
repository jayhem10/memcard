'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCodeScanner } from './QrCodeScanner';
import { useFriends } from '@/hooks/useFriends';
import { toast } from 'sonner';
import { Code, QrCode, CheckCircle } from 'lucide-react';

type AddFriendMode = 'code' | 'qr';

export function AddFriendByCode() {
  const [mode, setMode] = useState<AddFriendMode>('code');
  const [friendCode, setFriendCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addFriendAsync, isAddingFriend } = useFriends();

  // Reset le code quand on change de mode
  useEffect(() => {
    setFriendCode('');
  }, [mode]);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Protection contre les doubles soumissions
    if (isSubmitting || isAddingFriend) {
      return;
    }

    if (!friendCode.trim()) {
      toast.error('Veuillez saisir un code ami');
      return;
    }

    const normalizedCode = friendCode.trim().toUpperCase();

    if (normalizedCode.length !== 8) {
      toast.error('Le code ami doit contenir 8 caractères');
      return;
    }

    setIsSubmitting(true);

    try {
      await addFriendAsync(normalizedCode);
      setFriendCode('');
      toast.success('Ami ajouté avec succès !');
    } catch (error: any) {
      // Afficher toujours un toast d'erreur
      toast.error(error?.message || 'Erreur lors de l\'ajout de l\'ami');
      console.error('Erreur lors de l\'ajout:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQrScan = async (scannedCode: string) => {
    // Protection contre les doubles soumissions
    if (isSubmitting || isAddingFriend) {
      return;
    }

    setIsSubmitting(true);

    try {
      await addFriendAsync(scannedCode);
      toast.success('Ami ajouté avec succès !');
    } catch (error: any) {
      // Afficher toujours un toast d'erreur
      toast.error(error?.message || 'Erreur lors de l\'ajout de l\'ami');
      console.error('Erreur lors de l\'ajout:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQrError = (error: string) => {
    toast.error(error);
  };

  const isValidCode = friendCode.length === 8;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Ajouter un ami</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Boutons de sélection du mode */}
        <div className="flex gap-2">
          <Button
            variant={mode === 'code' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('code')}
            className="flex-1"
          >
            <Code className="w-4 h-4 mr-2" />
            Code ami
          </Button>
          <Button
            variant={mode === 'qr' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('qr')}
            className="flex-1"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Scanner QR
          </Button>
        </div>

        {/* Mode saisie de code */}
        {mode === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-3">
            <div className="space-y-2">
              <Input
                placeholder="Entrez le code ami"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value.toUpperCase().slice(0, 8))}
                maxLength={8}
                disabled={isAddingFriend}
                className="font-mono text-center text-lg tracking-widest"
              />
              <div className="flex justify-center">
                <Badge variant={isValidCode ? 'default' : 'secondary'} className="text-xs">
                  {isValidCode ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Code valide
                    </>
                  ) : (
                    `${friendCode.length}/8 caractères`
                  )}
                </Badge>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!isValidCode || isAddingFriend || isSubmitting}
            >
              {isAddingFriend || isSubmitting ? 'Ajout en cours...' : 'Ajouter l\'ami'}
            </Button>
          </form>
        )}

        {/* Mode scanner QR */}
        {mode === 'qr' && (
          <QrCodeScanner
            onScan={handleQrScan}
            onError={handleQrError}
          />
        )}
      </CardContent>
    </Card>
  );
}
