/**
 * Core type definitions and enums for the CHEAP model
 */

export enum PropertyType {
  STRING = 'STRING',
  INTEGER = 'INTEGER',
  LONG = 'LONG',
  DOUBLE = 'DOUBLE',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  BINARY = 'BINARY',
  UUID = 'UUID',
  URI = 'URI',
  BIGINT = 'BIGINT',
  BIGDECIMAL = 'BIGDECIMAL',
}

export enum HierarchyType {
  LIST = 'LIST',
  SET = 'SET',
  DIRECTORY = 'DIRECTORY',
  TREE = 'TREE',
  ASPECT_MAP = 'ASPECT_MAP',
}

export enum CatalogSpecies {
  MEMORY = 'MEMORY',
  FILE = 'FILE',
  DATABASE = 'DATABASE',
}

export enum LocalEntityType {
  ONE_CATALOG = 'ONE_CATALOG',
  MULTI_CATALOG = 'MULTI_CATALOG',
}
