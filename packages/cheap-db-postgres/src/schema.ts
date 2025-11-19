/**
 * PostgreSQL database schema for CHEAP model
 */

export const SCHEMA_SQL = `
-- Catalogs table
CREATE TABLE IF NOT EXISTS catalogs (
  id TEXT PRIMARY KEY,
  species TEXT NOT NULL,
  uri TEXT,
  upstream TEXT,
  version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Aspect definitions table
CREATE TABLE IF NOT EXISTS aspect_defs (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  readable BOOLEAN NOT NULL DEFAULT TRUE,
  writable BOOLEAN NOT NULL DEFAULT TRUE,
  can_add_properties BOOLEAN NOT NULL DEFAULT FALSE,
  can_remove_properties BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(catalog_id, name)
);

CREATE INDEX IF NOT EXISTS idx_aspect_defs_catalog ON aspect_defs(catalog_id);
CREATE INDEX IF NOT EXISTS idx_aspect_defs_name ON aspect_defs(catalog_id, name);

-- Property definitions table
CREATE TABLE IF NOT EXISTS property_defs (
  id TEXT PRIMARY KEY,
  aspect_def_id TEXT NOT NULL REFERENCES aspect_defs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type_code TEXT NOT NULL,
  default_value TEXT,
  has_default_value BOOLEAN NOT NULL DEFAULT FALSE,
  readable BOOLEAN NOT NULL DEFAULT TRUE,
  writable BOOLEAN NOT NULL DEFAULT TRUE,
  nullable BOOLEAN NOT NULL DEFAULT TRUE,
  removable BOOLEAN NOT NULL DEFAULT TRUE,
  multivalued BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(aspect_def_id, name)
);

CREATE INDEX IF NOT EXISTS idx_property_defs_aspect ON property_defs(aspect_def_id);

-- Entities table
CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Aspects table
CREATE TABLE IF NOT EXISTS aspects (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  aspect_def_id TEXT NOT NULL REFERENCES aspect_defs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(catalog_id, entity_id, aspect_def_id)
);

CREATE INDEX IF NOT EXISTS idx_aspects_catalog ON aspects(catalog_id);
CREATE INDEX IF NOT EXISTS idx_aspects_entity ON aspects(entity_id);
CREATE INDEX IF NOT EXISTS idx_aspects_aspect_def ON aspects(aspect_def_id);

-- Property values table
CREATE TABLE IF NOT EXISTS property_values (
  id TEXT PRIMARY KEY,
  aspect_id TEXT NOT NULL REFERENCES aspects(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  value_json TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(aspect_id, property_name)
);

CREATE INDEX IF NOT EXISTS idx_property_values_aspect ON property_values(aspect_id);

-- Hierarchies table
CREATE TABLE IF NOT EXISTS hierarchies (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  aspect_def_id TEXT REFERENCES aspect_defs(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(catalog_id, name)
);

CREATE INDEX IF NOT EXISTS idx_hierarchies_catalog ON hierarchies(catalog_id);
CREATE INDEX IF NOT EXISTS idx_hierarchies_name ON hierarchies(catalog_id, name);

-- Hierarchy entities table (for EntityList and EntitySet)
CREATE TABLE IF NOT EXISTS hierarchy_entities (
  id TEXT PRIMARY KEY,
  hierarchy_id TEXT NOT NULL REFERENCES hierarchies(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hierarchy_entities_hierarchy ON hierarchy_entities(hierarchy_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_entities_entity ON hierarchy_entities(entity_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_entities_position ON hierarchy_entities(hierarchy_id, position);

-- Hierarchy directory table (for EntityDirectory)
CREATE TABLE IF NOT EXISTS hierarchy_directory (
  id TEXT PRIMARY KEY,
  hierarchy_id TEXT NOT NULL REFERENCES hierarchies(id) ON DELETE CASCADE,
  entry_name TEXT NOT NULL,
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(hierarchy_id, entry_name)
);

CREATE INDEX IF NOT EXISTS idx_hierarchy_directory_hierarchy ON hierarchy_directory(hierarchy_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_directory_entity ON hierarchy_directory(entity_id);
`;
