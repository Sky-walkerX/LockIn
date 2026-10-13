-- Addresses are stored in lower case, so one can be looked up by exact match
-- (a case-insensitive match is a pattern match, where "_" stands for any
-- character). An address that already has a lower-case twin is left as it is.
UPDATE "User" u SET "email" = lower(u."email")
WHERE u."email" <> lower(u."email")
  AND NOT EXISTS (SELECT 1 FROM "User" o WHERE o."email" = lower(u."email"));
