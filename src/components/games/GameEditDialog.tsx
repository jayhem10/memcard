'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Clock, BookOpen, MessageSquare } from 'lucide-react';
import { getEditionOptions, UserGameData } from '@/types/games';
import { useTranslations } from 'next-intl';

interface GameEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EditedGameData) => void;
  userGame?: UserGameData;
  isLoading?: boolean;
}

export interface EditedGameData {
  notes: string;
  rating: number;
  status: string;
  play_time: number;
  completion_percentage: number;
  condition: string | null;
  review: string | null;
  edition: string | null;
  edition_other: string | null;
}

export function GameEditDialog({ isOpen, onClose, onSave, userGame, isLoading }: GameEditDialogProps) {
  const t = useTranslations('gameDetails');
  const tGames = useTranslations('games');
  const editionOptions = getEditionOptions((key) => tGames(key));

  const [formData, setFormData] = useState<EditedGameData>({
    notes: userGame?.notes || '',
    rating: userGame?.rating || 0,
    status: userGame?.status || 'NOT_STARTED',
    play_time: userGame?.play_time || 0,
    completion_percentage: userGame?.completion_percentage || 0,
    condition: userGame?.condition || null,
    review: userGame?.review || null,
    edition: userGame?.edition || null,
    edition_other: userGame?.edition_other || null,
  });

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[calc(100%-2rem)] h-[85vh] sm:h-[700px] flex flex-col overflow-hidden p-0 rounded-2xl shadow-2xl">
        <DialogHeader className="px-6 sm:px-8 pt-6 sm:pt-8 pb-5 border-b bg-gradient-to-r from-card via-card to-card/95">
          <DialogTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            {t('editGame')}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground mt-2">
            {t('editGameDescription')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex justify-center px-4 sm:px-6 mt-4 sm:mt-6 flex-shrink-0">
            <TabsList className="inline-flex w-auto rounded-xl p-1 bg-muted/50">
            <TabsTrigger value="basic" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <BookOpen className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('basicInfo')}</span>
              <span className="sm:hidden">{t('basicInfoShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="rating" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <Star className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('ratingTab')}</span>
              <span className="sm:hidden">{t('ratingTabShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" />
              {t('notesTab')}
            </TabsTrigger>
            </TabsList>
          </div>

          {/* Onglet Informations de base */}
          <TabsContent value="basic" className="overflow-y-auto px-4 sm:px-6 py-6 flex-1 min-h-0">
            <div className="space-y-5">
              <div className="space-y-2.5">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pointer-events-none">{t('status')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_STARTED">{tGames('status.notStarted')}</SelectItem>
                    <SelectItem value="IN_PROGRESS">{tGames('status.inProgress')}</SelectItem>
                    <SelectItem value="COMPLETED">{tGames('status.completed')}</SelectItem>
                    <SelectItem value="DROPPED">{tGames('status.dropped')}</SelectItem>
                    <SelectItem value="WISHLIST">{tGames('status.wishlist')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pointer-events-none">{t('progress')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="completion"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.completion_percentage}
                      onChange={(e) => setFormData({
                        ...formData,
                        completion_percentage: parseInt(e.target.value) || 0
                      })}
                      className="h-11"
                    />
                    <span className="text-muted-foreground font-medium">%</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pointer-events-none">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {t('playTime')} (min)
                  </Label>
                  <Input
                    id="playtime"
                    type="number"
                    min="0"
                    value={formData.play_time}
                    onChange={(e) => setFormData({
                      ...formData,
                      play_time: parseInt(e.target.value) || 0
                    })}
                    className="h-11"
                  />
                </div>
              </div>

              {formData.status !== 'WISHLIST' && (
                <div className="space-y-2.5">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pointer-events-none">{t('gameCondition')}</Label>
                  <Select
                    value={formData.condition || 'not_specified'}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      condition: value === 'not_specified' ? null : value
                    })}
                  >
                    <SelectTrigger id="condition" className="h-11">
                      <SelectValue placeholder={t('notSpecified')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_specified">{t('notSpecified')}</SelectItem>
                      <SelectItem value="neuf">{t('conditionNew')}</SelectItem>
                      <SelectItem value="comme neuf">{t('conditionLikeNew')}</SelectItem>
                      <SelectItem value="très bon état">{t('conditionVeryGood')}</SelectItem>
                      <SelectItem value="bon état">{t('conditionGood')}</SelectItem>
                      <SelectItem value="état moyen">{t('conditionFair')}</SelectItem>
                      <SelectItem value="mauvais état">{t('conditionPoor')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2.5">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pointer-events-none">{t('edition')}</Label>
                <Select
                  value={formData.edition || 'standard'}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    edition: value === 'standard' ? null : value,
                    edition_other: value === 'autres' ? formData.edition_other : null,
                  })}
                >
                  <SelectTrigger id="edition" className="h-11">
                    <SelectValue placeholder={tGames('edition.standard')} />
                  </SelectTrigger>
                  <SelectContent>
                    {editionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.edition === 'autres' && (
                  <Input
                    placeholder={t('editionSpecify')}
                    value={formData.edition_other || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      edition_other: e.target.value || null,
                    })}
                    className="mt-2.5 h-11"
                  />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Onglet Évaluation */}
          <TabsContent value="rating" className="overflow-y-auto px-4 sm:px-6 py-6 flex-1 min-h-0">
            {/* Bloc Note avec étoiles */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-50/50 via-card to-orange-50/50 dark:from-yellow-950/20 dark:via-card dark:to-orange-950/20 border border-border/50 p-6 mb-5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full blur-2xl" />
              <div className="relative space-y-2.5">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide block pointer-events-none">{t('ratingLabel')}</Label>
                <div className="flex justify-center gap-3 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className={`text-5xl transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded ${
                        star <= formData.rating
                          ? 'text-yellow-400 drop-shadow-lg'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground font-medium">
                  {formData.rating > 0
                    ? t('ratingOutOfFive', { rating: formData.rating })
                    : t('noRating')}
                </p>
              </div>
            </div>

            {/* Bloc Mon avis */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50/50 via-card to-pink-50/50 dark:from-purple-950/20 dark:via-card dark:to-pink-950/20 border border-border/50 p-6">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl" />
              <div className="relative space-y-2.5">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide block pointer-events-none">{t('myReview')}</Label>
                <textarea
                  id="review"
                  value={formData.review || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    review: e.target.value || null,
                  })}
                  className="w-full min-h-[180px] max-h-[300px] rounded-lg border border-input bg-background/50 backdrop-blur-sm px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-y text-sm"
                  placeholder={t('reviewPlaceholder')}
                />
              </div>
            </div>
          </TabsContent>

          {/* Onglet Notes */}
          <TabsContent value="notes" className="overflow-y-auto px-4 sm:px-6 py-6 flex-1 min-h-0">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 p-6 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
              <div className="relative h-full flex flex-col space-y-2.5">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide block pointer-events-none">{t('personalNotes')}</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({
                    ...formData,
                    notes: e.target.value,
                  })}
                  className="flex-1 w-full min-h-[200px] rounded-lg border border-input bg-background/50 backdrop-blur-sm px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-y text-sm"
                  placeholder={t('notesPlaceholder')}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-3 px-6 py-4 border-t mt-auto">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto order-2 sm:order-1">
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto order-1 sm:order-2">
            {isLoading ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
