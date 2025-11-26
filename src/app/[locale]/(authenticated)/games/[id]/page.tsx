'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Star, Clock, Pencil, Save, X, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { GameFormDialog } from '@/components/game-form-dialog';
import Game3DImage from '@/components/games/Game3DImage';
import GamePriceDisplay from '@/components/games/GamePriceDisplay';
import { GameRecentActivities } from '@/components/games/GameRecentActivities';
import { SimilarGamesList } from '@/components/games/SimilarGamesList';
import { STATUS_LABELS, EDITION_OPTIONS } from '@/types/games';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGame } from '@/hooks/useGame';
import { useSimilarGames } from '@/hooks/useSimilarGames';
import { UserGame } from '@/types/database.types';
import { useTranslations } from 'next-intl';

export default function GameDetailPage() {
  const t = useTranslations('gameDetails');
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
    review: string | null;
    edition: string | null;
    edition_other: string | null;
  }>({
    notes: '',
    rating: 0,
    status: '',
    play_time: 0,
    completion_percentage: 0,
    condition: null,
    review: null,
    edition: null,
    edition_other: null,
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
        .maybeSingle();
      
      if (findError) throw findError;
      
      // Préparer les données à mettre à jour
      const updateData: {
        notes: string | null;
        rating: number | null;
        status: string;
        play_time: number | null;
        completion_percentage: number | null;
        condition: string | null;
        review: string | null;
        edition: string | null;
        edition_other: string | null;
      } = {
        notes: data.notes || null,
        rating: data.rating || null,
        status: data.status,
        play_time: data.play_time || null,
        completion_percentage: data.completion_percentage || null,
        condition: null,
        review: null,
        edition: null,
        edition_other: null,
      };
      
      // Si le statut est WISHLIST, réinitialiser condition à NULL
      // (car un jeu en wishlist n'a pas encore d'état physique)
      if (updateData.status === 'WISHLIST' || updateData.status === 'wishlist') {
        updateData.condition = null;
      } else {
        // Pour les autres statuts, convertir les chaînes vides en null
        // condition reste optionnel (peut être null)
        if (data.condition === '' || data.condition === undefined) {
          updateData.condition = null;
        } else {
          updateData.condition = data.condition;
        }
      }
      
      // Convertir les chaînes vides en null pour review
      if (data.review === '' || data.review === undefined) {
        updateData.review = null;
      } else {
        updateData.review = data.review;
      }
      
      // Gérer edition et edition_other
      // Si edition est vide, null, ou 'standard', mettre à null (standard = pas d'édition spéciale)
      if (data.edition === '' || data.edition === undefined || data.edition === 'standard') {
        updateData.edition = null;
        updateData.edition_other = null; // Si pas d'édition, pas de texte libre
      } else if (data.edition !== 'autres') {
        // Si ce n'est pas "autres", supprimer edition_other
        updateData.edition = data.edition;
        updateData.edition_other = null;
      } else {
        updateData.edition = data.edition;
        // Si edition_other est vide, mettre à null
        if (data.edition_other === '' || data.edition_other === undefined) {
          updateData.edition_other = null;
        } else {
          updateData.edition_other = data.edition_other;
        }
      }
      
      let result;
      if (existingUserGame) {
        // Mettre à jour l'entrée existante
        result = await (supabase
          .from('user_games') as any)
          .update(updateData)
          .eq('id', existingUserGame.id)
          .select();
      } else {
        // Créer une nouvelle entrée
        result = await (supabase
          .from('user_games') as any)
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
    onSuccess: async () => {
      toast.success('Modifications enregistrées');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['game', gameId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['userGames', user?.id] });

      await queryClient.refetchQueries({ 
        queryKey: ['userGames', user?.id],
        type: 'all' 
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user || !gameId) throw new Error('Utilisateur non authentifié ou ID de jeu manquant');
      
      // Récupérer le statut du jeu avant suppression pour savoir où rediriger
      const { data: userGame, error: fetchError } = await supabase
        .from('user_games')
        .select('status')
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const gameStatus = userGame?.status?.toUpperCase();
      const isWishlist = gameStatus === 'WISHLIST' || gameStatus === 'wishlist';
      
      const { error } = await supabase
        .from('user_games')
        .delete()
        .eq('user_id', user.id)
        .eq('game_id', gameId);

      if (error) throw error;
      
      return { isWishlist };
    },
    onSuccess: async (data) => {
      // Invalider le cache pour rafraîchir les listes
      const { queryKeys } = await import('@/lib/react-query-config');
      queryClient.invalidateQueries({ queryKey: queryKeys.userGames(user?.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.game(gameId || '', user?.id) });

      // Attendre un peu pour que l'invalidation se propage
      await queryClient.refetchQueries({ queryKey: ['userGames', user?.id] });

      // Invalider le cache des stats pour mettre à jour les "recent games" sur la page d'accueil
      if (user?.id) {
        const { useStore } = await import('@/store');
        const statsStore = useStore.getState();
        statsStore.resetStats();
        // Recharger les stats pour l'utilisateur actuel
        statsStore.fetchUserStats(user.id);
      }
      
      if (data.isWishlist) {
        toast.success('Jeu supprimé de votre liste de souhaits');
        // Rediriger vers la wishlist si c'était un jeu de la wishlist
        router.push('/collection?tab=wishlist');
      } else {
        toast.success('Jeu supprimé de votre collection');
        // Rediriger vers la collection si c'était un jeu de la collection
        router.push('/collection');
      }
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
      condition: typeof userGame?.condition === 'string' ? userGame.condition : null,
      review: typeof userGame?.review === 'string' ? userGame.review : null,
      edition: typeof userGame?.edition === 'string' ? userGame.edition : null,
      edition_other: typeof userGame?.edition_other === 'string' ? userGame.edition_other : null,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editedData);
  };


  return (
    <div className="container mx-auto px-4 py-6 max-w-screen-2xl">
      <div className="grid gap-6 md:gap-8 md:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_320px]">
        {/* Colonne gauche - Image et informations */}
        <div className="space-y-6">
          {/* Card Image avec effet glassmorphism */}
          <div className="relative group">
            {game.cover_url ? (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-1 backdrop-blur-sm">
                <Game3DImage
                  src={game.cover_url}
                  alt={game.title}
                />
              </div>
            ) : (
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 border border-border/50">
                <span className="text-muted-foreground">Pas d'image</span>
              </div>
            )}
          </div>

          {/* Card Informations avec design moderne */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
                <h3 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {t('information')}
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t('developer')}</span>
                  <p className="font-semibold text-foreground">{game.developer || t('notDefined')}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t('publisher')}</span>
                  <p className="font-semibold text-foreground">{game.publisher || t('notDefined')}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t('releaseDate')}</span>
                  <p className="font-semibold text-foreground">
                    {game.release_date ? new Date(game.release_date).toLocaleDateString('fr-FR') : t('notDefinedDate')}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t('platform')}</span>
                  <p className="font-semibold text-foreground">{game.console?.name || t('notDefined')}</p>
                </div>
                
                <div className="space-y-1 col-span-2">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t('purchasePrice')}</span>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">
                      {userGame?.buy_price
                        ? `${userGame.buy_price.toFixed(2)} €`
                        : t('notSpecified')}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-primary/10 transition-colors"
                      onClick={() => setIsPriceDialogOpen(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {game.genres && game.genres.length > 0 && (
                <div className="pt-4 border-t border-border/50">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide block mb-3">{t('genres')}</span>
                  <div className="flex flex-wrap gap-2">
                    {game.genres.map((genreItem) => (
                      <Badge 
                        key={genreItem.genre_id} 
                        variant="secondary" 
                        className="text-xs px-3 py-1 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 hover:from-primary/20 hover:to-primary/10 transition-all"
                      >
                        {genreItem.genres?.name || 'Genre inconnu'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne centrale - Détails et actions */}
        <div className="space-y-6">
          {/* Card Titre et description avec gradient moderne */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-50" />
            <div className="relative p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
                  {game.title}
                </h1>
                
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="flex-shrink-0 rounded-lg shadow-lg hover:shadow-xl transition-all border-2 border-destructive/50 dark:border-destructive/80 font-semibold"
                    >
                      <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{t('delete')}</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[400px] p-0 left-[50%] translate-x-[-50%]">
                    <AlertDialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
                      <AlertDialogTitle>{t('deleteFromCollection')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('deleteGameConfirm', { gameTitle: game.title })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0 px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-4">
                      <AlertDialogCancel className="w-full sm:w-auto">{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                        className="w-full sm:w-auto"
                      >
                        {t('delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              
              <p className="text-muted-foreground leading-relaxed text-base">{game.description_fr || game.description_en || ''}</p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Card Prix avec design moderne */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50/50 via-card to-purple-50/50 dark:from-blue-950/20 dark:via-card dark:to-purple-950/20 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
              <div className="relative p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                  <h2 className="text-lg font-bold">{t('averageRating')}</h2>
                </div>
                <div className="mt-4">
                  <GamePriceDisplay gameId={gameId || ''} />
                </div>
              </div>
            </div>
            
            {/* Card Statut et progression avec design moderne */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
                    <h2 className="text-lg font-bold">{t('statusAndProgress')}</h2>
                  </div>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditing(false)}
                        className="rounded-lg"
                      >
                        <X className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">{t('cancel')}</span>
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSave}
                        className="rounded-lg shadow-lg"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">{t('save')}</span>
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleEdit} 
                      size="sm" 
                      variant="outline" 
                      className="border-primary/50 hover:border-primary rounded-lg"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">{t('edit')}</span>
                    </Button>
                  )}
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Statut</label>
                    {isEditing ? (
                      <select
                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        value={editedData.status}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          status: e.target.value,
                        })}
                      >
                        <option value="NOT_STARTED">{t('games.status.notStarted')}</option>
                        <option value="IN_PROGRESS">{t('games.status.inProgress')}</option>
                        <option value="COMPLETED">{t('games.status.completed')}</option>
                        <option value="DROPPED">{t('games.status.dropped')}</option>
                        <option value="WISHLIST">{t('games.status.wishlist')}</option>
                      </select>
                    ) : (
                      <p className="text-lg font-semibold text-foreground">
                        {userGame?.status ? (STATUS_LABELS[userGame.status] || userGame.status) : t('notDefined')}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('gameCondition')}</label>
                    {isEditing ? (
                      <select
                        className="w-full rounded-lg border border-input bg-background px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        value={editedData.condition || ''}
                        onChange={(e) => setEditedData({
                          ...editedData,
                          condition: e.target.value || null,
                        })}
                      >
                        <option value="">{t('notSpecified')}</option>
                        <option value="neuf">{t('conditionNew')}</option>
                        <option value="comme neuf">{t('conditionLikeNew')}</option>
                        <option value="très bon état">{t('conditionVeryGood')}</option>
                        <option value="bon état">{t('conditionGood')}</option>
                        <option value="état moyen">{t('conditionFair')}</option>
                        <option value="mauvais état">{t('conditionPoor')}</option>
                      </select>
                    ) : (
                      <p className="text-lg font-semibold text-foreground">
                        {userGame?.condition
                          ? userGame.condition.charAt(0).toUpperCase() + userGame.condition.slice(1).toLowerCase()
                          : 'Non renseigné'}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('edition')}</label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Select
                          value={editedData.edition || 'standard'}
                          onValueChange={(value) => setEditedData({
                            ...editedData,
                            edition: value === 'standard' ? null : value,
                            edition_other: value === 'autres' ? editedData.edition_other : null,
                          })}
                        >
                          <SelectTrigger className="w-full rounded-lg">
                            <SelectValue placeholder="Standard" />
                          </SelectTrigger>
                          <SelectContent>
                            {EDITION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {editedData.edition === 'autres' && (
                          <Input
                            placeholder={t('editionSpecify')}
                            value={editedData.edition_other || ''}
                            onChange={(e) => setEditedData({
                              ...editedData,
                              edition_other: e.target.value || null,
                            })}
                            className="rounded-lg"
                          />
                        )}
                      </div>
                    ) : (
                      <p className="text-lg font-semibold text-foreground">
                        {userGame?.edition === 'autres' && userGame?.edition_other
                          ? userGame.edition_other
                          : userGame?.edition
                          ? EDITION_OPTIONS.find(opt => opt.value === userGame.edition)?.label || userGame.edition
                          : 'Standard'}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('progress')}</label>
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
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-foreground">
                          {userGame?.completion_percentage ?? 0}%
                        </p>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                            style={{ width: `${userGame?.completion_percentage ?? 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Évaluation avec design moderne */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-50/30 via-card to-orange-50/30 dark:from-yellow-950/20 dark:via-card dark:to-orange-950/20 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full blur-3xl" />
              <div className="relative p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-1 w-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" />
                  <h2 className="text-lg font-bold">{t('rating')}</h2>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide block">{t('ratingLabel')}</label>
                    {isEditing ? (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setEditedData({
                              ...editedData,
                              rating: star,
                            })}
                            className={`text-3xl transition-transform hover:scale-110 ${
                              star <= editedData.rating
                                ? 'text-yellow-400 drop-shadow-lg'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`h-6 w-6 ${
                                userGame?.rating && star <= userGame.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-lg font-semibold">
                          {userGame?.rating || t('notRated')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide block">{t('playTime')}</label>
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
                        className="rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <Clock className="h-6 w-6 text-primary" />
                        <span className="text-lg font-semibold">
                          {userGame?.play_time
                            ? `${Math.floor(userGame.play_time / 60)}h ${userGame.play_time % 60}m`
                            : t('playTimeNotDefined')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Notes personnelles avec design moderne */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
                  <label className="text-lg font-bold">{t('personalNotes')}</label>
                </div>
                {isEditing ? (
                  <textarea
                    value={editedData.notes}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      notes: e.target.value,
                    })}
                    className="w-full min-h-[120px] rounded-lg border border-input bg-background px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                    placeholder={t('notesPlaceholder')}
                  />
                ) : (
                  <p className="text-muted-foreground leading-relaxed min-h-[120px] p-4 rounded-lg bg-muted/30 border border-border/50">
                    {userGame?.notes || t('noNotes')}
                  </p>
                )}
              </div>
            </div>

            {/* Card Avis avec design moderne */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50/50 via-card to-pink-50/50 dark:from-purple-950/20 dark:via-card dark:to-pink-950/20 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
              <div className="relative p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                  <label className="text-lg font-bold">{t('myReview')}</label>
                </div>
                {isEditing ? (
                  <textarea
                    value={editedData.review || ''}
                    onChange={(e) => setEditedData({
                      ...editedData,
                      review: e.target.value || null,
                    })}
                    className="w-full min-h-[150px] rounded-lg border border-input bg-background px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                    placeholder={t('reviewPlaceholder')}
                  />
                ) : (
                  <p className="text-foreground leading-relaxed min-h-[150px] p-4 rounded-lg bg-muted/30 border border-border/50 whitespace-pre-wrap">
                    {userGame?.review || t('noReview')}
                  </p>
                )}
              </div>
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
