ALTER TABLE "api_key_credential" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "oauth_credential" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "password_credential" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "pin_credential" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "principal" ALTER COLUMN "globalCredVersion" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "principal" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "restaurant_table" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "role_grant" ALTER COLUMN "grantedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tab" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tab_item" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tenant" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "slug" varchar(63) NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_slug_idx" ON "tenant" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_slug_unique" UNIQUE("slug");