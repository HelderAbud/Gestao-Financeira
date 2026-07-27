-- Remove LojApp-embedded schema introduced by V2__lojapp_core.sql.
-- Do not edit V2; this is the forward-only cleanup (fatia 4b).

DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS inventory_balances CASCADE;
DROP TABLE IF EXISTS nfe_items CASCADE;
DROP TABLE IF EXISTS nfe_entries CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
