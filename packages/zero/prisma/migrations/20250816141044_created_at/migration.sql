/*
  Warnings:

  - Made the column `createdAt` on table `payment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `restaurant_table` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `tab` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `tab_item` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."payment" ALTER COLUMN "createdAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."restaurant_table" ALTER COLUMN "createdAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."tab" ALTER COLUMN "createdAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."tab_item" ALTER COLUMN "createdAt" SET NOT NULL;
