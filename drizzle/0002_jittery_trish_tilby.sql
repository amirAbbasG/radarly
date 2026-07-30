CREATE TABLE "review_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"review_id" text NOT NULL,
	"user_id" text NOT NULL,
	"vote" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_votes_review_id_user_id_unique" UNIQUE("review_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "saved_tools" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"tool_slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_tools_userId_tool_slug_unique" UNIQUE("userId","tool_slug")
);
--> statement-breakpoint
CREATE TABLE "tool_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"tool_slug" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"tool_slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tool_votes_userId_tool_slug_unique" UNIQUE("userId","tool_slug")
);
--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_tool_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."tool_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_tools" ADD CONSTRAINT "saved_tools_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_tools" ADD CONSTRAINT "saved_tools_tool_slug_tools_slug_fk" FOREIGN KEY ("tool_slug") REFERENCES "public"."tools"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_reviews" ADD CONSTRAINT "tool_reviews_tool_slug_tools_slug_fk" FOREIGN KEY ("tool_slug") REFERENCES "public"."tools"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_reviews" ADD CONSTRAINT "tool_reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_votes" ADD CONSTRAINT "tool_votes_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_votes" ADD CONSTRAINT "tool_votes_tool_slug_tools_slug_fk" FOREIGN KEY ("tool_slug") REFERENCES "public"."tools"("slug") ON DELETE cascade ON UPDATE no action;