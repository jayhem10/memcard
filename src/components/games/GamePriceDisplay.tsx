'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

interface GamePriceDisplayProps {
  gameId: string;
  className?: string;
}

interface GamePrice {
  min_price: number;
  max_price: number;
  average_price: number;
  new_price: number;
  last_updated: string;
}

export default function GamePriceDisplay({ gameId, className = '' }: GamePriceDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<GamePrice | null>(null);
  
  useEffect(() => {
    async function fetchPrices() {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('game_prices')
          .select('*')
          .eq('game_id', gameId)
          .single();
          
        if (error) throw error;
        setPriceData(data);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des prix:', err);
        setError(err.message || 'Erreur lors de la récupération des prix');
      } finally {
        setLoading(false);
      }
    }
    
    if (gameId) {
      fetchPrices();
    }
  }, [gameId]);
  
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

  if (error || !priceData) {
    return (
      <Card className={`${className} overflow-hidden`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Prix du marché</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            {error || 'Aucune donnée de prix disponible'}
          </p>
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
            className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="text-sm text-green-700 font-medium flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Minimum
            </div>
            <div className="text-xl font-bold text-green-800 mt-1 break-all" title={`${priceData.min_price.toFixed(2)}€`}>
              {priceData.min_price.toFixed(2)}€
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="text-sm text-blue-700 font-medium flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Moyen
            </div>
            <div className="text-xl font-bold text-blue-800 mt-1 break-all" title={`${priceData.average_price.toFixed(2)}€`}>
              {priceData.average_price.toFixed(2)}€
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="text-sm text-purple-700 font-medium flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Neuf
            </div>
            <div className="text-xl font-bold text-purple-800 mt-1 break-all" title={`${priceData.new_price.toFixed(2)}€`}>
              {priceData.new_price.toFixed(2)}€
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="text-sm text-red-700 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Maximum
            </div>
            <div className="text-xl font-bold text-red-800 mt-1 break-all" title={`${priceData.max_price.toFixed(2)}€`}>
              {priceData.max_price.toFixed(2)}€
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
