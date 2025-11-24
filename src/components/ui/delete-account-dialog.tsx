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
import { useTranslations } from 'next-intl';

interface DeleteAccountDialogProps {
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

const CONFIRMATION_TEXT = "SUPPRIMER MON COMPTE";

export function DeleteAccountDialog({ onConfirm, isLoading = false }: DeleteAccountDialogProps) {
  const t = useTranslations('deleteAccount');
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmationValid = confirmationText === CONFIRMATION_TEXT;

  const handleConfirm = async () => {
    if (!isConfirmationValid) {
      toast.error(t('typeConfirmationText'));
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      setIsOpen(false);
      setConfirmationText('');
      toast.success(t('accountDeleted'));
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.message || t('errorDeletingAccount'));
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
          {t('deleteAccount')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[500px] !w-[calc(100vw-2rem)] sm:!w-full max-h-[85vh] overflow-y-auto overflow-x-hidden">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>{t('deleteAccountTitle')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              {t('deleteAccountWarning')}
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>{t('profileAndPreferences')}</li>
              <li>{t('gameCollection')}</li>
              <li>{t('wishlist')}</li>
              <li>{t('statsAndAchievements')}</li>
              <li>{t('quizHistory')}</li>
            </ul>
            <p className="font-medium text-foreground">
              {t('confirmDeleteInstruction')} <code className="bg-muted px-1 rounded text-sm">
                {CONFIRMATION_TEXT}
              </code>
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-2">
          <Label htmlFor="confirmation-text">
            {t('confirmation')}
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
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? t('deleting') : t('deletePermanently')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
