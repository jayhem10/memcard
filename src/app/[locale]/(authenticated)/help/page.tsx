'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Library, 
  Gift, 
  PlusCircle, 
  Bell, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Heart,
  Search,
  Grid2X2,
  List,
  Database,
  Sparkles,
  Filter,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  Users,
  User,
  Eye,
  EyeOff,
  Circle,
  Play
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SupportDialog } from '@/components/ui/support-dialog';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function HelpPage() {
  const t = useTranslations('help');
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </section>

      {/* Navigation et Onglets */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <Card className="border-0 shadow-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            {t('navigationTitle')}
          </CardTitle>
          <CardDescription>
            {t('navigationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <Library className="h-5 w-5 text-primary" />
                {t('collectionTitle')}
              </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('collectionDescription')}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                  <li>{t('allGames')}</li>
                  <li>{t('inProgressGames')}</li>
                  <li>{t('completedGames')}</li>
                  <li>{t('backlogGames')}</li>
                </ul>
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Grid2X2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t('gridMode')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t('listMode')}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">{t('filtersAvailable')}</p>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Plateformes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                          <path d="M5 3v4" />
                          <path d="M19 17v4" />
                          <path d="M3 5h4" />
                          <path d="M17 19h4" />
                        </svg>
                        <span className="text-xs text-muted-foreground">Genres</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      {t('filtersDescription')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="M16 13H8" />
                      <path d="M16 17H8" />
                      <path d="M10 9H8" />
                    </svg>
                    <span className="text-xs text-muted-foreground">{t('excelExport')}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t">
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                {t('wishlistTitle')}
              </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {t('wishlistDescription')}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{t('wishlistTip').split(':')[0]} :</strong> {t('wishlistTip').split(':')[1]}
                </p>
            </div>

            <div className="pt-3 border-t">
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                {t('statusIconsTitle')}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {t('statusIconsDescription')}
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <Circle className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{t('notStartedIcon')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <Play className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{t('inProgressIcon')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{t('completedIcon')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <XCircle className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{t('droppedIcon')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <Heart className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{t('wishlistIcon')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Ajouter un jeu */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <Card className="border-0 shadow-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            {t('addGameTitle')}
          </CardTitle>
          <CardDescription>
            {t('addGameDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                {t('searchPageTitle')}
              </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('searchPageDescription')}
                </p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-2">
                  <li>{t('searchStep1')}</li>
                  <li>{t('searchStep2')}</li>
                  <li>{t('searchStep3')}</li>
                  <li>{t('searchStep4')}</li>
                  <li>{t('searchStep5')}</li>
                  <li>{t('searchStep6')}</li>
                </ol>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Wishlist et Partage */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <Card className="border-0 shadow-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('shareWishlistTitle')}
          </CardTitle>
          <CardDescription>
            {t('shareWishlistDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2">{t('howToShare')}</h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-2">
                <li>{t('shareStep1')}</li>
                <li>{t('shareStep2')}</li>
                <li>{t('shareStep3')}</li>
                <li>{t('shareStep4')}</li>
              </ol>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('securityNote')}
              </p>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Système d'amis */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <Card className="border-0 shadow-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('friendsSystemTitle')}
          </CardTitle>
          <CardDescription>
            {t('friendsSystemDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {t('addFriendsTitle')}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t('addFriendsDescription')}
              </p>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    {t('yourFriendCode')}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('eachUserHasUniqueCode')}
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                    <li>{t('goToFriendsPage')}</li>
                    <li>{t('clickMyFriendCode')}</li>
                    <li>{t('shareWithCollectorFriends')}</li>
                    <li>{t('theyCanAddYou')}</li>
                  </ol>
                </div>

                <div className="p-3 rounded-lg border">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-primary" />
                    {t('addFriendByCode')}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('useFriendCodeToAdd')}
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                    <li>{t('clickAddFriendInFriendsPage')}</li>
                    <li>{t('enterContactFriendCode')}</li>
                    <li>{t('friendWillBeAdded')}</li>
                  </ol>
                </div>

                <div className="p-3 rounded-lg border">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    {t('scanQrCode')}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('scanFriendQrCode')}
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                    <li>{t('friendsPageQrStep1')}</li>
                    <li>{t('friendsPageQrStep2')}</li>
                    <li>{t('friendWillBeAddedAutomatically')}</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                {t('manageFriendRequests')}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t('manageIncomingOutgoingRequests')}
              </p>
              <div className="space-y-2">
                <div className="p-3 rounded-lg border">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {t('acceptRequest')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('clickToAcceptFriendRequest')}
                  </p>
                </div>
                <div className="p-3 rounded-lg border">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    {t('refuseRequest')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('clickToRefuseFriendRequest')}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                {t('interactWithFriends')}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t('discoverFriendsCollections')}
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                <li>{t('viewCollectionsAccess')}</li>
                <li>{t('exchangeAdviceDiscuss')}</li>
                <li>{t('shareDiscoveriesIntroduce')}</li>
                <li>{t('compareCollectionsSee')}</li>
              </ul>
              <div className="mt-3 bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <EyeOff className="h-4 w-4 inline mr-1" />
                  <strong className="text-foreground">{t('privacyLabel')}</strong> {t('privacyDescription')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Profils publics et collectionneurs */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <Card className="border-0 shadow-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('publicProfilesCollectors')}
          </CardTitle>
          <CardDescription>
            {t('shareCollectionDiscoverOthers')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {t('makeProfilePublic')}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t('makeProfilePublicDescription')}
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-2">
                <li>{t('goToYourProfile')}</li>
                <li>{t('preferencesSectionStep')}</li>
                <li>{t('checkBoxToMakePublic')}</li>
                <li>{t('collectionNowVisible')}</li>
              </ol>
              <div className="mt-3 bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{t('notePublicProfile')}</strong> 
                  {t('onlyCollectionGamesVisible')}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                {t('exploreOtherCollections')}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t('exploreCollectionsDescription')}
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-2">
                <li>{t('clickCollectorsInNavigation')}</li>
                <li>{t('youWillSeeListOfAvailableCollectors')}</li>
                <li>{t('useSearchBarToFind')}</li>
                <li>{t('clickOnCollector')}</li>
              </ol>
              <div className="mt-3 space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{t('availableFeaturesLabel')}</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                  <li>{t('viewAllGamesReadOnly')}</li>
                  <li>{t('filterByStatusPlatformGenre')}</li>
                  <li>{t('searchInCollection')}</li>
                  <li>{t('viewNotesRatings')}</li>
                </ul>
              </div>
              <div className="mt-3 bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <EyeOff className="h-4 w-4 inline mr-1" />
                  <strong className="text-foreground">{t('importantNote')}</strong> {t('cannotModifyOtherGames')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Validation des achats cadeaux */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <Card className="border-0 shadow-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('giftPurchaseValidation')}
          </CardTitle>
          <CardDescription>
            {t('manageGiftedGames')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2">{t('howItWorksLabel')}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t('whenSomeoneVisitsWishlist')} 
                    {t('youReceiveNotification')}
              </p>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border">
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  {t('receiveNotification')}
                </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('clickBellIconForNotifications')}
                  </p>
                </div>
              <div className="p-3 rounded-lg border">
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  {t('validatePurchase')}
                </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('ifReceivedClickCheckmark')}
                  </p>
                </div>
              <div className="p-3 rounded-lg border">
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  {t('cancelPurchase')}
                </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('ifNotPurchasedOrMistake')}
                  </p>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Formulaire de contact */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <Card className="border-0 shadow-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('contactForm')}
          </CardTitle>
          <CardDescription>
            {t('needHelp')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                {t('contactForm')} :
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2 mb-4">
                <li>{t('reportBug')}</li>
                <li>{t('askQuestionAboutApp')}</li>
                <li>{t('makeImprovementSuggestion')}</li>
                <li>{t('askForHelp')}</li>
              </ul>
              <Button 
                asChild
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Link href="/contact">
                  <Mail className="mr-2 h-4 w-4" />
                  {t('openContactForm')}
                </Link>
              </Button>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{t('quickResponseLabel')}</strong> {t('weRespondGenerally')}
                {t('respondWithin24_48Hours')}
              </p>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Soutien et Tips */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <Card className="border-0 shadow-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            {t('supportProject')}
          </CardTitle>
          <CardDescription>
            {t('supportAllowsContinue')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                {t('ifMemCardUseful')}
              </p>
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    {t('donationViaKoFi')}
                  </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t('donateViaKoFi')}
                      </p>
                      <Button 
                        onClick={() => setSupportDialogOpen(true)}
                        className="w-full sm:w-auto"
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        {t('makeDonationOnKoFi')}
                      </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    {t('feedbackSuggestions')}
                  </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t('feedbackAppreciated')}
                      </p>
                      <Button 
                        asChild
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <Link href="/contact">
                          <Mail className="mr-2 h-4 w-4" />
                          {t('contactUs')}
                        </Link>
                      </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Astuces */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <Card className="border-0 shadow-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('practicalTips')}
          </CardTitle>
          <CardDescription>
            {t('tipsToGetMostOfMemCard')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 transition-all duration-300">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                {t('organizeWithFilters')}
              </h4>
                <p className="text-sm text-muted-foreground">
                  {t('usePlatformGenreFilters')}
                </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 transition-all duration-300">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                {t('backupRegularly')}
              </h4>
                <p className="text-sm text-muted-foreground">
                  {t('exportRegularlyExcel')}
                </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 transition-all duration-300">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                {t('trackValue')}
              </h4>
                <p className="text-sm text-muted-foreground">
                  {t('enterPurchasePrice')}
                </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 transition-all duration-300">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t('updateGameStatus')}
              </h4>
                <p className="text-sm text-muted-foreground">
                  {t('updateGameStatusDescription')}
                </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 transition-all duration-300 md:col-span-2">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                {t('shareBeforeHolidaysNew')}
              </h4>
                <p className="text-sm text-muted-foreground">
                  {t('shareWishlistHolidays')}
                </p>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-6 border-t border-border/50">
        <p className="mb-4">
          {t('youHaveQuestionNotCovered')}
        </p>
        <Button 
          asChild
          variant="outline"
          className="rounded-lg"
        >
          <Link href="/contact">
            <Mail className="mr-2 h-4 w-4" />
            {t('contactUsLower')}
          </Link>
        </Button>
      </div>
      <SupportDialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen} />
    </div>
  );
}

