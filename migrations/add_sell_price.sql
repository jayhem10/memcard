-- Migration : ajout du prix de vente sur user_games
-- À exécuter dans l'éditeur SQL de votre projet Supabase

ALTER TABLE user_games
  ADD COLUMN IF NOT EXISTS sell_price numeric;
