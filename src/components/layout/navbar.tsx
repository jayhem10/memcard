'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Menu, X } from 'lucide-react';
import { ThemeSelector } from '@/components/theme/theme-selector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfileStore } from '@/store/useProfileStore';
import { useAuth } from '@/context/auth-context';

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { profile, isLoading, fetchProfile } = useProfileStore();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user && !profile && !isLoading) {
      fetchProfile();
    }
  }, [user, profile, isLoading, fetchProfile]);

  const navigation = [
    { name: 'Ma Collection', href: '/collection' },
    { name: 'Rechercher', href: '/search' },
    { name: 'Profil', href: '/profile' },
    { name: 'Admin', href: '/admin' },
  ];

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
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <ThemeSelector />
            <Button variant="destructive" onClick={handleSignOut}>
              Déconnexion
            </Button>
            {profile && (
              <Link href="/profile" className="ml-2">
                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                  <AvatarImage 
                    src={profile.avatar_url || ''} 
                    alt={profile.full_name || profile.username || 'Utilisateur'} 
                  />
                  <AvatarFallback>
                    {(profile.full_name || profile.username || profile.email?.split('@')[0] || 'U')
                      .split(' ')
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
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
                      .map(n => n[0])
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
            <Button
              variant="destructive"
              className="w-full mt-2"
              onClick={handleSignOut}
            >
              Déconnexion
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
