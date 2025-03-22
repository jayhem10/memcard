-- Supprimer la contrainte existante sur igdb_id seulement
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_igdb_id_key;

-- Ajouter une nouvelle contrainte unique sur la paire (igdb_id, console_id)
ALTER TABLE games ADD CONSTRAINT games_igdb_console_unique UNIQUE (igdb_id, console_id);
