/**
 * Catalog interfaces
 */

import { Entity } from './Entity.js';
import { Hierarchy } from './Hierarchy.js';
import { CatalogSpecies } from '../types.js';

export interface CatalogDef {
  readonly id: string;
  readonly name: string;
  readonly version: string;
}

export interface Catalog {
  readonly def: CatalogDef;
  readonly species: CatalogSpecies;

  getEntity(id: string): Promise<Entity | null>;
  putEntity(entity: Entity): Promise<void>;
  deleteEntity(id: string): Promise<void>;

  getHierarchy(name: string): Promise<Hierarchy | null>;
  putHierarchy(hierarchy: Hierarchy): Promise<void>;
  deleteHierarchy(name: string): Promise<void>;

  close(): Promise<void>;
}
