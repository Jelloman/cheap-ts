/**
 * MariaDB database schema for CHEAP model
 */

export const SCHEMA_SQL = `
-- Catalogs table
CREATE TABLE IF NOT EXISTS catalogs (
  id VARCHAR(36) PRIMARY KEY,
  species VARCHAR(50) NOT NULL,
  uri TEXT,
  upstream VARCHAR(36),
  version INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Aspect definitions table
CREATE TABLE IF NOT EXISTS aspect_defs (
  id VARCHAR(36) PRIMARY KEY,
  catalog_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  readable BOOLEAN NOT NULL DEFAULT TRUE,
  writable BOOLEAN NOT NULL DEFAULT TRUE,
  can_add_properties BOOLEAN NOT NULL DEFAULT FALSE,
  can_remove_properties BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_catalog_name (catalog_id, name),
  FOREIGN KEY (catalog_id) REFERENCES catalogs(id) ON DELETE CASCADE,
  INDEX idx_catalog (catalog_id),
  INDEX idx_name (catalog_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property definitions table
CREATE TABLE IF NOT EXISTS property_defs (
  id VARCHAR(36) PRIMARY KEY,
  aspect_def_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type_code VARCHAR(50) NOT NULL,
  default_value TEXT,
  has_default_value BOOLEAN NOT NULL DEFAULT FALSE,
  readable BOOLEAN NOT NULL DEFAULT TRUE,
  writable BOOLEAN NOT NULL DEFAULT TRUE,
  nullable BOOLEAN NOT NULL DEFAULT TRUE,
  removable BOOLEAN NOT NULL DEFAULT TRUE,
  multivalued BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_aspect_property (aspect_def_id, name),
  FOREIGN KEY (aspect_def_id) REFERENCES aspect_defs(id) ON DELETE CASCADE,
  INDEX idx_aspect_def (aspect_def_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Entities table
CREATE TABLE IF NOT EXISTS entities (
  id VARCHAR(36) PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Aspects table
CREATE TABLE IF NOT EXISTS aspects (
  id VARCHAR(36) PRIMARY KEY,
  catalog_id VARCHAR(36) NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  aspect_def_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_catalog_entity_aspect (catalog_id, entity_id, aspect_def_id),
  FOREIGN KEY (catalog_id) REFERENCES catalogs(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY (aspect_def_id) REFERENCES aspect_defs(id) ON DELETE CASCADE,
  INDEX idx_catalog (catalog_id),
  INDEX idx_entity (entity_id),
  INDEX idx_aspect_def (aspect_def_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property values table
CREATE TABLE IF NOT EXISTS property_values (
  id VARCHAR(36) PRIMARY KEY,
  aspect_id VARCHAR(36) NOT NULL,
  property_name VARCHAR(255) NOT NULL,
  value_json TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_aspect_property (aspect_id, property_name),
  FOREIGN KEY (aspect_id) REFERENCES aspects(id) ON DELETE CASCADE,
  INDEX idx_aspect (aspect_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hierarchies table
CREATE TABLE IF NOT EXISTS hierarchies (
  id VARCHAR(36) PRIMARY KEY,
  catalog_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  aspect_def_id VARCHAR(36),
  version INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_catalog_name (catalog_id, name),
  FOREIGN KEY (catalog_id) REFERENCES catalogs(id) ON DELETE CASCADE,
  FOREIGN KEY (aspect_def_id) REFERENCES aspect_defs(id) ON DELETE CASCADE,
  INDEX idx_catalog (catalog_id),
  INDEX idx_name (catalog_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hierarchy entities table (for EntityList and EntitySet)
CREATE TABLE IF NOT EXISTS hierarchy_entities (
  id VARCHAR(36) PRIMARY KEY,
  hierarchy_id VARCHAR(36) NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  position INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hierarchy_id) REFERENCES hierarchies(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  INDEX idx_hierarchy (hierarchy_id),
  INDEX idx_entity (entity_id),
  INDEX idx_position (hierarchy_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hierarchy directory table (for EntityDirectory)
CREATE TABLE IF NOT EXISTS hierarchy_directory (
  id VARCHAR(36) PRIMARY KEY,
  hierarchy_id VARCHAR(36) NOT NULL,
  entry_name VARCHAR(255) NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_hierarchy_entry (hierarchy_id, entry_name),
  FOREIGN KEY (hierarchy_id) REFERENCES hierarchies(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  INDEX idx_hierarchy (hierarchy_id),
  INDEX idx_entity (entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
