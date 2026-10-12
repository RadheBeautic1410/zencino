CREATE TABLE "coupon_redemptions" (
	"id" text PRIMARY KEY NOT NULL,
	"coupon_id" text NOT NULL,
	"order_id" text NOT NULL,
	"user_id" text,
	"customer_email" text NOT NULL,
	"discount_minor" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"discount_type" text DEFAULT 'percent' NOT NULL,
	"discount_value" integer NOT NULL,
	"max_discount_minor" integer,
	"min_order_minor" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"usage_limit" integer,
	"per_customer_limit" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "coupon_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_minor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_code" text;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_redemptions_order_idx" ON "coupon_redemptions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "coupon_redemptions_coupon_idx" ON "coupon_redemptions" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_redemptions_user_idx" ON "coupon_redemptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupon_redemptions_email_idx" ON "coupon_redemptions" USING btree ("customer_email");--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupons_active_idx" ON "coupons" USING btree ("active");