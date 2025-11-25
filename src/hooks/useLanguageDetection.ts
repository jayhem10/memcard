import { useEffect, useState } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { useLocale } from 'next-intl';

export function useLanguageDetection() {
  const router = useRouter();
  const locale = useLocale();
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detectLanguage = async () => {
      try {
        // Vérifier si on a déjà une préférence sauvegardée
        const savedLanguage = localStorage.getItem('preferred-language');
        if (savedLanguage && ['fr', 'en'].includes(savedLanguage)) {
          if (savedLanguage !== locale) {
            router.replace(window.location.pathname, { locale: savedLanguage });
          }
          setIsDetecting(false);
          return;
        }

        // Détection basée sur le navigateur
        const browserLang = navigator.language.toLowerCase();

        // Liste des pays francophones et anglophones
        const frenchCountries = ['fr', 'be', 'ch', 'ca', 'lu', 'mc', 'sn', 'ci', 'cm', 'ma', 'tn', 'dz'];
        const englishCountries = ['us', 'gb', 'ca', 'au', 'nz', 'ie', 'uk'];

        // Priorité à la langue du navigateur (plus fiable que l'IP avec VPN)
        let detectedLanguage = 'en'; // Par défaut anglais pour les VPN

        // Détection par langue du navigateur (priorité haute)
        if (browserLang.startsWith('fr')) {
          detectedLanguage = 'fr';
        } else if (browserLang.startsWith('en')) {
          detectedLanguage = 'en';
        } else {
          // Essayer de détecter par pays si disponible (priorité basse)
          try {
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) {
              const data = await response.json();
              const country = data.country_code?.toLowerCase();

              if (country && frenchCountries.includes(country)) {
                detectedLanguage = 'fr';
              } else if (country && englishCountries.includes(country)) {
                detectedLanguage = 'en';
              }
            }
          } catch (error) {
            console.log('Impossible de détecter le pays:', error);
          }
        }

        // Sauvegarder la préférence détectée
        localStorage.setItem('preferred-language', detectedLanguage);

        // Changer de langue si nécessaire
        if (detectedLanguage !== locale) {
          router.replace(window.location.pathname, { locale: detectedLanguage });
        }

      } catch (error) {
        console.error('Erreur lors de la détection de langue:', error);
      } finally {
        setIsDetecting(false);
      }
    };

    // Ne détecter que si on n'a pas encore de préférence
    if (!localStorage.getItem('preferred-language')) {
      detectLanguage();
    } else {
      setIsDetecting(false);
    }
  }, [locale, router]);

  return { isDetecting };
}
