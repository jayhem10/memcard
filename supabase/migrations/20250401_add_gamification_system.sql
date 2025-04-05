-- Create ranks table with localization support
CREATE TABLE public.ranks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description_en TEXT,
  description_fr TEXT,
  level INTEGER NOT NULL,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add rank field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN rank_id UUID REFERENCES public.ranks(id) NULL,
ADD COLUMN quiz_completed BOOLEAN DEFAULT FALSE;

-- Create achievements table with localization support
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  category TEXT NOT NULL, -- 'platform', 'genre', 'total_games', etc.
  requirement_type TEXT NOT NULL, -- 'count', 'specific_platform', 'specific_genre', etc.
  requirement_value JSONB NOT NULL, -- {'count': 10, 'platform_id': 'xxx'} or {'count': 5, 'genre': 'RPG'}
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements junction table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create quiz questions table with localization support
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_en TEXT NOT NULL,
  question_fr TEXT NOT NULL,
  options JSONB NOT NULL, -- [{"id": "a", "text_en": "Option A", "text_fr": "Option A", "points": {"warrior": 2, "mage": 0, "rogue": 1}}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_quiz_answers table to store user responses
CREATE TABLE public.user_quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option TEXT NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_answers ENABLE ROW LEVEL SECURITY;

-- Autoriser les fonctions de service à contourner RLS
ALTER TABLE public.user_quiz_answers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Accorder les privilèges nécessaires au rôle d'authentification
GRANT SELECT, INSERT, UPDATE ON public.user_quiz_answers TO authenticated;
GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT SELECT ON public.quiz_questions TO authenticated;
GRANT SELECT ON public.ranks TO authenticated;
GRANT SELECT ON public.achievements TO authenticated;

-- Autoriser les opérations pour les utilisateurs authentifiés
CREATE POLICY "Users can insert their own quiz answers" 
ON public.user_quiz_answers FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz answers" 
ON public.user_quiz_answers FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quiz answers" 
ON public.user_quiz_answers FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Create policies for quiz_questions table
CREATE POLICY "Quiz questions are viewable by everyone" 
ON public.quiz_questions FOR SELECT 
TO authenticated
USING (true);

-- Create policies for ranks table
CREATE POLICY "Ranks can be read by authenticated users"
ON public.ranks FOR SELECT
USING (auth.role() = 'authenticated');

-- Create policies for achievements table
CREATE POLICY "Achievements can be read by authenticated users"
ON public.achievements FOR SELECT
USING (auth.role() = 'authenticated');

-- Create policies for user_achievements table
CREATE POLICY "User achievements can be read by authenticated users"
ON public.user_achievements FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policies for quiz_questions table
CREATE POLICY "Quiz questions can be read by authenticated users"
ON public.quiz_questions FOR SELECT
USING (auth.role() = 'authenticated');

-- Create policies for user_quiz_answers table
CREATE POLICY "User quiz answers can be read by the owner"
ON public.user_quiz_answers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz answers"
ON public.user_quiz_answers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to calculate user rank based on quiz answers
CREATE OR REPLACE FUNCTION public.calculate_user_rank(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  rank_points JSONB := '{}'::jsonb;
  max_rank TEXT;
  max_points INTEGER := 0;
  v_rank_id UUID; -- Renommé pour éviter l'ambiguïté
  option_data JSONB;
  points_data JSONB;
  rank_type TEXT;
  point_value INTEGER;
BEGIN
  -- Process each answer and accumulate points for each rank type
  FOR option_data IN
    SELECT jsonb_array_element(qq.options, ua.selected_option::int) as option_obj
    FROM public.user_quiz_answers ua
    JOIN public.quiz_questions qq ON ua.question_id = qq.id
    WHERE ua.user_id = p_user_id
  LOOP
    -- Get the points object from the selected option
    points_data := option_data->'points';
    
    -- Add points for each rank type
    FOR rank_type, point_value IN
      SELECT key, (value::text)::int FROM jsonb_each_text(points_data)
    LOOP
      -- Update the accumulated points
      IF rank_points ? rank_type THEN
        rank_points := jsonb_set(
          rank_points,
          ARRAY[rank_type],
          to_jsonb((rank_points->>rank_type)::int + point_value)
        );
      ELSE
        rank_points := jsonb_set(
          rank_points,
          ARRAY[rank_type],
          to_jsonb(point_value)
        );
      END IF;
    END LOOP;
  END LOOP;
  
  -- Find the rank with the highest points
  FOR rank_type, point_value IN
    SELECT key, (value::text)::int FROM jsonb_each_text(rank_points)
  LOOP
    IF point_value > max_points THEN
      max_points := point_value;
      max_rank := rank_type;
    END IF;
  END LOOP;

  -- Get the rank ID
  SELECT id INTO v_rank_id
  FROM public.ranks
  WHERE LOWER(name_en) = LOWER(max_rank);
  
  -- Si aucun rang correspondant n'est trouvé, utiliser le premier rang par défaut
  IF v_rank_id IS NULL THEN
    SELECT id INTO v_rank_id
    FROM public.ranks
    ORDER BY level, name_en
    LIMIT 1;
  END IF;

  -- Update user's profile with the calculated rank
  UPDATE public.profiles
  SET rank_id = v_rank_id,
      quiz_completed = TRUE,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN v_rank_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id UUID)
RETURNS SETOF UUID AS $$
DECLARE
  achievement_record RECORD;
  requirement JSONB;
  is_achieved BOOLEAN;
  game_count INTEGER;
  platform_count INTEGER;
  genre_count INTEGER;
BEGIN
  -- Get all achievements that the user hasn't unlocked yet
  FOR achievement_record IN
    SELECT a.* 
    FROM public.achievements a
    LEFT JOIN public.user_achievements ua 
      ON a.id = ua.achievement_id AND ua.user_id = p_user_id
    WHERE ua.id IS NULL
  LOOP
    requirement := achievement_record.requirement_value;
    is_achieved := FALSE;
    
    -- Check achievement based on category
    CASE achievement_record.category
      WHEN 'total_games' THEN
        SELECT COUNT(*) INTO game_count 
        FROM public.user_games 
        WHERE user_id = p_user_id;
        
        IF game_count >= (requirement->>'count')::int THEN
          is_achieved := TRUE;
        END IF;
        
      WHEN 'platform' THEN
        SELECT COUNT(*) INTO platform_count 
        FROM public.user_games ug
        JOIN public.games g ON ug.game_id = g.id
        WHERE ug.user_id = p_user_id 
          AND g.platform_id = (requirement->>'platform_id')::uuid;
          
        IF platform_count >= (requirement->>'count')::int THEN
          is_achieved := TRUE;
        END IF;
        
      WHEN 'genre' THEN
        SELECT COUNT(*) INTO genre_count 
        FROM public.user_games ug
        JOIN public.games g ON ug.game_id = g.id
        WHERE ug.user_id = p_user_id 
          AND g.genre = requirement->>'genre';
          
        IF genre_count >= (requirement->>'count')::int THEN
          is_achieved := TRUE;
        END IF;
    END CASE;
    
    -- If achievement is unlocked, add it to user_achievements
    IF is_achieved THEN
      INSERT INTO public.user_achievements (user_id, achievement_id)
      VALUES (p_user_id, achievement_record.id)
      RETURNING achievement_id;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial ranks
INSERT INTO public.ranks (name_en, name_fr, description_en, description_fr, level, icon_url)
VALUES 
  ('Warrior', 'Guerrier', 'Strong and courageous, you face challenges head-on', 'Fort et courageux, vous affrontez les défis de front', 1, '/images/ranks/warrior.png'),
  ('Mage', 'Mage', 'Wise and knowledgeable, you seek to understand the world', 'Sage et érudit, vous cherchez à comprendre le monde', 1, '/images/ranks/mage.png'),
  ('Rogue', 'Voleur', 'Cunning and resourceful, you find creative solutions', 'Rusé et ingénieux, vous trouvez des solutions créatives', 1, '/images/ranks/rogue.png'),
  ('Paladin', 'Paladin', 'Righteous and dedicated, you uphold your principles', 'Juste et dévoué, vous défendez vos principes', 2, '/images/ranks/paladin.png'),
  ('Wizard', 'Sorcier', 'Powerful and studious, you master complex systems', 'Puissant et studieux, vous maîtrisez des systèmes complexes', 2, '/images/ranks/wizard.png'),
  ('Assassin', 'Assassin', 'Precise and efficient, you excel at focused tasks', 'Précis et efficace, vous excellez dans les tâches ciblées', 2, '/images/ranks/assassin.png');

-- Insert sample achievements
INSERT INTO public.achievements (name_en, name_fr, description_en, description_fr, category, requirement_type, requirement_value, icon_url)
VALUES 
  ('Game Collector', 'Collectionneur de Jeux', 'Collect 10 games', 'Collectionnez 10 jeux', 'total_games', 'count', '{"count": 10}', '/images/achievements/collector.png'),
  ('Game Hoarder', 'Accumulateur de Jeux', 'Collect 50 games', 'Collectionnez 50 jeux', 'total_games', 'count', '{"count": 50}', '/images/achievements/hoarder.png'),
  ('Nintendo Fan', 'Fan de Nintendo', 'Collect 5 Nintendo games', 'Collectionnez 5 jeux Nintendo', 'platform', 'specific_platform', '{"count": 5, "platform_name": "Nintendo Switch"}', '/images/achievements/nintendo.png'),
  ('PlayStation Enthusiast', 'Passionné de PlayStation', 'Collect 5 PlayStation games', 'Collectionnez 5 jeux PlayStation', 'platform', 'specific_platform', '{"count": 5, "platform_name": "PlayStation 5"}', '/images/achievements/playstation.png'),
  ('RPG Master', 'Maître des RPG', 'Collect 5 RPG games', 'Collectionnez 5 jeux RPG', 'genre', 'specific_genre', '{"count": 5, "genre": "RPG"}', '/images/achievements/rpg.png'),
  ('Action Hero', 'Héros d''Action', 'Collect 5 Action games', 'Collectionnez 5 jeux d''Action', 'genre', 'specific_genre', '{"count": 5, "genre": "Action"}', '/images/achievements/action.png');

-- Insert sample quiz questions
INSERT INTO public.quiz_questions (question_en, question_fr, options)
VALUES 
  (
    'When facing a challenge, you prefer to:', 
    'Face à un défi, vous préférez :', 
    '[
      {"id": 0, "text_en": "Face it head-on", "text_fr": "L''affronter de front", "points": {"warrior": 3, "mage": 0, "rogue": 1}},
      {"id": 1, "text_en": "Study and understand it first", "text_fr": "L''étudier et le comprendre d''abord", "points": {"warrior": 0, "mage": 3, "rogue": 1}},
      {"id": 2, "text_en": "Find a creative way around it", "text_fr": "Trouver un moyen créatif de le contourner", "points": {"warrior": 1, "mage": 1, "rogue": 3}}
    ]'
  ),
  (
    'Which weapon would you choose?', 
    'Quelle arme choisiriez-vous ?', 
    '[
      {"id": 0, "text_en": "A mighty sword", "text_fr": "Une puissante épée", "points": {"warrior": 3, "mage": 0, "rogue": 1}},
      {"id": 1, "text_en": "A magical staff", "text_fr": "Un bâton magique", "points": {"warrior": 0, "mage": 3, "rogue": 0}},
      {"id": 2, "text_en": "A pair of daggers", "text_fr": "Une paire de dagues", "points": {"warrior": 1, "mage": 0, "rogue": 3}}
    ]'
  ),
  (
    'You value most:', 
    'Vous valorisez le plus :', 
    '[
      {"id": 0, "text_en": "Strength and honor", "text_fr": "La force et l''honneur", "points": {"warrior": 3, "mage": 0, "rogue": 0}},
      {"id": 1, "text_en": "Knowledge and wisdom", "text_fr": "La connaissance et la sagesse", "points": {"warrior": 0, "mage": 3, "rogue": 1}},
      {"id": 2, "text_en": "Cunning and adaptability", "text_fr": "La ruse et l''adaptabilité", "points": {"warrior": 0, "mage": 1, "rogue": 3}}
    ]'
  ),
  (
    'In a group, you usually take the role of:', 
    'Dans un groupe, vous prenez généralement le rôle de :', 
    '[
      {"id": 0, "text_en": "The leader who protects others", "text_fr": "Le leader qui protège les autres", "points": {"warrior": 3, "mage": 1, "rogue": 0}},
      {"id": 1, "text_en": "The advisor who provides guidance", "text_fr": "Le conseiller qui guide", "points": {"warrior": 1, "mage": 3, "rogue": 0}},
      {"id": 2, "text_en": "The one who works behind the scenes", "text_fr": "Celui qui travaille en coulisse", "points": {"warrior": 0, "mage": 1, "rogue": 3}}
    ]'
  ),
  (
    'Your favorite game genre is:', 
    'Votre genre de jeu préféré est :', 
    '[
      {"id": 0, "text_en": "Action/Adventure", "text_fr": "Action/Aventure", "points": {"warrior": 3, "mage": 1, "rogue": 2}},
      {"id": 1, "text_en": "RPG/Strategy", "text_fr": "RPG/Stratégie", "points": {"warrior": 1, "mage": 3, "rogue": 1}},
      {"id": 2, "text_en": "Stealth/Puzzle", "text_fr": "Infiltration/Puzzle", "points": {"warrior": 0, "mage": 2, "rogue": 3}}
    ]'
  );
