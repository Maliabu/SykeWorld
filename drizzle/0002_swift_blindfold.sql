ALTER TABLE "contact_messages" RENAME COLUMN "created" TO "created_at";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "created" TO "created_at";--> statement-breakpoint
ALTER TABLE "contact_messages" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;