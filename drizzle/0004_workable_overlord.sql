CREATE TABLE "contact_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "tool_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"tool_slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tool_votes_userId_tool_slug_unique" UNIQUE("userId","tool_slug")
);
--> statement-breakpoint
ALTER TABLE "saved_tools" ADD CONSTRAINT "saved_tools_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_tools" ADD CONSTRAINT "saved_tools_tool_slug_tools_slug_fk" FOREIGN KEY ("tool_slug") REFERENCES "public"."tools"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_votes" ADD CONSTRAINT "tool_votes_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_votes" ADD CONSTRAINT "tool_votes_tool_slug_tools_slug_fk" FOREIGN KEY ("tool_slug") REFERENCES "public"."tools"("slug") ON DELETE cascade ON UPDATE no action;