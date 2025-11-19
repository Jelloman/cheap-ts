/**
 * Service layer for Catalog operations
 */

import { Catalog, CatalogImpl, CatalogSpecies } from "@cheap-ts/core";

/**
 * In-memory catalog storage (for development/testing)
 * In production, this would be replaced with database-backed storage
 */
class CatalogStore {
  private catalogs = new Map<string, Catalog>();

  create(_species: CatalogSpecies = CatalogSpecies.SINK): Catalog {
    const catalog = new CatalogImpl();
    this.catalogs.set(catalog.globalId(), catalog);
    return catalog;
  }

  get(id: string): Catalog | null {
    return this.catalogs.get(id) ?? null;
  }

  list(): Catalog[] {
    return Array.from(this.catalogs.values());
  }

  delete(id: string): boolean {
    return this.catalogs.delete(id);
  }
}

export const catalogStore = new CatalogStore();
