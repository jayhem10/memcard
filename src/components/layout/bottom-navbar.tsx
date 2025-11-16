'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { PlusCircle, Library, Gift, User, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/store';
import { useAuth } from '@/context/auth-context';
import { Notifications } from '@/components/notifications/notifications';

export function BottomNavbar() {
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
            title="Collection"
          >
            <Library className={`h-5 w-5 ${isCollectionActive ? 'text-primary' : ''}`} />
            <span className="text-xs font-medium">Collection</span>
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

          {/* Collectionneurs */}
          <Link
            href="/collectors"
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              pathname?.startsWith('/collectors')
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Collectionneurs"
          >
            <Users className={`h-5 w-5 ${pathname?.startsWith('/collectors') ? 'text-primary' : ''}`} />
            <span className="text-xs font-medium">Collect.</span>
          </Link>

          {/* Ajouter un jeu */}
          <Link
            href="/search"
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              pathname === '/search'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Ajouter un jeu"
          >
            <PlusCircle className={`h-5 w-5 ${pathname === '/search' ? 'text-primary' : ''}`} />
            <span className="text-xs font-medium">Ajouter</span>
          </Link>

          {/* Notifications */}
          {user && (
            <div className="flex flex-col items-center justify-center gap-1 px-4 py-2">
              <Notifications />
            </div>
          )}

          {/* Profil */}
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              pathname === '/profile'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Mon profil"
          >
            {profile ? (
              <Avatar className="h-6 w-6">
                <AvatarImage 
                  src={profile.avatar_url || ''} 
                  alt={profile.full_name || profile.username || 'Utilisateur'} 
                />
                <AvatarFallback className="text-xs">
                  {(profile.full_name || profile.username || profile.email?.split('@')[0] || 'U')
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <User className={`h-5 w-5 ${pathname === '/profile' ? 'text-primary' : ''}`} />
            )}
            <span className="text-xs font-medium">Profil</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

