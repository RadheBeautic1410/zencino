CREATE TABLE "shipping_pincode_rates" (
	"id" text PRIMARY KEY NOT NULL,
	"pincode" text NOT NULL,
	"type" text NOT NULL,
	"rate_minor" integer NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "shipping_pincode_rates_pincode_idx" ON "shipping_pincode_rates" USING btree ("pincode");--> statement-breakpoint
CREATE INDEX "shipping_pincode_rates_active_idx" ON "shipping_pincode_rates" USING btree ("active");