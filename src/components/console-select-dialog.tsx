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
  onSelect: (consoleId: string, consoleName?: string) => void;
  gameName: string;
  gamePlatforms?: Platform[];
}

export function ConsoleSelectDialog({ isOpen, onClose, onSelect, gameName, gamePlatforms }: ConsoleSelectDialogProps) {
  // S'assurer qu'on a accès au nom du jeu et platformes
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [selectedConsoleId, setSelectedConsoleId] = useState<string>('');
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
      // Pass both ID and name to the parent component
      onSelect(selectedConsoleId, selectedConsole?.name || 'Console sélectionnée');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Sélectionnez une console
          </DialogTitle>
          <DialogDescription>
            Choisissez la console pour &quot;{gameName || 'ce jeu'}&quot;
            {gamePlatforms && gamePlatforms.length > 0 && (
              <div className="mt-2 text-xs">
                <span className="font-medium">Plateformes disponibles:</span>{' '}
                {gamePlatforms.map(p => p.abbreviation || p.name).join(', ')}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="console">Console</Label>
              <Select
                value={selectedConsoleId}
                onValueChange={setSelectedConsoleId}
              >
                <SelectTrigger id="console">
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
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedConsoleId || isLoading}>
            Ajouter à la collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
