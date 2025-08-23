/*
  Warnings:

  - Made the column `createdByID` on table `payment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."payment" DROP CONSTRAINT "payment_createdByID_fkey";

-- AlterTable
ALTER TABLE "public"."payment" ALTER COLUMN "createdByID" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_createdByID_fkey" FOREIGN KEY ("createdByID") REFERENCES "public"."staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
