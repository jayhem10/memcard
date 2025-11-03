'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { Footer } from '@/components/layout/footer';

type Game = {
  id: string;
  buy: boolean | null;
  games: {
    id: string;
    title: string;
    cover_url: string | null;
    console_id: string;
    consoles: {
      name: string;
    } | null;
  };
};

export default function WishlistSharePage() {
  const params = useParams();
  const token = params?.token as string;
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    async function fetchWishlist() {
      try {
        setLoading(true);
        const response = await fetch(`/api/wishlist/${token}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', errorData);
          console.error('Response status:', response.status);
          if (response.status === 404) {
            toast.error('Lien de wishlist invalide ou expiré');
            return;
          }
          const errorMessage = errorData.details || errorData.error || 'Erreur lors du chargement';
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (!data.games || data.games.length === 0) {
          console.warn('No games returned, but token is valid');
        }
        
        setGames(data.games || []);
        
        // Définir le nom du propriétaire
        if (data.owner) {
          const name = data.owner.full_name || data.owner.username || 'Utilisateur';
          setOwnerName(name);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        toast.error('Erreur lors du chargement de la wishlist');
      } finally {
        setLoading(false);
      }
    }

    fetchWishlist();
  }, [token]);

  const handleToggleBuy = async (userGameId: string, currentBuy: boolean) => {
    try {
      setUpdating(userGameId);
      const newBuy = !currentBuy;

      const response = await fetch('/api/wishlist/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userGameId,
          buy: newBuy,
          token,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      // Mettre à jour l'état local
      setGames((prevGames) =>
        prevGames.map((game) =>
          game.id === userGameId ? { ...game, buy: newBuy } : game
        )
      );

      toast.success(
        newBuy
          ? 'Jeu marqué comme acheté'
          : 'Marquage d\'achat retiré'
      );
    } catch (error) {
      console.error('Error updating buy status:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center flex-1 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : games.length === 0 ? (
          <div className="flex items-center justify-center flex-1 p-4">
            <Card className="max-w-md w-full">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Cette wishlist est vide ou le lien est invalide.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 md:mb-8">
                <h1 className="text-3xl font-bold mb-2">Liste de souhaits</h1>
                {ownerName && (
                  <p className="text-lg text-muted-foreground mb-2">
                    Wishlist de <span className="font-semibold text-foreground">{ownerName}</span>
                  </p>
                )}
                <p className="text-muted-foreground">
                  Cochez les jeux qui ont été achetés
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {games.map((game) => (
                  <Card
                    key={game.id}
                    className={`transition-all flex flex-col ${
                      game.buy ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <CardContent className="p-4 flex flex-col h-full">
                      <div className="relative aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-muted">
                        {game.games.cover_url ? (
                          <Image
                            src={game.games.cover_url}
                            alt={game.games.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <span className="text-xs text-center px-2">
                              {game.games.title}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="space-y-2 flex-1">
                          <h3 className="font-medium text-sm line-clamp-2">
                            {game.games.title}
                          </h3>
                          {game.games.consoles && (
                            <p className="text-xs text-muted-foreground">
                              {game.games.consoles.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 pt-2 mt-auto">
                          <Checkbox
                            id={`buy-${game.id}`}
                            checked={game.buy || false}
                            onCheckedChange={() =>
                              handleToggleBuy(game.id, game.buy || false)
                            }
                            disabled={updating === game.id}
                          />
                          <label
                            htmlFor={`buy-${game.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Acheté
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

