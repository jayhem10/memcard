-- Script pour corriger les plateformes sans igdb_platform_id
-- À exécuter dans l'interface SQL de Supabase

-- Mettre à jour les plateformes courantes avec leurs IDs IGDB corrects
-- Vous pouvez modifier les noms selon vos plateformes existantes

UPDATE consoles 
SET igdb_platform_id = 167, abbreviation = 'PS5'
WHERE name ILIKE '%playstation 5%' OR name ILIKE '%ps5%';

UPDATE consoles 
SET igdb_platform_id = 48, abbreviation = 'PS4'
WHERE name ILIKE '%playstation 4%' OR name ILIKE '%ps4%';

UPDATE consoles 
SET igdb_platform_id = 9, abbreviation = 'PS3'
WHERE name ILIKE '%playstation 3%' OR name ILIKE '%ps3%';

UPDATE consoles 
SET igdb_platform_id = 8, abbreviation = 'PS2'
WHERE name ILIKE '%playstation 2%' OR name ILIKE '%ps2%';

UPDATE consoles 
SET igdb_platform_id = 7, abbreviation = 'PS1'
WHERE name ILIKE '%playstation%' OR name ILIKE '%ps1%' OR name ILIKE '%psx%';

UPDATE consoles 
SET igdb_platform_id = 130, abbreviation = 'NS'
WHERE name ILIKE '%nintendo switch%' OR name ILIKE '%switch%';

UPDATE consoles 
SET igdb_platform_id = 49, abbreviation = 'WiiU'
WHERE name ILIKE '%wii u%' OR name ILIKE '%wiiu%';

UPDATE consoles 
SET igdb_platform_id = 5, abbreviation = 'Wii'
WHERE name ILIKE '%wii%' AND name NOT ILIKE '%wii u%';

UPDATE consoles 
SET igdb_platform_id = 4, abbreviation = 'GC'
WHERE name ILIKE '%gamecube%' OR name ILIKE '%gc%';

UPDATE consoles 
SET igdb_platform_id = 21, abbreviation = 'N64'
WHERE name ILIKE '%nintendo 64%' OR name ILIKE '%n64%';

UPDATE consoles 
SET igdb_platform_id = 18, abbreviation = 'SNES'
WHERE name ILIKE '%super nintendo%' OR name ILIKE '%snes%';

UPDATE consoles 
SET igdb_platform_id = 4, abbreviation = 'NES'
WHERE name ILIKE '%nintendo entertainment%' OR name ILIKE '%nes%';

UPDATE consoles 
SET igdb_platform_id = 169, abbreviation = 'XSX'
WHERE name ILIKE '%xbox series x%' OR name ILIKE '%xsx%';

UPDATE consoles 
SET igdb_platform_id = 170, abbreviation = 'XSS'
WHERE name ILIKE '%xbox series s%' OR name ILIKE '%xss%';

UPDATE consoles 
SET igdb_platform_id = 49, abbreviation = 'XONE'
WHERE name ILIKE '%xbox one%' OR name ILIKE '%xone%';

UPDATE consoles 
SET igdb_platform_id = 12, abbreviation = 'X360'
WHERE name ILIKE '%xbox 360%' OR name ILIKE '%x360%';

UPDATE consoles 
SET igdb_platform_id = 11, abbreviation = 'XBOX'
WHERE name ILIKE '%xbox%' AND name NOT ILIKE '%360%' AND name NOT ILIKE '%one%' AND name NOT ILIKE '%series%';

UPDATE consoles 
SET igdb_platform_id = 6, abbreviation = 'PC'
WHERE name ILIKE '%pc%' OR name ILIKE '%windows%' OR name ILIKE '%steam%';

UPDATE consoles 
SET igdb_platform_id = 3, abbreviation = 'LINUX'
WHERE name ILIKE '%linux%';

UPDATE consoles 
SET igdb_platform_id = 14, abbreviation = 'MAC'
WHERE name ILIKE '%mac%' OR name ILIKE '%macos%';

-- Pour les plateformes restantes sans correspondance, assigner un ID générique
-- Vous pouvez ajuster selon vos besoins
UPDATE consoles 
SET igdb_platform_id = 999, abbreviation = 'OTHER'
WHERE igdb_platform_id IS NULL;

-- Vérifier le résultat
SELECT 
  name,
  igdb_platform_id,
  abbreviation,
  CASE 
    WHEN igdb_platform_id IS NULL THEN 'STILL NULL'
    WHEN igdb_platform_id = 0 THEN 'STILL ZERO'
    ELSE 'FIXED'
  END as status
FROM consoles 
ORDER BY name;
