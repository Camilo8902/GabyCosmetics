-- ==========================================
-- CHECK AUTH TRIGGERS AND FIX
-- The error occurs before password verification
-- This suggests a problem with auth.users triggers
-- ==========================================

-- Check triggers on auth schema
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
ORDER BY event_object_table;

-- Check for the common auth trigger that creates users
SELECT 
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname LIKE '%auth%user%'
OR proname LIKE '%on_auth%';

-- Check if there's a trigger that references public.users
SELECT 
    t.trigger_name,
    t.event_object_table,
    t.action_statement,
    pg_get_functiondef(p.oid) as function_def
FROM information_schema.triggers t
JOIN pg_proc p ON p.proname = REPLACE(t.action_statement, 'EXECUTE FUNCTION ', '')
WHERE t.trigger_schema IN ('auth', 'public')
AND t.action_statement LIKE '%user%';

-- List all functions in public schema that might be called by auth triggers
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%auth%' OR routine_name LIKE '%trigger%' OR routine_name LIKE '%user%');

-- Check for the specific on_auth_user_created trigger
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgname LIKE '%auth%';
