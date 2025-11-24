'use client';

import { UserMinus, ExternalLink, Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useFriends, Friend } from '@/hooks/useFriends';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

export function FriendsList() {
  const t = useTranslations('friends');
  const { friends, isLoading, error, removeFriendAsync, isRemovingFriend } = useFriends();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les amis en fonction de la recherche
  const filteredFriends: Friend[] = useMemo(() => {
    const friendsArray = friends as Friend[];
    if (!searchQuery.trim()) return friendsArray;

    const query = searchQuery.toLowerCase().trim();
    return friendsArray.filter(friend =>
      friend.username?.toLowerCase().includes(query) ||
      friend.full_name?.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  const handleViewCollection = (friendId: string) => {
    router.push(`/collectors/${friendId}`);
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    try {
      await removeFriendAsync(friendId);
      // Vider la recherche pour rafraîchir l'affichage
      setSearchQuery('');
    } catch (error) {
      // L'erreur est déjà gérée par le hook
      console.error('Erreur lors de la suppression:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('friendsList')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2">{t('friendsLoading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('friendsList')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {t('friendsLoadingError')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t('friendsList')} ({(friends as Friend[]).length})</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {(friends as Friend[]).length > 0 && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('searchFriendPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}
        {(friends as Friend[]).length === 0 ? (
          <div className="text-center py-6">
            <div className="text-muted-foreground">
              <p className="text-sm">{t('noFriendsYet')}</p>
              <p className="text-xs mt-1">
                {t('noFriendsHint')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
            {filteredFriends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={friend.avatar_url || ''} alt={friend.username || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm">
                    {friend.username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate text-sm">
                    {friend.username || t('noFriends')}
                  </h4>
                  {friend.full_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {friend.full_name}
                    </p>
                  )}
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewCollection(friend.id)}
                    className="h-8 w-8 p-0"
                    title={t('viewCollection')}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isRemovingFriend}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        title={t('removeFriend')}
                      >
                        <UserMinus className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('removeFriendTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('removeFriendConfirm', { username: friend.username || t('removeFriend') })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('removeFriend')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveFriend(friend.id, friend.username || t('removeFriend'))}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('removeFriend')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
