'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Loader2, Star, Clock, Pencil, Save, X, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { GameFormDialog } from '@/components/game-form-dialog';
import Game3DImage from '@/components/games/Game3DImage';
import GamePriceDisplay from '@/components/games/GamePriceDisplay';
import { GameRecentActivities } from '@/components/games/GameRecentActivities';
import { SimilarGamesList } from '@/components/games/SimilarGamesList';
import { STATUS_LABELS } from '@/types/games';
import { useGame } from '@/hooks/useGame';
import { useSimilarGames } from '@/hooks/useSimilarGames';

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params?.id as string | undefined;
  const router = useRouter();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [editedData, setEditedData] = useState<{
    notes: string;
    rating: number;
    status: string;
    play_time: number;
    completion_percentage: number;
    condition: string | null;
  }>({
    notes: '',
    rating: 0,
    status: '',
    play_time: 0,
    completion_percentage: 0,
    condition: null,
  });
  
  // Rediriger si l'ID du jeu n'est pas défini
  useEffect(() => {
    if (!gameId) {
      router.push('/games');
    }
  }, [gameId, router]);

  // Récupérer les détails du jeu
  const { data: game, isLoading } = useGame(gameId);

  // Récupérer les jeux similaires
  const { data: similarGames, isLoading: isLoadingSimilar } = useSimilarGames(gameId);

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
      
      // Préparer les données à mettre à jour
      const updateData = { ...data };
      
      // Si le statut est WISHLIST, réinitialiser condition à NULL
      // (car un jeu en wishlist n'a pas encore d'état physique)
      if (updateData.status === 'WISHLIST' || updateData.status === 'wishlist') {
        updateData.condition = null;
      } else {
        // Pour les autres statuts, convertir les chaînes vides en null
        // condition reste optionnel (peut être null)
        if (updateData.condition === '' || updateData.condition === undefined) {
          updateData.condition = null;
        }
      }
      
      let result;
      if (existingUserGame) {
        // Mettre à jour l'entrée existante
        result = await supabase
          .from('user_games')
          .update(updateData)
          .eq('id', existingUserGame.id)
          .select();
      } else {
        // Créer une nouvelle entrée
        result = await supabase
          .from('user_games')
          .insert({
            user_id: user.id,
            game_id: gameId,
            ...updateData
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
    onSuccess: async () => {
      // Invalider le cache pour rafraîchir les listes
      queryClient.invalidateQueries({ queryKey: ['userGames', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['game', gameId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['game'] });
      
      // Attendre un peu pour que l'invalidation se propage
      await queryClient.refetchQueries({ queryKey: ['userGames', user?.id] });
      
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
            
            {game.genres && game.genres.length > 0 && (
              <div className="pt-3 border-t">
                <span className="text-muted-foreground text-sm block mb-2">Genres</span>
                <div className="flex flex-col gap-1.5">
                  {game.genres.map((genreItem) => (
                    <Badge key={genreItem.genre_id} variant="secondary" className="text-xs w-fit">
                      {genreItem.genres?.name || 'Genre inconnu'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Détails et actions */}
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <div className="mb-4">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold">{game.title}</h1>
                
                {/* Bouton Supprimer en haut à droite */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Supprimer</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[400px] p-0 left-[50%] translate-x-[-50%]">
                    <AlertDialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
                      <AlertDialogTitle>Supprimer de la collection</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer "{game.title}" de votre collection ? 
                        Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0 px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-4">
                      <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteMutation.mutate()} 
                        className="w-full sm:w-auto"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
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
            
            {/* Statut et progression - Section modifiable avec boutons à proximité */}
            <div className="grid gap-4 p-4 rounded-lg bg-card shadow-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="font-semibold">Statut et progression</h2>
                
                {/* Boutons Modifier/Enregistrer/Annuler à côté du titre */}
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Annuler</span>
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Enregistrer</span>
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleEdit} 
                    size="sm" 
                    variant="outline" 
                    className="border-primary"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Modifier</span>
                  </Button>
                )}
              </div>
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
                    <p className="mt-1">{userGame?.status ? (STATUS_LABELS[userGame.status] || userGame.status) : 'Non défini'}</p>
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
                    <p className="mt-1">
                      {userGame?.condition
                        ? userGame.condition.charAt(0).toUpperCase() + userGame.condition.slice(1).toLowerCase()
                        : 'Non renseigné'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Progression</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={editedData.completion_percentage ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                        setEditedData({
                          ...editedData,
                          completion_percentage: isNaN(value) ? 0 : value,
                        });
                      }}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">
                      {userGame?.completion_percentage ?? 0}%
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
                      value={editedData.play_time ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                        setEditedData({
                          ...editedData,
                          play_time: isNaN(value) ? 0 : value,
                        });
                      }}
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

          {/* Activités récentes et jeux similaires - sur mobile/tablette */}
          <div className="xl:hidden space-y-6">
            <GameRecentActivities userGame={userGame} />
            <SimilarGamesList similarGames={similarGames} isLoading={isLoadingSimilar} />
          </div>
        </div>

        {/* Colonne droite pour desktop - Activités récentes et jeux similaires */}
        <div className="hidden xl:block space-y-6">
          <GameRecentActivities userGame={userGame} />
          <SimilarGamesList similarGames={similarGames} isLoading={isLoadingSimilar} />
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
