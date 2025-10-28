-- Vérifier si la fonction delete_user_data existe
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'delete_user_data' 
  AND routine_schema = 'public';

-- Vérifier les permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'delete_user_data' 
  AND table_schema = 'public';
