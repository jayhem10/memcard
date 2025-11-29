'use client';

import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Camera, X, QrCode, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';

interface QrCodeScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
}

export function QrCodeScanner({ onScan, onError }: QrCodeScannerProps) {
  const t = useTranslations('qrCodeScanner');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Vérifier les permissions de la caméra et l'environnement
  useEffect(() => {
    const checkEnvironment = () => {

      // Vérifier si l'API média est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(t('browserNotSupportCamera'));
        setHasPermission(false);
        return;
      }

      // Essayer de vérifier les permissions
    const checkPermissions = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setHasPermission(result.state === 'granted');

          // Écouter les changements de permission
          result.addEventListener('change', () => {
            setHasPermission(result.state === 'granted');
          });
      } catch (error) {
          // Fallback: essayer d'accéder directement à la caméra
        setHasPermission(null);
      }
    };

    checkPermissions();
    };

    checkEnvironment();
  }, []);

  const startScanning = async () => {
    if (!videoRef.current) return;

    setIsScanning(true);
    setIsProcessing(false);
    setError(null);

    // Vérifier les permissions et l'environnement
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isHttps) {
      setError(t('cameraRequiresHttps'));
      setIsScanning(false);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(t('browserNotSupportCamera'));
      setIsScanning(false);
      return;
    }

    codeReaderRef.current = new BrowserMultiFormatReader();

    try {
      // Demander explicitement l'accès à la caméra si nécessaire
      if (hasPermission === null) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Fermer immédiatement le stream de test
          stream.getTracks().forEach(track => track.stop());
          setHasPermission(true);
        } catch (permissionError: unknown) {
          if (permissionError instanceof Error && permissionError.name === 'NotAllowedError') {
            setHasPermission(false);
            setError(t('cameraAccessDeniedRetry'));
          } else {
            setError(t('errorAccessingCamera'));
          }
          setIsScanning(false);
          return;
        }
      }

      const result = await codeReaderRef.current.decodeOnceFromVideoDevice(
        undefined, // Utilise la caméra par défaut
        videoRef.current
      );

      // Protection contre les doubles traitements
      if (isProcessing) {
        return;
      }

      setIsProcessing(true);

      try {
        const scannedText = result.getText();
        let friendCode = scannedText;

        // Si c'est une URL complète, extraire le code
        if (scannedText.includes('/add-friend/')) {
          friendCode = scannedText.split('/add-friend/')[1];
        }

        // Si c'est au format FRIEND:CODE
        if (scannedText.startsWith('FRIEND:')) {
          friendCode = scannedText.replace('FRIEND:', '');
        }

        // Nettoyer et valider le code
        friendCode = friendCode.trim().toUpperCase();

        if (friendCode.length === 8) {
          onScan(friendCode);
          setIsScanning(false);
        } else {
          const errorMsg = t('invalidQrCode');
          setError(errorMsg);
          onError?.(errorMsg);
          setIsScanning(false);
        }
      } finally {
        setIsProcessing(false);
      }

    } catch (error) {
      console.error('Erreur de scan détaillée:', error);

      let errorMsg = t('errorScanningQrCode');
      let shouldShowError = true;

      if (error instanceof NotFoundException) {
        errorMsg = t('noQrCodeDetected');
      } else if (error instanceof Error) {
        if (error.message?.includes('Permission denied') || error.message?.includes('NotAllowedError')) {
          errorMsg = t('cameraAccessDeniedSettings');
          setHasPermission(false);
        } else if (error.message?.includes('NotFoundError')) {
          errorMsg = t('noCameraDetected');
        } else if (error.message?.includes('NotSupportedError')) {
          errorMsg = t('browserNotSupportCamera');
        } else if (error.message?.includes('AbortError') || (error as any).name === 'AbortError') {
          // L'utilisateur a annulé le scan ou quitté la page
          errorMsg = '';
          shouldShowError = false;
        } else if (error.message?.includes('The operation was aborted')) {
          // Scan interrompu (par exemple quand on clique sur "Arrêter")
          errorMsg = '';
          shouldShowError = false;
        }
      }

      if (shouldShowError) {
        setError(errorMsg);
        onError?.(errorMsg);
      }
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setIsScanning(false);
    setIsProcessing(false);
    setError(null);
  };

  const refreshPermissions = async () => {
    setError(null);
    try {
      // Essayer d'accéder à la caméra pour déclencher la demande de permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Fermer immédiatement le stream
      stream.getTracks().forEach(track => track.stop());

      // Revérifier les permissions
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setHasPermission(result.state === 'granted');
      } catch (error) {
        setHasPermission(null);
      }
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        setHasPermission(false);
        setError(t('cameraAccessDeniedRetry'));
      } else {
        setError(t('errorAccessingCamera'));
      }
    }
  };

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  // Réinitialiser l'erreur quand on change d'état de scan
  useEffect(() => {
    if (!isScanning) {
      // Petit délai pour éviter de masquer les erreurs importantes
      const timer = setTimeout(() => {
        if (!isScanning) {
          setError(null);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isScanning]);

  return (
    <div className="space-y-4">
      {/* Zone de scan */}
      <div className="relative">
        <video
          ref={videoRef}
          className={`w-full max-w-sm mx-auto rounded-lg border transition-all duration-300 ${
            isScanning ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ display: isScanning ? 'block' : 'none' }}
          muted
          playsInline
        />

        {!isScanning && (
          <div className="w-full max-w-sm mx-auto aspect-square bg-muted rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center p-4">
            <QrCode className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground font-medium mb-2">
              {hasPermission === false
                ? t('cameraNotAuthorized')
                : error?.includes('HTTPS')
                ? t('httpsRequired')
                : t('readyToScan')
              }
            </p>
            {hasPermission === false && (
              <p className="text-xs text-muted-foreground">
                {t('grantCameraAccessSettings')}
              </p>
            )}
            {error?.includes('HTTPS') && (
              <p className="text-xs text-muted-foreground">
                {t('cameraRequiresHttpsShort')}
              </p>
            )}
          </div>
        )}

        {/* Overlay de ciblage */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative w-full h-full">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative w-48 h-48">
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Boutons de contrôle */}
      <div className="flex flex-col gap-2">
      <div className="flex justify-center">
        {!isScanning ? (
          <Button
            onClick={startScanning}
              disabled={hasPermission === false || !!error || isProcessing}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {t('scanQrCode')}
          </Button>
        ) : (
          <Button
            onClick={stopScanning}
            variant="outline"
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            {isProcessing ? t('processing') : t('stop')}
          </Button>
          )}
        </div>

        {/* Bouton pour rafraîchir les permissions */}
        {hasPermission === false && !isScanning && (
          <div className="flex justify-center">
            <Button
              onClick={refreshPermissions}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {t('refreshPermissions')}
            </Button>
          </div>
        )}
      </div>

      {/* Messages d'erreur */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
