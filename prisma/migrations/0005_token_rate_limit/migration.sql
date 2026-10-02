-- AlterTable
ALTER TABLE "ApiToken" ADD COLUMN     "windowCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "windowStart" TIMESTAMP(3);
