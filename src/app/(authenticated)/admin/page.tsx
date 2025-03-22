'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { success: boolean; message: string; added: number; updated: number; total: number }>(null);
  const [error, setError] = useState<string | null>(null);

  const syncPlatforms = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/consoles/sync-platforms', {
        method: 'POST',
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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Administration</h1>

      <div className="grid gap-8">
        <Card>
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
              <Alert className="mt-4 bg-green-50">
                <AlertTitle>Synchronisation réussie</AlertTitle>
                <AlertDescription>
                  {result.message}<br />
                  {result.added} nouvelles consoles ajoutées.<br />
                  {result.updated} consoles existantes mises à jour.<br />
                  Total: {result.total} consoles disponibles.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="mt-4 bg-red-50">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
