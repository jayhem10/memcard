'use client';

import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { exportCollectionToExcel, GameExportData } from '@/lib/excel-export';
import { toast } from 'react-hot-toast';

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
}

export function ExportButton({ 
  games, 
  activeTab = 'collection',
  filename = 'ma_collection',
  variant = 'outline',
  size = 'default',
  className = '',
  filters = {}
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (games.length === 0) {
      toast.error('Aucun jeu à exporter');
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
        toast.error(`Aucun jeu dans ${activeTab === 'collection' ? 'la collection' : 'la wishlist'}`);
        return;
      }

      // Générer un nom de fichier avec timestamp et filtres
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const tabSuffix = activeTab === 'collection' ? 'collection' : 'wishlist';
      
      // Ajouter les filtres au nom de fichier
      const filterParts = [];
      if (filters.console && filters.console !== 'all') {
        filterParts.push(filters.console.toLowerCase().replace(/\s+/g, '_'));
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

      exportCollectionToExcel(filteredGames, finalFilename);
      toast.success(`${activeTab === 'collection' ? 'Collection' : 'Wishlist'} exportée avec succès !`);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export');
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
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 mr-2" />
      )}
      {isExporting ? 'Export en cours...' : 'Exporter Excel'}
    </Button>
  );
}
