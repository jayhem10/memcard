'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PlusCircle, Library, Gift, User, Users, UserPlus, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/store';
import { useAuth } from '@/context/auth-context';

export function BottomNavbar() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { profile } = useProfile();
  const { user } = useAuth();
  
  const tabParam = searchParams.get('tab');
  const isWishlistActive = pathname === '/collection' && tabParam === 'wishlist';
  const isCollectionActive = pathname === '/collection' && (tabParam === null || tabParam !== 'wishlist');

  // Ne pas afficher sur certaines pages (login, etc.)
  const hideOnPaths = ['/login', '/auth/callback'];
  if (hideOnPaths.some(path => pathname?.startsWith(path))) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden shadow-lg"
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
        minHeight: 'calc(4rem + max(env(safe-area-inset-bottom), 0px))'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center" style={{ paddingBottom: 0 }}>
        <div className="flex justify-around items-center w-full h-full">
          {/* Collection */}
          <Link
            href="/collection"
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              isCollectionActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title={t('collection')}
          >
            <Library className={`h-5 w-5 ${isCollectionActive ? 'text-primary' : ''}`} />
            <span className="text-xs font-medium">{t('collection')}</span>
          </Link>

          {/* Wishlist */}
          <Link
            href="/collection?tab=wishlist"
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              isWishlistActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Wishlist"
          >
            <Gift className={`h-5 w-5 ${isWishlistActive ? 'text-primary' : ''}`} />
            <span className="text-xs font-medium">Wishlist</span>
          </Link>


          {/* Amis */}
          <Link
            href="/friends"
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              pathname?.startsWith('/friends')
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title={t('friends')}
          >
            <UserPlus className={`h-5 w-5 ${pathname?.startsWith('/friends') ? 'text-primary' : ''}`} />
            <span className="text-xs font-medium">{t('friends')}</span>
          </Link>

          {/* Ajouter un jeu */}
          <Link
            href="/search"
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              pathname === '/search'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title={t('addGame')}
          >
            <PlusCircle className={`h-5 w-5 ${pathname === '/search' ? 'text-primary' : ''}`} />
            <span className="text-xs font-medium">{t('addGameShort')}</span>
          </Link>

          {/* Notifications */}
          {user && (
            <div className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              pathname?.startsWith('/notifications')
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}>
              <div className="relative">
                <Bell className={`h-5 w-5 ${pathname?.startsWith('/notifications') ? 'text-primary' : ''}`} />
                {/* Badge de compteur si nécessaire */}
              </div>
              <span className="text-xs font-medium">Notif.</span>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
}

