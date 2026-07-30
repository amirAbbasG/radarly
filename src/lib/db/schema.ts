import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", [
  "pending_summary",
  "published",
  "archived",
]);

export const tools = pgTable(
  "tools",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    hook: text("hook"),
    description: text("description"),
    category: text("category"),
    tags: jsonb("tags").$type<string[]>(),
    sourcePlatform: text("source_platform").notNull(),
    externalId: text("external_id").notNull(),
    sourceUrl: text("source_url").notNull(),
    website: text("website"),
    trendingScore: integer("trending_score").default(0),
    momentumHistory: jsonb("momentum_history")
      .$type<{ date: string; score: number }[]>()
      .default([]),
    signal: text("signal"),
    status: statusEnum("status").default("pending_summary"),
    firstSeenAt: timestamp("first_seen_at").defaultNow(),
    lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
  },
  table => ({
    sourceUnique: unique().on(table.sourcePlatform, table.externalId),
  }),
);

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const savedTools = pgTable(
  "saved_tools",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    toolSlug: text("tool_slug")
      .notNull()
      .references(() => tools.slug, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => ({
    userToolUnique: unique().on(table.userId, table.toolSlug),
  }),
);

export const toolVotes = pgTable(
  "tool_votes",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    toolSlug: text("tool_slug")
      .notNull()
      .references(() => tools.slug, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => ({
    userToolUnique: unique().on(table.userId, table.toolSlug),
  }),
);

export const toolSubmissions = pgTable("tool_submissions", {
  id: text("id").primaryKey(),
  userId: text("userId"),
  toolName: text("toolName").notNull(),
  canonicalUrl: text("canonicalUrl").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  submitterEmail: text("submitterEmail").notNull(),
  evidenceUrl: text("evidenceUrl"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const toolReviews = pgTable("tool_reviews", {
  id: text("id").primaryKey(),
  toolSlug: text("tool_slug")
    .notNull()
    .references(() => tools.slug, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewVotes = pgTable(
  "review_votes",
  {
    id: text("id").primaryKey(),
    reviewId: text("review_id")
      .notNull()
      .references(() => toolReviews.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    vote: integer("vote").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  table => ({
    uniqueVote: unique().on(table.reviewId, table.userId),
  }),
);
