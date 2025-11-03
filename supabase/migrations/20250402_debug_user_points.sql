-- Script pour déboguer les points d'un utilisateur
-- Remplacez 'USER_ID_ICI' par l'UUID de l'utilisateur à vérifier

-- 1. Voir toutes les réponses d'un utilisateur avec les points associés
SELECT 
  ua.user_id,
  ua.question_id,
  qq.question_fr,
  ua.selected_option,
  qq.options->ua.selected_option::int->>'text_fr' as reponse_choisie,
  qq.options->ua.selected_option::int->'points' as points_attribues
FROM public.user_quiz_answers ua
JOIN public.quiz_questions qq ON ua.question_id = qq.id
WHERE ua.user_id = 'USER_ID_ICI'  -- REMPLACER PAR L'UUID
ORDER BY ua.answered_at;

-- 2. Calculer manuellement les points totaux (pour vérifier)
WITH user_answers AS (
  SELECT 
    ua.user_id,
    qq.options->ua.selected_option::int->'points' as points_data
  FROM public.user_quiz_answers ua
  JOIN public.quiz_questions qq ON ua.question_id = qq.id
  WHERE ua.user_id = 'USER_ID_ICI'  -- REMPLACER PAR L'UUID
)
SELECT 
  jsonb_object_keys(points_data) as rank_type,
  SUM((points_data->>jsonb_object_keys(points_data))::int) as total_points
FROM user_answers
CROSS JOIN LATERAL jsonb_object_keys(points_data)
GROUP BY jsonb_object_keys(points_data)
ORDER BY total_points DESC;

-- 3. Voir le rank actuel de l'utilisateur
SELECT 
  p.id as user_id,
  p.username,
  p.quiz_completed,
  r.name_en,
  r.name_fr,
  r.level,
  r.description_fr
FROM public.profiles p
LEFT JOIN public.ranks r ON p.rank_id = r.id
WHERE p.id = 'USER_ID_ICI';  -- REMPLACER PAR L'UUID


