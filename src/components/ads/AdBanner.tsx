'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

interface AdBannerProps {
  className?: string;
  slotId?: string;
  clientId?: string;
}

/**
 * Bannière Google AdSense responsive.
 * Affiche uniquement si les variables d'environnement sont présentes.
 */
export function AdBanner({ className, slotId, clientId }: AdBannerProps) {
  const adClient = clientId || process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  const adSlot = slotId || process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;

  // Ne rien afficher si la configuration manque
  if (!adClient || !adSlot) {
    return null;
  }

  useEffect(() => {
    try {
      const ads = (window as any).adsbygoogle || [];
      ads.push({});
      (window as any).adsbygoogle = ads;
    } catch (err) {
      console.warn('[AdBanner] adsbygoogle push error', err);
    }
  }, [adClient, adSlot]);

  return (
    <div className={cn('w-full', className)}>
      <Script
        id="adsense-script"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

