/**
 * Catalog implementation stubs
 */

import { Catalog, CatalogDef, Entity, Hierarchy } from '../interfaces/index.js';
import { CatalogSpecies } from '../types.js';

export class CatalogDefImpl implements CatalogDef {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly version: string
  ) {}
}

export abstract class BaseCatalog implements Catalog {
  constructor(
    public readonly def: CatalogDef,
    public readonly species: CatalogSpecies
  ) {}

  abstract getEntity(id: string): Promise<Entity | null>;
  abstract putEntity(entity: Entity): Promise<void>;
  abstract deleteEntity(id: string): Promise<void>;

  abstract getHierarchy(name: string): Promise<Hierarchy | null>;
  abstract putHierarchy(hierarchy: Hierarchy): Promise<void>;
  abstract deleteHierarchy(name: string): Promise<void>;

  abstract close(): Promise<void>;
}
