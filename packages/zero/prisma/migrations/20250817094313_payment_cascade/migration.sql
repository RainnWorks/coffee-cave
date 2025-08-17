/*
  Warnings:

  - Made the column `tableID` on table `payment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."payment" DROP CONSTRAINT "payment_tableID_fkey";

-- AlterTable
ALTER TABLE "public"."payment" ALTER COLUMN "tableID" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_tableID_fkey" FOREIGN KEY ("tableID") REFERENCES "public"."restaurant_table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
