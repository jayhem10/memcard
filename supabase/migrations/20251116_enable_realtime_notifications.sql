-- Activer Realtime pour la table notifications
-- ============================================
-- Cette migration active la publication Realtime pour la table notifications
-- afin que les clients puissent s'abonner aux changements en temps réel

-- Vérifier si la publication supabase_realtime existe
DO $$
BEGIN
  -- Activer Realtime pour la table notifications
  -- Si la table n'est pas déjà dans la publication, l'ajouter
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    -- Ajouter la table à la publication Realtime
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE 'Table notifications ajoutée à la publication Realtime';
  ELSE
    RAISE NOTICE 'Table notifications déjà dans la publication Realtime';
  END IF;
END $$;

-- Vérifier que Realtime est bien activé
SELECT 
  tablename,
  pubname
FROM pg_publication_tables
WHERE tablename = 'notifications'
AND pubname = 'supabase_realtime';

