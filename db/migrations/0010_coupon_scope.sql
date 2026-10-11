CREATE TABLE "coupon_targets" (
	"id" text PRIMARY KEY NOT NULL,
	"coupon_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "discount_minor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "applies_to" text DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE "coupon_targets" ADD CONSTRAINT "coupon_targets_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_targets_unique_idx" ON "coupon_targets" USING btree ("coupon_id","target_type","target_id");--> statement-breakpoint
CREATE INDEX "coupon_targets_coupon_idx" ON "coupon_targets" USING btree ("coupon_id");