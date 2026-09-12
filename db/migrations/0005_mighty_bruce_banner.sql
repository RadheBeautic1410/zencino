CREATE TABLE "order_cancellations" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"user_id" text,
	"requested_by" text DEFAULT 'customer' NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"admin_note" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_refunds" (
	"id" text PRIMARY KEY NOT NULL,
	"refund_number" text NOT NULL,
	"order_id" text NOT NULL,
	"return_id" text,
	"cancellation_id" text,
	"amount_minor" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"reason" text NOT NULL,
	"method" text DEFAULT 'upi_reversal' NOT NULL,
	"transaction_reference" text,
	"credit_note_number" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"processed_by" text,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_refunds_refund_number_unique" UNIQUE("refund_number"),
	CONSTRAINT "order_refunds_credit_note_number_unique" UNIQUE("credit_note_number")
);
--> statement-breakpoint
CREATE TABLE "order_returns" (
	"id" text PRIMARY KEY NOT NULL,
	"return_number" text NOT NULL,
	"order_id" text NOT NULL,
	"order_item_id" text NOT NULL,
	"variant_id" text NOT NULL,
	"user_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"reason" text NOT NULL,
	"customer_note" text,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'requested' NOT NULL,
	"restock_action" text DEFAULT 'none' NOT NULL,
	"refund_amount_minor" integer DEFAULT 0 NOT NULL,
	"admin_note" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_returns_return_number_unique" UNIQUE("return_number")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "dispatched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "order_cancellations" ADD CONSTRAINT "order_cancellations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_cancellations" ADD CONSTRAINT "order_cancellations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_cancellations" ADD CONSTRAINT "order_cancellations_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_return_id_order_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."order_returns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_cancellation_id_order_cancellations_id_fk" FOREIGN KEY ("cancellation_id") REFERENCES "public"."order_cancellations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_processed_by_user_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_cancellations_order_id_idx" ON "order_cancellations" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_cancellations_status_idx" ON "order_cancellations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "order_refunds_refund_number_idx" ON "order_refunds" USING btree ("refund_number");--> statement-breakpoint
CREATE UNIQUE INDEX "order_refunds_credit_note_number_idx" ON "order_refunds" USING btree ("credit_note_number");--> statement-breakpoint
CREATE INDEX "order_refunds_order_id_idx" ON "order_refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_refunds_return_id_idx" ON "order_refunds" USING btree ("return_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_returns_return_number_idx" ON "order_returns" USING btree ("return_number");--> statement-breakpoint
CREATE INDEX "order_returns_order_id_idx" ON "order_returns" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_returns_item_id_idx" ON "order_returns" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "order_returns_status_idx" ON "order_returns" USING btree ("status");