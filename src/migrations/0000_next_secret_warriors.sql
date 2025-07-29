CREATE TYPE "public"."asset_status" AS ENUM('active', 'sold', 'archived', 'damaged', 'lost');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'active', 'sold', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('free', 'premium', 'starter', 'business', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'expired', 'trial', 'past_due');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('sale', 'purchase', 'commission', 'subscription', 'refund');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'manager', 'viewer', 'accountant');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('personal', 'professional');--> statement-breakpoint
CREATE TYPE "public"."valuation_scenario" AS ENUM('pessimistic', 'realistic', 'optimistic');--> statement-breakpoint
CREATE TABLE "asset_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"parent_id" uuid,
	"icon" varchar(100),
	"depreciation_profile" jsonb,
	"marketplaces" jsonb,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "asset_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"field_changed" varchar(100),
	"old_value" text,
	"new_value" text,
	"reason" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR',
	"images" jsonb,
	"external_id" varchar(255),
	"external_url" text,
	"platform_status" varchar(50),
	"platform_category" varchar(100),
	"is_auction" boolean DEFAULT false,
	"auction_end_date" timestamp,
	"reserve_price" numeric(12, 2),
	"buy_it_now_price" numeric(12, 2),
	"allows_local_pickup" boolean DEFAULT true,
	"allows_shipping" boolean DEFAULT false,
	"shipping_cost" numeric(8, 2),
	"shipping_options" jsonb,
	"status" "listing_status" DEFAULT 'draft',
	"view_count" integer DEFAULT 0,
	"watch_count" integer DEFAULT 0,
	"message_count" integer DEFAULT 0,
	"auto_relist" boolean DEFAULT false,
	"price_strategy" varchar(50),
	"listed_at" timestamp,
	"expires_at" timestamp,
	"sold_at" timestamp,
	"final_sale_price" numeric(12, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_valuations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"scenario" "valuation_scenario" NOT NULL,
	"current_value" numeric(12, 2) NOT NULL,
	"projected_value" numeric(12, 2),
	"depreciation_rate" numeric(5, 4),
	"market_condition" varchar(50),
	"confidence_level" integer,
	"data_sources" jsonb,
	"methodology" text,
	"sample_size" integer,
	"valuation_date" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp,
	"next_update_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"category_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"brand" varchar(100),
	"model" varchar(100),
	"serial_number" varchar(100),
	"condition" varchar(50),
	"purchase_price" numeric(12, 2) NOT NULL,
	"purchase_date" timestamp NOT NULL,
	"purchase_currency" varchar(3) DEFAULT 'EUR',
	"purchase_location" text,
	"receipt_url" text,
	"planned_sale_date" timestamp,
	"target_sale_price" numeric(12, 2),
	"assigned_to" uuid,
	"department" varchar(100),
	"location" varchar(255),
	"accounting_depreciation_period" integer,
	"asset_tag" varchar(50),
	"status" "asset_status" DEFAULT 'active',
	"actual_sale_price" numeric(12, 2),
	"actual_sale_date" timestamp,
	"images" jsonb,
	"specifications" jsonb,
	"tags" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "market_data_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"brand" varchar(100),
	"model" varchar(100),
	"year" integer,
	"condition" varchar(50),
	"listing_price" numeric(12, 2) NOT NULL,
	"sold_price" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'EUR',
	"listing_date" timestamp NOT NULL,
	"sold_date" timestamp,
	"days_to_sell" integer,
	"location" varchar(100),
	"external_id" varchar(255),
	"url" text,
	"specifications" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_data_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"website_url" varchar(255) NOT NULL,
	"api_endpoint" varchar(255),
	"categories" jsonb,
	"api_key" text,
	"rate_limits" jsonb,
	"is_active" boolean DEFAULT true,
	"last_sync_at" timestamp,
	"last_error_at" timestamp,
	"error_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "market_data_sources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_id" uuid,
	"organization_id" uuid,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"action_url" text,
	"action_label" varchar(100),
	"priority" varchar(20) DEFAULT 'normal',
	"category" varchar(50),
	"data" jsonb,
	"channels" jsonb,
	"email_sent" boolean DEFAULT false,
	"push_sent" boolean DEFAULT false,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"clicked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"logo" text,
	"website" varchar(255),
	"industry" varchar(100),
	"size" varchar(50),
	"address" jsonb,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "platforms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"website_url" varchar(255) NOT NULL,
	"logo_url" text,
	"api_endpoint" varchar(255),
	"has_api_integration" boolean DEFAULT false,
	"supported_categories" jsonb,
	"commission_rate" numeric(5, 4),
	"our_commission_rate" numeric(5, 4),
	"supports_auctions" boolean DEFAULT false,
	"supports_fixed_price" boolean DEFAULT true,
	"supports_local_delivery" boolean DEFAULT false,
	"supports_shipping" boolean DEFAULT true,
	"supports_payment_processing" boolean DEFAULT false,
	"listing_settings" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platforms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"search_criteria" jsonb NOT NULL,
	"alert_enabled" boolean DEFAULT false,
	"alert_frequency" varchar(20),
	"price_threshold" numeric(12, 2),
	"last_run_at" timestamp,
	"result_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"device_info" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"type" "plan_type" NOT NULL,
	"monthly_price" numeric(8, 2),
	"yearly_price" numeric(8, 2),
	"currency" varchar(3) DEFAULT 'EUR',
	"max_assets" integer,
	"max_users" integer,
	"max_organizations" integer,
	"features" jsonb,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_id" uuid,
	"listing_id" uuid,
	"subscription_id" uuid,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR',
	"commission" numeric(8, 2),
	"platform_fee" numeric(8, 2),
	"platform_transaction_id" varchar(255),
	"stripe_payment_intent_id" varchar(255),
	"stripe_charge_id" varchar(255),
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"description" text,
	"metadata" jsonb,
	"processed_at" timestamp,
	"failed_at" timestamp,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"is_active" boolean DEFAULT true,
	"invited_by" uuid,
	"invited_at" timestamp,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	CONSTRAINT "unique_active_user_org" UNIQUE("user_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "user_platform_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"platform_user_id" varchar(255),
	"platform_username" varchar(255),
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"last_sync_at" timestamp,
	"last_sync_error" text,
	"sync_settings" jsonb,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"disconnected_at" timestamp,
	CONSTRAINT "unique_user_platform" UNIQUE("user_id","platform_id")
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"organization_id" uuid,
	"status" "subscription_status" DEFAULT 'trial' NOT NULL,
	"billing_cycle" varchar(20),
	"amount" numeric(8, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR',
	"stripe_subscription_id" varchar(255),
	"stripe_customer_id" varchar(255),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"trial_end_date" timestamp,
	"next_billing_date" timestamp,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"avatar" text,
	"type" "user_type" DEFAULT 'personal' NOT NULL,
	"email_verified" boolean DEFAULT false,
	"email_verified_at" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_parent_id_asset_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."asset_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_history" ADD CONSTRAINT "asset_history_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_history" ADD CONSTRAINT "asset_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_listings" ADD CONSTRAINT "asset_listings_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_listings" ADD CONSTRAINT "asset_listings_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_listings" ADD CONSTRAINT "asset_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_valuations" ADD CONSTRAINT "asset_valuations_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_asset_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."asset_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_data_points" ADD CONSTRAINT "market_data_points_source_id_market_data_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."market_data_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_data_points" ADD CONSTRAINT "market_data_points_category_id_asset_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."asset_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_listing_id_asset_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."asset_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_platform_connections" ADD CONSTRAINT "user_platform_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_platform_connections" ADD CONSTRAINT "user_platform_connections_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_categories_slug_idx" ON "asset_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "asset_categories_parent_idx" ON "asset_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "asset_categories_active_idx" ON "asset_categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "asset_history_asset_idx" ON "asset_history" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "asset_history_user_idx" ON "asset_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "asset_history_action_idx" ON "asset_history" USING btree ("action");--> statement-breakpoint
CREATE INDEX "asset_history_created_at_idx" ON "asset_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "listings_asset_idx" ON "asset_listings" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "listings_platform_idx" ON "asset_listings" USING btree ("platform_id");--> statement-breakpoint
CREATE INDEX "listings_user_idx" ON "asset_listings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "listings_status_idx" ON "asset_listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listings_listed_at_idx" ON "asset_listings" USING btree ("listed_at");--> statement-breakpoint
CREATE INDEX "listings_expires_at_idx" ON "asset_listings" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "valuations_asset_scenario_idx" ON "asset_valuations" USING btree ("asset_id","scenario");--> statement-breakpoint
CREATE INDEX "valuations_date_idx" ON "asset_valuations" USING btree ("valuation_date");--> statement-breakpoint
CREATE INDEX "valuations_valid_until_idx" ON "asset_valuations" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "valuations_next_update_idx" ON "asset_valuations" USING btree ("next_update_at");--> statement-breakpoint
CREATE INDEX "assets_user_idx" ON "assets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assets_org_idx" ON "assets" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "assets_category_idx" ON "assets" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "assets_status_idx" ON "assets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assets_assigned_idx" ON "assets" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "assets_purchase_date_idx" ON "assets" USING btree ("purchase_date");--> statement-breakpoint
CREATE INDEX "assets_planned_sale_date_idx" ON "assets" USING btree ("planned_sale_date");--> statement-breakpoint
CREATE INDEX "assets_brand_model_idx" ON "assets" USING btree ("brand","model");--> statement-breakpoint
CREATE INDEX "assets_deleted_idx" ON "assets" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "market_data_source_idx" ON "market_data_points" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "market_data_category_idx" ON "market_data_points" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "market_data_date_idx" ON "market_data_points" USING btree ("listing_date");--> statement-breakpoint
CREATE INDEX "market_data_brand_model_idx" ON "market_data_points" USING btree ("brand","model");--> statement-breakpoint
CREATE INDEX "market_data_sold_date_idx" ON "market_data_points" USING btree ("sold_date");--> statement-breakpoint
CREATE INDEX "market_data_price_idx" ON "market_data_points" USING btree ("listing_price");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_priority_idx" ON "notifications" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_expires_at_idx" ON "notifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organizations_industry_idx" ON "organizations" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "organizations_deleted_idx" ON "organizations" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "password_resets_token_idx" ON "password_resets" USING btree ("token");--> statement-breakpoint
CREATE INDEX "password_resets_user_idx" ON "password_resets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "platforms_slug_idx" ON "platforms" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "platforms_active_idx" ON "platforms" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "saved_searches_user_idx" ON "saved_searches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_searches_alert_enabled_idx" ON "saved_searches" USING btree ("alert_enabled");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "subscription_plans_slug_idx" ON "subscription_plans" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "subscription_plans_type_idx" ON "subscription_plans" USING btree ("type");--> statement-breakpoint
CREATE INDEX "subscription_plans_active_idx" ON "subscription_plans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "transactions_user_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_asset_idx" ON "transactions" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "transactions_processed_at_idx" ON "transactions" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "user_organizations_user_org_idx" ON "user_organizations" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "user_organizations_role_idx" ON "user_organizations" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_platform_connections_active_idx" ON "user_platform_connections" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "user_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "user_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_next_billing_idx" ON "user_subscriptions" USING btree ("next_billing_date");--> statement-breakpoint
CREATE INDEX "subscriptions_org_idx" ON "user_subscriptions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_type_idx" ON "users" USING btree ("type");--> statement-breakpoint
CREATE INDEX "users_deleted_idx" ON "users" USING btree ("deleted_at");