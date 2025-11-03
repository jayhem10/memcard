-- Accorder les permissions pour les fonctions RPC du quiz

-- Permissions pour calculate_user_rank
GRANT EXECUTE ON FUNCTION public.calculate_user_rank(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_user_rank(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.calculate_user_rank(UUID) TO service_role;

-- Permissions pour check_achievements
GRANT EXECUTE ON FUNCTION public.check_achievements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_achievements(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.check_achievements(UUID) TO service_role;

