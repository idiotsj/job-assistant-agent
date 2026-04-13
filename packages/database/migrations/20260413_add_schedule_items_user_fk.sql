-- Remove orphaned schedule rows before enabling referential integrity.
DELETE FROM schedule_items
WHERE user_id NOT IN (
  SELECT id FROM app_users
);

ALTER TABLE schedule_items
DROP CONSTRAINT IF EXISTS schedule_items_user_id_fkey;

ALTER TABLE schedule_items
ADD CONSTRAINT schedule_items_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES app_users(id)
ON DELETE CASCADE;
