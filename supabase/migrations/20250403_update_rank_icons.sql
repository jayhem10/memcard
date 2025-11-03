-- Script pour mettre à jour les icônes des ranks avec de vraies images
-- Utilise des URLs d'icônes publiques et gratuites

-- Warrior / Guerrier - Épée et bouclier
UPDATE public.ranks 
SET icon_url = 'https://img.icons8.com/color/256/sword.png'
WHERE LOWER(name_en) = 'warrior';

-- Mage / Mage - Bâton magique
UPDATE public.ranks 
SET icon_url = 'https://img.icons8.com/color/256/magic-staff.png'
WHERE LOWER(name_en) = 'mage';

-- Rogue / Voleur - Dague
UPDATE public.ranks 
SET icon_url = 'https://img.icons8.com/color/256/dagger.png'
WHERE LOWER(name_en) = 'rogue';

-- Paladin / Paladin - Bouclier avec croix
UPDATE public.ranks 
SET icon_url = 'https://img.icons8.com/color/256/shield.png'
WHERE LOWER(name_en) = 'paladin';

-- Wizard / Sorcier - Chapeau de sorcier
UPDATE public.ranks 
SET icon_url = 'https://img.icons8.com/color/256/wizard-hat.png'
WHERE LOWER(name_en) = 'wizard';

-- Assassin / Assassin - Masque
UPDATE public.ranks 
SET icon_url = 'https://img.icons8.com/color/256/mask.png'
WHERE LOWER(name_en) = 'assassin';

-- Alternative: Utiliser des emojis ou des icônes SVG simples si les URLs ne fonctionnent pas
-- Décommentez cette section si vous préférez utiliser des emojis/symboles Unicode

/*
-- Warrior - ⚔️ Épée
UPDATE public.ranks 
SET icon_url = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.92 19L5 17.08 13.06 9 15 10.94 6.92 19zM14.06 8L13 6.94 15.94 4 17 5.06 14.06 8zM3 4v2h2l3.6 7.59-1.35 2.45c-.15.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.13 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45l2-4H8.5l-1.93-4H3zm13 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>'
WHERE LOWER(name_en) = 'warrior';

-- Mage - 🔮 Cristal magique
UPDATE public.ranks 
SET icon_url = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l8 3.7v7.24l-8 4-8-4V7.88l8-3.7z"/></svg>'
WHERE LOWER(name_en) = 'mage';
*/

-- Vérifier les icônes mises à jour
SELECT id, name_en, name_fr, icon_url 
FROM public.ranks 
ORDER BY level, name_en;

-- Si vous voulez utiliser des icônes locales au lieu d'URLs externes,
-- téléchargez les icônes et placez-les dans public/images/ranks/
-- puis mettez à jour avec:
/*
UPDATE public.ranks 
SET icon_url = '/images/ranks/warrior.png'
WHERE LOWER(name_en) = 'warrior';
-- Répétez pour chaque rank avec le chemin local approprié
*/


