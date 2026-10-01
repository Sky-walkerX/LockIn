-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nextPage" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "page" INTEGER;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "page" INTEGER;

-- Number the notes and resources that already exist, per user, in the order
-- they were added. Only empty pages are filled; nothing else changes.
WITH items AS (
    SELECT 'note' AS kind, m."id", s."userId", m."createdAt"
    FROM "Milestone" m JOIN "Subject" s ON s."id" = m."subjectId"
    WHERE m."page" IS NULL
    UNION ALL
    SELECT 'resource', r."id", r."userId", r."createdAt"
    FROM "Resource" r
    WHERE r."page" IS NULL
), numbered AS (
    SELECT kind, "id", "userId",
           ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt", "id") AS page
    FROM items
), notes AS (
    UPDATE "Milestone" m SET "page" = n.page
    FROM numbered n WHERE n.kind = 'note' AND m."id" = n."id"
), resources AS (
    UPDATE "Resource" r SET "page" = n.page
    FROM numbered n WHERE n.kind = 'resource' AND r."id" = n."id"
)
UPDATE "User" u SET "nextPage" = c.last + 1
FROM (SELECT "userId", MAX(page) AS last FROM numbered GROUP BY "userId") c
WHERE u."id" = c."userId";
