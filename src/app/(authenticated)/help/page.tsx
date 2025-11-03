'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Library, 
  Gift, 
  PlusCircle, 
  Share2, 
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
  BookOpen,
  Filter,
  FileSpreadsheet,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SupportDialog } from '@/components/ui/support-dialog';
import Link from 'next/link';
import { useState } from 'react';

export default function HelpPage() {
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
          <BookOpen className="h-8 w-8" />
          Centre d'aide
        </h1>
        <p className="text-muted-foreground text-lg">
          Tout ce que vous devez savoir pour utiliser MemCard au mieux
        </p>
      </div>

      {/* Navigation et Onglets */}
      <Card>
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
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 mt-1">
                <Library className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Collection</h3>
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
            </div>

            <div className="flex items-start gap-3 pt-3 border-t">
              <div className="p-2 rounded-lg bg-primary/10 mt-1">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Wishlist</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Votre liste de souhaits contient les jeux que vous souhaitez acquérir. 
                  C'est un endroit idéal pour garder une trace de vos envies de jeux.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Astuce :</strong> Vous pouvez partager votre wishlist 
                  avec vos proches pour faciliter l'achat de cadeaux !
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ajouter un jeu */}
      <Card>
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
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 mt-1">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Page de recherche</h3>
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
          </div>
        </CardContent>
      </Card>

      {/* Wishlist et Partage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
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

      {/* Validation des achats cadeaux */}
      <Card>
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
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <Bell className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Recevoir une notification</h4>
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur l'icône <Bell className="h-4 w-4 inline" /> dans la barre de navigation 
                    pour voir vos notifications de jeux offerts.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Valider l'achat</h4>
                  <p className="text-sm text-muted-foreground">
                    Si vous avez bien reçu le jeu, cliquez sur <CheckCircle2 className="h-4 w-4 inline text-emerald-600 dark:text-emerald-400" />. 
                    Le jeu sera automatiquement retiré de votre wishlist et ajouté à votre collection 
                    avec le statut <strong>"À faire"</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border">
                <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium mb-1">Annuler l'achat</h4>
                  <p className="text-sm text-muted-foreground">
                    Si le jeu n'a pas été acheté ou si c'était une erreur, cliquez sur <XCircle className="h-4 w-4 inline text-destructive" />. 
                    Le jeu restera dans votre wishlist.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de contact */}
      <Card>
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

      {/* Soutien et Tips */}
      <Card>
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
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Don via Ko-fi</h4>
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
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Retours et suggestions</h4>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Astuces */}
      <Card>
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
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Organisez avec les filtres</h4>
                <p className="text-sm text-muted-foreground">
                  Utilisez les filtres par console et genre pour organiser votre collection
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Sauvegardez régulièrement</h4>
                <p className="text-sm text-muted-foreground">
                  Exportez régulièrement votre collection en Excel pour avoir une sauvegarde
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Suivez la valeur</h4>
                <p className="text-sm text-muted-foreground">
                  Renseignez le prix d'achat pour suivre la valeur de votre collection
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Mettez à jour le statut</h4>
                <p className="text-sm text-muted-foreground">
                  Mettez à jour le statut de vos jeux au fur et à mesure de votre progression
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card md:col-span-2">
              <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">Partagez avant les fêtes</h4>
                <p className="text-sm text-muted-foreground">
                  Partagez votre wishlist avant les anniversaires et fêtes pour faciliter les cadeaux
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-8 border-t">
        <p className="mb-4">
          Vous avez une question qui n'est pas couverte ici ?
        </p>
        <Button 
          asChild
          variant="outline"
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

