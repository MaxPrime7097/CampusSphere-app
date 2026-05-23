-- =============================================================================
-- Sphéra V2 — Commandes de migration Django à exécuter APRÈS le SQL Supabase
-- =============================================================================
-- Ces commandes marquent les migrations comme appliquées dans Django
-- sans modifier la DB (car le SQL a déjà été exécuté).

-- 1. Dans le répertoire backend/, exécuter :
--    python manage.py migrate --fake study_tools zero
--    python manage.py migrate --fake sphera 0001_initial
--    python manage.py migrate --fake sphera 0002_v2_fields_and_annale

-- Note : La DB Supabase doit être accessible (via DATABASE_URL dans .env)
-- 
-- Ordre d'exécution complet :
--   1. Exécuter supabase_migration.sql dans Supabase SQL Editor
--   2. Exécuter les 3 commandes --fake ci-dessus
--   3. Le backend Sphera est opérationnel
