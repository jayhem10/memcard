'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Menu, X, Settings, LogOut, User, MoreVertical, Heart, PlusCircle, Library, Shield, Trophy, Sparkles, Bookmark } from 'lucide-react';
import { ThemeSelector } from '@/components/theme/theme-selector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SupportButton } from '@/components/ui/support-button';
import { useProfileStore } from '@/store/useProfileStore';
import { useAuth } from '@/context/auth-context';
import { useUserRole } from '@/hooks/useUserRole';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { profile, isLoading, fetchProfile } = useProfileStore();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  
  const tabParam = searchParams.get('tab');
  const isWishlistActive = pathname === '/collection' && tabParam === 'wishlist';
  const isCollectionActive = pathname === '/collection' && (tabParam === null || tabParam !== 'wishlist');

  useEffect(() => {
    if (user && !profile && !isLoading) {
      fetchProfile();
    }
  }, [user, profile, isLoading, fetchProfile]);

  const navigation = [
    { name: 'Collection', href: '/collection', icon: Library },
  ];
  
  // Afficher le rang si le quiz est complété, sinon afficher le bouton pour le quiz
  const showQuizLink = !profile?.quiz_completed;
  const userRank = profile?.rank_name_fr;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">MemCard</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/collection' ? isCollectionActive : pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Bouton Wishlist */}
            <Link
              href="/collection?tab=wishlist"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                isWishlistActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Bookmark className="h-4 w-4" />
              Wishlist
            </Link>
            
            {/* Bouton Ajouter un jeu */}
            <Link
              href="/search"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                pathname === '/search'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              Ajouter un jeu
            </Link>
            
            {/* Sélecteur de thème */}
            <div className="ml-2">
              <ThemeSelector />
            </div>

            {/* Menu déroulant avec Avatar */}
            {profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-2">
                    <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                      <AvatarImage 
                        src={profile.avatar_url || ''} 
                        alt={profile.full_name || profile.username || 'Utilisateur'} 
                      />
                      <AvatarFallback>
                        {(profile.full_name || profile.username || profile.email?.split('@')[0] || 'U')
                          .split(' ')
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile.full_name || profile.username || 'Utilisateur'}
                      </p>
                      {profile.email && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {profile.email}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {showQuizLink ? (
                    <DropdownMenuItem asChild>
                      <Link href="/quiz" className="cursor-pointer">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Découvrir mon rang
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem disabled className="opacity-100 cursor-default">
                      <Trophy className="mr-2 h-4 w-4" />
                      <span className="font-medium">{userRank || "Rang non défini"}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Administration
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => window.open('https://ko-fi.com/jayhem10', '_blank', 'noopener,noreferrer')}
                    className="cursor-pointer"
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Soutenir
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Ouvrir le menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {showQuizLink ? (
                    <DropdownMenuItem asChild>
                      <Link href="/quiz" className="cursor-pointer">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Découvrir mon rang
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem disabled className="opacity-100 cursor-default">
                      <Trophy className="mr-2 h-4 w-4" />
                      <span className="font-medium">{userRank || "Rang non défini"}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Administration
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => window.open('https://ko-fi.com/jayhem10', '_blank', 'noopener,noreferrer')}
                    className="cursor-pointer"
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Soutenir
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <div className="mr-2">
              <ThemeSelector />
            </div>
            {profile && (
              <Link href="/profile" className="mr-2">
                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                  <AvatarImage 
                    src={profile.avatar_url || ''} 
                    alt={profile.full_name || profile.username || 'Utilisateur'} 
                  />
                  <AvatarFallback>
                    {(profile.full_name || profile.username || profile.email?.split('@')[0] || 'U')
                      .split(' ')
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {showQuizLink ? (
              <Link
                href="/quiz"
                className="block px-3 py-2 rounded-md text-base font-medium bg-accent-foreground text-accent animate-pulse hover:animate-none"
                onClick={() => setIsMenuOpen(false)}
              >
                Découvrir mon rang
              </Link>
            ) : (
              <span className="block px-3 py-2 rounded-md text-base font-medium bg-accent-foreground text-accent">
                {userRank || "Rang non défini"}
              </span>
            )}
            <div className="py-2">
              <SupportButton 
                size="sm" 
                className="w-full justify-center" 
              />
            </div>
            <div className="">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleSignOut}
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
