/**
 * Database schema for CHEAP model in SQLite
 */

export const SCHEMA_SQL = `
-- Catalogs table
CREATE TABLE IF NOT EXISTS catalogs (
  id TEXT PRIMARY KEY,
  species TEXT NOT NULL,
  uri TEXT,
  upstream TEXT,
  version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Aspect Definitions table
CREATE TABLE IF NOT EXISTS aspect_defs (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL,
  name TEXT NOT NULL,
  readable INTEGER NOT NULL DEFAULT 1,
  writable INTEGER NOT NULL DEFAULT 1,
  can_add_properties INTEGER NOT NULL DEFAULT 0,
  can_remove_properties INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (catalog_id) REFERENCES catalogs(id) ON DELETE CASCADE,
  UNIQUE (catalog_id, name)
);

-- Property Definitions table (belongs to AspectDef)
CREATE TABLE IF NOT EXISTS property_defs (
  id TEXT PRIMARY KEY,
  aspect_def_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type_code TEXT NOT NULL,
  default_value TEXT,
  has_default_value INTEGER NOT NULL DEFAULT 0,
  readable INTEGER NOT NULL DEFAULT 1,
  writable INTEGER NOT NULL DEFAULT 1,
  nullable INTEGER NOT NULL DEFAULT 0,
  removable INTEGER NOT NULL DEFAULT 0,
  multivalued INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (aspect_def_id) REFERENCES aspect_defs(id) ON DELETE CASCADE,
  UNIQUE (aspect_def_id, name)
);

-- Entities table
CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Aspects table (entity + aspect_def + property values)
CREATE TABLE IF NOT EXISTS aspects (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  aspect_def_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (catalog_id) REFERENCES catalogs(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY (aspect_def_id) REFERENCES aspect_defs(id) ON DELETE CASCADE,
  UNIQUE (catalog_id, entity_id, aspect_def_id)
);

-- Property Values table (belongs to Aspect)
CREATE TABLE IF NOT EXISTS property_values (
  id TEXT PRIMARY KEY,
  aspect_id TEXT NOT NULL,
  property_name TEXT NOT NULL,
  value_json TEXT,
  FOREIGN KEY (aspect_id) REFERENCES aspects(id) ON DELETE CASCADE,
  UNIQUE (aspect_id, property_name)
);

-- Hierarchies table
CREATE TABLE IF NOT EXISTS hierarchies (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  aspect_def_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (catalog_id) REFERENCES catalogs(id) ON DELETE CASCADE,
  FOREIGN KEY (aspect_def_id) REFERENCES aspect_defs(id) ON DELETE SET NULL,
  UNIQUE (catalog_id, name)
);

-- Hierarchy Contents table (for EntityList, EntitySet)
CREATE TABLE IF NOT EXISTS hierarchy_entities (
  id TEXT PRIMARY KEY,
  hierarchy_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  position INTEGER,
  FOREIGN KEY (hierarchy_id) REFERENCES hierarchies(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- Hierarchy Directory Entries (for EntityDirectory)
CREATE TABLE IF NOT EXISTS hierarchy_directory (
  id TEXT PRIMARY KEY,
  hierarchy_id TEXT NOT NULL,
  entry_name TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  FOREIGN KEY (hierarchy_id) REFERENCES hierarchies(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  UNIQUE (hierarchy_id, entry_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_aspect_defs_catalog ON aspect_defs(catalog_id);
CREATE INDEX IF NOT EXISTS idx_property_defs_aspect ON property_defs(aspect_def_id);
CREATE INDEX IF NOT EXISTS idx_aspects_catalog ON aspects(catalog_id);
CREATE INDEX IF NOT EXISTS idx_aspects_entity ON aspects(entity_id);
CREATE INDEX IF NOT EXISTS idx_aspects_aspect_def ON aspects(aspect_def_id);
CREATE INDEX IF NOT EXISTS idx_property_values_aspect ON property_values(aspect_id);
CREATE INDEX IF NOT EXISTS idx_hierarchies_catalog ON hierarchies(catalog_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_entities_hierarchy ON hierarchy_entities(hierarchy_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_directory_hierarchy ON hierarchy_directory(hierarchy_id);
`;
