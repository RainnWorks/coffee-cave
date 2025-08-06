-- AlterTable
ALTER TABLE "public"."admin" ADD COLUMN     "credVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "disabledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."staff" ADD COLUMN     "credVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "disabledAt" TIMESTAMP(3);
