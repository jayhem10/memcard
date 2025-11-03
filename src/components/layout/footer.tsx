'use client';

import { Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="text-center">
            <span className="text-lg font-bold">MemCard</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              © {currentYear} Tous droits réservés
            </span>
        </div>
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            MemCard est une plateforme de gestion de collection de jeux vidéo.
            <br />
            Toutes les marques et logos sont la propriété de leurs détenteurs respectifs.
          </p>
        </div>
      </div>
    </footer>
  );
}
