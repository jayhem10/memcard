'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCodeScanner } from './QrCodeScanner';
import { useFriends } from '@/hooks/useFriends';
import { toast } from 'sonner';
import { Code, QrCode, CheckCircle } from 'lucide-react';

// Fonction utilitaire pour traduire les codes d'erreur du backend
function getFriendErrorMessage(errorCode: string | undefined, t: (key: string) => string): string {
  switch (errorCode) {
    case 'INVALID_FRIEND_CODE':
      return t('invalidFriendCode');
    case 'CANNOT_ADD_YOURSELF':
      return t('cannotAddYourself');
    case 'ALREADY_FRIENDS':
      return t('alreadyFriends');
    case 'USER_NOT_FOUND':
      return t('userNotFound');
    default:
      return t('addFriendError');
  }
}

type AddFriendMode = 'code' | 'qr';

export function AddFriendByCode() {
  const t = useTranslations('friends');
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
      toast.error(t('enterCodeError'));
      return;
    }

    const normalizedCode = friendCode.trim().toUpperCase();

    if (normalizedCode.length !== 8) {
      toast.error(t('codeLengthError'));
      return;
    }

    setIsSubmitting(true);

    try {
      await addFriendAsync(normalizedCode);
      setFriendCode('');
      toast.success(t('friendAdded'));
    } catch (error: any) {
      // Afficher toujours un toast d'erreur
      const errorMessage = getFriendErrorMessage(error?.message, t);
      toast.error(errorMessage);
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
      toast.success(t('friendAdded'));
    } catch (error: any) {
      // Afficher toujours un toast d'erreur
      const errorMessage = getFriendErrorMessage(error?.message, t);
      toast.error(errorMessage);
      console.error('Erreur lors de l\'ajout:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQrError = (error: string) => {
    // Ajouter des conseils supplémentaires selon le type d'erreur
    let fullMessage = error;

    if (error.includes('autoriser l\'accès') || error.includes('Permission denied')) {
      fullMessage += '\n\n' + t('qrPermissionTip');
    } else if (error.includes('HTTPS')) {
      fullMessage += '\n\n' + t('qrHttpsTip');
    } else if (error.includes('navigateur ne supporte')) {
      fullMessage += '\n\n' + t('qrBrowserTip');
    }

    toast.error(fullMessage);
  };

  const isValidCode = friendCode.length === 8;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t('addFriend')}</CardTitle>
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
            {t('friendCode')}
          </Button>
          <Button
            variant={mode === 'qr' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('qr')}
            className="flex-1"
          >
            <QrCode className="w-4 h-4 mr-2" />
            {t('scanQr')}
          </Button>
        </div>

        {/* Mode saisie de code */}
        {mode === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-3">
            <div className="space-y-2">
              <Input
                placeholder={t('enterFriendCode')}
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
                      {t('validCode')}
                    </>
                  ) : (
                    t('codeCharacters', { count: friendCode.length })
                  )}
                </Badge>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!isValidCode || isAddingFriend || isSubmitting}
            >
              {isAddingFriend || isSubmitting ? t('addingFriend') : t('addFriendButton')}
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
