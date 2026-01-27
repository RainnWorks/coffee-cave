CREATE TABLE "allergen" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"icon" varchar,
	"tenantId" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_key_credential" (
	"id" varchar PRIMARY KEY NOT NULL,
	"principalId" varchar NOT NULL,
	"name" varchar NOT NULL,
	"keyHash" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"revokedAt" timestamp,
	"lastUsedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"icon" varchar,
	"tenantId" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_item" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"price" bigint NOT NULL,
	"createdByID" varchar,
	"tenantId" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_item_allergen" (
	"allergenID" varchar NOT NULL,
	"menuItemID" varchar NOT NULL,
	CONSTRAINT "menu_item_allergen_menuItemID_allergenID_pk" PRIMARY KEY("menuItemID","allergenID")
);
--> statement-breakpoint
CREATE TABLE "menu_item_category" (
	"menuItemID" varchar NOT NULL,
	"categoryID" varchar NOT NULL,
	CONSTRAINT "menu_item_category_menuItemID_categoryID_pk" PRIMARY KEY("menuItemID","categoryID")
);
--> statement-breakpoint
CREATE TABLE "oauth_credential" (
	"id" varchar PRIMARY KEY NOT NULL,
	"principalId" varchar NOT NULL,
	"provider" varchar NOT NULL,
	"providerId" varchar NOT NULL,
	"email" varchar,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"revokedAt" timestamp,
	"lastUsedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "password_credential" (
	"id" varchar PRIMARY KEY NOT NULL,
	"principalId" varchar NOT NULL,
	"email" varchar NOT NULL,
	"passwordHash" varchar NOT NULL,
	"passwordSalt" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"revokedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" varchar PRIMARY KEY NOT NULL,
	"amount" bigint NOT NULL,
	"notes" varchar,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"tenantId" varchar NOT NULL,
	"createdByID" varchar NOT NULL,
	"tableID" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_tab_item_paid" (
	"paymentID" varchar NOT NULL,
	"tabItemID" varchar NOT NULL,
	CONSTRAINT "payment_tab_item_paid_paymentID_tabItemID_pk" PRIMARY KEY("paymentID","tabItemID")
);
--> statement-breakpoint
CREATE TABLE "pin_credential" (
	"id" varchar PRIMARY KEY NOT NULL,
	"principalId" varchar NOT NULL,
	"tenantId" varchar NOT NULL,
	"staffCode" varchar(3) NOT NULL,
	"pinHash" varchar NOT NULL,
	"pinSalt" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"revokedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "principal" (
	"id" varchar PRIMARY KEY NOT NULL,
	"kind" varchar NOT NULL,
	"displayName" varchar NOT NULL,
	"avatarUrl" varchar,
	"globalCredVersion" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_settings" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"currencyCode" varchar NOT NULL,
	"currencyLocale" varchar NOT NULL,
	"primaryColor" varchar NOT NULL,
	"secondaryColor" varchar NOT NULL,
	"timeZone" varchar NOT NULL,
	"coinsAndNotes" varchar NOT NULL,
	"tenantId" varchar NOT NULL,
	CONSTRAINT "restaurant_settings_tenantId_unique" UNIQUE("tenantId")
);
--> statement-breakpoint
CREATE TABLE "restaurant_table" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"seats" integer NOT NULL,
	"closed" boolean,
	"closedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"notes" varchar,
	"tenantId" varchar NOT NULL,
	"createdById" varchar NOT NULL,
	"closedById" varchar
);
--> statement-breakpoint
CREATE TABLE "role_grant" (
	"id" varchar PRIMARY KEY NOT NULL,
	"principalId" varchar NOT NULL,
	"scopeKind" varchar NOT NULL,
	"tenantId" varchar,
	"role" varchar NOT NULL,
	"grantedAt" timestamp DEFAULT now() NOT NULL,
	"revokedAt" timestamp,
	"grantedByPrincipalId" varchar
);
--> statement-breakpoint
CREATE TABLE "tab" (
	"id" varchar PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"locked" boolean,
	"closed" boolean,
	"closedAt" timestamp,
	"tableID" varchar,
	"tenantId" varchar NOT NULL,
	"createdByID" varchar,
	"closedByID" varchar
);
--> statement-breakpoint
CREATE TABLE "tab_item" (
	"id" varchar PRIMARY KEY NOT NULL,
	"notes" varchar,
	"nameOverride" varchar,
	"priceOverride" bigint,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"readyAt" timestamp,
	"servedAt" timestamp,
	"tabID" varchar NOT NULL,
	"menuItemID" varchar,
	"createdByID" varchar,
	"tenantId" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tab_item_allergy_restriction" (
	"tabItemID" varchar NOT NULL,
	"allergenID" varchar NOT NULL,
	CONSTRAINT "tab_item_allergy_restriction_tabItemID_allergenID_pk" PRIMARY KEY("tabItemID","allergenID")
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "allergen_tenantId_idx" ON "allergen" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "api_key_credential_principalId_idx" ON "api_key_credential" USING btree ("principalId");--> statement-breakpoint
CREATE INDEX "category_tenantId_idx" ON "category" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "menu_item_tenantId_idx" ON "menu_item" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "oauth_credential_principalId_idx" ON "oauth_credential" USING btree ("principalId");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_credential_provider_providerId_idx" ON "oauth_credential" USING btree ("provider","providerId");--> statement-breakpoint
CREATE INDEX "password_credential_principalId_idx" ON "password_credential" USING btree ("principalId");--> statement-breakpoint
CREATE UNIQUE INDEX "password_credential_email_idx" ON "password_credential" USING btree ("email");--> statement-breakpoint
CREATE INDEX "payment_tenantId_idx" ON "payment" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "pin_credential_principalId_idx" ON "pin_credential" USING btree ("principalId");--> statement-breakpoint
CREATE UNIQUE INDEX "pin_credential_tenant_staffCode_idx" ON "pin_credential" USING btree ("tenantId","staffCode");--> statement-breakpoint
CREATE INDEX "restaurant_table_tenantId_idx" ON "restaurant_table" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "role_grant_principalId_idx" ON "role_grant" USING btree ("principalId");--> statement-breakpoint
CREATE INDEX "role_grant_tenantId_idx" ON "role_grant" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "role_grant_scopeKind_tenantId_idx" ON "role_grant" USING btree ("scopeKind","tenantId");--> statement-breakpoint
CREATE INDEX "tab_tenantId_idx" ON "tab" USING btree ("tenantId");--> statement-breakpoint
CREATE INDEX "tab_item_tenantId_idx" ON "tab_item" USING btree ("tenantId");