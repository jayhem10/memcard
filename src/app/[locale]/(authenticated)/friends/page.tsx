'use client';

import { FriendCodeCard } from '@/components/friends/FriendCodeCard';
import { AddFriendByCode } from '@/components/friends/AddFriendByCode';
import { FriendsList } from '@/components/friends/FriendsList';
import { useTranslations } from 'next-intl';

export default function FriendsPage() {
  const t = useTranslations('navigation');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl"></div>
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            {t('friendsTitle')}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            {t('friendsDescription')}
          </p>
        </div>
      </section>

      {/* Grille principale pour réduire les espaces */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Code ami + Ajout d'amis */}
        <div className="lg:col-span-1 space-y-6">
          <FriendCodeCard />
          <AddFriendByCode />
        </div>

        {/* Colonne droite : Liste des amis */}
        <div className="lg:col-span-2">
          <FriendsList />
        </div>
      </div>
    </div>
  );
}
