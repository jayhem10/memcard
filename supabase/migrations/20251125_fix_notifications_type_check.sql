-- ============================================
-- MIGRATION: Corriger la contrainte notifications_type_check
-- ============================================
-- Cette migration met à jour la contrainte qui limite les types de notifications
-- pour inclure le type 'friend'

-- 1. SUPPRIMER L'ANCIENNE CONTRAINTE
-- ============================================
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. AJOUTER LA NOUVELLE CONTRAINTE AVEC LE TYPE 'friend'
-- ============================================
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY['wishlist'::text, 'achievement'::text, 'friend'::text])
);

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

