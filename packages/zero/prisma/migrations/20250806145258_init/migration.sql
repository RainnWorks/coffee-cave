-- CreateTable
CREATE TABLE "public"."restaurant_settings" (
    "id" VARCHAR NOT NULL DEFAULT 'singleton',
    "name" VARCHAR NOT NULL,
    "currencyCode" VARCHAR NOT NULL,
    "currencyLocale" VARCHAR NOT NULL,
    "primaryColor" VARCHAR NOT NULL,
    "secondaryColor" VARCHAR NOT NULL,
    "timeZone" VARCHAR NOT NULL,
    "coinsAndNotes" VARCHAR NOT NULL,

    CONSTRAINT "restaurant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."staff" (
    "id" VARCHAR NOT NULL,
    "firstName" VARCHAR NOT NULL,
    "lastName" VARCHAR NOT NULL,
    "pinHash" VARCHAR NOT NULL,
    "pinSalt" VARCHAR NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin" (
    "id" VARCHAR NOT NULL,
    "email" VARCHAR,
    "passwordHash" VARCHAR NOT NULL,
    "passwordSalt" VARCHAR NOT NULL,
    "staffId" VARCHAR NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."restaurant_table" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "seats" INTEGER NOT NULL,
    "closed" BOOLEAN,
    "closedAt" DOUBLE PRECISION,
    "createdAt" DOUBLE PRECISION,
    "notes" VARCHAR,

    CONSTRAINT "restaurant_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "icon" VARCHAR,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."allergen" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "icon" VARCHAR,

    CONSTRAINT "allergen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_item" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdByID" VARCHAR,

    CONSTRAINT "menu_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_item_category" (
    "menuItemID" VARCHAR NOT NULL,
    "categoryID" VARCHAR NOT NULL,

    CONSTRAINT "menu_item_category_pkey" PRIMARY KEY ("menuItemID","categoryID")
);

-- CreateTable
CREATE TABLE "public"."menu_item_allergen" (
    "allergenID" VARCHAR NOT NULL,
    "menuItemID" VARCHAR NOT NULL,

    CONSTRAINT "menu_item_allergen_pkey" PRIMARY KEY ("menuItemID","allergenID")
);

-- CreateTable
CREATE TABLE "public"."tab" (
    "id" VARCHAR NOT NULL,
    "createdAt" DOUBLE PRECISION,
    "locked" BOOLEAN,
    "closed" BOOLEAN,
    "closedAt" DOUBLE PRECISION,
    "closedByID" VARCHAR,
    "tableID" VARCHAR,
    "createdByID" VARCHAR,

    CONSTRAINT "tab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tab_item" (
    "id" VARCHAR NOT NULL,
    "notes" VARCHAR,
    "nameOverride" VARCHAR,
    "priceOverride" DOUBLE PRECISION,
    "createdAt" DOUBLE PRECISION,
    "tabID" VARCHAR NOT NULL,
    "menuItemID" VARCHAR,

    CONSTRAINT "tab_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tab_item_allergy_restriction" (
    "tabItemID" VARCHAR NOT NULL,
    "allergenID" VARCHAR NOT NULL,

    CONSTRAINT "tab_item_allergy_restriction_pkey" PRIMARY KEY ("tabItemID","allergenID")
);

-- CreateTable
CREATE TABLE "public"."payment" (
    "id" VARCHAR NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" VARCHAR,
    "createdAt" DOUBLE PRECISION,
    "tableID" VARCHAR,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_tab_item_paid" (
    "paymentID" VARCHAR NOT NULL,
    "tabItemID" VARCHAR NOT NULL,

    CONSTRAINT "payment_tab_item_paid_pkey" PRIMARY KEY ("paymentID","tabItemID")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_staffId_key" ON "public"."admin"("staffId");

-- AddForeignKey
ALTER TABLE "public"."admin" ADD CONSTRAINT "admin_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item" ADD CONSTRAINT "menu_item_createdByID_fkey" FOREIGN KEY ("createdByID") REFERENCES "public"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_category" ADD CONSTRAINT "menu_item_category_menuItemID_fkey" FOREIGN KEY ("menuItemID") REFERENCES "public"."menu_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_category" ADD CONSTRAINT "menu_item_category_categoryID_fkey" FOREIGN KEY ("categoryID") REFERENCES "public"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_allergen" ADD CONSTRAINT "menu_item_allergen_menuItemID_fkey" FOREIGN KEY ("menuItemID") REFERENCES "public"."menu_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."menu_item_allergen" ADD CONSTRAINT "menu_item_allergen_allergenID_fkey" FOREIGN KEY ("allergenID") REFERENCES "public"."allergen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tab" ADD CONSTRAINT "tab_createdByID_fkey" FOREIGN KEY ("createdByID") REFERENCES "public"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tab" ADD CONSTRAINT "tab_closedByID_fkey" FOREIGN KEY ("closedByID") REFERENCES "public"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tab" ADD CONSTRAINT "tab_tableID_fkey" FOREIGN KEY ("tableID") REFERENCES "public"."restaurant_table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tab_item" ADD CONSTRAINT "tab_item_tabID_fkey" FOREIGN KEY ("tabID") REFERENCES "public"."tab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tab_item" ADD CONSTRAINT "tab_item_menuItemID_fkey" FOREIGN KEY ("menuItemID") REFERENCES "public"."menu_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tab_item_allergy_restriction" ADD CONSTRAINT "tab_item_allergy_restriction_tabItemID_fkey" FOREIGN KEY ("tabItemID") REFERENCES "public"."tab_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tab_item_allergy_restriction" ADD CONSTRAINT "tab_item_allergy_restriction_allergenID_fkey" FOREIGN KEY ("allergenID") REFERENCES "public"."allergen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_tableID_fkey" FOREIGN KEY ("tableID") REFERENCES "public"."restaurant_table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_tab_item_paid" ADD CONSTRAINT "payment_tab_item_paid_paymentID_fkey" FOREIGN KEY ("paymentID") REFERENCES "public"."payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_tab_item_paid" ADD CONSTRAINT "payment_tab_item_paid_tabItemID_fkey" FOREIGN KEY ("tabItemID") REFERENCES "public"."tab_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
