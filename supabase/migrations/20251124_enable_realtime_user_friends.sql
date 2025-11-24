-- ============================================
-- MIGRATION: Activer Realtime pour user_friends
-- ============================================
-- Cette migration active la publication Realtime pour la table user_friends
-- afin que les mises à jour d'amis soient instantanées

-- Vérifier si la publication supabase_realtime existe et ajouter la table
DO $$
BEGIN
  -- Vérifier si la table est déjà dans la publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'user_friends'
  ) THEN
    -- Ajouter la table à la publication Realtime
    ALTER PUBLICATION supabase_realtime ADD TABLE user_friends;
    RAISE NOTICE 'Table user_friends ajoutée à la publication Realtime';
  ELSE
    RAISE NOTICE 'Table user_friends déjà dans la publication Realtime';
  END IF;
END $$;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
