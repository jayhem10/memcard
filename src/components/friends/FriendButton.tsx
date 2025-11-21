'use client';

import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFriendshipStatus, useFriends } from '@/hooks/useFriends';
import { toast } from 'sonner';

interface FriendButtonProps {
  targetUserId: string;
  targetUsername: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
}

export function FriendButton({
  targetUserId,
  targetUsername,
  variant = 'outline',
  size = 'sm',
  showText = true
}: FriendButtonProps) {
  const { isFriend, isLoading: statusLoading } = useFriendshipStatus(targetUserId);
  const { addFriendAsync, removeFriendAsync, isAddingFriend, isRemovingFriend } = useFriends();

  const handleAddFriend = async () => {
    // Récupérer le profil de l'utilisateur cible pour obtenir son code ami
    try {
      // On utilise une approche différente - on va chercher le code ami via une API
      const response = await fetch(`/api/profiles/${targetUserId}/friend-code`);
      if (!response.ok) {
        throw new Error('Impossible de récupérer le code ami');
      }

      const data = await response.json();
      await addFriendAsync(data.friendCode);
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de l\'ami');
      console.error('Erreur:', error);
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await removeFriendAsync(targetUserId);
    } catch (error) {
      // L'erreur est déjà gérée par le hook
      console.error('Erreur lors de la suppression:', error);
    }
  };

  if (statusLoading) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
        {showText && <span className="ml-2">Chargement...</span>}
      </Button>
    );
  }

  if (isFriend) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleRemoveFriend}
        disabled={isRemovingFriend}
        className="text-destructive hover:text-destructive"
      >
        <UserMinus className="w-4 h-4" />
        {showText && (
          <span className="ml-2">
            {isRemovingFriend ? 'Suppression...' : 'Retirer'}
          </span>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddFriend}
      disabled={isAddingFriend}
    >
      <UserPlus className="w-4 h-4" />
      {showText && (
        <span className="ml-2">
          {isAddingFriend ? 'Ajout...' : 'Ajouter'}
        </span>
      )}
    </Button>
  );
}
