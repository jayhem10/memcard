-- Ajouter le champ buy (booléen) à user_games
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_games' AND column_name = 'buy'
  ) THEN
    ALTER TABLE public.user_games
      ADD COLUMN buy BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

COMMENT ON COLUMN public.user_games.buy IS 'Indique si le jeu a été acheté (pour les jeux en wishlist)';

-- Créer la table wishlist_shares pour stocker les tokens de partage
CREATE TABLE IF NOT EXISTS public.wishlist_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Index sur token pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_token ON public.wishlist_shares(token);
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_user_id ON public.wishlist_shares(user_id);

-- Activer RLS sur wishlist_shares
ALTER TABLE public.wishlist_shares ENABLE ROW LEVEL SECURITY;

-- Donner les permissions nécessaires sur la table
GRANT SELECT, INSERT, UPDATE ON public.wishlist_shares TO authenticated;
GRANT SELECT ON public.wishlist_shares TO anon;

-- Policies pour wishlist_shares (supprimer d'abord si elles existent)
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres shares" ON public.wishlist_shares;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres shares" 
ON public.wishlist_shares FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres shares" ON public.wishlist_shares;
CREATE POLICY "Les utilisateurs peuvent créer leurs propres shares" 
ON public.wishlist_shares FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres shares" ON public.wishlist_shares;
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres shares" 
ON public.wishlist_shares FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy pour permettre la lecture publique par token (pour la page publique)
-- On vérifie que le token existe et est actif
DROP POLICY IF EXISTS "Lecture publique des shares actifs par token" ON public.wishlist_shares;
CREATE POLICY "Lecture publique des shares actifs par token" 
ON public.wishlist_shares FOR SELECT 
USING (
  is_active = TRUE AND 
  (expires_at IS NULL OR expires_at > NOW())
);

-- Créer la table wishlist_notifications
CREATE TABLE IF NOT EXISTS public.wishlist_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_game_id UUID REFERENCES public.user_games(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_at TIMESTAMP WITH TIME ZONE,
  is_validated BOOLEAN DEFAULT FALSE
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_wishlist_notifications_user_id ON public.wishlist_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_notifications_user_game_id ON public.wishlist_notifications(user_game_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_notifications_validated ON public.wishlist_notifications(user_id, is_validated) WHERE is_validated = FALSE;

-- Activer RLS sur wishlist_notifications
ALTER TABLE public.wishlist_notifications ENABLE ROW LEVEL SECURITY;

-- Donner les permissions nécessaires sur la table
GRANT SELECT, INSERT, UPDATE ON public.wishlist_notifications TO authenticated;

-- Policies pour wishlist_notifications (supprimer d'abord si elles existent)
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres notifications" ON public.wishlist_notifications;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres notifications" 
ON public.wishlist_notifications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres notifications" ON public.wishlist_notifications;
CREATE POLICY "Les utilisateurs peuvent créer leurs propres notifications" 
ON public.wishlist_notifications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres notifications" ON public.wishlist_notifications;
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres notifications" 
ON public.wishlist_notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Fonction pour créer automatiquement des notifications à la connexion
-- Cette fonction sera appelée par l'API lors de la connexion
CREATE OR REPLACE FUNCTION public.create_wishlist_notifications(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  notification_count INTEGER;
BEGIN
  -- Insérer des notifications pour les jeux avec buy=true et status='WISHLIST' ou 'wishlist'
  -- qui n'ont pas déjà de notification non validée
  INSERT INTO public.wishlist_notifications (user_id, user_game_id)
  SELECT 
    p_user_id,
    ug.id
  FROM public.user_games ug
  WHERE ug.user_id = p_user_id
    AND ug.buy = TRUE
    AND (ug.status = 'WISHLIST' OR ug.status = 'wishlist')
    AND NOT EXISTS (
      SELECT 1 
      FROM public.wishlist_notifications wn
      WHERE wn.user_game_id = ug.id 
        AND wn.is_validated = FALSE
    )
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS notification_count = ROW_COUNT;
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les jeux wishlist via un token de partage (contourne RLS)
CREATE OR REPLACE FUNCTION public.get_wishlist_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  buy BOOLEAN,
  game_id UUID,
  game_title TEXT,
  game_cover_url TEXT,
  game_console_id UUID,
  console_name TEXT
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Vérifier que le token existe et est actif
  SELECT user_id INTO v_user_id
  FROM public.wishlist_shares
  WHERE token = p_token
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Retourner les jeux wishlist de l'utilisateur, triés par ordre alphabétique
  RETURN QUERY
  SELECT 
    ug.id AS id,
    COALESCE(ug.buy, FALSE) AS buy,
    g.id AS game_id,
    g.title AS game_title,
    g.cover_url AS game_cover_url,
    g.console_id AS game_console_id,
    c.name AS console_name
  FROM public.user_games ug
  INNER JOIN public.games g ON ug.game_id = g.id
  LEFT JOIN public.consoles c ON g.console_id = c.id
  WHERE ug.user_id = v_user_id
    AND (ug.status = 'WISHLIST' OR ug.status = 'wishlist')
  ORDER BY g.title ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour valider une notification
-- Met buy à FALSE, status à 'NOT_STARTED' et marque la notification comme validée
CREATE OR REPLACE FUNCTION public.validate_wishlist_notification(p_notification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_game_id UUID;
  v_current_status TEXT;
BEGIN
  -- Récupérer le user_game_id et le statut actuel
  SELECT wn.user_game_id, ug.status INTO v_user_game_id, v_current_status
  FROM public.wishlist_notifications wn
  INNER JOIN public.user_games ug ON wn.user_game_id = ug.id
  WHERE wn.id = p_notification_id
    AND wn.user_id = auth.uid()
    AND wn.is_validated = FALSE;
  
  IF v_user_game_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier que le jeu est bien en wishlist
  IF v_current_status != 'WISHLIST' AND v_current_status != 'wishlist' THEN
    RETURN FALSE;
  END IF;
  
  -- Mettre à jour le jeu : passer de WISHLIST à NOT_STARTED
  -- Ne pas modifier condition, il reste optionnel
  UPDATE public.user_games
  SET 
    buy = FALSE,
    status = 'NOT_STARTED',
    updated_at = NOW()
  WHERE id = v_user_game_id;
  
  -- Vérifier si la mise à jour a réussi
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Marquer la notification comme validée
  UPDATE public.wishlist_notifications
  SET 
    is_validated = TRUE,
    validated_at = NOW()
  WHERE id = p_notification_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le champ buy via un token de partage (contourne RLS)
-- Cette fonction vérifie que le token est valide et que le jeu appartient à l'utilisateur du token
CREATE OR REPLACE FUNCTION public.update_wishlist_buy_status(
  p_token TEXT,
  p_user_game_id UUID,
  p_buy BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_game_user_id UUID;
  v_status TEXT;
BEGIN
  -- Vérifier que le token existe et est actif
  SELECT user_id INTO v_user_id
  FROM public.wishlist_shares
  WHERE token = p_token
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Token invalide ou expiré';
  END IF;
  
  -- Vérifier que le jeu appartient à l'utilisateur du token et est en wishlist
  SELECT user_id, status INTO v_game_user_id, v_status
  FROM public.user_games
  WHERE id = p_user_game_id;
  
  IF v_game_user_id IS NULL THEN
    RAISE EXCEPTION 'Jeu non trouvé';
  END IF;
  
  IF v_game_user_id != v_user_id THEN
    RAISE EXCEPTION 'Ce jeu n''appartient pas à cette wishlist';
  END IF;
  
  IF v_status != 'WISHLIST' AND v_status != 'wishlist' THEN
    RAISE EXCEPTION 'Ce jeu n''est pas en wishlist';
  END IF;
  
  -- Mettre à jour uniquement le champ buy
  UPDATE public.user_games
  SET buy = p_buy, updated_at = NOW()
  WHERE id = p_user_game_id;
  
  -- Si buy est TRUE, créer une notification (si elle n'existe pas déjà)
  IF p_buy = TRUE THEN
    INSERT INTO public.wishlist_notifications (user_id, user_game_id)
    VALUES (v_user_id, p_user_game_id)
    ON CONFLICT DO NOTHING;
  ELSE
    -- Si buy est FALSE, supprimer les notifications non validées pour ce jeu
    DELETE FROM public.wishlist_notifications
    WHERE user_game_id = p_user_game_id
      AND is_validated = FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions d'exécution sur les fonctions
GRANT EXECUTE ON FUNCTION public.get_wishlist_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_wishlist_notifications(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_wishlist_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_wishlist_buy_status(TEXT, UUID, BOOLEAN) TO anon, authenticated;
