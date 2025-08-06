-- migration SQL
ALTER TABLE restaurant_settings
  ALTER COLUMN id SET DEFAULT 'singleton';

ALTER TABLE restaurant_settings
  ADD CONSTRAINT restaurant_settings_singleton_chk
  CHECK (id = 'singleton');
-- id is already PRIMARY KEY in your Prisma model