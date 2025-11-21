'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Copy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMyProfile } from '@/hooks/useFriends';
import { toast } from 'sonner';

export function FriendCodeCard() {
  const { data: profile, isLoading, error } = useMyProfile();

  const shareUrl = profile ? `${window.location.origin}/add-friend/${profile.friend_code}` : '';

  const copyToClipboard = async () => {
    if (!profile?.friend_code) return;

    try {
      await navigator.clipboard.writeText(profile.friend_code);
      toast.success('Code ami copié !');
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Mon code ami
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="w-full h-48 bg-muted rounded-lg"></div>
            <div className="w-32 h-8 bg-muted rounded mx-auto"></div>
            <div className="flex gap-2 justify-center">
              <div className="w-24 h-9 bg-muted rounded"></div>
              <div className="w-24 h-9 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Mon code ami
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Erreur lors du chargement du code ami
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-4 h-4" />
          Mon code ami
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code - Plus compact */}
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-lg shadow-sm border">
            <QRCode
              value={shareUrl}
              size={120}
              id="friend-qr-code"
            />
          </div>
        </div>

        {/* Code texte - Plus compact */}
        <div className="flex items-center justify-center gap-2">
          <code className="text-xl font-mono bg-muted px-2 py-1 rounded select-all text-center border min-w-[140px]">
            {profile.friend_code}
          </code>
          <Button onClick={copyToClipboard} variant="outline" size="sm" className="flex-shrink-0">
            <Copy className="w-3 h-3" />
          </Button>
        </div>

        {/* Bouton d'action */}
        <div className="flex justify-center">
          <Button onClick={copyToClipboard} variant="outline" size="sm">
            <Copy className="w-3 h-3 mr-1" />
            Copier le code
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center leading-tight">
          Scannez ou partagez votre code ami !
        </p>
      </CardContent>
    </Card>
  );
}
