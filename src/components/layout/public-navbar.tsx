'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeSelector } from '@/components/theme/theme-selector';

export function PublicNavbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">MemCard</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-1.5 md:gap-3">
            <div className="hidden md:block">
              <ThemeSelector />
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs md:text-sm px-2 md:px-3 h-9 md:h-9 font-medium" 
              asChild
            >
              <Link href="/login">
                <span className="hidden sm:inline">Se connecter</span>
                <span className="sm:hidden">Connexion</span>
              </Link>
            </Button>
            <Button 
              size="sm" 
              className="text-xs md:text-sm px-2 md:px-3 h-9 md:h-9 font-medium whitespace-nowrap" 
              asChild
            >
              <Link href="/login?mode=signup">
                <span className="hidden sm:inline">Créer un compte</span>
                <span className="sm:hidden">S'inscrire</span>
              </Link>
            </Button>
            <div className="md:hidden ml-0.5">
              <ThemeSelector />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

