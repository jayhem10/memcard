'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Tag, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useGamePrices } from '@/hooks/useGamePrices';

interface GamePriceDisplayProps {
  gameId: string;
  className?: string;
}

export default function GamePriceDisplay({ gameId, className = '' }: GamePriceDisplayProps) {
  const { data: priceData, isLoading: loading, error } = useGamePrices(gameId);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  
  // Formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non disponible';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  // Vérifier si les prix sont récents (moins de 30 jours)
  const isPriceRecent = (dateString: string) => {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    
    return date > thirtyDaysAgo;
  };

  if (loading) {
    return (
      <Card className={`${className} min-h-[200px] overflow-hidden`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Prix du marché</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Erreur réelle (ex: problème de connexion)
  if (error) {
    return (
      <Card className={`${className} overflow-hidden`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Prix du marché</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            {error.message || 'Erreur lors de la récupération des prix'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Pas d'erreur mais pas de données dans la table
  if (!priceData) {
    return (
      <Card className={`${className} overflow-hidden`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Prix du marché
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Info className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">
              Aucune donnée de prix disponible pour ce jeu.
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              Les prix seront mis à jour automatiquement depuis eBay.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Prix du marché
        </CardTitle>
        <CardDescription>
          Dernière mise à jour: {formatDate(priceData.last_updated)}
          {!isPriceRecent(priceData.last_updated) && (
            <span className="text-amber-500 ml-2 text-xs">(Prix potentiellement obsolètes)</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          <motion.div 
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-lg border border-green-200/50 dark:border-green-800/50"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="text-sm text-green-700 dark:text-green-300 font-medium flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Minimum
            </div>
            <div className="text-xl font-bold text-green-800 dark:text-green-200 mt-1 break-all" title={`${priceData.min_price.toFixed(2)}€`}>
              {priceData.min_price.toFixed(2)}€
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-lg border border-blue-200/50 dark:border-blue-800/50"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="text-sm text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Moyen
            </div>
            <div className="text-xl font-bold text-blue-800 dark:text-blue-200 mt-1 break-all" title={`${priceData.average_price.toFixed(2)}€`}>
              {priceData.average_price.toFixed(2)}€
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-lg border border-purple-200/50 dark:border-purple-800/50"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="text-sm text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Neuf
            </div>
            <div className="text-xl font-bold text-purple-800 dark:text-purple-200 mt-1 break-all">
              {priceData.new_price > 0 ? (
                <span title={`${priceData.new_price.toFixed(2)}€`}>
                  {priceData.new_price.toFixed(2)}€
                </span>
              ) : (
                <span className="text-muted-foreground text-base font-normal">Pas de données</span>
              )}
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-3 rounded-lg border border-red-200/50 dark:border-red-800/50"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="text-sm text-red-700 dark:text-red-300 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Maximum
            </div>
            <div className="text-xl font-bold text-red-800 dark:text-red-200 mt-1 break-all" title={`${priceData.max_price.toFixed(2)}€`}>
              {priceData.max_price.toFixed(2)}€
            </div>
          </motion.div>
        </div>
        
        {/* Disclaimer déroulant */}
        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDisclaimerOpen(!disclaimerOpen)}
            className="w-full justify-between h-auto py-2 px-3 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-lg text-xs text-blue-800 dark:text-blue-300"
          >
            <span className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5" />
              <strong>Informations sur ces prix (eBay - indicatif)</strong>
            </span>
            {disclaimerOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
          
          <AnimatePresence>
            {disclaimerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Alert className="mt-2 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/50">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    <p className="mb-2">Ces prix proviennent d'<strong>eBay</strong> et sont à <strong>titre indicatif uniquement</strong>.</p>
                    <p className="mb-1.5">La côte peut varier selon :</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2 text-xs">
                      <li><strong>État :</strong> Neuf, très bon état, bon état, état correct</li>
                      <li><strong>Complétude :</strong> Complet (CIB), jeu seul, ou intermédiaire</li>
                      <li><strong>Région :</strong> PAL/EUR, NTSC/US, ou autres</li>
                      <li><strong>Rareté :</strong> Édition limitée, promo, ou standard</li>
                      <li><strong>Boîte :</strong> Parfait état, abîmée, ou manquante</li>
                      <li><strong>Livraison :</strong> Frais non inclus</li>
                    </ul>
                    <p className="mt-1.5 text-xs italic">Les prix réels peuvent différer selon ces critères.</p>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
