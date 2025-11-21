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

export default function HelpPage() {
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            Centre d'aide
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Tout ce que vous devez savoir pour utiliser MemCard au mieux
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
            Navigation et Onglets
          </CardTitle>
          <CardDescription>
            Découvrez les différentes sections de votre application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <Library className="h-5 w-5 text-primary" />
                Collection
              </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Votre collection personnelle contient tous les jeux que vous possédez. 
                  Vous pouvez les organiser selon leur statut :
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                  <li><strong>Tous</strong> : Tous vos jeux, quel que soit leur statut</li>
                  <li><strong>En cours</strong> : Jeux que vous êtes en train de jouer</li>
                  <li><strong>Terminés</strong> : Jeux que vous avez terminés</li>
                  <li><strong>À faire</strong> : Jeux que vous n'avez pas encore commencés</li>
                </ul>
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Grid2X2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Mode grille</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Mode liste</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">Filtres disponibles :</p>
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
                      Affichent uniquement les plateformes et genres que vous possédez réellement, avec le nombre de jeux pour chaque.
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
                    <span className="text-xs text-muted-foreground">Bouton d'export Excel dans la barre d'outils</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t">
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Wishlist
              </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Votre liste de souhaits contient les jeux que vous souhaitez acquérir. 
                  C'est un endroit idéal pour garder une trace de vos envies de jeux.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Astuce :</strong> Vous pouvez partager votre wishlist 
                  avec vos proches pour faciliter l'achat de cadeaux !
                </p>
            </div>

            <div className="pt-3 border-t">
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Signification des icônes de statut
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Sur mobile, les statuts de jeux sont affichés avec des icônes pour gagner de l'espace :
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <Circle className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">= Non commencé</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <Play className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">= En cours</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">= Terminé</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <XCircle className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">= Abandonné</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <Heart className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">= Liste de souhaits</span>
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
            Ajouter un jeu à votre collection
          </CardTitle>
          <CardDescription>
            Comment enrichir votre bibliothèque de jeux
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Page de recherche
              </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Utilisez la page <Link href="/search" className="text-primary hover:underline font-medium">Rechercher</Link> pour 
                  trouver et ajouter des jeux à votre collection ou votre wishlist.
                </p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-2">
                  <li>Cliquez sur <strong>"Ajouter un jeu"</strong> dans la barre de navigation</li>
                  <li>Tapez le nom du jeu dans le champ de recherche</li>
                  <li>Sélectionnez la console si vous souhaitez filtrer les résultats</li>
                  <li>Parcourez les résultats et cliquez sur le jeu qui vous intéresse</li>
                  <li>Choisissez de l'ajouter à votre <strong>Collection</strong> ou à votre <strong>Wishlist</strong></li>
                  <li>Renseignez les informations optionnelles (prix d'achat, état, etc.)</li>
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
            Partager votre Wishlist
          </CardTitle>
          <CardDescription>
            Permettez à vos proches de voir ce que vous souhaitez
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2">Comment partager ?</h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-2">
                <li>Allez dans votre onglet <strong>Wishlist</strong></li>
                <li>Activez le partage avec le bouton <Badge variant="outline" className="mx-1">Partage actif</Badge></li>
                <li>Cliquez sur le bouton <Badge variant="outline" className="mx-1">Partager</Badge> en haut à droite</li>
                <li>Copiez le lien généré et partagez-le avec vos proches</li>
              </ol>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Note de sécurité :</strong> Vous pouvez activer ou désactiver 
                le partage à tout moment. Le lien ne fonctionne que lorsque le partage est actif.
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
            Système d'amis
          </CardTitle>
          <CardDescription>
            Connectez-vous avec d'autres collectionneurs et partagez vos découvertes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Ajouter des amis
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Il existe plusieurs façons d'ajouter des amis dans MemCard :
              </p>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Votre code d'ami
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Chaque utilisateur possède un code unique pour être ajouté comme ami.
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                    <li>Allez dans votre <Link href="/friends" className="text-primary hover:underline font-medium">page amis</Link></li>
                    <li>Cliquez sur <strong>"Mon code d'ami"</strong> pour voir votre code</li>
                    <li>Partagez ce code avec vos amis collectionneurs</li>
                    <li>Ils pourront vous ajouter en utilisant ce code</li>
                  </ol>
                </div>

                <div className="p-3 rounded-lg border">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-primary" />
                    Ajouter un ami par code
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Utilisez le code d'un ami pour l'ajouter à votre liste.
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                    <li>Cliquez sur <strong>"Ajouter un ami"</strong> dans la page amis</li>
                    <li>Entrez le code d'ami de votre contact</li>
                    <li>L'ami sera automatiquement ajouté à votre liste</li>
                  </ol>
                </div>

                <div className="p-3 rounded-lg border">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    Scanner un QR code
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Scannez le QR code d'un ami pour l'ajouter instantanément.
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                    <li>Dans la page amis, cliquez sur l'icône QR code</li>
                    <li>Scannez le QR code affiché par votre ami</li>
                    <li>L'ami sera automatiquement ajouté à votre liste</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Gérer vos demandes d'ami
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Gérez les demandes d'ami entrantes et sortantes.
              </p>
              <div className="space-y-2">
                <div className="p-3 rounded-lg border">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Accepter une demande
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur <CheckCircle2 className="h-3 w-3 inline text-emerald-600 dark:text-emerald-400" /> pour accepter une demande d'ami.
                    Vous pourrez alors voir sa collection et échanger.
                  </p>
                </div>
                <div className="p-3 rounded-lg border">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    Refuser une demande
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur <XCircle className="h-3 w-3 inline text-destructive" /> pour refuser une demande d'ami.
                    La personne ne sera pas notifiée du refus.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Interagir avec vos amis
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Découvrez les collections de vos amis et partagez vos découvertes.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                <li><strong>Voir les collections</strong> : Accédez aux jeux de vos amis (en lecture seule)</li>
                <li><strong>Échanger des conseils</strong> : Discutez de vos jeux préférés</li>
                <li><strong>Partager des découvertes</strong> : Faites connaître de nouveaux jeux à vos amis</li>
                <li><strong>Comparer les collections</strong> : Voyez ce que vous avez en commun</li>
              </ul>
              <div className="mt-3 bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <EyeOff className="h-4 w-4 inline mr-1" />
                  <strong className="text-foreground">Confidentialité :</strong> Vous ne pouvez voir que les collections
                  des personnes qui vous ont accepté comme ami. Vos amis ne peuvent pas modifier vos jeux.
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
            Profils publics et collectionneurs
          </CardTitle>
          <CardDescription>
            Partagez votre collection et découvrez celles des autres
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Rendre votre profil public
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Vous pouvez rendre votre profil public pour permettre aux autres collectionneurs de voir votre collection.
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-2">
                <li>Allez dans votre <Link href="/profile" className="text-primary hover:underline font-medium">profil</Link></li>
                <li>Dans la section <strong>"Préférences"</strong>, trouvez l'option <strong>"Profil public"</strong></li>
                <li>Cochez la case pour rendre votre profil public</li>
                <li>Votre collection sera maintenant visible par tous les autres collectionneurs</li>
              </ol>
              <div className="mt-3 bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Note :</strong> Vous pouvez à tout moment rendre votre profil privé en décochant cette option. 
                  Seuls les jeux de votre collection (hors wishlist) seront visibles par les autres.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Explorer d'autres collections
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Découvrez les collections des autres collectionneurs.
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-2">
                <li>Cliquez sur <strong>"Collectionneurs"</strong> dans la barre de navigation</li>
                <li>Vous verrez la liste de tous les collectionneurs disponibles</li>
                <li>Utilisez la barre de recherche pour trouver un collectionneur par son nom d'utilisateur</li>
                <li>Cliquez sur un collectionneur pour voir sa collection complète</li>
              </ol>
              <div className="mt-3 space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Fonctionnalités disponibles :</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                  <li>Voir tous les jeux de la collection (en mode lecture seule)</li>
                  <li>Filtrer par statut, plateforme et genre</li>
                  <li>Rechercher dans la collection</li>
                  <li>Voir les notes et évaluations des jeux</li>
                </ul>
              </div>
              <div className="mt-3 bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <EyeOff className="h-4 w-4 inline mr-1" />
                  <strong className="text-foreground">Important :</strong> Vous ne pouvez pas modifier ou supprimer les jeux des autres collectionneurs. 
                  Ces collections sont en lecture seule.
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
            Validation des achats cadeaux
          </CardTitle>
          <CardDescription>
            Gérez les jeux qui vous ont été offerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2">Comment ça fonctionne ?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Quand quelqu'un visite votre wishlist partagée et coche un jeu comme <strong>"Acheté"</strong>, 
                vous recevez une notification.
              </p>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border">
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Recevoir une notification
                </h4>
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur l'icône <Bell className="h-4 w-4 inline" /> dans la barre de navigation 
                    pour voir vos notifications de jeux offerts.
                  </p>
                </div>
              <div className="p-3 rounded-lg border">
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Valider l'achat
                </h4>
                  <p className="text-sm text-muted-foreground">
                    Si vous avez bien reçu le jeu, cliquez sur <CheckCircle2 className="h-4 w-4 inline text-emerald-600 dark:text-emerald-400" />. 
                    Le jeu sera automatiquement retiré de votre wishlist et ajouté à votre collection 
                    avec le statut <strong>"À faire"</strong>.
                  </p>
                </div>
              <div className="p-3 rounded-lg border">
                <h4 className="font-medium mb-1 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  Annuler l'achat
                </h4>
                  <p className="text-sm text-muted-foreground">
                    Si le jeu n'a pas été acheté ou si c'était une erreur, cliquez sur <XCircle className="h-4 w-4 inline text-destructive" />. 
                    Le jeu restera dans votre wishlist.
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
            Formulaire de contact
          </CardTitle>
          <CardDescription>
            Besoin d'aide ? Une question ? Contactez-nous !
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Utilisez le formulaire de contact pour :
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2 mb-4">
                <li>Signaler un bug ou un problème technique</li>
                <li>Poser une question sur l'utilisation de l'application</li>
                <li>Faire une suggestion d'amélioration</li>
                <li>Demander de l'aide sur une fonctionnalité spécifique</li>
              </ul>
              <Button 
                asChild
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Link href="/contact">
                  <Mail className="mr-2 h-4 w-4" />
                  Ouvrir le formulaire de contact
                </Link>
              </Button>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Réponse rapide :</strong> Nous répondons généralement 
                dans les 24-48 heures à l'adresse email associée à votre compte.
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
            Soutenir le projet
          </CardTitle>
          <CardDescription>
            Votre soutien nous permet de continuer à améliorer MemCard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Si MemCard vous est utile, vous pouvez nous soutenir de plusieurs façons :
              </p>
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Don via Ko-fi
                  </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Vous pouvez faire un don via Ko-fi pour soutenir le projet. Vous pouvez également ajouter un message personnalisé avec votre don pour nous dire ce que vous aimez dans MemCard !
                      </p>
                      <Button 
                        onClick={() => setSupportDialogOpen(true)}
                        className="w-full sm:w-auto"
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        Faire un don sur Ko-fi
                      </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Retours et suggestions
                  </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Vos retours et suggestions sont également très appréciés et nous aident à améliorer l'application.
                      </p>
                      <Button 
                        asChild
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <Link href="/contact">
                          <Mail className="mr-2 h-4 w-4" />
                          Nous contacter
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
            Astuces pratiques
          </CardTitle>
          <CardDescription>
            Quelques conseils pour tirer le meilleur parti de MemCard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 transition-all duration-300">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Organisez avec les filtres
              </h4>
                <p className="text-sm text-muted-foreground">
                  Utilisez les filtres par console et genre pour organiser votre collection
                </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 transition-all duration-300">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Sauvegardez régulièrement
              </h4>
                <p className="text-sm text-muted-foreground">
                  Exportez régulièrement votre collection en Excel pour avoir une sauvegarde
                </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 transition-all duration-300">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Suivez la valeur
              </h4>
                <p className="text-sm text-muted-foreground">
                  Renseignez le prix d'achat pour suivre la valeur de votre collection
                </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 transition-all duration-300">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Mettez à jour le statut
              </h4>
                <p className="text-sm text-muted-foreground">
                  Mettez à jour le statut de vos jeux au fur et à mesure de votre progression
                </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 transition-all duration-300 md:col-span-2">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Partagez avant les fêtes
              </h4>
                <p className="text-sm text-muted-foreground">
                  Partagez votre wishlist avant les anniversaires et fêtes pour faciliter les cadeaux
                </p>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-6 border-t border-border/50">
        <p className="mb-4">
          Vous avez une question qui n'est pas couverte ici ?
        </p>
        <Button 
          asChild
          variant="outline"
          className="rounded-lg"
        >
          <Link href="/contact">
            <Mail className="mr-2 h-4 w-4" />
            Contactez-nous
          </Link>
        </Button>
      </div>
      <SupportDialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen} />
    </div>
  );
}

