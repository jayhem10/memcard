-- Migration: Ajouter le champ average_rating à la table games
-- Date: 2025-11-28
-- Description: Ajoute un champ pour stocker la note moyenne IGDB (0-100)

-- Ajouter la colonne average_rating
ALTER TABLE games
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(5,2) DEFAULT NULL;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN games.average_rating IS 'Note moyenne du jeu selon IGDB (échelle 0-100). NULL si pas de note disponible.';

-- Créer un index pour optimiser les requêtes de tri par note
CREATE INDEX IF NOT EXISTS idx_games_average_rating ON games(average_rating DESC NULLS LAST);

-- Ajouter une contrainte pour s'assurer que la note est entre 0 et 100
ALTER TABLE games
ADD CONSTRAINT check_average_rating_range CHECK (average_rating IS NULL OR (average_rating >= 0 AND average_rating <= 100));

