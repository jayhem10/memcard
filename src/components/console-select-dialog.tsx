'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Console {
  id: string;
  name: string;
  igdb_platform_id?: number;
  abbreviation?: string;
}

interface Platform {
  id: number;
  name: string;
  abbreviation?: string;
  alternative_name?: string;
}

interface ConsoleSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (consoleId: string, consoleName?: string, status?: string, buyPrice?: number, condition?: string) => void;
  gameName: string;
  gamePlatforms?: Platform[];
}

export function ConsoleSelectDialog({ isOpen, onClose, onSelect, gameName, gamePlatforms }: ConsoleSelectDialogProps) {
  // S'assurer qu'on a accès au nom du jeu et platformes
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [selectedConsoleId, setSelectedConsoleId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('NOT_STARTED');
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [condition, setCondition] = useState<string>('');
  const [isWishlist, setIsWishlist] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConsoles = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('consoles')
        .select('id, name, igdb_platform_id, abbreviation')
        .order('name')
        .returns<Console[]>();
      
      const { data, error } = await query;

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Si nous avons des plateformes de jeu et des consoles avec des IDs de plateforme IGDB
        if (gamePlatforms && gamePlatforms.length > 0) {
          // Récupérer tous les IDs de plateforme IGDB du jeu
          const gamePlatformIds = gamePlatforms.map(p => p.id);
          
          // Filtrer les consoles pour ne montrer que celles liées aux plateformes du jeu
          const matchedConsoles = data.filter(console => {
            // Vérifier que igdb_platform_id est un nombre valide avant de l'utiliser
            return typeof console.igdb_platform_id === 'number' && 
                   gamePlatformIds.includes(console.igdb_platform_id);
          });
          
          // Utiliser les consoles filtrées si nous avons des correspondances, sinon montrer toutes les consoles
          const consolesToShow = matchedConsoles.length > 0 ? matchedConsoles : data;
          setConsoles(consolesToShow);
          
          // Par défaut, sélectionner la première console
          if (consolesToShow.length > 0 && typeof consolesToShow[0].id === 'string') {
            setSelectedConsoleId(consolesToShow[0].id);
          }
        } else {
          // Si aucune plateforme n'est fournie, afficher toutes les consoles
          setConsoles(data);
          if (data.length > 0 && typeof data[0].id === 'string') {
            setSelectedConsoleId(data[0].id);
          }
        }
      } else {
        // Si aucune console, en créer une par défaut
        await createDefaultConsole();
      }
    } catch (error) {
      console.error('Error fetching consoles:', error);
      toast.error('Erreur lors de la récupération des consoles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConsoles();
    }
  }, [isOpen, gamePlatforms, gameName]);

  const createDefaultConsole = async () => {
    try {
      const { data, error } = await supabase
        .from('consoles')
        .insert({ 
          name: 'Console par défaut',
          igdb_platform_id: null,
          release_year: 2000 // Année par défaut
        })
        .select('id, name, igdb_platform_id, abbreviation')
        .single();

      if (error) throw error;
      
      if (data) {
        // Vérifier et convertir les données en objet Console
        const id = typeof data.id === 'string' ? data.id : '';
        const name = typeof data.name === 'string' ? data.name : 'Console par défaut';
        const igdb_platform_id = typeof data.igdb_platform_id === 'number' ? data.igdb_platform_id : undefined;
        const abbreviation = typeof data.abbreviation === 'string' ? data.abbreviation : undefined;
        
        const defaultConsole: Console = { id, name, igdb_platform_id, abbreviation };
        
        setConsoles([defaultConsole]);
        setSelectedConsoleId(id);
      }
    } catch (error) {
      console.error('Error creating default console:', error);
      toast.error('Erreur lors de la création de la console par défaut');
    }
  };

  const handleConfirm = () => {
    if (selectedConsoleId) {
      // Find the selected console to get its name
      const selectedConsole = consoles.find(c => c.id === selectedConsoleId);
      const numericPrice = parseFloat(buyPrice) || undefined;
      // Si wishlist est coché, le statut sera WISHLIST, sinon on utilise le statut sélectionné
      const finalStatus = isWishlist ? 'WISHLIST' : selectedStatus;
      // Si wishlist, pas de prix ni d'état
      const finalPrice = isWishlist ? undefined : numericPrice;
      const finalCondition = isWishlist ? undefined : (condition || undefined);
      // Pass both ID, name, status and price to the parent component
      onSelect(selectedConsoleId, selectedConsole?.name || 'Console sélectionnée', finalStatus, finalPrice, finalCondition);
    }
  };

  // Réinitialiser les champs quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen) {
      setIsWishlist(false);
      setSelectedStatus('NOT_STARTED');
      setBuyPrice('');
      setCondition('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] max-w-[100vw] p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle>
            Sélectionnez une console
          </DialogTitle>
          <DialogDescription>
            Choisissez la console pour &quot;{gameName || 'ce jeu'}&quot;
          </DialogDescription>
          {gamePlatforms && gamePlatforms.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Plateformes disponibles:</span>{' '}
                {gamePlatforms.map(p => p.abbreviation || p.name).join(', ')}
              </p>
            </div>
          )}
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="py-2 sm:py-4 space-y-3 sm:space-y-4 px-4 sm:px-6 overflow-y-auto max-h-[50vh] sm:max-h-[55vh]">
            <div className="space-y-2">
              <Label htmlFor="console">Console</Label>
              <Select
                value={selectedConsoleId}
                onValueChange={setSelectedConsoleId}
              >
                <SelectTrigger id="console" className="w-full">
                  <SelectValue placeholder="Sélectionnez une console" />
                </SelectTrigger>
                <SelectContent>
                  {/* Afficher d'abord les consoles qui correspondent aux plateformes du jeu */}
                  {gamePlatforms && gamePlatforms.length > 0 && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Plateformes compatibles
                    </div>
                  )}
                  {consoles
                    .filter(console => console.igdb_platform_id && 
                      gamePlatforms?.some(p => p.id === console.igdb_platform_id))
                    .map((console) => (
                      <SelectItem 
                        key={console.id} 
                        value={console.id}
                        className="font-medium"
                      >
                        {console.name} {console.abbreviation ? `(${console.abbreviation})` : ''}
                      </SelectItem>
                    ))}
                  
                  {/* Ligne de séparation si nous avons des plateformes compatibles et d'autres consoles */}
                  {gamePlatforms && gamePlatforms.length > 0 && 
                    consoles.some(c => !c.igdb_platform_id || !gamePlatforms.some(p => p.id === c.igdb_platform_id)) && (
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                        Autres consoles
                      </div>
                  )}
                  
                  {/* Afficher les autres consoles */}
                  {consoles
                    .filter(console => !console.igdb_platform_id || 
                      !gamePlatforms?.some(p => p.id === console.igdb_platform_id))
                    .map((console) => (
                      <SelectItem key={console.id} value={console.id}>
                        {console.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Case à cocher Wishlist */}
            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="wishlist"
                checked={isWishlist}
                onChange={(e) => setIsWishlist(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-2"
              />
              <Label htmlFor="wishlist" className="text-sm font-medium cursor-pointer">
                Ajouter à la liste de souhaits
              </Label>
            </div>

            {/* Statut - désactivé si wishlist */}
            <div className="space-y-2">
              <Label htmlFor="status" className={isWishlist ? 'text-muted-foreground' : ''}>
                Statut {isWishlist && '(non disponible pour la wishlist)'}
              </Label>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                disabled={isWishlist}
              >
                <SelectTrigger id="status" className={isWishlist ? 'opacity-50 cursor-not-allowed' : ''}>
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_STARTED">Non commencé</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="COMPLETED">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* État - désactivé si wishlist */}
            <div className="space-y-2">
              <Label htmlFor="condition" className={isWishlist ? 'text-muted-foreground' : ''}>
                État (optionnel) {isWishlist && '(non disponible pour la wishlist)'}
              </Label>
              <Select
                value={condition}
                onValueChange={setCondition}
                disabled={isWishlist}
              >
                <SelectTrigger id="condition" className={isWishlist ? 'opacity-50 cursor-not-allowed' : ''}>
                  <SelectValue placeholder="Sélectionnez l'état du jeu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neuf">Neuf</SelectItem>
                  <SelectItem value="comme neuf">Comme neuf</SelectItem>
                  <SelectItem value="très bon état">Très bon état</SelectItem>
                  <SelectItem value="bon état">Bon état</SelectItem>
                  <SelectItem value="état moyen">État moyen</SelectItem>
                  <SelectItem value="mauvais état">Mauvais état</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prix d'achat - désactivé si wishlist */}
            <div className="space-y-2">
              <Label htmlFor="buyPrice" className={isWishlist ? 'text-muted-foreground' : ''}>
                Prix d'achat (optionnel) {isWishlist && '(non disponible pour la wishlist)'}
              </Label>
              <Input
                id="buyPrice"
                type="number"
                step="0.01"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.00"
                className="w-full"
                disabled={isWishlist}
              />
            </div>
          </div>
        )}
        
        <DialogFooter className="gap-2 sm:gap-0 sticky bottom-0 bg-background px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedConsoleId || isLoading} className="w-full sm:w-auto">
            Ajouter à la collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
