ALTER TABLE "asset_categories" DROP CONSTRAINT "asset_categories_parent_id_asset_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "token" SET DATA TYPE text;