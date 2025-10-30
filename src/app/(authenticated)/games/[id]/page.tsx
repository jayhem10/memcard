'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Loader2, Star, Clock, Pencil, Save, X, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { GameFormDialog } from '@/components/game-form-dialog';
import Game3DImage from '@/components/games/Game3DImage';
import GamePriceDisplay from '@/components/games/GamePriceDisplay';

// Définition des types
type UserGameData = {
  id: string;
  notes: string | null;
  rating: number | null;
  status: string | null;
  play_time: number | null;
  completion_percentage: number | null;
  created_at: string | null;
  updated_at: string | null;
  buy_price: number | null;
  condition: string | null;
};

type GameData = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  developer: string | null;
  publisher: string | null;
  release_date: string | null;
  user_games: UserGameData[];
  console: {
    id: string;
    name: string;
  };
};

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params?.id as string | undefined;
  const router = useRouter();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [editedData, setEditedData] = useState({
    notes: '',
    rating: 0,
    status: '',
    play_time: 0,
    completion_percentage: 0,
    condition: '' as string | null,
  });
  
  // Rediriger si l'ID du jeu n'est pas défini
  useEffect(() => {
    if (!gameId) {
      router.push('/games');
    }
  }, [gameId, router]);

  // Récupérer les détails du jeu
  const { data: game, isLoading } = useQuery<GameData, Error>({
    queryKey: ['game', gameId, user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Utilisateur non authentifié');
      
      // 1. D'abord, récupérer les informations de base du jeu
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select(`
          *,
          console:console_id(id, name)
        `)
        .eq('id', gameId || '')
        .single();

      if (gameError) {
        console.error('Erreur lors de la récupération du jeu:', gameError);
        throw gameError;
      }
      
      // 2. Ensuite, récupérer les données spécifiques à l'utilisateur pour ce jeu (si elles existent)
      
      const { data: userGameData, error: userGameError } = await supabase
        .from('user_games')
        .select('id, notes, rating, status, play_time, completion_percentage, created_at, updated_at, buy_price, condition')
        .eq('game_id', gameId || '')
        .eq('user_id', user.id)
        .maybeSingle<UserGameData>();

      if (userGameError) {
        console.error('Erreur lors de la récupération des données utilisateur pour le jeu:', userGameError);
        throw userGameError;
      }
      
      // 3. Combiner les données
      const result: GameData = {
        ...gameData as any,
        user_games: userGameData ? [userGameData] : []
      };
      
      return result;
    },
    enabled: !!gameId && !!user, // N'exécute la requête que si l'utilisateur est connecté et que l'ID du jeu est défini
  });

  // Mutation pour mettre à jour les données du jeu
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: typeof editedData) => {
      if (!user || !gameId) throw new Error('Utilisateur non authentifié ou ID de jeu manquant');
      
      // Vérifier si l'utilisateur a déjà ce jeu dans sa collection
      const { data: existingUserGame, error: findError } = await supabase
        .from('user_games')
        .select('id')
        .eq('user_id', user.id)
        .eq('game_id', gameId || '')
        .maybeSingle<{ id: string }>();
      
      if (findError) throw findError;
      
      let result;
      if (existingUserGame) {
        // Mettre à jour l'entrée existante
        result = await supabase
          .from('user_games')
          .update(data)
          .eq('id', existingUserGame.id)
          .select();
      } else {
        // Créer une nouvelle entrée
        result = await supabase
          .from('user_games')
          .insert({
            user_id: user.id,
            game_id: gameId,
            ...data
          })
          .select();
      }
      
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      toast.success('Modifications enregistrées');
      setIsEditing(false);
      // Invalider le cache pour forcer un rechargement
      queryClient.invalidateQueries({ queryKey: ['game', gameId, user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });
  
  // Mutation pour supprimer le jeu de la collection
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user || !gameId) throw new Error('Utilisateur non authentifié ou ID de jeu manquant');
      
      const { error } = await supabase
        .from('user_games')
        .delete()
        .eq('user_id', user.id)
        .eq('game_id', gameId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Jeu supprimé de votre collection');
      // Rediriger vers la page de collection
      router.push('/collection');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Jeu non trouvé</h1>
        <Button
          variant="link"
          onClick={() => router.back()}
          className="mt-4"
        >
          Retour
        </Button>
      </div>
    );
  }

  const userGame = game.user_games?.[0];

  const statusLabels: Record<string, string> = {
    NOT_STARTED: 'Pas commencé',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
    DROPPED: 'Abandonné',
    WISHLIST: 'Liste de souhaits',
  };

  const handleEdit = () => {
    setEditedData({
      notes: typeof userGame?.notes === 'string' ? userGame.notes : '',
      rating: typeof userGame?.rating === 'number' ? userGame.rating : 0,
      status: typeof userGame?.status === 'string' ? userGame.status : '',
      play_time: typeof userGame?.play_time === 'number' ? userGame.play_time : 0,
      completion_percentage: typeof userGame?.completion_percentage === 'number' ? userGame.completion_percentage : 0,
      condition: typeof userGame?.condition === 'string' ? userGame.condition : '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editedData);
  };


  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid gap-8 md:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_300px] max-w-screen-2xl mx-auto">
        {/* Image et informations de base */}
        <div className="space-y-6">
          {game.cover_url ? (
            <Game3DImage
              src={game.cover_url}
              alt={game.title}
            />
          ) : (
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md flex items-center justify-center bg-muted">
              <span className="text-muted-foreground">Pas d'image</span>
            </div>
          )}
          <div className="space-y-3 bg-card p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold border-b pb-2">Informations</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-muted-foreground">Développeur</span>
              <span className="font-medium text-right">{game.developer}</span>
              
              <span className="text-muted-foreground">Éditeur</span>
              <span className="font-medium text-right">{game.publisher}</span>
              
              <span className="text-muted-foreground">Date de sortie</span>
              <span className="font-medium text-right">
                {game.release_date ? new Date(game.release_date).toLocaleDateString() : 'Non définie'}
              </span>
              
              <span className="text-muted-foreground">Console</span>
              <span className="font-medium text-right">{game.console?.name || 'Non définie'}</span>

              <span className="text-muted-foreground">Prix d'achat</span>
              <div className="flex items-center justify-end gap-2">
                <span className="font-medium">
                  {userGame?.buy_price
                    ? `${userGame.buy_price.toFixed(2)} €`
                    : 'Non renseigné'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsPriceDialogOpen(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Détails et actions */}
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold">{game.title}</h1>
              {/* Le rafraîchissement global est réservé à l'admin depuis la page Admin */}
              
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Annuler
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Enregistrer
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button onClick={handleEdit} size="sm" variant="outline" className="border-primary">
                    <Pencil className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  
                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer de la collection</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer "{game.title}" de votre collection ? 
                          Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate()}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
            
            <p className="text-muted-foreground">{game.description}</p>
          </div>

          <div className="grid gap-6">
            {/* Cote (EUR, PAL, Complet) */}
            <div className="p-4 rounded-lg bg-card shadow-sm">
              <h2 className="font-semibold border-b pb-2">Cote moyenne (EUR, PAL, complet)</h2>
              <div className="mt-3">
                <GamePriceDisplay gameId={gameId || ''} />
              </div>
            </div>
            {/* Statut et progression */}
            <div className="grid gap-4 p-4 rounded-lg bg-card shadow-sm">
              <h2 className="font-semibold border-b pb-2">Statut et progression</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Statut</label>
                  {isEditing ? (
                    <select
                      className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                      value={editedData.status}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        status: e.target.value,
                      })}
                    >
                      <option value="NOT_STARTED">Pas commencé</option>
                      <option value="IN_PROGRESS">En cours</option>
                      <option value="COMPLETED">Terminé</option>
                      <option value="DROPPED">Abandonné</option>
                      <option value="WISHLIST">Liste de souhaits</option>
                    </select>
                  ) : (
                    <p className="mt-1">{userGame?.status ? (statusLabels[userGame.status] || userGame.status) : 'Non défini'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">État du jeu</label>
                  {isEditing ? (
                    <select
                      className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                      value={editedData.condition || ''}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        condition: e.target.value || null,
                      })}
                    >
                      <option value="">Non renseigné</option>
                      <option value="neuf">Neuf</option>
                      <option value="comme neuf">Comme neuf</option>
                      <option value="très bon état">Très bon état</option>
                      <option value="bon état">Bon état</option>
                      <option value="état moyen">État moyen</option>
                      <option value="mauvais état">Mauvais état</option>
                    </select>
                  ) : (
                    <p className="mt-1">{userGame?.condition || 'Non renseigné'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Progression</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={editedData.completion_percentage}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        completion_percentage: parseInt(e.target.value),
                      })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">
                      {userGame?.completion_percentage || 0}%
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Note et temps de jeu */}
            <div className="grid gap-4 p-4 rounded-lg bg-card shadow-sm">
              <h2 className="font-semibold border-b pb-2">Évaluation</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Note</label>
                  {isEditing ? (
                    <div className="flex gap-2 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setEditedData({
                            ...editedData,
                            rating: star,
                          })}
                          className={`text-2xl ${
                            star <= editedData.rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center mt-1">
                      <Star className={`h-5 w-5 ${
                        userGame?.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`} />
                      <span className="ml-2">
                        {userGame?.rating || 'Non noté'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Temps de jeu</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      value={editedData.play_time}
                      onChange={(e) => setEditedData({
                        ...editedData,
                        play_time: parseInt(e.target.value),
                      })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="flex items-center mt-1">
                      <Clock className="h-5 w-5" />
                      <span className="ml-2">
                        {userGame?.play_time
                          ? `${Math.floor(userGame.play_time / 60)}h ${userGame.play_time % 60}m`
                          : 'Non défini'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes personnelles */}
            <div className="space-y-2 p-4 rounded-lg bg-card shadow-sm">
              <label className="font-semibold border-b pb-2 block w-full">Notes personnelles</label>
              {isEditing ? (
                <textarea
                  value={editedData.notes}
                  onChange={(e) => setEditedData({
                    ...editedData,
                    notes: e.target.value,
                  })}
                  className="w-full min-h-[100px] mt-1 rounded-md border border-input bg-background px-3 py-2"
                  placeholder="Ajoutez vos notes personnelles ici..."
                />
              ) : (
                <p className="mt-1 text-muted-foreground">
                  {userGame?.notes || 'Aucune note'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Colonne supplémentaire pour les écrans larges - Historique d'activité */}
        <div className="hidden xl:block space-y-6">
          <div className="bg-card p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold border-b pb-2">Activités récentes</h3>
            <div className="mt-3 space-y-3">
              {userGame ? (
                <>
                  <div className="text-sm border-l-2 border-primary pl-3 py-1">
                    <p className="font-medium">Ajouté à votre collection</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(userGame.created_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                  {userGame.updated_at && userGame.updated_at !== userGame.created_at && (
                    <div className="text-sm border-l-2 border-blue-500 pl-3 py-1">
                      <p className="font-medium">Dernière modification</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(userGame.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {userGame.status === 'COMPLETED' && (
                    <div className="text-sm border-l-2 border-green-500 pl-3 py-1">
                      <p className="font-medium">Terminé</p>
                      <p className="text-muted-foreground text-xs">
                        {userGame.completion_percentage}% complété
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune activité enregistrée</p>
              )}
            </div>
          </div>
          
          <div className="bg-card p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold border-b pb-2">Jeux similaires</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Fonctionnalité à venir...
            </p>
          </div>
        </div>
      </div>

      <GameFormDialog
        isOpen={isPriceDialogOpen}
        onClose={() => setIsPriceDialogOpen(false)}
        gameId={gameId || ''}
        initialBuyPrice={typeof userGame?.buy_price === 'number' ? userGame.buy_price : undefined}
      />
    </div>
  );
}
