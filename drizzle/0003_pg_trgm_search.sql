CREATE EXTENSION IF NOT EXISTS pg_trgm;

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS tools_search_trgm_idx
  ON tools
  USING gin (name gin_trgm_ops, hook gin_trgm_ops, description gin_trgm_ops);
