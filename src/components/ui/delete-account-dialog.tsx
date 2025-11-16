'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteAccountDialogProps {
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

const CONFIRMATION_TEXT = "SUPPRIMER MON COMPTE";

export function DeleteAccountDialog({ onConfirm, isLoading = false }: DeleteAccountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmationValid = confirmationText === CONFIRMATION_TEXT;

  const handleConfirm = async () => {
    if (!isConfirmationValid) {
      toast.error('Veuillez taper exactement le texte de confirmation');
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      setIsOpen(false);
      setConfirmationText('');
      toast.success('Compte supprimé avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.message || 'Erreur lors de la suppression du compte');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmationText('');
    }
    setIsOpen(open);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          disabled={isLoading}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer le compte
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[500px] !w-[calc(100vw-2rem)] sm:!w-full max-h-[85vh] overflow-y-auto overflow-x-hidden">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Supprimer définitivement le compte</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              Cette action est <strong>irréversible</strong>. Toutes vos données seront 
              définitivement supprimées :
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Profil et préférences</li>
              <li>Collection de jeux</li>
              <li>Liste de souhaits</li>
              <li>Statistiques et récompenses</li>
              <li>Historique des quiz</li>
            </ul>
            <p className="font-medium text-foreground">
              Pour confirmer, tapez exactement : <code className="bg-muted px-1 rounded text-sm">
                {CONFIRMATION_TEXT}
              </code>
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2">
          <Label htmlFor="confirmation-text">
            Confirmation
          </Label>
          <Input
            id="confirmation-text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={CONFIRMATION_TEXT}
            className="font-mono"
            disabled={isDeleting}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
