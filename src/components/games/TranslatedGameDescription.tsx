'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { translateText } from '@/lib/game-utils';

interface TranslatedGameDescriptionProps {
  description_en: string | null;
  description_fr: string | null;
  className?: string;
}

/**
 * Composant qui affiche la description d'un jeu
 * Priorité: description_fr (stockée) > description_en (stockée) > traduction à la volée
 */
export function TranslatedGameDescription({
  description_en,
  description_fr,
  className = ''
}: TranslatedGameDescriptionProps) {
  const locale = useLocale();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Logique de priorité d'affichage
  let displayText = '';

  if (locale === 'fr') {
    // En français: privilégier description_fr stockée, sinon traduction à la volée, sinon anglais
    displayText = description_fr || translatedText || description_en || '';
  } else {
    // En anglais: privilégier description_en stockée, sinon français, sinon rien
    displayText = description_en || description_fr || '';
  }

  useEffect(() => {
    // Ne traduire que si :
    // 1. On est en français
    // 2. On n'a pas de description_fr stockée
    // 3. On a une description_en
    // 4. On n'a pas déjà traduit
    // 5. On n'est pas déjà en train de traduire
    if (locale === 'fr' && !description_fr && description_en && !translatedText && !isTranslating) {
      setIsTranslating(true);

      translateText(description_en, 'en', 'fr')
        .then(translated => {
          setTranslatedText(translated);
          setIsTranslating(false);
        })
        .catch(error => {
          console.warn('Échec de la traduction de la description:', error);
          setTranslatedText(null); // Garder null pour utiliser description_en comme fallback
          setIsTranslating(false);
        });
    }
  }, [locale, description_en, description_fr, translatedText, isTranslating]);

  if (!displayText) {
    return null;
  }

  return (
    <p className={className}>
      {displayText}
      {isTranslating && (
        <span className="ml-2 text-xs text-muted-foreground">
          (traduction en cours...)
        </span>
      )}
    </p>
  );
}
