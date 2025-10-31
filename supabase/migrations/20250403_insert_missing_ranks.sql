-- Insérer tous les ranks définis dans le système de gamification
-- Utilise ON CONFLICT pour éviter les doublons si certains ranks existent déjà
-- Les ranks seront insérés seulement s'ils n'existent pas déjà (basé sur name_en)

-- Note: Si vous voulez forcer l'insertion même si les ranks existent,
-- remplacez les ON CONFLICT par des DELETE puis INSERT

INSERT INTO public.ranks (name_en, name_fr, description_en, description_fr, level, icon_url)
VALUES 
  ('Warrior', 'Guerrier', 'Strong and courageous, you face challenges head-on', 'Fort et courageux, vous affrontez les défis de front', 1, '/images/ranks/warrior.png'),
  ('Mage', 'Mage', 'Wise and knowledgeable, you seek to understand the world', 'Sage et érudit, vous cherchez à comprendre le monde', 1, '/images/ranks/mage.png'),
  ('Rogue', 'Voleur', 'Cunning and resourceful, you find creative solutions', 'Rusé et ingénieux, vous trouvez des solutions créatives', 1, '/images/ranks/rogue.png'),
  ('Paladin', 'Paladin', 'Righteous and dedicated, you uphold your principles', 'Juste et dévoué, vous défendez vos principes', 2, '/images/ranks/paladin.png'),
  ('Wizard', 'Sorcier', 'Powerful and studious, you master complex systems', 'Puissant et studieux, vous maîtrisez des systèmes complexes', 2, '/images/ranks/wizard.png'),
  ('Assassin', 'Assassin', 'Precise and efficient, you excel at focused tasks', 'Précis et efficace, vous excellez dans les tâches ciblées', 2, '/images/ranks/assassin.png')
ON CONFLICT (name_en) DO NOTHING;

-- Alternative: Si la contrainte UNIQUE n'existe pas sur name_en, 
-- on peut vérifier manuellement avant d'insérer
-- Cette version utilise une approche différente pour éviter les doublons

DO $$
BEGIN
  -- Insérer Warrior s'il n'existe pas
  IF NOT EXISTS (SELECT 1 FROM public.ranks WHERE LOWER(name_en) = 'warrior') THEN
    INSERT INTO public.ranks (name_en, name_fr, description_en, description_fr, level, icon_url)
    VALUES ('Warrior', 'Guerrier', 'Strong and courageous, you face challenges head-on', 'Fort et courageux, vous affrontez les défis de front', 1, '/images/ranks/warrior.png');
  END IF;

  -- Insérer Mage s'il n'existe pas
  IF NOT EXISTS (SELECT 1 FROM public.ranks WHERE LOWER(name_en) = 'mage') THEN
    INSERT INTO public.ranks (name_en, name_fr, description_en, description_fr, level, icon_url)
    VALUES ('Mage', 'Mage', 'Wise and knowledgeable, you seek to understand the world', 'Sage et érudit, vous cherchez à comprendre le monde', 1, '/images/ranks/mage.png');
  END IF;

  -- Insérer Rogue s'il n'existe pas
  IF NOT EXISTS (SELECT 1 FROM public.ranks WHERE LOWER(name_en) = 'rogue') THEN
    INSERT INTO public.ranks (name_en, name_fr, description_en, description_fr, level, icon_url)
    VALUES ('Rogue', 'Voleur', 'Cunning and resourceful, you find creative solutions', 'Rusé et ingénieux, vous trouvez des solutions créatives', 1, '/images/ranks/rogue.png');
  END IF;

  -- Insérer Paladin s'il n'existe pas
  IF NOT EXISTS (SELECT 1 FROM public.ranks WHERE LOWER(name_en) = 'paladin') THEN
    INSERT INTO public.ranks (name_en, name_fr, description_en, description_fr, level, icon_url)
    VALUES ('Paladin', 'Paladin', 'Righteous and dedicated, you uphold your principles', 'Juste et dévoué, vous défendez vos principes', 2, '/images/ranks/paladin.png');
  END IF;

  -- Insérer Wizard s'il n'existe pas
  IF NOT EXISTS (SELECT 1 FROM public.ranks WHERE LOWER(name_en) = 'wizard') THEN
    INSERT INTO public.ranks (name_en, name_fr, description_en, description_fr, level, icon_url)
    VALUES ('Wizard', 'Sorcier', 'Powerful and studious, you master complex systems', 'Puissant et studieux, vous maîtrisez des systèmes complexes', 2, '/images/ranks/wizard.png');
  END IF;

  -- Insérer Assassin s'il n'existe pas
  IF NOT EXISTS (SELECT 1 FROM public.ranks WHERE LOWER(name_en) = 'assassin') THEN
    INSERT INTO public.ranks (name_en, name_fr, description_en, description_fr, level, icon_url)
    VALUES ('Assassin', 'Assassin', 'Precise and efficient, you excel at focused tasks', 'Précis et efficace, vous excellez dans les tâches ciblées', 2, '/images/ranks/assassin.png');
  END IF;
END $$;

-- Vérifier les ranks créés
SELECT id, name_en, name_fr, level, created_at 
FROM public.ranks 
ORDER BY level, name_en;


