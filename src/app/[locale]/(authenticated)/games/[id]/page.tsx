'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { GameFormDialog } from '@/components/game-form-dialog';
import Game3DImage from '@/components/games/Game3DImage';
import GamePriceDisplay from '@/components/games/GamePriceDisplay';
import { GameRecentActivities } from '@/components/games/GameRecentActivities';
import { SimilarGamesList } from '@/components/games/SimilarGamesList';
import { TranslatedGameDescription } from '@/components/games/TranslatedGameDescription';
import { AverageRatingDisplay } from '@/components/games/AverageRatingDisplay';
import { GameInfoCard } from '@/components/games/GameInfoCard';
import { GameStatusDisplay } from '@/components/games/GameStatusDisplay';
import { GameRatingDisplay } from '@/components/games/GameRatingDisplay';
import { GameNotesDisplay } from '@/components/games/GameNotesDisplay';
import { GameEditDialog, EditedGameData } from '@/components/games/GameEditDialog';
import { useGame } from '@/hooks/useGame';
import { useSimilarGames } from '@/hooks/useSimilarGames';
import { useGameMutations } from '@/hooks/useGameMutations';
import { useTranslations } from 'next-intl';

export default function GameDetailPage() {
  const t = useTranslations('gameDetails');
  const params = useParams();
  const gameId = params?.id as string | undefined;
  const router = useRouter();
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  
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

  // Mutations pour mettre à jour et supprimer
  const { updateMutation, deleteMutation } = useGameMutations(gameId, user?.id);

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

  const handleSaveEdit = (data: EditedGameData) => {
    updateMutation.mutate(data);
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

          {/* Card Informations */}
          <GameInfoCard
            game={game}
            userGame={userGame}
            onEditPrice={() => setIsPriceDialogOpen(true)}
          />
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
                
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setIsEditDialogOpen(true)} 
                    size="sm" 
                    variant="outline" 
                    className="border-primary/50 hover:border-primary rounded-lg"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{t('edit')}</span>
                  </Button>
                
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
              </div>
              
              {/* Note moyenne de la communauté */}
              {game.average_rating && (
                <div className="mb-4">
                  <AverageRatingDisplay rating={game.average_rating} size="md" />
                </div>
              )}

              <TranslatedGameDescription
                description_en={game.description_en}
                description_fr={game.description_fr}
                className="text-muted-foreground leading-relaxed text-base"
              />
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
            
            {/* Statut et progression */}
            <GameStatusDisplay userGame={userGame} />

            {/* Évaluation et avis */}
            <GameRatingDisplay userGame={userGame} />

            {/* Notes personnelles */}
            <GameNotesDisplay userGame={userGame} />
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

      <GameEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleSaveEdit}
        userGame={userGame}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
