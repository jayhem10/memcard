'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, ExternalLink, Server, Zap, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const t = useTranslations('supportModal');
  
  const handleSupport = () => {
    window.open('https://ko-fi.com/jayhem10', '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[calc(100vw-2rem)] sm:!w-full !max-w-[500px] !max-h-[85vh] !overflow-y-auto !overflow-x-hidden !left-[50%] !translate-x-[-50%] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 overflow-x-hidden flex-1 overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">{t('whySupport')}</h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-sm mb-1">{t('infrastructureTitle')}</h5>
                    <p className="text-sm text-muted-foreground">
                      {t('infrastructureDescription')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-sm mb-1">{t('developmentTitle')}</h5>
                    <p className="text-sm text-muted-foreground">
                      {t('developmentDescription')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-sm mb-1">{t('freeForAllTitle')}</h5>
                    <p className="text-sm text-muted-foreground">
                      {t('freeForAllDescription')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{t('noteLabel')}</strong> {t('noteDescription')}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-2 pt-4 border-t px-4 sm:px-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            <X className="mr-2 h-4 w-4" />
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSupport}
            className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
          >
            <Heart className="mr-2 h-4 w-4" />
            {t('goToKofi')}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

