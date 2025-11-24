'use client';

import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { exportCollectionToExcel, GameExportData } from '@/lib/excel-export';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

interface ExportButtonProps {
  games: GameExportData[];
  activeTab?: 'collection' | 'wishlist';
  filename?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  filters?: {
    console?: string;
    genre?: string;
    status?: string;
    search?: string;
  };
  consoleName?: string; // Nom de la console pour l'affichage
}

export function ExportButton({
  games,
  activeTab = 'collection',
  filename = 'export',
  variant = 'outline',
  size = 'default',
  className = '',
  filters = {},
  consoleName
}: ExportButtonProps) {
  const t = useTranslations('common');
  const locale = useLocale();
  const isFrench = locale === 'fr';
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (games.length === 0) {
      toast.error(t('noGamesFound'));
      return;
    }

    try {
      setIsExporting(true);
      
      // Filtrer les jeux selon l'onglet actif
      const filteredGames = games.filter(game => {
        const status = game.status || '';
        if (activeTab === 'collection') {
          return !['wishlist', 'WISHLIST'].includes(status);
        } else {
          return ['wishlist', 'WISHLIST'].includes(status);
        }
      });

      if (filteredGames.length === 0) {
        toast.error(activeTab === 'collection' ? t('noGamesInCollection') : t('noGamesInWishlist'));
        return;
      }

      // Générer un nom de fichier avec timestamp et filtres
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const tabSuffix = activeTab === 'collection' ? 'collection' : 'wishlist';
      
      // Ajouter les filtres au nom de fichier
      const filterParts = [];
      if (filters.console && filters.console !== 'all') {
        // Utiliser le nom de la console si disponible, sinon l'ID
        const consoleNameToUse = consoleName || filters.console;
        filterParts.push(consoleNameToUse.toLowerCase().replace(/\s+/g, '_'));
      }
      if (filters.genre && filters.genre !== 'all') {
        filterParts.push(filters.genre.toLowerCase().replace(/\s+/g, '_'));
      }
      if (filters.status && filters.status !== 'all') {
        filterParts.push(filters.status.toLowerCase().replace(/\s+/g, '_'));
      }
      if (filters.search && filters.search.trim()) {
        filterParts.push('recherche');
      }
      
      const filterSuffix = filterParts.length > 0 ? `_${filterParts.join('_')}` : '';
      const finalFilename = `${filename}_${tabSuffix}${filterSuffix}_${timestamp}`;

      exportCollectionToExcel(filteredGames, finalFilename, isFrench);
      toast.success(activeTab === 'collection' ? t('collectionExported') : t('wishlistExported'));
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error(t('exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || games.length === 0}
      variant={variant}
      size={size}
      className={`${className}`}
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
          <span className="hidden sm:inline">{t('exporting')}</span>
          <span className="sm:hidden">{t('exportingShort')}</span>
        </>
      ) : (
        <>
          <FileSpreadsheet className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">{t('exportExcel')}</span>
          <span className="sm:hidden">{t('export')}</span>
        </>
      )}
    </Button>
  );
}
