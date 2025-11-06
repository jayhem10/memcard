'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { AdminGuard } from '@/components/auth/admin-guard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [loadingRandomGames, setLoadingRandomGames] = useState(false);
  const [result, setResult] = useState<null | { success: boolean; message: string; added: number; updated: number; total: number }>(null);
  const [priceResult, setPriceResult] = useState<null | { success: boolean; message: string }>(null);
  const [randomGamesResult, setRandomGamesResult] = useState<null | { success: boolean; message: string; added: number; skipped: number; target: number }>(null);
  const [error, setError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [randomGamesError, setRandomGamesError] = useState<string | null>(null);
  const { user } = useAuth();

  const updatePrices = async () => {
    setLoadingPrices(true);
    setPriceResult(null);
    setPriceError(null);

    try {
      // Récupérer la session pour obtenir le token d'authentification
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Vous devez être connecté pour mettre à jour les prix');
      }

      const response = await fetch('/api/admin/update-outdated-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erreur lors de la mise à jour des prix');
      }

      const data = await response.json();
      setPriceResult(data);
    } catch (err: any) {
      setPriceError(err.message || 'Une erreur est survenue');
    } finally {
      setLoadingPrices(false);
    }
  };

  const syncPlatforms = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Récupérer le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/consoles/sync-platforms', {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la synchronisation des plateformes');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const enrichRandomGames = async () => {
    setLoadingRandomGames(true);
    setRandomGamesResult(null);
    setRandomGamesError(null);

    try {
      // Récupérer le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/admin/enrich-random-games', {
        method: 'POST',
        headers,
        body: JSON.stringify({ targetCount: 500 }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'enrichissement de la librairie');
      }

      const data = await response.json();
      setRandomGamesResult(data);
    } catch (err: any) {
      setRandomGamesError(err.message || 'Une erreur est survenue');
    } finally {
      setLoadingRandomGames(false);
    }
  };

  return (
    <AdminGuard>
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            Administration
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestion et maintenance de la base de données
          </p>
        </div>
      </section>

      <div className="grid gap-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle>Mise à jour des prix</CardTitle>
            <CardDescription>
              Met à jour les prix depuis eBay pour les jeux sans données ou avec des données de plus de 7 jours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={updatePrices} 
              disabled={loadingPrices}
              className="w-full sm:w-auto"
            >
              {loadingPrices ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour en cours...
                </>
              ) : (
                'Mettre à jour les prix'
              )}
            </Button>

            {priceResult && (
              <Alert className="mt-4 border border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-200">
                <AlertTitle className="text-green-800 dark:text-green-200">Mise à jour réussie</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-200">{priceResult.message}</AlertDescription>
              </Alert>
            )}

            {priceError && (
              <Alert className="mt-4 border border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-200">
                <AlertTitle className="text-red-800 dark:text-red-200">Erreur</AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-200">{priceError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          </Card>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle>Synchronisation des consoles</CardTitle>
            <CardDescription>
              Récupérer toutes les plateformes disponibles depuis IGDB et les ajouter à la base de données.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={syncPlatforms} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Synchronisation en cours...
                </>
              ) : (
                'Synchroniser les consoles'
              )}
            </Button>

            {result && (
              <Alert className="mt-4 border border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-200">
                <AlertTitle className="text-green-800 dark:text-green-200">Synchronisation réussie</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-200">
                  {result.message}<br />
                  {result.added} nouvelles consoles ajoutées.<br />
                  {result.updated} consoles existantes mises à jour.<br />
                  Total: {result.total} consoles disponibles.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="mt-4 border border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-200">
                <AlertTitle className="text-red-800 dark:text-red-200">Erreur</AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-200">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          </Card>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <Card className="border-0 shadow-none bg-transparent">
          <CardHeader>
            <CardTitle>Enrichir la librairie</CardTitle>
            <CardDescription>
              Ajouter 500 jeux aléatoires depuis IGDB à la base de données pour enrichir la librairie et améliorer les suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={enrichRandomGames} 
              disabled={loadingRandomGames}
              className="w-full sm:w-auto"
              variant="default"
            >
              {loadingRandomGames ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enrichissement en cours...
                </>
              ) : (
                'Ajouter 500 jeux aléatoires'
              )}
            </Button>

            {randomGamesResult && (
              <Alert className="mt-4 border border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-200">
                <AlertTitle className="text-green-800 dark:text-green-200">Enrichissement réussi</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-200">
                  {randomGamesResult.message}<br />
                  {randomGamesResult.added} jeux ajoutés sur {randomGamesResult.target} ciblés.<br />
                  {randomGamesResult.skipped} jeux déjà présents ignorés.
                </AlertDescription>
              </Alert>
            )}

            {randomGamesError && (
              <Alert className="mt-4 border border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-200">
                <AlertTitle className="text-red-800 dark:text-red-200">Erreur</AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-200">{randomGamesError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </AdminGuard>
  );
}
