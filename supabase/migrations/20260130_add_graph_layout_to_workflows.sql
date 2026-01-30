-- Add graph_layout column to persist visual workflow connections and node positions.
-- Without this, branching connections (e.g. trigger → A and trigger → B) get
-- flattened into a linear chain on reload.
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS graph_layout JSONB DEFAULT NULL;
