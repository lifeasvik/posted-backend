CREATE TYPE postcard_category AS ENUM (
  'Listicle',
  'How-to',
  'News',
  'Interview',
  'Story'
);

ALTER TABLE posted_postcards
  ADD COLUMN
    style postcard_category;
