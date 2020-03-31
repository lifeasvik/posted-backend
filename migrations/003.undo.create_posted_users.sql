ALTER TABLE posted_postcards
  DROP COLUMN IF EXISTS author_id;

DROP TABLE IF EXISTS posted_users;
