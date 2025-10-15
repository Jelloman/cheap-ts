/**
 * @cheapjs/db-postgres - PostgreSQL database implementation for CHEAP model
 */

import type { Catalog, CatalogDef, Entity, Hierarchy } from '@cheapjs/core';
import { BaseCatalog, CatalogSpecies } from '@cheapjs/core';

export class PostgresCatalog extends BaseCatalog implements Catalog {
  constructor(def: CatalogDef) {
    super(def, CatalogSpecies.DATABASE);
  }

  async getEntity(_id: string): Promise<Entity | null> {
    throw new Error('Not implemented');
  }

  async putEntity(_entity: Entity): Promise<void> {
    throw new Error('Not implemented');
  }

  async deleteEntity(_id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async getHierarchy(_name: string): Promise<Hierarchy | null> {
    throw new Error('Not implemented');
  }

  async putHierarchy(_hierarchy: Hierarchy): Promise<void> {
    throw new Error('Not implemented');
  }

  async deleteHierarchy(_name: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async close(): Promise<void> {
    throw new Error('Not implemented');
  }
}
